// DHRU.AI - Mathematically Validated Technical Indicators Library
// Implements verified formulas for 22+ professional trading terminal indicators

export interface CandleData {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
export type Candle = CandleData;

export interface IndicatorValue {
  time: number | string;
  value?: number;
  [key: string]: any;
}

// 1. Simple Moving Average (SMA)
export function calculateSMA(candles: CandleData[], period: number = 20): IndicatorValue[] {
  if (candles.length < period) return [];
  const results: IndicatorValue[] = [];
  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) {
      sum -= candles[i - period].close;
    }
    if (i >= period - 1) {
      results.push({
        time: candles[i].time,
        value: Number((sum / period).toFixed(2))
      });
    }
  }
  return results;
}

// 2. Exponential Moving Average (EMA)
export function calculateEMA(candles: CandleData[], period: number = 20): IndicatorValue[] {
  if (candles.length < period) return [];
  const results: IndicatorValue[] = [];
  const k = 2 / (period + 1);

  // Initial SMA as starting point
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let prevEma = sum / period;
  results.push({ time: candles[period - 1].time, value: Number(prevEma.toFixed(2)) });

  for (let i = period; i < candles.length; i++) {
    const currentEma = candles[i].close * k + prevEma * (1 - k);
    results.push({
      time: candles[i].time,
      value: Number(currentEma.toFixed(2))
    });
    prevEma = currentEma;
  }
  return results;
}

// 3. Weighted Moving Average (WMA)
export function calculateWMA(candles: CandleData[], period: number = 20): IndicatorValue[] {
  if (candles.length < period) return [];
  const results: IndicatorValue[] = [];
  const denominator = (period * (period + 1)) / 2;

  for (let i = period - 1; i < candles.length; i++) {
    let weightedSum = 0;
    for (let j = 0; j < period; j++) {
      weightedSum += candles[i - period + 1 + j].close * (j + 1);
    }
    results.push({
      time: candles[i].time,
      value: Number((weightedSum / denominator).toFixed(2))
    });
  }
  return results;
}

// 4. Volume Weighted Moving Average (VWMA)
export function calculateVWMA(candles: CandleData[], period: number = 20): IndicatorValue[] {
  if (candles.length < period) return [];
  const results: IndicatorValue[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    let sumPV = 0;
    let sumV = 0;
    for (let j = 0; j < period; j++) {
      const c = candles[i - period + 1 + j];
      const vol = c.volume || 1;
      sumPV += c.close * vol;
      sumV += vol;
    }
    results.push({
      time: candles[i].time,
      value: sumV > 0 ? Number((sumPV / sumV).toFixed(2)) : candles[i].close
    });
  }
  return results;
}

// 5. Hull Moving Average (HMA)
// HMA = WMA(2 * WMA(n/2) - WMA(n), floor(sqrt(n)))
export function calculateHMA(candles: CandleData[], period: number = 14): IndicatorValue[] {
  if (candles.length < period + 5) return [];
  const halfPeriod = Math.floor(period / 2);
  const sqrtPeriod = Math.floor(Math.sqrt(period));

  const wmaHalf = calculateWMA(candles, halfPeriod);
  const wmaFull = calculateWMA(candles, period);

  // Align timestamps
  const diffSeries: CandleData[] = [];
  const mapFull = new Map(wmaFull.map(v => [v.time, v.value!]));

  for (const half of wmaHalf) {
    if (mapFull.has(half.time)) {
      const val = 2 * half.value! - mapFull.get(half.time)!;
      diffSeries.push({
        time: half.time,
        open: val,
        high: val,
        low: val,
        close: val
      });
    }
  }

  return calculateWMA(diffSeries, sqrtPeriod);
}

// 6. Supertrend (ATR * Factor with Trend Bands)
export interface SupertrendValue extends IndicatorValue {
  upper: number;
  lower: number;
  trend: 'up' | 'down';
}

