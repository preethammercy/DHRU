// DHRU.AI - Walk-Forward Historical Backtesting Studio
// Backtests algorithmic strategies (Dual EMA Crossover, RSI Mean Reversion) sequentially
// on real historical candles without look-ahead bias.

import React, { useState, useEffect } from 'react';
import { getBacktest } from '../services/api';
import { BacktestResult } from '../types';
import { History, Play, ShieldAlert, CheckCircle, TrendingUp, BarChart2, HelpCircle } from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
}

export const BacktestingPage: React.FC<Props> = ({ onSelectStock }) => {
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [inputSym, setInputSym] = useState('RELIANCE.NS');
  const [strategy, setStrategy] = useState<'ema_cross' | 'rsi_reversion'>('ema_cross');
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(true);

  const runTest = async (sym = symbol, strat = strategy) => {
    setLoading(true);
    try {
      const data = await getBacktest(sym, strat);
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runTest();
  }, [symbol, strategy]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSym.trim()) {
      let s = inputSym.trim().toUpperCase();
      if (!s.includes('.')) s += '.NS';
      setSymbol(s);
    }
  };

  const quickPicks = ['RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'TMPV.NS', '^NSEI'];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <History className="w-4 h-4 text-cyan-400" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Historical Data & Walk-Forward Backtesting Studio</h1>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Simulate technical rule systems against verifiable historical exchange candles. Evaluated sequentially on bar-by-bar progression to eliminate look-ahead bias and curve-fitting.
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={inputSym}
            onChange={e => setInputSym(e.target.value)}
            placeholder="Enter NSE Ticker..."
            className="w-full px-3.5 py-2 bg-[#070B14] border border-[#1A2744] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5" /> Run Backtest
          </button>
        </form>

        {/* Strategy Selector */}
        <div className="flex items-center gap-2 bg-[#070B14] p-1 rounded-xl border border-[#1A2744] text-xs">
          <button
            onClick={() => setStrategy('ema_cross')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
              strategy === 'ema_cross'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Dual EMA Trend (9 / 21 EMA)
          </button>
          <button
            onClick={() => setStrategy('rsi_reversion')}
            className={`px-3 py-1.5 rounded-lg transition-all font-semibold ${
              strategy === 'rsi_reversion'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            RSI Mean Reversion (&lt;32 / &gt;60)
          </button>
        </div>
      </div>

      {/* Quick Select Tickers */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400">Popular Tests:</span>
        {quickPicks.map(qp => (
          <button
            key={qp}
            onClick={() => {
              setSymbol(qp);
              setInputSym(qp);
            }}
            className={`px-2.5 py-1 rounded-lg border font-mono transition-all ${
              symbol === qp
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 font-bold'
                : 'bg-[#0D1527] text-slate-400 border-[#1A2744] hover:text-white'
            }`}
          >
            {qp.replace('.NS', '')}
          </button>
        ))}
      </div>

      {loading && (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Running out-of-sample walk-forward backtest on historical daily candles...</p>
        </div>
      )}

      {/* Backtest Metrics Scorecard */}
      {!loading && result && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1A2744]">
              <span className="text-slate-500 text-[10px] font-mono">SAMPLE SIZE</span>
              <div className="text-xl font-bold font-mono text-white mt-0.5">{result.sampleSize} Trades</div>
              <div className="text-[10px] text-slate-400 mt-1">1-Year Daily Window</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1A2744]">
              <span className="text-slate-500 text-[10px] font-mono">WIN RATE</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">{result.winRate}%</div>
              <div className="text-[10px] text-slate-400 mt-1">Profitable Exits</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1A2744]">
              <span className="text-slate-500 text-[10px] font-mono">PROFIT FACTOR</span>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">{result.profitFactor}</div>
              <div className="text-[10px] text-slate-400 mt-1">Gains / Losses Ratio</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1A2744]">
              <span className="text-slate-500 text-[10px] font-mono">MAX DRAWDOWN</span>
              <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">{result.maxDrawdownPct}%</div>
              <div className="text-[10px] text-slate-400 mt-1">Peak-to-Trough Drop</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1A2744]">
              <span className="text-slate-500 text-[10px] font-mono">STRATEGY RETURN</span>
              <div className={`text-xl font-bold font-mono mt-0.5 ${result.totalReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.totalReturnPct >= 0 ? `+${result.totalReturnPct}%` : `${result.totalReturnPct}%`}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Cumulative Simulated P&L</div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1527] border border-[#1A2744]">
              <span className="text-slate-500 text-[10px] font-mono">BUY & HOLD BENCHMARK</span>
              <div className={`text-xl font-bold font-mono mt-0.5 ${result.benchmarkReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.benchmarkReturnPct >= 0 ? `+${result.benchmarkReturnPct}%` : `${result.benchmarkReturnPct}%`}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Underlying Asset Return</div>
            </div>
          </div>

          {/* Simulated Trade Execution Log Table */}
          <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2744]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-cyan-400" />
                Recent Simulated Walk-Forward Trade Log for {symbol}
              </h3>
              <span className="text-[11px] font-mono text-slate-500">Latest 10 In-Sample Executions</span>
            </div>

            {result.trades.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No closed trades triggered in the backtest evaluation period for this configuration.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-[#070B14] text-slate-400 text-[10px] uppercase border-b border-[#1A2744]">
                      <th className="p-3">Entry Timestamp</th>
                      <th className="p-3">Entry Price</th>
                      <th className="p-3">Exit Timestamp</th>
                      <th className="p-3">Exit Price</th>
                      <th className="p-3 text-right">P&L (%)</th>
                      <th className="p-3 text-center">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1A2744]">
                    {result.trades.map((t, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="p-3 text-slate-300">
                          {typeof t.entryDate === 'number' ? new Date(t.entryDate * 1000).toLocaleDateString('en-IN') : String(t.entryDate)}
                        </td>
                        <td className="p-3 text-white font-bold">₹{t.entryPrice}</td>
                        <td className="p-3 text-slate-300">
                          {typeof t.exitDate === 'number' ? new Date(t.exitDate * 1000).toLocaleDateString('en-IN') : String(t.exitDate)}
                        </td>
                        <td className="p-3 text-white font-bold">₹{t.exitPrice}</td>
                        <td className={`p-3 text-right font-bold ${t.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.pnlPct >= 0 ? `+${t.pnlPct}%` : `${t.pnlPct}%`}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            t.win ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                          }`}>
                            {t.win ? 'WIN' : 'LOSS'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Compliance Disclaimer */}
          <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A2744] flex items-start gap-3 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-slate-400 leading-relaxed">
              <strong>Transparent Quantitative Disclosure:</strong> {result.disclaimer} Simulation assumes instant execution at next bar's market opening price and excludes brokerage, STT (Securities Transaction Tax), exchange turnover charges, and slippage.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
