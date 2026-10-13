// DHRU.AI - Comprehensive Instrument Analytics Page
// Integrates real-time quotes, TradingView chart, technical scorecard,
// Deep intelligence report, stock-specific news, and risk rating.

import React, { useEffect, useState } from 'react';
import { getStockDetails, getStockCandles, runAiAnalysis } from '../services/api';
import { useWatchlist } from '../context/WatchlistContext';
import { TradingViewChart } from '../components/chart/TradingViewChart';
import { TechnicalScorecard } from '../components/stock/TechnicalScorecard';
import { GeminiReport } from '../components/stock/GeminiReport';
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowDownRight,
  Bookmark,
  Share2,
  ExternalLink,
  ShieldAlert,
  Clock,
  Sparkles,
  BarChart2,
  Layers,
  HelpCircle
} from 'lucide-react';

interface Props {
  symbol: string;
  onBack: () => void;
  onAskDhru: (question: string) => void;
}

export const StockDetailPage: React.FC<Props> = ({ symbol, onBack, onAskDhru }) => {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const [stockData, setStockData] = useState<any>(null);
  const [candles, setCandles] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [activeRange, setActiveRange] = useState('1mo');
  const [activeInterval, setActiveInterval] = useState('1d');
  const [aiReport, setAiReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Load quote details & initial candles
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      getStockDetails(symbol),
      getStockCandles(symbol, '1mo', '1d'),
    ]).then(([details, candleRes]) => {
      if (!isMounted) return;
      setStockData(details);
      setCandles(candleRes.candles || []);
      setVolumeData(candleRes.volumeData || []);
      setLoading(false);

      // Pre-load deterministic / AI report
      runAiAnalysis(symbol).then(rep => {
        if (isMounted) setAiReport(rep);
      }).catch(() => {});
    }).catch(err => {
      console.error(err);
      if (isMounted) setLoading(false);
    });

    return () => { isMounted = false; };
  }, [symbol]);

  // Handle timeframe change on chart
  const handleTimeframeChange = async (range: string, interval: string) => {
    setActiveRange(range);
    setActiveInterval(interval);
    try {
      const res = await getStockCandles(symbol, range, interval);
      setCandles(res.candles || []);
      setVolumeData(res.volumeData || []);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && !stockData) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Loading verified quotes, OHLCV candles & indicators for <span className="font-mono text-blue-600 dark:text-cyan-400">{symbol}</span>...
        </p>
      </div>
    );
  }

  const quote = stockData?.quote;
  const technicals = stockData?.technicals;
  const recentNews = stockData?.recentNews || [];
  const risk = stockData?.risk;
  const inWatch = isInWatchlist(symbol);
  const isUp = quote?.changePercent >= 0;

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      
      {/* Top Navigation Strip */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 text-xs text-slate-700 dark:text-slate-300 font-semibold shadow-sm zoom-card transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>

        <div className="flex items-center gap-2">
          {/* Ask DHRU AI Context Button */}
          <button
            onClick={() => onAskDhru(`Analyse ${quote?.name || symbol} using its latest available data`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Ask DHRU AI About This Stock
          </button>

          {/* Watchlist Toggle */}
          <button
            onClick={() => inWatch ? removeFromWatchlist(symbol) : addToWatchlist({ symbol, name: quote?.name || symbol })}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              inWatch
                ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/40 shadow-sm'
                : 'bg-white dark:bg-[#0D1527] border-slate-200 dark:border-[#1A2744] text-slate-500 hover:text-slate-900 shadow-sm'
            }`}
            title={inWatch ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Instrument Overview Banner Card */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card zoom-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-[#070B14] dark:text-cyan-400 border border-blue-200 dark:border-[#1A2744] font-bold">
              {quote?.exchange || 'NSE'}
            </span>
            <span className="text-xs text-slate-500">{quote?.instrumentType || 'EQUITY'}</span>
            {quote?.currency && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {quote.currency}
              </span>
            )}
            <span className="text-xs text-slate-400 font-mono">ISIN: {stockData?.isin || quote?.isin || 'N/A'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {quote?.name || symbol}
          </h1>
          <div className="text-xs font-mono text-slate-500 mt-1 flex items-center gap-3">
            <span>Symbol: <strong className="text-slate-800 dark:text-slate-200">{symbol}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="w-3 h-3 text-blue-600" />
              {quote?.source} ({quote?.status})
            </span>
          </div>
        </div>

        {/* Live Price & Metric Stats */}
        <div className="flex flex-wrap items-center gap-6 lg:justify-end">
          <div>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white">
              ₹{quote?.price?.toLocaleString('en-IN') || '0.00'}
            </div>
            <div className={`mt-1 flex items-center font-mono font-bold text-sm ${
              isUp ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {isUp ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
              {isUp ? `+₹${quote?.change}` : `₹${quote?.change}`} ({isUp ? `+${quote?.changePercent}%` : `${quote?.changePercent}%`})
            </div>
          </div>

          {/* High / Low & Volume Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono border-l border-slate-200 dark:border-[#1A2744] pl-6">
            <div>
              <div className="text-slate-400 text-[10px]">PREV CLOSE</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">₹{quote?.previousClose || 'N/A'}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">DAY RANGE</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">₹{quote?.dayLow} — ₹{quote?.dayHigh}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">52W HIGH / LOW</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">₹{quote?.fiftyTwoWeekHigh || '—'} / ₹{quote?.fiftyTwoWeekLow || '—'}</div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">VOLUME</div>
              <div className="text-slate-800 dark:text-slate-200 font-semibold">{quote?.volume ? quote.volume.toLocaleString('en-IN') : 'N/A'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive TradingView Chart */}
      <TradingViewChart
        candles={candles}
        volumeData={volumeData}
        technicals={technicals}
        symbol={symbol}
        currentPrice={quote?.price || 0}
        onTimeframeChange={handleTimeframeChange}
        activeTimeframe={activeRange}
      />

      {/* Technical Indicators Scorecard & Pivot Matrix */}
      <TechnicalScorecard
        technicals={technicals}
        currentPrice={quote?.price || 0}
      />

      {/* Risk Rating Card */}
      {risk && (
        <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-5 shadow-card zoom-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1A2744]">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Instrument Risk Classification</h3>
            </div>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold font-mono border ${
              risk.rating === 'Low'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
                : risk.rating === 'High'
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30'
            }`}>
              {risk.rating} Risk ({risk.score}/100)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744]">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Positive Health Factors:</span>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                {risk.positiveSignals?.map((s: string, idx: number) => (
                  <li key={idx}>✓ {s}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744]">
              <span className="font-semibold text-rose-700 dark:text-rose-400">Risk & Downside Vulnerabilities:</span>
              <ul className="space-y-1 text-slate-700 dark:text-slate-300">
                {risk.riskSignals?.map((s: string, idx: number) => (
                  <li key={idx}>⚠️ {s}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Deep Market Intelligence Report */}
      <GeminiReport
        symbol={symbol}
        initialReport={aiReport}
      />

      {/* Stock-Specific Relevant News Feed */}
      {recentNews.length > 0 && (
        <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-200 dark:border-[#1A2744]">
            Recent Announcements & News for {quote?.name || symbol}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {recentNews.map((n: any) => (
              <a
                key={n.id}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 dark:hover:border-cyan-500/40 hover:bg-white dark:hover:bg-[#0c1424] transition-all flex flex-col justify-between group shadow-sm zoom-card"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono mb-1">
                    <span>{n.publisher}</span>
                    <span className="text-blue-600 dark:text-cyan-400 font-semibold">{n.sentiment}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors line-clamp-2">
                    {n.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>{new Date(n.pubDate).toLocaleDateString('en-IN')}</span>
                  <span className="text-blue-600 dark:text-cyan-400 flex items-center gap-1 group-hover:underline">
                    View Source <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