export function calculateSupertrend(
  candles: CandleData[],
  period: number = 10,
  multiplier: number = 3
): SupertrendValue[] {
  if (candles.length < period + 1) return [];

  // Calculate True Range
  const tr: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(hl, hc, lc));
  }

  // Calculate initial ATR
  let atr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const atrs: number[] = new Array(period - 1).fill(0);
  atrs.push(atr);

  for (let i = period; i < candles.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    atrs.push(atr);
  }

  const results: SupertrendValue[] = [];
  let prevUpper = 0;
  let prevLower = 0;
  let prevTrend: 'up' | 'down' = 'up';

  for (let i = period - 1; i < candles.length; i++) {
    const c = candles[i];
    const currentAtr = atrs[i];
    const hl2 = (c.high + c.low) / 2;

    let basicUpper = hl2 + multiplier * currentAtr;
    let basicLower = hl2 - multiplier * currentAtr;

    let finalUpper = basicUpper;
    let finalLower = basicLower;

    if (i > period - 1) {
      const prevClose = candles[i - 1].close;
      finalUpper = (basicUpper < prevUpper || prevClose > prevUpper) ? basicUpper : prevUpper;
      finalLower = (basicLower > prevLower || prevClose < prevLower) ? basicLower : prevLower;
    }

    let trend: 'up' | 'down' = prevTrend;
    if (prevTrend === 'up' && c.close < finalLower) {
      trend = 'down';
    } else if (prevTrend === 'down' && c.close > finalUpper) {
      trend = 'up';
    }

    const value = trend === 'up' ? finalLower : finalUpper;
    results.push({
      time: c.time,
      value: Number(value.toFixed(2)),
      upper: Number(finalUpper.toFixed(2)),
      lower: Number(finalLower.toFixed(2)),
      trend
    });

    prevUpper = finalUpper;
    prevLower = finalLower;
    prevTrend = trend;
  }

  return results;
}

// 7. Bollinger Bands (SMA +/- 2 * StdDev)
export interface BollingerBandsValue extends IndicatorValue {
  upper: number;
  middle: number;
  lower: number;
}

export function calculateBollingerBands(
  candles: CandleData[],
  period: number = 20,
  stdDevMult: number = 2
): BollingerBandsValue[] {
  if (candles.length < period) return [];
  const results: BollingerBandsValue[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const mean = slice.reduce((sum, c) => sum + c.close, 0) / period;
    const variance = slice.reduce((sum, c) => sum + Math.pow(c.close - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);

    results.push({
      time: candles[i].time,
      middle: Number(mean.toFixed(2)),
      upper: Number((mean + stdDevMult * sd).toFixed(2)),
      lower: Number((mean - stdDevMult * sd).toFixed(2)),
      value: Number(mean.toFixed(2))
    });
  }

  return results;
}

// 8. Keltner Channels (EMA +/- mult * ATR)
export interface KeltnerChannelValue extends IndicatorValue {
  upper: number;
  middle: number;
  lower: number;
}

export function calculateKeltnerChannels(
  candles: CandleData[],
  period: number = 20,
  atrMult: number = 2
): KeltnerChannelValue[] {
  if (candles.length < period) return [];
  const emaValues = calculateEMA(candles, period);
  const atrValues = calculateATR(candles, period);

  const emaMap = new Map(emaValues.map(v => [v.time, v.value!]));
  const atrMap = new Map(atrValues.map(v => [v.time, v.value!]));

  const results: KeltnerChannelValue[] = [];
  for (const c of candles) {
    if (emaMap.has(c.time) && atrMap.has(c.time)) {
      const mid = emaMap.get(c.time)!;
      const atr = atrMap.get(c.time)!;
      results.push({
        time: c.time,
        middle: Number(mid.toFixed(2)),
        upper: Number((mid + atrMult * atr).toFixed(2)),
        lower: Number((mid - atrMult * atr).toFixed(2)),
        value: Number(mid.toFixed(2))
      });
    }
  }
  return results;
}

// 9. Donchian Channels (Highest High, Lowest Low, Mid)
export interface DonchianChannelValue extends IndicatorValue {
  upper: number;
  middle: number;
  lower: number;
}

export function calculateDonchianChannels(candles: CandleData[], period: number = 20): DonchianChannelValue[] {
  if (candles.length < period) return [];
  const results: DonchianChannelValue[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const upper = Math.max(...slice.map(c => c.high));
    const lower = Math.min(...slice.map(c => c.low));
    const mid = (upper + lower) / 2;

    results.push({
      time: candles[i].time,
      upper: Number(upper.toFixed(2)),
      middle: Number(mid.toFixed(2)),
      lower: Number(lower.toFixed(2)),
      value: Number(mid.toFixed(2))
    });
  }
  return results;
}

// 10. Volume Weighted Average Price (VWAP)
export function calculateVWAP(candles: CandleData[]): IndicatorValue[] {
  let cumulativePV = 0;
  let cumulativeVol = 0;
  const results: IndicatorValue[] = [];

  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    const vol = c.volume || 1;
    cumulativePV += typicalPrice * vol;
    cumulativeVol += vol;

    results.push({
      time: c.time,
      value: Number((cumulativePV / cumulativeVol).toFixed(2))
    });
  }
  return results;
}

