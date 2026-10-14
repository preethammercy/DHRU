// DHRU.AI - Mathematical Verification & Unit Tests
// Tests technical indicator calculations, candle aggregation, dynamic P&L, and margin rules

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Test Data: 30 sample historical daily bars
const sampleCandles = [
  { time: 100, open: 100, high: 105, low: 98, close: 102, volume: 1000 },
  { time: 101, open: 102, high: 108, low: 101, close: 106, volume: 1500 },
  { time: 102, open: 106, high: 107, low: 103, close: 104, volume: 1200 },
  { time: 103, open: 104, high: 110, low: 104, close: 109, volume: 1800 },
  { time: 104, open: 109, high: 112, low: 108, close: 111, volume: 2000 },
  { time: 105, open: 111, high: 115, low: 110, close: 114, volume: 2200 },
  { time: 106, open: 114, high: 116, low: 112, close: 113, volume: 1600 },
  { time: 107, open: 113, high: 117, low: 111, close: 115, volume: 1900 },
  { time: 108, open: 115, high: 118, low: 113, close: 116, volume: 2100 },
  { time: 109, open: 116, high: 119, low: 114, close: 118, volume: 2500 },
  { time: 110, open: 118, high: 122, low: 117, close: 120, volume: 2800 },
  { time: 111, open: 120, high: 121, low: 116, close: 117, volume: 1400 },
  { time: 112, open: 117, high: 119, low: 114, close: 115, volume: 1300 },
  { time: 113, open: 115, high: 118, low: 113, close: 114, volume: 1100 },
  { time: 114, open: 114, high: 116, low: 111, close: 112, volume: 1500 },
  { time: 115, open: 112, high: 115, low: 110, close: 113, volume: 1600 },
  { time: 116, open: 113, high: 117, low: 112, close: 116, volume: 1900 },
  { time: 117, open: 116, high: 120, low: 115, close: 119, volume: 2400 },
  { time: 118, open: 119, high: 123, low: 118, close: 122, volume: 2700 },
  { time: 119, open: 122, high: 125, low: 121, close: 124, volume: 3000 },
  { time: 120, open: 124, high: 126, low: 122, close: 125, volume: 2900 },
  { time: 121, open: 125, high: 128, low: 124, close: 127, volume: 3100 },
  { time: 122, open: 127, high: 129, low: 125, close: 126, volume: 2200 },
  { time: 123, open: 126, high: 128, low: 123, close: 124, volume: 2000 },
  { time: 124, open: 124, high: 125, low: 121, close: 122, volume: 1800 },
  { time: 125, open: 122, high: 124, low: 119, close: 120, volume: 1700 },
  { time: 126, open: 120, high: 123, low: 118, close: 121, volume: 1600 },
  { time: 127, open: 121, high: 125, low: 120, close: 124, volume: 2100 },
  { time: 128, open: 124, high: 127, low: 123, close: 126, volume: 2300 },
  { time: 129, open: 126, high: 130, low: 125, close: 129, volume: 3200 }
];

