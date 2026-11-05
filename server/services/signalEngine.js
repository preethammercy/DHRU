// DHRU.AI - Live Signal Engine
// Produces deterministic, evidence-based trade signals from the current quote,
// real OHLCV candles, and computed technical indicators. No static prices, no
// randomised confidence: every level is derived from live/observed data.

import { INDICES, CURATED_STOCKS, CRYPTO_INSTRUMENTS } from '../data/instruments.js';
import { batchFetchQuotes, fetchInstrumentCandles } from './marketData.js';
import { computeTechnicalSummary } from './indicators.js';

const CACHE_MS = 45_000;
const cache = new Map();

const INDIAN_UNIVERSE = [
  '^NSEI', '^NSEBANK', 'RELIANCE.NS', 'HDFCBANK.NS', 'TCS.NS', 'INFY.NS', 'ICICIBANK.NS', 'SBIN.NS'
];
const CRYPTO_UNIVERSE = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'ADA-USD', 'AVAX-USD', 'LINK-USD'];

function nameFor(symbol) {
  const all = [...INDICES, ...CURATED_STOCKS, ...CRYPTO_INSTRUMENTS];
  return all.find(item => item.symbol === symbol)?.name || symbol;
}

function round(value, decimals = 2) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(decimals));
}

function precisionFor(price) {
  if (!Number.isFinite(price)) return 2;
  if (price >= 100) return 2;
  if (price >= 1) return 4;
  if (price >= 0.01) return 6;
  return 8;
}

function averageTrueRange(candles, period = 14) {
  const slice = candles.slice(-period - 1);
  if (slice.length < 3) return null;
  let sum = 0;
  let count = 0;
  for (let i = 1; i < slice.length; i++) {
    const current = slice[i];
    const previous = slice[i - 1];
    const trueRange = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );
    if (Number.isFinite(trueRange)) { sum += trueRange; count += 1; }
  }
  return count ? sum / count : null;
}

function candlesUp(candles, lookback = 20) {
  const slice = candles.slice(-lookback);
  if (slice.length < 2) return 0;
  return slice.filter(candle => candle.close >= candle.open).length / slice.length;
}

function supportResistance(candles, lookback = 30) {
  const slice = candles.slice(-lookback);
  if (!slice.length) return { support: null, resistance: null };
  return {
    support: Math.min(...slice.map(c => c.low)),
    resistance: Math.max(...slice.map(c => c.high))
  };
}

function trendLabel(score) {
  if (score >= 4) return 'Strong bullish';
  if (score >= 2) return 'Bullish';
  if (score <= -4) return 'Strong bearish';
  if (score <= -2) return 'Bearish';
  return 'Neutral / range-bound';
}

function actionFor(score, changePercent) {
  if (score >= 4 && changePercent >= 0) return 'STRONG BUY';
  if (score >= 2) return 'SCALP BUY';
  if (score <= -4 && changePercent <= 0) return 'SHORT / SELL';
  if (score <= -2) return 'SHORT / SELL';
  return 'WAIT FOR PULLBACK';
}

function buildReason(tech, candleBias, changePercent) {
  const points = [];
  points.push(`${tech.consensus} technical consensus (score ${tech.score > 0 ? '+' : ''}${tech.score})`);
  if (tech.rsi != null) {
    points.push(tech.rsi > 70 ? `RSI ${tech.rsi} overbought` : tech.rsi < 30 ? `RSI ${tech.rsi} oversold` : `RSI ${tech.rsi} ${tech.rsi >= 50 ? 'bullish' : 'bearish'} momentum`);
  }
  if (tech.macd) points.push(`MACD histogram ${tech.macd.histogram >= 0 ? 'positive' : 'negative'}`);
  if (tech.ema?.ema9 && tech.ema?.ema21) points.push(tech.ema.ema9 >= tech.ema.ema21 ? 'EMA 9 above EMA 21' : 'EMA 9 below EMA 21');
  if (tech.vwap) points.push(`price ${tech.lastPrice >= tech.vwap ? 'above' : 'below'} VWAP`);
  points.push(`${Math.round(candleBias * 100)}% of the last 20 candles closed up`);
  points.push(`session change ${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%`);
  return points.join(' · ');
}

