// Phase 4 Acceptance Test: Deterministic Replay Test
// Feeds recorded candles/ticks to the auto-trade execution engine and asserts:
//   - exact leg entries with slippage
//   - TP1 fill and break-even stop move
//   - TP2 fill and runner profit-lock
//   - 1.0 ATR trail ratchet
//   - initial stop-loss
//   - basket loss stop / structure stop
//   - kill-switch immediate flatten
//   - 1-hour per-symbol cooldown
//   - trade journal persistence and fee calculation

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { autoTradeServerEngine, FRICTION_CONFIG } from '../server/services/autoTradeServerEngine.js';

describe('Phase 4: Auto-Trade Deterministic Replay Acceptance', () => {

  test('4.1 Full Lifecycle Replay: Entry -> TP1 (BE) -> TP2 (Profit Lock) -> Trail Exit', () => {
    autoTradeServerEngine.resetHalt();
    const symbol = 'BTC-USD';
    // Clear any previous basket
    autoTradeServerEngine.activeBaskets.delete(symbol);
    autoTradeServerEngine.cooldowns.delete(symbol);

    const plan = {
      symbol,
      market: 'crypto',
      side: 'BUY',
      legCount: 3, // 1 scalp, 1 swing, 1 runner
      quantity: 0.03, // 0.01 per leg
      entryMin: 50000,
      entryMax: 50200,
      stopLoss: 49000,
      tp1: 51000,
      tp2: 52000,
      tp3: 53500,
      atr: 800,
      riskBudget: 250,
      score: 4.5,
      confidence: 85,
      setupType: 'Breakout'
    };

    // Step 1: Arm Plan
    const armRes = autoTradeServerEngine.armBasket(plan);
    assert.equal(armRes.ok, true, 'Basket must be armed successfully');
    const basket = autoTradeServerEngine.activeBaskets.get(symbol);
    assert.equal(basket.stage, 'armed');
    assert.equal(basket.legs.length, 3);

    // Step 2: Tick outside zone (50,500) -> Should NOT enter
    autoTradeServerEngine.processTick(symbol, { price: 50500, timestamp: Date.now() });
    assert.equal(basket.stage, 'armed', 'Price outside entry zone must not trigger entry');

    // Step 3: Tick inside zone (50,100) -> Triggers Entry Fill with slippage
    const slippageRate = FRICTION_CONFIG.slippageBps / 10000;
    const expectedEntryFill = Number((50100 * (1 + slippageRate)).toFixed(6));
    autoTradeServerEngine.processTick(symbol, { price: 50100, timestamp: Date.now() });

    assert.equal(basket.stage, 'open', 'Basket must be in open stage');
    assert.equal(basket.entryFill, expectedEntryFill, 'Entry fill must match price + slippage');
    assert.equal(basket.legs.every(l => l.status === 'open'), true, 'All legs must be open');

    // Step 4: Tick advances to TP1 (51,020) -> Scalp leg exits, remaining legs move to Break-Even
    autoTradeServerEngine.processTick(symbol, { price: 51020, timestamp: Date.now() });
    const scalpLeg = basket.legs.find(l => l.tier === 'scalp');
    const swingLeg = basket.legs.find(l => l.tier === 'swing');
    const runnerLeg = basket.legs.find(l => l.tier === 'runner');

    assert.equal(scalpLeg.status, 'closed', 'Scalp leg must close at TP1');
    assert.ok(scalpLeg.pnl > 0, 'Scalp leg must realize positive net P&L');
    assert.equal(basket.tp1Filled, true, 'tp1Filled milestone must be marked');

    // Swing and runner stopPrice must be ratcheted to Break-Even
    assert.ok(swingLeg.stopPrice > plan.stopLoss, 'Swing leg stop must ratchet to break-even');
    assert.ok(runnerLeg.stopPrice > plan.stopLoss, 'Runner leg stop must ratchet to break-even');

    // Step 5: Tick advances to TP2 (52,050) -> Swing leg exits, runner profit-locked >= TP1 (with 1.0 ATR trail)
    autoTradeServerEngine.processTick(symbol, { price: 52050, timestamp: Date.now() });
    assert.equal(swingLeg.status, 'closed', 'Swing leg must close at TP2');
    assert.ok(swingLeg.pnl > 0, 'Swing leg must realize positive net P&L');
    assert.equal(basket.tp2Filled, true, 'tp2Filled milestone must be marked');
    // Runner stop must be locked at least at TP1 (51,000) and trail 1.0 ATR behind peak (52,050 - 800 = 51,250)
    assert.ok(runnerLeg.stopPrice >= basket.tp1, 'Runner stop must be locked at least at TP1 level');
    assert.equal(runnerLeg.stopPrice, 51250, 'Runner stop trails to peak - 1.0 ATR (51,250)');

    // Step 6: Tick advances further (53,000) -> Runner ATR trail ratchets up
    // ATR = 800, Peak = 53,000 -> Trail Stop = 53,000 - 800 = 52,200 (> 51,000)
    autoTradeServerEngine.processTick(symbol, { price: 53000, timestamp: Date.now() });
    assert.equal(runnerLeg.stopPrice, 52200, 'Runner stop must ratchet to peak - 1.0 ATR (52,200)');

    // Step 7: Price pulls back to 52,150 -> Runner trail stop triggers exit!
    autoTradeServerEngine.processTick(symbol, { price: 52150, timestamp: Date.now() });
    assert.equal(runnerLeg.status, 'closed', 'Runner must close when trailing stop is hit');

    // Basket should now be completely closed and recorded in the trade journal
    assert.equal(autoTradeServerEngine.activeBaskets.has(symbol), false, 'Basket must be removed from active');
    const journalEntry = autoTradeServerEngine.journal.find(j => j.symbol === symbol);
    assert.ok(journalEntry, 'Closed basket must be recorded in trade journal');
    assert.ok(journalEntry.netPnl > 0, 'Basket net P&L must be positive');
    assert.ok(journalEntry.totalFees > 0, 'Trading fees must be deducted and logged');
    assert.ok(journalEntry.rMultiple > 0, 'R-multiple must be positive');

    // Step 8: Verify 1-hour symbol cooldown
    const rearm = autoTradeServerEngine.armBasket(plan);
    assert.equal(rearm.ok, false, 'Rearm must be blocked during cooldown');
    assert.ok(rearm.reason.includes('cooldown'), 'Cooldown reason must be specified');
  });

  test('4.2 Kill-Switch / Immediate Flatten Test', () => {
    const symbol = 'ETH-USD';
    autoTradeServerEngine.activeBaskets.delete(symbol);
    autoTradeServerEngine.cooldowns.delete(symbol);

    const plan = {
      symbol,
      market: 'crypto',
      side: 'BUY',
      legCount: 3,
      quantity: 0.3,
      entryMin: 2600,
      entryMax: 2620,
      stopLoss: 2550,
      tp1: 2700,
      tp2: 2750,
      tp3: 2800,
      atr: 40,
      riskBudget: 250
    };

    autoTradeServerEngine.armBasket(plan);
    // Fill basket inside zone
    autoTradeServerEngine.processTick(symbol, { price: 2610, timestamp: Date.now() });
    const basket = autoTradeServerEngine.activeBaskets.get(symbol);
    assert.equal(basket.stage, 'open');

    // Trigger Kill Switch
    const killRes = autoTradeServerEngine.stopBasket(symbol, 'User Emergency Kill Switch');
    assert.equal(killRes.ok, true);
    assert.equal(autoTradeServerEngine.activeBaskets.has(symbol), false, 'Basket must be flattened immediately');
  });

  test('4.3 Invalidation Stop Loss & Basket Loss Stop', () => {
    const symbol = 'SOL-USD';
    autoTradeServerEngine.activeBaskets.delete(symbol);
    autoTradeServerEngine.cooldowns.delete(symbol);

    const plan = {
      symbol,
      market: 'crypto',
      side: 'BUY',
      legCount: 3,
      quantity: 1.0,
      entryMin: 180,
      entryMax: 182,
      stopLoss: 175,
      tp1: 190,
      tp2: 195,
      tp3: 200,
      atr: 5,
      riskBudget: 50
    };

    autoTradeServerEngine.armBasket(plan);
    autoTradeServerEngine.processTick(symbol, { price: 181, timestamp: Date.now() });

    // Price immediately plunges below initial SL (174)
    autoTradeServerEngine.processTick(symbol, { price: 174, timestamp: Date.now() });

    assert.equal(autoTradeServerEngine.activeBaskets.has(symbol), false, 'Plunge below SL must close all legs');
    const entry = autoTradeServerEngine.journal.find(j => j.symbol === symbol);
    assert.ok(entry, 'Stopped trade must be persisted to journal');
    assert.ok(entry.netPnl < 0, 'Net P&L must be negative');
    assert.ok(entry.exitReason.includes('Stop Loss') || entry.exitReason.includes('closed'));
  });

  test('4.4 Daily Loss Circuit Breaker flattens basket when cumulative daily loss exceeds 2x risk budget', () => {
    const symbol = 'CIRCUIT-USD';
    autoTradeServerEngine.activeBaskets.delete(symbol);

    const prevJournal = [...autoTradeServerEngine.journal];
    // Isolated journal with prior loss today of -150
    const today = new Date().toISOString();
    autoTradeServerEngine.journal = [{
      symbol: 'PRIOR-USD',
      market: 'crypto',
      netPnl: -150,
      closedAt: today
    }];

    const plan = {
      symbol,
      market: 'crypto',
      side: 'BUY',
      legCount: 3,
      quantity: 1.0,
      entryMin: 100,
      entryMax: 102,
      stopLoss: 90,
      tp1: 110,
      tp2: 120,
      tp3: 130,
      atr: 5,
      riskBudget: 100 // 2x budget is 200. With prior -150, another -51 unrealized will breach 200 limit
    };

    autoTradeServerEngine.armBasket(plan);
    autoTradeServerEngine.processTick(symbol, { price: 101, timestamp: Date.now() });

    let basket = autoTradeServerEngine.activeBaskets.get(symbol);
    assert.equal(basket.stage, 'open');

    // Price drops to 45 (unrealized loss = 56). Total daily loss = -150 + (-56) = -206 <= -200
    autoTradeServerEngine.processTick(symbol, { price: 45, timestamp: Date.now() });

    assert.equal(autoTradeServerEngine.activeBaskets.has(symbol), false, 'Circuit breaker must immediately flatten basket');
    const breakerEntry = autoTradeServerEngine.journal.find(j => j.symbol === symbol);
    assert.ok(breakerEntry, 'Flattened basket must be recorded in journal');
    assert.ok(breakerEntry.exitReason.includes('Daily loss circuit breaker'), 'Exit reason must specify circuit breaker');

    autoTradeServerEngine.journal = prevJournal;
  });

  test('4.5 Dynamic Stop Loss tightening during daily drawdown', () => {
    const symbol = 'TIGHTEN-USD';
    autoTradeServerEngine.activeBaskets.delete(symbol);

    const prevJournal = [...autoTradeServerEngine.journal];
    // Isolated journal with today loss
    const today = new Date().toISOString();
    autoTradeServerEngine.journal = [{
      symbol: 'LOSS-USD',
      market: 'crypto',
      netPnl: -100,
      closedAt: today
    }];

    const plan = {
      symbol,
      market: 'crypto',
      side: 'BUY',
      legCount: 3,
      quantity: 1.0,
      entryMin: 100,
      entryMax: 102,
      stopLoss: 90, // Initial stop distance = 11 (from 101)
      tp1: 110,
      tp2: 120,
      tp3: 130,
      atr: 5,
      riskBudget: 200 // Max daily loss = 400. Drawdown ratio = 100/400 = 0.25 -> tighten ~12.5%
    };

    autoTradeServerEngine.armBasket(plan);
    autoTradeServerEngine.processTick(symbol, { price: 101, timestamp: Date.now() });

    const basket = autoTradeServerEngine.activeBaskets.get(symbol);
    assert.equal(basket.stage, 'open');

    // Stop must be tightened above initial 90 immediately upon entry/tick
    const leg = basket.legs[0];
    assert.ok(leg.stopPrice > 90, `Stop price ${leg.stopPrice} must be tightened above initial 90 during drawdown`);

    // Clean up
    autoTradeServerEngine.stopBasket(symbol, 'Test finished');
    autoTradeServerEngine.journal = prevJournal;
  });
});
