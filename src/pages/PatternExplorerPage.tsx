// DHRU.AI - Candlestick Pattern Explorer & Live Scanner
// Live scanner across Indian listed heavyweights with educational guides on Japanese candlestick setups.

import React, { useEffect, useState } from 'react';
import { getPatterns } from '../services/api';
import { CandlestickChart, Sparkles, ArrowRight, BookOpen, Compass, CheckCircle } from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
}

export const PatternExplorerPage: React.FC<Props> = ({ onSelectStock }) => {
  const [detected, setDetected] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPatterns().then(res => {
      setDetected(res.patterns || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const educationalPatterns = [
    {
      name: 'Hammer',
      type: 'Bullish Reversal',
      reliability: 'High (~64% Historical Win Rate)',
      structure: 'Small body at upper range with a long lower shadow at least 2x the body length.',
      psychology: 'Sellers drove prices aggressively down, but buyers overwhelmed supply before the bell, rejecting lower prices.'
    },
    {
      name: 'Shooting Star',
      type: 'Bearish Reversal',
      reliability: 'High (~62% Historical Win Rate)',
      structure: 'Small body at lower range with a long upper wick at least 2x body height.',
      psychology: 'Bulls pushed prices to fresh highs, but sellers mounted massive resistance, hammering price back to the open.'
    },
    {
      name: 'Bullish Engulfing',
      type: 'Bullish Reversal',
      reliability: 'Very High (~67% Historical Win Rate)',
      structure: 'Large green candle whose body completely wraps around the prior red candle.',
      psychology: 'Decisive shift from panic or selling exhaustion to institutional accumulation.'
    },
    {
      name: 'Bearish Engulfing',
      type: 'Bearish Reversal',
      reliability: 'Very High (~65% Historical Win Rate)',
      structure: 'Large red candle whose body completely wraps around the prior green candle.',
      psychology: 'Bulls lose control after a rally as massive profit taking and short positions flood the book.'
    },
    {
      name: 'Dragonfly Doji',
      type: 'Bullish Reversal',
      reliability: 'Moderate (~58% Historical Win Rate)',
      structure: 'Open, high, and close are virtually equal with a very long lower shadow.',
      psychology: 'Extreme price rejection at support levels indicating buying resilience.'
    },
    {
      name: 'Morning Star',
      type: 'Bullish Reversal',
      reliability: 'Very High (~70% Historical Win Rate)',
      structure: 'Three-candle pattern: Red candle, small indecision candle, followed by strong green candle.',
      psychology: 'Classic 3-phase trend reversal: Selling capitulation, balance, and aggressive recovery.'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <CandlestickChart className="w-4 h-4 text-cyan-400" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Candlestick Pattern Explorer & Live Scanner</h1>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Automated daily candlestick pattern recognition across Indian equities with psychological setups and historical reliability ratings.
        </p>
      </div>

      {/* 1. Live Detected Patterns Scanner */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Live Detected Formations on Latest Daily Bar
          </h2>
          <span className="text-[11px] font-mono text-slate-500">Scanned Across Indian Universe</span>
        </div>

        {loading ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Scanning OHLCV bars for Japanese candlestick formations...</p>
          </div>
        ) : detected.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0D1527] border border-[#1A2744] text-center text-xs text-slate-400">
            No distinct reversal patterns (Hammers or Engulfing) detected on today's scanned basket. Most instruments are in standard liquidity matching.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {detected.map((d, i) => (
              <div
                key={i}
                onClick={() => onSelectStock(d.symbol)}
                className="p-5 rounded-2xl bg-[#0D1527] border border-[#1A2744] hover:border-cyan-500/40 hover:bg-[#131F38] cursor-pointer transition-all shadow-md group flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#070B14] text-cyan-400 border border-[#1A2744]">
                      {d.sector}
                    </span>
                    <span className="font-mono font-bold text-white">₹{d.price}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors mt-1">
                    {d.name}
                  </h3>
                  <div className="text-[10px] font-mono text-slate-500">{d.symbol}</div>
                </div>

                <div className="space-y-2 pt-3 border-t border-[#1A2744] text-xs">
                  {d.patterns.map((p: any, idx: number) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-[#070B14] border border-[#1A2744]">
                      <div className="flex items-center justify-between font-bold">
                        <span className="text-cyan-300">{p.name}</span>
                        <span className="text-[10px] font-mono text-emerald-400">{p.type}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{p.explanation}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-cyan-400 pt-1 font-semibold">
                  <span>View Chart Setup</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Candlestick Education Library */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          Candlestick Reversal Encyclopedia & Trading Psychology
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {educationalPatterns.map((ep, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-[#0D1527] border border-[#1A2744] space-y-3 text-xs shadow-md">
              <div className="flex items-center justify-between pb-2 border-b border-[#1A2744]">
                <span className="font-bold text-slate-100 text-sm">{ep.name}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  ep.type.includes('Bullish') ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                }`}>
                  {ep.type}
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] font-mono uppercase">Candle Structure:</span>
                <p className="text-slate-300 mt-0.5">{ep.structure}</p>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] font-mono uppercase">Order Flow Psychology:</span>
                <p className="text-slate-400 mt-0.5 leading-relaxed">{ep.psychology}</p>
              </div>

              <div className="pt-2 border-t border-[#1A2744] font-mono text-[11px] text-cyan-400 font-semibold">
                {ep.reliability}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