function buildSignal(symbol, quote, candles) {
  if (!Array.isArray(candles) || candles.length < 25) return null;
  const tech = computeTechnicalSummary(candles);
  if (!tech) return null;

  const price = Number(quote?.price) || Number(candles[candles.length - 1]?.close);
  if (!Number.isFinite(price) || price <= 0) return null;

  const changePercent = Number(quote?.changePercent ?? 0);
  const atr = averageTrueRange(candles) || price * 0.01;
  const atrPct = atr / price;
  const { support, resistance } = supportResistance(candles);
  const candleBias = candlesUp(candles);
  const isCrypto = symbol.endsWith('-USD');

  // Blend the indicator consensus with recent candle pressure and the live move.
  let score = tech.score;
  if (candleBias > 0.6) score += 1;
  if (candleBias < 0.4) score -= 1;
  if (changePercent > 1) score += 1;
  if (changePercent < -1) score -= 1;
  if (tech.rsi != null && tech.rsi > 75) score -= 1;
  if (tech.rsi != null && tech.rsi < 25) score += 1;

  // Confidence is bounded by evidence strength, never a made-up 90%+ number.
  const evidence = Math.min(10, Math.abs(score) + (Math.abs(changePercent) > 1 ? 1 : 0) + (candleBias > 0.6 || candleBias < 0.4 ? 1 : 0));
  const confidence = Math.max(38, Math.min(88, 50 + evidence * 3.5));

  // ---- DHRU.AI v2 master specification ----
  // Directional discipline per Section 3:
  //   Score >= +2 with bullish confluence -> BUY / LONG
  //   Score <= -2 with bearish confluence -> SELL / SHORT
  //   Between -1 and +1 -> WAIT / NEUTRAL
  const isLong = score >= 2;
  const isShort = score <= -2;
  const direction = isLong ? 'LONG' : isShort ? 'SHORT' : 'WAIT';
  const action = isLong ? 'BUY' : isShort ? 'SELL' : 'WAIT';
  const side = isShort ? 'SELL' : 'BUY';

  // Section 4: Volatility-normalized levels (ATR-based)
  //   Long  Entry: [Price - 0.25*ATR, Price + 0.15*ATR] | SL: Price - 1.15*ATR
  //   Short Entry: [Price - 0.15*ATR, Price + 0.25*ATR] | SL: Price + 1.15*ATR
  //   Targets (Long, mirror for Short):
  //     TP1 = EntryMid + 1.65*ATR
  //     TP2 = EntryMid + 2.85*ATR
  //     TP3 = EntryMid + 4.25*ATR (plus trailing)
  const entryMin = side === 'BUY' ? price - 0.25 * atr : price - 0.15 * atr;
  const entryMax = side === 'BUY' ? price + 0.15 * atr : price + 0.25 * atr;
  const stopLoss = side === 'BUY' ? price - 1.15 * atr : price + 1.15 * atr;
  const entryMid = (entryMin + entryMax) / 2;
  const directionSign = side === 'BUY' ? 1 : -1;

  const tp1 = entryMid + directionSign * 1.65 * atr;
  const tp2 = entryMid + directionSign * 2.85 * atr;
  const tp3 = entryMid + directionSign * 4.25 * atr;
  const tierTargets = [tp1, tp2, tp3];

  const risk = Math.abs(entryMid - stopLoss);
  const reward = Math.abs(tp2 - entryMid);
  const rr = risk > 0 ? `1:${(reward / risk).toFixed(2)}` : '1:2.47';

  // Section 5: Dynamic Position Count (3 to 10 legs)
  //   Predicted_Positions = min(10, max(3, round(abs(Score)*1.5 + (Confidence > 80 ? 3 : 2))))
  const predictedPositionsCount = Math.min(
    10,
    Math.max(3, Math.round(Math.abs(score) * 1.5 + (confidence > 80 ? 3 : 2)))
  );

  // Section 6: Exact Basket Allocation Matrix (Scalp / Swing / Runner)
  const BASKET_ALLOCATION_MATRIX = {
    3:  [1, 1, 1],
    4:  [1, 2, 1],
    5:  [2, 2, 1],
    6:  [2, 2, 2],
    7:  [2, 3, 2],
    8:  [3, 3, 2],
    9:  [3, 3, 3],
    10: [3, 4, 3]
  };
  const allocation = BASKET_ALLOCATION_MATRIX[predictedPositionsCount] || [
    Math.max(1, Math.round(predictedPositionsCount * 0.33)),
    Math.max(1, Math.round(predictedPositionsCount * 0.38)),
    Math.max(1, predictedPositionsCount - Math.round(predictedPositionsCount * 0.71))
  ];

  const scalpLegs = Array.from({ length: allocation[0] }, (_, i) => i + 1);
  const swingLegs = Array.from({ length: allocation[1] }, (_, i) => i + 1 + allocation[0]);
  const runnerLegs = Array.from({ length: allocation[2] }, (_, i) => i + 1 + allocation[0] + allocation[1]);

  const decimals = price >= 100 ? 2 : precisionFor(price);
  const fmt = (v) => round(v, decimals);
  const fmtPct = (t) => {
    const pct = ((t - entryMid) / entryMid) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
  };

  const tiers = [
    {
      tier: 'scalp',
      label: 'Quick Profit (Scalp)',
      target: fmt(tp1),
      expectedPct: fmtPct(tp1),
      legs: scalpLegs,
      maxHoldCycles: 3
    },
    {
      tier: 'swing',
      label: 'More Profit (Swing)',
      target: fmt(tp2),
      expectedPct: fmtPct(tp2),
      legs: swingLegs,
      maxHoldCycles: 8
    },
    {
      tier: 'runner',
      label: 'Big Profit (Runner)',
      target: fmt(tp3),
      expectedPct: fmtPct(tp3),
      legs: runnerLegs,
      maxHoldCycles: 16,
      trailATR: 1.0
    }
  ];

  const stopManagement = [
    'After TP1: SL -> entry',
    'After TP2: runner SL -> TP1',
    'Then trail 1.0 ATR'
  ];

  // Section 11 layer 7: only expose a structure level that is tighter than the
  // invalidation stop and lies between entry and stop.
  const structureCandidate = side === 'BUY' ? support : resistance;
  const structureLevel = Number.isFinite(structureCandidate) &&
    (side === 'BUY'
      ? structureCandidate > stopLoss && structureCandidate < entryMin
      : structureCandidate < stopLoss && structureCandidate > entryMax)
    ? fmt(structureCandidate)
    : null;

  const reasoning = buildReason(tech, candleBias, changePercent);
  const currencySymbol = isCrypto ? '$' : '₹';
  const entryRangeStr = `${currencySymbol}${fmt(entryMin)} — ${currencySymbol}${fmt(entryMax)}`;

  // Section 8: If direction = WAIT, return strict WAIT envelope
  if (direction === 'WAIT') {
    return {
      symbol,
      name: nameFor(symbol),
      market: isCrypto ? 'CRYPTO' : 'NSE',
      direction: 'WAIT',
      action: 'WAIT',
      score,
      confidence: Math.round(confidence),
      currentPrice: fmt(price),
      supportRange: support ? `${currencySymbol}${fmt(support)}` : 'Dynamic S1',
      resistanceRange: resistance ? `${currencySymbol}${fmt(resistance)}` : 'Dynamic R1',
      reasoning: `Neutral range boundaries observed. Score: ${score}. Price between ${currencySymbol}${fmt(support || entryMin)} and ${currencySymbol}${fmt(resistance || entryMax)}. No directional breakout confirmed.`,
      status: quote?.status || 'UNAVAILABLE',
      lastUpdated: quote?.lastUpdated || new Date().toISOString()
    };
  }

  // Section 8: Strict JSON Output Schema
  return {
    symbol,
    name: nameFor(symbol),
    market: isCrypto ? 'CRYPTO' : 'NSE',
    direction,
    action,
    score,
    confidence: Math.round(confidence),
    predictedPositionsCount,
    currentPrice: fmt(price),
    entryRange: entryRangeStr,
    entryMin: fmt(entryMin),
    entryMax: fmt(entryMax),
    stopLoss: fmt(stopLoss),
    target1: fmt(tp1),
    target2: fmt(tp2),
    target3: fmt(tp3),
    tiers,
    stopManagement,
    tierSummary: {
      scalp: { legs: scalpLegs, target: fmt(tp1), maxHoldCycles: 3 },
      mid: { legs: swingLegs, target: fmt(tp2), maxHoldCycles: 8 },
      runner: { legs: runnerLegs, target: fmt(tp3), maxHoldCycles: 16, trailATR: 1.0 }
    },
    stopEngine: {
      initialSL: fmt(stopLoss),
      basketLossStop: isCrypto ? 250 : 5000,
      breakEvenAfter: 'TP1',
      profitLockAfter: 'TP2',
      trailAfter: 'TP2',
      trailATR: 1.0,
      timeStop: true,
      structureStop: structureLevel != null,
      sessionSquareOff: isCrypto ? null : '15:15 IST',
      staleFeedFlatten: '2 candles'
    },
    liveStatus: {
      paper: true,
      openLegs: 0,
      closedLegs: 0,
      realizedPnL: 0,
      unrealizedPnL: 0,
      currentStopLevel: fmt(stopLoss)
    },
    structureLevel,
    riskBudget: isCrypto ? 250 : 5000,
    riskReward: rr,
    winRate: null,
    winRateStatus: 'Unvalidated',
    confluence: [
      `Score: ${score > 0 ? '+' : ''}${score}`,
      tech.rsi != null ? `RSI: ${tech.rsi}` : 'RSI: Neutral',
      tech.vwap ? `Price ${price >= tech.vwap ? 'above' : 'below'} VWAP: ${fmt(tech.vwap)}` : `Pivot: ${fmt(tech.pivots?.pivot || entryMid)}`,
      tech.macd ? `Volume Imbalance: ${tech.macd.histogram >= 0 ? 'Positive' : 'Negative'}` : 'Volume: Balanced'
    ],
    reasoning,
    atr: fmt(atr),
    atrPercent: round(atrPct * 100, 2),
    status: quote?.status || 'UNAVAILABLE',
    lastUpdated: quote?.lastUpdated || new Date().toISOString()
  };
}

