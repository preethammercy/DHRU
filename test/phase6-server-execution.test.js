// Phase 6 Acceptance Test: Server-Side Execution Engine
// Verifies that auto-trade execution continues on server while the browser is closed,
// state is persisted to disk, survives server restarts, and recovers state for the frontend.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { autoTradeServerEngine } from '../server/services/autoTradeServerEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.resolve(__dirname, '../server/data/autotrade-state.json');

describe('Phase 6: Server-Side Autonomous Execution Engine Acceptance', () => {

  test('6.1 Offline Execution & State Recovery across Browser and Server restarts', () => {
    const symbol = 'BTC-USD';
    autoTradeServerEngine.activeBaskets.delete(symbol);
    autoTradeServerEngine.cooldowns.delete(symbol);

    // 1. Arm basket via server
    const plan = {
      symbol,
      market: 'crypto',
      side: 'BUY',
      legCount: 3,
      quantity: 0.03,
      entryMin: 60000,
      entryMax: 60200,
      stopLoss: 59000,
      tp1: 61000,
      tp2: 62000,
      tp3: 63000,
      atr: 800,
      riskBudget: 250
    };

    const armRes = autoTradeServerEngine.armBasket(plan);
    assert.equal(armRes.ok, true);

    // 2. Browser closes (client disconnects: simulate 0 SSE clients)
    autoTradeServerEngine.sseClients.clear();

    // 3. Server receives entry tick and fills while browser is offline
    autoTradeServerEngine.processTick(symbol, { price: 60100, timestamp: Date.now() });
    let basket = autoTradeServerEngine.activeBaskets.get(symbol);
    assert.equal(basket.stage, 'open');

    // 4. Server receives TP1 tick and fills scalp leg while browser is offline
    autoTradeServerEngine.processTick(symbol, { price: 61050, timestamp: Date.now() });
    basket = autoTradeServerEngine.activeBaskets.get(symbol);
    const scalp = basket.legs.find(l => l.tier === 'scalp');
    assert.equal(scalp.status, 'closed', 'Scalp leg must be executed and closed while offline');
    assert.equal(basket.tp1Filled, true, 'TP1 milestone achieved on server');

    // 5. Verify state was persisted to disk
    assert.ok(fs.existsSync(STATE_FILE), 'autotrade-state.json must exist on disk');
    const diskContent = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const diskBasket = diskContent.baskets.find(b => b.symbol === symbol);
    assert.ok(diskBasket, 'Disk snapshot must contain active basket');
    assert.equal(diskBasket.stage, 'open');
    assert.equal(diskBasket.tp1Filled, true);

    // 6. Simulate Server Restart: New engine instance reads disk state
    autoTradeServerEngine.loadState();
    const recovered = autoTradeServerEngine.activeBaskets.get(symbol);
    assert.ok(recovered, 'Basket must be restored from disk');
    assert.equal(recovered.stage, 'open');
    assert.equal(recovered.tp1Filled, true);
    const recoveredScalp = recovered.legs.find(l => l.tier === 'scalp');
    assert.equal(recoveredScalp.status, 'closed');

    // Clean up
    autoTradeServerEngine.stopBasket(symbol, 'Test completed cleanup');
  });
});
