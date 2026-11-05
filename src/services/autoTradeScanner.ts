// DHRU.AI - One-Tap Auto-Trade Scanner (master spec v2, Sections 2-5, 7, 10)
//
// One call does the whole decision cycle:
//   pre-flight gate -> scan desk -> score/confidence gates -> rank -> size ->
//   pre-trade checklist -> arm the basket (3-10 legs, scalp/swing/runner).
// The existing AutoTradeMonitor then executes entries, tiered exits, break-even,
// profit lock, ATR trail and every safety stop from live ticks.
//
// Nothing here invents data. Levels come from the server's verified setup
// (live quote + ATR + pivots). If anything is stale, missing or conflicting,
// the result is WAIT with the reason, and no plan is armed.

import { getStockDetails, getDhruAnalysis, DhruAnalysis } from './api';
import { isIndianMarketOpenNow } from '../context/MarketStreamContext';
import {
  AutoTradePlan,
  calculateAutoTradeSize,
  isDailyLossLimitHit,
  readAutoTradeEventBlackout,
  readAutoTradePlans,
  splitAutoTradeLegs,
  summarizeLegTiers,
  upsertAutoTradePlan
} from './autoTradePlans';

export type DeskMarket = 'indian' | 'crypto';

/** Section 10 step 2.4 / Phase 4.1: minimum confidence to trade (single exported constant). */
export const MIN_CONFIDENCE = 80;
/** Section 3: |score| >= 2 to trade; counter-trend needs |score| >= 4. */
export const MIN_SCORE = 2;
export const COUNTER_TREND_SCORE = 4;
/** Section 10 step 4: entry zone must sit within price +/- 0.5 ATR (no chasing). */
const MAX_CHASE_ATR = 0.5;
/** Section 10 step 4: risk:reward to TP2 must be at least 1:2. */
const MIN_RR_TP2 = 2;
/** Quotes older than this are treated as stale (Section 2.2). */
const MAX_QUOTE_AGE_MS = 5 * 60_000;
/** Crypto minimum notional per leg (conservative exchange minimum). */
const MIN_CRYPTO_LEG_NOTIONAL = 10;
const ARM_WINDOW_MS = 30 * 60_000;
const COOLDOWN_KEY = 'dhru_one_tap_cooldowns';
const COOLDOWN_MS = 60 * 60_000;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Tradable universe per desk. Indices are excluded: they cannot be traded as MIS cash. */
export const DESK_UNIVERSE: Record<DeskMarket, string[]> = {
  indian: [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'SBIN.NS',
    'BHARTIARTL.NS', 'ITC.NS', 'LT.NS', 'TATAMOTORS.NS'
  ],
  crypto: [
    'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'SUI-USD', 'BNB-USD', 'DOGE-USD',
    'ADA-USD', 'AVAX-USD', 'LINK-USD', 'DOT-USD', 'LTC-USD', 'NEAR-USD', 'UNI-USD',
    'APT-USD', 'RENDER-USD', 'ICP-USD', 'FET-USD'
  ]
};

export interface ScanCandidateReport {
  symbol: string;
  rejected?: string;
  rank?: number;
}

export interface ScanResult {
  status: 'ARMED' | 'WAIT';
  mode: 'PAPER';
  market: DeskMarket;
  reason: string;
  /** Section 8 style report for the armed basket (or the WAIT shape). */
  report: Record<string, unknown>;
  plan?: AutoTradePlan;
  scanned: number;
  considered: ScanCandidateReport[];
}

interface Candidate {
  symbol: string;
  name: string;
  side: 'BUY' | 'SELL';
  score: number;
  confidence: number;
  rank: number;
  price: number;
  atr: number;
  entryMin: number;
  entryMax: number;
  stopLoss: number;
  tp1: number;
  tp2: number;
  tp3: number;
  predictedLegs: number;
  structureLevel?: number;
  confluence: string[];
  winRate: string | null;
  winRateStatus: string;
  council?: any;
  quantMetrics?: any;
}

