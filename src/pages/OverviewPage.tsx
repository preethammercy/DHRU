// DHRU.AI - Market Overview (Homepage Dashboard)
// Adaptive Desk: When in Indian Market Mode -> 100% Indian Markets (Nifty, Sensex, NSE/BSE equities, ₹ INR)
// Crypto quotes are denominated in USDT (not USD).
// Clean, user-friendly, non-AI aesthetic matching Groww and Angel One.

import React, { useEffect, useState } from 'react';
import { Quote, NewsItem, MarketStatus } from '../types';
import { getMarketOverview, getNews, getFiiDiiData, getCryptoInstruments } from '../services/api';
import { useLivePrice } from '../context/MarketStreamContext';
import { QuoteFreshness } from '../components/market/QuoteFreshness';
import { useAuth } from '../context/AuthContext';
import { formatTimeAgo } from '../utils/formatters';
import { Button } from '../components/ui/Button';
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

  const loadData = async () => {
    setLoading(true);
    try {
      if (marketMode === 'crypto') {
        const [cryptoRes, newsRes] = await Promise.all([
          getCryptoInstruments().catch(() => ({ crypto: [], instruments: [], count: 0 })),
          getNews(false, 'CRYPTO').catch(() => ({ news: [] }))
        ]);
        const cryptoList = cryptoRes?.crypto || cryptoRes?.instruments || [];
        setCryptoData(cryptoList.filter((asset: any) => String(asset.symbol).endsWith('-USD')));
        setNews(newsRes?.news || newsRes?.articles || []);
      } else {
        const [overviewRes, newsRes, fiiRes] = await Promise.all([
          getMarketOverview().catch(() => ({})),
          getNews(false, 'NSE').catch(() => ({ news: [] })),
          getFiiDiiData().catch(() => null)
        ]);
        setData(overviewRes);
        setNews(newsRes?.news || newsRes?.articles || []);
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
    let interval: ReturnType<typeof setInterval> | undefined;
    if (marketMode === 'crypto') {
      interval = setInterval(async () => {
        try {
          const cryptoRes = await getCryptoInstruments().catch(() => null);
          const cryptoList = cryptoRes?.crypto || cryptoRes?.instruments || [];
          if (cryptoList.length > 0) {
            setCryptoData(cryptoList.filter((asset: any) => String(asset.symbol).endsWith('-USD')));
          }
        } catch {}
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [marketMode]);

  const isCrypto = marketMode === 'crypto';

  if (loading && !data && cryptoData.length === 0) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-line dark:border-line border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-ink-2 dark:text-ink-3">
          Loading verified {isCrypto ? 'Crypto' : 'Indian exchange'} quotes...
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

  const cryptoSorted = [...cryptoData].sort((a, b) => (b.price || 0) - (a.price || 0));
  const cryptoGainers = [...cryptoData].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 5);
  const cryptoLosers = [...cryptoData].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 5);
  const cryptoAdvances = cryptoData.filter(c => (c.changePercent || 0) >= 0).length;
  const cryptoDeclines = cryptoData.filter(c => (c.changePercent || 0) < 0).length;

  return (
    <div className="space-y-8 animate-fade-in pb-32 lg:pb-16">
      
      {/* 1. Hero Vision Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-surface dark:bg-surface border border-line dark:border-line p-4 sm:p-8  zoom-card">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-brand-fill rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
          <div className="max-w-2xl space-y-2.5 sm:space-y-3">
            <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-surface-2 border border-line text-brand dark:bg-surface-2 dark:border-line dark:text-brand text-[11px] sm:text-xs font-semibold max-w-full">
              <Sparkles className="w-3.5 h-3.5 text-brand dark:text-brand shrink-0" />
              <span className="whitespace-normal break-words">
                {isCrypto
                  ? 'Crypto Desk • Binance USDT Pairs • 24/7 Market Feed'
                  : 'NSE & BSE quotes • provider and freshness shown • ₹10L paper capital'}
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-ink dark:text-ink leading-tight">
              {isCrypto ? (
                <>
                  Crypto Markets.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-400 dark:to-blue-400">
                    Round-The-Clock Precision.
                  </span>
                </>
              ) : (
                <>
                  Understand Every Market.{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-blue-600 dark:from-sky-400 dark:to-blue-400">
                    See Beyond the Numbers.
                  </span>
                </>
              )}
            </h1>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-medium leading-relaxed">
              {isCrypto
                ? 'Institutional AI analysis and real-time ticks for Bitcoin, Ethereum, Solana, XRP and other Binance USDT pairs.'
                : 'DHRU.AI empowers Indian investors by explaining what is happening, why, what the risks are, and what historical evidence suggests could happen next in ₹ INR.'}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
              <Button
                variant="trade"
                size="md"
                onClick={() => onNavigate('terminal')}
                icon={<CandlestickChart className="w-4 h-4" />}
              >
                <span>Open {isCrypto ? 'Crypto' : 'Indian'} Terminal</span>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse ml-0.5 inline-block" />
              </Button>

              <button
                onClick={() => setShowMarketSelector(true)}
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs hover:-translate-y-0.5 active:scale-[0.97] transition-all cursor-pointer"
              >
                {isCrypto ? <span>🇮🇳</span> : <Coins className="w-4 h-4 text-amber-400" />}
                <span>Switch to {isCrypto ? 'Indian (₹)' : 'Crypto ($)'}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {isCrypto ? 'NSE/BSE' : '24/7 Live'}
                </span>
              </button>
            </div>
          </div>

          {/* Session Status Card */}
          <div className="w-full md:w-auto p-4 rounded-2xl bg-surface-2 dark:bg-surface border border-line dark:border-line  space-y-2 shrink-0">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-ink-2 uppercase font-mono">Market Session</span>
              <span className={`px-2.5 py-0.5 rounded-full text-ink font-bold flex items-center gap-1 ${
                isCrypto || status?.status === 'Live'
                  ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos'
                  : 'bg-surface-2 text-ink-2 dark:bg-surface-2 dark:text-ink-3'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isCrypto || status?.status === 'Live' ? 'bg-pos animate-ping' : 'bg-surface-2'}`} />
                {isCrypto ? '24/7 Global Live' : status?.label || 'Market Closed'}
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-ink dark:text-ink flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand dark:text-brand" />
              {status?.currentTimeIST || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <p className="text-ink-2 dark:text-ink-3 max-w-xs">
              {isCrypto
                ? `${cryptoData.length} cryptocurrency pairs quoted in USDT.`
                : status?.message || 'NSE & BSE Equity Trading Sessions in INR.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Key Benchmark Strips */}
      {isCrypto ? (
        /* CRYPTO MODE BENCHMARKS */
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-ai dark:text-ai" />
              <h2 className="text-sm font-extrabold text-ink dark:text-ink uppercase tracking-wider">
                Top Crypto Benchmarks (24/7 Real-Time)
              </h2>
            </div>

            <span className="badge-8k border border-line bg-surface text-ink">USDT · {cryptoData.length} crypto assets</span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
            <h2 className="text-sm font-extrabold text-ink dark:text-ink uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand dark:text-brand" />
              Indian Benchmark Indices (NSE & BSE)
            </h2>
            <button
              onClick={() => onNavigate('indices')}
              className="text-xs text-brand dark:text-brand font-bold hover:underline cursor-pointer"
            >
              All Indices →
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
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
        <div className="p-5 rounded-2xl bg-surface dark:bg-surface border border-line dark:border-line flex flex-col justify-between  zoom-card">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-ink dark:text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart2 className="w-4 h-4 text-brand dark:text-brand" />
                {isCrypto ? 'Crypto Market Breadth' : 'NSE Market Breadth'}
              </span>
              <span className="text-ink-2 font-mono text-ink">
                {isCrypto ? `Ratio: ${(cryptoAdvances / (cryptoDeclines || 1)).toFixed(2)}` : breadth ? `Ratio: ${breadth.ratio}` : 'Unavailable'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono py-2">
              <span className="text-pos dark:text-pos font-bold">
                {isCrypto ? `${cryptoAdvances} Advances` : breadth ? `${breadth.advances} Advances` : 'Advances unavailable'}
              </span>
              <span className="text-neg dark:text-neg font-bold">
                {isCrypto ? `${cryptoDeclines} Declines` : breadth ? `${breadth.declines} Declines` : 'Declines unavailable'}
              </span>
            </div>
            {/* Visual ratio bar */}
            <div className="h-2 w-full bg-surface-2 dark:bg-surface-2 rounded-full flex overflow-hidden">
              <div
                className="bg-pos h-full transition-all duration-500"
                style={{
                  width: `${
                    isCrypto
                      ? (cryptoAdvances / (cryptoAdvances + cryptoDeclines || 1)) * 100
                      : breadth ? (breadth.advances / (breadth.advances + breadth.declines || 1)) * 100 : 0
                  }%`
                }}
              />
              <div
                className="bg-neg h-full transition-all duration-500"
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
          <p className="text-ink-2 dark:text-ink-3 mt-3">
            {isCrypto
              ? cryptoAdvances >= cryptoDeclines
                ? 'Bullish regime: Buyers absorbing supply across major digital & forex pairs.'
                : 'Consolidation regime: Market taking profits after recent impulse.'
              : breadth && breadth.advances >= breadth.declines
              ? 'Broad participation: Buyers controlling majority of liquid Indian equities.'
              : 'Divergent participation: Heavyweights resisting despite broad decline pressure.'}
          </p>
        </div>

        {/* Institutional / Volume Liquidity Panel */}
        <div className="p-5 rounded-2xl bg-surface dark:bg-surface border border-line dark:border-line flex flex-col justify-between  zoom-card">
          <div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-ink dark:text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand" />
                {isCrypto ? 'Crypto Market Activity' : 'Institutional Flows (FII & DII)'}
              </span>
              <span className="text-ink-2 font-mono text-ink">
                {isCrypto ? `${cryptoData.length} crypto assets` : (fiiDii?.asOfDate || 'Date unavailable')}
              </span>
            </div>
            {isCrypto ? (
              <div className="space-y-1.5 text-xs font-mono py-1">
                <div className="flex justify-between">
                  <span className="text-ink-2">Bitcoin Dominance:</span>
                  <span className="text-ink-3 font-bold">Unavailable</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2">24/7 Matching Engine:</span>
                  <span className="text-info font-bold">24/7 crypto market</span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 text-xs font-mono py-1">
                <div className="flex justify-between">
                  <span className="text-ink-2">FII / FPI Net:</span>
                  <span className={typeof fiiDii?.todaySummary?.fii?.netInvestmentCr === 'number' ? (fiiDii.todaySummary.fii.netInvestmentCr >= 0 ? 'text-pos font-bold' : 'text-neg font-bold') : 'text-ink-3 font-bold'}>
                    {fiiDii?.todaySummary?.fii?.trend || 'Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2">DII (Mutual Funds) Net:</span>
                  <span className="text-ink-3 font-bold">
                    {fiiDii?.todaySummary?.dii?.trend || 'Unavailable'}
                  </span>
                </div>
              </div>
            )}
          </div>
          <p className="text-ink-2 dark:text-ink-3 mt-2">
            {isCrypto ? (
              <span>Order Execution: <strong className="text-pos dark:text-pos">Sub-second tick matching active</strong></span>
            ) : (
              <span>Combined Institutional Net: <strong className="text-ink-3">{Number.isFinite(fiiDii?.todaySummary?.combinedNetCr) ? `₹${fiiDii.todaySummary.combinedNetCr.toLocaleString('en-IN')} Cr` : 'Unavailable'}</strong></span>
            )}
          </p>
        </div>

      </div>

      {/* 4. Leading Gainers & Losers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gainers */}
        <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-5  zoom-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-line dark:border-line">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-2 border border-line dark:bg-pos-tint dark:border-line flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-pos dark:text-pos" />
              </div>
              <h3 className="text-sm font-bold text-ink dark:text-ink">
                Leading {isCrypto ? 'Crypto' : 'Market'} Gainers
              </h3>
            </div>
            <button
              onClick={() => onNavigate('indices')}
              className="text-xs text-brand dark:text-brand hover:underline cursor-pointer"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-line dark:divide-line">
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
        <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-5  zoom-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-line dark:border-line">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-surface-2 border border-line dark:bg-neg-tint dark:border-line flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-neg dark:text-neg" />
              </div>
              <h3 className="text-sm font-bold text-ink dark:text-ink">
                Leading {isCrypto ? 'Crypto' : 'Market'} Losers
              </h3>
            </div>
            <button
              onClick={() => onNavigate('indices')}
              className="text-xs text-brand dark:text-brand hover:underline cursor-pointer"
            >
              View All →
            </button>
          </div>

          <div className="divide-y divide-line dark:divide-line">
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
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-6  space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line dark:border-line">
          <div>
            <h3 className="text-sm font-bold text-ink dark:text-ink flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              Real-Time {isCrypto ? 'Crypto & Macro' : 'Financial'} News & Sentiment
            </h3>
            <p className="text-xs text-ink-2 dark:text-ink-3 mt-0.5">
              Verified {isCrypto ? 'CoinDesk, Cointelegraph & Crypto wires' : 'NSE, Livemint, ET & Market feeds'} · strictly refreshed ≤ 48h
            </p>
          </div>
          <button
            onClick={() => onNavigate('news')}
            className="text-xs font-semibold text-brand dark:text-brand hover:underline cursor-pointer"
          >
            All News →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {news.slice(0, 4).map(item => (
            <div
              key={item.id}
              className="p-4 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line flex flex-col justify-between space-y-3 hover:border-line transition-colors"
            >
              <div>
                <div className="flex items-center justify-between text-ink mb-1">
                  <span className="font-semibold text-brand dark:text-brand">{item.publisher}</span>
                  <span className={`px-2 py-0.5 rounded text-ink font-bold ${
                    item.sentiment === 'Bullish'
                      ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos'
                      : item.sentiment === 'Bearish'
                      ? 'bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg'
                      : 'bg-surface-2 text-ink dark:bg-surface-2 dark:text-ink-3'
                  }`}>
                    {item.sentiment}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-ink dark:text-ink line-clamp-2 hover:text-brand transition-colors">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </h4>
                <p className="text-ink-2 dark:text-ink-3 line-clamp-2 mt-1">
                  {item.summary}
                </p>
              </div>

              <div className="flex items-center justify-between text-ink-3 pt-2 border-t border-line dark:border-line font-mono text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  {formatTimeAgo(item.pubDate)}
                </span>
                {item.relatedInstruments?.length > 0 && (
                  <span className="text-brand dark:text-brand font-semibold cursor-pointer" onClick={() => onSelectStock(item.relatedInstruments[0])}>
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
      className="min-w-0 rounded-xl border border-line bg-surface p-3 sm:p-4 transition-colors hover:border-info hover:bg-surface-2 cursor-pointer group"
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[10px] sm:text-xs font-semibold text-ink-3 uppercase truncate max-w-[95px] sm:max-w-none group-hover:text-brand dark:group-hover:text-brand transition-colors">
          {quote.name}
        </span>
        <span className="text-ink font-mono font-bold px-1.5 py-0.5 rounded bg-surface-2 dark:bg-surface-2 text-ink-2">
          {quote.exchange || 'NSE'}
        </span>
      </div>

      <div className={`my-1 text-base sm:text-2xl font-black font-mono tracking-tight transition-colors rounded px-1 -ml-1 ${
        live.flash === 'up'
          ? 'flash-up bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos ring-1 ring-pos'
          : live.flash === 'down'
          ? 'flash-down bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg ring-1 ring-neg'
          : 'text-ink dark:text-ink'
      }`}>
        ₹{displayPrice > 0 ? displayPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'Loading...'}
      </div>
      <QuoteFreshness status={live.status} source={live.source} lastUpdated={live.lastUpdated} timestamp={live.timestamp} />

      <div className="flex items-center justify-between gap-1 pt-1 text-xs">
        <div className={`flex items-center gap-1 text-xs font-mono font-bold ${
          isUp ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
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
            className="px-2 py-0.5 rounded-lg bg-surface-2 hover:bg-brand-fill hover:text-white text-ink-2 font-bold active:scale-95 transition-all flex items-center gap-0.5 cursor-pointer border border-line"
            title="View Index Chart & Constituents"
          >
            <span>View</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Subcomponent: USD quoted crypto market card
const LiveCryptoCard: React.FC<{ coin: any; onSelect: () => void; onTrade?: () => void }> = ({ coin, onSelect, onTrade }) => {
  const live = useLivePrice(coin.symbol, coin);
  const displayPrice = live.price > 0 ? live.price : (coin.price || 0);
  const displayChangePercent = live.changePercent !== 0 ? live.changePercent : (coin.changePercent || 0);
  const isUp = displayChangePercent >= 0;
  const quoteCurrency = live.currency || coin.currency || 'USDT';
  const isUSD = quoteCurrency === 'USD' || quoteCurrency === 'USDT';

  return (
    <div
      onClick={onSelect}
      className="min-w-0 rounded-xl border border-line bg-surface p-3 sm:p-4 transition-colors hover:border-info hover:bg-surface-2 cursor-pointer group"
    >
      <div className="flex items-center justify-between gap-1 mb-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-surface-2 dark:bg-surface-2 text-ai dark:text-ai font-black text-ink flex items-center justify-center shrink-0">
            {coin.symbol?.charAt(0) || 'C'}
          </div>
          <span className="text-[10px] sm:text-xs font-semibold text-ink-3 truncate max-w-[80px] sm:max-w-none group-hover:text-ai dark:group-hover:text-ai transition-colors">
            {coin.name || coin.symbol}
          </span>
        </div>
        <span className="text-ink font-mono text-ai dark:text-ai font-bold uppercase">
          {coin.category ? coin.category.split(' ')[0] : 'CRYPTO'}
        </span>
      </div>

      <div className={`my-1 text-base sm:text-2xl font-black font-mono tracking-tight transition-colors rounded px-1 -ml-1 ${
        live.flash === 'up'
          ? 'flash-up bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos ring-1 ring-pos'
          : live.flash === 'down'
          ? 'flash-down bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg ring-1 ring-neg'
          : 'text-ink dark:text-ink'
      }`}>
        {isUSD ? '$' : '₹'}{displayPrice > 0 ? displayPrice.toLocaleString(isUSD ? 'en-US' : 'en-IN', { minimumFractionDigits: displayPrice > 100 ? 2 : (displayPrice < 1 ? 4 : 2), maximumFractionDigits: displayPrice < 1 ? 6 : 2 }) : 'Unavailable'}
      </div>
      <QuoteFreshness status={live.status} source={live.source} lastUpdated={live.lastUpdated} timestamp={live.timestamp} />

      <div className="flex items-center justify-between gap-1 pt-1 text-xs">
        <div className={`stat-desc font-mono font-bold ${
          isUp ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
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
            className="px-2 py-0.5 rounded-lg bg-surface-2 hover:bg-surface-2 text-ink text-ink font-bold  active:scale-95 transition-all flex items-center gap-0.5 cursor-pointer"
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
      className="py-2.5 flex items-center justify-between hover:bg-surface-2 dark:hover:bg-surface px-2 rounded-xl cursor-pointer transition-colors group"
    >
      <div>
        <div className="text-xs font-bold text-ink dark:text-ink-3 group-hover:text-brand transition-colors">{quote.name}</div>
        <div className="text-ink font-mono text-ink-2">{quote.symbol}</div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right font-mono">
          <div className={`text-xs font-bold transition-colors rounded px-1 ${
            live.flash === 'up'
              ? 'flash-up bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos'
              : live.flash === 'down'
              ? 'flash-down bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg'
              : 'text-ink dark:text-ink'
          }`}>
            {currency}{price.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { minimumFractionDigits: price > 100 ? 2 : (price < 1 ? 4 : 2), maximumFractionDigits: price < 1 ? 6 : 2 })}
          </div>
          <div className={`text-ink font-semibold flex items-center justify-end ${
            isUp ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
          }`}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {isUp ? '+' : ''}{changePercent.toFixed(2)}%
          </div>
          <QuoteFreshness status={live.status} source={live.source} lastUpdated={live.lastUpdated} timestamp={live.timestamp} />
        </div>
        {onTrade && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTrade();
            }}
            className="px-2 py-0.5 rounded-lg bg-brand-fill hover:bg-brand-fill-hover text-on-brand text-ink font-bold  transition-all flex items-center gap-1 cursor-pointer"
            title="Trade in Live Terminal"
          >
            <span>⚡ Trade</span>
          </button>
        )}
      </div>
    </div>
  );
};
