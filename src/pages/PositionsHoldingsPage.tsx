// DHRU.AI - Dedicated Positions & Portfolio Holdings Desk
// High-dimension FinTech dashboard for monitoring active intraday positions, delivery holdings,
// order status, execution logs, and live tick-by-tick P&L.
// Fully mobile-compact with responsive card layouts and desktop data tables.

import React, { useState, useMemo } from 'react';
import { useTrading, Position, ClosedPosition, Holding, Order } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import { useMarketStream } from '../context/MarketStreamContext';
import { Button } from '../components/ui/Button';
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
  Search,
  ExternalLink,
  RefreshCw,
  Coins,
  Wallet,
  Briefcase,
  PieChart,
  ListOrdered,
  History,
  X
} from 'lucide-react';

interface PositionsHoldingsPageProps {
  onSelectStock?: (symbol: string) => void;
  onTradeStock?: (symbol: string, side?: 'BUY' | 'SELL') => void;
  onNavigate?: (page: string) => void;
}

export const PositionsHoldingsPage: React.FC<PositionsHoldingsPageProps> = ({
  onSelectStock,
  onTradeStock,
  onNavigate
}) => {
  const {
    positions,
    closedPositions,
    holdings,
    orders,
    tradeHistory,
    marginAvailable,
    marginUsed,
    realizedPnl,
    cashBalance,
    totalInvested,
    totalCurrentValue,
    totalUnrealizedPnl,
    totalDayPnl,
    squareOffPosition,
    squareOffAll,
    cancelOrder
  } = useTrading();

  const { marketMode } = useAuth();
  const { isMarketLive } = useMarketStream();
  const isCrypto = marketMode === 'crypto';
  const currencySym = isCrypto ? '$' : '₹';

  const [activeTab, setActiveTab] = useState<'positions' | 'holdings' | 'orders' | 'history'>('positions');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmSquareOffAll, setConfirmSquareOffAll] = useState(false);

  // Filtered lists
  const filteredPositions = useMemo(() => {
    return positions.filter(p =>
      p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [positions, searchQuery]);

  const filteredClosedPositions = useMemo(() => {
    return (closedPositions || []).filter(p =>
      p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [closedPositions, searchQuery]);

  const filteredHoldings = useMemo(() => {
    return holdings.filter(h =>
      h.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [holdings, searchQuery]);

  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.status === 'PENDING');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o =>
      o.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [orders, searchQuery]);

  const filteredHistory = useMemo(() => {
    return tradeHistory.filter(t =>
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [tradeHistory, searchQuery]);

  const formatCurrency = (val: number, decimals: number = 2) => {
    const isNegative = val < 0;
    const absVal = Math.abs(val || 0);
    const formatted = absVal.toLocaleString(isCrypto ? 'en-US' : 'en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    const prefix = isCrypto ? '$' : '₹';
    return isNegative ? `-${prefix}${formatted}` : `${prefix}${formatted}`;
  };

  const handleTradeInstrument = (symbol: string, side: 'BUY' | 'SELL' = 'BUY') => {
    if (onTradeStock) {
      onTradeStock(symbol, side);
    } else if (onNavigate) {
      onSelectStock?.(symbol);
      onNavigate('terminal');
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-surface dark:bg-surface border border-line dark:border-line ">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-ink dark:text-ink tracking-tight">
                  Positions & Portfolio Holdings
                </h1>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-ink font-mono font-bold bg-surface-2 dark:bg-pos-tint text-pos dark:text-pos border border-line dark:border-line">
                  <span className="w-1.5 h-1.5 rounded-full bg-pos animate-ping" />
                  Live Feeds
                </span>
              </div>
              <p className="text-xs text-ink-2 dark:text-ink-3 mt-0.5">
                Real-time mark-to-market valuation, live tick P&L, exposure management, and trade execution desk.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="trade"
            size="sm"
            onClick={() => onNavigate?.('terminal')}
            icon={<Zap className="w-3.5 h-3.5 fill-current" />}
          >
            Open Terminal
          </Button>
        </div>
      </div>

      {/* 2. Institutional KPI Matrix (4 High-Impact Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Portfolio Value */}
        <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-line dark:border-line ">
          <div className="flex items-center justify-between text-ink-2 dark:text-ink-3 text-xs font-medium">
            <span>Portfolio Net Equity</span>
            <PieChart className="w-4 h-4 text-brand" />
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-2xl font-black font-mono text-ink dark:text-ink">
              {formatCurrency(totalCurrentValue + cashBalance + totalUnrealizedPnl)}
            </span>
            <div className="text-ink-2 font-mono mt-0.5 truncate">
              Cash: <strong>{formatCurrency(cashBalance)}</strong> {totalCurrentValue > 0 ? `• Holdings: ${formatCurrency(totalCurrentValue)}` : ''}
            </div>
          </div>
        </div>

        {/* Card 2: Net Unrealized P&L */}
        <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-line dark:border-line ">
          <div className="flex items-center justify-between text-ink-2 dark:text-ink-3 text-xs font-medium">
            <span>Open P&L (MTM)</span>
            {totalUnrealizedPnl >= 0 ? (
              <TrendingUp className="w-4 h-4 text-pos" />
            ) : (
              <TrendingDown className="w-4 h-4 text-neg" />
            )}
          </div>
          <div className="mt-2">
            <span className={`text-lg sm:text-2xl font-black font-mono ${
              totalUnrealizedPnl >= 0 ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
            }`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnl)}
            </span>
            <div className="text-ink-2 font-mono mt-0.5">
              {positions.length} Open Positions Active
            </div>
          </div>
        </div>

        {/* Card 3: Today's Day P&L */}
        <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-line dark:border-line ">
          <div className="flex items-center justify-between text-ink-2 dark:text-ink-3 text-xs font-medium">
            <span>Today's Total P&L</span>
            <Clock className="w-4 h-4 text-warn" />
          </div>
          <div className="mt-2">
            <span className={`text-lg sm:text-2xl font-black font-mono ${
              totalDayPnl >= 0 ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
            }`}>
              {totalDayPnl >= 0 ? '+' : ''}{formatCurrency(totalDayPnl)}
            </span>
            <div className="text-ink-2 font-mono mt-0.5 flex items-center justify-between">
              <span>Realized:</span>
              <strong className={realizedPnl >= 0 ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'}>
                {realizedPnl >= 0 ? '+' : ''}{formatCurrency(realizedPnl)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 4: Margin Available */}
        <div className="p-4 rounded-2xl bg-surface dark:bg-surface border border-line dark:border-line ">
          <div className="flex items-center justify-between text-ink-2 dark:text-ink-3 text-xs font-medium">
            <span>Trading Margin</span>
            <Wallet className="w-4 h-4 text-ai" />
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-2xl font-black font-mono text-ink dark:text-ink">
              {formatCurrency(marginAvailable)}
            </span>
            <div className="text-ink-2 font-mono mt-0.5">
              Used: <strong>{formatCurrency(marginUsed)}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Desk Navigation Tabs & Search Controls */}
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-3xl overflow-hidden ">
        
        {/* Tab Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-line dark:border-line bg-surface-2 dark:bg-surface">
          
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'positions'
                  ? 'bg-brand-fill text-on-brand '
                  : 'text-ink-2 dark:text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-2'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Positions</span>
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-ink ${
                activeTab === 'positions' ? 'bg-surface text-ink' : 'bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3'
              }`}>
                {positions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('holdings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'holdings'
                  ? 'bg-brand-fill text-on-brand '
                  : 'text-ink-2 dark:text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-2'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Holdings (Portfolio)</span>
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-ink ${
                activeTab === 'holdings' ? 'bg-surface text-ink' : 'bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3'
              }`}>
                {holdings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-brand-fill text-on-brand '
                  : 'text-ink-2 dark:text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-2'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Open Orders</span>
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-ink ${
                activeTab === 'orders' ? 'bg-surface text-ink' : 'bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3'
              }`}>
                {pendingOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-brand-fill text-on-brand '
                  : 'text-ink-2 dark:text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-2'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Trade Log</span>
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-ink ${
                activeTab === 'history' ? 'bg-surface text-ink' : 'bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3'
              }`}>
                {tradeHistory.length}
              </span>
            </button>
          </div>

          {/* Search Input & Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-ink-3" />
              <input
                type="text"
                placeholder="Filter symbols..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-surface dark:bg-surface border border-line dark:border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-ink-3 hover:text-ink-2 dark:hover:text-ink"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {activeTab === 'positions' && positions.length > 0 && (
              <button
                onClick={() => {
                  if (confirmSquareOffAll) {
                    squareOffAll();
                    setConfirmSquareOffAll(false);
                  } else {
                    setConfirmSquareOffAll(true);
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  confirmSquareOffAll
                    ? 'bg-neg-fill text-on-brand animate-pulse'
                    : 'bg-surface-2 dark:bg-neg-tint text-neg border border-line dark:border-line hover:bg-surface-2'
                }`}
              >
                {confirmSquareOffAll ? 'Confirm Exit All?' : 'Square Off All'}
              </button>
            )}
          </div>

        </div>

        {/* 4. Tab Content Panels */}
        <div className="p-4 sm:p-6">
          
          {/* TAB 1: POSITIONS */}
          {activeTab === 'positions' && (
            <div className="space-y-6">
              {/* 1.1 OPEN POSITIONS SECTION */}
              {filteredPositions.length === 0 ? (
                filteredClosedPositions.length > 0 ? (
                  <div className="p-4 rounded-2xl bg-surface-2 dark:bg-brand-fill border border-line dark:border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-ink dark:text-ink">
                          All Open Positions Squared Off
                        </h4>
                        <p className="text-xs text-ink-2 dark:text-ink-3">
                          0 active intraday positions currently running. View your closed trades and booked returns below.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="trade"
                      size="sm"
                      onClick={() => onNavigate?.('terminal')}
                      icon={<Zap className="w-3.5 h-3.5 fill-current" />}
                    >
                      Trade in Terminal
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand flex items-center justify-center mx-auto">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-bold text-ink dark:text-ink">No Open Positions</h3>
                    <p className="text-xs text-ink-2 dark:text-ink-3 max-w-sm mx-auto">
                      You have no active intraday (MIS) trades running. Execute an order in the Live Terminal to start tracking real-time P&L.
                    </p>
                    <Button
                      variant="trade"
                      size="md"
                      onClick={() => onNavigate?.('terminal')}
                      icon={<Zap className="w-4 h-4 fill-current" />}
                    >
                      Open Live Terminal
                    </Button>
                  </div>
                )
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-pos animate-pulse" />
                      <h3 className="font-extrabold text-sm text-ink dark:text-ink">
                        Open Intraday Positions ({filteredPositions.length})
                      </h3>
                    </div>
                  </div>

                  {/* Mobile Cards (visible on phones < md) */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {filteredPositions.map(pos => {
                      const isProfit = pos.pnl >= 0;
                      return (
                        <div
                          key={pos.id}
                          className="p-4 rounded-2xl bg-surface-2 dark:bg-surface border border-line dark:border-line space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-sm text-ink dark:text-ink">
                                  {pos.symbol}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded text-ink font-bold text-[11px] ${
                                  pos.side === 'BUY'
                                    ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos'
                                    : 'bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg'
                                }`}>
                                  {pos.product} • {pos.side}
                                </span>
                                {pos.tier && (
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                                    pos.tier === 'scalp'
                                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                      : pos.tier === 'swing'
                                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                  }`}>
                                    {pos.tierLabel || (pos.tier === 'scalp' ? 'Quick Profit' : pos.tier === 'swing' ? 'More Profit' : 'Big Profit')}
                                  </span>
                                )}
                              </div>
                              <span className="text-ink-3 truncate block text-xs mt-0.5">
                                {pos.name}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className={`text-base font-black font-mono ${
                                isProfit ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                              }`}>
                                {pos.pnl > 0 ? '+' : ''}{formatCurrency(pos.pnl)}
                              </span>
                              <div className={`text-ink font-mono font-bold ${
                                isProfit ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                              }`}>
                                {pos.pnlPercent > 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-surface dark:bg-surface border border-line dark:border-line text-xs font-mono">
                            <div>
                              <span className="text-ink-3 uppercase">Qty</span>
                              <p className="font-bold text-ink dark:text-ink-3">{pos.quantity}</p>
                            </div>
                            <div>
                              <span className="text-ink-3 uppercase">Avg</span>
                              <p className="font-bold text-ink dark:text-ink-3">{formatCurrency(pos.averagePrice)}</p>
                            </div>
                            <div>
                              <span className="text-ink-3 uppercase">LTP</span>
                              <p className="font-bold text-ink dark:text-ink">{formatCurrency(pos.currentPrice)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1"
                              onClick={() => squareOffPosition(pos.id)}
                            >
                              Exit Position
                            </Button>
                            <Button
                              variant="trade"
                              size="sm"
                              onClick={() => handleTradeInstrument(pos.symbol, 'BUY')}
                            >
                              Trade
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table (hidden on mobile) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-2 dark:bg-surface text-ink-2 border-b border-line dark:border-line font-semibold uppercase text-ink tracking-wider font-mono">
                        <tr>
                          <th className="py-3 px-4">Instrument</th>
                          <th className="py-3 px-4">Product / Side</th>
                          <th className="py-3 px-4 text-right">Quantity</th>
                          <th className="py-3 px-4 text-right">Average Price</th>
                          <th className="py-3 px-4 text-right">LTP (Live)</th>
                          <th className="py-3 px-4 text-right">Unrealized P&L</th>
                          <th className="py-3 px-4 text-right">Returns %</th>
                          <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line dark:divide-line font-mono">
                        {filteredPositions.map(pos => {
                          const isProfit = pos.pnl >= 0;
                          return (
                            <tr key={pos.id} className="hover:bg-surface-2 dark:hover:bg-surface-2 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-ink dark:text-ink font-sans">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span>{pos.symbol}</span>
                                  {pos.tier && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider font-mono ${
                                      pos.tier === 'scalp'
                                        ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                                        : pos.tier === 'swing'
                                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                        : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                    }`}>
                                      {pos.tierLabel || (pos.tier === 'scalp' ? 'Quick Profit' : pos.tier === 'swing' ? 'More Profit' : 'Big Profit')}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => handleTradeInstrument(pos.symbol)}
                                    className="p-1 text-ink-3 hover:text-brand"
                                    title="Open in Terminal"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="block text-ink font-normal text-ink-3 font-mono text-[11px] mt-0.5">{pos.name}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-ink font-bold ${
                                  pos.side === 'BUY'
                                    ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos'
                                    : 'bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg'
                                }`}>
                                  {pos.product} • {pos.side}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-semibold text-ink dark:text-ink-3">
                                {pos.quantity}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {formatCurrency(pos.averagePrice)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold text-ink dark:text-ink">
                                {formatCurrency(pos.currentPrice)}
                              </td>
                              <td className={`py-3.5 px-4 text-right font-bold ${
                                isProfit ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                              }`}>
                                {pos.pnl > 0 ? '+' : ''}{formatCurrency(pos.pnl)}
                              </td>
                              <td className={`py-3.5 px-4 text-right font-semibold ${
                                isProfit ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                              }`}>
                                {pos.pnlPercent > 0 ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => squareOffPosition(pos.id)}
                                >
                                  Square Off
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* 1.2 CLOSED POSITIONS (TODAY'S REALIZED TRADES) */}
              {filteredClosedPositions.length > 0 && (
                <div className="pt-4 border-t border-line dark:border-line space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-surface-2 dark:bg-surface-2" />
                      <h3 className="font-extrabold text-sm text-ink dark:text-ink">
                        Closed Positions Today ({filteredClosedPositions.length})
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-ink-2 dark:text-ink-3">
                      Total Realized: <strong className={realizedPnl >= 0 ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'}>
                        {realizedPnl > 0 ? '+' : ''}{formatCurrency(realizedPnl)}
                      </strong>
                    </span>
                  </div>

                  {/* Mobile Closed Cards */}
                  <div className="grid grid-cols-1 gap-2.5 md:hidden">
                    {filteredClosedPositions.map(cp => {
                      const isProfit = cp.pnl >= 0;
                      return (
                        <div
                          key={cp.id}
                          className="p-3.5 rounded-2xl bg-surface-2 dark:bg-surface border border-line dark:border-line space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-sm text-ink dark:text-ink">
                                  {cp.symbol}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-ink font-bold bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3">
                                  {cp.product} • {cp.side}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-ink font-bold bg-surface-2 text-brand dark:bg-brand-fill dark:text-brand">
                                  CLOSED
                                </span>
                              </div>
                              <span className="text-ink-3 block mt-0.5">
                                {cp.name} • Closed at {cp.closedAt}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className={`text-sm font-black font-mono ${
                                isProfit ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                              }`}>
                                {cp.pnl > 0 ? '+' : ''}{formatCurrency(cp.pnl)}
                              </span>
                              <div className={`text-ink font-mono font-bold ${
                                isProfit ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                              }`}>
                                {cp.pnlPercent > 0 ? '+' : ''}{cp.pnlPercent.toFixed(2)}%
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-1.5 px-2.5 rounded-xl bg-surface dark:bg-surface border border-line dark:border-line text-ink font-mono">
                            <div>
                              <span className="text-ink-3 uppercase">Qty</span>
                              <p className="font-semibold text-ink dark:text-ink-3">{cp.quantity}</p>
                            </div>
                            <div>
                              <span className="text-ink-3 uppercase">Entry</span>
                              <p className="font-semibold text-ink dark:text-ink-3">{formatCurrency(cp.entryPrice)}</p>
                            </div>
                            <div>
                              <span className="text-ink-3 uppercase">Exit</span>
                              <p className="font-semibold text-ink dark:text-ink-3">{formatCurrency(cp.exitPrice)}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Closed Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-2 dark:bg-surface text-ink-2 border-b border-line dark:border-line font-semibold uppercase text-ink tracking-wider font-mono">
                        <tr>
                          <th className="py-2.5 px-4">Instrument</th>
                          <th className="py-2.5 px-4">Product / Side</th>
                          <th className="py-2.5 px-4 text-right">Quantity</th>
                          <th className="py-2.5 px-4 text-right">Entry Price</th>
                          <th className="py-2.5 px-4 text-right">Exit Price</th>
                          <th className="py-2.5 px-4 text-right">Realized Return</th>
                          <th className="py-2.5 px-4 text-right">Return %</th>
                          <th className="py-2.5 px-4 text-center">Closed At</th>
                          <th className="py-2.5 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line dark:divide-line font-mono">
                        {filteredClosedPositions.map(cp => {
                          const isProfit = cp.pnl >= 0;
                          return (
                            <tr key={cp.id} className="hover:bg-surface-2 dark:hover:bg-surface-2">
                              <td className="py-3 px-4 font-bold text-ink dark:text-ink font-sans">
                                <span>{cp.symbol}</span>
                                <span className="block text-ink font-normal text-ink-3 font-mono">{cp.name}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="px-2 py-0.5 rounded text-ink font-bold bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3">
                                  {cp.product} • {cp.side}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right font-semibold text-ink dark:text-ink-3">
                                {cp.quantity}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {formatCurrency(cp.entryPrice)}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-ink dark:text-ink">
                                {formatCurrency(cp.exitPrice)}
                              </td>
                              <td className={`py-3 px-4 text-right font-bold ${
                                isProfit ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                              }`}>
                                {cp.pnl > 0 ? '+' : ''}{formatCurrency(cp.pnl)}
                              </td>
                              <td className={`py-3 px-4 text-right font-semibold ${
                                isProfit ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                              }`}>
                                {cp.pnlPercent > 0 ? '+' : ''}{cp.pnlPercent.toFixed(2)}%
                              </td>
                              <td className="py-3 px-4 text-center text-ink-2 dark:text-ink-3 text-ink">
                                {cp.closedAt}
                              </td>
                              <td className="py-3 px-4 text-center">
                                <span className="px-2 py-0.5 rounded text-ink font-bold bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand border border-line dark:border-line">
                                  CLOSED
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HOLDINGS (PORTFOLIO) */}
          {activeTab === 'holdings' && (
            <div>
              {filteredHoldings.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface-2 dark:bg-surface-2 text-ai dark:text-ai flex items-center justify-center mx-auto">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-ink dark:text-ink">No Holdings Found</h3>
                  <p className="text-xs text-ink-2 dark:text-ink-3 max-w-sm mx-auto">
                    Delivery (CNC) equity investments will be displayed here with real-time portfolio returns.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Holdings Cards */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {filteredHoldings.map(h => {
                      const isProfit = h.totalPnl >= 0;
                      return (
                        <div
                          key={h.symbol}
                          className="p-4 rounded-2xl bg-surface-2 dark:bg-surface border border-line dark:border-line space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-extrabold text-sm text-ink dark:text-ink block">
                                {h.symbol}
                              </span>
                              <span className="text-ink-3 truncate block">
                                {h.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className={`text-base font-black font-mono ${
                                isProfit ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                              }`}>
                                {isProfit ? '+' : ''}{formatCurrency(h.totalPnl)}
                              </span>
                              <div className={`text-ink font-mono font-bold ${
                                isProfit ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                              }`}>
                                {isProfit ? '+' : ''}{h.totalPnlPercent.toFixed(2)}%
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-surface dark:bg-surface border border-line dark:border-line text-xs font-mono">
                            <div>
                              <span className="text-ink-3 uppercase">Qty</span>
                              <p className="font-bold text-ink dark:text-ink-3">{h.quantity}</p>
                            </div>
                            <div>
                              <span className="text-ink-3 uppercase">Avg Cost</span>
                              <p className="font-bold text-ink dark:text-ink-3">{formatCurrency(h.averagePrice)}</p>
                            </div>
                            <div>
                              <span className="text-ink-3 uppercase">LTP</span>
                              <p className="font-bold text-ink dark:text-ink">{formatCurrency(h.currentPrice)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <Button
                              variant="buy"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleTradeInstrument(h.symbol, 'BUY')}
                            >
                              Buy More
                            </Button>
                            <Button
                              variant="sell"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleTradeInstrument(h.symbol, 'SELL')}
                            >
                              Sell
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Holdings Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-2 dark:bg-surface text-ink-2 border-b border-line dark:border-line font-semibold uppercase text-ink tracking-wider font-mono">
                        <tr>
                          <th className="py-3 px-4">Instrument</th>
                          <th className="py-3 px-4 text-right">Quantity</th>
                          <th className="py-3 px-4 text-right">Avg Cost</th>
                          <th className="py-3 px-4 text-right">LTP (Live)</th>
                          <th className="py-3 px-4 text-right">Current Value</th>
                          <th className="py-3 px-4 text-right">Total P&L</th>
                          <th className="py-3 px-4 text-right">Day P&L</th>
                          <th className="py-3 px-4 text-center">Trade</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line dark:divide-line font-mono">
                        {filteredHoldings.map(h => {
                          const isProfit = h.totalPnl >= 0;
                          return (
                            <tr key={h.symbol} className="hover:bg-surface-2 dark:hover:bg-surface-2 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-ink dark:text-ink font-sans">
                                <span>{h.symbol}</span>
                                <span className="block text-ink font-normal text-ink-3 font-mono">{h.name}</span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-semibold">{h.quantity}</td>
                              <td className="py-3.5 px-4 text-right">{formatCurrency(h.averagePrice)}</td>
                              <td className="py-3.5 px-4 text-right font-bold text-ink dark:text-ink">{formatCurrency(h.currentPrice)}</td>
                              <td className="py-3.5 px-4 text-right font-semibold">{formatCurrency(h.currentValue)}</td>
                              <td className={`py-3.5 px-4 text-right font-bold ${
                                isProfit ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                              }`}>
                                {isProfit ? '+' : ''}{formatCurrency(h.totalPnl)} ({h.totalPnlPercent.toFixed(2)}%)
                              </td>
                              <td className={`py-3.5 px-4 text-right ${
                                h.dayPnl >= 0 ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                              }`}>
                                {h.dayPnl >= 0 ? '+' : ''}{formatCurrency(h.dayPnl)} ({h.dayPnlPercent.toFixed(2)}%)
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => handleTradeInstrument(h.symbol)}
                                  className="px-2.5 py-1 text-xs rounded-lg bg-surface-2 hover:bg-surface-2 text-brand dark:bg-brand-fill dark:text-brand font-bold transition-colors cursor-pointer"
                                >
                                  Trade
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: OPEN ORDERS */}
          {activeTab === 'orders' && (
            <div>
              {filteredOrders.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface-2 dark:bg-surface-2 text-warn dark:text-warn flex items-center justify-center mx-auto">
                    <ListOrdered className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-ink dark:text-ink">No Open Orders</h3>
                  <p className="text-xs text-ink-2 dark:text-ink-3 max-w-sm mx-auto">
                    Pending limit or stop-loss orders will appear here until triggered or executed.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-2 dark:bg-surface text-ink-2 border-b border-line dark:border-line font-semibold uppercase text-ink tracking-wider font-mono">
                      <tr>
                        <th className="py-3 px-4">Time</th>
                        <th className="py-3 px-4">Instrument</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Side</th>
                        <th className="py-3 px-4 text-right">Quantity</th>
                        <th className="py-3 px-4 text-right">Price</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line dark:divide-line font-mono">
                      {filteredOrders.map(ord => (
                        <tr key={ord.id} className="hover:bg-surface-2 dark:hover:bg-surface-2 transition-colors">
                          <td className="py-3.5 px-4 text-ink-3">{ord.placedAt}</td>
                          <td className="py-3.5 px-4 font-bold text-ink dark:text-ink font-sans">{ord.symbol}</td>
                          <td className="py-3.5 px-4">{ord.product} • {ord.orderType}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-ink font-bold ${
                              ord.side === 'BUY'
                                ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos'
                                : 'bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg'
                            }`}>
                              {ord.side}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">{ord.quantity}</td>
                          <td className="py-3.5 px-4 text-right font-bold">{formatCurrency(ord.price)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-ink font-bold ${
                              ord.status === 'PENDING'
                                ? 'bg-surface-2 text-warn dark:bg-surface-2 dark:text-warn'
                                : ord.status === 'EXECUTED'
                                ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos'
                                : 'bg-surface-2 text-ink-2 dark:bg-surface-2 dark:text-ink-3'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {ord.status === 'PENDING' && (
                              <button
                                onClick={() => cancelOrder(ord.id)}
                                className="px-2.5 py-1 text-xs rounded bg-surface-2 dark:bg-surface-2 text-neg hover:bg-surface-2 cursor-pointer font-sans font-bold"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TRADE HISTORY LOG */}
          {activeTab === 'history' && (
            <div>
              {filteredHistory.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-surface-2 dark:bg-surface-2 text-ink-2 flex items-center justify-center mx-auto">
                    <History className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-ink dark:text-ink">No Executed Trades</h3>
                  <p className="text-xs text-ink-2 dark:text-ink-3 max-w-sm mx-auto">
                    Completed trades executed in this trading session will be recorded here.
                  </p>
                </div>
              ) : (
                <>
                  {/* Mobile Trade Cards (< md) */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {filteredHistory.map(t => (
                      <div
                        key={t.id}
                        className="p-4 rounded-2xl bg-surface-2 dark:bg-surface border border-line dark:border-line space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-ink dark:text-ink font-sans">{t.symbol}</span>
                            <span className={`px-1.5 py-0.2 rounded text-ink font-bold ${
                              t.side === 'BUY'
                                ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos'
                                : 'bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg'
                            }`}>
                              {t.side} • {t.product}
                            </span>
                          </div>
                          <span className="text-ink-3 font-mono">{t.executedAt || t.placedAt}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-surface dark:bg-surface border border-line dark:border-line text-xs font-mono">
                          <div>
                            <span className="text-ink-3 uppercase">Qty</span>
                            <p className="font-bold text-ink dark:text-ink-3">{t.filledQuantity || t.quantity}</p>
                          </div>
                          <div>
                            <span className="text-ink-3 uppercase">Price</span>
                            <p className="font-bold text-ink dark:text-ink-3">{formatCurrency(t.price)}</p>
                          </div>
                          <div>
                            <span className="text-ink-3 uppercase">Turnover</span>
                            <p className="font-bold text-ink dark:text-ink">{formatCurrency((t.filledQuantity || t.quantity) * t.price)}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-ink-2 dark:text-ink-3 font-medium">Trade P&L Result:</span>
                          {t.pnl !== undefined ? (
                            <span className={`font-mono font-black text-sm ${
                              t.pnl >= 0 ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
                            }`}>
                              {t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl)}
                            </span>
                          ) : (
                            <span className="text-ink-3 font-mono text-ink">Position Opened</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table (>= md) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-2 dark:bg-surface text-ink-2 border-b border-line dark:border-line font-semibold uppercase text-ink tracking-wider font-mono">
                        <tr>
                          <th className="py-3 px-4">Execution Time</th>
                          <th className="py-3 px-4">Instrument</th>
                          <th className="py-3 px-4">Side</th>
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-4 text-right">Quantity</th>
                          <th className="py-3 px-4 text-right">Executed Price</th>
                          <th className="py-3 px-4 text-right">Total Turnover</th>
                          <th className="py-3 px-4 text-right">Realized P&L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line dark:divide-line font-mono">
                        {filteredHistory.map(t => (
                          <tr key={t.id} className="hover:bg-surface-2 dark:hover:bg-surface-2 transition-colors">
                            <td className="py-3.5 px-4 text-ink-3">{t.executedAt || t.placedAt}</td>
                            <td className="py-3.5 px-4 font-bold text-ink dark:text-ink font-sans">{t.symbol}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-ink font-bold ${
                                t.side === 'BUY'
                                  ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos'
                                  : 'bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg'
                              }`}>
                                {t.side}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">{t.product}</td>
                            <td className="py-3.5 px-4 text-right">{t.filledQuantity || t.quantity}</td>
                            <td className="py-3.5 px-4 text-right font-bold">{formatCurrency(t.price)}</td>
                            <td className="py-3.5 px-4 text-right font-semibold">
                              {formatCurrency((t.filledQuantity || t.quantity) * t.price)}
                            </td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold">
                              {t.pnl !== undefined ? (
                                <span className={t.pnl >= 0 ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'}>
                                  {t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl)}
                                </span>
                              ) : (
                                <span className="text-ink-3 text-ink font-sans font-normal">Entry / Placed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
