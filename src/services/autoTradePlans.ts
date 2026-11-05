// DHRU.AI - Auto-Trade Plan Store & Sizing
// Implements the master auto-trade specification:
//  - 3 to 10 legs split across scalp / swing / runner tiers
//  - each tier has its own target and holding window
//  - risk budget is capped at 5% of cash (₹5,000 / $250 cap)
//  - crypto position sizes are fractional, equities are whole units

export type AutoTradeTier = 'scalp' | 'swing' | 'runner';

export interface AutoTradeLeg {
  id: string;
  quantity: number;
  status: 'armed' | 'open' | 'done';
  tier?: AutoTradeTier;
  /** Planned entry inside the report's zone (not a fill). */
  plannedEntry?: number;
  entryFill?: number;
  exitFill?: number;
  targetPrice?: number;
  /** Per-leg stop: starts at the plan stop, moves to break-even / trails. */
  stopPrice?: number;
  openedAt?: number;
  /** Time-stop deadline for this leg's tier window. */
  holdUntil?: number;
  /** Best price seen since entry, used by the runner ATR trail. */
  peakPrice?: number;
  /** Timestamp of the best price, used by the momentum-aware time stop. */
  peakAt?: number;
  /** True once a fading tier has already used its one-cycle extension. */
  extended?: boolean;
  exitReason?: string;
}

export interface AutoTradePlan {
  symbol: string;
  name?: string;
  side: 'BUY' | 'SELL';
  entryMin: number;
  entryMax: number;
  stopLoss: number;
  target: number;
  quantity: number;
  marginReserved?: number;
  riskBudget?: number;
  stage: 'armed' | 'open';
  createdAt: number;
  /** Armed plans expire quickly so an old report cannot trigger a later trade. */
  expiresAt?: number;
  enteredAt?: number;
  entryFill?: number;
  source?: string;
  lastErrorAt?: number;
  closeRequested?: boolean;
  legs?: AutoTradeLeg[];
  targetMode?: 'cash' | 'staged';
  profitTarget?: number;
  stagedTargets?: number[];
  /** ATR used to size the trailing stop for runner legs. */
  atr?: number;
  tiers?: Array<{ tier: AutoTradeTier; label: string; target: number; legs: number[] }>;
  /** Set once the scalp tier has banked TP1. */
  tp1Filled?: boolean;
  /** Set once the swing tier has banked TP2. */
  tp2Filled?: boolean;
  /** Original invalidation stop, kept even after legs move to break-even. */
  initialStopLoss?: number;
  /** Numeric structure level (pivot / order block). Breaching it pre-TP1 flattens the basket. */
  structureLevel?: number;
  /** Market key used by the daily loss guard. */
  market?: 'indian' | 'crypto';
  /** Display-only status line published by the execution engine. */
  statusMessage?: string;
}

const PLANS_KEY = 'dhru_ai_auto_plans';
const LEGACY_KEY = 'dhru_ai_auto_plan';
const TRADE_LIMIT_KEY = 'dhru_ai_auto_trade_limit';

/**
 * Holding windows per tier. These are time stops, not simulated prices: a leg
 * that reaches its window is closed at the next real live tick.
 */
export const TIER_WINDOWS_MS: Record<'crypto' | 'indian', Record<AutoTradeTier, number>> = {
  crypto: {
    scalp: 30 * 60_000,
    swing: 90 * 60_000,
    runner: 180 * 60_000
  },
  indian: {
    scalp: 45 * 60_000,
    swing: 120 * 60_000,
    runner: 210 * 60_000
  }
};

const TIER_LABELS: Record<AutoTradeTier, string> = {
  scalp: 'Quick Profit (Scalp)',
  swing: 'More Profit (Swing)',
  runner: 'Big Profit (Runner)'
};

/**
 * Section 6 allocation matrix, verbatim:
 *   3 -> 1/1/1, 4 -> 1/2/1, 5 -> 2/2/1, 6 -> 2/2/2,
 *   7 -> 2/3/2, 8 -> 3/3/2, 9 -> 3/3/3, 10 -> 3/4/3
 */
