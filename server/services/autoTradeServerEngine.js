// DHRU.AI - Server-Side Autonomous Execution Engine (Phases 4 & 6)
// Provides authoritative order execution, candle-based management,
// realistic paper fills (with slippage & fees), 7-layer safety protections,
// multi-tab coordination, persistence across restarts, and a persistent trade journal.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const STATE_FILE = path.join(DATA_DIR, 'autotrade-state.json');
const JOURNAL_FILE = path.join(DATA_DIR, 'autotrade-journal.json');

// Allocation matrix per Section 6
const BASKET_ALLOCATION_MATRIX = {
  3: [1, 1, 1],
  4: [1, 2, 1],
  5: [2, 2, 1],
  6: [2, 2, 2],
  7: [2, 3, 2],
  8: [3, 3, 2],
  9: [3, 3, 3],
  10: [3, 4, 3]
};

// Friction configuration (bps)
export const FRICTION_CONFIG = {
  feesBps: {
    crypto: 5,  // 5 bps taker fee
    indian: 3   // ~3 bps regulatory + brokerage
  },
  slippageBps: 2 // 2 bps execution slippage
};

const STALE_FEED_MS = 5 * 60_000; // 5 minutes / 2 signal candles
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const COOLDOWN_MS = 60 * 60_000; // 1-hour cooldown per symbol

class AutoTradeServerEngine {
  constructor() {
    this.activeBaskets = new Map(); // symbol -> basket
    this.cooldowns = new Map();     // symbol -> cooldownExpiryTimestamp
    this.consecutiveStops = 0;
    this.isHalted = false;
    this.sseClients = new Set();
    this.journal = [];
    this.loadState();
    this.loadJournal();
  }

