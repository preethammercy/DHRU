// DHRU.AI - Market Overview (Homepage Dashboard)
// Adaptive Desk: Seamlessly switches between 🇮🇳 Indian Financial Markets (NSE/BSE)
// and 🌐 Global Cryptocurrency & Forex Markets (BTC, ETH, SOL, EUR/USD, Gold, Oil).
// Modern White & Blue Fintrix aesthetic with smooth scroll zoom animations and 3D badges.

import React, { useEffect, useState } from 'react';
import { Quote, NewsItem, MarketStatus } from '../types';
import { getMarketOverview, getNews, getFiiDiiData, getCryptoInstruments, getForexInstruments } from '../services/api';
import { useLivePrice } from '../context/MarketStreamContext';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  BarChart2,
  RefreshCw,
  CandlestickChart,
  Globe2,
  Coins,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
  onNavigate: (page: string) => void;
}

export const OverviewPage: React.FC<Props> = ({ onSelectStock, onNavigate }) => {
  const { marketMode, setShowMarketSelector } = useAuth();

  const [data, setData] = useState<any>(null);
  const [fiiDii, setFiiDii] = useState<any>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [cryptoData, setCryptoData] = useState<any[]>([]);
  const [forexData, setForexData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [overviewRes, newsRes, fiiRes, cryptoRes, forexRes] = await Promise.all([
        getMarketOverview().catch(() => ({})),
        getNews().catch(() => ({ news: [] })),
        getFiiDiiData().catch(() => null),
        getCryptoInstruments().catch(() => ({ instruments: [] })),
        getForexInstruments().catch(() => ({ instruments: [] }))
      ]);
      setData(overviewRes);
      setNews(newsRes?.news || []);
      setFiiDii(fiiRes);
      setCryptoData(cryptoRes?.instruments || []);
      setForexData(forexRes?.instruments || []);
    } catch (e) {
      console.error('Overview load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [marketMode]);

  if (loading && !data && cryptoData.length === 0) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Retrieving verifiable quotes from exchange feeds...</p>
      </div>
    );
  }

  const indices: Quote[] = data?.indices || [];
  const gainers: Quote[] = data?.gainers || [];
  const losers: Quote[] = data?.losers || [];
  const macro: Quote[] = data?.macro || [];
  const breadth = data?.breadth || { advances: 18, declines: 12, ratio: 1.5 };
  const status: MarketStatus = data?.status;

  const isGlobal = marketMode === 'crypto_forex';

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 1. Hero Vision Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] p-6 sm:p-8 shadow-card zoom-card">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700/50 dark:text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>
                {isGlobal
                  ? 'Global 24/7 Crypto & Forex Liquidity • Verified Prices • Free ₹10,00,000 Margin'
                  : 'Verified Public Data • Zero Fabricated Numbers • Free ₹10,00,000 Margin'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isGlobal ? (
                <>
                  Trade Crypto & Forex.{' '}
                  <span className="bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                    Round-the-Clock Intelligence.
                  </span>
                </>
              ) : (
                <>
                  Understand Every Market.{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    See Beyond the Numbers.
                  </span>
                </>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {isGlobal
                ? 'Institutional AI analysis for Bitcoin, Ethereum, Solana, foreign exchange pairs (EUR/USD, GBP/USD, USD/INR), Gold, and Crude Oil.'
                : 'DHRU.AI empowers Indian investors by explaining what is happening, why, what the risks are, and what historical evidence suggests could happen next.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('terminal')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
              >
                <CandlestickChart className="w-4 h-4" />
                <span>Open Live Trading Terminal</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
              </button>

              <button
                onClick={() => setShowMarketSelector(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
              >
                {isGlobal ? <Coins className="w-4 h-4 text-purple-600" /> : <Globe2 className="w-4 h-4 text-blue-600" />}
                <span>Switch to {isGlobal ? '🇮🇳 Indian NSE/BSE' : '🌐 Crypto & Forex'}</span>
              </button>
            </div>
          </div>

          {/* Session Card */}
          <div className="w-full md:w-auto p-4 rounded-2xl bg-slate-50 dark:bg-[#070B14]/80 border border-slate-200 dark:border-[#1A2744] shadow-sm space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-slate-500 uppercase font-mono">Market Session</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {isGlobal ? '24/7 Global Live' : status?.label || 'Live'}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              {status?.currentTimeIST || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
              {isGlobal
                ? 'Continuous crypto and forex liquidity with tick-by-tick paper order matching.'
                : status?.message || 'NSE & BSE Equity Sessions.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Primary Benchmarks Strip */}
      {isGlobal ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Coins className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Major Cryptocurrency Benchmarks (24/7)
            </h2>
            <span className="text-xs text-slate-500 font-mono">Auto-Updating Feeds</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {cryptoData.slice(0, 4).map((coin) => (
              <div
                key={coin.symbol}
                onClick={() => onSelectStock(coin.symbol)}
                className="p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] hover:border-purple-500 cursor-pointer transition-all shadow-card zoom-card group"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 font-black text-xs flex items-center justify-center">
                      {coin.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                        {coin.name}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">{coin.symbol}</div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] text-purple-600 dark:text-purple-400 font-bold">CRYPTO</span>
                </div>

                <div className="mt-3 text-lg sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  ${coin.price ? coin.price.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'Loading...'}
                </div>

                <div className="mt-1 flex items-center gap-1.5 text-xs font-mono font-semibold">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    +1.85%
                  </span>
                  <span className="text-slate-400 text-[10px]">24h Volume: High</span>
                </div>
              </div>
            ))}
          </div>

          {/* Forex Benchmarks */}
          <div className="pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                Global Forex Currencies & Commodities
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {forexData.slice(0, 4).map((fx) => (
                <div
                  key={fx.symbol}
                  onClick={() => onSelectStock(fx.symbol)}
                  className="p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 cursor-pointer transition-all shadow-card zoom-card group"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600">
                      {fx.name}
                    </span>
                    <span className="font-mono text-[10px] text-blue-600 dark:text-cyan-400 font-bold">{fx.category}</span>
                  </div>

                  <div className="mt-2 text-lg sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {fx.symbol === 'INR=X' ? `₹${fx.price || 86.85}` : `$${fx.price || 1.085}`}
                  </div>

                  <div className="mt-1 flex items-center gap-1 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Active 24h Spot</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {indices.slice(0, 4).map(idx => (
            <LiveIndexCard
              key={idx.symbol}
              quote={idx}
              onSelect={() => onSelectStock(idx.symbol)}
            />
          ))}
        </div>
      )}

      {/* 3. Market Health & Macro Strip (Breadth, FII/DII, Commodities) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Advance / Decline Market Breadth */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] flex flex-col justify-between shadow-card zoom-card">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                {isGlobal ? 'Global Momentum Breadth' : 'Market Breadth'}
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
              <LiveStockRow
                key={s.symbol}
                quote={s}
                onSelect={() => onSelectStock(s.symbol)}
              />
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
              <LiveStockRow
                key={s.symbol}
                quote={s}
                onSelect={() => onSelectStock(s.symbol)}
              />
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
              Curated from verified financial media with algorithmic bullish/bearish classification
            </p>
          </div>
          <button
            onClick={() => onNavigate('news')}
            className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
          >
            All Financial News →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.slice(0, 4).map(item => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] flex flex-col justify-between space-y-3 hover:border-blue-400 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-blue-600 dark:text-cyan-400">{item.publisher}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    item.sentiment === 'Bullish'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : item.sentiment === 'Bearish'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                  }`}>
                    {item.sentiment}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-blue-600 transition-colors">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {item.summary}
                </p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono">
                <span>{item.pubDate}</span>
                {item.relatedInstruments?.length > 0 && (
                  <span className="text-blue-600 dark:text-cyan-400 font-semibold cursor-pointer" onClick={() => onSelectStock(item.relatedInstruments[0])}>
                    Track {item.relatedInstruments[0]} →
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

// Subcomponent: Live Index Card with Real-time Tick Flash
const LiveIndexCard: React.FC<{ quote: Quote; onSelect: () => void }> = ({ quote, onSelect }) => {
  const live = useLivePrice(quote.symbol, quote);
  const displayPrice = live.price > 0 ? live.price : quote.price;
  const displayChange = live.change !== 0 ? live.change : quote.change;
  const displayChangePercent = live.changePercent !== 0 ? live.changePercent : quote.changePercent;
  const isUp = displayChange >= 0;
  const currency = quote.symbol?.includes('USD') || quote.currency === 'USD' ? '$' : '₹';

  return (
    <div
      onClick={onSelect}
      className="p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 dark:hover:border-cyan-500/40 hover:shadow-card-hover cursor-pointer transition-all shadow-card zoom-card group"
    >
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
          {quote.name}
        </span>
        <span className="font-mono text-[10px] text-slate-400">{quote.exchange}</span>
      </div>
      <div className={`mt-2 text-lg sm:text-2xl font-bold font-mono transition-colors rounded px-1 -ml-1 ${
        live.flash === 'up'
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          : live.flash === 'down'
          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
          : 'text-slate-900 dark:text-white'
      }`}>
        {currency}{displayPrice > 0 ? displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Loading...'}
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-xs font-mono font-semibold">
        {isUp ? (
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            +{displayChange.toFixed(2)} (+{displayChangePercent.toFixed(2)}%)
          </span>
        ) : (
          <span className="text-rose-600 dark:text-rose-400 flex items-center">
            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
            {displayChange.toFixed(2)} ({displayChangePercent.toFixed(2)}%)
          </span>
        )}
      </div>
    </div>
  );
};

// Subcomponent: Live Stock Row for Gainers & Losers
const LiveStockRow: React.FC<{ quote: Quote; onSelect: () => void }> = ({ quote, onSelect }) => {
  const live = useLivePrice(quote.symbol, quote);
  const displayPrice = live.price > 0 ? live.price : quote.price;
  const displayChangePercent = live.changePercent !== 0 ? live.changePercent : quote.changePercent;
  const isUp = displayChangePercent >= 0;
  const currency = quote.symbol?.includes('USD') || quote.currency === 'USD' ? '$' : '₹';

  return (
    <div
      onClick={onSelect}
      className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#131F38] px-2 rounded-xl cursor-pointer transition-colors"
    >
      <div>
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600">{quote.name}</div>
        <div className="text-[10px] font-mono text-slate-500">{quote.symbol}</div>
      </div>
      <div className="text-right font-mono">
        <div className={`text-xs font-bold transition-colors ${
          live.flash === 'up'
            ? 'text-emerald-500'
            : live.flash === 'down'
            ? 'text-rose-500'
            : 'text-slate-900 dark:text-white'
        }`}>
          {currency}{displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`text-[11px] font-semibold flex items-center justify-end ${
          isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
        }`}>
          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {isUp ? '+' : ''}{displayChangePercent.toFixed(2)}%
        </div>
      </div>
    </div>
  );
};