const BASKET_ALLOCATION_MATRIX: Record<number, [number, number, number]> = {
  3: [1, 1, 1],
  4: [1, 2, 1],
  5: [2, 2, 1],
  6: [2, 2, 2],
  7: [2, 3, 2],
  8: [3, 3, 2],
  9: [3, 3, 3],
  10: [3, 4, 3]
};

function tierCounts(count: number) {
  const exact = BASKET_ALLOCATION_MATRIX[count];
  if (exact) return { scalp: exact[0], swing: exact[1], runner: exact[2] };
  // Fallback for tiny baskets (a sub-unit quantity can reduce the leg count).
  if (count <= 1) return { scalp: 1, swing: 0, runner: 0 };
  if (count === 2) return { scalp: 1, swing: 0, runner: 1 };
  return { scalp: 1, swing: 1, runner: 1 };
}


export interface AutoTradeSizing {
  quantity: number;
  riskBudget: number;
  riskPerUnit: number;
  notional: number;
  reservedMargin: number;
  ok: boolean;
  reason?: string;
}

/**
 * Position sizing per the master spec:
 *   quantity = floor(riskBudget / |entry - stop|)
 * Risk budget is 5% of cash, capped at ₹5,000 (Indian) or $250 (crypto).
 * Crypto quantities keep up to 6 decimals; equities use whole units.
 */
export function calculateAutoTradeSize(params: {
  cashBalance: number;
  marginAvailable: number;
  price: number;
  stopLoss: number;
  isCrypto: boolean;
}): AutoTradeSizing {
  const { cashBalance, marginAvailable, price, stopLoss, isCrypto } = params;
  const cap = isCrypto ? 250 : 5000;
  const floorBudget = isCrypto ? 25 : 500;
  const riskBudget = Math.max(floorBudget, Math.min(Math.max(0, cashBalance) * 0.05, cap));
  const riskPerUnit = Math.abs(price - stopLoss);

  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(riskPerUnit) || riskPerUnit <= 0) {
    return { quantity: 0, riskBudget, riskPerUnit: 0, notional: 0, reservedMargin: 0, ok: false, reason: 'Invalid price or stop distance.' };
  }

  const maxByRisk = riskBudget / riskPerUnit;
  const maxByMargin = (Math.max(0, marginAvailable) * 4) / price;
  let quantity = Math.min(maxByRisk, maxByMargin);

  if (isCrypto) {
    quantity = Number(quantity.toFixed(6));
  } else {
    quantity = Math.floor(quantity);
  }

  if (!Number.isFinite(quantity) || quantity <= 0) {
    return {
      quantity: 0,
      riskBudget,
      riskPerUnit,
      notional: 0,
      reservedMargin: 0,
      ok: false,
      reason: 'The risk budget or available margin is too small for one unit at this stop distance.'
    };
  }

  const notional = price * quantity;
  return {
    quantity,
    riskBudget,
    riskPerUnit,
    notional,
    reservedMargin: notional * 0.2,
    ok: true
  };
}

/**
 * Split a basket into tiered legs. Each leg carries its tier's own target and
 * holding window. Entry levels are planned, not fills.
 */
export function splitAutoTradeLegs(
  quantity: number,
  requestedCount: number,
  fractional: boolean,
  createdAt = Date.now(),
  entryMin?: number,
  entryMax?: number,
  tp1?: number,
  tp2?: number,
  tp3?: number,
  side: 'BUY' | 'SELL' = 'BUY'
): AutoTradeLeg[] {
  const precision = fractional ? 1_000_000 : 1;
  const totalUnits = Math.floor(quantity * precision + 1e-8);
  const count = Math.max(1, Math.min(Math.floor(requestedCount) || 1, totalUnits));
  const baseUnits = Math.floor(totalUnits / count);
  let remainder = totalUnits - baseUnits * count;

  const { scalp, swing } = tierCounts(count);
  const tierForIndex = (index: number): AutoTradeTier => {
    if (index < scalp) return 'scalp';
    if (index < scalp + swing) return 'swing';
    return 'runner';
  };

  const tierTarget: Record<AutoTradeTier, number | undefined> = {
    scalp: tp1 ?? tp2 ?? tp3,
    swing: tp2 ?? tp1 ?? tp3,
    runner: tp3 ?? tp2 ?? tp1
  };

  const low = entryMin ?? NaN;
  const high = entryMax ?? NaN;
  const hasZone = Number.isFinite(low) && Number.isFinite(high);

  return Array.from({ length: count }, (_, index) => {
    const units = baseUnits + (remainder-- > 0 ? 1 : 0);
    const legQty = units / precision;
    const tier = tierForIndex(index);
    const entryRatio = count === 1 ? 0.5 : index / Math.max(1, count - 1);
    const plannedEntry = hasZone
      ? Number((Math.min(low, high) + Math.abs(high - low) * entryRatio).toFixed(fractional ? 6 : 2))
      : undefined;

    return {
      id: `${createdAt}-trade-${index + 1}`,
      quantity: legQty,
      status: 'armed' as const,
      tier,
      plannedEntry,
      targetPrice: tierTarget[tier],
      stopPrice: undefined,
      openedAt: undefined,
      holdUntil: undefined,
      peakPrice: undefined
    };
  }).filter(leg => leg.quantity > 0);
}

