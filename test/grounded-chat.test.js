import test from 'node:test';
import assert from 'node:assert/strict';
import { askDhruAssistant } from '../server/services/geminiService.js';

test('grounded assistant reports attached facts with source and time', async () => {
  const result = await askDhruAssistant({
    query: 'What is the displayed price and RSI?',
    currentContext: {
      symbol: 'BTC-USD', name: 'Bitcoin', price: 123.45, currency: 'USD',
      technicals: { rsi: 51 }, source: 'Fixture feed', lastUpdated: '2026-10-31T10:00:00Z'
    }
  });
  assert.match(result.reply, /123\.45/);
  assert.match(result.reply, /RSI: 51/);
  assert.match(result.reply, /Fixture feed/);
  assert.match(result.reply, /As of:/);
  assert.match(result.reply, /Price: 123\.45 USD/);
  assert.doesNotMatch(result.reply, /₹/);
});

test('grounded assistant declines recommendations and does not invent a target', async () => {
  const result = await askDhruAssistant({
    query: 'Should I buy? Give me a target price.',
    currentContext: { symbol: 'ACME.NS', price: 123.45, changePercent: 0, currency: 'INR' }
  });
  assert.match(result.reply, /can’t recommend/);
  assert.match(result.reply, /123\.45/);
  assert.match(result.reply, /0% change/);
  assert.doesNotMatch(result.reply, /target\s*[:₹$]?\s*\d/i);
});

test('grounded assistant states when quote context is missing', async () => {
  const result = await askDhruAssistant({ query: 'What is the current price?', currentContext: null });
  assert.match(result.reply, /No instrument data is attached/);
  assert.match(result.reply, /Source unavailable/);
});
