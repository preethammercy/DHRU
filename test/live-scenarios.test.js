import test from 'node:test';
import assert from 'node:assert/strict';
import { generateScenarios } from '../server/services/predictionEngine.js';

const candles = Array.from({ length: 50 }, (_, index) => {
  const close = 100 * Math.exp(index * 0.001 + Math.sin(index / 3) * 0.002);
  return { time: index * 300, open: close * 0.999, high: close * 1.002, low: close * 0.998, close };
});

test('live scenarios calculate ranges from current price and recent OHLC candles', () => {
  const quote = { symbol: 'BTC-USD', price: 100, currency: 'USD', source: 'fixture', lastUpdated: '2026-10-31T10:00:00Z' };
  const first = generateScenarios(quote, candles, '5m', Date.parse('2026-10-31T10:01:00Z'));
  const repriced = generateScenarios({ ...quote, price: 200 }, candles, '5m', Date.parse('2026-10-31T10:02:00Z'));

  assert.equal(first.status, 'ready');
  assert.equal(first.horizons.length, 2);
  assert.equal(first.source, 'fixture');
  assert.ok(first.horizons.every(horizon => horizon.low < horizon.center && horizon.center < horizon.high));
  assert.ok(Math.abs(repriced.horizons[0].center / first.horizons[0].center - 2) < 0.001);
  assert.equal('confidence' in first, false);
  assert.match(first.disclaimer, /not a calibrated probability/);
});

test('live scenarios stay unavailable with too few valid candles', () => {
  const result = generateScenarios({ symbol: 'TEST.NS', price: 100 }, candles.slice(0, 10));
  assert.equal(result.status, 'insufficient_data');
  assert.equal(result.horizons, undefined);
});