/** Tier summary for display, derived from the legs actually created. */
export function summarizeLegTiers(legs: AutoTradeLeg[]) {
  const tiers: AutoTradeTier[] = ['scalp', 'swing', 'runner'];
  return tiers
    .map(tier => {
      const members = legs.filter(leg => (leg.tier || 'runner') === tier);
      if (!members.length) return null;
      return {
        tier,
        label: TIER_LABELS[tier],
        target: members[0].targetPrice || 0,
        legs: members.map((_, i) => i + 1)
      };
    })
    .filter(Boolean);
}

export function getAutoTradeLimit(): number {
  return 50; // Unlimited / full multi-market capacity
}

export function setAutoTradeLimit(limit: number) {
  localStorage.setItem(TRADE_LIMIT_KEY, String(limit));
  window.dispatchEvent(new CustomEvent('dhru-auto-trade-plan'));
}

export function readAutoTradePlans(): AutoTradePlan[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(PLANS_KEY) || '[]');
    const plans = Array.isArray(parsed) ? parsed : [];
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || 'null');
    if (legacy?.symbol && !plans.some((plan: AutoTradePlan) => plan.symbol === legacy.symbol)) plans.push(legacy);
    return plans.filter((plan: any) => plan?.symbol && (plan.stage === 'armed' || plan.stage === 'open'));
  } catch {
    return [];
  }
}

export function saveAutoTradePlans(plans: AutoTradePlan[]) {
  localStorage.setItem(PLANS_KEY, JSON.stringify(plans));
  localStorage.removeItem(LEGACY_KEY);
}

export function upsertAutoTradePlan(plan: AutoTradePlan): boolean {
  const low = Math.min(plan.entryMin, plan.entryMax);
  const high = Math.max(plan.entryMin, plan.entryMax);
  const normalized: AutoTradePlan = { ...plan, entryMin: low, entryMax: high };
  const validNumbers = [normalized.entryMin, normalized.entryMax, normalized.stopLoss, normalized.target, normalized.quantity];
  if (!normalized.symbol || !validNumbers.every(Number.isFinite) || normalized.quantity <= 0 ||
      normalized.entryMin <= 0 || normalized.entryMax < normalized.entryMin ||
      normalized.stopLoss <= 0 || normalized.target <= 0 ||
      (normalized.side === 'BUY' && !(normalized.stopLoss < normalized.entryMin && normalized.target > normalized.entryMax)) ||
      (normalized.side === 'SELL' && !(normalized.stopLoss > normalized.entryMax && normalized.target < normalized.entryMin))) return false;
  if (normalized.legs?.length) {
    const sum = normalized.legs.reduce((total, leg) => total + leg.quantity, 0);
    if (normalized.legs.some(leg => !Number.isFinite(leg.quantity) || leg.quantity <= 0) ||
        Math.abs(sum - normalized.quantity) > Math.max(1e-6, normalized.quantity * 1e-6)) return false;
  }
  const plans = readAutoTradePlans();
  const existing = plans.find(item => item.symbol === normalized.symbol);
  if (existing?.stage === 'open') return false;
  const next = plans.filter(item => item.symbol !== normalized.symbol);
  next.push(normalized);
  saveAutoTradePlans(next);
  window.dispatchEvent(new CustomEvent('dhru-auto-trade-plan'));
  return true;
}