function parseLevel(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : NaN;
  const parsed = Number(String(value ?? '').replace(/[^\d.\-]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : NaN;
}

function parseRange(value: unknown): [number, number] | null {
  const parts = String(value ?? '').split(/[—–]|\s-\s/).map(parseLevel).filter(Number.isFinite);
  if (parts.length !== 2) return null;
  return [Math.min(parts[0], parts[1]), Math.max(parts[0], parts[1])];
}

function istMinutes(now = Date.now()): number {
  const d = new Date(now + IST_OFFSET_MS);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

/* ------------------------------ cooldowns -------------------------------- */

function readCooldowns(): Record<string, number> {
  try {
    const parsed = JSON.parse(localStorage.getItem(COOLDOWN_KEY) || '{}');
    const now = Date.now();
    return Object.fromEntries(Object.entries(parsed).filter(([, until]) => Number(until) > now)) as Record<string, number>;
  } catch {
    return {};
  }
}

/** After a basket finishes, do not re-enter the same symbol for an hour (no revenge trades). */
export function setSymbolCooldown(symbol: string, ms = COOLDOWN_MS) {
  try {
    const next = { ...readCooldowns(), [symbol]: Date.now() + ms };
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: skip cooldown */
  }
}

/* ------------------------------- pre-flight ------------------------------- */

/** Section 10 Step 1. Returns a reason string if trading must not proceed. */
function preflightBlock(market: DeskMarket, riskBudgetPreview: number): string | null {
  if (readAutoTradePlans().length > 0) return 'A basket is already active. One symbol, one basket at a time.';
  const blackout = readAutoTradeEventBlackout();
  if (blackout) return `Scheduled event guard active (${blackout.label}). New baskets are paused.`;
  if (isDailyLossLimitHit(market, riskBudgetPreview)) {
    return 'Daily loss limit reached (2x basket risk). New baskets are halted until the next session.';
  }
  if (market === 'indian') {
    if (!isIndianMarketOpenNow()) return 'NSE/BSE is closed. Indian baskets are only opened during the 9:15 AM to 3:30 PM IST session.';
    if (istMinutes() >= 14 * 60 + 45) return 'No new Indian entries after 2:45 PM IST (MIS square-off at 3:15 PM).';
  }
  return null;
}

/* ------------------------------ candidate build --------------------------- */

function buildCandidate(symbol: string, input: any, market: DeskMarket): Candidate | string {
  const analysis: DhruAnalysis | null = input?.levels ? input : input?.analysis;
  if (!analysis || !analysis.levels || !analysis.quote) return 'No verified setup (insufficient data)';

  const quote = analysis.quote;
  const price = Number(quote.price);
  const atr = Number(analysis.indicators?.['5m']?.atr14);
  if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(atr) || atr <= 0) return 'Missing live price or ATR';

  // Section 2.2 / Phase 4.1: stale data -> WAIT
  if (!analysis.dataQuality.fresh) return 'Stale quote (feed delayed > 2 signal candles)';

  // Regime filter (Phase 2.3 & 4.1): ADX >= 18
  if (analysis.regime !== 'TREND') return 'ADX < 18 (ranging market regime)';

  // Relative volume filter (Phase 4.1): relVolume >= 1.2
  const relVol = Number(analysis.indicators?.['5m']?.relVolume) || 1.0;
  if (relVol < 1.2) return `Relative volume ${relVol} below 1.2 threshold`;

  // Directional discipline (Section 3 & Phase 4.1)
  const score = Number(analysis.score.total);
  if (!Number.isFinite(score)) return 'No technical score';
  const side: 'BUY' | 'SELL' | null = analysis.direction === 'LONG' ? 'BUY' : analysis.direction === 'SHORT' ? 'SELL' : null;
  if (!side) return analysis.rejectReason || 'Neutral / conflicting signals';
  if (side === 'BUY' && score < MIN_SCORE) return `Score ${score} below +${MIN_SCORE}`;
  if (side === 'SELL' && score > -MIN_SCORE) return `Score ${score} above -${MIN_SCORE}`;

  // Calibrated confidence gate (Phase 2.5 & 4.1): confidence >= 80 AND calibrated
  const confidence = Number(analysis.confidence.value);
  if (!Number.isFinite(confidence) || confidence < MIN_CONFIDENCE) {
    return `Confidence ${Number.isFinite(confidence) ? confidence : 'n/a'} below ${MIN_CONFIDENCE} gate`;
  }
  if (analysis.confidence.method !== 'walk_forward_calibrated') {
    return 'Confidence is uncalibrated (< 30 backtest samples)';
  }

  // Counter-trend HTF check: needs |score| >= 4
  const htfTrend = analysis.indicators?.['1h']?.ema9 && analysis.indicators?.['1h']?.ema21
    ? (analysis.indicators['1h'].ema9 > analysis.indicators['1h'].ema21 ? 'BULL' : 'BEAR')
    : null;
  if (htfTrend) {
    const isCounterTrend = (side === 'BUY' && htfTrend === 'BEAR') || (side === 'SELL' && htfTrend === 'BULL');
    if (isCounterTrend && Math.abs(score) < COUNTER_TREND_SCORE) return 'Counter to higher-timeframe 1h trend';
  }

  // Canonical levels directly from DhruAnalysis
  const l = analysis.levels;
  const entryMin = l.entryMin;
  const entryMax = l.entryMax;
  const stopLoss = l.stopLoss;
  const tp1 = l.tp1;
  const tp2 = l.tp2;
  const tp3 = l.tp3;

  const entryMid = (entryMin + entryMax) / 2;

  // Level geometry coherence
  const coherent = side === 'BUY'
    ? stopLoss < entryMin && entryMax < tp1 && tp1 < tp2 && tp2 < tp3
    : stopLoss > entryMax && entryMin > tp1 && tp1 > tp2 && tp2 > tp3;
  if (!coherent) return 'Levels are not coherent for the direction';

  // Opposing structure check (Phase 2.4 & 4.1): reject if opposing is closer than TP1
  const opposing = analysis.structure?.nearestOpposing;
  if (opposing && opposing.distance > 0) {
    const tp1Dist = Math.abs(tp1 - price);
    if (opposing.distance < tp1Dist) {
      return `Opposing structure (${opposing.level}) sits closer than TP1`;
    }
  }

  // Pre-trade checklist: not chasing (within 0.5 ATR), and R:R to TP2 >= 1:2
  if (Math.abs(price - entryMid) > MAX_CHASE_ATR * atr) return 'Entry zone is more than 0.5 ATR from price (chasing)';
  const worstEntry = side === 'BUY' ? entryMax : entryMin;
  const rr = Math.abs(tp2 - entryMid) / Math.abs(worstEntry - stopLoss);
  if (!Number.isFinite(rr) || rr < MIN_RR_TP2) return `Risk:reward to TP2 is 1:${Number.isFinite(rr) ? rr.toFixed(2) : '0'} (needs 1:${MIN_RR_TP2})`;

  // Multi-Agent Quantitative Council Consensus Check
  if (analysis.council) {
    const expectedCouncilBias = side === 'BUY' ? 'BULLISH' : 'BEARISH';
    if (analysis.council.consensusDirection !== 'NEUTRAL' && analysis.council.consensusDirection !== expectedCouncilBias) {
      return `Multi-agent council consensus is ${analysis.council.consensusDirection} (disagrees with ${side})`;
    }
    if (analysis.council.agreementPercent < 50) {
      return `Multi-agent council consensus is fragmented (${analysis.council.agreementPercent}%)`;
    }
  }

  // Mathematical Expected Value (EV) Gate
  if (analysis.quantMetrics && typeof analysis.quantMetrics.expectedValueR === 'number') {
    if (analysis.quantMetrics.expectedValueR <= 0) {
      return `Negative expected value (EV = ${analysis.quantMetrics.expectedValueR} R)`;
    }
  }

  const winRate = analysis.backtest.winRate !== null ? `${analysis.backtest.winRate}%` : null;

  return {
    symbol,
    name: quote.source || symbol,
    side,
    score,
    confidence,
    rank: Math.abs(score) * confidence,
    price,
    atr,
    entryMin,
    entryMax,
    stopLoss,
    tp1,
    tp2,
    tp3,
    predictedLegs: Math.min(10, Math.max(3, Number(analysis.predictedPositionsCount) || 3)),
    structureLevel: analysis.structure?.swingHigh || undefined,
    confluence: [
      `Score ${score} (Trend ${analysis.score.components.trend}, Mom ${analysis.score.components.momentum})`,
      `Regime ${analysis.regime} (ADX ${analysis.indicators?.['5m']?.adx14 || 'N/A'})`,
      `RelVol ${relVol}x`,
      analysis.council ? `Council: ${analysis.council.agreementPercent}% ${analysis.council.consensusDirection}` : 'Trend aligned',
      analysis.quantMetrics ? `EV: ${analysis.quantMetrics.expectedValueR > 0 ? '+' : ''}${analysis.quantMetrics.expectedValueR}R` : 'EV positive',
      analysis.structure?.bos ? `${analysis.structure.bos.type}` : 'Structure aligned'
    ],
    winRate,
    winRateStatus: analysis.backtest.status,
    council: analysis.council,
    quantMetrics: analysis.quantMetrics
  };
}

/* --------------------------------- sizing --------------------------------- */

function sizeAndBuildPlan(c: Candidate, market: DeskMarket, cash: number, margin: number): { plan: AutoTradePlan } | { reject: string } {
  const isCrypto = market === 'crypto';
  // Size on the worst-case fill (far edge of the zone) so the basket can never
  // lose more than the risk budget at the stop.
  const worstEntry = c.side === 'BUY' ? c.entryMax : c.entryMin;
  const sizing = calculateAutoTradeSize({ cashBalance: cash, marginAvailable: margin, price: worstEntry, stopLoss: c.stopLoss, isCrypto });
  if (!sizing.ok || sizing.quantity <= 0) return { reject: sizing.reason || 'Could not size within the risk budget' };

  let legCount = c.predictedLegs;
  if (isCrypto) {
    const byNotional = Math.floor((sizing.quantity * worstEntry) / MIN_CRYPTO_LEG_NOTIONAL);
    legCount = Math.min(legCount, byNotional);
  } else {
    legCount = Math.min(legCount, Math.floor(sizing.quantity));
  }
  // Never fewer than 3 legs (so every basket has a scalp, a swing and a runner).
  if (legCount < 3) return { reject: 'Insufficient risk budget for minimum lot size' };

  const createdAt = Date.now();
  const legs = splitAutoTradeLegs(sizing.quantity, legCount, isCrypto, createdAt, c.entryMin, c.entryMax, c.tp1, c.tp2, c.tp3, c.side);
  if (legs.length < 3) return { reject: 'Insufficient risk budget for minimum lot size' };

  const plan: AutoTradePlan = {
    symbol: c.symbol,
    name: c.name,
    side: c.side,
    entryMin: c.entryMin,
    entryMax: c.entryMax,
    stopLoss: c.stopLoss,
    target: c.tp3,
    quantity: sizing.quantity,
    marginReserved: sizing.reservedMargin,
    riskBudget: sizing.riskBudget,
    stage: 'armed',
    createdAt,
    expiresAt: createdAt + ARM_WINDOW_MS,
    source: 'one-tap',
    legs,
    atr: c.atr,
    tiers: summarizeLegTiers(legs) as AutoTradePlan['tiers'],
    targetMode: 'staged',
    stagedTargets: [c.tp1, c.tp2, c.tp3],
    market,
    initialStopLoss: c.stopLoss,
    structureLevel: c.structureLevel
  };
  return { plan };
}

/* ---------------------------------- main ---------------------------------- */

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return out;
}

function waitResult(market: DeskMarket, reason: string, scanned = 0, considered: ScanCandidateReport[] = [], range?: { symbol: string; support: number; resistance: number }): ScanResult {
  return {
    status: 'WAIT',
    mode: 'PAPER',
    market,
    reason,
    scanned,
    considered,
    report: {
      direction: 'WAIT',
      action: 'WAIT',
      ...(range ? { symbol: range.symbol, supportResistance: `${range.support} — ${range.resistance}` } : {}),
      reasoning: reason
    }
  };
}

/** The whole one-button cycle. Safe to call repeatedly: it never arms over an active basket. */
export async function scanAndArm(params: { market: DeskMarket; cashBalance: number; marginAvailable: number }): Promise<ScanResult> {
  const { market, cashBalance, marginAvailable } = params;
  const isCrypto = market === 'crypto';
  const riskBudgetPreview = Math.max(isCrypto ? 25 : 500, Math.min(Math.max(0, cashBalance) * 0.05, isCrypto ? 250 : 5000));

  const blocked = preflightBlock(market, riskBudgetPreview);
  if (blocked) return waitResult(market, blocked);

  const cooldowns = readCooldowns();
  const universe = DESK_UNIVERSE[market].filter(symbol => !cooldowns[symbol]);
  if (!universe.length) return waitResult(market, 'All symbols are in their post-trade cooldown.');

  const settled = await mapLimit(universe, 5, async symbol => {
    try {
      return { symbol, data: await getStockDetails(symbol) as any };
    } catch {
      return { symbol, data: null };
    }
  });

  const considered: ScanCandidateReport[] = [];
  const candidates: Candidate[] = [];
  let fallbackRange: { symbol: string; support: number; resistance: number; strength: number } | undefined;

  for (const { symbol, data } of settled) {
    if (!data) {
      considered.push({ symbol, rejected: 'Data unavailable' });
      continue;
    }
    const built = buildCandidate(symbol, data, market);
    if (typeof built === 'string') {
      considered.push({ symbol, rejected: built });
      // Remember the strongest-looking rejected symbol for the WAIT support/resistance range.
      const pivots = data?.technicals?.pivots;
      const strength = Math.abs(Number(data?.scenarios?.smcSetup?.score) || 0) * (Number(data?.scenarios?.smcSetup?.confidence) || 0);
      const s1 = Number(pivots?.s1), r1 = Number(pivots?.r1);
      if (Number.isFinite(s1) && Number.isFinite(r1) && (!fallbackRange || strength > fallbackRange.strength)) {
        fallbackRange = { symbol, support: s1, resistance: r1, strength };
      }
    } else {
      candidates.push(built);
    }
  }

  candidates.sort((a, b) => b.rank - a.rank);

  // Take the best-ranked candidate that also survives sizing and arming.
  for (const [index, candidate] of candidates.entries()) {
    const built = sizeAndBuildPlan(candidate, market, cashBalance, marginAvailable);
    if ('reject' in built) {
      considered.push({ symbol: candidate.symbol, rejected: built.reject, rank: candidate.rank });
      continue;
    }
    if (!upsertAutoTradePlan(built.plan)) {
      considered.push({ symbol: candidate.symbol, rejected: 'Plan failed validation', rank: candidate.rank });
      continue;
    }
    const plan = built.plan;
    considered.push({ symbol: candidate.symbol, rank: candidate.rank });
    candidates.slice(index + 1).forEach(other => considered.push({ symbol: other.symbol, rank: other.rank, rejected: 'Lower ranked (one basket at a time)' }));

    const currency = isCrypto ? '$' : '₹';
    const legs = plan.legs || [];
    const tierRows = (plan.tiers || []).map(row => ({
      tier: row.tier,
      label: row.label,
      target: row.target,
      legs: row.legs,
      expectedPct: `${(((row.target - candidate.price) / candidate.price) * 100 * (candidate.side === 'BUY' ? 1 : -1)).toFixed(2)}%`
    }));
    const entryMid = (candidate.entryMin + candidate.entryMax) / 2;
    const worstEntry = candidate.side === 'BUY' ? candidate.entryMax : candidate.entryMin;
    const report = {
      symbol: candidate.symbol,
      market: isCrypto ? 'CRYPTO' : 'NSE',
      direction: candidate.side === 'BUY' ? 'LONG' : 'SHORT',
      action: candidate.side,
      score: candidate.score,
      confidence: candidate.confidence,
      predictedPositionsCount: legs.length,
      currentPrice: candidate.price,
      entryRange: `${currency}${candidate.entryMin} — ${currency}${candidate.entryMax}`,
      stopLoss: candidate.stopLoss,
      tiers: tierRows,
      stopManagement: ['After TP1: SL -> entry', 'After TP2: runner SL -> TP1', 'Then trail 1.0 ATR'],
      riskBudget: plan.riskBudget,
      riskReward: `1:${(Math.abs(candidate.tp2 - entryMid) / Math.abs(worstEntry - candidate.stopLoss)).toFixed(2)}`,
      winRate: candidate.winRate,
      winRateStatus: candidate.winRateStatus,
      confluence: candidate.confluence,
      council: candidate.council,
      quantMetrics: candidate.quantMetrics,
      expectedValueR: candidate.quantMetrics?.expectedValueR,
      kellyFraction: candidate.quantMetrics?.kellyFraction,
      volatilityRegime: candidate.quantMetrics?.volatilityRegime,
      mode: 'PAPER',
      executionStatus: 'ARMED',
      totalQty: plan.quantity,
      reasoning: `Top-ranked of ${candidates.length} valid setup${candidates.length === 1 ? '' : 's'} from ${settled.length} scanned (rank = |score| x confidence). Entry triggers only when the live price enters the zone.`
    };

    return {
      status: 'ARMED',
      mode: 'PAPER',
      market,
      reason: `${candidate.side} ${candidate.symbol}: ${legs.length} legs, score ${candidate.score > 0 ? '+' : ''}${candidate.score}, confidence ${candidate.confidence}.`,
      report,
      plan,
      scanned: settled.length,
      considered
    };
  }

  const reason = candidates.length
    ? 'Setups were found but none fit the risk budget. Placing no trade is the correct result.'
    : 'No setup passed every gate (score, confidence, trend, freshness, risk:reward). Placing no trade is the correct result.';
  return waitResult(market, reason, settled.length, considered, fallbackRange);
}
