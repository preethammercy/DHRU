// DHRU.AI - Autonomous Auto-Trade Execution Engine (master spec v2 + Section 11)
// Executes armed DHRU plans strictly from fresh live ticks:
//  1. waits for price to enter the published entry zone (no chasing),
//  2. opens 3-10 legs split across scalp / swing / runner tiers,
//  3. books each leg at its own tier target,
//  4. moves remaining legs to break-even after TP1,
//  5. locks runners at TP1 after TP2, then trails them by 1.0 ATR,
//  6. honours the invalidation stop on every tick,
//  7. flattens the basket on a basket-loss stop, structure break, stale feed
//     or the 15:15 IST MIS square-off,
//  8. applies a momentum-aware time stop per tier,
//  9. pauses Indian execution while NSE/BSE is closed.
// No price is ever invented: every fill and exit uses the current live tick.

import { useEffect, useRef } from 'react';
import {
  isIndianMarketOpenNow,
  isIndianSymbol,
  useMarketStream
} from '../../context/MarketStreamContext';
import { useTrading } from '../../context/TradingContext';
import {
  AutoTradeLeg,
  AutoTradePlan,
  AutoTradeTier,
  TIER_WINDOWS_MS,
  calculateDailyPnlAdjustedStop,
  isDailyLossCircuitBreakerHit,
  isDailyLossLimitHit,
  publishAutoTradeUpdate,
  readAutoTradeEventBlackout,
  readAutoTradePlans,
  recordAutoTradeRealized,
  saveAutoTradePlans,
  tierTargetValue
} from '../../services/autoTradePlans';
import { dispatchTradeNotification } from './TradeNotificationToast';

const ENTRY_RETRY_MS = 20_000;
const TRAIL_PERSIST_MS = 5_000;
/** Two intraday execution candles (~2.5 min each) without a fresh tick. */
const STALE_FEED_MS = 5 * 60_000;
/** Small buffer above/below entry so break-even covers round-trip friction. */
const BREAK_EVEN_BUFFER = 0.0005;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function normalizedLegs(plan: AutoTradePlan): AutoTradeLeg[] {
  if (plan.legs?.length) return plan.legs;
  return [{
    id: `legacy-${plan.createdAt}`,
    quantity: plan.quantity,
    status: plan.stage,
    tier: 'runner',
    entryFill: plan.entryFill,
    targetPrice: plan.target,
    openedAt: plan.enteredAt
  }];
}

function isFresh(price: number): boolean {
  return Number.isFinite(price) && price > 0;
}

function legTarget(plan: AutoTradePlan, leg: AutoTradeLeg): number {
  const value = Number(leg.targetPrice);
  return value > 0 ? value : plan.target;
}

function legStop(plan: AutoTradePlan, leg: AutoTradeLeg): number {
  const value = Number(leg.stopPrice);
  return value > 0 ? value : plan.stopLoss;
}

/**
 * True only when the current price is inside the planned entry zone.
 * BUY setups trigger on a pullback into the zone (never below it), and SELL
 * setups trigger on a rally into the zone (never above it).
 */
function entryReached(plan: AutoTradePlan, price: number): boolean {
  const low = Math.min(plan.entryMin, plan.entryMax);
  const high = Math.max(plan.entryMin, plan.entryMax);
  if (plan.side === 'BUY') return price >= low && price <= high && price > plan.stopLoss;
  return price >= low && price <= high && price < plan.stopLoss;
}

function stopHit(plan: AutoTradePlan, stop: number, price: number): boolean {
  return plan.side === 'BUY' ? price <= stop : price >= stop;
}

function targetHit(plan: AutoTradePlan, leg: AutoTradeLeg, price: number): boolean {
  const target = legTarget(plan, leg);
  return plan.side === 'BUY' ? price >= target : price <= target;
}

function currencyFor(symbol: string, plan?: AutoTradePlan): string {
  if (plan?.market === 'crypto') return '$';
  return symbol.endsWith('-USD') ? '$' : '₹';
}

