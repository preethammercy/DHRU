// DHRU.AI - Technical Indicator & Candlestick Pattern Engine
// Computes genuine mathematical indicators from real OHLCV candle series.

export function calculateSMA(closes, period) {
  if (!closes || closes.length < period) return null;
  const slice = closes.slice(-period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return Number((sum / period).toFixed(2));
}

export function calculateEMA(closes, period) {
  if (!closes || closes.length < period) return null;
  const k = 2 / (period + 1);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
  }
  return Number(ema.toFixed(2));
}

export function calculateRSI(closes, period = 14) {
  if (!closes || closes.length <= period) return null;
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) {
      avgGain = (avgGain * (period - 1) + change) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(change)) / period;
    }
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Number(rsi.toFixed(2));
}

export function calculateMACD(closes, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!closes || closes.length < slowPeriod + signalPeriod) return null;

  // Calculate MACD series
  const kFast = 2 / (fastPeriod + 1);
  const kSlow = 2 / (slowPeriod + 1);
  const kSig = 2 / (signalPeriod + 1);

  let emaFast = closes.slice(0, fastPeriod).reduce((a, b) => a + b, 0) / fastPeriod;
  let emaSlow = closes.slice(0, slowPeriod).reduce((a, b) => a + b, 0) / slowPeriod;

  const macdHistory = [];
  for (let i = slowPeriod; i < closes.length; i++) {
    emaFast = closes[i] * kFast + emaFast * (1 - kFast);
    emaSlow = closes[i] * kSlow + emaSlow * (1 - kSlow);
    macdHistory.push(emaFast - emaSlow);
  }

  if (macdHistory.length < signalPeriod) return null;

  let signal = macdHistory.slice(0, signalPeriod).reduce((a, b) => a + b, 0) / signalPeriod;
  for (let i = signalPeriod; i < macdHistory.length; i++) {
    signal = macdHistory[i] * kSig + signal * (1 - kSig);
  }

  const currentMacd = macdHistory[macdHistory.length - 1];
  const histogram = currentMacd - signal;

  return {
    macd: Number(currentMacd.toFixed(2)),
    signal: Number(signal.toFixed(2)),
    histogram: Number(histogram.toFixed(2)),
    status: currentMacd > signal ? 'Bullish' : 'Bearish'
  };
}

export function calculateBollingerBands(closes, period = 20, multiplier = 2) {
  if (!closes || closes.length < period) return null;
  const slice = closes.slice(-period);
  const mean = slice.reduce((a, b) => a + b, 0) / period;
  const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = mean + multiplier * stdDev;
  const lower = mean - multiplier * stdDev;
  const lastClose = closes[closes.length - 1];
  const percentB = upper !== lower ? (lastClose - lower) / (upper - lower) : 0.5;

  return {
    upper: Number(upper.toFixed(2)),
    middle: Number(mean.toFixed(2)),
    lower: Number(lower.toFixed(2)),
    bandwidth: Number((((upper - lower) / mean) * 100).toFixed(2)),
    percentB: Number(percentB.toFixed(3))
  };
}

export function calculateVWAP(candles) {
  if (!candles || candles.length === 0) return null;
  let cumulativeTypicalVol = 0;
  let cumulativeVol = 0;

  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 1;
    cumulativeTypicalVol += typical * vol;
    cumulativeVol += vol;
  }

  if (cumulativeVol === 0) return null;
  return Number((cumulativeTypicalVol / cumulativeVol).toFixed(2));
}

export function calculatePivotPoints(high, low, close) {
  const pp = (high + low + close) / 3;
  const r1 = 2 * pp - low;
  const s1 = 2 * pp - high;
  const r2 = pp + (high - low);
  const s2 = pp - (high - low);
  const r3 = high + 2 * (pp - low);
  const s3 = low - 2 * (high - pp);

  return {
    pivot: Number(pp.toFixed(2)),
    r1: Number(r1.toFixed(2)),
    s1: Number(s1.toFixed(2)),
    r2: Number(r2.toFixed(2)),
    s2: Number(s2.toFixed(2)),
    r3: Number(r3.toFixed(2)),
    s3: Number(s3.toFixed(2))
  };
}

