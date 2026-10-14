// DHRU.AI - Deep Market Intelligence Report Component
// Features Actionable Trade Setup (Entry Zone, Stop Loss, Target 1/2/3, RRR, Timing, Exit Rules),
// Direction, Trend Strength, Positive/Negative Catalysts, Support/Resistance,
// 3 Multi-Horizon Probabilistic Scenarios, and a Beginner's Plain English Breakdown.

import React, { useState } from 'react';
import { AiReport } from '../../types';
import {
  Sparkles,
  BrainCircuit,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  HelpCircle,
  CheckCircle,
  RefreshCw,
  Target,
  Clock,
  LogOut,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { runAiAnalysis } from '../../services/api';

interface Props {
  symbol: string;
  initialReport: AiReport | null;
}

export const GeminiReport: React.FC<Props> = ({ symbol, initialReport }) => {
  const [report, setReport] = useState<AiReport | null>(initialReport);
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      const data = await runAiAnalysis(symbol);
      setReport(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!report && !loading) {
    return (
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 text-center space-y-3 shadow-card zoom-card">
        <Sparkles className="w-8 h-8 text-blue-600 dark:text-cyan-400 mx-auto" />
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Deep Market Intelligence Report Available</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Generate an institutional AI synthesis combining verified exchange quotes, calculated moving averages, and news sentiment.
        </p>
        <button
          onClick={handleRegenerate}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
          Generate DHRU Intelligence Report
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-8 text-center space-y-4 shadow-card animate-pulse">
        <div className="w-10 h-10 border-2 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
          Synthesizing Intelligence with DHRU.AI...
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
          Processing real-time exchange candles, evaluating Smart Money concepts, and calculating trade setup levels.
        </p>
      </div>
    );
  }

  if (!report) return null;

  const isBullish = report.direction === 'Bullish';
  const isBearish = report.direction === 'Bearish';
  const trade = report.tradeSetup;

  return (
    <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-[#1A2744]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                AI Market Outlook & Trade Setup
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-slate-800 dark:text-cyan-300 border border-blue-200 dark:border-slate-700 font-semibold">
                DHRU Institutional AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified mathematical indicators, Smart Money order blocks, and trade triggers
            </p>
          </div>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Re-Analyze
        </button>
      </div>

      {/* ACTIONABLE TRADE SETUP CARD (USER REQUIREMENT) */}
      {trade && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 via-indigo-50/30 to-white dark:from-[#0B1528] dark:via-[#091020] dark:to-[#070B14] border-2 border-blue-200 dark:border-blue-900/60 shadow-lg space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-200/60 dark:border-blue-900/40 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600 dark:bg-cyan-400"></span>
              </span>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Institutional Trade Execution Plan
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                trade.action === 'BUY'
                  ? 'bg-emerald-600 text-white'
                  : trade.action === 'SELL'
                  ? 'bg-rose-600 text-white'
                  : 'bg-amber-500 text-white'
              }`}>
                {trade.action} SETUP
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                RRR {trade.riskRewardRatio}
              </span>
            </div>
          </div>

          {/* Grid of Exact Price Points */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            
            {/* Entry Zone */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#0E1A33] border border-blue-200 dark:border-blue-800/50">
              <div className="text-[10px] uppercase font-mono font-bold text-blue-600 dark:text-cyan-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                Optimal Entry Zone
              </div>
              <div className="text-sm font-black font-mono text-slate-900 dark:text-white mt-1">
                {trade.entryZone}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Pivot: {trade.entryPrice}
              </div>
            </div>

            {/* Stop Loss */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#0E1A33] border border-rose-200 dark:border-rose-900/50">
              <div className="text-[10px] uppercase font-mono font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                Hard Stop Loss (SL)
              </div>
              <div className="text-sm font-black font-mono text-rose-600 dark:text-rose-400 mt-1">
                {trade.stopLoss}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Strict Invalid Level
              </div>
            </div>

            {/* Target 1 */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#0E1A33] border border-emerald-200 dark:border-emerald-900/50">
              <div className="text-[10px] uppercase font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                Target 1 (Conservative)
              </div>
              <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {trade.target1}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Lock 50% Profit & Trail
              </div>
            </div>

            {/* Target 2 & 3 */}
            <div className="p-3 rounded-xl bg-white dark:bg-[#0E1A33] border border-indigo-200 dark:border-indigo-900/50">
              <div className="text-[10px] uppercase font-mono font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                <Target className="w-3.5 h-3.5" />
                Target 2 / Target 3
              </div>
              <div className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
                {trade.target2} / {trade.target3}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                Extension Run
              </div>
            </div>

          </div>

          {/* Timing & Exit Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#0A1224] border border-slate-200 dark:border-slate-800">
              <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">When to Enter (Time Window):</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{trade.optimalTimeWindow}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-[#0A1224] border border-slate-200 dark:border-slate-800">
              <LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">When to Exit / Exit Criteria:</span>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{trade.exitCriteria}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Primary Direction & Trend Strength Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Direction Badge */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          isBullish
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-400'
            : isBearish
            ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-400'
            : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400'
        }`}>
          {isBullish ? <ArrowUpRight className="w-6 h-6 text-emerald-600" /> : isBearish ? <ArrowDownRight className="w-6 h-6 text-rose-600" /> : <Compass className="w-6 h-6 text-amber-600" />}
          <div>
            <div className="text-[10px] uppercase font-mono tracking-wider opacity-80">Market Direction</div>
            <div className="text-base font-extrabold">{report.direction}</div>
          </div>
        </div>

        {/* Trend Strength */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] flex flex-col justify-between">
          <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Trend Strength</div>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-2">
            <span>{report.trendStrength} Conviction</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-normal">
              Confidence: {report.confidenceRating}
            </span>
          </div>
        </div>

        {/* Downside Risk & Stop Loss */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] flex flex-col justify-between">
          <div className="text-[10px] uppercase font-mono text-slate-500 tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            Downside Risk & Protective Bounds
          </div>
          <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 font-mono">
            {report.downsideRisk}
          </div>
        </div>
      </div>

      {/* Structural Trend Evidence */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] space-y-1 text-xs">
        <span className="font-semibold text-slate-800 dark:text-slate-200">Technical Posture & Evidence:</span>
        <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{report.trendEvidence}</p>
      </div>

      {/* Positive and Negative Catalysts (Two Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        
        {/* Positive Catalysts */}
        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 space-y-2">
          <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Positive Catalysts (Upside Drivers)
          </div>
          <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
            {report.positiveCatalysts?.map((cat, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 font-bold">•</span>
                <span>{cat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Negative Catalysts & Risks */}
        <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 space-y-2">
          <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Negative Catalysts (Downside Risks)
          </div>
          <ul className="space-y-1.5 text-slate-700 dark:text-slate-300">
            {report.negativeCatalysts?.map((cat, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-rose-600 dark:text-rose-400 mt-0.5 font-bold">•</span>
                <span>{cat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Support & Resistance Estimates */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] space-y-1.5 text-xs font-mono">
        <span className="font-semibold text-slate-800 dark:text-slate-200">Support & Resistance Roadmap:</span>
        <p className="text-slate-700 dark:text-slate-300">{report.supportResistanceSummary}</p>
      </div>

      {/* Three Multi-Horizon Forecast Scenarios */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          Probabilistic Multi-Horizon Scenarios
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Horizon 1: Next Session */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] space-y-1.5">
            <div className="text-blue-600 dark:text-cyan-400 font-bold font-mono text-[11px] uppercase">
              Horizon 1: Next Session
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px]">
              {report.scenarios?.nextSession}
            </p>
          </div>

          {/* Horizon 2: 5 Trading Days */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] space-y-1.5">
            <div className="text-blue-700 dark:text-blue-400 font-bold font-mono text-[11px] uppercase">
              Horizon 2: 5 Trading Days (1-Week)
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-mono text-[11px]">
              {report.scenarios?.fiveDays}
            </p>
          </div>

          {/* Horizon 3: 1 Month */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] space-y-1.5">
            <div className="text-indigo-600 dark:text-purple-400 font-bold font-mono text-[11px] uppercase">
              Horizon 3: 1 Month Structural Trend
            </div>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
              {report.scenarios?.oneMonth}
            </p>
          </div>
        </div>
      </div>

      {/* Plain English Explanation for Beginners */}
      <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-gradient-to-r dark:from-blue-950/40 dark:via-cyan-950/30 dark:to-[#070B14] border border-blue-200 dark:border-cyan-500/30 space-y-2">
        <div className="flex items-center gap-2 text-blue-700 dark:text-cyan-300 font-bold text-xs uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          Beginner's Plain English Breakdown (Zero Jargon)
        </div>
        <p className="text-slate-700 dark:text-slate-200 text-xs leading-relaxed">
          {report.beginnerExplanation}
        </p>
      </div>

      {/* Regulatory Transparency Note */}
      <div className="text-[11px] text-slate-500 font-mono leading-relaxed pt-2 border-t border-slate-200 dark:border-[#1A2744]">
        ⚠️ <strong>Important Disclosure:</strong> AI-generated analysis and trade setups represent algorithmic pattern recognition and quantitative probability distributions. Always adhere strictly to risk management rules. Not SEBI-registered investment advice.
      </div>
    </div>
  );
};