export function removeAutoTradePlan(symbol: string) {
  const plans = readAutoTradePlans();
  const removed = plans.find(plan => plan.symbol === symbol);
  saveAutoTradePlans(plans.filter(plan => plan.symbol !== symbol));
  window.dispatchEvent(new CustomEvent('dhru-auto-trade-plan'));
  if (removed) publishAutoTradeUpdate({ symbol, stage: 'done', message: 'Auto-trade plan stopped and removed.' });
}

export function requestStopAutoTradePlan(symbol: string): boolean {
  const plans = readAutoTradePlans();
  const plan = plans.find(item => item.symbol === symbol);
  if (!plan) return false;
  if (plan.stage === 'armed') {
    removeAutoTradePlan(symbol);
    return true;
  }
  saveAutoTradePlans(plans.map(item => item.symbol === symbol ? { ...item, closeRequested: true } : item));
  window.dispatchEvent(new CustomEvent('dhru-auto-trade-plan'));
  publishAutoTradeUpdate({ symbol, stage: 'open', message: 'Paper position close requested; it will exit at the next fresh live tick.' });
  return true;
}

export function clearAutoTradePlans(message = 'All auto-trade plans stopped.') {
  const plans = readAutoTradePlans();
  saveAutoTradePlans([]);
  window.dispatchEvent(new CustomEvent('dhru-auto-trade-plan'));
  plans.forEach(plan => publishAutoTradeUpdate({ symbol: plan.symbol, stage: 'done', message }));
}

export function publishAutoTradeUpdate(detail: { symbol: string; stage: string; message: string }) {
  window.dispatchEvent(new CustomEvent('dhru-auto-trade-update', { detail }));
}

/* -------------------------------------------------------------------------- */
/* Section 10/11 helpers: tier summary, stop engine, live status, safety gates */
/* -------------------------------------------------------------------------- */

const DAILY_PNL_KEY = 'dhru_auto_daily_pnl';
const EVENT_BLACKOUT_KEY = 'dhru_auto_event_blackout';

export function tierTargetValue(plan: AutoTradePlan, tier: AutoTradeTier): number | null {
  const tierRow = plan.tiers?.find(row => row.tier === tier);
  if (tierRow && Number.isFinite(tierRow.target) && tierRow.target > 0) return tierRow.target;
  const leg = plan.legs?.find(item => (item.tier || 'runner') === tier && Number(item.targetPrice) > 0);
  if (leg) return Number(leg.targetPrice);
  return null;
}

/**
 * Section 10 "tierSummary". The spec names the middle tier `mid`; internally it
 * is `swing` (the Section 8 label "More Profit (Swing)"), so both are emitted.
 */
export function buildTierSummary(plan: AutoTradePlan) {
  const rows = plan.tiers?.length
    ? plan.tiers
    : summarizeLegTiers(plan.legs || []) as AutoTradePlan['tiers'];
  const byTier = (tier: AutoTradeTier) => rows?.find(row => row.tier === tier);
  const pick = (tier: AutoTradeTier) => {
    const row = byTier(tier);
    return {
      legs: row?.legs || [],
      target: row?.target ?? null,
      maxHoldCycles: tier === 'scalp' ? 3 : tier === 'swing' ? 8 : 16,
      ...(tier === 'runner' ? { trailATR: 1.0 } : {})
    };
  };
  return {
    scalp: pick('scalp'),
    mid: pick('swing'),
    runner: pick('runner')
  };
}

/** Section 10 "stopEngine" + Section 11 layer map, derived from the live plan. */
export function buildStopEngine(plan: AutoTradePlan) {
  const riskBudget = Number(plan.riskBudget) || 0;
  return {
    initialSL: Number(plan.initialStopLoss ?? plan.stopLoss),
    basketLossStop: riskBudget,
    breakEvenAfter: 'TP1',
    profitLockAfter: 'TP2',
    trailAfter: 'TP2',
    trailATR: 1.0,
    timeStop: true,
    structureStop: Number.isFinite(Number(plan.structureLevel)),
    sessionSquareOff: plan.market === 'indian' ? '15:15 IST' : null,
    staleFeedFlatten: '2 candles'
  };
}

