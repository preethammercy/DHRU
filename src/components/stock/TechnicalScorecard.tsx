// DHRU.AI - Technical Indicator Scorecard Component
// Visual breakdown of calculated moving averages, oscillators, pivots, and detected patterns.

import React from 'react';
import { TechnicalIndicators } from '../../types';
import { Activity, Compass, ShieldCheck, AlertCircle, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

interface Props {
  technicals: TechnicalIndicators | null;
  currentPrice: number;
}

export const TechnicalScorecard: React.FC<Props> = ({ technicals, currentPrice }) => {
  if (!technicals) {
    return (
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 text-center text-slate-500 text-xs shadow-card">
        Technical indicators calculation requires at least 20 historical daily candles.
      </div>
    );
  }

  const { sma, ema, rsi, macd, bollinger, pivots, patterns, consensus, score, signals } = technicals;

  const isBuy = consensus.includes('Buy');
  const isSell = consensus.includes('Sell');

  return (
    <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-5 shadow-card flex flex-col gap-5">
      {/* Header & Consensus Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1A2744]">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            Technical Indicators & Consensus Meter
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Aggregated mathematical alignment across moving averages and oscillators
          </p>
        </div>

        {/* Big Consensus Badge */}
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 ${
          isBuy
            ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-400'
            : isSell
            ? 'bg-rose-50 border-rose-300 text-rose-800 dark:bg-rose-500/15 dark:border-rose-500/40 dark:text-rose-400'
            : 'bg-amber-50 border-amber-300 text-amber-800 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-400'
        }`}>
          {isBuy ? <ArrowUpRight className="w-5 h-5 text-emerald-600" /> : isSell ? <ArrowDownRight className="w-5 h-5 text-rose-600" /> : <Compass className="w-5 h-5 text-amber-600" />}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">{consensus}</div>
            <div className="text-[10px] font-mono opacity-80">Composite Score: {score > 0 ? `+${score}` : score}</div>
          </div>
        </div>
      </div>

      {/* Grid of Key Technical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Moving Averages Posture */}
        <div className="bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
            <span>Moving Averages</span>
            <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400">Trend Posture</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">SMA 20 (Short-Term):</span>
              <span className={sma.sma20 && currentPrice >= sma.sma20 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                ₹{sma.sma20 ?? 'N/A'} {sma.sma20 && (currentPrice >= sma.sma20 ? '▲ Above' : '▼ Below')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">SMA 50 (Intermediate):</span>
              <span className={sma.sma50 && currentPrice >= sma.sma50 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                ₹{sma.sma50 ?? 'N/A'} {sma.sma50 && (currentPrice >= sma.sma50 ? '▲ Above' : '▼ Below')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">SMA 200 (Major Trend):</span>
              <span className={sma.sma200 && currentPrice >= sma.sma200 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                ₹{sma.sma200 ?? 'N/A'} {sma.sma200 && (currentPrice >= sma.sma200 ? '▲ Above' : '▼ Below')}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
              <span className="text-slate-500">EMA 9 / 21 Cross:</span>
              <span className={ema.ema9 && ema.ema21 && ema.ema9 > ema.ema21 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                {ema.ema9 && ema.ema21 ? (ema.ema9 > ema.ema21 ? 'Bullish (9 > 21)' : 'Bearish (9 < 21)') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Oscillators (RSI & MACD) */}
        <div className="bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
            <span>Momentum Oscillators</span>
            <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400">RSI & MACD</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="text-slate-500">RSI (14-Day):</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{rsi ?? 'N/A'}</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    rsi && rsi > 70 ? 'bg-rose-500' : rsi && rsi < 30 ? 'bg-emerald-500' : 'bg-blue-600 dark:bg-cyan-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, rsi || 50))}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                {rsi && rsi > 70 ? 'Overbought zone' : rsi && rsi < 30 ? 'Oversold zone' : 'Normal momentum corridor'}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">MACD Histogram:</span>
                <span className={macd && macd.histogram >= 0 ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                  {macd?.histogram ?? 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bollinger %B:</span>
                <span className="text-slate-700 dark:text-slate-300">{bollinger?.percentB ?? 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Pivot Points Floor Levels */}
        <div className="bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center justify-between">
            <span>Support & Resistance Pivots</span>
            <span className="text-[10px] font-mono text-blue-600 dark:text-cyan-400">Floor Matrix</span>
          </div>

          {pivots ? (
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-rose-600">
                <span>Resistance 2 (R2):</span>
                <span className="font-semibold">₹{pivots.r2}</span>
              </div>
              <div className="flex justify-between items-center text-rose-500">
                <span>Resistance 1 (R1):</span>
                <span className="font-semibold">₹{pivots.r1}</span>
              </div>
              <div className="flex justify-between items-center text-amber-600 py-0.5 border-y border-slate-200 dark:border-slate-800">
                <span>Central Pivot (PP):</span>
                <span className="font-bold">₹{pivots.pivot}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-500">
                <span>Support 1 (S1):</span>
                <span className="font-semibold">₹{pivots.s1}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-600">
                <span>Support 2 (S2):</span>
                <span className="font-semibold">₹{pivots.s2}</span>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs">Pivots require session high/low/close data.</div>
          )}
        </div>
      </div>

      {/* Candlestick Pattern Detection Box */}
      {patterns && patterns.length > 0 && (
        <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-gradient-to-r dark:from-cyan-950/40 dark:via-blue-950/30 dark:to-[#070B14] border border-blue-200 dark:border-cyan-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-cyan-400 animate-pulse" />
            <span className="text-xs font-bold text-blue-700 dark:text-cyan-300 uppercase tracking-wider">
              Candlestick Pattern Detected on Latest Bar:
            </span>
          </div>
          <div className="space-y-2">
            {patterns.map((p, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{p.name}</span>
                  <span className="text-slate-500 ml-2">({p.type})</span>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] mt-0.5">{p.explanation}</p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-slate-800 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-slate-700 shrink-0">
                  Reliability: {p.strength}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positive and Negative Technical Evidence Badges */}
      <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-[#1A2744]">
        <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Evidence Summary ({signals.length} Signals):
        </div>
        <div className="flex flex-wrap gap-2">
          {signals.map((sig, i) => (
            <span
              key={i}
              className={`text-xs px-2.5 py-1 rounded-lg border font-mono ${
                sig.includes('(+)')
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : sig.includes('(-)')
                  ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                  : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
            >
              {sig}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
