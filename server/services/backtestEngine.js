// DHRU.AI - Walk-Forward Backtester & Confidence Calibration Engine
// Strictly prevents look-ahead bias: at bar t, only candles [0..t] are used.
// Calculates out-of-sample trade outcomes with realistic fees and slippage.

import { calculateATR, calculateEMA, calculateSMA, calculateRSI, calculateMACD } from './indicators.js';

export const FEE_BPS = 5; // 0.05%
export const SLIPPAGE_BPS = 2; // 0.02%

/**
 * Computes a quick point-in-time score on historicalSlice [0..t]
 * without look-ahead bias.
 */
export function computeHistoricalScore(slice) {
  if (!slice || slice.length < 35) return { score: 0, atr: 0, rsi: 50 };
  const closes = slice.map(c => c.close);
  const lastClose = closes[closes.length - 1];

  const ema9 = calculateEMA(closes, 9);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const sma200 = calculateSMA(closes, Math.min(200, closes.length));
  const rsi = calculateRSI(closes, 14) ?? 50;
  const macd = calculateMACD(closes, 12, 26, 9);
  const atrObj = calculateATR(slice, 14);
  const atr = atrObj?.atr || lastClose * 0.015;

  let score = 0;

  // Trend
  if (ema9 && ema21 && ema50) {
    if (ema9 > ema21 && ema21 > ema50) score += 1.5;
    else if (ema9 < ema21 && ema21 < ema50) score -= 1.5;
  }
  if (sma200) {
    if (lastClose > sma200) score += 0.5;
    else score -= 0.5;
  }

  // Momentum (Regime rule: do NOT add long point for oversold in downtrend)
  const isDowntrend = score < 0;
  if (rsi > 55 && rsi < 70) score += 1.0;
  else if (rsi < 45 && rsi > 30) score -= 1.0;
  else if (rsi <= 30 && !isDowntrend) score += 1.0; // only counter-trend if not steep downtrend
  else if (rsi >= 70 && isDowntrend) score -= 1.0;

  if (macd) {
    if (macd.histogram > 0) score += 1.0;
    else score -= 1.0;
  }

  return { score: Number(score.toFixed(2)), atr, rsi };
}

/**
 * Runs a strict walk-forward backtest over candles.
 * Returns trades, win rate, average R, profit factor, max drawdown, and calibration table.
 */
