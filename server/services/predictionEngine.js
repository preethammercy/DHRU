// Transparent short-horizon scenario calculator and walk-forward backtester.

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

// Rolling recent-return drift with a historical volatility envelope. This is a
// live descriptive model, not a calibrated probability forecast or trade signal.
export function generateScenarios(quote, candles, interval = '5m', generatedAt = Date.now()) {
  const price = Number(quote?.price);
  const validCandles = Array.isArray(candles)
    ? candles.filter(c => Number.isFinite(Number(c?.close)) && Number(c.close) > 0).slice(-61)
    : [];
  if (!Number.isFinite(price) || price <= 0 || validCandles.length < 25) {
    return {
      status: 'insufficient_data',
      symbol: quote?.symbol || null,
      interval,
      observations: validCandles.length,
      requiredObservations: 25,
      generatedAt: new Date(generatedAt).toISOString(),
      message: 'At least 25 recent, valid candles and a current quote are required.'
    };
  }

  const closes = validCandles.map(c => Number(c.close));
  const returns = closes.slice(1).map((close, index) => Math.log(close / closes[index])).filter(Number.isFinite);
  const recentReturns = returns.slice(-30);
  const meanReturn = recentReturns.reduce((sum, value) => sum + value, 0) / recentReturns.length;
  const variance = recentReturns.reduce((sum, value) => sum + (value - meanReturn) ** 2, 0) / Math.max(1, recentReturns.length - 1);
  const volatility = Math.sqrt(variance);
  const fast = calculateSliceEMA(closes.slice(-40), 9);
  const slow = calculateSliceEMA(closes.slice(-40), 21);
  const trendPct = ((fast - slow) / slow) * 100;
  const bias = trendPct > 0.05 ? 'Upward recent trend' : trendPct < -0.05 ? 'Downward recent trend' : 'Mixed / range-bound';
  const steps = [3, 12];
  const horizons = steps.map(stepCount => {
    const expectedReturnPct = meanReturn * stepCount * 100;
    const envelopePct = Math.max(volatility * Math.sqrt(stepCount) * 1.96 * 100, 0.01);
    const center = price * (1 + expectedReturnPct / 100);
    const range = price * envelopePct / 100;
    return {
      label: stepCount === 3 ? '15 minutes' : '1 hour',
      bars: stepCount,
      center: Number(center.toFixed(price < 1 ? 6 : 2)),
      low: Number((center - range).toFixed(price < 1 ? 6 : 2)),
      high: Number((center + range).toFixed(price < 1 ? 6 : 2)),
      expectedMovePct: Number(expectedReturnPct.toFixed(3)),
      historicalEnvelopePct: Number(envelopePct.toFixed(3))
    };
  });

  return {
    status: 'ready',
    symbol: quote.symbol,
    interval,
    price,
    currency: quote.currency || 'INR',
    source: quote.source || 'Source unavailable',
    quoteAsOf: quote.lastUpdated || null,
    generatedAt: new Date(generatedAt).toISOString(),
    observations: closes.length,
    model: 'Recent return drift + historical volatility envelope',
    bias,
    trendPct: Number(trendPct.toFixed(3)),
    horizons,
    disclaimer: 'Experimental descriptive scenarios. The volatility envelope is not a calibrated probability interval, and the model does not recommend a trade.'
  };
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
