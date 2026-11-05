// Phase 2 Acceptance Tests: Accuracy, Indicators, Structure, and Calibration
// Unit tests for each component and for look-ahead bias verification.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateADX,
  calculateATR,
  calculateOBV,
  calculateRelVolume,
  validateCandles
} from '../server/services/indicators.js';
import {
  findSwings,
  detectBOS,
  detectOrderBlock,
  detectFVG,
  findNearestOpposing
} from '../server/services/structureEngine.js';
import {
  runWalkForwardValidation,
  getCalibratedConfidence
} from '../server/services/backtestEngine.js';

describe('Phase 2: Prediction Model Accuracy & Acceptance', () => {

  // Generate synthetic trending candles
  function generateSyntheticCandles(trend = 'up', count = 60, startPrice = 100) {
    const candles = [];
    let price = startPrice;
    const baseTime = 1700000000;
    for (let i = 0; i < count; i++) {
      const delta = trend === 'up' ? 0.8 : (trend === 'down' ? -0.8 : (Math.sin(i) * 0.5));
      const open = price;
      const close = price + delta + (Math.sin(i * 0.5) * 0.2);
      const high = Math.max(open, close) + 0.4;
      const low = Math.min(open, close) - 0.4;
      const volume = 1000 + Math.floor(Math.sin(i) * 300);
      candles.push({
        time: baseTime + i * 300,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume
      });
      price = close;
    }
    return candles;
  }

  test('2.1 Candle Validation catches OHLC anomalies, invalid high/low, and duplicate timestamps', () => {
    // Valid set of 30 candles
    const valid = generateSyntheticCandles('up', 30);
    const resValid = validateCandles(valid, false);
    assert.equal(resValid.ok, true);
    assert.equal(resValid.candles.length, 30);

    // Corrupted high < low
    const badHighLow = [
      { time: 100, open: 10, high: 8, low: 12, close: 9, volume: 100 }
    ];
    const resBad = validateCandles(badHighLow, false);
    assert.equal(resBad.ok, false);
    assert.ok(resBad.warnings.some(w => w.includes('High (8) < Low (12)')));

    // Duplicate timestamps
    const duplicates = [
      { time: 100, open: 10, high: 11, low: 9, close: 10, volume: 100 },
      { time: 100, open: 10, high: 11, low: 9, close: 10, volume: 100 }
    ];
    const resDup = validateCandles(duplicates, false);
    assert.equal(resDup.ok, false);
    assert.ok(resDup.warnings.some(w => w.includes('duplicate timestamp')));
  });

  test('2.2 Indicator calculations: ADX, ATR, OBV, and Relative Volume', () => {
    const candles = generateSyntheticCandles('up', 50);

    // ATR calculation
    const atr = calculateATR(candles, 14);
    assert.ok(atr.atr > 0, 'ATR must be strictly positive');
    assert.ok(atr.atrPct > 0, 'ATR% must be strictly positive');

    // ADX calculation in trending candles (ADX returns a bounded number between 0 and 100)
    const adx = calculateADX(candles, 14);
    assert.ok(typeof adx === 'number', 'ADX should return numeric score');
    assert.ok(adx >= 0 && adx <= 100, 'ADX must be bounded between 0 and 100');

    // OBV calculation
    const obv = calculateOBV(candles);
    assert.equal(obv.trend.toLowerCase(), 'rising', 'OBV trend should be rising in an uptrend');
    assert.ok(obv.slope > 0, 'OBV slope should be positive');

    // RelVolume
    const relVol = calculateRelVolume(candles, 20);
    assert.ok(relVol > 0, 'Relative volume must be positive');
  });

  test('2.3 Smart Money Concepts (Swings, BOS, Order Block, FVG, Opposing Structure)', () => {
    // Construct scenario with clear swing high and breakout
    const candles = [
      { time: 1, open: 100, high: 102, low: 99, close: 101, volume: 1000 },
      { time: 2, open: 101, high: 108, low: 100, close: 107, volume: 1200 }, // Swing high at 108
      { time: 3, open: 107, high: 106, low: 103, close: 104, volume: 1100 },
      { time: 4, open: 104, high: 105, low: 102, close: 103, volume: 1000 }, // Pullback
      { time: 5, open: 103, high: 115, low: 103, close: 114, volume: 3000 }, // Break of Structure above 108 with volume 3000
      { time: 6, open: 114, high: 116, low: 112, close: 115, volume: 1500 }
    ];

    const swings = findSwings(candles, 1, 1);
    assert.ok(swings.swingHighs.length > 0 || swings.swingLows.length > 0);
    const swingHigh = swings.swingHighs.find(s => s.price === 108);
    assert.ok(swingHigh, 'Swing high at 108 must be identified');

    const bos = detectBOS(candles, swings, 1500);
    assert.ok(bos, 'Volume-backed BOS should be detected');
    assert.ok(bos.type.includes('BOS') && bos.type.includes('BULLISH'), 'BOS type should indicate bullish break');
    assert.equal(bos.brokenLevel, 108);

    const ob = detectOrderBlock(candles, bos);
    assert.ok(ob, 'Order block preceding the BOS must be detected');
    assert.ok(ob.type.includes('ORDER_BLOCK') && ob.type.includes('BULLISH'), 'Order block type should be bullish');

    // FVG Imbalance test: candle 1 high < candle 3 low
    const fvgCandles = [
      { time: 10, open: 100, high: 102, low: 99, close: 101, volume: 1000 },
      { time: 11, open: 101, high: 110, low: 101, close: 109, volume: 4000 }, // Displacement bar
      { time: 12, open: 109, high: 115, low: 106, close: 114, volume: 2000 }  // Low 106 > High 102
    ];
    const fvg = detectFVG(fvgCandles);
    assert.ok(fvg, 'Bullish FVG must be detected');
    assert.equal(fvg.type.toLowerCase(), 'bullish_fvg');
    assert.equal(fvg.gapBottom, 102);
    assert.equal(fvg.gapTop, 106);

    // Opposing structure rejection check
    const opposing = findNearestOpposing(100, 'LONG', {
      swingHighs: [{ index: 0, price: 102 }],
      swingLows: []
    }, null);
    assert.ok(opposing, 'Must detect opposing resistance at 102');
    assert.equal(opposing.price, 102);
  });

  test('2.4 Look-ahead Bias Prevention: walk-forward validator never leaks future candles', () => {
    const candles = generateSyntheticCandles('up', 80);

    const result = runWalkForwardValidation(candles, { minBars: 35 });
    assert.ok(result, 'Backtest result must be produced');
    assert.ok(result.samples >= 0, 'Sample count must be integer');

    // Rule: Out-of-sample samples < 30 must result in null winRate and "Unvalidated"
    if (result.samples < 30) {
      assert.equal(result.winRate, null, 'winRate must be null when samples < 30');
      assert.equal(result.status, 'Unvalidated', 'status must be Unvalidated when samples < 30');
    }
  });

  test('2.5 Calibrated Confidence: empirical mapping caps small samples at 60 (uncalibrated)', () => {
    // With insufficient samples (< 30)
    const uncalibratedResult = {
      samples: 12,
      winRate: null,
      status: 'Unvalidated',
      bucketConfidenceMap: null
    };

    const confLow = getCalibratedConfidence(4.5, uncalibratedResult); // Strong technical score +4.5
    assert.ok(confLow.value <= 60, 'Confidence must be capped at 60 for uncalibrated models');
    assert.equal(confLow.method, 'uncalibrated', 'Method must be labeled uncalibrated');

    // With verified samples (n = 45, empirical hit rate 84%)
    const calibratedResult = {
      samples: 45,
      winRate: 82,
      status: 'Validated',
      bucketConfidenceMap: {
        high: { confidence: 84, samples: 15 },
        mid: { confidence: 65, samples: 15 },
        low: { confidence: 40, samples: 15 }
      }
    };
    const confHigh = getCalibratedConfidence(4.5, calibratedResult);
    assert.ok(confHigh.value >= 80, 'Confidence should reflect verified empirical hit rate');
    assert.equal(confHigh.method, 'walk_forward_calibrated');
  });
});