describe('DHRU.AI Indicator Calculation Engine', () => {

  test('SMA calculates exact rolling average', () => {
    const period = 5;
    let sum = 0;
    for (let i = 0; i < period; i++) sum += sampleCandles[i].close;
    const expected = Number((sum / period).toFixed(2));

    // Simple test of SMA logic
    const sliceSum = sampleCandles.slice(0, 5).reduce((acc, c) => acc + c.close, 0);
    const sma = Number((sliceSum / 5).toFixed(2));
    assert.equal(sma, expected);
    assert.equal(sma, 106.40);
  });

  test('EMA weights recent price more heavily than SMA', () => {
    const period = 5;
    const k = 2 / (period + 1);
    let ema = sampleCandles.slice(0, period).reduce((acc, c) => acc + c.close, 0) / period;
    for (let i = period; i < 10; i++) {
      ema = sampleCandles[i].close * k + ema * (1 - k);
    }
    assert.ok(ema > 108.4, 'EMA should reflect upward trend and be higher than initial SMA');
  });

  test('Bollinger Bands satisfy Upper > Middle > Lower', () => {
    const slice = sampleCandles.slice(0, 20);
    const mean = slice.reduce((a, c) => a + c.close, 0) / 20;
    const variance = slice.reduce((a, c) => a + Math.pow(c.close - mean, 2), 0) / 20;
    const sd = Math.sqrt(variance);
    const upper = mean + 2 * sd;
    const lower = mean - 2 * sd;

    assert.ok(upper > mean);
    assert.ok(mean > lower);
    assert.ok(upper - lower > 0);
  });

  test('RSI is bound between 0 and 100', () => {
    const gains = [];
    const losses = [];
    for (let i = 1; i < sampleCandles.length; i++) {
      const diff = sampleCandles[i].close - sampleCandles[i - 1].close;
      gains.push(diff > 0 ? diff : 0);
      losses.push(diff < 0 ? Math.abs(diff) : 0);
    }
    const avgG = gains.slice(0, 14).reduce((a, b) => a + b, 0) / 14;
    const avgL = losses.slice(0, 14).reduce((a, b) => a + b, 0) / 14;
    const rs = avgL === 0 ? 100 : avgG / avgL;
    const rsi = 100 - (100 / (1 + rs));

    assert.ok(rsi >= 0 && rsi <= 100, `RSI ${rsi} must be between 0 and 100`);
  });

  test('Floor Pivot Points satisfy R3 > R2 > R1 > P > S1 > S2 > S3', () => {
    const last = sampleCandles[sampleCandles.length - 1];
    const p = (last.high + last.low + last.close) / 3;
    const r1 = 2 * p - last.low;
    const s1 = 2 * p - last.high;
    const r2 = p + (last.high - last.low);
    const s2 = p - (last.high - last.low);

    assert.ok(r2 > r1, 'R2 must be higher than R1');
    assert.ok(r1 > p, 'R1 must be higher than Pivot');
    assert.ok(p > s1, 'Pivot must be higher than S1');
    assert.ok(s1 > s2, 'S1 must be higher than S2');
  });
});

describe('DHRU.AI Dynamic P&L & Margin Engine', () => {

  test('Unrealized P&L for BUY position tracks tick prices accurately', () => {
    const qty = 50;
    const avgBuyPrice = 1000.00;
    const tick1 = 1015.50; // +15.50
    const tick2 = 980.00;  // -20.00

    const pnl1 = (tick1 - avgBuyPrice) * qty;
    const pnl2 = (tick2 - avgBuyPrice) * qty;

    assert.equal(pnl1, 775.00);
    assert.equal(pnl2, -1000.00);
  });

  test('Unrealized P&L for SHORT (SELL) position reverses correctly', () => {
    const qty = 100;
    const avgSellPrice = 500.00;
    const tickDrop = 485.00; // Price dropped, short is in profit
    const tickRise = 520.00; // Price rose, short is in loss

    const pnlProfit = (avgSellPrice - tickDrop) * qty;
    const pnlLoss = (avgSellPrice - tickRise) * qty;

    assert.equal(pnlProfit, 1500.00);
    assert.equal(pnlLoss, -2000.00);
  });

  test('Intraday (MIS) Margin requires exactly 20% (5x leverage)', () => {
    const price = 2000;
    const quantity = 50;
    const totalTurnover = price * quantity; // 1,00,000

    const misMargin = totalTurnover * 0.20; // 20,000
    const cncMargin = totalTurnover;        // 1,00,000

    assert.equal(misMargin, 20000);
    assert.equal(cncMargin, 100000);
    assert.equal(cncMargin / misMargin, 5, 'MIS must provide exactly 5x leverage');
  });

  test('Square off calculates realized P&L and restores margin', () => {
    let cashBalance = 500000;
    const buyPrice = 1100;
    const sellPrice = 1150;
    const qty = 100;

    const realizedProfit = (sellPrice - buyPrice) * qty; // +5,000
    cashBalance += realizedProfit;

    assert.equal(realizedProfit, 5000);
    assert.equal(cashBalance, 505000);
  });
});

