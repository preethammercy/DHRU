// DHRU.AI - Comprehensive Instrument Analytics Page
// Integrates real-time quotes, TradingView chart, technical scorecard,
// Deep intelligence report, stock-specific news, and risk rating.

import React, { useEffect, useState } from 'react';
import { getStockDetails, getStockCandles } from '../services/api';
import { useWatchlist } from '../context/WatchlistContext';
import { useLivePrice } from '../context/MarketStreamContext';
import { useTrading } from '../context/TradingContext';
import { TradingViewChart } from '../components/chart/TradingViewChart';
import { QuoteFreshness } from '../components/market/QuoteFreshness';
import { TechnicalScorecard } from '../components/stock/TechnicalScorecard';
import { GeminiReport } from '../components/stock/GeminiReport';
import { Button } from '../components/ui/Button';
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
  HelpCircle,
  Zap,
  CheckCircle2,
  Wallet,
  Coins
} from 'lucide-react';

interface Props {
  symbol: string;
  onBack: () => void;
  onAskDhru: (question: string) => void;
  onTradeStock?: (symbol: string) => void;
}

export const StockDetailPage: React.FC<Props> = ({ symbol, onBack, onAskDhru, onTradeStock }) => {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { placeOrder, marginAvailable } = useTrading();

  const [stockData, setStockData] = useState<any>(null);
  const [candles, setCandles] = useState<any[]>([]);
  const [volumeData, setVolumeData] = useState<any[]>([]);
  const [activeRange, setActiveRange] = useState('1mo');
  const [activeInterval, setActiveInterval] = useState('1d');
  const [loading, setLoading] = useState(true);

  // Quick Trade State
  const [quickSide, setQuickSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quickProduct, setQuickProduct] = useState<'MIS' | 'CNC'>('MIS');
  const [quickQty, setQuickQty] = useState<number>(10);
  const [tradeFeedback, setTradeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Hook ALWAYS declared unconditionally at top level
  const quote = stockData?.quote;
  const live = useLivePrice(symbol, quote);

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

  const handleQuickTrade = (side: 'BUY' | 'SELL') => {
    const res = placeOrder({
      symbol,
      name: quote?.name || symbol,
      side,
      product: quickProduct,
      orderType: 'MARKET',
      quantity: quickQty,
      price: displayPrice
    });
    setTradeFeedback({
      type: res.success ? 'success' : 'error',
      message: res.message
    });
    setTimeout(() => setTradeFeedback(null), 5000);
  };

  if (loading && !stockData) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-line dark:border-line border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-ink-2 dark:text-ink-3">
          Loading verified quotes, OHLCV candles & indicators for <span className="font-mono text-brand dark:text-brand">{symbol}</span>...
        </p>
      </div>
    );
  }

  const technicals = stockData?.technicals;
  const recentNews = stockData?.recentNews || [];
  const risk = stockData?.risk;
  const inWatch = isInWatchlist(symbol);
  
  const displayPrice = live.price > 0 ? live.price : (quote?.price || 0);
  const displayChange = live.change !== 0 ? live.change : (quote?.change || 0);
  const displayChangePercent = live.changePercent !== 0 ? live.changePercent : (quote?.changePercent || 0);
  const isUp = displayChange >= 0;
  const isCryptoPair = symbol.endsWith('-USD');
  const currencySymbol = isCryptoPair ? `${live.currency || quote?.currency || 'USDT'} ` : (quote?.currency === 'USD' || quote?.exchange === 'BINANCE/COINBASE' || quote?.exchange === 'FOREX/GLOBAL' || ['AAPL', 'NFLX', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META'].includes(symbol)) ? '$' : '₹';

  return (
    <div className="space-y-6 animate-fade-in pb-32 lg:pb-16">
      
      {/* Top Navigation Strip */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface dark:bg-surface border border-line dark:border-line hover:border-line text-xs text-ink-2 dark:text-ink-3 font-semibold  zoom-card transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Directory
        </button>

        <div className="flex items-center gap-2">
          {/* Direct Trade in Terminal Button */}
          {onTradeStock && (
            <Button
              variant="trade"
              size="sm"
              onClick={() => onTradeStock(symbol)}
              icon={<Zap className="w-3.5 h-3.5 fill-current" />}
              title="Trade this instrument with live order matching"
            >
              ⚡ Trade in Live Terminal
            </Button>
          )}

          {/* DHRU AI Context Button */}
          <Button
            variant="analyze"
            size="sm"
            onClick={() => onAskDhru(`Analyse ${quote?.name || symbol} using its latest available data`)}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Ask DHRU AI
          </Button>

          {/* Watchlist Toggle */}
          <button
            onClick={() => inWatch ? removeFromWatchlist(symbol) : addToWatchlist({ symbol, name: quote?.name || symbol })}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              inWatch
                ? 'bg-surface-2 text-brand border-line dark:bg-brand-fill dark:text-brand dark:border-line '
                : 'bg-surface dark:bg-surface border-line dark:border-line text-ink-2 hover:text-ink '
            }`}
            title={inWatch ? 'Remove from Watchlist' : 'Add to Watchlist'}
          >
            <Bookmark className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Instrument Overview Banner Card */}
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-6  zoom-card flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-surface-2 text-brand dark:bg-surface dark:text-brand border border-line dark:border-line font-bold">
              {quote?.exchange || 'NSE'}
            </span>
            <span className="text-xs text-ink-2">{quote?.instrumentType || 'EQUITY'}</span>
            {quote?.currency && (
              <span className="text-ink font-mono px-1.5 py-0.5 rounded bg-surface-2 text-ink-2 dark:bg-surface-2 dark:text-ink-3">
                {quote.currency}
              </span>
            )}
            <span className="text-xs text-ink-3 font-mono">ISIN: {stockData?.isin || quote?.isin || 'N/A'}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink dark:text-ink">
            {quote?.name || symbol}
          </h1>
          <div className="text-xs font-mono text-ink-2 mt-1 flex items-center gap-3">
            <span>Symbol: <strong className="text-ink dark:text-ink-3">{symbol}</strong></span>
            <span>•</span>
            <span className="flex items-center gap-1 text-ink-2">
              <Clock className="w-3 h-3 text-brand" />
              {quote?.source || live.source || 'No quote source'}
            </span>
          </div>
        </div>

        {/* Live Price & Metric Stats */}
        <div className="flex flex-wrap items-center gap-6 lg:justify-end">
          <div>
            <div className={`text-3xl sm:text-4xl font-extrabold font-mono transition-colors rounded px-2 py-0.5 ${
              live.flash === 'up'
                ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos'
                : live.flash === 'down'
                ? 'bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg'
                : 'text-ink dark:text-ink'
            }`}>
              {currencySymbol}{displayPrice.toLocaleString(currencySymbol === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <QuoteFreshness status={live.status} source={live.source || quote?.source} lastUpdated={live.lastUpdated || quote?.lastUpdated} timestamp={live.timestamp} />
            <div className={`mt-1 flex items-center font-mono font-bold text-sm ${
              isUp ? 'text-pos' : 'text-neg'
            }`}>
              {isUp ? <ArrowUpRight className="w-4 h-4 mr-0.5" /> : <ArrowDownRight className="w-4 h-4 mr-0.5" />}
              {isUp ? `+${currencySymbol}${displayChange.toFixed(2)}` : `${currencySymbol}${displayChange.toFixed(2)}`} ({isUp ? `+${displayChangePercent.toFixed(2)}%` : `${displayChangePercent.toFixed(2)}%`})
            </div>
          </div>

          {/* High / Low & Volume Cards */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono border-t sm:border-t-0 sm:border-l border-line dark:border-line pt-3 sm:pt-0 sm:pl-6 w-full sm:w-auto">
            <div>
              <div className="text-ink-3 text-ink">PREV CLOSE</div>
              <div className="text-ink dark:text-ink-3 font-semibold">{currencySymbol}{quote?.previousClose || 'N/A'}</div>
            </div>
            <div>
              <div className="text-ink-3 text-ink">DAY RANGE</div>
              <div className="text-ink dark:text-ink-3 font-semibold">{currencySymbol}{quote?.dayLow} — {currencySymbol}{quote?.dayHigh}</div>
            </div>
            <div>
              <div className="text-ink-3 text-ink">52W HIGH / LOW</div>
              <div className="text-ink dark:text-ink-3 font-semibold">{currencySymbol}{quote?.fiftyTwoWeekHigh || '—'} / {currencySymbol}{quote?.fiftyTwoWeekLow || '—'}</div>
            </div>
            <div>
              <div className="text-ink-3 text-ink">VOLUME</div>
              <div className="text-ink dark:text-ink-3 font-semibold">
                {(() => {
                  if (symbol.startsWith('^')) return 'Spot Index (N/A)';
                  if (quote?.volume && quote.volume > 0) return quote.volume.toLocaleString(isCryptoPair ? 'en-US' : 'en-IN');
                  const lastBarWithVol = [...volumeData].reverse().find(v => v.value > 0);
                  if (lastBarWithVol && lastBarWithVol.value > 0) {
                    return lastBarWithVol.value.toLocaleString(isCryptoPair ? 'en-US' : 'en-IN');
                  }
                  return '—';
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Interactive TradingView Chart */}
      <TradingViewChart
        candles={candles}
        volumeData={volumeData}
        symbol={symbol}
        currentPrice={displayPrice}
        onTimeframeChange={handleTimeframeChange}
        activeTimeframe={activeRange}
        activeInterval={activeInterval}
      />

      {/* Quick Trade Execution Ticket */}
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-5  zoom-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line dark:border-line gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink dark:text-ink">Quick Order Execution Ticket</h3>
              <p className="text-ink-2">Execute instant market orders directly on live quote without leaving this chart</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-ink-3 font-mono">AVAILABLE MARGIN</div>
              <div className="text-xs font-mono font-bold text-pos dark:text-pos">
                {currencySymbol}{marginAvailable.toLocaleString(currencySymbol === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            {onTradeStock && (
              <button
                onClick={() => onTradeStock(symbol)}
                className="px-3 py-1.5 rounded-xl bg-surface-2 hover:bg-surface-2 dark:bg-surface-2 dark:hover:bg-surface-2 text-ink-2 dark:text-ink-3 text-xs font-semibold transition-all cursor-pointer"
              >
                Full Terminal & Depth →
              </button>
            )}
          </div>
        </div>

        {/* Feedback Message */}
        {tradeFeedback && (
          <div className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
            tradeFeedback.type === 'success'
              ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos border border-line dark:border-line'
              : 'bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg border border-line dark:border-line'
          }`}>
            <span>{tradeFeedback.message}</span>
            <button
              onClick={() => setTradeFeedback(null)}
              className="text-ink font-bold underline ml-2 opacity-75 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Side Selector */}
          <div className="space-y-1">
            <label className="text-ink font-mono text-ink-3 uppercase tracking-wider font-semibold">Direction</label>
            <div className="grid grid-cols-2 p-1 bg-surface-2 dark:bg-surface rounded-xl border border-line dark:border-line">
              <button
                onClick={() => setQuickSide('BUY')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  quickSide === 'BUY'
                    ? 'bg-pos-fill text-on-brand '
                    : 'text-ink-2 dark:text-ink-3 hover:text-ink'
                }`}
              >
                BUY / LONG
              </button>
              <button
                onClick={() => setQuickSide('SELL')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  quickSide === 'SELL'
                    ? 'bg-neg-fill text-on-brand '
                    : 'text-ink-2 dark:text-ink-3 hover:text-ink'
                }`}
              >
                SELL / SHORT
              </button>
            </div>
          </div>

          {/* Product Type */}
          <div className="space-y-1">
            <label className="text-ink font-mono text-ink-3 uppercase tracking-wider font-semibold">Product</label>
            <div className="grid grid-cols-2 p-1 bg-surface-2 dark:bg-surface rounded-xl border border-line dark:border-line">
              <button
                onClick={() => setQuickProduct('MIS')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  quickProduct === 'MIS'
                    ? 'bg-brand-fill text-on-brand '
                    : 'text-ink-2 dark:text-ink-3 hover:text-ink'
                }`}
                title="Intraday with 5x leverage"
              >
                MIS (5x Intraday)
              </button>
              <button
                onClick={() => setQuickProduct('CNC')}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  quickProduct === 'CNC'
                    ? 'bg-brand-fill text-on-brand '
                    : 'text-ink-2 dark:text-ink-3 hover:text-ink'
                }`}
                title="Cash & Carry (Delivery 1x)"
              >
                CNC (Delivery)
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1">
            <label className="text-ink font-mono text-ink-3 uppercase tracking-wider font-semibold">Quantity</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                step="1"
                value={quickQty}
                onChange={(e) => setQuickQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-1.5 text-sm font-mono font-bold bg-surface dark:bg-surface border border-line dark:border-line rounded-xl text-ink dark:text-ink focus:outline-none focus:border-line"
              />
              <div className="flex items-center gap-1">
                {[5, 10, 50, 100].map(amt => (
                  <button
                    key={amt}
                    onClick={() => setQuickQty(amt)}
                    className="px-2 py-1 text-ink font-mono rounded bg-surface-2 dark:bg-surface-2 hover:bg-surface-2 dark:hover:bg-surface-2 text-ink-2 dark:text-ink-3 font-semibold cursor-pointer"
                  >
                    {amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Execution Button & Est Value */}
          <div className="space-y-1">
            <div className="flex justify-between text-ink font-mono text-ink-3">
              <span>EST. VALUE</span>
              <span className="font-semibold text-ink-2 dark:text-ink-3">
                {currencySymbol}{(displayPrice * quickQty).toLocaleString(currencySymbol === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <Button
              variant={quickSide === 'BUY' ? 'buy' : 'sell'}
              size="md"
              className="w-full"
              onClick={() => handleQuickTrade(quickSide)}
              icon={<Zap className="w-3.5 h-3.5 fill-current" />}
            >
              <span>
                {quickSide} {quickQty} @ {currencySymbol}{displayPrice.toLocaleString(currencySymbol === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Technical Indicators Scorecard & Pivot Matrix */}
      <TechnicalScorecard
        technicals={technicals}
        currentPrice={quote?.price || 0}
      />

      {/* Risk Rating Card */}
      {risk && (
        <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-5  zoom-card space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-line dark:border-line">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-neg" />
              <h3 className="text-sm font-bold text-ink dark:text-ink">Instrument Risk Classification</h3>
            </div>
            <span className={`px-3 py-1 rounded-xl text-xs font-bold font-mono border ${
              risk.rating === 'Low'
                ? 'bg-surface-2 text-pos border-line dark:bg-pos-tint dark:text-pos dark:border-line'
                : risk.rating === 'High'
                ? 'bg-surface-2 text-neg border-line dark:bg-neg-tint dark:text-neg dark:border-line'
                : 'bg-surface-2 text-warn border-line dark:bg-surface-2 dark:text-warn dark:border-line'
            }`}>
              {risk.rating} Risk ({risk.score}/100)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 p-3 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line">
              <span className="font-semibold text-pos dark:text-pos">Positive Health Factors:</span>
              <ul className="space-y-1 text-ink-2 dark:text-ink-3">
                {risk.positiveSignals?.map((s: string, idx: number) => (
                  <li key={idx}>✓ {s}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-1.5 p-3 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line">
              <span className="font-semibold text-neg dark:text-neg">Risk & Downside Vulnerabilities:</span>
              <ul className="space-y-1 text-ink-2 dark:text-ink-3">
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
        initialReport={null}
      />

      {/* Stock-Specific Relevant News Feed */}
      {recentNews.length > 0 && (
        <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-6  space-y-4">
          <h3 className="text-sm font-bold text-ink dark:text-ink pb-3 border-b border-line dark:border-line">
            Recent Announcements & News for {quote?.name || symbol}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {recentNews.map((n: any) => (
              <a
                key={n.id}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line hover:border-line dark:hover:border-line hover:bg-surface dark:hover:bg-surface transition-all flex flex-col justify-between group  zoom-card"
              >
                <div>
                  <div className="flex items-center justify-between text-ink-2 font-mono mb-1">
                    <span>{n.publisher}</span>
                    <span className="text-brand dark:text-brand font-semibold">{n.sentiment}</span>
                  </div>
                  <h4 className="font-bold text-ink dark:text-ink-3 group-hover:text-brand dark:group-hover:text-brand transition-colors line-clamp-2">
                    {n.title}
                  </h4>
                </div>
                <div className="flex items-center justify-between text-ink-3 font-mono mt-2 pt-2 border-t border-line dark:border-line">
                  <span>{new Date(n.pubDate).toLocaleDateString('en-IN')}</span>
                  <span className="text-brand dark:text-brand flex items-center gap-1 group-hover:underline">
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