// 11. Parabolic SAR (Stop and Reverse)
export function calculateParabolicSAR(
  candles: CandleData[],
  step: number = 0.02,
  maxStep: number = 0.2
): IndicatorValue[] {
  if (candles.length < 3) return [];
  const results: IndicatorValue[] = [];

  let isBull = candles[1].close > candles[0].close;
  let sar = isBull ? candles[0].low : candles[0].high;
  let ep = isBull ? candles[0].high : candles[0].low;
  let af = step;

  results.push({ time: candles[0].time, value: Number(sar.toFixed(2)) });

  for (let i = 1; i < candles.length; i++) {
    const c = candles[i];
    const prevC = candles[i - 1];

    sar = sar + af * (ep - sar);

    if (isBull) {
      if (i >= 2) sar = Math.min(sar, candles[i - 1].low, candles[i - 2].low);
      else sar = Math.min(sar, prevC.low);

      if (c.low < sar) {
        // Reverse to Bear
        isBull = false;
        sar = ep;
        ep = c.low;
        af = step;
      } else {
        if (c.high > ep) {
          ep = c.high;
          af = Math.min(af + step, maxStep);
        }
      }
    } else {
      if (i >= 2) sar = Math.max(sar, candles[i - 1].high, candles[i - 2].high);
      else sar = Math.max(sar, prevC.high);

      if (c.high > sar) {
        // Reverse to Bull
        isBull = true;
        sar = ep;
        ep = c.high;
        af = step;
      } else {
        if (c.low < ep) {
          ep = c.low;
          af = Math.min(af + step, maxStep);
        }
      }
    }

    results.push({
      time: c.time,
      value: Number(sar.toFixed(2))
    });
  }

  return results;
}

// 12. Standard & Fibonacci Pivot Points
export interface PivotPointsResult {
  p: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
  fibR1: number;
  fibR2: number;
  fibR3: number;
  fibS1: number;
  fibS2: number;
  fibS3: number;
}

export function calculatePivotPoints(high: number, low: number, close: number): PivotPointsResult {
  const p = (high + low + close) / 3;
  const range = high - low;

  return {
    // Standard Floor Pivots
    p: Number(p.toFixed(2)),
    r1: Number((2 * p - low).toFixed(2)),
    r2: Number((p + range).toFixed(2)),
    r3: Number((high + 2 * (p - low)).toFixed(2)),
    s1: Number((2 * p - high).toFixed(2)),
    s2: Number((p - range).toFixed(2)),
    s3: Number((low - 2 * (high - p)).toFixed(2)),
    // Fibonacci Pivots
    fibR1: Number((p + 0.382 * range).toFixed(2)),
    fibR2: Number((p + 0.618 * range).toFixed(2)),
    fibR3: Number((p + 1.000 * range).toFixed(2)),
    fibS1: Number((p - 0.382 * range).toFixed(2)),
    fibS2: Number((p - 0.618 * range).toFixed(2)),
    fibS3: Number((p - 1.000 * range).toFixed(2)),
  };
}

