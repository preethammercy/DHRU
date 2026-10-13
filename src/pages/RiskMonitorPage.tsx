// DHRU.AI - Dedicated Market-Wide Risk Dashboard
// Comprehensive multi-factor systemic risk assessment: Low, Moderate, High, Very High.
// Explicit mathematical methodology combining volatility, drawdowns, breadth, crude, and FII flows.

import React, { useEffect, useState } from 'react';
import { getMarketRisk } from '../services/api';
import { ShieldAlert, ShieldCheck, AlertTriangle, Activity, BarChart2, TrendingDown, HelpCircle, CheckCircle2 } from 'lucide-react';

export const RiskMonitorPage: React.FC = () => {
  const [risk, setRisk] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMarketRisk().then(res => {
      setRisk(res);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Computing market-wide systemic risk parameters...</p>
      </div>
    );
  }

  const score = risk?.score || 45;
  const classification = risk?.classification || 'Moderate';
  const factors = risk?.factors || [];
  const mitigations = risk?.mitigations || [];
  const metrics = risk?.metrics || {};

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Market Condition & Systemic Risk Monitor</h1>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          An honest, transparent risk index evaluating multi-layered market stress. We never classify the market as "safe" merely because prices look bullish.
        </p>
      </div>

      {/* Primary Risk Gauge Card */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left: Score Gauge */}
        <div className="flex flex-col items-center text-center space-y-3 shrink-0">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Circular Gauge Background */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#1E2D4A"
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={
                  classification === 'Low'
                    ? '#10B981'
                    : classification === 'High'
                    ? '#F43F5E'
                    : classification === 'Very High'
                    ? '#EF4444'
                    : '#F59E0B'
                }
                strokeWidth="10"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * score) / 100}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center font-mono">
              <span className="text-3xl font-extrabold text-white">{score}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">OUT OF 100</span>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider ${risk?.badgeClass}`}>
            {classification} Systemic Risk
          </div>
        </div>

        {/* Right: Explanation & Context */}
        <div className="space-y-4 max-w-xl">
          <div>
            <h2 className="text-lg font-bold text-white">Current Market Posture Assessment</h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {risk?.description}
            </p>
          </div>

          {/* 4 Quantitative Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#070B14] border border-[#1A2744]">
              <span className="text-slate-500 text-[10px]">52W DRAWDOWN</span>
              <div className="text-sm font-bold text-white mt-0.5">{metrics.drawdownPct}%</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070B14] border border-[#1A2744]">
              <span className="text-slate-500 text-[10px]">BREADTH RATIO</span>
              <div className="text-sm font-bold text-cyan-400 mt-0.5">{metrics.breadthRatio}</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070B14] border border-[#1A2744]">
              <span className="text-slate-500 text-[10px]">CRUDE OIL</span>
              <div className="text-sm font-bold text-amber-400 mt-0.5">${metrics.crudePrice}/bbl</div>
            </div>
            <div className="p-3 rounded-xl bg-[#070B14] border border-[#1A2744]">
              <span className="text-slate-500 text-[10px]">USD / INR</span>
              <div className="text-sm font-bold text-purple-400 mt-0.5">₹{metrics.usdInr}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Both Sides: Risk Factors vs Mitigating Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Identified Stress Factors */}
        <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1A2744]">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider">
              Identified Stress & Downside Factors ({factors.length})
            </h3>
          </div>

          {factors.length === 0 ? (
            <p className="text-xs text-slate-400">No critical acute risk factors currently triggered.</p>
          ) : (
            <div className="space-y-3">
              {factors.map((f: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-rose-300">{f.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400">{f.impact}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{f.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mitigating Support Factors */}
        <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1A2744]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">
              Mitigating Supports & Strengths ({mitigations.length})
            </h3>
          </div>

          {mitigations.length === 0 ? (
            <p className="text-xs text-slate-400">No mitigating macro factors currently detected.</p>
          ) : (
            <div className="space-y-3">
              {mitigations.map((m: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-emerald-300">{m.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">{m.impact}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{m.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Explicit Methodology Box */}
      <div className="p-5 rounded-2xl bg-[#070B14] border border-[#1A2744] flex items-start gap-3 text-xs">
        <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <strong className="text-slate-200">Mathematical Methodology & Scoring Formula:</strong>
          <p className="text-slate-400">
            {risk?.methodology}
            <br />
            <strong>Risk Tiers:</strong> Low (0-30): Favorable accumulation environment. Moderate (31-55): Balanced, selective stock picking required. High (56-75): Defensive hedging advised. Very High (76-100): Capital preservation prioritized.
          </p>
        </div>
      </div>
    </div>
  );
};
