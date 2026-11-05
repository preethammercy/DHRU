// DHRU.AI - Dedicated Market-Wide Risk Dashboard
// Comprehensive multi-factor systemic risk assessment: Low, Moderate, High, Very High.
// Explicit mathematical methodology combining volatility, drawdowns, breadth, crude, and FII flows.

import React, { useEffect, useState } from 'react';
import { getMarketRisk } from '../services/api';
import { getChartTheme } from '../design/chartTheme';
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
        <div className="w-8 h-8 border-2 border-line border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-ink-3">Computing market-wide systemic risk parameters...</p>
      </div>
    );
  }

  const score = risk?.score || 45;
  const classification = risk?.classification || 'Moderate';
  const factors = risk?.factors || [];
  const mitigations = risk?.mitigations || [];
  const metrics = risk?.metrics || {};
  const riskColors = getChartTheme(document.documentElement.classList.contains('dark'));

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-surface border border-line rounded-2xl p-6  space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-neg-tint border border-line flex items-center justify-center">
            <ShieldAlert className="w-4 h-4 text-neg" />
          </div>
          <h1 className="text-xl font-extrabold text-ink">Market Condition & Systemic Risk Monitor</h1>
        </div>
        <p className="text-xs text-ink-3 leading-relaxed max-w-3xl">
          An honest, transparent risk index evaluating multi-layered market stress. We never classify the market as "safe" merely because prices look bullish.
        </p>
      </div>

      {/* Primary Risk Gauge Card */}
      <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8  flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left: Score Gauge */}
        <div className="flex flex-col items-center text-center space-y-3 shrink-0">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* Circular Gauge Background */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={riskColors.border}
                strokeWidth="10"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke={
                  classification === 'Low'
                    ? riskColors.pos
                    : classification === 'High'
                    ? riskColors.neg
                    : classification === 'Very High'
                    ? riskColors.neg
                    : riskColors.warn
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
              <span className="text-3xl font-extrabold text-ink">{score}</span>
              <span className="text-ink-3 uppercase tracking-widest">OUT OF 100</span>
            </div>
          </div>

          <div className={`px-4 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider ${risk?.badgeClass}`}>
            {classification} Systemic Risk
          </div>
        </div>

        {/* Right: Explanation & Context */}
        <div className="space-y-4 max-w-xl">
          <div>
            <h2 className="text-lg font-bold text-ink">Current Market Posture Assessment</h2>
            <p className="text-xs text-ink-3 mt-1 leading-relaxed">
              {risk?.description}
            </p>
          </div>

          {/* 4 Quantitative Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-surface border border-line">
              <span className="text-ink-2 text-ink">52W DRAWDOWN</span>
              <div className="text-sm font-bold text-ink mt-0.5">{metrics.drawdownPct}%</div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-line">
              <span className="text-ink-2 text-ink">BREADTH RATIO</span>
              <div className="text-sm font-bold text-brand mt-0.5">{metrics.breadthRatio}</div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-line">
              <span className="text-ink-2 text-ink">CRUDE OIL</span>
              <div className="text-sm font-bold text-warn mt-0.5">${metrics.crudePrice}/bbl</div>
            </div>
            <div className="p-3 rounded-xl bg-surface border border-line">
              <span className="text-ink-2 text-ink">USD / INR</span>
              <div className="text-sm font-bold text-ai mt-0.5">₹{metrics.usdInr}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Both Sides: Risk Factors vs Mitigating Strengths */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Identified Stress Factors */}
        <div className="bg-surface border border-line rounded-2xl p-6  space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <AlertTriangle className="w-4 h-4 text-neg" />
            <h3 className="text-sm font-bold text-neg uppercase tracking-wider">
              Identified Stress & Downside Factors ({factors.length})
            </h3>
          </div>

          {factors.length === 0 ? (
            <p className="text-xs text-ink-3">No critical acute risk factors currently triggered.</p>
          ) : (
            <div className="space-y-3">
              {factors.map((f: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-neg-tint border border-line space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-neg">{f.name}</span>
                    <span className="text-ink font-mono px-2 py-0.5 rounded bg-neg-tint text-neg">{f.impact}</span>
                  </div>
                  <p className="text-ink-3 text-ink leading-relaxed">{f.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mitigating Support Factors */}
        <div className="bg-surface border border-line rounded-2xl p-6  space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-line">
            <ShieldCheck className="w-4 h-4 text-pos" />
            <h3 className="text-sm font-bold text-pos uppercase tracking-wider">
              Mitigating Supports & Strengths ({mitigations.length})
            </h3>
          </div>

          {mitigations.length === 0 ? (
            <p className="text-xs text-ink-3">No mitigating macro factors currently detected.</p>
          ) : (
            <div className="space-y-3">
              {mitigations.map((m: any, i: number) => (
                <div key={i} className="p-3.5 rounded-xl bg-pos-tint border border-line space-y-1 text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-pos">{m.name}</span>
                    <span className="text-ink font-mono px-2 py-0.5 rounded bg-pos-tint text-pos">{m.impact}</span>
                  </div>
                  <p className="text-ink-3 text-ink leading-relaxed">{m.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Explicit Methodology Box */}
      <div className="p-5 rounded-2xl bg-surface border border-line flex items-start gap-3 text-xs">
        <HelpCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <strong className="text-ink-3">Mathematical Methodology & Scoring Formula:</strong>
          <p className="text-ink-3">
            {risk?.methodology}
            <br />
            <strong>Risk Tiers:</strong> Low (0-30): Favorable accumulation environment. Moderate (31-55): Balanced, selective stock picking required. High (56-75): Defensive hedging advised. Very High (76-100): Capital preservation prioritized.
          </p>
        </div>
      </div>
    </div>
  );
};