// 13. Relative Strength Index (RSI - Wilder's smoothed)
export function calculateRSI(candles: CandleData[], period: number = 14): IndicatorValue[] {
  if (candles.length < period + 1) return [];
  const results: IndicatorValue[] = [];

  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    gains.push(diff > 0 ? diff : 0);
    losses.push(diff < 0 ? Math.abs(diff) : 0);
  }

  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  results.push({ time: candles[period].time, value: Number(rsi.toFixed(2)) });

  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
    results.push({
      time: candles[i + 1].time,
      value: Number(rsi.toFixed(2))
    });
  }

  return results;
}

// 14. MACD (Moving Average Convergence Divergence)
export interface MACDValue extends IndicatorValue {
  macd: number;
  signal: number;
  histogram: number;
}

export function calculateMACD(
  candles: CandleData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDValue[] {
  if (candles.length < slowPeriod + signalPeriod) return [];

  const fastEma = calculateEMA(candles, fastPeriod);
  const slowEma = calculateEMA(candles, slowPeriod);

  const slowMap = new Map(slowEma.map(v => [v.time, v.value!]));
  const macdLineCandles: CandleData[] = [];

  for (const fast of fastEma) {
    if (slowMap.has(fast.time)) {
      const macdVal = fast.value! - slowMap.get(fast.time)!;
      macdLineCandles.push({
        time: fast.time,
        open: macdVal,
        high: macdVal,
        low: macdVal,
        close: macdVal
      });
    }
  }

  const signalLine = calculateEMA(macdLineCandles, signalPeriod);
  const signalMap = new Map(signalLine.map(v => [v.time, v.value!]));

  const results: MACDValue[] = [];
  for (const item of macdLineCandles) {
    if (signalMap.has(item.time)) {
      const m = Number(item.close.toFixed(2));
      const s = Number(signalMap.get(item.time)!.toFixed(2));
      const h = Number((m - s).toFixed(2));

      results.push({
        time: item.time,
        macd: m,
        signal: s,
        histogram: h,
        value: m
      });
    }
  }

  return results;
}

// 15. Stochastic Oscillator (%K and %D)
export interface StochasticValue extends IndicatorValue {
  k: number;
  d: number;
}

export function calculateStochastic(
  candles: CandleData[],
  period: number = 14,
  smoothK: number = 3,
  smoothD: number = 3
): StochasticValue[] {
  if (candles.length < period) return [];
  const rawK: { time: number | string; k: number }[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const highest = Math.max(...slice.map(c => c.high));
    const lowest = Math.min(...slice.map(c => c.low));
    const range = highest - lowest;
    const k = range === 0 ? 50 : ((candles[i].close - lowest) / range) * 100;
    rawK.push({ time: candles[i].time, k });
  }

  // Smooth K
  const smoothedK: { time: number | string; k: number }[] = [];
  for (let i = smoothK - 1; i < rawK.length; i++) {
    const avgK = rawK.slice(i - smoothK + 1, i + 1).reduce((sum, item) => sum + item.k, 0) / smoothK;
    smoothedK.push({ time: rawK[i].time, k: avgK });
  }

  // Calculate %D (SMA of %K)
  const results: StochasticValue[] = [];
  for (let i = smoothD - 1; i < smoothedK.length; i++) {
    const avgD = smoothedK.slice(i - smoothD + 1, i + 1).reduce((sum, item) => sum + item.k, 0) / smoothD;
    results.push({
      time: smoothedK[i].time,
      k: Number(smoothedK[i].k.toFixed(2)),
      d: Number(avgD.toFixed(2)),
      value: Number(smoothedK[i].k.toFixed(2))
    });
  }

  return results;
}

// 16. Stochastic RSI
export function calculateStochRSI(
  candles: CandleData[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  kPeriod: number = 3,
  dPeriod: number = 3
): StochasticValue[] {
  const rsiValues = calculateRSI(candles, rsiPeriod);
  if (rsiValues.length < stochPeriod) return [];

  const pseudoCandles: CandleData[] = rsiValues.map(v => ({
    time: v.time,
    open: v.value!,
    high: v.value!,
    low: v.value!,
    close: v.value!
  }));

  return calculateStochastic(pseudoCandles, stochPeriod, kPeriod, dPeriod);
}

// 17. Commodity Channel Index (CCI)
export function calculateCCI(candles: CandleData[], period: number = 20): IndicatorValue[] {
  if (candles.length < period) return [];
  const results: IndicatorValue[] = [];

  const typicalPrices = candles.map(c => (c.high + c.low + c.close) / 3);

  for (let i = period - 1; i < candles.length; i++) {
    const slice = typicalPrices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const meanDev = slice.reduce((sum, tp) => sum + Math.abs(tp - mean), 0) / period;

    const cci = meanDev === 0 ? 0 : (typicalPrices[i] - mean) / (0.015 * meanDev);
    results.push({
      time: candles[i].time,
      value: Number(cci.toFixed(2))
    });
  }

  return results;
}

// 18. Rate of Change (ROC)
export function calculateROC(candles: CandleData[], period: number = 12): IndicatorValue[] {
  if (candles.length <= period) return [];
  const results: IndicatorValue[] = [];

  for (let i = period; i < candles.length; i++) {
    const prevClose = candles[i - period].close;
    const roc = prevClose !== 0 ? ((candles[i].close - prevClose) / prevClose) * 100 : 0;
    results.push({
      time: candles[i].time,
      value: Number(roc.toFixed(2))
    });
  }

  return results;
}

// 19. Williams %R
export function calculateWilliamsR(candles: CandleData[], period: number = 14): IndicatorValue[] {
  if (candles.length < period) return [];
  const results: IndicatorValue[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    const highest = Math.max(...slice.map(c => c.high));
    const lowest = Math.min(...slice.map(c => c.low));
    const range = highest - lowest;
    const wr = range === 0 ? -50 : ((highest - candles[i].close) / range) * -100;

    results.push({
      time: candles[i].time,
      value: Number(wr.toFixed(2))
    });
  }

  return results;
}

// 20. Money Flow Index (MFI)
export function calculateMFI(candles: CandleData[], period: number = 14): IndicatorValue[] {
  if (candles.length < period + 1) return [];
  const results: IndicatorValue[] = [];

  const typicalPrices = candles.map(c => (c.high + c.low + c.close) / 3);
  const rawMoneyFlow = typicalPrices.map((tp, idx) => tp * (candles[idx].volume || 1));

  const posFlow: number[] = [0];
  const negFlow: number[] = [0];

  for (let i = 1; i < candles.length; i++) {
    if (typicalPrices[i] > typicalPrices[i - 1]) {
      posFlow.push(rawMoneyFlow[i]);
      negFlow.push(0);
    } else if (typicalPrices[i] < typicalPrices[i - 1]) {
      posFlow.push(0);
      negFlow.push(rawMoneyFlow[i]);
    } else {
      posFlow.push(0);
      negFlow.push(0);
    }
  }

  for (let i = period; i < candles.length; i++) {
    const sumPos = posFlow.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    const sumNeg = negFlow.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);

    const mfr = sumNeg === 0 ? 100 : sumPos / sumNeg;
    const mfi = 100 - (100 / (1 + mfr));

    results.push({
      time: candles[i].time,
      value: Number(mfi.toFixed(2))
    });
  }

  return results;
}

// 21. Average True Range (ATR)
export function calculateATR(candles: CandleData[], period: number = 14): IndicatorValue[] {
  if (candles.length < period + 1) return [];
  const tr: number[] = [candles[0].high - candles[0].low];

  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(hl, hc, lc));
  }

  let atr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const results: IndicatorValue[] = [{ time: candles[period - 1].time, value: Number(atr.toFixed(2)) }];

  for (let i = period; i < candles.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    results.push({
      time: candles[i].time,
      value: Number(atr.toFixed(2))
    });
  }

  return results;
}