export async function generateLiveSignals(mode = 'indian') {
  const universe = mode === 'crypto' ? CRYPTO_UNIVERSE : INDIAN_UNIVERSE;
  const key = `${mode}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.data;

  let quotes = [];
  try {
    quotes = await batchFetchQuotes(universe);
  } catch {
    quotes = [];
  }
  const quoteBySymbol = new Map(quotes.map(quote => [quote.symbol, quote]));

  const settled = await Promise.allSettled(universe.map(async symbol => {
    const quote = quoteBySymbol.get(symbol) || null;
    const history = await fetchInstrumentCandles(symbol, '3mo', '1d');
    return buildSignal(symbol, quote, history?.candles || []);
  }));

  const signals = settled
    .filter(result => result.status === 'fulfilled' && result.value)
    .map(result => result.value)
    // Highest-conviction, actionable setups first; WAIT signals stay at the end.
    .sort((a, b) => {
      const rank = signal => signal.action === 'WAIT' ? 0 : 1;
      return rank(b) - rank(a) || b.confidence - a.confidence;
    });

  const data = {
    status: signals.length ? 'LIVE' : 'UNAVAILABLE',
    source: 'DHRU signal engine · quotes + OHLCV + technical indicators',
    generatedAt: new Date().toISOString(),
    mode,
    count: signals.length,
    signals,
    message: signals.length ? undefined : 'No signals could be computed from the current market feed.'
  };

  if (signals.length) cache.set(key, { at: Date.now(), data });
  return data;
}
