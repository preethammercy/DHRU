// DHRU.AI - Transparent Prediction Engine & Walk-Forward Backtester
// Generates probabilistic multi-horizon scenarios and walk-forward backtested strategy baselines.
// Strictly prevents look-ahead bias and displays model uncertainty.

export function runWalkForwardBacktest(candles, strategy = 'ema_cross') {
  if (!candles || candles.length < 50) {
    return {
      strategy,
      sampleSize: 0,
      winRate: 0,
      profitFactor: 0,
      maxDrawdownPct: 0,
      totalReturnPct: 0,
      benchmarkReturnPct: 0,
      trades: [],
      error: 'Insufficient historical candles for walk-forward validation (minimum 50 required).'
    };
  }

  const closes = candles.map(c => c.close);
  const benchmarkReturnPct = Number((((closes[closes.length - 1] - closes[0]) / closes[0]) * 100).toFixed(2));

  let inPosition = false;
  let entryPrice = 0;
  let entryIndex = 0;
  const trades = [];

  // Walk-forward sequentially from index 30 to prevent look-ahead bias
  for (let i = 30; i < candles.length - 1; i++) {
    const historicalSlice = closes.slice(0, i + 1);
    const currCandle = candles[i];
    const nextCandle = candles[i + 1];

    if (strategy === 'ema_cross') {
      // 9 EMA vs 21 EMA
      const ema9 = calculateSliceEMA(historicalSlice, 9);
      const ema21 = calculateSliceEMA(historicalSlice, 21);
      const prevEma9 = calculateSliceEMA(historicalSlice.slice(0, -1), 9);
      const prevEma21 = calculateSliceEMA(historicalSlice.slice(0, -1), 21);

      const bullishCross = prevEma9 <= prevEma21 && ema9 > ema21;
      const bearishCross = prevEma9 >= prevEma21 && ema9 < ema21;

      if (!inPosition && bullishCross) {
        // Buy on next open
        inPosition = true;
        entryPrice = nextCandle.open;
        entryIndex = i + 1;
      } else if (inPosition && bearishCross) {
        // Sell on next open
        inPosition = false;
        const exitPrice = nextCandle.open;
        const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;
        trades.push({
          entryDate: candles[entryIndex].time,
          exitDate: candles[i + 1].time,
          entryPrice,
          exitPrice,
          pnlPct: Number(pnlPct.toFixed(2)),
          win: pnlPct > 0
        });
      }
    } else if (strategy === 'rsi_reversion') {
      // Buy when RSI < 32, Exit when RSI > 60
      const rsi = calculateSliceRSI(historicalSlice, 14);

      if (!inPosition && rsi < 32) {
        inPosition = true;
        entryPrice = nextCandle.open;
        entryIndex = i + 1;
      } else if (inPosition && (rsi > 60 || (i - entryIndex >= 15))) {
        inPosition = false;
        const exitPrice = nextCandle.open;
        const pnlPct = ((exitPrice - entryPrice) / entryPrice) * 100;
        trades.push({
          entryDate: candles[entryIndex].time,
          exitDate: candles[i + 1].time,
          entryPrice,
          exitPrice,
          pnlPct: Number(pnlPct.toFixed(2)),
          win: pnlPct > 0
        });
      }
    }
  }

  // Close open position if any
  if (inPosition) {
    const last = candles[candles.length - 1];
    const pnlPct = ((last.close - entryPrice) / entryPrice) * 100;
    trades.push({
      entryDate: candles[entryIndex].time,
      exitDate: last.time,
      entryPrice,
      exitPrice: last.close,
      pnlPct: Number(pnlPct.toFixed(2)),
      win: pnlPct > 0
    });
  }

  // Calculate statistics
  const wins = trades.filter(t => t.win);
  const losses = trades.filter(t => !t.win);
  const winRate = trades.length > 0 ? Number(((wins.length / trades.length) * 100).toFixed(1)) : 0;

  const grossGain = wins.reduce((acc, t) => acc + t.pnlPct, 0);
  const grossLoss = Math.abs(losses.reduce((acc, t) => acc + t.pnlPct, 0));
  const profitFactor = grossLoss > 0 ? Number((grossGain / grossLoss).toFixed(2)) : (grossGain > 0 ? 9.9 : 0);

  // Calculate cumulative equity and max drawdown
  let cumulative = 0;
  let peak = 0;
  let maxDd = 0;
  for (const t of trades) {
    cumulative += t.pnlPct;
    if (cumulative > peak) peak = cumulative;
    const dd = peak - cumulative;
    if (dd > maxDd) maxDd = dd;
  }

  return {
    strategy,
    sampleSize: trades.length,
    winRate,
    profitFactor,
    maxDrawdownPct: Number(maxDd.toFixed(2)),
    totalReturnPct: Number(cumulative.toFixed(2)),
    benchmarkReturnPct,
    trades: trades.slice(-10).reverse(), // latest 10 trades
    disclaimer: 'Walk-forward historical results reflect past market conditions without transaction friction and do not guarantee future profits.'
  };
}

// Forecasts are withheld until the scenario method has a reproducible out-of-sample evaluation.
export function generateScenarios() {
  return null;
}
function calculateSliceEMA(slice, period) {
  const k = 2 / (period + 1);
  let ema = slice.slice(0, Math.min(period, slice.length)).reduce((a, b) => a + b, 0) / Math.min(period, slice.length);
  for (let i = period; i < slice.length; i++) {
    ema = slice[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateSliceRSI(slice, period = 14) {
  if (slice.length <= period) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = slice.length - period; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return 100 - (100 / (1 + rs));
}
