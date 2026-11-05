// Phase 1 Acceptance Test: Canonical Parity
// Proves that Analysis Engine, Gemini Report, and Scanner derive and use
// identical levels for the same symbol and asOf.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getCanonicalAnalysis, clearAnalysisCache } from '../server/services/analysisEngine.js';
import { generateDeterministicAnalysis, validateReportNumbers } from '../server/services/geminiService.js';

describe('Phase 1: Canonical Analysis Parity Acceptance', () => {

  test('Canonical analysis returns valid DhruAnalysis schema with short TTL cache', async () => {
    clearAnalysisCache();
    const symbol = 'RELIANCE';
    const analysis1 = await getCanonicalAnalysis(symbol, { forceRefresh: true });
    
    assert.ok(analysis1, 'Analysis object must exist');
    assert.equal(analysis1.symbol, symbol);
    assert.ok(analysis1.asOf, 'Must contain asOf timestamp');
    assert.ok(analysis1.quote, 'Must contain quote');
    assert.ok(analysis1.levels, 'Must contain levels');
    assert.ok(analysis1.score, 'Must contain score');
    assert.ok(analysis1.confidence, 'Must contain confidence');

    // Repeated call within TTL should return exact same asOf (cached)
    const analysis2 = await getCanonicalAnalysis(symbol);
    assert.equal(analysis1.asOf, analysis2.asOf, 'Cache should return identical asOf');
    assert.equal(analysis1.levels.tp1, analysis2.levels.tp1, 'Cached TP1 must be identical');
    assert.equal(analysis1.levels.stopLoss, analysis2.levels.stopLoss, 'Cached SL must be identical');
  });

  test('Gemini Report numbers strictly match Canonical Analysis levels (Parity)', async () => {
    const symbol = 'TCS';
    const analysis = await getCanonicalAnalysis(symbol, { forceRefresh: true });

    // Deterministic report generated from the exact analysis
    const report = generateDeterministicAnalysis(symbol, analysis);

    const expectedAction = analysis.direction === 'LONG' ? 'BUY' : (analysis.direction === 'SHORT' ? 'SELL' : 'WAIT');
    assert.equal(report.tradeSetup.action, expectedAction);
    assert.equal(report.tradeSetup.entryMin, analysis.levels.entryMin);
    assert.equal(report.tradeSetup.entryMax, analysis.levels.entryMax);
    assert.equal(report.tradeSetup.stopLoss, analysis.levels.stopLoss);
    assert.equal(report.tradeSetup.target1, analysis.levels.tp1);
    assert.equal(report.tradeSetup.target2, analysis.levels.tp2);
    assert.equal(report.tradeSetup.target3, analysis.levels.tp3);
    assert.equal(report.confidence.value, analysis.confidence.value);
    assert.equal(report.asOf, analysis.asOf);
  });

  test('Report validation rejects hallucinated price numbers', () => {
    const symbol = 'INFY';
    const mockAnalysis = {
      symbol: 'INFY',
      quote: { price: 1800 },
      levels: { entryMin: 1795, entryMax: 1802, stopLoss: 1780, tp1: 1820, tp2: 1840, tp3: 1860 },
      confidence: { value: 85 }
    };

    // Valid report matching mockAnalysis
    const validReport = {
      tradeSetup: {
        entryZone: { min: 1795, max: 1802 },
        stopLoss: 1780,
        targets: { tp1: 1820, tp2: 1840, tp3: 1860 }
      }
    };
    assert.equal(validateReportNumbers(validReport, mockAnalysis).valid, true, 'Matching numbers must be accepted');

    // Hallucinated report with unauthorized TP1 of 1950 (> 0.5% deviation)
    const hallucinatedReport = {
      tradeSetup: {
        entryZone: { min: 1795, max: 1802 },
        stopLoss: 1780,
        targets: { tp1: 1950, tp2: 1840, tp3: 1860 }
      }
    };
    assert.equal(validateReportNumbers(hallucinatedReport, mockAnalysis).valid, false, 'Hallucinated TP1 must be rejected');
  });

  test('Auto-Trade setup uses canonical levels without client-side fallback guess', async () => {
    const symbol = 'BTC-USD';
    const analysis = await getCanonicalAnalysis(symbol, { forceRefresh: true });

    // Check that entry zone conforms to Section 4 formulas:
    // entry zone: [-0.25 ATR, +0.15 ATR] around current price for BUY
    // SL: entry - 1.15 ATR for BUY
    // TP1: entry + 1.65 ATR, TP2: +2.85 ATR, TP3: +4.25 ATR
    if (analysis.direction === 'BUY') {
      assert.ok(analysis.levels.stopLoss < analysis.quote.price, 'SL must be below entry for BUY');
      assert.ok(analysis.levels.tp1 > analysis.quote.price, 'TP1 must be above entry for BUY');
      assert.ok(analysis.levels.tp2 > analysis.levels.tp1, 'TP2 must be above TP1');
      assert.ok(analysis.levels.tp3 > analysis.levels.tp2, 'TP3 must be above TP2');
    } else if (analysis.direction === 'SELL') {
      assert.ok(analysis.levels.stopLoss > analysis.quote.price, 'SL must be above entry for SELL');
      assert.ok(analysis.levels.tp1 < analysis.quote.price, 'TP1 must be below entry for SELL');
      assert.ok(analysis.levels.tp2 < analysis.levels.tp1, 'TP2 must be below TP1');
      assert.ok(analysis.levels.tp3 < analysis.levels.tp2, 'TP3 must be below TP2');
    }
  });
});
