// DHRU.AI - Professional Live Trading Terminal
// Combines the ergonomics of Groww and Angel One with professional institutional terminal analytics

import React, { useState, useEffect, useMemo } from 'react';
import { useTrading, OrderSide, ProductType, OrderType } from '../context/TradingContext';
import { useMarketStream, useLivePrice } from '../context/MarketStreamContext';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { AccountTypeSwitcher } from '../components/common/AccountTypeSwitcher';
import { TradingViewChart } from '../components/chart/TradingViewChart';
import { QuoteFreshness } from '../components/market/QuoteFreshness';
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
  Coins,
  Wallet
} from 'lucide-react';

interface TerminalProps {
  initialSymbol?: string;
  onSelectStock?: (symbol: string) => void;
  onNavigate?: (page: string) => void;
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
const US_STOCKS = ['AAPL', 'NFLX', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META'];

export const TradingTerminalPage: React.FC<TerminalProps> = ({
  initialSymbol = 'RELIANCE.NS',
  onSelectStock,
  onNavigate
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

  const isCrypto = activeSymbol.endsWith('-USD');
  const isGlobal = isCrypto || activeSymbol.includes('=X') || activeSymbol.includes('=F') || US_STOCKS.includes(activeSymbol);
  const watchlistToUse = marketMode === 'crypto'
    ? GLOBAL_WATCHLIST_SYMBOLS.filter(item => item.symbol.endsWith('-USD'))
    : DEFAULT_WATCHLIST_SYMBOLS;

  // Market Stream & Live Quote
  const { isMarketLive, connectionStatus } = useMarketStream();
  const live = useLivePrice(activeSymbol);
  const currency = isCrypto ? '$' : activeSymbol.includes('INR') ? '₹' : activeSymbol.includes('=X') || activeSymbol.includes('=F') || US_STOCKS.includes(activeSymbol) ? '$' : '₹';
  const { wallet, openDepositModal } = useWallet();

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

  // Update limit price default only when active symbol changes or when uninitialized
  useEffect(() => {
    if (live.price > 0 && limitPrice === 0) {
      setLimitPrice(live.price);
      setTriggerPrice(Number((live.price * 0.99).toFixed(2)));
    }
  }, [activeSymbol, live.price, limitPrice]);

  // Reset limit price on symbol switch so it adopts the new symbol's live quote
  useEffect(() => {
    setLimitPrice(0);
  }, [activeSymbol]);

  // Handle Order Placement
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderFeedback(null);
    if (!live.isTickLive || live.status !== 'LIVE' || live.price <= 0) {
      setOrderFeedback({ type: 'error', message: 'A timestamped live quote is required before an order can be placed.' });
      return;
    }

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
  const executionPrice = orderType === 'MARKET' ? (live.isTickLive ? live.price : 0) : (limitPrice || (live.isTickLive ? live.price : 0));
  const totalOrderValue = executionPrice * quantity;
  const requiredMargin = productType === 'MIS' ? totalOrderValue * 0.20 : totalOrderValue;

  const filteredWatchlist = watchlistToUse.filter(item =>
    item.symbol.toLowerCase().includes(watchlistSearch.toLowerCase()) ||
    item.name.toLowerCase().includes(watchlistSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-3 min-h-[calc(100vh-140px)]">
      
      {/* 1. Terminal Top Ribbon: Market Status, Connectivity, & Account Summary */}
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs ">
        
        {/* Left: Stream Status & Active Instrument */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isCrypto || isMarketLive ? 'bg-surface-2' : 'bg-surface-2'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isCrypto || isMarketLive ? 'bg-pos' : 'bg-surface-2'
              }`} />
            </span>
            <span className="font-semibold text-ink-2 dark:text-ink-3">
              {isCrypto ? 'CRYPTO 24/7' : (connectionStatus === 'connected' ? (isMarketLive ? 'NSE LIVE' : 'NSE CLOSED (Next: 09:15 AM)') : 'RECONNECTING')}
            </span>
          </div>

          <div className="h-4 w-px bg-surface-2 dark:bg-surface-2" />

          {/* Active Symbol Display */}
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-ink dark:text-ink">
              {activeSymbol}
            </span>
            <span className="text-ink-2 hidden sm:inline">
              {stockDetail?.quote?.name || ''}
            </span>
            <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded transition-colors ${
              live.flash === 'up'
                ? 'flash-up bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos ring-1 ring-pos'
                : live.flash === 'down'
                ? 'flash-down bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg ring-1 ring-neg'
                : 'text-ink dark:text-ink'
            }`}>
              {currency}{live.price > 0 ? live.price.toFixed(2) : (stockDetail?.quote?.price?.toFixed(2) ?? '---')}
            </span>
            <QuoteFreshness status={live.status} source={live.source} lastUpdated={live.lastUpdated} timestamp={live.timestamp} />
            <span className={`font-mono text-xs font-semibold flex items-center ${
              live.change >= 0 ? 'text-pos' : 'text-neg'
            }`}>
              {live.change >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {live.change >= 0 ? '+' : ''}{live.change.toFixed(2)} ({live.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Right: Balance Bar */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <AccountTypeSwitcher compact />
          <div>
            <span className="text-ink-2">Avail. Margin:</span>{' '}
            <strong className="text-ink dark:text-ink font-bold">{currency}{marginAvailable.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: 2 })}</strong>
          </div>
          <div>
            <span className="text-ink-2">Margin Used:</span>{' '}
            <span className="text-ink-2 dark:text-ink-3">{currency}{marginUsed.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <div>
            <span className="text-ink-2">Day P&L:</span>{' '}
            <strong className={totalDayPnl >= 0 ? 'text-pos font-bold' : 'text-neg font-bold'}>
              {totalDayPnl >= 0 ? '+' : ''}{currency}{totalDayPnl.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: 2 })}
            </strong>
          </div>
          <div>
            <span className="text-ink-2">Realized P&L:</span>{' '}
            <strong className={realizedPnl >= 0 ? 'text-pos font-bold' : 'text-neg font-bold'}>
              {realizedPnl >= 0 ? '+' : ''}{currency}{realizedPnl.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: 2 })}
            </strong>
          </div>

          {/* Quick Add Funds & Buy Credits Buttons */}
          <div className="flex items-center gap-1.5 font-sans">
            <button
              type="button"
              onClick={() => openDepositModal('funds')}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              title="Deposit Real Funds via UPI"
            >
              <Wallet className="w-3 h-3" />
              <span>+ Add Funds</span>
            </button>
            <button
              type="button"
              onClick={() => openDepositModal('credits')}
              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              title="Buy AI Credits (Unlock SMC Indicators)"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>{wallet.credits} Cr</span>
            </button>
          </div>

          {/* Broker Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand font-semibold border border-line dark:border-line text-ink">
            <Shield className="w-3 h-3" />
            <span>{brokerConfig.mode === 'live' ? 'BROKER LIVE' : 'SANDBOX SIM'}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Terminal Grid: [Watchlist] - [Chart] - [Order Ticket] */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 items-start">
        
        {/* LEFT COLUMN: Collapsible Watchlist (3 cols) */}
        {leftSidebarOpen && (
          <div className="lg:col-span-3 bg-surface dark:bg-surface border border-line dark:border-line rounded-xl flex flex-col h-[650px] ">
            <div className="p-3 border-b border-line dark:border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand dark:text-brand" />
                <span className="font-bold text-sm text-ink dark:text-ink">Watchlist</span>
                <span className="text-ink bg-surface-2 dark:bg-surface-2 text-ink-2 font-mono px-1.5 py-0.5 rounded">
                  {DEFAULT_WATCHLIST_SYMBOLS.length}
                </span>
              </div>
              <button
                onClick={() => setLeftSidebarOpen(false)}
                className="text-ink-3 hover:text-ink-2 dark:hover:text-ink cursor-pointer"
                title="Collapse Watchlist"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            {/* Watchlist Search */}
            <div className="p-2 border-b border-line dark:border-line">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-ink-3" />
                <input
                  type="text"
                  placeholder="Filter symbols..."
                  value={watchlistSearch}
                  onChange={e => setWatchlistSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            {/* Watchlist Items */}
            <div className="flex-1 overflow-y-auto divide-y divide-line dark:divide-line text-xs">
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
              className="self-start flex items-center gap-1 px-2.5 py-1 text-xs bg-surface dark:bg-surface border border-line dark:border-line rounded-lg text-ink-2 dark:text-ink-3 hover:text-brand cursor-pointer "
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
        <div className="lg:col-span-3 bg-surface dark:bg-surface border border-line dark:border-line rounded-xl p-4 flex flex-col gap-4 ">
          
          <div className="flex items-center justify-between border-b border-line dark:border-line pb-3">
            <div>
              <h3 className="font-extrabold text-sm text-ink dark:text-ink">Order Ticket</h3>
              <p className="text-ink-2 font-mono">
                {isGlobal ? (activeSymbol.includes('=X') ? 'Global Interbank Forex' : 'Global 24/7 Crypto') : 'NSE • Continuous Trading'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-ink uppercase font-mono text-ink-3">LTP</span>
              <p className="font-mono font-bold text-sm text-ink dark:text-ink">
                {live.price > 0 ? `${currency}${live.price.toFixed(live.price > 100 ? 2 : 4)}` : 'Unavailable'}
              </p>
              <QuoteFreshness status={live.status} source={live.source} lastUpdated={live.lastUpdated} timestamp={live.timestamp} />
            </div>
          </div>

          {/* Feedback Banner */}
          {orderFeedback && (
            <div className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
              orderFeedback.type === 'success'
                ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos border border-line'
                : 'bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg border border-line'
            }`}>
              {orderFeedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
              <span>{orderFeedback.message}</span>
            </div>
          )}

          <form onSubmit={handlePlaceOrder} className="flex flex-col gap-3 text-xs">
            
            {/* BUY vs SELL Switch */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-surface-2 dark:bg-surface-2 rounded-lg">
              <button
                type="button"
                onClick={() => setOrderSide('BUY')}
                className={`py-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                  orderSide === 'BUY'
                    ? 'bg-pos-fill text-on-brand '
                    : 'text-ink-2 dark:text-ink-3 hover:text-ink'
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                onClick={() => setOrderSide('SELL')}
                className={`py-2 rounded-md font-bold text-xs transition-all cursor-pointer ${
                  orderSide === 'SELL'
                    ? 'bg-neg-fill text-on-brand '
                    : 'text-ink-2 dark:text-ink-3 hover:text-ink'
                }`}
              >
                SELL
              </button>
            </div>

            {/* Product Type: Delivery (CNC) vs Intraday (MIS) */}
            <div className="flex flex-col gap-1">
              <label className="text-ink font-semibold text-ink-2">Product</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setProductType('MIS')}
                  className={`py-1.5 px-3 rounded-lg border font-semibold transition-colors cursor-pointer text-center ${
                    productType === 'MIS'
                      ? 'border-line bg-surface-2 text-brand dark:bg-brand-fill dark:border-line dark:text-brand'
                      : 'border-line dark:border-line text-ink-2 dark:text-ink-3'
                  }`}
                >
                  Intraday (MIS • 5x)
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('CNC')}
                  className={`py-1.5 px-3 rounded-lg border font-semibold transition-colors cursor-pointer text-center ${
                    productType === 'CNC'
                      ? 'border-line bg-surface-2 text-brand dark:bg-brand-fill dark:border-line dark:text-brand'
                      : 'border-line dark:border-line text-ink-2 dark:text-ink-3'
                  }`}
                >
                  Delivery (CNC • 1x)
                </button>
              </div>
            </div>

            {/* Order Type: Market / Limit / SL */}
            <div className="flex flex-col gap-1">
              <label className="text-ink font-semibold text-ink-2">Order Type</label>
              <div className="grid grid-cols-3 gap-1 bg-surface-2 dark:bg-surface-2 p-1 rounded-lg">
                {(['MARKET', 'LIMIT', 'SL'] as OrderType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOrderType(t)}
                    className={`py-1 rounded font-semibold text-ink transition-colors cursor-pointer ${
                      orderType === t
                        ? 'bg-surface dark:bg-surface text-brand '
                        : 'text-ink-2 dark:text-ink-3'
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
                <label className="text-ink font-semibold text-ink-2">Quantity</label>
                <span className="text-ink-3 font-mono">Lot Size: 1</span>
              </div>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="px-3 py-1.5 bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-lg text-ink dark:text-ink font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <div className="flex items-center gap-1.5 mt-1">
                {[10, 25, 50, 100].map(q => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    className="flex-1 py-0.5 rounded bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3 font-mono text-ink hover:bg-surface-2 cursor-pointer"
                  >
                    +{q}
                  </button>
                ))}
              </div>
            </div>

            {/* Limit Price (if LIMIT or SL) */}
            {orderType !== 'MARKET' && (
              <div className="flex flex-col gap-1">
                <label className="text-ink font-semibold text-ink-2">Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={limitPrice}
                  onChange={e => setLimitPrice(parseFloat(e.target.value) || 0)}
                  className="px-3 py-1.5 bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-lg text-ink dark:text-ink font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            )}

            {/* Trigger Price (if SL) */}
            {orderType === 'SL' && (
              <div className="flex flex-col gap-1">
                <label className="text-ink font-semibold text-ink-2">Trigger Price (₹)</label>
                <input
                  type="number"
                  step="0.05"
                  value={triggerPrice}
                  onChange={e => setTriggerPrice(parseFloat(e.target.value) || 0)}
                  className="px-3 py-1.5 bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-lg text-ink dark:text-ink font-mono font-bold focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            )}

            {/* Margin Calculation & Breakdown */}
            <div className="mt-2 p-2.5 rounded-lg bg-surface-2 dark:bg-surface border border-line dark:border-line space-y-1.5 text-ink font-mono">
              <div className="flex justify-between">
                <span className="text-ink-2">Order Value:</span>
                <span className="text-ink dark:text-ink-3 font-semibold">{currency}{totalOrderValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-2">Margin Required:</span>
                <strong className="text-brand dark:text-brand font-bold">{currency}{requiredMargin.toLocaleString(undefined, { maximumFractionDigits: 2 })}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-2">Margin Available:</span>
                <span className={marginAvailable >= requiredMargin ? 'text-pos font-semibold' : 'text-neg font-semibold'}>
                  {currency}{marginAvailable.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={!live.isTickLive || live.status !== 'LIVE'}
              className={`w-full py-2.5 rounded-lg text-on-brand font-bold text-sm  transition-all cursor-pointer mt-1 ${
                orderSide === 'BUY'
                  ? 'bg-pos hover:bg-pos-tint active:scale-[0.98]'
                  : 'bg-neg hover:bg-neg-tint active:scale-[0.98]'
              }`}
            >
              {orderSide === 'BUY' ? 'PLACE BUY ORDER' : 'PLACE SELL ORDER'}
            </button>
          </form>

          {/* Broker Settings & Simulation Toggle */}
          <div className="pt-2 border-t border-line dark:border-line flex items-center justify-between text-ink-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-brand" />
              <span>Instant Fill</span>
            </span>
            <button
              onClick={() => updateBrokerConfig({ mode: brokerConfig.mode === 'simulation' ? 'live' : 'simulation' })}
              className="hover:text-brand dark:hover:text-brand font-semibold transition-colors cursor-pointer"
            >
              Mode: {brokerConfig.mode.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Compact Positions & Portfolio Quick-Access Banner */}
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-sm text-ink dark:text-ink">
                Portfolio & Active Positions Desk
              </span>
              <span className="px-2 py-0.5 rounded-full text-ink font-mono font-bold bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand border border-line dark:border-line">
                {positions.length} Active Positions • {holdings.length} Holdings
              </span>
            </div>
            <p className="text-xs text-ink-2 dark:text-ink-3 mt-0.5 flex items-center gap-2 flex-wrap font-mono">
              <span>Unrealized P&L:</span>
              <strong className={`font-bold ${totalUnrealizedPnl >= 0 ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'}`}>
                {totalUnrealizedPnl >= 0 ? '+' : ''}{marketMode === 'crypto' ? '$' : '₹'}{totalUnrealizedPnl.toFixed(2)}
              </strong>
              <span>•</span>
              <span>Realized P&L:</span>
              <strong className={`font-bold ${realizedPnl >= 0 ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'}`}>
                {realizedPnl >= 0 ? '+' : ''}{marketMode === 'crypto' ? '$' : '₹'}{realizedPnl.toFixed(2)}
              </strong>
              <span>•</span>
              <span>Available Margin: <strong>{marketMode === 'crypto' ? '$' : '₹'}{marginAvailable.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
          {positions.length > 0 && (
            <button
              onClick={squareOffAll}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-surface-2 dark:bg-neg-tint text-neg hover:bg-surface-2 border border-line dark:border-line transition-colors cursor-pointer"
            >
              Square Off All
            </button>
          )}

          <button
            onClick={() => onNavigate?.('positions')}
            className="px-4 py-2 bg-brand-fill hover:bg-brand-fill active:scale-95 text-on-brand text-xs font-bold rounded-xl   transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Open Dedicated Positions & Holdings Desk</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
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
  const isCrypto = symbol.endsWith('-USD');
  const currency = isCrypto ? '$' : symbol.includes('INR') ? '₹' : symbol.includes('=X') || symbol.includes('=F') || US_STOCKS.includes(symbol) ? '$' : '₹';

  return (
    <button
      onClick={onSelect}
      className={`w-full p-2.5 text-left flex items-center justify-between transition-colors cursor-pointer ${
        isSelected
          ? 'bg-surface-2 dark:bg-brand-fill border-l-3 border-line'
          : 'hover:bg-surface-2 dark:hover:bg-surface-2'
      }`}
    >
      <div>
        <span className={`font-bold block ${isSelected ? 'text-brand dark:text-brand' : 'text-ink dark:text-ink'}`}>
          {symbol}
        </span>
        <span className="text-ink-3 truncate block max-w-[120px] font-mono">
          {name}
        </span>
      </div>

      <div className="text-right font-mono">
        <span className={`font-bold block transition-colors rounded px-1 ${
          live.flash === 'up'
            ? 'flash-up text-pos font-extrabold'
            : live.flash === 'down'
            ? 'flash-down text-neg font-extrabold'
            : 'text-ink dark:text-ink'
        }`}>
          {currency}{live.price > 0 ? live.price.toLocaleString(isCrypto || currency === '$' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2, maximumFractionDigits: isCrypto ? 8 : 2 }) : '---'}
        </span>
        <span className={`text-ink font-semibold flex items-center justify-end ${
          live.change >= 0 ? 'text-pos' : 'text-neg'
        }`}>
          {live.change >= 0 ? '+' : ''}{live.changePercent.toFixed(2)}%
        </span>
      </div>
    </button>
  );
};