export function runWalkForwardValidation(candles, options = {}) {
  const minBars = options.minBars ?? 35;
  const maxHoldingBars = options.maxHoldingBars ?? 20;

  if (!Array.isArray(candles) || candles.length < minBars + 15) {
    return {
      samples: 0,
      winRate: null,
      status: 'Unvalidated',
      avgR: 0,
      profitFactor: 0,
      maxDrawdownPct: 0,
      totalReturnPct: 0,
      calibrationTable: [],
      bucketConfidenceMap: {},
      trades: [],
      message: 'Insufficient historical candles for walk-forward validation (minimum 50 required).'
    };
  }

  const trades = [];
  let inTrade = false;
  let activeTrade = null;

  // Walk forward bar by bar
  for (let i = minBars; i < candles.length - 1; i++) {
    // If currently in a trade, evaluate exits first using candle i
    if (inTrade && activeTrade) {
      const c = candles[i];
      const barsHeld = i - activeTrade.entryBar;
      let exitPrice = null;
      let exitReason = null;

      if (activeTrade.side === 'LONG') {
        if (c.low <= activeTrade.stopLoss) {
          exitPrice = activeTrade.stopLoss * (1 - SLIPPAGE_BPS / 10000);
          exitReason = 'STOP_LOSS';
        } else if (c.high >= activeTrade.tp2) {
          exitPrice = activeTrade.tp2 * (1 - SLIPPAGE_BPS / 10000);
          exitReason = 'TP2';
        } else if (c.high >= activeTrade.tp1 && !activeTrade.hitTp1) {
          activeTrade.hitTp1 = true;
          // Move stop to break-even
          activeTrade.stopLoss = activeTrade.entryPrice;
        } else if (barsHeld >= maxHoldingBars) {
          exitPrice = c.close * (1 - SLIPPAGE_BPS / 10000);
          exitReason = 'TIME_EXIT';
        }
      } else { // SHORT
        if (c.high >= activeTrade.stopLoss) {
          exitPrice = activeTrade.stopLoss * (1 + SLIPPAGE_BPS / 10000);
          exitReason = 'STOP_LOSS';
        } else if (c.low <= activeTrade.tp2) {
          exitPrice = activeTrade.tp2 * (1 + SLIPPAGE_BPS / 10000);
          exitReason = 'TP2';
        } else if (c.low <= activeTrade.tp1 && !activeTrade.hitTp1) {
          activeTrade.hitTp1 = true;
          // Move stop to break-even
          activeTrade.stopLoss = activeTrade.entryPrice;
        } else if (barsHeld >= maxHoldingBars) {
          exitPrice = c.close * (1 + SLIPPAGE_BPS / 10000);
          exitReason = 'TIME_EXIT';
        }
      }

      if (exitPrice !== null) {
        // Apply fees
        const grossPnl = activeTrade.side === 'LONG'
          ? (exitPrice - activeTrade.entryPrice)
          : (activeTrade.entryPrice - exitPrice);
        const feeAmount = (activeTrade.entryPrice + exitPrice) * (FEE_BPS / 10000);
        const netPnl = grossPnl - feeAmount;
        const initialRisk = Math.abs(activeTrade.entryPrice - activeTrade.initialStopLoss);
        const rMultiple = initialRisk > 0 ? netPnl / initialRisk : 0;

        trades.push({
          entryBar: activeTrade.entryBar,
          exitBar: i,
          entryTime: activeTrade.entryTime,
          exitTime: c.time,
          side: activeTrade.side,
          scoreBucket: activeTrade.scoreBucket,
          entryPrice: activeTrade.entryPrice,
          exitPrice,
          rMultiple: Number(rMultiple.toFixed(2)),
          netPnlPct: Number(((netPnl / activeTrade.entryPrice) * 100).toFixed(2)),
          win: netPnl > 0,
          exitReason
        });

        inTrade = false;
        activeTrade = null;
      }
      continue;
    }

    // Look for new trade setup at bar i
    const slice = candles.slice(0, i + 1);
    const { score, atr } = computeHistoricalScore(slice);
    const currentPrice = candles[i].close;

    if (Math.abs(score) >= 2.0 && atr > 0) {
      const side = score >= 2.0 ? 'LONG' : 'SHORT';
      const nextCandle = candles[i + 1];

      // Entry zone per Section 4 formulas
      const entryMin = side === 'LONG' ? currentPrice - 0.25 * atr : currentPrice - 0.15 * atr;
      const entryMax = side === 'LONG' ? currentPrice + 0.15 * atr : currentPrice + 0.25 * atr;

      // Check if next candle touches entry zone
      const enters = (nextCandle.low <= entryMax && nextCandle.high >= entryMin);
      if (enters) {
        const fillPrice = side === 'LONG'
          ? Math.max(nextCandle.open, entryMin) * (1 + SLIPPAGE_BPS / 10000)
          : Math.min(nextCandle.open, entryMax) * (1 - SLIPPAGE_BPS / 10000);

        const stopLoss = side === 'LONG' ? fillPrice - 1.15 * atr : fillPrice + 1.15 * atr;
        const tp1 = side === 'LONG' ? fillPrice + 1.65 * atr : fillPrice - 1.65 * atr;
        const tp2 = side === 'LONG' ? fillPrice + 2.85 * atr : fillPrice - 2.85 * atr;

        const absScore = Math.abs(score);
        const scoreBucket = absScore >= 4.0 ? 'high' : absScore >= 3.0 ? 'mid' : 'low';

        activeTrade = {
          entryBar: i + 1,
          entryTime: nextCandle.time,
          side,
          scoreBucket,
          entryPrice: fillPrice,
          initialStopLoss: stopLoss,
          stopLoss,
          tp1,
          tp2,
          hitTp1: false
        };
        inTrade = true;
      }
    }
  }

  // Aggregate stats
  const totalTrades = trades.length;
  const wins = trades.filter(t => t.win);
  const losses = trades.filter(t => !t.win);
  const realizedWinRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

  const grossGains = wins.reduce((acc, t) => acc + Math.max(0, t.netPnlPct), 0);
  const grossLosses = Math.abs(losses.reduce((acc, t) => acc + Math.min(0, t.netPnlPct), 0));
  const profitFactor = grossLosses > 0 ? Number((grossGains / grossLosses).toFixed(2)) : (grossGains > 0 ? 9.9 : 0);
  const avgR = totalTrades > 0 ? Number((trades.reduce((acc, t) => acc + t.rMultiple, 0) / totalTrades).toFixed(2)) : 0;

  let cumulative = 0;
  let peak = 0;
  let maxDd = 0;
  for (const t of trades) {
    cumulative += t.netPnlPct;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDd) maxDd = dd;
  }

  // Calibration Buckets: low (2-3), mid (3-4), high (>=4)
  const buckets = ['low', 'mid', 'high'];
  const calibrationTable = [];
  const bucketConfidenceMap = {};

  for (const b of buckets) {
    const inBucket = trades.filter(t => t.scoreBucket === b);
    const n = inBucket.length;
    const bWins = inBucket.filter(t => t.win).length;
    const rawRate = n > 0 ? (bWins / n) * 100 : 50;
    // Shrinkage towards 50 with k=8
    const shrinkageK = 8;
    const calibrated = Math.round((bWins * 100 + 50 * shrinkageK) / (n + shrinkageK));

    calibrationTable.push({
      bucket: b,
      samples: n,
      rawHitRate: Number(rawRate.toFixed(1)),
      calibratedConfidence: calibrated
    });
    bucketConfidenceMap[b] = { samples: n, confidence: calibrated };
  }

  // Rule 3: winRate is shown ONLY when n >= 30 out-of-sample trades
  const isSampleValid = totalTrades >= 30;

  return {
    samples: totalTrades,
    winRate: isSampleValid ? Number(realizedWinRate.toFixed(1)) : null,
    status: isSampleValid ? 'Validated' : 'Unvalidated',
    avgR,
    profitFactor,
    maxDrawdownPct: Number(maxDd.toFixed(2)),
    totalReturnPct: Number(cumulative.toFixed(2)),
    calibrationTable,
    bucketConfidenceMap,
    trades: trades.slice(-15)
  };
}

/**
 * Maps a real-time score to a calibrated confidence using backtest calibration table.
 * If samples are insufficient, caps confidence at 60 and marks method 'uncalibrated'.
 */
export function getCalibratedConfidence(score, backtestResult) {
  const absScore = Math.abs(score);
  const bucket = absScore >= 4.0 ? 'high' : absScore >= 3.0 ? 'mid' : 'low';
  const bucketData = backtestResult?.bucketConfidenceMap?.[bucket];
  const totalSamples = backtestResult?.samples || 0;

  if (totalSamples < 30 || !bucketData || bucketData.samples < 10) {
    // Insufficient empirical samples: cap at 60 and label uncalibrated
    return {
      value: Math.min(60, Math.round(50 + absScore * 2.5)),
      method: 'uncalibrated',
      calibrationSamples: totalSamples
    };
  }

  return {
    value: Math.min(92, Math.max(50, bucketData.confidence)),
    method: 'walk_forward_calibrated',
    calibrationSamples: totalSamples
  };
}