// 22. On-Balance Volume (OBV)
export function calculateOBV(candles: CandleData[]): IndicatorValue[] {
  if (candles.length === 0) return [];
  const results: IndicatorValue[] = [];
  let obv = 0;
  results.push({ time: candles[0].time, value: 0 });

  for (let i = 1; i < candles.length; i++) {
    const vol = candles[i].volume || 0;
    if (candles[i].close > candles[i - 1].close) {
      obv += vol;
    } else if (candles[i].close < candles[i - 1].close) {
      obv -= vol;
    }
    results.push({
      time: candles[i].time,
      value: obv
    });
  }

  return results;
}

// 23. Average Directional Index (ADX with +DI / -DI)
export interface ADXValue extends IndicatorValue {
  adx: number;
  plusDI: number;
  minusDI: number;
}

export function calculateADX(candles: CandleData[], period: number = 14): ADXValue[] {
  if (candles.length < period * 2) return [];

  const tr: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const upMove = candles[i].high - candles[i - 1].high;
    const downMove = candles[i - 1].low - candles[i].low;

    plusDM.push((upMove > downMove && upMove > 0) ? upMove : 0);
    minusDM.push((downMove > upMove && downMove > 0) ? downMove : 0);

    const hl = candles[i].high - candles[i].low;
    const hc = Math.abs(candles[i].high - candles[i - 1].close);
    const lc = Math.abs(candles[i].low - candles[i - 1].close);
    tr.push(Math.max(hl, hc, lc));
  }

  // Initial smoothed TR, +DM, -DM
  let smoothTR = tr.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothPlusDM = plusDM.slice(0, period).reduce((a, b) => a + b, 0);
  let smoothMinusDM = minusDM.slice(0, period).reduce((a, b) => a + b, 0);

  const dxList: { time: number | string; dx: number; plusDI: number; minusDI: number }[] = [];

  for (let i = period; i < tr.length; i++) {
    smoothTR = smoothTR - (smoothTR / period) + tr[i];
    smoothPlusDM = smoothPlusDM - (smoothPlusDM / period) + plusDM[i];
    smoothMinusDM = smoothMinusDM - (smoothMinusDM / period) + minusDM[i];

    const plusDI = smoothTR > 0 ? (smoothPlusDM / smoothTR) * 100 : 0;
    const minusDI = smoothTR > 0 ? (smoothMinusDM / smoothTR) * 100 : 0;
    const diSum = plusDI + minusDI;
    const dx = diSum > 0 ? (Math.abs(plusDI - minusDI) / diSum) * 100 : 0;

    dxList.push({
      time: candles[i + 1].time,
      dx,
      plusDI: Number(plusDI.toFixed(2)),
      minusDI: Number(minusDI.toFixed(2))
    });
  }

  if (dxList.length < period) return [];

  let adx = dxList.slice(0, period).reduce((sum, item) => sum + item.dx, 0) / period;
  const results: ADXValue[] = [{
    time: dxList[period - 1].time,
    adx: Number(adx.toFixed(2)),
    plusDI: dxList[period - 1].plusDI,
    minusDI: dxList[period - 1].minusDI,
    value: Number(adx.toFixed(2))
  }];

  for (let i = period; i < dxList.length; i++) {
    adx = (adx * (period - 1) + dxList[i].dx) / period;
    results.push({
      time: dxList[i].time,
      adx: Number(adx.toFixed(2)),
      plusDI: dxList[i].plusDI,
      minusDI: dxList[i].minusDI,
      value: Number(adx.toFixed(2))
    });
  }

  return results;
}

