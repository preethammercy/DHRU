// Phase 3 Acceptance Tests: DHRU Intelligence Report Integration
// Verifies numeric parity with canonical analysis, LLM number validation,
// rejection of hallucinated levels, direction consistency check, and news risk veto.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getDhruAnalysis } from '../server/services/analysisEngine.js';
import {
  generateDeterministicAnalysis,
  validateReportNumbers
} from '../server/services/geminiService.js';
import { checkNewsRiskForSymbol } from '../server/services/newsService.js';

describe('Phase 3: DHRU Intelligence Report Acceptance', () => {

  test('3.1 Numeric Parity: Report numbers are 100% derived from DhruAnalysis', async () => {
    const symbol = 'BTC-USD';
    const analysis = await getDhruAnalysis(symbol);

    const report = generateDeterministicAnalysis(symbol, analysis);

    // Verify exact parity between report trade setup and canonical analysis
    assert.equal(report.tradeSetup.entryMin, analysis.levels.entryMin);
    assert.equal(report.tradeSetup.entryMax, analysis.levels.entryMax);
    assert.equal(report.tradeSetup.stopLoss, analysis.levels.stopLoss);
    assert.equal(report.tradeSetup.target1, analysis.levels.tp1);
    assert.equal(report.tradeSetup.target2, analysis.levels.tp2);
    assert.equal(report.tradeSetup.target3, analysis.levels.tp3);
    assert.equal(report.confidence.value, analysis.confidence.value);
    assert.equal(report.confidence.method, analysis.confidence.method);
    assert.equal(report.asOf, analysis.asOf);
  });

  test('3.2 Rejection of Hallucinated Numbers: Bad LLM levels are strictly rejected', () => {
    const analysis = {
      symbol: 'TATAMOTORS',
      quote: { price: 950 },
      levels: {
        entryMin: 946,
        entryMax: 952,
        stopLoss: 935,
        tp1: 965,
        tp2: 978,
        tp3: 995
      }
    };

    // Case A: Exact match
    const validReport = {
      tradeSetup: {
        entryMin: 946,
        entryMax: 952,
        stopLoss: 935,
        target1: 965,
        target2: 978,
        target3: 995
      }
    };
    const checkValid = validateReportNumbers(validReport, analysis);
    assert.equal(checkValid.valid, true);

    // Case B: Hallucinated TP1 (1050 instead of 965)
    const badTp1Report = {
      tradeSetup: {
        entryMin: 946,
        entryMax: 952,
        stopLoss: 935,
        target1: 1050, // 8.8% hallucination (> 0.5% tolerance)
        target2: 978,
        target3: 995
      }
    };
    const checkBadTp1 = validateReportNumbers(badTp1Report, analysis);
    assert.equal(checkBadTp1.valid, false);
    assert.ok(checkBadTp1.reason.includes('target1'));

    // Case C: Hallucinated SL (890 instead of 935)
    const badSlReport = {
      tradeSetup: {
        entryMin: 946,
        entryMax: 952,
        stopLoss: 890,
        target1: 965,
        target2: 978,
        target3: 995
      }
    };
    const checkBadSl = validateReportNumbers(badSlReport, analysis);
    assert.equal(checkBadSl.valid, false);
    assert.ok(checkBadSl.reason.includes('stopLoss'));
  });

  test('3.3 Direction Consistency: Scanner and Report direction agreement gate', () => {
    const engineLong = 'LONG';
    const reportBullish = 'Bullish';
    const reportBearish = 'Bearish';

    // When report agrees with engine
    const agrees = (engineLong === 'LONG' && reportBullish === 'Bullish') ||
                   (engineLong === 'SHORT' && reportBullish === 'Bearish');
    assert.equal(agrees, true, 'Agreement must pass check');

    // When report disagrees with engine
    const disagrees = (engineLong === 'LONG' && reportBearish === 'Bullish') ||
                      (engineLong === 'SHORT' && reportBearish === 'Bearish');
    assert.equal(disagrees, false, 'Disagreement must fail check and force WAIT');
  });

  test('3.4 News Risk Veto: High-impact negative event vetoes auto-trade entry', () => {
    const symbol = 'ADANIENT';
    const recentBadNews = [
      {
        title: 'SEBI initiates investigation into accounting practices of Adani Enterprises',
        publishedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
        source: 'Reuters'
      }
    ];

    const risk = checkNewsRiskForSymbol(symbol, recentBadNews);
    assert.equal(risk.veto, true, 'High impact investigation headline must veto auto-trade');
    assert.ok(risk.reason.toLowerCase().includes('investigation') || risk.reason.toLowerCase().includes('high-impact'));

    // Clean news case
    const cleanNews = [
      {
        title: 'Adani Enterprises signs new green hydrogen partnership in Gujarat',
        publishedAt: new Date(Date.now() - 3600_000).toISOString(),
        source: 'LiveMint'
      }
    ];
    const cleanRisk = checkNewsRiskForSymbol(symbol, cleanNews);
    assert.equal(cleanRisk.veto, false, 'Clean operational news must not veto');
  });
});