function priceDigits(value: number): number {
  return value >= 100 ? 2 : value >= 1 ? 4 : value >= 0.01 ? 6 : 8;
}

function formatPrice(value: number, symbol: string, plan?: AutoTradePlan): string {
  if (!Number.isFinite(value)) return '—';
  const decimals = priceDigits(value);
  return `${currencyFor(symbol, plan)}${value.toLocaleString(symbol.endsWith('-USD') ? 'en-US' : 'en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
}

function money(value: number, symbol: string, plan?: AutoTradePlan): string {
  const sign = value >= 0 ? '+' : '−';
  return `${sign}${currencyFor(symbol, plan)}${Math.abs(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function legAtr(plan: AutoTradePlan): number {
  const stored = Number(plan.atr);
  if (Number.isFinite(stored) && stored > 0) return stored;
  const risk = Math.abs(plan.entryMin - plan.stopLoss);
  if (risk > 0) return risk / 1.15;
  return Math.max(plan.entryMin * 0.005, 1e-8);
}

function istMinutes(now: number): number {
  const date = new Date(now + IST_OFFSET_MS);
  return date.getUTCHours() * 60 + date.getUTCMinutes();
}

function tierOf(leg: AutoTradeLeg): AutoTradeTier {
  return leg.tier || 'runner';
}

/** Executes fully automatic DHRU AI trade plans against live market ticks. */
export function AutoTradeMonitor() {
  const { ticks, subscribeSymbol } = useMarketStream();
  const { placeOrder, brokerConfig } = useTrading();
  const runningRef = useRef(false);
  const lastPersistRef = useRef(0);

  // Keep every planned symbol streaming while the plan is alive.
  useEffect(() => {
    const subscribePlans = () => {
      readAutoTradePlans().forEach(plan => subscribeSymbol(plan.symbol));
    };
    subscribePlans();
    window.addEventListener('dhru-auto-trade-plan', subscribePlans);
    return () => window.removeEventListener('dhru-auto-trade-plan', subscribePlans);
  }, [subscribeSymbol]);

  useEffect(() => {
    if (runningRef.current) return;
    const plans = readAutoTradePlans();
    if (!plans.length) return;

    const liveBroker = brokerConfig.broker === 'simulation' && brokerConfig.mode === 'simulation';
    if (!liveBroker) {
      publishAutoTradeUpdate({
        symbol: plans[0].symbol,
        stage: 'armed',
        message: 'DHRU Auto-Trade requires Simulation mode to execute paper orders.'
      });
      return;
    }

    runningRef.current = true;
    const now = Date.now();
    const indianOpen = isIndianMarketOpenNow();
    const istMin = istMinutes(now);
    const entryCutoffReached = istMin >= 14 * 60 + 45;
    const squareOffReached = istMin >= 15 * 60 + 15;
    const blackout = readAutoTradeEventBlackout();
    let active: AutoTradePlan[] = [];
    let changed = false;
    let trailUpdated = false;

    try {
      for (const original of plans) {
        let plan: AutoTradePlan = original;
        const symbol = plan.symbol;
        const istIndian = plan.market ? plan.market === 'indian' : isIndianSymbol(symbol);
        const marketKey: 'indian' | 'crypto' = istIndian ? 'indian' : 'crypto';
        const marketOpen = !istIndian || indianOpen;
        const windows = TIER_WINDOWS_MS[marketKey];
        const tick = ticks[symbol];
        const price = tick ? Number(tick.price) : NaN;
        const tickAge = tick?.timestamp ? now - Number(tick.timestamp) : Number.POSITIVE_INFINITY;
        const feedStale = marketOpen && Number.isFinite(price) && tickAge > STALE_FEED_MS;
        const havePrice = isFresh(price) && marketOpen;
        const atr = legAtr(plan);
        const currency = currencyFor(symbol, plan);

        // 1. Expire stale armed plans that never reached their entry zone.
        let legs = normalizedLegs(plan);
        const stillArmed = legs.some(leg => leg.status === 'armed');
        if (stillArmed && plan.stage === 'armed' && plan.expiresAt && now > plan.expiresAt) {
          const openLegs = legs.filter(leg => leg.status === 'open');
          if (!openLegs.length) {
            publishAutoTradeUpdate({
              symbol,
              stage: 'done',
              message: `⌛ ${symbol} auto-trade expired before the live price reached the ${formatZone(plan)} entry zone.`
            });
            changed = true;
            continue;
          }
          plan = { ...plan, stage: 'open', expiresAt: undefined };
        }

        // 2. Armed legs: only enter from a fresh live tick inside the entry zone.
        if (havePrice && plan.stage === 'armed' && legs.some(leg => leg.status === 'armed')) {
          const blockedReason = !marketOpen
            ? null
            : blackout
              ? `Scheduled event guard active (${blackout.label}); new entries are paused.`
              : isDailyLossLimitHit(marketKey, Number(plan.riskBudget) || 0)
                ? 'Daily loss limit reached (2x basket risk); new baskets are halted until the next session.'
                : istIndian && entryCutoffReached
                  ? 'Indian entry cutoff reached (14:45 IST); no new MIS entries today.'
                  : null;

          if (blockedReason) {
            if (!plan.lastErrorAt || now - plan.lastErrorAt > ENTRY_RETRY_MS) {
              plan = { ...plan, lastErrorAt: now };
              changed = true;
              publishAutoTradeUpdate({ symbol, stage: 'armed', message: `⛔ ${blockedReason}` });
            }
          } else {
            let opened = 0;
            const nextLegs = legs.map(leg => {
              if (leg.status !== 'armed') return leg;
              if (plan.lastErrorAt && now - plan.lastErrorAt < ENTRY_RETRY_MS) return leg;
              if (!entryReached(plan, price)) return leg;

              const result = placeOrder({
                symbol,
                name: `${plan.name || symbol} (DHRU Auto ${tierOf(leg)} leg)`,
                side: plan.side,
                product: 'MIS',
                orderType: 'MARKET',
                quantity: leg.quantity,
                price,
                legId: leg.id,
                tier: tierOf(leg),
                tierLabel: tierOf(leg),
                targetPrice: leg.targetPrice,
                stopLoss: leg.stopPrice || plan.stopLoss
              });

              if (!result.success) {
                plan = { ...plan, lastErrorAt: now };
                publishAutoTradeUpdate({ symbol, stage: 'armed', message: `Auto-entry paused: ${result.message}` });
                return leg;
              }

              opened += 1;
              changed = true;
              return {
                ...leg,
                status: 'open' as const,
                entryFill: price,
                openedAt: now,
                holdUntil: now + windows[tierOf(leg)],
                stopPrice: plan.stopLoss,
                peakPrice: price,
                peakAt: now
              };
            });

            if (opened > 0) {
              const enteredQty = nextLegs.filter(leg => leg.status === 'open').reduce((sum, leg) => sum + leg.quantity, 0);
              plan = {
                ...plan,
                legs: nextLegs,
                stage: 'open',
                enteredAt: now,
                entryFill: price,
                initialStopLoss: plan.initialStopLoss ?? plan.stopLoss,
                quantity: plan.quantity,
                lastErrorAt: undefined
              };
              publishAutoTradeUpdate({
                symbol,
                stage: 'open',
                message: `⚡ DHRU Auto-Trade filled ${opened} of ${nextLegs.length} leg(s) on ${plan.side} ${symbol} at ${currency}${price.toFixed(priceDigits(price))} (${enteredQty} units). Stop ${formatPrice(plan.stopLoss, symbol, plan)} is live.`
              });
            }
            legs = nextLegs;
          }
        }

        // 3. Open legs: protective stops, progressive management, exits.
        legs = normalizedLegs(plan);
        if (havePrice && legs.some(leg => leg.status === 'open')) {
          const openLegs = legs.filter(leg => leg.status === 'open');
          const entryLegs = openLegs.filter(leg => Number(leg.entryFill) > 0);

          // Section 11 layer 2: basket loss stop on real unrealized P&L.
          const basketPnl = havePrice
            ? entryLegs.reduce((sum, leg) => {
                const entry = Number(leg.entryFill);
                return sum + (plan.side === 'BUY' ? price - entry : entry - price) * leg.quantity;
              }, 0)
            : 0;
          const basketLossHit = havePrice && Number(plan.riskBudget) > 0 && basketPnl <= -Number(plan.riskBudget);

          // Dynamic Daily P&L Circuit Breaker: exit immediately if today's cumulative losses threaten capital
          const marketKey = (plan.market || (plan.symbol.endsWith('-USD') ? 'crypto' : 'indian')) as 'indian' | 'crypto';
          const dailyLossCheck = isDailyLossCircuitBreakerHit(marketKey, plan.riskBudget || 250, basketPnl);
          const dailyLossBreakerHit = dailyLossCheck.hit;

          const killSwitch = Boolean(plan.closeRequested);
          const sessionSquareOff = istIndian && squareOffReached;
          const staleFlatten = feedStale;
          const forceClose = killSwitch || basketLossHit || dailyLossBreakerHit || sessionSquareOff || staleFlatten;
          const forceReason = killSwitch
            ? 'Kill switch / manual exit'
            : dailyLossBreakerHit
              ? `Daily loss circuit breaker hit (${money(dailyLossCheck.totalLoss, symbol, plan)})`
              : basketLossHit
                ? 'Basket loss stop'
                : sessionSquareOff
                  ? '15:15 IST session square-off'
                  : 'Stale data feed';

          if (dailyLossBreakerHit && !plan.closeRequested) {
            dispatchTradeNotification({
              type: 'LOSS',
              title: '🛑 Daily Loss Circuit Breaker Triggered',
              symbol,
              status: 'FLATTENED',
              pnl: dailyLossCheck.totalLoss,
              reason: `Daily loss (${money(dailyLossCheck.totalLoss, symbol, plan)}) reached safety limit. Exiting all trades to protect capital.`
            });
          }

          // Section 11.A: scalp targets decide TP1, swing targets decide TP2.
          const scalpTargetThisTick = havePrice && openLegs.some(leg => tierOf(leg) === 'scalp' && targetHit(plan, leg, price));
          const swingTargetThisTick = havePrice && openLegs.some(leg => tierOf(leg) === 'swing' && targetHit(plan, leg, price));
          const tp1Active = Boolean(plan.tp1Filled) || scalpTargetThisTick;
          const tp2Active = Boolean(plan.tp2Filled) || tp1Active && swingTargetThisTick;
          const tp1Target = tierTargetValue(plan, 'scalp');
          const tp2Target = tierTargetValue(plan, 'swing');

          let exited = 0;
          let scalpBanked = false;
          let swingBanked = false;
          let runnerBanked = false;
          let stopTriggered = false;
          let structureTriggered = false;

          const nextLegs = legs.map(leg => {
            if (leg.status !== 'open') return leg;
            let working: AutoTradeLeg = { ...leg };
            let stopMoved = false;
            const entry = Number(working.entryFill) || price;
            const tier = tierOf(working);

            // Dynamic P&L-Adjusted Stop Loss: tightens stop loss if today is in drawdown to avoid high losses
            if (havePrice && !forceClose) {
              const pnlAdjustedStop = calculateDailyPnlAdjustedStop(plan, working, price, marketKey);
              if (pnlAdjustedStop !== legStop(plan, working)) {
                working = { ...working, stopPrice: pnlAdjustedStop };
                stopMoved = true;
              }
            }

            // Section 11 layer 4/5: after TP2, lock runners at TP1 and trail 1.0 ATR.
            if (havePrice && tp2Active && tier === 'runner' && !forceClose) {
              if (tp1Target && tp1Target > 0) {
                const locked = plan.side === 'BUY'
                  ? Math.max(legStop(plan, working), tp1Target)
                  : Math.min(legStop(plan, working), tp1Target);
                if (locked !== legStop(plan, working)) {
                  working = { ...working, stopPrice: locked };
                  stopMoved = true;
                }
              }
              const peak = plan.side === 'BUY'
                ? Math.max(Number(working.peakPrice) || entry, price)
                : Math.min(Number(working.peakPrice) || entry, price);
              if (peak !== working.peakPrice) {
                working = { ...working, peakPrice: peak, peakAt: now };
                trailUpdated = true;
              }
              const trail = plan.side === 'BUY' ? peak - atr : peak + atr;
              const currentStop = legStop(plan, working);
              const trailed = plan.side === 'BUY' ? Math.max(currentStop, trail) : Math.min(currentStop, trail);
              if (trailed !== currentStop) {
                working = { ...working, stopPrice: trailed };
                stopMoved = true;
                trailUpdated = true;
              }
            }

            if (forceClose) {
              // handled by the common close path below
            }

            if (forceClose) {
              // handled by the common close path below
            }

            const timeUp = Boolean(working.holdUntil) && now >= Number(working.holdUntil) && marketOpen;
            const hitStop = havePrice && stopHit(plan, legStop(plan, working), price);
            const hitTarget = havePrice && targetHit(plan, working, price);
            const structureBreak = havePrice && !tp1Active && structureBreakHit(plan, price);

            let reason: string | null = null;
            if (forceClose) reason = forceReason;
            else if (hitStop) reason = 'Stop-loss honoured';
            else if (structureBreak) reason = 'Structure stop';
            else if (hitTarget) reason = 'Target reached';
            else if (timeUp) {
              // Section 11 layer 6: extend once while momentum is still strong.
              const peak = plan.side === 'BUY'
                ? Math.max(Number(working.peakPrice) || entry, price)
                : Math.min(Number(working.peakPrice) || entry, price);
              const favorNow = plan.side === 'BUY' ? price - entry : entry - price;
              const peakFavor = plan.side === 'BUY' ? peak - entry : entry - peak;
              const stillTrending = peakFavor >= atr * 0.75 && peakFavor - favorNow <= atr * 0.35;
              if (stillTrending && !working.extended) {
                working = {
                  ...working,
                  holdUntil: Number(working.holdUntil) + windows[tier],
                  extended: true
                };
                changed = true;
              } else {
                reason = 'Tier holding window complete';
              }
            }

            if (!reason) {
              if (stopMoved) changed = true;
              return working;
            }

            const result = placeOrder({
              symbol,
              name: `${plan.name || symbol} (DHRU Auto Exit)`,
              side: plan.side === 'BUY' ? 'SELL' : 'BUY',
              product: 'MIS',
              orderType: 'MARKET',
              quantity: working.quantity,
              price
            });
            if (!result.success) {
              if (stopMoved) changed = true;
              return working;
            }

            exited += 1;
            changed = true;
            const gross = (plan.side === 'BUY' ? price - entry : entry - price) * working.quantity;
            const finalReason = hitTarget && reason === 'Target reached'
              ? `${tier} target reached`
              : reason;
            if (hitTarget && reason === 'Target reached') {
              if (tier === 'scalp') scalpBanked = true;
              else if (tier === 'swing') swingBanked = true;
              else runnerBanked = true;
            }
            if (hitStop) stopTriggered = true;
            if (structureBreak) structureTriggered = true;

            const icon = forceClose
              ? killSwitch ? '⏹️' : basketLossHit ? '🛑' : sessionSquareOff ? '🌇' : '📡'
              : hitStop ? '🛑' : hitTarget ? '🎯' : structureBreak ? '🧱' : '⏱️';
            const label = forceClose
              ? forceReason
              : hitStop
                ? 'Stop-loss honoured'
                : hitTarget
                  ? `${tier} target reached`
                  : structureBreak
                    ? 'Structure stop (order block invalidated)'
                    : 'Tier holding window complete';
            publishAutoTradeUpdate({
              symbol,
              stage: 'open',
              message: `${icon} ${label}: ${symbol} leg ${working.id.split('-').pop()} exited at ${formatPrice(price, symbol, plan)} (${money(gross, symbol, plan)}).`
            });

            return { ...working, status: 'done' as const, exitFill: price, exitReason: finalReason };
          });

          // Section 11 layer 5: a stop breach before TP1 invalidates the basket.
          const invalidateBasket = (stopTriggered || structureTriggered) && !tp1Active && !forceClose;
          let finalLegs = nextLegs;
          if (invalidateBasket) {
            finalLegs = nextLegs.map(leg => {
              if (leg.status !== 'open') return leg;
              const result = placeOrder({
                symbol,
                name: `${plan.name || symbol} (DHRU Auto Invalidation)`,
                side: plan.side === 'BUY' ? 'SELL' : 'BUY',
                product: 'MIS',
                orderType: 'MARKET',
                quantity: leg.quantity,
                price
              });
              if (!result.success) return leg;
              exited += 1;
              changed = true;
              const entry = Number(leg.entryFill) || price;
              const gross = (plan.side === 'BUY' ? price - entry : entry - price) * leg.quantity;
              publishAutoTradeUpdate({
                symbol,
                stage: 'open',
                message: `🛑 Invalidation: ${symbol} leg ${leg.id.split('-').pop()} flattened at ${formatPrice(price, symbol, plan)} (${money(gross, symbol, plan)}).`
              });
              return { ...leg, status: 'done' as const, exitFill: price, exitReason: 'Basket invalidated pre-TP1' };
            });
          }

          if (exited > 0) {
            plan = {
              ...plan,
              legs: finalLegs,
              closeRequested: forceClose && finalLegs.some(leg => leg.status === 'open') ? true : undefined
            };
          } else if (changed || trailUpdated) {
            plan = { ...plan, legs: finalLegs };
          }

          // Section 11 layer 3: break-even after TP1.
          if (scalpBanked || (plan.tp1Filled && finalLegs.some(leg => leg.status === 'open'))) {
            const wasFilled = Boolean(plan.tp1Filled);
            const protectedLegs = normalizedLegs(plan).map(leg => {
              if (leg.status !== 'open') return leg;
              const entry = Number(leg.entryFill);
              if (!Number.isFinite(entry) || entry <= 0) return leg;
              const buffer = entry * BREAK_EVEN_BUFFER;
              const targetStop = plan.side === 'BUY' ? entry + buffer : entry - buffer;
              const currentStop = legStop(plan, leg);
              const newStop = plan.side === 'BUY' ? Math.max(currentStop, targetStop) : Math.min(currentStop, targetStop);
              return newStop !== currentStop ? { ...leg, stopPrice: newStop } : leg;
            });
            plan = { ...plan, legs: protectedLegs, tp1Filled: true };
            changed = true;
            if (!wasFilled) {
              publishAutoTradeUpdate({
                symbol,
                stage: 'open',
                message: '⚡ Quick Profit Locked! Scalp legs exited. Mid & Runner legs still running. SL moved to break-even.'
              });
              publishAutoTradeUpdate({
                symbol,
                stage: 'open',
                message: `🔒 Basket now risk-free. Remaining legs protected at entry (${formatPrice(plan.entryFill || price, symbol, plan)}).`
              });
            }
          }

          // Section 11 layer 4: profit lock on runners after TP2.
          if (swingBanked) {
            const wasLocked = Boolean(plan.tp2Filled);
            const lockedLegs = normalizedLegs(plan).map(leg => {
              if (leg.status !== 'open' || tierOf(leg) !== 'runner') return leg;
              if (!tp1Target) return leg;
              const currentStop = legStop(plan, leg);
              const newStop = plan.side === 'BUY' ? Math.max(currentStop, tp1Target) : Math.min(currentStop, tp1Target);
              return newStop !== currentStop ? { ...leg, stopPrice: newStop } : leg;
            });
            plan = { ...plan, legs: lockedLegs, tp2Filled: true };
            changed = true;
            if (!wasLocked) {
              publishAutoTradeUpdate({
                symbol,
                stage: 'open',
                message: '🚀 More Profit Locked! Mid legs exited. Runner trailing with locked profit.'
              });
            }
          }

          if (runnerBanked) {
            // Target exits already publish a per-leg message; add the summary.
            publishAutoTradeUpdate({
              symbol,
              stage: 'open',
              message: '🔥 Big Profit Captured! Runner legs exited at max target or trailing stop.'
            });
          }

          if (forceClose && normalizedLegs(plan).some(leg => leg.status === 'open')) {
            // Some legs could not fill (e.g. order rejected); keep the close request alive.
            plan = { ...plan, closeRequested: true };
          }
        }

        // 4. Retire plans whose legs are all finished.
        const finalLegs = normalizedLegs(plan);
        const anyRemaining = finalLegs.some(leg => leg.status !== 'done');
        if (!anyRemaining) {
          const closedPnl = finalLegs.reduce((sum, leg) => {
            const entry = Number(leg.entryFill);
            const exit = Number(leg.exitFill ?? price);
            if (!Number.isFinite(entry) || !Number.isFinite(exit)) return sum;
            return sum + (plan.side === 'BUY' ? exit - entry : entry - exit) * leg.quantity;
          }, 0);
          const marketKeyForPnl: 'indian' | 'crypto' = plan.market ? plan.market : isIndianSymbol(symbol) ? 'indian' : 'crypto';
          recordAutoTradeRealized(marketKeyForPnl, closedPnl);
          publishAutoTradeUpdate({
            symbol,
            stage: 'done',
            message: `✅ ${symbol} auto-trade complete · ${finalLegs.length} leg(s) closed · net ${money(closedPnl, symbol, plan)}.`
          });
          if (isDailyLossLimitHit(marketKeyForPnl, Number(plan.riskBudget) || 0)) {
            publishAutoTradeUpdate({
              symbol,
              stage: 'done',
              message: '⛔ Daily loss limit reached (2x basket risk). New baskets are halted until the next session.'
            });
          }
          changed = true;
          continue;
        }

        active.push(plan);
      }

      const shouldPersist = changed || (trailUpdated && now - lastPersistRef.current > TRAIL_PERSIST_MS);
      if (shouldPersist) {
        saveAutoTradePlans(active);
        lastPersistRef.current = now;
      }
    } finally {
      runningRef.current = false;
    }
  }, [ticks, placeOrder, brokerConfig.broker, brokerConfig.mode, subscribeSymbol]);

  return null;
}

/**
 * Section 11 layer 7: a close beyond the structure that justified the entry
 * invalidates the trade before TP1. The level is only used when it sits between
 * the entry and the invalidation stop (a tighter, meaningful break level).
 */
function structureBreakHit(plan: AutoTradePlan, price: number): boolean {
  const level = Number(plan.structureLevel);
  if (!Number.isFinite(level) || level <= 0) return false;
  const entry = Number(plan.entryFill) || (plan.entryMin + plan.entryMax) / 2;
  if (plan.side === 'BUY') {
    if (!(level > plan.stopLoss && level < entry)) return false;
    return price < level;
  }
  if (!(level < plan.stopLoss && level > entry)) return false;
  return price > level;
}

function formatZone(plan: AutoTradePlan): string {
  const symbol = currencyFor(plan.symbol, plan);
  const decimals = priceDigits(plan.entryMin);
  return `${symbol}${Math.min(plan.entryMin, plan.entryMax).toFixed(decimals)}–${symbol}${Math.max(plan.entryMin, plan.entryMax).toFixed(decimals)}`;
}