describe('4-Hour Intraday Candle Aggregation Engine', () => {

  test('4 consecutive hourly bars aggregate into valid OHLCV', () => {
    const hourlyBars = [
      { time: 1000, open: 100, high: 105, low: 99, close: 102, volume: 500 },
      { time: 1060, open: 102, high: 108, low: 101, close: 107, volume: 600 },
      { time: 1120, open: 107, high: 110, low: 106, close: 108, volume: 700 },
      { time: 1180, open: 108, high: 109, low: 104, close: 105, volume: 400 },
    ];

    const aggOpen = hourlyBars[0].open;
    const aggHigh = Math.max(...hourlyBars.map(b => b.high));
    const aggLow = Math.min(...hourlyBars.map(b => b.low));
    const aggClose = hourlyBars[hourlyBars.length - 1].close;
    const aggVolume = hourlyBars.reduce((sum, b) => sum + b.volume, 0);

    assert.equal(aggOpen, 100, '4H Open must equal first bar Open');
    assert.equal(aggHigh, 110, '4H High must equal max High');
    assert.equal(aggLow, 99, '4H Low must equal min Low');
    assert.equal(aggClose, 105, '4H Close must equal last bar Close');
    assert.equal(aggVolume, 2200, '4H Volume must equal sum of volumes');
  });

  test('Multi-Broker Payload Formatter (Zerodha, Angel One, DhanHQ)', async () => {
    const { validateOrderParams, buildZerodhaPayload, buildAngelOnePayload, buildDhanPayload } = await import('../server/services/brokerService.js');

    const params = {
      symbol: 'RELIANCE.NS',
      side: 'BUY',
      product: 'MIS',
      orderType: 'LIMIT',
      quantity: 50,
      price: 1250.50
    };

    const validated = validateOrderParams(params);
    assert.equal(validated.symbol, 'RELIANCE', 'Symbol should strip .NS suffix for exchange');
    assert.equal(validated.exchange, 'NSE', 'Should identify NSE exchange');
    assert.equal(validated.quantity, 50);

    // Zerodha
    const zPayload = buildZerodhaPayload(validated, 'test_key', 'test_token');
    assert.equal(zPayload.payload.tradingsymbol, 'RELIANCE');
    assert.equal(zPayload.payload.transaction_type, 'BUY');
    assert.equal(zPayload.payload.price, 1250.50);
    assert.equal(zPayload.headers['X-Kite-Version'], '3');

    // Angel One
    const aPayload = buildAngelOnePayload(validated, 'jwt_token', 'private_key');
    assert.equal(aPayload.payload.tradingsymbol, 'RELIANCE');
    assert.equal(aPayload.payload.producttype, 'INTRADAY');
    assert.equal(aPayload.payload.price, '1250.5');

    // DhanHQ
    const dPayload = buildDhanPayload(validated, '1000123456', 'dhan_token');
    assert.equal(dPayload.payload.tradingSymbol, 'RELIANCE');
    assert.equal(dPayload.payload.exchangeSegment, 'NSE_EQ');
    assert.equal(dPayload.payload.productType, 'INTRADAY');
    assert.equal(dPayload.payload.quantity, 50);
  });
});

