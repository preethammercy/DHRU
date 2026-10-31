// DHRU.AI - Market Overview (Homepage Dashboard)
// Adaptive Desk: When in Indian Market Mode -> 100% Indian Markets (Nifty, Sensex, NSE/BSE equities, ₹ INR)
// When in Crypto Mode -> 100% Crypto & Global Forex Markets (Bitcoin, Ethereum, Solana, XRP, EUR/USD, Gold, US Tech, $ USD)
// Clean, user-friendly, non-AI aesthetic matching Groww and Angel One.

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
  Coins,
  ChevronRight,
  ArrowRight,
  Globe2,
  DollarSign
} from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
  onTradeStock?: (symbol: string) => void;
  onNavigate: (page: string) => void;
}

export const OverviewPage: React.FC<Props> = ({ onSelectStock, onTradeStock, onNavigate }) => {
  const { marketMode, setShowMarketSelector } = useAuth();

  const [data, setData] = useState<any>(null);
  const [fiiDii, setFiiDii] = useState<any>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [cryptoData, setCryptoData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cryptoFilter, setCryptoFilter] = useState<'all' | 'crypto' | 'forex'>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      if (marketMode === 'crypto') {
        const [cryptoRes, forexRes, newsRes] = await Promise.all([
          getCryptoInstruments().catch(() => ({ crypto: [], instruments: [], count: 0 })),
          getForexInstruments().catch(() => ({ forex: [] })),
          getNews().catch(() => ({ news: [] }))
        ]);
        const cryptoList = cryptoRes?.crypto || cryptoRes?.instruments || [];
        const forexList = forexRes?.forex || forexRes?.instruments || [];
        const combined = [...cryptoList, ...forexList];
        setCryptoData(combined);
        setNews(newsRes?.news || []);
      } else {
        const [overviewRes, newsRes, fiiRes] = await Promise.all([
          getMarketOverview().catch(() => ({})),
          getNews().catch(() => ({ news: [] })),
          getFiiDiiData().catch(() => null)
        ]);
        setData(overviewRes);
        setNews(newsRes?.news || []);
        setFiiDii(fiiRes);
      }
    } catch (e) {
      console.error('Overview load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [marketMode]);

  const isCrypto = marketMode === 'crypto';

  if (loading && !data && cryptoData.length === 0) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Loading verified {isCrypto ? 'Crypto & Forex' : 'Indian exchange'} quotes...
        </p>
      </div>
    );
  }

  // Indian mode data
  const indices: Quote[] = data?.indices || [];
  const gainers: Quote[] = data?.gainers || [];
  const losers: Quote[] = data?.losers || [];
  const breadth = data?.breadth || null;
  const status: MarketStatus = data?.status;

  // Crypto & FX mode filtered & sorted lists
  const filteredCrypto = cryptoData.filter(item => {
    if (cryptoFilter === 'crypto') return item.symbol?.includes('USD') && !item.symbol?.includes('=') && !['AAPL', 'NFLX', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META'].includes(item.symbol);
    if (cryptoFilter === 'forex') return item.symbol?.includes('=') || ['AAPL', 'NFLX', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META'].includes(item.symbol);
    return true;
  });

  const cryptoSorted = [...filteredCrypto].sort((a, b) => (b.price || 0) - (a.price || 0));
  const cryptoGainers = [...cryptoData].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 5);
  const cryptoLosers = [...cryptoData].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 5);
  const cryptoAdvances = cryptoData.filter(c => (c.changePercent || 0) >= 0).length;
  const cryptoDeclines = cryptoData.filter(c => (c.changePercent || 0) < 0).length;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Compact market heading: keep live data above promotional copy. */}
      <section className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {isCrypto ? 'Global markets' : 'NSE · BSE'}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            {isCrypto ? 'Crypto and foreign exchange' : 'Market overview'}
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {isCrypto ? 'Prices and daily moves across tracked assets.' : 'Benchmarks, market breadth and the day’s leading stocks.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 sm:justify-end">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <span className={`h-2 w-2 rounded-full ${isCrypto || status?.status === 'Live' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            <span>{isCrypto ? 'Crypto 24/7 · FX 24/5' : status?.label || 'Market status unavailable'}</span>
            {!isCrypto && status?.currentTimeIST && <span className="font-mono text-xs text-slate-500">{status.currentTimeIST} IST</span>}
          </div>
          <button
            onClick={() => onNavigate('terminal')}
            className="min-h-11 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-white"
          >
            Open terminal
          </button>
          <button
            onClick={() => setShowMarketSelector(true)}
            className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {isCrypto ? 'Switch to India' : 'Switch market'}
          </button>
        </div>
      </section>

      {/* 2. Key Benchmark Strips */}
      {isCrypto ? (
        /* CRYPTO & FOREX MODE BENCHMARKS */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Crypto and FX reference prices
              </h2>
            </div>

            {/* Quick Segment Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#0D1527] p-1 rounded-xl border border-slate-200 dark:border-[#1A2744] text-xs">
              <button
                onClick={() => setCryptoFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  cryptoFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                All ({cryptoData.length})
              </button>
              <button
                onClick={() => setCryptoFilter('crypto')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  cryptoFilter === 'crypto'
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Cryptos
              </button>
              <button
                onClick={() => setCryptoFilter('forex')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  cryptoFilter === 'forex'
                    ? 'bg-purple-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Forex & FX
              </button>
            </div>
          </div>

          <div className="mobile-compact-grid">
            {cryptoSorted.slice(0, 4).map((coin) => (
              <LiveCryptoCard
                key={coin.symbol}
                coin={coin}
                onSelect={() => onSelectStock(coin.symbol)}
                onTrade={onTradeStock ? () => onTradeStock(coin.symbol) : undefined}
              />
            ))}
          </div>
        </div>
      ) : (
        /* INDIAN MODE BENCHMARKS */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              Indian Benchmark Indices (NSE & BSE)
            </h2>
            <button
              onClick={() => onNavigate('indices')}
              className="text-xs text-blue-600 dark:text-cyan-400 font-bold hover:underline cursor-pointer"
            >
              All Indices →
            </button>
          </div>

          <div className="mobile-compact-grid">
            {indices.slice(0, 4).map(idx => (
              <LiveIndexCard
                key={idx.symbol}
                quote={idx}
                onSelect={() => onSelectStock(idx.symbol)}
                onTrade={onTradeStock ? () => onTradeStock(idx.symbol) : undefined}
              />
            ))}
          </div>
        </div>
      )}

      {/* 3. Market Health & Breadth */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Advance / Decline Market Breadth */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] flex flex-col justify-between shadow-card zoom-card">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                {isCrypto ? 'Crypto & Forex Market Breadth' : 'NSE Market Breadth'}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                {isCrypto ? `Ratio: ${(cryptoAdvances / (cryptoDeclines || 1)).toFixed(2)}` : breadth ? `Ratio: ${breadth.ratio}` : 'Unavailable'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono py-2">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {isCrypto ? `${cryptoAdvances} Advances` : breadth ? `${breadth.advances} Advances` : 'Advances unavailable'}
              </span>
              <span className="text-rose-600 dark:text-rose-400 font-bold">
                {isCrypto ? `${cryptoDeclines} Declines` : breadth ? `${breadth.declines} Declines` : 'Declines unavailable'}
              </span>
            </div>
            {/* Visual ratio bar */}
            <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full flex overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{
                  width: `${
                    isCrypto
                      ? (cryptoAdvances / (cryptoAdvances + cryptoDeclines || 1)) * 100
                      : breadth ? (breadth.advances / (breadth.advances + breadth.declines || 1)) * 100 : 0
                  }%`
                }}
              />
              <div
                className="bg-rose-500 h-full transition-all duration-500"
                style={{
                  width: `${
                    isCrypto
                      ? (cryptoDeclines / (cryptoAdvances + cryptoDeclines || 1)) * 100
                      : breadth ? (breadth.declines / (breadth.advances + breadth.declines || 1)) * 100 : 0
                  }%`
                }}
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-3">
            {isCrypto
              ? `Counts cover ${cryptoData.length} tracked instruments; they do not represent the full market.`
              : breadth ? 'Counts are calculated from the quote set shown on this page.' : 'Breadth is unavailable because current quote data could not be assembled.'}
          </p>
        </div>

        {/* Institutional / Volume Liquidity Panel */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] flex flex-col justify-between shadow-card zoom-card">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-blue-600" />
                {isCrypto ? 'Global Network & Forex Liquidity' : 'Institutional Flows (FII & DII)'}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">
                {isCrypto ? `${cryptoData.length} tracked instruments` : 'Unavailable'}
              </span>
            </div>
            {isCrypto ? (
              <p className="py-1 text-sm text-slate-600 dark:text-slate-300">Network share and market-wide liquidity metrics are not available from the configured price feed.</p>
            ) : (
              <p className="py-1 text-sm text-slate-600 dark:text-slate-300">FII/DII flows are unavailable. No verified flow source is configured.</p>
            )}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
            {isCrypto ? <span>Feed: public ticker snapshots</span> : <span>{fiiDii?.message || 'Source: unavailable'}</span>}
          </p>
        </div>

      </div>

      {/* 4. Leading Gainers & Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gainers */}
        <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-5 shadow-card zoom-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1A2744]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/30 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Leading {isCrypto ? 'Crypto & Forex' : 'Market'} Gainers
              </h3>
            </div>
            <button
              onClick={() => onNavigate('indices')}
              className="text-xs text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#1A2744]/60">
            {(isCrypto ? cryptoGainers : gainers).map(s => (
              <LiveAssetRow
                key={s.symbol}
                quote={s}
                isCrypto={isCrypto}
                onSelect={() => onSelectStock(s.symbol)}
                onTrade={onTradeStock ? () => onTradeStock(s.symbol) : undefined}
              />
            ))}
          </div>
        </div>

        {/* Losers */}
        <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-5 shadow-card zoom-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1A2744]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/30 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Leading {isCrypto ? 'Crypto & Forex' : 'Market'} Losers
              </h3>
            </div>
            <button
              onClick={() => onNavigate('indices')}
              className="text-xs text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#1A2744]/60">
            {(isCrypto ? cryptoLosers : losers).map(s => (
              <LiveAssetRow
                key={s.symbol}
                quote={s}
                isCrypto={isCrypto}
                onSelect={() => onSelectStock(s.symbol)}
                onTrade={onTradeStock ? () => onTradeStock(s.symbol) : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 5. News Feed */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1A2744]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
              Real-Time {isCrypto ? 'Crypto & Macro' : 'Financial'} News & Sentiment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Verified media feeds with algorithmic bullish/bearish classification
            </p>
          </div>
          <button
            onClick={() => onNavigate('news')}
            className="text-xs font-semibold text-blue-600 dark:text-cyan-400 hover:underline cursor-pointer"
          >
            All News →
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

// Subcomponent: Live Index Card (Indian Mode) with DaisyUI Stat Ergonomics & Material Plus Touch
const LiveIndexCard: React.FC<{ quote: Quote; onSelect: () => void; onTrade?: () => void }> = ({ quote, onSelect, onTrade }) => {
  const live = useLivePrice(quote.symbol, quote);
  const displayPrice = live.price > 0 ? live.price : quote.price;
  const displayChange = live.change !== 0 ? live.change : quote.change;
  const displayChangePercent = live.changePercent !== 0 ? live.changePercent : quote.changePercent;
  const isUp = displayChange >= 0;

  return (
    <div
      onClick={onSelect}
      className="stat-box mobile-stat-card pressable card-3d cursor-pointer group"
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="stat-title truncate max-w-[95px] sm:max-w-none group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
          {quote.name}
        </span>
        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
          {quote.exchange || 'NSE'}
        </span>
      </div>

      <div className={`my-1 text-base sm:text-2xl font-black font-mono tracking-tight transition-colors rounded px-1 -ml-1 ${
        live.flash === 'up'
          ? 'flash-up bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-500/40'
          : live.flash === 'down'
          ? 'flash-down bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 ring-1 ring-rose-500/40'
          : 'text-slate-900 dark:text-white'
      }`}>
        ₹{displayPrice > 0 ? displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Loading...'}
      </div>

      <div className="flex items-center justify-between gap-1 pt-1 text-xs">
        <div className={`stat-desc font-mono font-bold ${
          isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
        }`}>
          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{isUp ? '+' : ''}{displayChangePercent.toFixed(2)}%</span>
        </div>

        {onTrade && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrade();
            }}
            className="px-2 py-0.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-0.5 cursor-pointer"
            title="Trade in Live Terminal"
          >
            <span>Trade</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Subcomponent: Live Crypto & Forex Card (Crypto Mode) with DaisyUI Stat Ergonomics & Material Plus Touch
const LiveCryptoCard: React.FC<{ coin: any; onSelect: () => void; onTrade?: () => void }> = ({ coin, onSelect, onTrade }) => {
  const live = useLivePrice(coin.symbol, coin);
  const displayPrice = live.price > 0 ? live.price : (coin.price || 0);
  const displayChangePercent = live.changePercent !== 0 ? live.changePercent : (coin.changePercent || 0);
  const isUp = displayChangePercent >= 0;
  const isUSD = !coin.symbol?.includes('INR');

  return (
    <div
      onClick={onSelect}
      className="stat-box mobile-stat-card pressable card-3d cursor-pointer group hover:border-purple-500/60 dark:hover:border-purple-500/50"
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-black text-[10px] flex items-center justify-center shrink-0">
            {coin.symbol?.charAt(0) || 'C'}
          </div>
          <span className="stat-title truncate max-w-[80px] sm:max-w-none group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
            {coin.name || coin.symbol}
          </span>
        </div>
        <span className="text-[9px] font-mono text-purple-600 dark:text-purple-400 font-bold uppercase">
          {coin.category ? coin.category.split(' ')[0] : 'CRYPTO'}
        </span>
      </div>

      <div className={`my-1 text-base sm:text-2xl font-black font-mono tracking-tight transition-colors rounded px-1 -ml-1 ${
        live.flash === 'up'
          ? 'flash-up bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-500/40'
          : live.flash === 'down'
          ? 'flash-down bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 ring-1 ring-rose-500/40'
          : 'text-slate-900 dark:text-white'
      }`}>
        {isUSD ? '$' : '₹'}{displayPrice > 0 ? displayPrice.toLocaleString(isUSD ? 'en-US' : 'en-IN', { minimumFractionDigits: displayPrice > 100 ? 2 : (displayPrice < 1 ? 4 : 2), maximumFractionDigits: displayPrice < 1 ? 6 : 2 }) : '0.00'}
      </div>

      <div className="flex items-center justify-between gap-1 pt-1 text-xs">
        <div className={`stat-desc font-mono font-bold ${
          isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
        }`}>
          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          <span>{isUp ? '+' : ''}{displayChangePercent.toFixed(2)}%</span>
        </div>

        {onTrade && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrade();
            }}
            className="px-2 py-0.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold shadow-xs active:scale-95 transition-all flex items-center gap-0.5 cursor-pointer"
            title="Trade in Live Terminal"
          >
            <span>Trade</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Subcomponent: Live Asset Row (Indian or Crypto)
const LiveAssetRow: React.FC<{ quote: any; isCrypto: boolean; onSelect: () => void; onTrade?: () => void }> = ({ quote, isCrypto, onSelect, onTrade }) => {
  const live = useLivePrice(quote.symbol, quote);
  const currency = isCrypto && !quote.symbol?.includes('INR') ? '$' : '₹';
  const price = live.price > 0 ? live.price : (quote.price || 0);
  const changePercent = live.changePercent !== 0 ? live.changePercent : (quote.changePercent || 0);
  const isUp = changePercent >= 0;

  return (
    <div
      onClick={onSelect}
      className="py-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-[#131F38] px-2 rounded-xl cursor-pointer transition-colors group"
    >
      <div>
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 transition-colors">{quote.name}</div>
        <div className="text-[10px] font-mono text-slate-500">{quote.symbol}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right font-mono">
          <div className={`text-xs font-bold transition-colors rounded px-1 ${
            live.flash === 'up'
              ? 'flash-up bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
              : live.flash === 'down'
              ? 'flash-down bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
              : 'text-slate-900 dark:text-white'
          }`}>
            {currency}{price.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { minimumFractionDigits: price > 100 ? 2 : (price < 1 ? 4 : 2), maximumFractionDigits: price < 1 ? 6 : 2 })}
          </div>
          <div className={`text-[11px] font-semibold flex items-center justify-end ${
            isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {isUp ? '+' : ''}{changePercent.toFixed(2)}%
          </div>
        </div>
        {onTrade && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrade();
            }}
            className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
            title="Trade in Live Terminal"
          >
            <span>⚡ Trade</span>
          </button>
        )}
      </div>
    </div>
  );
};
