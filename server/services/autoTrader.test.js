import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createAutoTrader,
  adaptiveTrail,
  computeQty,
  normalizeSymbol,
  validateConfig,
  DEFAULT_CONFIG,
} from './autoTrader.js';

function makeClock(iso) {
  let t = new Date(iso);
  return { now: () => t, set: (s) => { t = new Date(s); } };
}

test('sizes by risk and caps by allocation', () => {
  // risk 1000 / stop distance 20 = 50 shares; allocation 33,333 / 1000 = 33 shares
  assert.equal(computeQty(DEFAULT_CONFIG, 1000), 33);
});

test('normalizes symbols', () => {
  assert.equal(normalizeSymbol('reliance'), 'RELIANCE.NS');
  assert.equal(normalizeSymbol('^NSEI'), '^NSEI');
  assert.equal(normalizeSymbol('M&M'), 'M&M.NS');
  assert.throws(() => normalizeSymbol('BAD SYMBOL'));
});

test('rejects out-of-range config', () => {
  assert.throws(() => validateConfig({ riskPerTradePct: 99 }), RangeError);
});

test('opening is blocked while paused', () => {
  const clock = makeClock('2025-01-01T05:00:00Z');
  const t = createAutoTrader({}, { now: clock.now });
  assert.throws(() => t.open('RELIANCE', 1000), /paused/);
});

test('initial stop-loss exits a losing trade', () => {
  const clock = makeClock('2025-01-01T05:00:00Z');
  const t = createAutoTrader({}, { now: clock.now });
  t.setEnabled(true);
  t.open('RELIANCE', 1000); // stop at 980
  t.tick({ 'RELIANCE.NS': 979 });
  const [trade] = t.snapshot().closed;
  assert.equal(trade.reason, 'STOP_LOSS');
  assert.ok(trade.pnl < 0);
});

test('trailing stop locks in profit and never moves down', () => {
  const clock = makeClock('2025-01-01T05:00:00Z');
  const t = createAutoTrader({ takeProfitPct: 0 }, { now: clock.now });
  t.setEnabled(true);
  t.open('RELIANCE', 1000);
  t.tick({ 'RELIANCE.NS': 1100 }); // day gain 3.3% -> PROTECT mode, trail 0.75%
  const stopAfterRally = t.snapshot().positions[0].stop;
  assert.ok(stopAfterRally > 1090);

  t.tick({ 'RELIANCE.NS': 1095 }); // still above stop, stop must not fall
  assert.equal(t.snapshot().positions[0].stop, stopAfterRally);

  t.tick({ 'RELIANCE.NS': 1090 }); // below trailing stop
  const [trade] = t.snapshot().closed;
  assert.equal(trade.reason, 'TRAILING_STOP');
  assert.equal(trade.pnl, 2970);
});

test('take-profit exits at target', () => {
  const clock = makeClock('2025-01-01T05:00:00Z');
  const t = createAutoTrader({}, { now: clock.now });
  t.setEnabled(true);
  t.open('RELIANCE', 1000);
  t.tick({ 'RELIANCE.NS': 1041 }); // target 1040
  assert.equal(t.snapshot().closed[0].reason, 'TAKE_PROFIT');
});

test('daily loss limit halts trading and blocks new entries', () => {
  const clock = makeClock('2025-01-01T05:00:00Z');
  const t = createAutoTrader({}, { now: clock.now });
  t.setEnabled(true);
  t.open('RELIANCE', 1000);
  t.tick({ 'RELIANCE.NS': 900 }); // stop-loss realises -3,300 = -3.3% of day
  const snap = t.snapshot();
  assert.equal(snap.killed, true);
  assert.equal(snap.status, 'HALTED');
  assert.throws(() => t.open('TCS', 3000), /Daily loss limit/);
});

test('session rollover resets the daily loss halt', () => {
  const clock = makeClock('2025-01-01T05:00:00Z');
  const t = createAutoTrader({}, { now: clock.now });
  t.setEnabled(true);
  t.open('RELIANCE', 1000);
  t.tick({ 'RELIANCE.NS': 900 });
  assert.equal(t.snapshot().killed, true);

  clock.set('2025-01-02T05:00:00Z');
  t.tick({});
  assert.equal(t.snapshot().killed, false);
  assert.doesNotThrow(() => t.open('TCS', 3000));
});

test('adaptive trail tightens by daily P&L regime', () => {
  assert.deepEqual(adaptiveTrail(1.5, 2.5, DEFAULT_CONFIG), { mode: 'PROTECT', pct: 0.75 });
  assert.deepEqual(adaptiveTrail(1.5, -2, DEFAULT_CONFIG), { mode: 'DEFENSIVE', pct: 0.9 });
  assert.deepEqual(adaptiveTrail(1.5, 0, DEFAULT_CONFIG), { mode: 'NORMAL', pct: 1.5 });
});