// ==========================================
// ⭐ PREMIUM INSTITUTIONAL & QUANT INDICATORS
// ==========================================

export interface OrderBlockResult {
  time: number | string;
  type: 'BULLISH_OB' | 'BEARISH_OB';
  high: number;
  low: number;
  price: number;
  value: number;
}

/**
 * Smart Money Concepts: Order Blocks Detector
 * Identifies the last opposite-close candle before an impulsive displacement break
 */
export function calculateOrderBlocks(candles: Candle[], lookback = 20, threshold = 1.4): IndicatorValue[] {
  if (!candles || candles.length < 5) return [];
  const results: IndicatorValue[] = [];

  for (let i = 2; i < candles.length - 1; i++) {
    const prevBar = candles[i];
    const nextBar = candles[i + 1];
    const prevRange = Math.abs(prevBar.high - prevBar.low);
    const nextBody = Math.abs(nextBar.close - nextBar.open);

    // Bullish OB: down candle followed by explosive displacement up
    if (prevBar.close < prevBar.open && nextBar.close > nextBar.open && nextBody > prevRange * threshold) {
      results.push({
        time: nextBar.time,
        value: Number(((prevBar.high + prevBar.low) / 2).toFixed(2))
      });
    }
    // Bearish OB: up candle followed by explosive displacement down
    else if (prevBar.close > prevBar.open && nextBar.close < nextBar.open && nextBody > prevRange * threshold) {
      results.push({
        time: nextBar.time,
        value: Number(((prevBar.high + prevBar.low) / 2).toFixed(2))
      });
    }
  }

  return results;
}