  // --- Persistence ---
  loadState() {
    try {
      if (fs.existsSync(STATE_FILE)) {
        const raw = fs.readFileSync(STATE_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.baskets)) {
          for (const b of data.baskets) {
            this.activeBaskets.set(b.symbol, b);
          }
        }
        this.consecutiveStops = data.consecutiveStops || 0;
        this.isHalted = !!data.isHalted;
      }
    } catch (err) {
      console.warn('[AutoTradeEngine] Could not load persisted state:', err.message);
    }
  }

  saveState() {
    try {
      const data = {
        baskets: Array.from(this.activeBaskets.values()),
        consecutiveStops: this.consecutiveStops,
        isHalted: this.isHalted,
        updatedAt: Date.now()
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
      console.error('[AutoTradeEngine] Failed to persist state:', err.message);
    }
  }

  loadJournal() {
    try {
      if (fs.existsSync(JOURNAL_FILE)) {
        const raw = fs.readFileSync(JOURNAL_FILE, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data)) {
          this.journal = data;
        }
      }
    } catch (err) {
      console.warn('[AutoTradeEngine] Could not load trade journal:', err.message);
    }
  }

  saveJournal() {
    try {
      fs.writeFileSync(JOURNAL_FILE, JSON.stringify(this.journal, null, 2), 'utf8');
    } catch (err) {
      console.error('[AutoTradeEngine] Failed to persist trade journal:', err.message);
    }
  }

  getDailyRealizedPnl(market = null) {
    const today = new Date().toISOString().slice(0, 10);
    return this.journal
      .filter(entry => {
        if (!entry) return false;
        let entryDate = null;
        if (typeof entry.closedAt === 'string') {
          entryDate = entry.closedAt.slice(0, 10);
        } else if (typeof entry.closedAt === 'number') {
          entryDate = new Date(entry.closedAt).toISOString().slice(0, 10);
        } else if (typeof entry.timestamp === 'number') {
          entryDate = new Date(entry.timestamp).toISOString().slice(0, 10);
        }
        const matchesDate = entryDate === today;
        const matchesMarket = !market || entry.market === market;
        return matchesDate && matchesMarket;
      })
      .reduce((sum, entry) => sum + (Number(entry.netPnl) || 0), 0);
  }

  // --- SSE Broadcasting ---
  registerSSEClient(res) {
    this.sseClients.add(res);
    res.on('close', () => this.sseClients.delete(res));
  }

  broadcast(eventType, data) {
    const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of this.sseClients) {
      try {
        client.write(payload);
      } catch {
        this.sseClients.delete(client);
      }
    }
  }

  // --- Sizing and Leg Allocation ---
  tierCounts(legCount) {
    const exact = BASKET_ALLOCATION_MATRIX[legCount];
    if (exact) return { scalp: exact[0], swing: exact[1], runner: exact[2] };
    if (legCount <= 1) return { scalp: 1, swing: 0, runner: 0 };
    if (legCount === 2) return { scalp: 1, swing: 0, runner: 1 };
    return { scalp: 1, swing: 1, runner: 1 };
  }

  splitLegs({ symbol, side, quantity, legCount, isCrypto, entryMin, entryMax, stopLoss, tp1, tp2, tp3, atr }) {
    const counts = this.tierCounts(legCount);
    const legs = [];
    let remaining = quantity;
    const tiers = [
      { tier: 'scalp', count: counts.scalp, target: tp1, candles: 3 },
      { tier: 'swing', count: counts.swing, target: tp2, candles: 8 },
      { tier: 'runner', count: counts.runner, target: tp3, candles: 16 }
    ];

    const totalLegs = counts.scalp + counts.swing + counts.runner;
    const baseQtyPerLeg = isCrypto ? Number((quantity / totalLegs).toFixed(6)) : Math.floor(quantity / totalLegs);

    let legIndex = 1;
    for (const t of tiers) {
      for (let i = 0; i < t.count; i++) {
        const isLast = (legIndex === totalLegs);
        let legQty = isLast ? (isCrypto ? Number(remaining.toFixed(6)) : remaining) : baseQtyPerLeg;
        if (legQty <= 0) legQty = isCrypto ? 0.0001 : 1;
        remaining -= legQty;

        legs.push({
          id: `leg-${symbol}-${legIndex}-${Date.now()}`,
          index: legIndex,
          tier: t.tier,
          status: 'armed',
          quantity: legQty,
          targetPrice: t.target,
          stopPrice: stopLoss,
          initialStop: stopLoss,
          plannedEntry: (entryMin + entryMax) / 2,
          entryFill: null,
          exitFill: null,
          peakPrice: null,
          openedAt: null,
          closedAt: null,
          exitReason: null,
          pnl: 0,
          fees: 0
        });
        legIndex++;
      }
    }
    return legs;
  }

  // --- Order Arming ---
  armBasket(plan) {
    if (this.isHalted) {
      return { ok: false, reason: 'Auto-Trade is halted after 3 consecutive stopped baskets. Manual restart required.' };
    }

    const normSymbol = plan.symbol.toUpperCase();
    const cooldownUntil = this.cooldowns.get(normSymbol);
    if (cooldownUntil && Date.now() < cooldownUntil) {
      const waitMin = Math.ceil((cooldownUntil - Date.now()) / 60_000);
      return { ok: false, reason: `Symbol ${normSymbol} is in cooldown for ${waitMin} more minute(s).` };
    }

    if (this.activeBaskets.has(normSymbol)) {
      return { ok: false, reason: `Basket for ${normSymbol} already active.` };
    }

    const market = plan.market || (normSymbol.endsWith('-USD') ? 'crypto' : 'indian');
    const isCrypto = market === 'crypto';
    const legCount = Math.min(10, Math.max(3, Number(plan.legCount) || 3));

    const legs = this.splitLegs({
      symbol: normSymbol,
      side: plan.side,
      quantity: plan.quantity,
      legCount,
      isCrypto,
      entryMin: plan.entryMin,
      entryMax: plan.entryMax,
      stopLoss: plan.stopLoss,
      tp1: plan.tp1,
      tp2: plan.tp2,
      tp3: plan.tp3,
      atr: plan.atr
    });

    const basket = {
      id: `basket-${normSymbol}-${Date.now()}`,
      symbol: normSymbol,
      market,
      side: plan.side,
      stage: 'armed',
      entryMin: plan.entryMin,
      entryMax: plan.entryMax,
      stopLoss: plan.stopLoss,
      initialStopLoss: plan.stopLoss,
      structureLevel: plan.structureLevel || null,
      tp1: plan.tp1,
      tp2: plan.tp2,
      tp3: plan.tp3,
      atr: plan.atr || Math.abs(plan.entryMin - plan.stopLoss) / 1.15,
      quantity: plan.quantity,
      riskBudget: plan.riskBudget || (isCrypto ? 250 : 5000),
      tp1Filled: false,
      tp2Filled: false,
      legs,
      createdAt: Date.now(),
      enteredAt: null,
      closedAt: null,
      score: plan.score || 0,
      confidence: plan.confidence || 0,
      setupType: plan.setupType || 'Trend Following',
      statusMessage: `Armed: waiting for price to enter ${plan.entryMin} - ${plan.entryMax}`
    };

    this.activeBaskets.set(normSymbol, basket);
    this.saveState();
    this.broadcast('basket_armed', basket);
    return { ok: true, basket };
  }

  // --- Real-Time Tick Processing Engine ---
  processTick(symbol, tick) {
    const normSymbol = symbol.toUpperCase();
    const basket = this.activeBaskets.get(normSymbol);
    if (!basket) return;

    const price = Number(tick.price);
    const timestamp = Number(tick.timestamp || Date.now());
    const tickAge = Date.now() - timestamp;
    if (!Number.isFinite(price) || price <= 0) return;

    const isCrypto = basket.market === 'crypto';
    const feesRate = (isCrypto ? FRICTION_CONFIG.feesBps.crypto : FRICTION_CONFIG.feesBps.indian) / 10000;
    const slippageRate = FRICTION_CONFIG.slippageBps / 10000;

    // Check Stale Feed (> 5 mins)
    const isStale = tickAge > STALE_FEED_MS;
    if (isStale && basket.stage === 'open') {
      this.flattenBasket(basket, price, 'Stale data feed (> 5m without tick)');
      return;
    }

    // Check 15:15 IST MIS Square-off for Indian Equities
    if (basket.market === 'indian' && basket.stage === 'open') {
      const istMin = this.getIstMinutes(Date.now());
      if (istMin >= 15 * 60 + 15) {
        this.flattenBasket(basket, price, '15:15 IST MIS mandatory square-off');
        return;
      }
    }

    // 1. Stage: ARMED -> Check Entry Trigger
    if (basket.stage === 'armed') {
      const inZone = (price >= Math.min(basket.entryMin, basket.entryMax) &&
                      price <= Math.max(basket.entryMin, basket.entryMax));

      // Invalidation check before entry: if stop is breached before entry, cancel basket
      const stopHitBeforeEntry = basket.side === 'BUY' ? price <= basket.stopLoss : price >= basket.stopLoss;
      if (stopHitBeforeEntry) {
        basket.stage = 'cancelled';
        basket.statusMessage = 'Cancelled: Stop level breached before entry zone reached';
        this.activeBaskets.delete(normSymbol);
        this.saveState();
        this.broadcast('basket_cancelled', basket);
        return;
      }

      if (inZone) {
        // Execute entry fill with realistic slippage
        const entryFill = basket.side === 'BUY'
          ? price * (1 + slippageRate)
          : price * (1 - slippageRate);

        basket.stage = 'open';
        basket.enteredAt = Date.now();
        basket.entryFill = Number(entryFill.toFixed(isCrypto ? 6 : 2));

        const dailyRealizedAtEntry = this.getDailyRealizedPnl(basket.market);
        const maxDailyLoss = 2 * (basket.riskBudget || (isCrypto ? 50 : 250));

        for (const leg of basket.legs) {
          leg.status = 'open';
          leg.entryFill = basket.entryFill;
          leg.peakPrice = basket.entryFill;
          leg.openedAt = Date.now();
          leg.fees += (basket.entryFill * leg.quantity) * feesRate;

          // If entered during daily drawdown, immediately tighten stop loss to protect capital
          if (dailyRealizedAtEntry < 0 && (leg.initialStop || basket.initialStopLoss)) {
            const baseStop = leg.initialStop || basket.initialStopLoss;
            const drawdownRatio = Math.min(1.0, Math.abs(dailyRealizedAtEntry) / maxDailyLoss);
            const tightenPercent = 0.50 * drawdownRatio;
            const baseDistance = Math.abs(leg.entryFill - baseStop);
            const adjustedDistance = baseDistance * (1 - tightenPercent);

            const adjustedStop = basket.side === 'BUY'
              ? leg.entryFill - adjustedDistance
              : leg.entryFill + adjustedDistance;

            const shouldTighten = basket.side === 'BUY'
              ? adjustedStop > leg.stopPrice
              : adjustedStop < leg.stopPrice;

            if (shouldTighten) {
              leg.stopPrice = Number(adjustedStop.toFixed(isCrypto ? 6 : 2));
            }
          }
        }

        basket.statusMessage = `Filled ${basket.side} @ ${basket.entryFill} with ${FRICTION_CONFIG.slippageBps} bps slippage. Management active.`;
        this.saveState();
        this.broadcast('basket_entered', basket);
      }
      return;
    }

    // 2. Stage: OPEN -> Progressive Multi-Tier Management
    if (basket.stage === 'open') {
      let openLegs = basket.legs.filter(l => l.status === 'open');
      if (openLegs.length === 0) {
        this.completeBasket(basket);
        return;
      }

      // Check Basket & Daily Loss Stops
      let currentBasketUnrealizedPnl = 0;
      for (const leg of openLegs) {
        const diff = basket.side === 'BUY' ? (price - leg.entryFill) : (leg.entryFill - price);
        currentBasketUnrealizedPnl += diff * leg.quantity;
      }

      // Daily Loss Protection Circuit Breaker (Realized Today + Unrealized)
      const dailyRealized = this.getDailyRealizedPnl(basket.market);
      const riskBudget = basket.riskBudget || (isCrypto ? 50 : 250);
      const totalDailyPnl = dailyRealized + currentBasketUnrealizedPnl;
      const maxDailyLoss = 2 * riskBudget;

      if (totalDailyPnl <= -maxDailyLoss) {
        this.flattenBasket(basket, price, `Daily loss circuit breaker triggered: Total daily loss exceeds 2x basket risk`);
        return;
      }

      // Check Basket Loss Stop (unrealized P&L <= -riskBudget)
      if (basket.riskBudget && currentBasketUnrealizedPnl <= -basket.riskBudget) {
        this.flattenBasket(basket, price, 'Basket loss stop limit hit');
        return;
      }

      // Check Pre-TP1 Structure Break Stop
      if (!basket.tp1Filled && basket.structureLevel) {
        const structureBroken = basket.side === 'BUY'
          ? price < basket.structureLevel
          : price > basket.structureLevel;
        if (structureBroken) {
          this.flattenBasket(basket, price, 'Pre-TP1 Structure level breached');
          return;
        }
      }

      // Evaluate each open leg
      for (const leg of openLegs) {
        // Dynamic Stop Loss Adjustment according to today's P&L:
        // If today is in drawdown (dailyRealized < 0), tighten stop loss (up to 50%) to prevent excessive capital loss.
        if (dailyRealized < 0 && leg.entryFill && (leg.initialStop || basket.initialStopLoss)) {
          const baseStop = leg.initialStop || basket.initialStopLoss;
          const drawdownRatio = Math.min(1.0, Math.abs(dailyRealized) / maxDailyLoss);
          const tightenPercent = 0.50 * drawdownRatio;
          const baseDistance = Math.abs(leg.entryFill - baseStop);
          const adjustedDistance = baseDistance * (1 - tightenPercent);

          const adjustedStop = basket.side === 'BUY'
            ? leg.entryFill - adjustedDistance
            : leg.entryFill + adjustedDistance;

          const shouldTighten = basket.side === 'BUY'
            ? adjustedStop > leg.stopPrice
            : adjustedStop < leg.stopPrice;

          if (shouldTighten) {
            leg.stopPrice = Number(adjustedStop.toFixed(isCrypto ? 6 : 2));
          }
        }

        // Update leg peak price for trailing
        if (basket.side === 'BUY') {
          if (!leg.peakPrice || price > leg.peakPrice) leg.peakPrice = price;
        } else {
          if (!leg.peakPrice || price < leg.peakPrice) leg.peakPrice = price;
        }

        // Layer 5: ATR Trail Ratchet for runners after TP2
        if (basket.tp2Filled && leg.tier === 'runner' && basket.atr > 0) {
          const trailStop = basket.side === 'BUY'
            ? leg.peakPrice - (1.0 * basket.atr)
            : leg.peakPrice + (1.0 * basket.atr);

          const shouldRatchet = basket.side === 'BUY'
            ? trailStop > leg.stopPrice
            : trailStop < leg.stopPrice;

          if (shouldRatchet) {
            leg.stopPrice = Number(trailStop.toFixed(isCrypto ? 6 : 2));
          }
        }

        // Check Target Hit
        const isTargetHit = basket.side === 'BUY' ? price >= leg.targetPrice : price <= leg.targetPrice;
        if (isTargetHit) {
          this.closeLeg(basket, leg, price, `Target (${leg.tier.toUpperCase()}) Hit`, slippageRate, feesRate, isCrypto);

          // Progressive milestones
          if (leg.tier === 'scalp' && !basket.tp1Filled) {
            basket.tp1Filled = true;
            // Move remaining legs to Break-Even (+ buffer for round-trip fees)
            const beBuffer = leg.entryFill * 0.0006;
            const beStop = basket.side === 'BUY' ? leg.entryFill + beBuffer : leg.entryFill - beBuffer;
            for (const remaining of basket.legs.filter(l => l.status === 'open')) {
              remaining.stopPrice = Number(beStop.toFixed(isCrypto ? 6 : 2));
            }
            basket.statusMessage = 'TP1 Banked! Remaining legs moved to Break-Even stop.';
            this.broadcast('milestone_tp1', basket);
          } else if (leg.tier === 'swing' && !basket.tp2Filled) {
            basket.tp2Filled = true;
            // Runner profit-lock: lock runner stop at TP1 target
            for (const runner of basket.legs.filter(l => l.status === 'open' && l.tier === 'runner')) {
              runner.stopPrice = basket.tp1;
            }
            basket.statusMessage = 'TP2 Banked! Runners profit-locked at TP1 target with 1.0 ATR trail.';
            this.broadcast('milestone_tp2', basket);
          }
          continue;
        }

        // Check Stop Loss Hit
        const isStopHit = basket.side === 'BUY' ? price <= leg.stopPrice : price >= leg.stopPrice;
        if (isStopHit) {
          const reason = leg.stopPrice === basket.initialStopLoss
            ? 'Initial Stop Loss Hit'
            : (leg.tier === 'runner' && basket.tp2Filled ? '1.0 ATR Runner Trail Stop Hit' : 'Break-Even Stop Hit');
          this.closeLeg(basket, leg, price, reason, slippageRate, feesRate, isCrypto);
        }
      }

      // Check if all legs are closed
      openLegs = basket.legs.filter(l => l.status === 'open');
      if (openLegs.length === 0) {
        this.completeBasket(basket);
      } else {
        this.saveState();
        this.broadcast('basket_updated', basket);
      }
    }
  }

  closeLeg(basket, leg, currentPrice, reason, slippageRate, feesRate, isCrypto) {
    const exitFill = basket.side === 'BUY'
      ? currentPrice * (1 - slippageRate)
      : currentPrice * (1 + slippageRate);

    leg.status = 'closed';
    leg.exitFill = Number(exitFill.toFixed(isCrypto ? 6 : 2));
    leg.closedAt = Date.now();
    leg.exitReason = reason;

    const exitFees = (leg.exitFill * leg.quantity) * feesRate;
    leg.fees += exitFees;

    const grossPnl = basket.side === 'BUY'
      ? (leg.exitFill - leg.entryFill) * leg.quantity
      : (leg.entryFill - leg.exitFill) * leg.quantity;

    leg.pnl = Number((grossPnl - leg.fees).toFixed(2));
  }

  flattenBasket(basket, currentPrice, reason) {
    const isCrypto = basket.market === 'crypto';
    const feesRate = (isCrypto ? FRICTION_CONFIG.feesBps.crypto : FRICTION_CONFIG.feesBps.indian) / 10000;
    const slippageRate = FRICTION_CONFIG.slippageBps / 10000;

    for (const leg of basket.legs.filter(l => l.status === 'open')) {
      this.closeLeg(basket, leg, currentPrice, reason, slippageRate, feesRate, isCrypto);
    }
    this.completeBasket(basket, reason);
  }

  completeBasket(basket, forcedReason = null) {
    basket.stage = 'completed';
    basket.closedAt = Date.now();
    basket.statusMessage = forcedReason || 'All basket legs closed';

    // Summary calculations
    let totalPnl = 0;
    let totalFees = 0;
    for (const leg of basket.legs) {
      totalPnl += (leg.pnl || 0);
      totalFees += (leg.fees || 0);
    }
    basket.netPnl = Number(totalPnl.toFixed(2));
    basket.totalFees = Number(totalFees.toFixed(2));

    const initialRisk = basket.riskBudget || 1;
    const rMultiple = Number((basket.netPnl / initialRisk).toFixed(2));
    basket.rMultiple = rMultiple;

    // Consecutive stops tracking
    if (basket.netPnl < 0 && rMultiple <= -0.8) {
      this.consecutiveStops += 1;
      if (this.consecutiveStops >= 3) {
        this.isHalted = true;
        this.broadcast('autotrade_halted', {
          reason: 'Auto mode paused after 3 consecutive stopped baskets. Manual restart required.'
        });
      }
    } else if (basket.netPnl > 0) {
      this.consecutiveStops = 0;
    }

    // Set 1-hour symbol cooldown
    this.cooldowns.set(basket.symbol, Date.now() + COOLDOWN_MS);

    // Persist to trade journal
    const journalEntry = {
      id: basket.id,
      symbol: basket.symbol,
      market: basket.market,
      side: basket.side,
      score: basket.score,
      confidence: basket.confidence,
      setupType: basket.setupType,
      entryFill: basket.entryFill,
      quantity: basket.quantity,
      netPnl: basket.netPnl,
      totalFees: basket.totalFees,
      rMultiple,
      openedAt: basket.enteredAt,
      closedAt: basket.closedAt,
      exitReason: basket.statusMessage,
      legs: basket.legs.map(l => ({
        tier: l.tier,
        quantity: l.quantity,
        entryFill: l.entryFill,
        exitFill: l.exitFill,
        pnl: l.pnl,
        exitReason: l.exitReason
      }))
    };

    this.journal.unshift(journalEntry);
    this.saveJournal();

    this.activeBaskets.delete(basket.symbol);
    this.saveState();
    this.broadcast('basket_completed', basket);
  }

  // --- Kill Switch / Manual Stop ---
  stopBasket(symbol, reason = 'STOP & EXIT ALL kill switch activated') {
    const normSymbol = symbol.toUpperCase();
    const basket = this.activeBaskets.get(normSymbol);
    if (!basket) return { ok: false, reason: `No active basket for ${normSymbol}` };

    if (basket.stage === 'armed') {
      basket.stage = 'cancelled';
      basket.statusMessage = reason;
      this.activeBaskets.delete(normSymbol);
      this.saveState();
      this.broadcast('basket_cancelled', basket);
      return { ok: true, message: `Armed basket for ${normSymbol} cancelled.` };
    }

    const lastEntry = basket.entryFill || basket.entryMin;
    this.flattenBasket(basket, lastEntry, reason);
    return { ok: true, message: `Open basket for ${normSymbol} flattened.` };
  }

  // --- Reset Halt ---
  resetHalt() {
    this.consecutiveStops = 0;
    this.isHalted = false;
    this.saveState();
    return { ok: true, message: 'Auto-Trade halt cleared. Engine resumed.' };
  }

  getIstMinutes(now) {
    const d = new Date(now + IST_OFFSET_MS);
    return d.getUTCHours() * 60 + d.getUTCMinutes();
  }

  getState() {
    return {
      baskets: Array.from(this.activeBaskets.values()),
      isHalted: this.isHalted,
      consecutiveStops: this.consecutiveStops,
      cooldowns: Array.from(this.cooldowns.entries()).map(([sym, exp]) => ({
        symbol: sym,
        active: Date.now() < exp,
        remainingSec: Math.max(0, Math.round((exp - Date.now()) / 1000))
      }))
    };
  }

  getJournalStats() {
    const totalTrades = this.journal.length;
    const wins = this.journal.filter(j => j.netPnl > 0).length;
    const winRate = totalTrades >= 30 ? Number(((wins / totalTrades) * 100).toFixed(1)) : null;
    const winRateStatus = totalTrades >= 30 ? 'Validated' : 'Unvalidated';

    const avgR = totalTrades > 0
      ? Number((this.journal.reduce((s, j) => s + (j.rMultiple || 0), 0) / totalTrades).toFixed(2))
      : 0;

    return {
      totalTrades,
      winRate,
      winRateStatus,
      avgR,
      entries: this.journal.slice(0, 50)
    };
  }
}

export const autoTradeServerEngine = new AutoTradeServerEngine();
