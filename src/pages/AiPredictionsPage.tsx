// DHRU.AI - AI Predictions & Probabilistic Scenario Lab
// Transparent multi-horizon forecasting envelopes based on ATR dispersion, pivots, and trend posture.
// Explicitly displays model uncertainty and strictly disclaims guaranteed outcomes.
// White & Blue Fintrix styling with smooth zoom animations.

import React, { useState, useEffect } from 'react';
import { getStockDetails } from '../services/api';
import { BrainCircuit, Search, ShieldAlert, ArrowUpRight, ArrowDownRight, Compass, HelpCircle, CheckCircle } from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
}

export const AiPredictionsPage: React.FC<Props> = ({ onSelectStock }) => {
  const [symbol, setSymbol] = useState('RELIANCE.NS');
  const [inputSym, setInputSym] = useState('RELIANCE.NS');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getStockDetails(symbol).then(res => {
      setData(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [symbol]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputSym.trim()) {
      let s = inputSym.trim().toUpperCase();
      if (!s.includes('.')) s += '.NS';
      setSymbol(s);
    }
  };

  const scenarios = data?.scenarios;
  const quote = data?.quote;
  const technicals = data?.technicals;

  const quickPicks = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'TMPV.NS', '^NSEI', '^NSEBANK'];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card zoom-card space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">AI Predictions & Scenario Modeling Lab</h1>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl">
          Multi-horizon probabilistic price dispersion models calculated from real 14-period Average True Range (ATR) envelopes, Fibonacci pivots, and moving average momentum.
          <strong className="text-slate-800 dark:text-slate-300 ml-1">Regulatory Transparency:</strong> Forecasts are presented strictly as scenarios with bounded confidence intervals, never as guaranteed profit claims.
        </p>
      </div>

      {/* Symbol Selector Bar */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={inputSym}
            onChange={e => setInputSym(e.target.value)}
            placeholder="Enter NSE ticker (e.g. INFY, SBIN, TCS)..."
            className="w-full px-3.5 py-2 bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-all shadow-sm"
          >
            Model Scenarios
          </button>
        </form>

        {/* Quick Instrument Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 mr-1">Quick Select:</span>
          {quickPicks.map(qp => (
            <button
              key={qp}
              onClick={() => {
                setSymbol(qp);
                setInputSym(qp);
              }}
              className={`px-2.5 py-1 rounded-lg border font-mono transition-all cursor-pointer ${
                symbol === qp
                  ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-sm'
                  : 'bg-slate-50 dark:bg-[#070B14] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1A2744] hover:text-slate-900'
              }`}
            >
              {qp.replace('.NS', '')}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Calculating dispersion envelopes for {symbol}...</p>
        </div>
      )}

      {!loading && scenarios && (
        <div className="space-y-6">
          
          {/* Overview Strip */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] shadow-sm zoom-card">
              <span className="text-slate-400 text-[10px] font-mono">CURRENT BENCHMARK</span>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-0.5">₹{quote?.price}</div>
              <div className="text-[11px] text-slate-500 mt-1">{quote?.name}</div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] shadow-sm zoom-card">
              <span className="text-slate-400 text-[10px] font-mono">14-PERIOD ATR VOLATILITY</span>
              <div className="text-xl font-bold font-mono text-blue-600 dark:text-cyan-400 mt-0.5">₹{scenarios.volatilityAtr}</div>
              <div className="text-[11px] text-slate-500 mt-1">Dispersion: ±{scenarios.volatilityAtrPct}% per session</div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] shadow-sm zoom-card">
              <span className="text-slate-400 text-[10px] font-mono">MODEL CONFIDENCE</span>
              <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">{scenarios.confidenceScore}%</div>
              <div className="text-[11px] text-slate-500 mt-1">{scenarios.uncertaintyLabel}</div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] shadow-sm zoom-card">
              <span className="text-slate-400 text-[10px] font-mono">TECHNICAL POSTURE</span>
              <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-0.5">{technicals?.consensus || 'Neutral'}</div>
              <div className="text-[11px] text-slate-500 mt-1">Score: {technicals?.score || 0} / 6</div>
            </div>
          </div>

          {/* 3 Multi-Horizon Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Horizon 1: Next Session */}
            <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card zoom-card space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-blue-600 dark:text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
                  Horizon 1: Next Trading Session
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Intraday Dispersion Envelope
                </h3>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] text-xs font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Directional Bias:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{scenarios.horizons.nextSession.bias}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Projected Range:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{scenarios.horizons.nextSession.projectedRange}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
                  {scenarios.horizons.nextSession.keyTrigger}
                </p>
              </div>

              <div className="text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-100 dark:border-[#1A2744]">
                {scenarios.horizons.nextSession.probabilityEstimate}
              </div>
            </div>

            {/* Horizon 2: 5 Trading Days */}
            <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card zoom-card space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-blue-700 dark:text-blue-400 text-xs font-mono font-bold uppercase tracking-wider">
                  Horizon 2: 5 Trading Days (1-Week)
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Probabilistic Path Branches
                </h3>
                
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20">
                    <div className="flex justify-between font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-0.5">
                      <span>Bullish Expansion ({scenarios.horizons.fiveDays.bullishScenario.probability})</span>
                      <span>Target: {scenarios.horizons.fiveDays.bullishScenario.target}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">{scenarios.horizons.fiveDays.bullishScenario.condition}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between font-mono font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                      <span>Sideways Base ({scenarios.horizons.fiveDays.sidewaysScenario.probability})</span>
                      <span>Target: {scenarios.horizons.fiveDays.sidewaysScenario.target}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{scenarios.horizons.fiveDays.sidewaysScenario.condition}</p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20">
                    <div className="flex justify-between font-mono font-bold text-rose-700 dark:text-rose-400 mb-0.5">
                      <span>Bearish Breakdown ({scenarios.horizons.fiveDays.bearishScenario.probability})</span>
                      <span>Target: {scenarios.horizons.fiveDays.bearishScenario.target}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300">{scenarios.horizons.fiveDays.bearishScenario.condition}</p>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-100 dark:border-[#1A2744]">
                3-path Monte Carlo distribution envelope
              </div>
            </div>

            {/* Horizon 3: 1 Month */}
            <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card zoom-card space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-purple-600 dark:text-purple-400 text-xs font-mono font-bold uppercase tracking-wider">
                  Horizon 3: 1 Month Horizon
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Macro & Institutional Cycle
                </h3>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] text-xs font-mono space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Structural Posture:</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold">{scenarios.horizons.oneMonth.structuralPosture}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Broad Channel:</span>
                    <span className="text-slate-900 dark:text-white font-bold">{scenarios.horizons.oneMonth.broadRange}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2">
                  {scenarios.horizons.oneMonth.macroDrivers}
                </p>
              </div>

              <div className="text-[11px] text-slate-400 font-mono pt-3 border-t border-slate-100 dark:border-[#1A2744]">
                Subject to quarterly earnings reports & RBI policy
              </div>
            </div>
          </div>

          {/* Regulatory Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] flex items-start gap-3 text-xs">
            <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              <strong>Mandatory Compliance Notice:</strong> {scenarios.methodologyNote} Probabilistic predictions reflect statistical envelopes of past price variance. A bullish signal is not a guarantee that prices will rise. Risk management and capital preservation must be strictly practiced.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