export function detectCandlestickPatterns(candles) {
  if (!candles || candles.length < 3) return [];
  const patterns = [];

  const curr = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const prev2 = candles[candles.length - 3];

  const bodyCurr = Math.abs(curr.close - curr.open);
  const rangeCurr = curr.high - curr.low;
  const isGreen = curr.close >= curr.open;
  const isRed = curr.close < curr.open;

  const upperShadowCurr = isGreen ? curr.high - curr.close : curr.high - curr.open;
  const lowerShadowCurr = isGreen ? curr.open - curr.low : curr.close - curr.low;

  const bodyPrev = Math.abs(prev.close - prev.open);
  const isPrevGreen = prev.close >= prev.open;
  const isPrevRed = prev.close < prev.open;

  // 1. Doji
  if (rangeCurr > 0 && bodyCurr <= rangeCurr * 0.1) {
    if (lowerShadowCurr >= rangeCurr * 0.6 && upperShadowCurr <= rangeCurr * 0.1) {
      patterns.push({
        name: 'Dragonfly Doji',
        type: 'Bullish Reversal',
        strength: 'Moderate',
        explanation: 'Buyers pushed back aggressively against intraday selling, rejecting lower prices.'
      });
    } else if (upperShadowCurr >= rangeCurr * 0.6 && lowerShadowCurr <= rangeCurr * 0.1) {
      patterns.push({
        name: 'Gravestone Doji',
        type: 'Bearish Reversal',
        strength: 'Moderate',
        explanation: 'Intraday rally was completely erased by aggressive sellers near resistance.'
      });
    } else {
      patterns.push({
        name: 'Standard Doji',
        type: 'Indecision',
        strength: 'Neutral',
        explanation: 'Open and close are virtually equal, reflecting market equilibrium and hesitation.'
      });
    }
  }

  // 2. Hammer & Hanging Man
  if (lowerShadowCurr >= bodyCurr * 2 && upperShadowCurr <= bodyCurr * 0.3 && bodyCurr > 0) {
    if (prev.close < prev2.close) {
      patterns.push({
        name: 'Hammer',
        type: 'Bullish Reversal',
        strength: 'High',
        explanation: 'Strong intraday recovery after a downward drift shows institutional buying support.'
      });
    } else {
      patterns.push({
        name: 'Hanging Man',
        type: 'Bearish Warning',
        strength: 'Moderate',
        explanation: 'Formed at highs; signifies buyers are losing grip as sellers easily push down intraday.'
      });
    }
  }

  // 3. Shooting Star & Inverted Hammer
  if (upperShadowCurr >= bodyCurr * 2 && lowerShadowCurr <= bodyCurr * 0.3 && bodyCurr > 0) {
    if (prev.close > prev2.close) {
      patterns.push({
        name: 'Shooting Star',
        type: 'Bearish Reversal',
        strength: 'High',
        explanation: 'Sellers rejected price at recent highs and hammered price back down to the session low.'
      });
    } else {
      patterns.push({
        name: 'Inverted Hammer',
        type: 'Bullish Reversal',
        strength: 'Moderate',
        explanation: 'Test of higher prices after a pullback; indicates early buying interest.'
      });
    }
  }

  // 4. Bullish Engulfing
  if (isPrevRed && isGreen && curr.open <= prev.close && curr.close >= prev.open && bodyCurr > bodyPrev) {
    patterns.push({
      name: 'Bullish Engulfing',
      type: 'Bullish Reversal',
      strength: 'High',
      explanation: 'Green candle completely wraps around prior red candle, indicating decisive shift to buyers.'
    });
  }

  // 5. Bearish Engulfing
  if (isPrevGreen && isRed && curr.open >= prev.close && curr.close <= prev.open && bodyCurr > bodyPrev) {
    patterns.push({
      name: 'Bearish Engulfing',
      type: 'Bearish Reversal',
      strength: 'High',
      explanation: 'Red candle completely overwhelms preceding green candle, signaling severe profit-taking.'
    });
  }

  // 6. Morning Star (3-candle)
  if (isPrevRed && Math.abs(prev.close - prev.open) < (prev2.high - prev2.low) * 0.3 && isGreen && curr.close > (prev2.open + prev2.close) / 2) {
    patterns.push({
      name: 'Morning Star',
      type: 'Bullish Reversal',
      strength: 'Very High',
      explanation: 'Three-candle pattern where exhaustion selling is followed by a strong recovery candle.'
    });
  }

  // 7. Marubozu
  if (rangeCurr > 0 && bodyCurr >= rangeCurr * 0.92) {
    if (isGreen) {
      patterns.push({
        name: 'Bullish Marubozu',
        type: 'Bullish Continuation',
        strength: 'High',
        explanation: 'Full-bodied green candle with almost no wicks; shows buyers controlled every minute.'
      });
    } else {
      patterns.push({
        name: 'Bearish Marubozu',
        type: 'Bearish Continuation',
        strength: 'High',
        explanation: 'Full-bodied red candle with almost no wicks; shows uninterrupted institutional selling.'
      });
    }
  }

  return patterns;
}