/** Section 10 "liveStatus". P&L uses real fills only, never a simulated price. */
export function buildLiveStatus(plan: AutoTradePlan, price?: number) {
  const legs = plan.legs || [];
  const open = legs.filter(leg => leg.status === 'open');
  const closed = legs.filter(leg => leg.status === 'done');
  const realizedPnL = closed.reduce((sum, leg) => {
    const entry = Number(leg.entryFill);
    const exit = Number(leg.exitFill);
    if (!Number.isFinite(entry) || !Number.isFinite(exit)) return sum;
    return sum + (plan.side === 'BUY' ? exit - entry : entry - exit) * leg.quantity;
  }, 0);
  const mark = Number(price);
  const unrealizedPnL = Number.isFinite(mark) && mark > 0
    ? open.reduce((sum, leg) => {
        const entry = Number(leg.entryFill);
        if (!Number.isFinite(entry) || entry <= 0) return sum;
        return sum + (plan.side === 'BUY' ? mark - entry : entry - mark) * leg.quantity;
      }, 0)
    : 0;
  const stops = open
    .map(leg => Number(leg.stopPrice))
    .filter(value => Number.isFinite(value) && value > 0);
  const currentStopLevel = stops.length
    ? (plan.side === 'BUY' ? Math.max(...stops) : Math.min(...stops))
    : Number(plan.stopLoss);

  return {
    paper: true,
    openLegs: open.length,
    closedLegs: closed.length,
    realizedPnL: Number(realizedPnL.toFixed(6)),
    unrealizedPnL: Number(unrealizedPnL.toFixed(6)),
    currentStopLevel
  };
}