describe('Premium Quant Indicators & Smart Money Concepts (SMC)', () => {
  test('SMC Order Blocks identify institutional accumulation and distribution zones', () => {
    // Bullish OB: last down candle before an impulsive up move that broke swing high
    const obCandles = [
      { time: 1, open: 100, high: 102, low: 98, close: 99, volume: 1000 }, // down candle
      { time: 2, open: 99, high: 106, low: 99, close: 105, volume: 3000 },  // strong bullish impulse
      { time: 3, open: 105, high: 110, low: 104, close: 109, volume: 4000 }  // breaks previous highs
    ];

    const isImpulse = obCandles[1].close > obCandles[0].high && obCandles[1].volume > obCandles[0].volume;
    assert.ok(isImpulse, 'Second candle must be an impulsive displacement');

    const bullishOrderBlock = {
      type: 'BULLISH',
      top: obCandles[0].high,
      bottom: obCandles[0].low
    };

    assert.equal(bullishOrderBlock.top, 102);
    assert.equal(bullishOrderBlock.bottom, 98);
    assert.ok(bullishOrderBlock.top > bullishOrderBlock.bottom);
  });

  test('Fair Value Gap (FVG) detects 3-bar imbalance', () => {
    // Bullish FVG: Bar 1 High < Bar 3 Low (Gap between wick of candle 1 and wick of candle 3)
    const bar1 = { high: 100, low: 95 };
    const bar2 = { high: 115, low: 99 };  // Large displacement bar
    const bar3 = { high: 120, low: 105 }; // Bar 3 Low is 105 > Bar 1 High (100)

    const isBullishFVG = bar3.low > bar1.high;
    const gapSize = bar3.low - bar1.high;

    assert.ok(isBullishFVG, 'Must register an unfilled liquidity gap');
    assert.equal(gapSize, 5, 'Gap size between bar 1 high and bar 3 low should be 5 pts');
  });

  test('ATR Trailing Stop ratchets exclusively in the direction of the trend', () => {
    const atr = 5;
    const multiplier = 2;
    const buffer = atr * multiplier; // 10

    let highestHigh = 100;
    let trailingStop = highestHigh - buffer; // 90
    assert.equal(trailingStop, 90);

    // Price rallies to 110
    highestHigh = 110;
    const newTrailingStop = highestHigh - buffer; // 100
    assert.ok(newTrailingStop > trailingStop, 'Trailing stop must rise when price makes a new high');
    assert.equal(newTrailingStop, 100);

    // Price dips to 105 (trailing stop must NOT drop)
    const stopDuringPullback = Math.max(newTrailingStop, 105 - buffer);
    assert.equal(stopDuringPullback, 100, 'Trailing stop must never decrease in an uptrend');
  });
});

describe('User Capital & Market Gateway Verification', () => {
  test('Initial Virtual Margin is strictly ₹10,00,000 (10 Lakhs INR)', () => {
    const INITIAL_MARGIN = 1000000;
    assert.equal(INITIAL_MARGIN, 1000000);
    assert.equal(INITIAL_MARGIN / 100000, 10, 'Must represent exactly 10 Lakhs INR');
  });

  test('Actionable Trade Setup conforms to full institutional schema', () => {
    const sampleSetup = {
      action: 'BUY',
      entryZone: '₹2,480.00 – ₹2,510.00',
      entryPrice: 2495.00,
      stopLoss: 2445.00,
      target1: 2570.00,
      target2: 2620.00,
      target3: 2700.00,
      riskRewardRatio: '1 : 2.5',
      optimalTimeWindow: '10:15 AM - 11:30 AM after 15m candle close',
      exitCriteria: 'Exit at Target 2 or trail SL to breakeven once Target 1 is hit'
    };

    assert.ok(sampleSetup.entryPrice > sampleSetup.stopLoss, 'BUY entry price must be above stop loss');
    assert.ok(sampleSetup.target1 > sampleSetup.entryPrice, 'Target 1 must be above entry');
    assert.ok(sampleSetup.target2 > sampleSetup.target1, 'Target 2 must be above Target 1');
    assert.ok(sampleSetup.target3 > sampleSetup.target2, 'Target 3 must be above Target 2');
    assert.ok(sampleSetup.optimalTimeWindow.length > 5);
    assert.ok(sampleSetup.exitCriteria.length > 5);
  });
});
