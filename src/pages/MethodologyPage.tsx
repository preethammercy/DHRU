// DHRU.AI - Data Sources, Methodology & Regulatory Disclosures
// Complete transparency on public data pipelines, refresh schedules, indicator mathematics, and risk formulas.

import React from 'react';
import { Info, Database, Clock, ShieldCheck, Binary, BookOpen, AlertTriangle } from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* Header */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Info className="w-4 h-4 text-cyan-400" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Data Sources, Methodology & Compliance</h1>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          DHRU.AI operates with full institutional transparency. We never fabricate data, timestamps, volume, prices, or candlestick records.
        </p>
      </div>

      {/* 1. Verifiable Public Data Sources */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-[#1A2744]">
          <Database className="w-4 h-4 text-cyan-400" />
          Connected Public Data Architecture
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          
          <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A2744] space-y-1.5">
            <span className="font-bold text-cyan-300">NSE Official Equity Master Archive</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Ingests <code>archives.nseindia.com/content/equities/EQUITY_L.csv</code> directly. Provides official listed tickers, full corporate names, series, ISIN codes, and listing timestamps for 2,600+ equities.
            </p>
            <div className="text-[10px] font-mono text-slate-500">Source: National Stock Exchange of India Official Public Archives</div>
          </div>

          <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A2744] space-y-1.5">
            <span className="font-bold text-blue-300">Public OHLCV Candlestick Feed</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Genuine Open, High, Low, Close, and Volume time-series retrieved from public exchange aggregators. Operates with a standard 15-minute exchange delay during regular market hours (9:15 AM - 3:30 PM IST).
            </p>
            <div className="text-[10px] font-mono text-slate-500">Source: NSE / BSE Delayed Feeds</div>
          </div>

          <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A2744] space-y-1.5">
            <span className="font-bold text-emerald-300">Multi-Publisher Financial RSS Aggregator</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Continuous syndication from Livemint Markets, The Economic Times Markets, and Google News India Finance. Every article includes publisher credits, publication timestamps, and direct source hyperlinks.
            </p>
            <div className="text-[10px] font-mono text-slate-500">Source: Public RSS 2.0 / Atom XML Feeds</div>
          </div>

          <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A2744] space-y-1.5">
            <span className="font-bold text-purple-300">Sovereign Debt & Forex Reference Rates</span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              USD/INR, EUR/INR reference pairs, 10-Year Indian Government Benchmark Bond Yield (G-Sec), and RBI Repo Rate derived from Reserve Bank of India policy announcements and global forex quotations.
            </p>
            <div className="text-[10px] font-mono text-slate-500">Source: RBI Disclosures / Forex Reference</div>
          </div>
        </div>
      </div>

      {/* 2. Refresh Architecture & Scheduling */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-[#1A2744]">
          <Clock className="w-4 h-4 text-amber-400" />
          10-Minute Refresh Architecture & Rate Limiting
        </h2>

        <p className="text-xs text-slate-300 leading-relaxed">
          To maintain respect for upstream public bandwidth and prevent IP blocks, DHRU.AI implements an incremental caching pipeline:
        </p>

        <ol className="list-decimal list-inside space-y-2 text-xs text-slate-400 font-mono">
          <li><strong>Scheduled Polling:</strong> Background worker runs every 10 minutes to poll leading indices and active RSS streams.</li>
          <li><strong>Incremental Invalidation:</strong> Stock quotes are cached in-memory with a 60-second TTL during intraday trading. Complete multi-year candle histories are queried only on demand.</li>
          <li><strong>Rate Limit Awareness:</strong> Batch requests are throttled into polite chunks of 8 concurrent requests.</li>
          <li><strong>Stale State Warnings:</strong> If an upstream public endpoint encounters a temporary network timeout, the platform presents the last known good record along with a transparent staleness warning.</li>
        </ol>
      </div>

      {/* 3. Mathematical Indicator Formulas */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-[#1A2744]">
          <Binary className="w-4 h-4 text-emerald-400" />
          Technical Indicator Mathematics
        </h2>

        <div className="space-y-3 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-[#070B14] border border-[#1A2744] space-y-1 font-mono">
            <strong className="text-white">Relative Strength Index (RSI 14):</strong>
            <p className="text-slate-400">
              RSI = 100 - (100 / (1 + RS)), where RS = Smoothed Average Gain / Smoothed Average Loss over 14 daily candles using Wilder's smoothing method.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#070B14] border border-[#1A2744] space-y-1 font-mono">
            <strong className="text-white">Bollinger Bands (20, 2):</strong>
            <p className="text-slate-400">
              Middle Band = 20-period SMA; Upper Band = Middle + (2 * σ); Lower Band = Middle - (2 * σ), where σ is the 20-period standard deviation of closing prices.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#070B14] border border-[#1A2744] space-y-1 font-mono">
            <strong className="text-white">Standard Floor Pivot Points:</strong>
            <p className="text-slate-400">
              PP = (High + Low + Close) / 3; R1 = (2 * PP) - Low; S1 = (2 * PP) - High; R2 = PP + (High - Low); S2 = PP - (High - Low).
            </p>
          </div>
        </div>
      </div>

      {/* 4. Mandatory SEBI & Regulatory Disclaimers */}
      <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-amber-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          Compliance, Regulatory Disclosures & Risk Warning
        </div>
        <p className="text-slate-300 leading-relaxed">
          <strong>Educational & Informational Platform:</strong> DHRU.AI is built for market education, analytical research, and financial literacy. It is NOT a SEBI-registered Research Analyst (RA) or Investment Advisor (RIA).
        </p>
        <p className="text-slate-400 leading-relaxed">
          None of the probabilistic scenarios, technical indicators, candlestick pattern detections, or AI responses constitute recommendations to buy, sell, or hold any security, derivative contract, or commodity. Equity and derivatives trading involve substantial risk of capital loss. Ordinary retail investors should consult a certified financial advisor before committing real capital.
        </p>
      </div>
    </div>
  );
};