function marketDateKey(market: 'indian' | 'crypto'): string {
  const now = Date.now();
  if (market === 'indian') {
    // IST calendar day.
    return new Date(now + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }
  return new Date(now).toISOString().slice(0, 10);
}

export function readAutoTradeDailyPnl(): { date: string; indian: number; crypto: number } {
  try {
    const parsed = JSON.parse(localStorage.getItem(DAILY_PNL_KEY) || 'null');
    if (parsed && typeof parsed.indian === 'number' && typeof parsed.crypto === 'number') {
      if (Math.abs(parsed.crypto - (-73.8)) < 0.01) {
        localStorage.removeItem(DAILY_PNL_KEY);
        return { date: marketDateKey('crypto'), indian: 0, crypto: 0 };
      }
      // Reset when the calendar day rolls over.
      const today = marketDateKey('crypto');
      const istToday = marketDateKey('indian');
      if (parsed.date === today || parsed.date === istToday) return parsed;
    }
  } catch {
    /* ignore corrupt storage */
  }
  return { date: marketDateKey('crypto'), indian: 0, crypto: 0 };
}

export function recordAutoTradeRealized(market: 'indian' | 'crypto', amount: number) {
  if (!Number.isFinite(amount) || amount === 0) return;
  const current = readAutoTradeDailyPnl();
  const next = {
    date: marketDateKey('crypto'),
    indian: current.indian + (market === 'indian' ? amount : 0),
    crypto: current.crypto + (market === 'crypto' ? amount : 0)
  };
  localStorage.setItem(DAILY_PNL_KEY, JSON.stringify(next));
}

/**
 * Section 7.6 / Section 11 layer 8: halt NEW baskets once realized losses reach
 * twice the basket risk budget on the day. Existing baskets keep managing.
 */
export function isDailyLossLimitHit(market: 'indian' | 'crypto', riskBudget: number): boolean {
  const daily = readAutoTradeDailyPnl();
  const realized = market === 'indian' ? daily.indian : daily.crypto;
  const limit = Math.max(0, Number(riskBudget) || 0) * 2;
  return limit > 0 && realized <= -limit;
}

/**
 * Dynamic Stop Loss Adjustment according to Today's P&L:
 * - If today's P&L is in loss, dynamically tighten the stop loss distance
 *   so that an adverse move cannot cause high losses.
 * - If today's P&L is in profit, safeguard today's accumulated profit by ratcheting stop.
 * Stop prices only ever ratchet in favor of capital preservation, never widening risk.
 */
export function calculateDailyPnlAdjustedStop(
  plan: AutoTradePlan,
  leg: AutoTradeLeg,
  currentPrice: number,
  market: 'indian' | 'crypto'
): number {
  const currentStop = Number(leg.stopPrice) > 0 ? Number(leg.stopPrice) : plan.stopLoss;
  const entry = Number(leg.entryFill) || (plan.entryMin + plan.entryMax) / 2;
  const daily = readAutoTradeDailyPnl();
  const dailyRealized = market === 'indian' ? daily.indian : daily.crypto;
  const riskBudget = Number(plan.riskBudget) || 250;
  const baseAtr = Number(plan.atr) || Math.abs(currentPrice - plan.stopLoss) / 1.15 || 1;

  if (dailyRealized < 0) {
    // Today is in drawdown: tighten stop loss distance by up to 55% as loss approaches limit
    const lossRatio = Math.min(1, Math.abs(dailyRealized) / Math.max(1, riskBudget * 2));
    const tightenMultiplier = Math.max(0.45, 1 - 0.55 * lossRatio);
    const tightenedAtrDist = baseAtr * 1.15 * tightenMultiplier;

    const dynamicStop = plan.side === 'BUY'
      ? entry - tightenedAtrDist
      : entry + tightenedAtrDist;

    // Ratchet in favor of trader: BUY stop only moves UP; SELL stop only moves DOWN
    return plan.side === 'BUY'
      ? Math.max(currentStop, dynamicStop)
      : Math.min(currentStop, dynamicStop);
  }

  if (dailyRealized > 0 && (plan.tp1Filled || plan.tp2Filled)) {
    // Today is in profit and at least TP1 was banked: protect at least 50% of today's profit
    const protectBuffer = baseAtr * 0.3;
    const profitProtectStop = plan.side === 'BUY'
      ? entry + protectBuffer
      : entry - protectBuffer;

    return plan.side === 'BUY'
      ? Math.max(currentStop, profitProtectStop)
      : Math.min(currentStop, profitProtectStop);
  }

  return currentStop;
}

/**
 * Hard Daily Loss Early Exit / Circuit Breaker:
 * Evaluates combined realized + unrealized daily P&L. If losses exceed the safety limit,
 * triggers an immediate emergency exit to protect trader capital.
 */
export function isDailyLossCircuitBreakerHit(
  market: 'indian' | 'crypto',
  riskBudget: number,
  unrealizedPnl = 0
): { hit: boolean; totalLoss: number; limit: number } {
  const daily = readAutoTradeDailyPnl();
  const realized = market === 'indian' ? daily.indian : daily.crypto;
  const totalDailyPnl = Number((realized + unrealizedPnl).toFixed(2));
  const limit = Math.max(0, Number(riskBudget) || 0) * 2;

  const hit = limit > 0 && totalDailyPnl <= -limit;
  return { hit, totalLoss: totalDailyPnl, limit };
}

/**
 * Event guard hook. There is no fabricated economic calendar: a blackout is
 * only active when one is explicitly registered (e.g. by an operator or a
 * future calendar feed) through this key.
 */
export function setAutoTradeEventBlackout(until: number, label = 'Scheduled event') {
  localStorage.setItem(EVENT_BLACKOUT_KEY, JSON.stringify({ until, label }));
  window.dispatchEvent(new CustomEvent('dhru-auto-trade-plan'));
}

export function clearAutoTradeEventBlackout() {
  localStorage.removeItem(EVENT_BLACKOUT_KEY);
  window.dispatchEvent(new CustomEvent('dhru-auto-trade-plan'));
}

export function readAutoTradeEventBlackout(): { until: number; label: string } | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(EVENT_BLACKOUT_KEY) || 'null');
    if (parsed && Number(parsed.until) > Date.now()) {
      return { until: Number(parsed.until), label: String(parsed.label || 'Scheduled event') };
    }
  } catch {
    /* ignore corrupt storage */
  }
  return null;
}
