// DHRU.AI - Canonical Analysis Engine (single source of truth)
// Generates the authoritative DhruAnalysis object consumed by all UI pages,
// DHRU intelligence reports, autoTradeScanner, and execution engine.

import {
  fetchInstrumentCandles,
  fetchInstrumentQuote
} from './marketData.js';
import {
  calculateADX,
  calculateATR,
  calculateBollingerBands,
  calculateEMA,
  calculateMACD,
  calculateOBV,
  calculatePivotPoints,
  calculateRelVolume,
  calculateRSI,
  calculateSMA,
  calculateVWAP,
  validateCandles
} from './indicators.js';
import {
  detectBOS,
  detectFVG,
  detectOrderBlock,
  findNearestOpposing,
  findSwings
} from './structureEngine.js';
import {
  getCalibratedConfidence,
  runWalkForwardValidation
} from './backtestEngine.js';

const CACHE_TTL_MS = 10_000; // 10-second TTL cache per symbol
const analysisCache = new Map();

function round(value, decimals = 2) {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(decimals));
}

function precisionFor(price) {
  if (!Number.isFinite(price)) return 2;
  if (price >= 100) return 2;
  if (price >= 1) return 4;
  return 6;
}

function classifyMarket(symbol) {
  const s = String(symbol || '').toUpperCase();
  if (s.endsWith('-USD') || s.endsWith('USDT')) return 'crypto';
  if (s.endsWith('.NS') || s.endsWith('.BO') || /^\^(NSE|BSE|CNX)/.test(s)) return 'indian';
  if (s.endsWith('=X') || s.endsWith('=F')) return 'forex';
  return 'us';
}

function computeIndicatorsForTimeframe(validCandles) {
  if (!validCandles || validCandles.length < 14) return null;
  const closes = validCandles.map(c => c.close);
  const lastClose = closes[closes.length - 1];
  const lastCandle = validCandles[validCandles.length - 1];

  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, Math.min(200, closes.length));

  const rsi14 = calculateRSI(closes, 14);
  const macd = calculateMACD(closes, 12, 26, 9);
  const adx14 = calculateADX(validCandles, 14);
  const atrObj = calculateATR(validCandles, 14);
  const bollinger = calculateBollingerBands(closes, 20, 2);
  const vwap = calculateVWAP(validCandles);
  const relVolume = calculateRelVolume(validCandles, 20);
  const obvObj = calculateOBV(validCandles);

  return {
    lastPrice: lastClose,
    ema9,
    ema21,
    ema50,
    sma20,
    sma50,
    sma200,
    rsi14,
    macd,
    adx14,
    atr14: atrObj?.atr || null,
    atrPct: atrObj?.atrPct || null,
    bollinger,
    vwap,
    relVolume,
    obv: obvObj.obv,
    obvSlope: obvObj.slope,
    obvTrend: obvObj.trend,
    pivots: calculatePivotPoints(lastCandle.high, lastCandle.low, lastCandle.close)
  };
}

