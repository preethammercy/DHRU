#!/usr/bin/env node
// DHRU.AI - Walk-Forward Backtester & Model Calibration CLI
// Usage: npm run backtest -- --symbol BTC-USD --tf 5m

import { fetchInstrumentCandles } from '../server/services/marketData.js';
import { runWalkForwardValidation } from '../server/services/backtestEngine.js';

function parseArgs() {
  const args = process.argv.slice(2);
  let symbol = 'BTC-USD';
  let tf = '5m';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--symbol' && args[i + 1]) {
      symbol = args[i + 1].toUpperCase();
      i++;
    } else if (args[i] === '--tf' && args[i + 1]) {
      tf = args[i + 1];
      i++;
    }
  }
  return { symbol, tf };
}

async function main() {
  const { symbol, tf } = parseArgs();
  console.log(`\n======================================================`);
  console.log(`  📊 DHRU.AI Quantitative Walk-Forward Backtest & Calibration`);
  console.log(`  Instrument : ${symbol}`);
  console.log(`  Timeframe  : ${tf}`);
  console.log(`  Friction   : 5 bps fees + 2 bps slippage per fill`);
  console.log(`======================================================\n`);

  const range = tf === '1d' ? '1y' : (tf === '60m' || tf === '1h' ? '1mo' : '5d');
  const res = await fetchInstrumentCandles(symbol, range, tf);
  const candles = res?.candles || [];

  if (!candles.length) {
    console.error(`❌ No candles returned for ${symbol} on ${tf}.`);
    process.exit(1);
  }

  console.log(`Loaded ${candles.length} historical candles.`);
  const result = runWalkForwardValidation(candles, { minBars: 35 });

  console.log(`\n--- Walk-Forward Out-of-Sample Performance ---`);
  console.log(`Sample Size       : ${result.samples} trades`);
  console.log(`Win Rate          : ${result.winRate !== null ? `${result.winRate}%` : 'Unvalidated (< 30 completed trades)'}`);
  console.log(`Status            : ${result.status}`);
  console.log(`Average R         : ${result.avgR}R`);
  console.log(`Profit Factor     : ${result.profitFactor}`);
  console.log(`Max Drawdown      : ${result.maxDrawdownPct}%`);
  console.log(`Total Return      : ${result.totalReturnPct}%`);

  console.log(`\n--- Model Calibration Table (Score Bucket vs Out-of-Sample Hit Rate) ---`);
  console.table(result.calibrationTable);

  console.log(`\nCompleted walk-forward calibration for ${symbol} on ${tf}.\n`);
}

main().catch(err => {
  console.error('Backtest failed:', err);
  process.exit(1);
});