export function computeTechnicalSummary(candles) {
  if (!candles || candles.length < 20) return null;
  const closes = candles.map(c => c.close);
  const lastClose = closes[closes.length - 1];
  const lastCandle = candles[candles.length - 1];

  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);
  const sma200 = calculateSMA(closes, 200);

  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);

  const rsi = calculateRSI(closes, 14);
  const macd = calculateMACD(closes, 12, 26, 9);
  const bb = calculateBollingerBands(closes, 20, 2);
  const vwap = calculateVWAP(candles);

  const pivots = calculatePivotPoints(lastCandle.high, lastCandle.low, lastCandle.close);
  const patterns = detectCandlestickPatterns(candles);

  // Compute Consensus Score
  let score = 0;
  const signals = [];

  // Trend vs MAs
  if (sma20 && lastClose > sma20) { score += 1; signals.push('Price above 20 SMA (+)'); } else if (sma20) { score -= 1; signals.push('Price below 20 SMA (-)'); }
  if (sma50 && lastClose > sma50) { score += 1; signals.push('Price above 50 SMA (+)'); } else if (sma50) { score -= 1; signals.push('Price below 50 SMA (-)'); }
  if (sma200 && lastClose > sma200) { score += 2; signals.push('Price above 200 SMA (+)'); } else if (sma200) { score -= 2; signals.push('Price below 200 SMA (-)'); }

  // EMA Cross
  if (ema9 && ema21) {
    if (ema9 > ema21) { score += 1; signals.push('EMA 9 above EMA 21 (+)'); }
    else { score -= 1; signals.push('EMA 9 below EMA 21 (-)'); }
  }

  // RSI
  if (rsi != null) {
    if (rsi < 30) { score += 1; signals.push('RSI in Oversold Zone (Mean Reversion Potential)'); }
    else if (rsi > 70) { score -= 1; signals.push('RSI in Overbought Zone (Caution)'); }
    else if (rsi > 50) { score += 1; signals.push('RSI Bullish Momentum (>50)'); }
    else { score -= 1; signals.push('RSI Bearish Momentum (<50)'); }
  }

  // MACD
  if (macd) {
    if (macd.histogram > 0) { score += 1; signals.push('MACD Histogram Positive (+)'); }
    else { score -= 1; signals.push('MACD Histogram Negative (-)'); }
  }

  let consensus = 'Neutral';
  let badgeColor = 'amber';
  if (score >= 4) { consensus = 'Strong Buy'; badgeColor = 'emerald'; }
  else if (score >= 1) { consensus = 'Buy'; badgeColor = 'green'; }
  else if (score <= -4) { consensus = 'Strong Sell'; badgeColor = 'rose'; }
  else if (score <= -1) { consensus = 'Sell'; badgeColor = 'red'; }

  return {
    lastPrice: lastClose,
    sma: { sma20, sma50, sma200 },
    ema: { ema9, ema21 },
    rsi,
    macd,
    bollinger: bb,
    vwap,
    pivots,
    patterns,
    score,
    consensus,
    badgeColor,
    signals
  };
}