/**
 * Fair Value Gaps (FVG / Liquidity Imbalance)
 * 3-candle imbalance where Bar 1 High < Bar 3 Low (Bullish) or Bar 1 Low > Bar 3 High (Bearish)
 */
export function calculateFVG(candles: Candle[]): IndicatorValue[] {
  if (!candles || candles.length < 3) return [];
  const results: IndicatorValue[] = [];

  for (let i = 2; i < candles.length; i++) {
    const bar1 = candles[i - 2];
    const bar3 = candles[i];

    // Bullish FVG
    if (bar3.low > bar1.high) {
      const midpoint = (bar3.low + bar1.high) / 2;
      results.push({
        time: bar3.time,
        value: Number(midpoint.toFixed(2))
      });
    }
    // Bearish FVG
    else if (bar3.high < bar1.low) {
      const midpoint = (bar3.high + bar1.low) / 2;
      results.push({
        time: bar3.time,
        value: Number(midpoint.toFixed(2))
      });
    }
  }

  return results;
}

/**
 * Ichimoku Kinko Hyo Cloud (Tenkan 9, Kijun 26)
 */
export function calculateIchimoku(candles: Candle[], tenkanPeriod = 9, kijunPeriod = 26): {
  tenkan: IndicatorValue[];
  kijun: IndicatorValue[];
} {
  const tenkan: IndicatorValue[] = [];
  const kijun: IndicatorValue[] = [];

  for (let i = 0; i < candles.length; i++) {
    if (i >= tenkanPeriod - 1) {
      const slice = candles.slice(i - tenkanPeriod + 1, i + 1);
      const high = Math.max(...slice.map(c => c.high));
      const low = Math.min(...slice.map(c => c.low));
      tenkan.push({ time: candles[i].time, value: Number(((high + low) / 2).toFixed(2)) });
    }
    if (i >= kijunPeriod - 1) {
      const slice = candles.slice(i - kijunPeriod + 1, i + 1);
      const high = Math.max(...slice.map(c => c.high));
      const low = Math.min(...slice.map(c => c.low));
      kijun.push({ time: candles[i].time, value: Number(((high + low) / 2).toFixed(2)) });
    }
  }

  return { tenkan, kijun };
}

/**
 * ATR Volatility Trailing Stop
 */
export function calculateAtrTrailingStop(candles: Candle[], period = 14, multiplier = 2.5): IndicatorValue[] {
  const atrValues = calculateATR(candles, period);
  if (atrValues.length === 0) return [];

  const results: IndicatorValue[] = [];
  let trailingStop = candles[period].close - (atrValues[0].value * multiplier);

  for (let i = period; i < candles.length; i++) {
    const close = candles[i].close;
    const atr = atrValues[i - period]?.value || atrValues[atrValues.length - 1].value;
    const stopDistance = atr * multiplier;

    if (close > trailingStop) {
      trailingStop = Math.max(trailingStop, close - stopDistance);
    } else {
      trailingStop = Math.min(trailingStop, close + stopDistance);
    }

    results.push({
      time: candles[i].time,
      value: Number(trailingStop.toFixed(2))
    });
  }

  return results;
}

/**
 * Chaikin Money Flow (CMF 20)
 * CMF = Sum(MFV, 20) / Sum(Volume, 20)
 */