export async function getDhruAnalysis(symbol, forceRefresh = false) {
  const isForce = typeof forceRefresh === 'boolean' ? forceRefresh : !!forceRefresh?.forceRefresh;
  const normSymbol = String(symbol || '').trim().toUpperCase();
  const cached = analysisCache.get(normSymbol);
  if (!isForce && cached && (Date.now() - cached.cachedAt < CACHE_TTL_MS)) {
    return cached.data;
  }

  const market = classifyMarket(normSymbol);
  const isCrypto = market === 'crypto';
  const warnings = [];
  const gaps = [];

  // 1. Fetch Quote
  let quoteRaw = null;
  try {
    quoteRaw = await fetchInstrumentQuote(normSymbol);
  } catch (err) {
    warnings.push(`Quote fetch failed: ${err.message}`);
  }

  const nowEpoch = Date.now();
  const quotePrice = Number(quoteRaw?.price);
  const quoteTimestamp = Number(quoteRaw?.timestamp || nowEpoch);
  const ageMs = Math.max(0, nowEpoch - quoteTimestamp);
  const isFresh = ageMs <= 2 * 5 * 60_000; // Fresh within 2 signal candles (10 min)

  const quote = {
    price: Number.isFinite(quotePrice) && quotePrice > 0 ? quotePrice : null,
    previousClose: Number(quoteRaw?.previousClose) || quotePrice || 0,
    change: Number(quoteRaw?.change) || 0,
    changePercent: Number(quoteRaw?.changePercent) || 0,
    timestamp: quoteTimestamp,
    source: quoteRaw?.source || 'Public Feed',
    ageMs
  };

  // 2. Fetch Multi-Timeframe Intraday Candles
  // Signal: 5m, Confirm: 15m, HTF: 1h, Daily: 1d
  const [candles5mRaw, candles15mRaw, candles1hRaw, candles1dRaw] = await Promise.allSettled([
    fetchInstrumentCandles(normSymbol, '5d', '5m'),
    fetchInstrumentCandles(normSymbol, '5d', '15m'),
    fetchInstrumentCandles(normSymbol, '1mo', '60m'),
    fetchInstrumentCandles(normSymbol, '1y', '1d')
  ]);

  const val5m = validateCandles(candles5mRaw.value?.candles, isCrypto);
  const val15m = validateCandles(candles15mRaw.value?.candles, isCrypto);
  const val1h = validateCandles(candles1hRaw.value?.candles, isCrypto);
  const val1d = validateCandles(candles1dRaw.value?.candles, isCrypto);

  warnings.push(...val5m.warnings, ...val15m.warnings);
  gaps.push(...val5m.gaps);

  const candles5m = val5m.candles;
  const candles15m = val15m.candles;
  const candles1h = val1h.candles;
  const candles1d = val1d.candles;

  const candlesOk = val5m.ok && candles5m.length >= 25;

  // 3. Compute Indicators per Timeframe
  const ind5m = computeIndicatorsForTimeframe(candles5m);
  const ind15m = computeIndicatorsForTimeframe(candles15m);
  const ind1h = computeIndicatorsForTimeframe(candles1h);
  const ind1d = computeIndicatorsForTimeframe(candles1d);

  const currentPrice = quote.price || (candles5m.length ? candles5m[candles5m.length - 1].close : null);
  const precision = precisionFor(currentPrice || 100);

  // 4. Compute Real Structure on 5m signal timeframe
  const swings5m = findSwings(candles5m, 2, 2);
  const avgVolume5m = candles5m.length
    ? candles5m.slice(-20).reduce((acc, c) => acc + (c.volume || 0), 0) / Math.min(20, candles5m.length)
    : 0;

  const bos = detectBOS(candles5m, swings5m, avgVolume5m);
  const orderBlock = detectOrderBlock(candles5m, bos);
  const fvg = detectFVG(candles5m);

  const latestSwingHigh = swings5m.swingHighs.length ? swings5m.swingHighs[swings5m.swingHighs.length - 1].price : null;
  const latestSwingLow = swings5m.swingLows.length ? swings5m.swingLows[swings5m.swingLows.length - 1].price : null;

  // Preliminary direction check for opposing structure
  const preliminarySide = ind5m?.ema9 && ind5m?.ema21
    ? (ind5m.ema9 > ind5m.ema21 ? 'LONG' : 'SHORT')
    : 'WAIT';
  let nearestOpposing = findNearestOpposing(currentPrice, preliminarySide, swings5m, orderBlock, bos);

  const structure = {
    swingHigh: latestSwingHigh,
    swingLow: latestSwingLow,
    bos,
    orderBlock,
    fvg,
    nearestOpposing
  };

  // 5. Documented Multi-Factor Technical Score
  let trendScore = 0;
  let momentumScore = 0;
  let volumeScore = 0;
  let structureScore = 0;
  let volatilityScore = 0;
  let pivotsScore = 0;

  // 5.1 Trend Component ([-3.0, +3.0])
  if (ind5m?.ema9 && ind5m?.ema21 && ind5m?.ema50) {
    if (ind5m.ema9 > ind5m.ema21 && ind5m.ema21 > ind5m.ema50) trendScore += 1.5;
    else if (ind5m.ema9 < ind5m.ema21 && ind5m.ema21 < ind5m.ema50) trendScore -= 1.5;
  }
  // HTF 1h alignment
  if (ind1h?.ema9 && ind1h?.ema21) {
    if (ind1h.ema9 > ind1h.ema21) trendScore += 1.0;
    else trendScore -= 1.0;
  }
  // Daily SMA 200 alignment
  if (ind1d?.sma200 && currentPrice) {
    if (currentPrice > ind1d.sma200) trendScore += 0.5;
    else trendScore -= 0.5;
  }
  trendScore = Math.max(-3.0, Math.min(3.0, trendScore));

  // 5.2 Momentum Component ([-2.5, +2.5])
  // Regime rule 2.2: do NOT mix mean-reversion into trend score: oversold must not add a long point in a downtrend!
  const isDowntrend = trendScore < 0;
  if (ind5m?.rsi14 != null) {
    const rsi = ind5m.rsi14;
    if (rsi > 55 && rsi < 70) momentumScore += 1.0;
    else if (rsi < 45 && rsi > 30) momentumScore -= 1.0;
    else if (rsi <= 30) {
      if (!isDowntrend) momentumScore += 1.0; // only counter-trend buy if not in confirmed downtrend
      else momentumScore -= 0.5; // in downtrend, oversold is continuation/danger
    } else if (rsi >= 70) {
      if (isDowntrend) momentumScore -= 1.0;
      else momentumScore += 0.5;
    }
  }
  if (ind5m?.macd) {
    if (ind5m.macd.histogram > 0) momentumScore += 1.0;
    else momentumScore -= 1.0;
  }
  momentumScore = Math.max(-2.5, Math.min(2.5, momentumScore));

  // 5.3 Volume Component ([-2.0, +2.0])
  if (ind5m?.relVolume != null) {
    if (ind5m.relVolume >= 1.2) {
      volumeScore += trendScore >= 0 ? 1.0 : -1.0;
    }
  }
  if (ind5m?.obvTrend === 'rising') volumeScore += 0.5;
  else if (ind5m?.obvTrend === 'falling') volumeScore -= 0.5;
  // VWAP Side
  if (ind5m?.vwap && currentPrice) {
    if (currentPrice > ind5m.vwap) volumeScore += 0.5;
    else volumeScore -= 0.5;
  }
  volumeScore = Math.max(-2.0, Math.min(2.0, volumeScore));

  // 5.4 Structure Component ([-2.5, +2.5])
  if (bos) {
    if (bos.type === 'BOS_BULLISH') structureScore += 1.0;
    else if (bos.type === 'BOS_BEARISH') structureScore -= 1.0;
  }
  if (orderBlock) {
    if (orderBlock.type === 'bullish_ob') structureScore += 0.5;
    else if (orderBlock.type === 'bearish_ob') structureScore -= 0.5;
  }
  if (fvg) {
    if (fvg.type === 'bullish_fvg') structureScore += 0.5;
    else if (fvg.type === 'bearish_fvg') structureScore -= 0.5;
  }
  structureScore = Math.max(-2.5, Math.min(2.5, structureScore));

  // 5.5 Volatility Regime ([-1.5, +1.5])
  const adx5m = ind5m?.adx14 ?? 20;
  if (adx5m >= 25) volatilityScore += 0.5;
  else if (adx5m < 18) volatilityScore -= 1.0; // ranging penalty

  if (ind5m?.bollinger && currentPrice) {
    if (currentPrice > ind5m.bollinger.upper) volatilityScore += 0.5;
    else if (currentPrice < ind5m.bollinger.lower) volatilityScore -= 0.5;
  }
  volatilityScore = Math.max(-1.5, Math.min(1.5, volatilityScore));

  // 5.6 Pivots Component ([-1.0, +1.0])
  if (ind5m?.pivots && currentPrice) {
    const { pivot, r1, s1 } = ind5m.pivots;
    if (currentPrice > r1) pivotsScore += 1.0;
    else if (currentPrice < s1) pivotsScore -= 1.0;
    else if (currentPrice > pivot) pivotsScore += 0.5;
    else pivotsScore -= 0.5;
  }
  pivotsScore = Math.max(-1.0, Math.min(1.0, pivotsScore));

  const totalScore = round(
    trendScore + momentumScore + volumeScore + structureScore + volatilityScore + pivotsScore,
    2
  );

  const scoreObj = {
    total: totalScore,
    components: {
      trend: round(trendScore, 2),
      momentum: round(momentumScore, 2),
      volume: round(volumeScore, 2),
      structure: round(structureScore, 2),
      volatility: round(volatilityScore, 2),
      pivots: round(pivotsScore, 2)
    }
  };

  // 6. Regime Filter (Phase 2.3)
  const isRangeRegime = adx5m < 18;
  const regime = isRangeRegime ? 'RANGE' : 'TREND';

  // 7. Backtest & Calibrated Confidence (Phase 2.5)
  const backtestResult = runWalkForwardValidation(candles5m, { minBars: 35 });
  const confidence = getCalibratedConfidence(totalScore, backtestResult);

  // Volatility penalty: if ATR% is in top decile (> 4% crypto / > 2.5% equity), reduce confidence
  const atr5m = ind5m?.atr14 || (currentPrice ? currentPrice * 0.015 : 1);
  const atrPct5m = ind5m?.atrPct || (currentPrice ? (atr5m / currentPrice) * 100 : 1.5);
  const isHighVolatility = isCrypto ? atrPct5m > 4.5 : atrPct5m > 2.5;
  if (isHighVolatility) {
    confidence.value = Math.max(30, confidence.value - 15);
  }

  // 8. Direction & Level Derivation (Section 4 Formulas)
  const atr = atr5m;
  let direction = 'WAIT';
  let rejectReason = null;

  if (isRangeRegime) {
    direction = 'WAIT';
    rejectReason = 'ADX < 18 (ranging regime)';
  } else if (totalScore >= 2.0) {
    // Check counter-HTF requirement: needs score >= 4.0 if 1h trend is negative
    const isCounterHtf = ind1h?.ema9 && ind1h?.ema21 && ind1h.ema9 < ind1h.ema21;
    if (isCounterHtf && totalScore < 4.0) {
      direction = 'WAIT';
      rejectReason = 'Counter-HTF requires score >= 4.0';
    } else {
      direction = 'LONG';
    }
  } else if (totalScore <= -2.0) {
    // Check counter-HTF requirement
    const isCounterHtf = ind1h?.ema9 && ind1h?.ema21 && ind1h.ema9 > ind1h.ema21;
    if (isCounterHtf && Math.abs(totalScore) < 4.0) {
      direction = 'WAIT';
      rejectReason = 'Counter-HTF requires score magnitude >= 4.0';
    } else {
      direction = 'SHORT';
    }
  } else {
    direction = 'WAIT';
    rejectReason = 'Score between -2 and +2';
  }

  // Levels per Section 4 formulas
  const p = currentPrice || 0;
  let entryMin = 0;
  let entryMax = 0;
  let stopLoss = 0;
  let tp1 = 0;
  let tp2 = 0;
  let tp3 = 0;

  if (direction === 'SHORT') {
    entryMin = round(p - 0.15 * atr, precision);
    entryMax = round(p + 0.25 * atr, precision);
    stopLoss = round(p + 1.15 * atr, precision);
    tp1 = round(p - 1.65 * atr, precision);
    tp2 = round(p - 2.85 * atr, precision);
    tp3 = round(p - 4.25 * atr, precision);
  } else {
    // Default LONG or neutral range
    entryMin = round(p - 0.25 * atr, precision);
    entryMax = round(p + 0.15 * atr, precision);
    stopLoss = round(p - 1.15 * atr, precision);
    tp1 = round(p + 1.65 * atr, precision);
    tp2 = round(p + 2.85 * atr, precision);
    tp3 = round(p + 4.25 * atr, precision);
  }

  // Check nearest opposing structure: recalculate strictly with verified direction (Phase 2.4)
  if (direction !== 'WAIT') {
    nearestOpposing = findNearestOpposing(currentPrice, direction, swings5m, orderBlock, bos);
    structure.nearestOpposing = nearestOpposing;
    if (nearestOpposing && nearestOpposing.distance > 0) {
      const tp1Distance = Math.abs(tp1 - p);
      // An opposing barrier blocks the trade if it sits outside the immediate entry zone (> 0.5 * atr) but closer than TP1
      if (nearestOpposing.distance > 0.5 * atr && nearestOpposing.distance < tp1Distance) {
        direction = 'WAIT';
        rejectReason = `Nearest opposing structure (${nearestOpposing.level}) is closer than TP1`;
      }
    }
  }

  // 9. Predicted Positions Count (Phase 4.2 & Section 5)
  // keep min(10, max(3, round(|score|*1.5 + (conf>80?3:2))))
  let predictedPositionsCount = Math.min(
    10,
    Math.max(3, Math.round(Math.abs(totalScore) * 1.5 + (confidence.value > 80 ? 3 : 2)))
  );
  if (isHighVolatility) {
    predictedPositionsCount = Math.min(predictedPositionsCount, 3);
  }

  // 10. Multi-Agent Council & Quantitative Expectancy (HKUDS AI-Trader & Martex-Quant Synthesis)
  const entryMid = (entryMin + entryMax) / 2 || p;
  const slDist = Math.abs(entryMid - stopLoss) || 1;
  const tp2Dist = Math.abs(tp2 - entryMid) || 2;
  const rrNumber = round(tp2Dist / slDist, 2) || 2.48;

  const winProb = (backtestResult.winRate && backtestResult.status === 'Validated')
    ? (backtestResult.winRate / 100)
    : (confidence.value / 100);

  const expectedValueR = round(winProb * rrNumber - (1 - winProb) * 1.0, 2);
  const fullKelly = rrNumber > 0 ? (winProb * rrNumber - (1 - winProb)) / rrNumber : 0;
  const halfKelly = round(Math.max(0.005, Math.min(0.05, fullKelly / 2)), 3);

  let volatilityRegime = 'TRENDING_EXPANSION';
  if (adx5m < 18) volatilityRegime = 'RANGE_BOUND';
  else if (isHighVolatility) volatilityRegime = 'HIGH_VOL_EXHAUSTION';
  else if (ind5m?.bollinger && ind5m?.atr14 && (ind5m.bollinger.upper - ind5m.bollinger.lower) < 2.0 * ind5m.atr14) {
    volatilityRegime = 'LOW_VOL_SQUEEZE';
  }

  const quantMetrics = {
    kellyFraction: halfKelly,
    expectedValueR,
    riskRewardRatio: `1:${rrNumber.toFixed(2)}`,
    volatilityRegime,
    liquidityScore: Math.min(100, Math.round((ind5m?.relVolume || 1.0) * 50 + (quote.price ? 30 : 0)))
  };

  const agents = [
    {
      id: 'trend_agent',
      name: 'Trend & Macro Alignment Agent',
      role: 'Multi-timeframe moving average stack & HTF trend filter',
      vote: trendScore >= 1.0 ? 'BULLISH' : trendScore <= -1.0 ? 'BEARISH' : 'NEUTRAL',
      weight: 1.5,
      conviction: Math.min(100, Math.round(50 + Math.abs(trendScore) * 16)),
      insight: trendScore > 0
        ? `Bullish alignment: EMA stack (9>21>50) with ${ind1h?.ema9 > ind1h?.ema21 ? '1h HTF agreement' : 'moderate HTF'} above Daily SMA`
        : trendScore < 0
          ? `Bearish alignment: EMA stack (9<21<50) with negative HTF momentum`
          : 'Neutral: Moving averages compressed; no directional trend dominance'
    },
    {
      id: 'momentum_agent',
      name: 'Quant Momentum & Oscillator Agent',
      role: 'RSI regime, MACD expansion & momentum divergence scanner',
      vote: momentumScore >= 0.8 ? 'BULLISH' : momentumScore <= -0.8 ? 'BEARISH' : 'NEUTRAL',
      weight: 1.2,
      conviction: Math.min(100, Math.round(50 + Math.abs(momentumScore) * 20)),
      insight: ind5m?.rsi14 != null
        ? `RSI(14) at ${ind5m.rsi14.toFixed(1)}; MACD histogram ${ind5m.macd?.histogram > 0 ? 'expanding positively' : 'bearing negative pressure'}`
        : 'Momentum oscillators operating in balanced regime'
    },
    {
      id: 'volume_agent',
      name: 'Institutional Order Flow & Volume Agent',
      role: 'Volume Z-Score, session VWAP support & OBV accumulation',
      vote: volumeScore >= 0.5 ? 'BULLISH' : volumeScore <= -0.5 ? 'BEARISH' : 'NEUTRAL',
      weight: 1.2,
      conviction: Math.min(100, Math.round(50 + Math.abs(volumeScore) * 25)),
      insight: `Relative volume at ${ind5m?.relVolume?.toFixed(2) || '1.0'}x; price ${currentPrice > (ind5m?.vwap || 0) ? 'holding above' : 'below'} session VWAP with ${ind5m?.obvTrend || 'stable'} OBV`
    },
    {
      id: 'structure_agent',
      name: 'SMC Smart Money & Structure Agent',
      role: 'Break of Structure (BOS), Order Block & Fair Value Gap validation',
      vote: structureScore >= 0.5 ? 'BULLISH' : structureScore <= -0.5 ? 'BEARISH' : 'NEUTRAL',
      weight: 1.4,
      conviction: Math.min(100, Math.round(50 + Math.abs(structureScore) * 20)),
      insight: bos
        ? `${bos.type === 'BOS_BULLISH' ? 'Bullish' : 'Bearish'} BOS verified with volume; Order Block ${orderBlock ? 'demand validated' : 'formed'}`
        : 'Price trading between key institutional liquidity boundaries'
    },
    {
      id: 'regime_agent',
      name: 'Volatility Regime & ADX Gate Agent',
      role: 'ADX trend strength & Bollinger squeeze breakout detection',
      vote: adx5m >= 22 ? (trendScore > 0 ? 'BULLISH' : 'BEARISH') : 'NEUTRAL',
      weight: 1.0,
      conviction: Math.min(100, Math.round(adx5m * 2.8)),
      insight: adx5m >= 25
        ? `Strong trend regime (ADX ${adx5m.toFixed(1)}); volatility expanding favorably`
        : adx5m < 18
          ? `Ranging chop regime (ADX ${adx5m.toFixed(1)}); trend-following setups restricted`
          : `Transitioning volatility (ADX ${adx5m.toFixed(1)})`
    },
    {
      id: 'risk_agent',
      name: 'Risk Expectancy & Kelly Sizing Agent',
      role: 'Mathematical EV, Risk:Reward ratio & Kelly optimal sizing',
      vote: expectedValueR > 0.2 ? (direction === 'LONG' ? 'BULLISH' : direction === 'SHORT' ? 'BEARISH' : 'NEUTRAL') : 'NEUTRAL',
      weight: 1.0,
      conviction: Math.min(100, Math.round(Math.max(50, 50 + expectedValueR * 25))),
      insight: `Expected Value: ${expectedValueR > 0 ? '+' : ''}${expectedValueR} R; Half-Kelly optimal risk allocation calculated at ${(halfKelly * 100).toFixed(1)}%`
    }
  ];

  const bullishCount = agents.filter(a => a.vote === 'BULLISH').length;
  const bearishCount = agents.filter(a => a.vote === 'BEARISH').length;
  const neutralCount = agents.filter(a => a.vote === 'NEUTRAL').length;
  const dominantVotes = Math.max(bullishCount, bearishCount);
  const agreementPercent = Math.round((dominantVotes / agents.length) * 100);
  const consensusDirection = bullishCount > bearishCount ? 'BULLISH' : bearishCount > bullishCount ? 'BEARISH' : 'NEUTRAL';

  const council = {
    summary: `${dominantVotes} of ${agents.length} Quantitative Agents confirm ${consensusDirection} bias (${agreementPercent}% multi-agent agreement).`,
    consensusDirection,
    agreementPercent,
    agents
  };

  const asOf = new Date(nowEpoch).toISOString();

  const dhruAnalysis = {
    symbol: normSymbol,
    market,
    asOf,
    asOfEpoch: nowEpoch,
    quote,
    timeframes: {
      signal: '5m',
      confirm: '15m',
      htf: '1h',
      daily: '1d'
    },
    indicators: {
      '5m': ind5m,
      '15m': ind15m,
      '1h': ind1h,
      '1d': ind1d
    },
    structure,
    score: scoreObj,
    confidence,
    direction,
    regime,
    council,
    quantMetrics,
    rejectReason: direction === 'WAIT' ? rejectReason : null,
    levels: {
      entryMin,
      entryMax,
      stopLoss,
      tp1,
      tp2,
      tp3
    },
    predictedPositionsCount,
    backtest: {
      winRate: backtestResult.winRate,
      samples: backtestResult.samples,
      status: backtestResult.status,
      profitFactor: backtestResult.profitFactor,
      avgR: backtestResult.avgR
    },
    dataQuality: {
      fresh: isFresh,
      candlesOk,
      gaps,
      warnings
    }
  };

  analysisCache.set(normSymbol, { data: dhruAnalysis, cachedAt: nowEpoch });
  return dhruAnalysis;
}

export function clearAnalysisCache(symbol) {
  if (symbol) analysisCache.delete(symbol.toUpperCase());
  else analysisCache.clear();
}

export const getCanonicalAnalysis = getDhruAnalysis;

