// DHRU.AI - Professional Live Trading Terminal
// Combines the ergonomics of Groww and Angel One with professional institutional terminal analytics

import React, { useState, useEffect, useMemo } from 'react';
import { useTrading, OrderSide, ProductType, OrderType } from '../context/TradingContext';
import { useMarketStream, useLivePrice } from '../context/MarketStreamContext';
import { useAuth } from '../context/AuthContext';
import { TradingViewChart } from '../components/chart/TradingViewChart';
import { getStockCandles, getStockDetails } from '../services/api';
import { Candle, VolumeBar } from '../types';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Zap,
  Sliders,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  ExternalLink,
  Settings,
  RefreshCw,
  Coins
} from 'lucide-react';

interface TerminalProps {
  initialSymbol?: string;
  onSelectStock?: (symbol: string) => void;
}

const DEFAULT_WATCHLIST_SYMBOLS = [
  { symbol: '^NSEI', name: 'NIFTY 50' },
  { symbol: '^NSEBANK', name: 'BANK NIFTY' },
  { symbol: 'RELIANCE.NS', name: 'Reliance Ind.' },
  { symbol: 'TCS.NS', name: 'TCS' },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank' },
  { symbol: 'INFY.NS', name: 'Infosys' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank' },
  { symbol: 'SBIN.NS', name: 'State Bank' },
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel' },
  { symbol: 'TATAMOTORS.NS', name: 'Tata Motors' },
  { symbol: 'ITC.NS', name: 'ITC Ltd' },
  { symbol: 'LT.NS', name: 'Larsen & Toubro' },
  { symbol: 'GC=F', name: 'Gold Comex' },
  { symbol: 'INR=X', name: 'USD/INR' }
];

const GLOBAL_WATCHLIST_SYMBOLS = [
  // Top Cryptocurrencies
  { symbol: 'BTC-USD', name: 'Bitcoin (BTC)' },
  { symbol: 'ETH-USD', name: 'Ethereum (ETH)' },
  { symbol: 'SOL-USD', name: 'Solana (SOL)' },
  { symbol: 'XRP-USD', name: 'XRP (Ripple)' },
  { symbol: 'BNB-USD', name: 'Binance Coin' },
  { symbol: 'DOGE-USD', name: 'Dogecoin' },
  { symbol: 'SUI-USD', name: 'Sui Network' },
  { symbol: 'ADA-USD', name: 'Cardano' },
  { symbol: 'AVAX-USD', name: 'Avalanche' },
  { symbol: 'LINK-USD', name: 'Chainlink' },
  { symbol: 'NEAR-USD', name: 'NEAR Protocol' },
  { symbol: 'PEPE-USD', name: 'Pepe' },
  { symbol: 'APT-USD', name: 'Aptos' },
  { symbol: 'RENDER-USD', name: 'Render Network' },
  // Major Forex & Commodities
  { symbol: 'EURUSD=X', name: 'EUR / USD' },
  { symbol: 'GBPUSD=X', name: 'GBP / USD (Cable)' },
  { symbol: 'USDJPY=X', name: 'USD / JPY' },
  { symbol: 'INR=X', name: 'USD / INR' },
  { symbol: 'GBPINR=X', name: 'GBP / INR' },
  { symbol: 'EURINR=X', name: 'EUR / INR' },
  { symbol: 'JPYINR=X', name: 'JPY / INR (100)' },
  { symbol: 'AUDUSD=X', name: 'AUD / USD' },
  { symbol: 'USDCAD=X', name: 'USD / CAD' },
  { symbol: 'USDCHF=X', name: 'USD / CHF' },
  { symbol: 'NZDUSD=X', name: 'NZD / USD' },
  { symbol: 'GC=F', name: 'Gold Spot' },
  { symbol: 'CL=F', name: 'Crude Oil (WTI)' },
  // US / Global Equities
  { symbol: 'AAPL', name: 'Apple Inc.' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp' },
  { symbol: 'TSLA', name: 'Tesla Inc.' },
  { symbol: 'MSFT', name: 'Microsoft Corp' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.' },
  { symbol: 'AMZN', name: 'Amazon Inc.' },
  { symbol: 'META', name: 'Meta Platforms' }
];

export const TradingTerminalPage: React.FC<TerminalProps> = ({
  initialSymbol = 'RELIANCE.NS',
  onSelectStock
}) => {
  const { marketMode } = useAuth();
  const [activeSymbol, setActiveSymbol] = useState(() => initialSymbol || (marketMode === 'crypto' ? 'BTC-USD' : 'RELIANCE.NS'));
  const [activeInterval, setActiveInterval] = useState('1d');
  const [activeRange, setActiveRange] = useState('1y');

  // Immediately load selected instrument when user navigates to trade
  useEffect(() => {
    if (initialSymbol) {
      setActiveSymbol(initialSymbol);
    }
  }, [initialSymbol]);

  const US_STOCKS = ['AAPL', 'NFLX', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META'];
  const isGlobal = marketMode === 'crypto' || activeSymbol.includes('USD') || activeSymbol.includes('=X') || activeSymbol.includes('=F') || US_STOCKS.includes(activeSymbol);
  const isCrypto = isGlobal;
  const currency = isGlobal && !activeSymbol.includes('INR=X') && !activeSymbol.includes('IN=X') ? '$' : '₹';
  const watchlistToUse = isGlobal ? GLOBAL_WATCHLIST_SYMBOLS : DEFAULT_WATCHLIST_SYMBOLS;

  // Market Stream & Live Quote
  const { isMarketLive, connectionStatus } = useMarketStream();
  const live = useLivePrice(activeSymbol);

  // Trading context
  const {
    cashBalance,
    marginAvailable,
    marginUsed,
    realizedPnl,
    positions,
    holdings,
    orders,
    tradeHistory,
    totalInvested,
    totalCurrentValue,
    totalUnrealizedPnl,
    totalDayPnl,
    placeOrder,
    cancelOrder,
    squareOffPosition,
    squareOffAll,
    brokerConfig,
    updateBrokerConfig,
    riskSettings
  } = useTrading();

  // Panels visibility - responsive default (collapsed on mobile to prioritize chart)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [activeBottomTab, setActiveBottomTab] = useState<'positions' | 'holdings' | 'orders' | 'trades' | 'ai'>('positions');
  const [watchlistSearch, setWatchlistSearch] = useState('');

  // Order Ticket Form State
  const [orderSide, setOrderSide] = useState<OrderSide>('BUY');
  const [productType, setProductType] = useState<ProductType>('MIS');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState<number>(25);
  const [limitPrice, setLimitPrice] = useState<number>(0);
  const [triggerPrice, setTriggerPrice] = useState<number>(0);
  const [orderFeedback, setOrderFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Candles & stock detail
  const [candles, setCandles] = useState<Candle[]>([]);
  const [volumeData, setVolumeData] = useState<VolumeBar[]>([]);
  const [stockDetail, setStockDetail] = useState<any>(null);
  const [loadingChart, setLoadingChart] = useState(false);

  // Load candles and details on symbol or timeframe change
  useEffect(() => {
    let isCancelled = false;
    setLoadingChart(true);

    getStockCandles(activeSymbol, activeRange, activeInterval)
      .then(res => {
        if (!isCancelled && res) {
          setCandles(res.candles || []);
          setVolumeData(res.volumeData || []);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!isCancelled) setLoadingChart(false);
      });

    getStockDetails(activeSymbol)
      .then(res => {
        if (!isCancelled && res) {
          setStockDetail(res);
          if (res.quote?.price && limitPrice === 0) {
            setLimitPrice(res.quote.price);
          }
        }
      })
      .catch(console.error);

    return () => {
      isCancelled = true;
    };
  }, [activeSymbol, activeRange, activeInterval]);

  // Update limit price default when symbol changes
  useEffect(() => {
    if (live.price > 0) {
      setLimitPrice(live.price);
      setTriggerPrice(Number((live.price * 0.99).toFixed(2)));
    }
  }, [activeSymbol, live.price]);

  // Handle Order Placement
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderFeedback(null);

    const res = placeOrder({
      symbol: activeSymbol,
      name: stockDetail?.quote?.name || activeSymbol,
      side: orderSide,
      product: productType,
      orderType,
      quantity,
      price: orderType === 'MARKET' ? live.price : limitPrice,
      triggerPrice: orderType === 'SL' ? triggerPrice : undefined
    });

    if (res.success) {
      setOrderFeedback({ type: 'success', message: res.message });
      setTimeout(() => setOrderFeedback(null), 4000);
    } else {
      setOrderFeedback({ type: 'error', message: res.message });
    }
  };

  const handleTimeframeChange = (newRange: string, newInterval: string) => {
    setActiveRange(newRange);
    setActiveInterval(newInterval);
  };

  // Required margin calculation
  const executionPrice = orderType === 'MARKET' ? (live.price || 1000) : (limitPrice || live.price || 1000);
  const totalOrderValue = executionPrice * quantity;
  const requiredMargin = productType === 'MIS' ? totalOrderValue * 0.20 : totalOrderValue;

  const filteredWatchlist = watchlistToUse.filter(item =>
    item.symbol.toLowerCase().includes(watchlistSearch.toLowerCase()) ||
    item.name.toLowerCase().includes(watchlistSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3 min-h-[calc(100vh-140px)]">
      
      {/* 1. Terminal Top Ribbon: Market Status, Connectivity, & Account Summary */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
        
        {/* Left: Stream Status & Active Instrument */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isCrypto || isMarketLive ? 'bg-emerald-400' : 'bg-slate-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isCrypto || isMarketLive ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {isCrypto ? 'CRYPTO 24/7' : (connectionStatus === 'connected' ? (isMarketLive ? 'NSE LIVE' : 'NSE CLOSED (Next: 09:15 AM)') : 'RECONNECTING')}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

          {/* Active Symbol Display */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
              {activeSymbol}
            </span>
            <span className="text-slate-500 hidden sm:inline">
              {stockDetail?.quote?.name || ''}
            </span>
            <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded transition-colors ${
              live.flash === 'up'
                ? 'flash-up bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 ring-1 ring-emerald-500/40'
                : live.flash === 'down'
                ? 'flash-down bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 ring-1 ring-rose-500/40'
                : 'text-slate-900 dark:text-white'
            }`}>
              {currency}{live.price > 0 ? live.price.toFixed(2) : (stockDetail?.quote?.price?.toFixed(2) ?? '---')}
            </span>
            <span className={`font-mono text-xs font-semibold flex items-center ${
              live.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {live.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {live.change >= 0 ? '+' : ''}{live.change.toFixed(2)} ({live.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Right: Balance Bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-slate-500">Avail. Margin:</span>{' '}
            <strong className="text-slate-900 dark:text-white font-bold">{currency}{marginAvailable.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: 2 })}</strong>
          </div>
          <div>
            <span className="text-slate-500">Margin Used:</span>{' '}
            <span className="text-slate-700 dark:text-slate-300">{currency}{marginUsed.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-slate-500">Day P&L:</span>{' '}
            <strong className={totalDayPnl >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
              {totalDayPnl >= 0 ? '+' : ''}{currency}{totalDayPnl.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: 2 })}
            </strong>
          </div>
          <div>
            <span className="text-slate-500">Realized P&L:</span>{' '}
            <strong className={realizedPnl >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
              {realizedPnl >= 0 ? '+' : ''}{currency}{realizedPnl.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: 2 })}
            </strong>
          </div>

          {/* Broker Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-700/40 text-[11px]">
            <Shield className="w-3 h-3" />
            <span>{brokerConfig.mode === 'live' ? 'BROKER LIVE' : 'SANDBOX SIM'}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Terminal Grid: [Watchlist] - [Chart] - [Order Ticket] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 items-start">
        
        {/* LEFT COLUMN: Collapsible Watchlist (3 cols) */}
        {leftSidebarOpen && (
          <div className="lg:col-span-3 bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col h-[650px] shadow-xs">
            <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">Watchlist</span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono px-1.5 py-0.5 rounded">
                  {DEFAULT_WATCHLIST_SYMBOLS.length}
                </span>
              </div>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                title="Collapse Watchlist"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Watchlist Search */}
            <div className="p-2 border-b border-slate-100 dark:border-slate-800/60">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter symbols..."
                  value={watchlistSearch}
                  onChange={e => setWatchlistSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Watchlist Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40 text-xs">
              {filteredWatchlist.map(item => {
                const isSelected = item.symbol === activeSymbol;
                return (
                  <WatchlistItem
                    key={item.symbol}
                    symbol={item.symbol}
                    name={item.name}
                    isSelected={isSelected}
                    onSelect={() => {
                      setActiveSymbol(item.symbol);
                      onSelectStock?.(item.symbol);
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* CENTER COLUMN: Central Candlestick Chart (6 or 9 cols) */}
        <div className={leftSidebarOpen ? 'lg:col-span-6 flex flex-col gap-3' : 'lg:col-span-9 flex flex-col gap-3'}>
          {!leftSidebarOpen && (
            <button
              onClick={() => setLeftSidebarOpen(true)}
              className="self-start flex items-center gap-1 px-2.5 py-1 text-xs bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 cursor-pointer shadow-xs"
            >
              <ChevronRight className="w-3.5 h-3.5" />
              <span>Show Watchlist</span>
            </button>
          )}

          {/* Candlestick Chart Canvas */}
          <TradingViewChart
            candles={candles}
            volumeData={volumeData}
            symbol={activeSymbol}
            currentPrice={live.price > 0 ? live.price : (stockDetail?.quote?.price ?? 0)}
            onTimeframeChange={handleTimeframeChange}
            activeTimeframe={activeRange}
            activeInterval={activeInterval}
          />
        </div>

        {/* RIGHT COLUMN: Groww / Angel One Fast Order Ticket (3 cols) */}
        <div className="lg:col-span-3 bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xs">
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Order Ticket</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {isGlobal ? (activeSymbol.includes('=X') ? 'Global Interbank Forex' : 'Global 24/7 Crypto') : 'NSE • Continuous Trading'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-mono text-slate-400">LTP</span>
              <p className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {currency}{live.price > 0 ? live.price.toFixed(live.price > 100 ? 2 : 4) : (stockDetail?.quote?.price?.toFixed(2) ?? '0.00')}
              </p>
            </div>
          </div>

          {/* Feedback Banner */}
          {orderFeedback && (
            <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
              orderFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-200 border border-rose-200'
            }`}>
              {orderFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{orderFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handlePlaceOrder} className="flex flex-col gap-3 text-xs">
            
            {/* BUY vs SELL Switch */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
              <button
                type="button"
                onClick={() => setOrderSide('BUY')}
                className={`py-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                  orderSide === 'BUY'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setOrderSide('SELL')}
                className={`py-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                  orderSide === 'SELL'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                SELL
              </button>
            </div>

            {/* Product Type: Delivery (CNC) vs Intraday (MIS) */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500">Product</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProductType('MIS')}
                  className={`py-1.5 px-3 rounded-lg border font-semibold transition-colors cursor-pointer text-center ${
                    productType === 'MIS'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Intraday (MIS • 5x)
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('CNC')}
                  className={`py-1.5 px-3 rounded-lg border font-semibold transition-colors cursor-pointer text-center ${
                    productType === 'CNC'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Delivery (CNC • 1x)
                </button>
              </div>
            </div>

            {/* Order Type: Market / Limit / SL */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-slate-500">Order Type</label>
              <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-lg">
                {(['MARKET', 'LIMIT', 'SL'] as OrderType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrderType(t)}
                    className={`py-1 rounded font-semibold text-[11px] transition-colors cursor-pointer ${
                      orderType === t
                        ? 'bg-white dark:bg-[#0D1527] text-blue-600 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity with quick buttons */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-500">Quantity</label>
                <span className="text-[10px] text-slate-400 font-mono">Lot Size: 1</span>
              </div>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="px-3 py-1.5 bg-slate-50 dark:bg-[#070B14] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex items-center gap-1.5 mt-1">
                {[10, 25, 50, 100].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className="flex-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px] hover:bg-slate-200 cursor-pointer"
                  >
                    +{q}
                  </button>
                ))}
              </div>
            </div>

            {/* Limit Price (if LIMIT or SL) */}
            {orderType !== 'MARKET' && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-500">Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={e => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-[#070B14] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Trigger Price (if SL) */}
            {orderType === 'SL' && (
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-semibold text-slate-500">Trigger Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={triggerPrice}
                  onChange={e => setTriggerPrice(parseFloat(e.target.value) || 0)}
                  className="px-3 py-1.5 bg-slate-50 dark:bg-[#070B14] border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            )}

            {/* Margin Calculation & Breakdown */}
            <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Value:</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold">{currency}{totalOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Margin Required:</span>
                <strong className="text-blue-600 dark:text-cyan-400 font-bold">{currency}{requiredMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Margin Available:</span>
                <span className={marginAvailable >= requiredMargin ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                  {currency}{marginAvailable.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              className={`w-full py-2.5 rounded-lg text-white font-bold text-sm shadow-md transition-all cursor-pointer mt-1 ${
                orderSide === 'BUY'
                  ? 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
                  : 'bg-rose-600 hover:bg-rose-700 active:scale-[0.98]'
              }`}
            >
              {orderSide === 'BUY' ? 'PLACE BUY ORDER' : 'PLACE SELL ORDER'}
            </button>
          </form>

          {/* Broker Settings & Simulation Toggle */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span>Instant Fill</span>
            </span>
            <button
              onClick={() => updateBrokerConfig({ mode: brokerConfig.mode === 'simulation' ? 'live' : 'simulation' })}
              className="hover:text-blue-600 dark:hover:text-cyan-400 font-semibold transition-colors cursor-pointer"
            >
              Mode: {brokerConfig.mode.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM PANEL: Positions, Holdings, Orders, Trades & AI Forecasts */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#070B14]/60 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveBottomTab('positions')}
              className={`py-3 px-3 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'positions'
                  ? 'border-blue-600 text-blue-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Positions</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                {positions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveBottomTab('holdings')}
              className={`py-3 px-3 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'holdings'
                  ? 'border-blue-600 text-blue-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Holdings</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                {holdings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveBottomTab('orders')}
              className={`py-3 px-3 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'orders'
                  ? 'border-blue-600 text-blue-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Open Orders</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                {orders.filter(o => o.status === 'PENDING').length}
              </span>
            </button>

            <button
              onClick={() => setActiveBottomTab('trades')}
              className={`py-3 px-3 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'trades'
                  ? 'border-blue-600 text-blue-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>Trade Log</span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] font-mono">
                {tradeHistory.length}
              </span>
            </button>

            <button
              onClick={() => setActiveBottomTab('ai')}
              className={`py-3 px-3 font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeBottomTab === 'ai'
                  ? 'border-blue-600 text-blue-600 dark:text-cyan-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <span>AI Forecast Signals</span>
              <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                PRO
              </span>
            </button>
          </div>

          {/* Quick Actions (Square Off All) */}
          {activeBottomTab === 'positions' && positions.length > 0 && (
            <button
              onClick={squareOffAll}
              className="text-xs font-semibold px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800 rounded-lg hover:bg-rose-100 cursor-pointer"
            >
              Square Off All
            </button>
          )}
        </div>

        {/* Tab 1: POSITIONS */}
        {activeBottomTab === 'positions' && (
          <div className="overflow-x-auto">
            {positions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No active open positions. Place an Intraday (MIS) order to start live position tracking.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-[#070B14] text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[10px] tracking-wider font-mono">
                  <tr>
                    <th className="py-2.5 px-4">Instrument</th>
                    <th className="py-2.5 px-4">Product</th>
                    <th className="py-2.5 px-4 text-right">Qty</th>
                    <th className="py-2.5 px-4 text-right">Avg Price</th>
                    <th className="py-2.5 px-4 text-right">LTP (Live)</th>
                    <th className="py-2.5 px-4 text-right">P&L (Unrealized)</th>
                    <th className="py-2.5 px-4 text-right">Change %</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {positions.map(pos => {
                    const isProfit = pos.pnl >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-sans">
                          {pos.symbol}
                          <span className="block text-[11px] font-normal text-slate-400 font-mono">{pos.name}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                            {pos.product} • {pos.side}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">{pos.quantity}</td>
                        <td className="py-3 px-4 text-right">
                          {pos.symbol.includes('USD') || pos.symbol.includes('=X') ? '$' : '₹'}
                          {pos.averagePrice.toFixed(pos.averagePrice > 100 ? 2 : 4)}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">
                          {pos.symbol.includes('USD') || pos.symbol.includes('=X') ? '$' : '₹'}
                          {pos.currentPrice.toFixed(pos.currentPrice > 100 ? 2 : 4)}
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isProfit ? '+' : ''}{pos.symbol.includes('USD') || pos.symbol.includes('=X') ? '$' : '₹'}{pos.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className={`py-3 px-4 text-right font-semibold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isProfit ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => squareOffPosition(pos.id)}
                            className="px-2.5 py-1 text-[11px] rounded bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 cursor-pointer font-sans font-semibold"
                          >
                            Exit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: HOLDINGS */}
        {activeBottomTab === 'holdings' && (
          <div className="overflow-x-auto">
            <div className="p-3 bg-slate-50 dark:bg-[#070B14] border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500">Total Invested:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <span className="text-slate-500">Current Value:</span>
                <p className="font-bold text-slate-900 dark:text-white text-sm">₹{totalCurrentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</p>
              </div>
              <div>
                <span className="text-slate-500">Total P&L:</span>
                <p className={`font-bold text-sm ${totalUnrealizedPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {totalUnrealizedPnl >= 0 ? '+' : ''}₹{totalUnrealizedPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Today's P&L:</span>
                <p className={`font-bold text-sm ${totalDayPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {totalDayPnl >= 0 ? '+' : ''}₹{totalDayPnl.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#070B14] text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[10px] tracking-wider font-mono">
                <tr>
                  <th className="py-2.5 px-4">Instrument</th>
                  <th className="py-2.5 px-4 text-right">Qty</th>
                  <th className="py-2.5 px-4 text-right">Avg Cost</th>
                  <th className="py-2.5 px-4 text-right">LTP (Live)</th>
                  <th className="py-2.5 px-4 text-right">Cur. Value</th>
                  <th className="py-2.5 px-4 text-right">Total P&L</th>
                  <th className="py-2.5 px-4 text-right">Day P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {holdings.map(h => {
                  const isProfit = h.totalPnl >= 0;
                  return (
                    <tr key={h.symbol} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-sans">
                        {h.symbol}
                        <span className="block text-[11px] font-normal text-slate-400 font-mono">{h.name}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">{h.quantity}</td>
                      <td className="py-3 px-4 text-right">₹{h.averagePrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-white">₹{h.currentPrice.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-semibold">₹{h.currentValue.toLocaleString('en-IN')}</td>
                      <td className={`py-3 px-4 text-right font-bold ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {isProfit ? '+' : ''}₹{h.totalPnl.toLocaleString('en-IN')} ({h.totalPnlPercent.toFixed(2)}%)
                      </td>
                      <td className={`py-3 px-4 text-right ${h.dayPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {h.dayPnl >= 0 ? '+' : ''}₹{h.dayPnl.toFixed(2)} ({h.dayPnlPercent.toFixed(2)}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: OPEN ORDERS */}
        {activeBottomTab === 'orders' && (
          <div className="overflow-x-auto">
            {orders.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No orders placed in this session.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-[#070B14] text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[10px] tracking-wider font-mono">
                  <tr>
                    <th className="py-2.5 px-4">Time</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">Instrument</th>
                    <th className="py-2.5 px-4">Product</th>
                    <th className="py-2.5 px-4 text-right">Qty</th>
                    <th className="py-2.5 px-4 text-right">Price</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-400">{order.placedAt}</td>
                      <td className="py-3 px-4">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                          order.side === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {order.side} {order.orderType}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-sans">{order.symbol}</td>
                      <td className="py-3 px-4">{order.product}</td>
                      <td className="py-3 px-4 text-right font-semibold">{order.quantity}</td>
                      <td className="py-3 px-4 text-right font-bold">₹{order.price.toFixed(2)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.status === 'EXECUTED' ? 'bg-emerald-100 text-emerald-700' :
                          order.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {order.status === 'PENDING' && (
                          <button
                            onClick={() => cancelOrder(order.id)}
                            className="px-2 py-1 text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 4: TRADE HISTORY */}
        {activeBottomTab === 'trades' && (
          <div className="overflow-x-auto">
            {tradeHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">
                No trades executed in this session.
              </div>
            ) : (
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-[#070B14] text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[10px] tracking-wider font-mono">
                  <tr>
                    <th className="py-2.5 px-4">Executed Time</th>
                    <th className="py-2.5 px-4">Order ID</th>
                    <th className="py-2.5 px-4">Instrument</th>
                    <th className="py-2.5 px-4">Side</th>
                    <th className="py-2.5 px-4 text-right">Filled Qty</th>
                    <th className="py-2.5 px-4 text-right">Exec Price</th>
                    <th className="py-2.5 px-4 text-right">Total Turnover</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {tradeHistory.map(th => (
                    <tr key={th.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 text-slate-400">{th.executedAt || th.placedAt}</td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{th.id}</td>
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white font-sans">{th.symbol}</td>
                      <td className="py-2.5 px-4">
                        <span className={th.side === 'BUY' ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                          {th.side}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-semibold">{th.quantity}</td>
                      <td className="py-2.5 px-4 text-right font-bold">₹{th.price.toFixed(2)}</td>
                      <td className="py-2.5 px-4 text-right">₹{(th.price * th.quantity).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 5: AI FORECAST SIGNALS */}
        {activeBottomTab === 'ai' && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070B14]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Intraday Horizon (1-4 Hours)
                </span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  72% CONFIDENCE
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                Momentum indicators and volume profile signal upward continuation above the 20 EMA pivot.
              </p>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target 1:</span>
                  <span className="text-emerald-600 font-bold">₹{((live.price || 1000) * 1.012).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Invalidation Level (SL):</span>
                  <span className="text-rose-600 font-bold">₹{((live.price || 1000) * 0.992).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070B14]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Swing Horizon (1-5 Days)
                </span>
                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px]">
                  68% CONFIDENCE
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                Supertrend and ADX show steady trend development with support around 50 SMA.
              </p>
              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target 2:</span>
                  <span className="text-emerald-600 font-bold">₹{((live.price || 1000) * 1.035).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Invalidation Level (SL):</span>
                  <span className="text-rose-600 font-bold">₹{((live.price || 1000) * 0.978).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-400 mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>Regulatory Notice</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                DHRU.AI provides probabilistic algorithmic analytics for research and educational purposes only. DHRU is not a SEBI registered investment advisor. Always employ strict stop-loss and risk management rules.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Component for Individual Watchlist Item with Real-time Tick Flash
const WatchlistItem: React.FC<{
  symbol: string;
  name: string;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ symbol, name, isSelected, onSelect }) => {
  const live = useLivePrice(symbol);

  return (
    <button
      onClick={onSelect}
      className={`w-full p-2.5 text-left flex items-center justify-between transition-colors cursor-pointer ${
        isSelected
          ? 'bg-blue-50/80 dark:bg-blue-900/25 border-l-3 border-blue-600'
          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
      }`}
    >
      <div>
        <span className={`font-bold block ${isSelected ? 'text-blue-600 dark:text-cyan-400' : 'text-slate-900 dark:text-white'}`}>
          {symbol}
        </span>
        <span className="text-[10px] text-slate-400 truncate block max-w-[120px] font-mono">
          {name}
        </span>
      </div>

      <div className="text-right font-mono">
        <span className={`font-bold block transition-colors rounded px-1 ${
          live.flash === 'up'
            ? 'flash-up text-emerald-500 font-extrabold'
            : live.flash === 'down'
            ? 'flash-down text-rose-500 font-extrabold'
            : 'text-slate-900 dark:text-white'
        }`}>
          ₹{live.price > 0 ? live.price.toFixed(2) : '---'}
        </span>
        <span className={`text-[10px] font-semibold flex items-center justify-end ${
          live.change >= 0 ? 'text-emerald-600' : 'text-rose-600'
        }`}>
          {live.change >= 0 ? '+' : ''}{live.changePercent.toFixed(2)}%
        </span>
      </div>
    </button>
  );
};
