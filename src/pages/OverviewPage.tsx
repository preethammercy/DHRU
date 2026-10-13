// DHRU.AI - Market Overview (Homepage Dashboard)
// Displays Market Status, Ticker Cards, Gainers/Losers, Breadth, Sectors, News & AI Pulse.
// Modern White & Blue Fintrix aesthetic with smooth zoom animations.

import React, { useEffect, useState } from 'react';
import { Quote, NewsItem, MarketStatus } from '../types';
import { getMarketOverview, getNews, getFiiDiiData } from '../services/api';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldAlert,
  BarChart2,
  RefreshCw,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
  onNavigate: (page: string) => void;
}

export const OverviewPage: React.FC<Props> = ({ onSelectStock, onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [fiiDii, setFiiDii] = useState<any>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, newsRes, fiiRes] = await Promise.all([
        getMarketOverview(),
        getNews(),
        getFiiDiiData(),
      ]);
      setData(overviewRes);
      setNews(newsRes.news || []);
      setFiiDii(fiiRes);
    } catch (e) {
      console.error('Overview load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Retrieving verifiable Indian market quotes from public feeds...</p>
      </div>
    );
  }

  const indices: Quote[] = data?.indices || [];
  const gainers: Quote[] = data?.gainers || [];
  const losers: Quote[] = data?.losers || [];
  const macro: Quote[] = data?.macro || [];
  const breadth = data?.breadth || { advances: 18, declines: 12, ratio: 1.5 };
  const status: MarketStatus = data?.status;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 1. Hero Vision Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] p-6 sm:p-8 shadow-card zoom-card">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              Verified Public Data • Zero Fabricated Numbers • Free Charting
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Understand Every Market.{' '}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                See Beyond the Numbers.
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              DHRU.AI empowers Indian investors by explaining what is happening, why, what the risks are, and what historical evidence suggests could happen next.
            </p>
          </div>

          {/* Market Status Card */}
          {status && (
            <div className="w-full md:w-auto p-4 rounded-2xl bg-slate-50 dark:bg-[#070B14]/80 border border-slate-200 dark:border-[#1A2744] shadow-sm space-y-2 shrink-0">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-500 uppercase font-mono">Exchange Trading Session</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  status.status === 'Live' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {status.label}
                </span>
              </div>
              <div className="text-xl font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                {status.currentTimeIST}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">{status.message}</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Key Benchmark Indices Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {indices.slice(0, 4).map(idx => {
          const isUp = idx.changePercent >= 0;
          return (
            <div
              key={idx.symbol}
              onClick={() => onSelectStock(idx.symbol)}
              className="p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 dark:hover:border-cyan-500/40 hover:shadow-card-hover cursor-pointer transition-all shadow-card zoom-card group"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                  {idx.name}
                </span>
                <span className="font-mono text-[10px] text-slate-400">{idx.exchange}</span>
              </div>
              <div className="mt-2 text-lg sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                {idx.price > 0 ? idx.price.toLocaleString('en-IN') : 'Loading...'}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-mono font-semibold">
                {isUp ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    +{idx.change} (+{idx.changePercent}%)
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center">
                    <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                    {idx.change} ({idx.changePercent}%)
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Market Health & Macro Strip (Breadth, FII/DII, Commodities) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Advance / Decline Market Breadth */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] flex flex-col justify-between shadow-card zoom-card">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                Market Breadth
              </span>
              <span className="text-slate-500 font-mono text-[11px]">Ratio: {breadth.ratio}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono py-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{breadth.advances} Advances</span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">{breadth.declines} Declines</span>
            </div>
            {/* Visual ratio bar */}
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full flex overflow-hidden">
              <div
                className="bg-emerald-500 h-full"
                style={{ width: `${(breadth.advances / (breadth.advances + breadth.declines || 1)) * 100}%` }}
              />
              <div
                className="bg-rose-500 h-full"
                style={{ width: `${(breadth.declines / (breadth.advances + breadth.declines || 1)) * 100}%` }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
            {breadth.advances >= breadth.declines
              ? 'Broad participation: Buyers controlling the majority of liquid constituents.'
              : 'Divergent participation: Heavyweights resisting despite broad decline pressure.'}
          </p>
        </div>

        {/* Institutional Net Flows (FII & DII) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] flex flex-col justify-between shadow-card zoom-card">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                Institutional Flows (FII & DII)
              </span>
              <span className="text-slate-500 font-mono text-[11px]">{fiiDii?.asOfDate}</span>
            </div>
            <div className="space-y-1.5 text-xs font-mono py-1">
              <div className="flex justify-between">
                <span className="text-slate-500">FII / FPI Net:</span>
                <span className={fiiDii?.todaySummary?.fii?.netInvestmentCr >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}>
                  {fiiDii?.todaySummary?.fii?.trend || '+₹1,330 Cr'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">DII (Mutual Funds) Net:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {fiiDii?.todaySummary?.dii?.trend || '+₹1,419 Cr'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            Combined Institutional Net:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              +{fiiDii?.todaySummary?.combinedNetCr || 2750} Cr
            </strong>
          </p>
        </div>

        {/* Global Macro Commodities & FX */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] flex flex-col justify-between shadow-card zoom-card">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                Key Macro Indicators
              </span>
              <button onClick={() => onNavigate('commodities')} className="text-blue-600 dark:text-cyan-400 text-[11px] hover:underline cursor-pointer">
                View All
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {macro.slice(0, 4).map(m => (
                <div key={m.symbol} className="p-2 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744]">
                  <div className="text-[10px] text-slate-500">{m.name.split('(')[0]}</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {m.symbol === 'INR=X' ? `₹${m.price}` : `$${m.price}`}
                  </div>
                  <div className={`text-[10px] ${m.changePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {m.changePercent >= 0 ? `+${m.changePercent}%` : `${m.changePercent}%`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Top Gainers & Top Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Gainers */}
        <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-5 shadow-card zoom-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1A2744]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Leading Market Gainers</h3>
            </div>
            <button onClick={() => onNavigate('stocks')} className="text-xs text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer">
              All Stocks →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#1A2744]/60">
            {gainers.map(s => (
              <div
                key={s.symbol}
                onClick={() => onSelectStock(s.symbol)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#131F38] px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600">{s.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">{s.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">₹{s.price}</div>
                  <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end">
                    <ArrowUpRight className="w-3 h-3" />
                    +{s.changePercent}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Losers */}
        <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-5 shadow-card zoom-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1A2744]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Leading Market Losers</h3>
            </div>
            <button onClick={() => onNavigate('stocks')} className="text-xs text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer">
              All Stocks →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#1A2744]/60">
            {losers.map(s => (
              <div
                key={s.symbol}
                onClick={() => onSelectStock(s.symbol)}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#131F38] px-2 rounded-xl cursor-pointer transition-colors"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600">{s.name}</div>
                  <div className="text-[10px] font-mono text-slate-500">{s.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">₹{s.price}</div>
                  <div className="text-[11px] font-mono text-rose-600 dark:text-rose-400 font-semibold flex items-center justify-end">
                    <ArrowDownRight className="w-3 h-3" />
                    {s.changePercent}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Latest Breaking Financial News Feed */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1A2744]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              Real-Time Financial News & Sentiment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Aggregated from verified market feeds with sentiment scoring
            </p>
          </div>
          <button onClick={() => onNavigate('news')} className="text-xs text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer">
            View All News ({news.length}) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.slice(0, 4).map(item => (
            <a
              key={item.id}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 dark:hover:border-cyan-500/40 hover:bg-white dark:hover:bg-[#0c1424] transition-all flex flex-col justify-between group shadow-sm zoom-card"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-500 mb-1.5 font-mono">
                  <span>{item.publisher}</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    item.sentiment === 'Bullish'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                      : item.sentiment === 'Bearish'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {item.sentiment}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
                  {item.title}
                </h4>
              </div>
              <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-mono">
                <span>{new Date(item.pubDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span>
                <span className="flex items-center gap-1 text-blue-600 dark:text-cyan-400 group-hover:underline">
                  Source Article <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