export function calculateCMF(candles: Candle[], period = 20): IndicatorValue[] {
  if (!candles || candles.length < period) return [];

  const mfvList: number[] = [];
  const volList: number[] = [];

  for (const c of candles) {
    const range = c.high - c.low;
    const mfm = range > 0 ? ((c.close - c.low) - (c.high - c.close)) / range : 0;
    const mfv = mfm * (c.volume || 1);
    mfvList.push(mfv);
    volList.push(c.volume || 1);
  }

  const results: IndicatorValue[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    let sumMfv = 0;
    let sumVol = 0;
    for (let j = 0; j < period; j++) {
      sumMfv += mfvList[i - j];
      sumVol += volList[i - j];
    }
    const cmf = sumVol > 0 ? sumMfv / sumVol : 0;
    results.push({
      time: candles[i].time,
      value: Number(cmf.toFixed(3))
    });
  }

  return results;
}

/**
 * Aroon Oscillator (25)
 * Aroon Up = ((25 - periods since 25-high) / 25) * 100
 * Aroon Down = ((25 - periods since 25-low) / 25) * 100
 * Aroon Osc = Aroon Up - Aroon Down
 */
export function calculateAroon(candles: Candle[], period = 25): IndicatorValue[] {
  if (!candles || candles.length < period) return [];
  const results: IndicatorValue[] = [];

  for (let i = period - 1; i < candles.length; i++) {
    const slice = candles.slice(i - period + 1, i + 1);
    let maxHigh = -Infinity;
    let maxHighIdx = 0;
    let minLow = Infinity;
    let minLowIdx = 0;

    for (let j = 0; j < slice.length; j++) {
      if (slice[j].high > maxHigh) {
        maxHigh = slice[j].high;
        maxHighIdx = j;
      }
      if (slice[j].low < minLow) {
        minLow = slice[j].low;
        minLowIdx = j;
      }
    }

    const periodsSinceHigh = (period - 1) - maxHighIdx;
    const periodsSinceLow = (period - 1) - minLowIdx;

    const aroonUp = ((period - periodsSinceHigh) / period) * 100;
    const aroonDown = ((period - periodsSinceLow) / period) * 100;
    const aroonOsc = aroonUp - aroonDown;

    results.push({
      time: candles[i].time,
      value: Number(aroonOsc.toFixed(2))
    });
  }

  return results;
}

/**
 * True Strength Index (TSI 13, 25)
 */
export function calculateTSI(candles: Candle[], longPeriod = 25, shortPeriod = 13): IndicatorValue[] {
  if (!candles || candles.length < longPeriod + shortPeriod) return [];

  const momentum: number[] = [];
  const absMomentum: number[] = [];

  for (let i = 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    momentum.push(diff);
    absMomentum.push(Math.abs(diff));
  }

  // Double smoothing helper
  function doubleSmooth(data: number[], p1: number, p2: number): number[] {
    const ema1: number[] = [];
    const k1 = 2 / (p1 + 1);
    let prev = data[0];
    ema1.push(prev);
    for (let i = 1; i < data.length; i++) {
      prev = data[i] * k1 + prev * (1 - k1);
      ema1.push(prev);
    }

    const ema2: number[] = [];
    const k2 = 2 / (p2 + 1);
    prev = ema1[0];
    ema2.push(prev);
    for (let i = 1; i < ema1.length; i++) {
      prev = ema1[i] * k2 + prev * (1 - k2);
      ema2.push(prev);
    }
    return ema2;
  }

  const smoothMom = doubleSmooth(momentum, longPeriod, shortPeriod);
  const smoothAbsMom = doubleSmooth(absMomentum, longPeriod, shortPeriod);

  const results: IndicatorValue[] = [];
  const offset = candles.length - smoothMom.length;

  for (let i = 0; i < smoothMom.length; i++) {
    const val = smoothAbsMom[i] > 0 ? (smoothMom[i] / smoothAbsMom[i]) * 100 : 0;
    results.push({
      time: candles[i + offset].time,
      value: Number(val.toFixed(2))
    });
  }

  return results;
}
