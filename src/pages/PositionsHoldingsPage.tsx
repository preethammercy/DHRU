// DHRU.AI - Dedicated Positions & Portfolio Holdings Desk
// High-dimension FinTech dashboard for monitoring active intraday positions, delivery holdings,
// order status, execution logs, and live tick-by-tick P&L.
// Fully mobile-compact with responsive card layouts and desktop data tables.

import React, { useState, useMemo } from 'react';
import { useTrading, Position, Holding, Order } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';
import { useMarketStream } from '../context/MarketStreamContext';
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
    if (isCrypto) {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
    }
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0D1527] border border-slate-200/80 dark:border-[#1A2744] shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400">
              <Briefcase className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Positions & Portfolio Holdings
                </h1>
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Live Feeds
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time mark-to-market valuation, live tick P&L, exposure management, and trade execution desk.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => onNavigate?.('terminal')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs shadow-blue-500/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Open Terminal</span>
          </button>
        </div>
      </div>

      {/* 2. Institutional KPI Matrix (4 High-Impact Metric Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Total Portfolio Value */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Portfolio Net Equity</span>
            <PieChart className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
              {formatCurrency(totalCurrentValue + cashBalance + totalUnrealizedPnl)}
            </span>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
              Cash: <strong>{formatCurrency(cashBalance)}</strong> {totalCurrentValue > 0 ? `• Holdings: ${formatCurrency(totalCurrentValue)}` : ''}
            </div>
          </div>
        </div>

        {/* Card 2: Net Unrealized P&L */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Open P&L (MTM)</span>
            {totalUnrealizedPnl >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div className="mt-2">
            <span className={`text-lg sm:text-2xl font-black font-mono ${
              totalUnrealizedPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {totalUnrealizedPnl >= 0 ? '+' : ''}{formatCurrency(totalUnrealizedPnl)}
            </span>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              {positions.length} Open Positions Active
            </div>
          </div>
        </div>

        {/* Card 3: Today's Day P&L */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Today's Total P&L</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className={`text-lg sm:text-2xl font-black font-mono ${
              totalDayPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {totalDayPnl >= 0 ? '+' : ''}{formatCurrency(totalDayPnl)}
            </span>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center justify-between">
              <span>Realized:</span>
              <strong className={realizedPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                {realizedPnl >= 0 ? '+' : ''}{formatCurrency(realizedPnl)}
              </strong>
            </div>
          </div>
        </div>

        {/* Card 4: Margin Available */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span>Trading Margin</span>
            <Wallet className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <span className="text-lg sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
              {formatCurrency(marginAvailable)}
            </span>
            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
              Used: <strong>{formatCurrency(marginUsed)}</strong>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Desk Navigation Tabs & Search Controls */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-3xl overflow-hidden shadow-xs">
        
        {/* Tab Strip */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-slate-200 dark:border-[#1A2744] bg-slate-50/70 dark:bg-[#070B14]/70">
          
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('positions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'positions'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Positions</span>
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                activeTab === 'positions' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {positions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('holdings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'holdings'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Holdings (Portfolio)</span>
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                activeTab === 'holdings' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {holdings.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Open Orders</span>
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                activeTab === 'orders' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {pendingOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'history'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Trade Log</span>
              <span className={`px-1.5 py-0.2 rounded-full font-mono text-[10px] ${
                activeTab === 'history' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}>
                {tradeHistory.length}
              </span>
            </button>
          </div>

          {/* Search Input & Action Buttons */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter symbols..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-white dark:bg-[#070B14] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
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
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
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
            <div>
              {filteredPositions.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 flex items-center justify-center mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No Open Positions</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    You have no active intraday (MIS) trades running. Execute an order in the Live Terminal to start tracking real-time P&L.
                  </p>
                  <button
                    onClick={() => onNavigate?.('terminal')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Open Live Terminal
                  </button>
                </div>
              ) : (
                <>
                  {/* Mobile Cards (visible on phones < md) */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {filteredPositions.map(pos => {
                      const isProfit = pos.pnl >= 0;
                      return (
                        <div
                          key={pos.id}
                          className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#070B14] border border-slate-200/90 dark:border-slate-800 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                  {pos.symbol}
                                </span>
                                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  pos.side === 'BUY'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                                }`}>
                                  {pos.product} • {pos.side}
                                </span>
                              </div>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {pos.name}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className={`text-base font-black font-mono ${
                                isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isProfit ? '+' : ''}{formatCurrency(pos.pnl)}
                              </span>
                              <div className={`text-[10px] font-mono font-bold ${
                                isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isProfit ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200/70 dark:border-slate-800/70 text-xs font-mono">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase">Qty</span>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{pos.quantity}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase">Avg</span>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(pos.averagePrice)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase">LTP</span>
                              <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(pos.currentPrice)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => squareOffPosition(pos.id)}
                              className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 cursor-pointer text-center transition-colors"
                            >
                              Exit Position
                            </button>
                            <button
                              onClick={() => handleTradeInstrument(pos.symbol, 'BUY')}
                              className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 cursor-pointer transition-colors"
                            >
                              Trade
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Table (hidden on mobile) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-[#070B14] text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[10px] tracking-wider font-mono">
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
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                        {filteredPositions.map(pos => {
                          const isProfit = pos.pnl >= 0;
                          return (
                            <tr key={pos.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-sans">
                                <div className="flex items-center gap-2">
                                  <span>{pos.symbol}</span>
                                  <button
                                    onClick={() => handleTradeInstrument(pos.symbol)}
                                    className="p-1 text-slate-400 hover:text-blue-600"
                                    title="Open in Terminal"
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="block text-[11px] font-normal text-slate-400 font-mono">{pos.name}</span>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  pos.side === 'BUY'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                                }`}>
                                  {pos.product} • {pos.side}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-semibold text-slate-800 dark:text-slate-200">
                                {pos.quantity}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                {formatCurrency(pos.averagePrice)}
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                                {formatCurrency(pos.currentPrice)}
                              </td>
                              <td className={`py-3.5 px-4 text-right font-bold ${
                                isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isProfit ? '+' : ''}{formatCurrency(pos.pnl)}
                              </td>
                              <td className={`py-3.5 px-4 text-right font-semibold ${
                                isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isProfit ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => squareOffPosition(pos.id)}
                                  className="px-3 py-1 text-xs rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 cursor-pointer font-sans font-bold transition-colors"
                                >
                                  Square Off
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

          {/* TAB 2: HOLDINGS (PORTFOLIO) */}
          {activeTab === 'holdings' && (
            <div>
              {filteredHoldings.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No Holdings Found</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
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
                          className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#070B14] border border-slate-200/90 dark:border-slate-800 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                                {h.symbol}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate block">
                                {h.name}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className={`text-base font-black font-mono ${
                                isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isProfit ? '+' : ''}{formatCurrency(h.totalPnl)}
                              </span>
                              <div className={`text-[10px] font-mono font-bold ${
                                isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isProfit ? '+' : ''}{h.totalPnlPercent.toFixed(2)}%
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200/70 dark:border-slate-800/70 text-xs font-mono">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase">Qty</span>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{h.quantity}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase">Avg Cost</span>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(h.averagePrice)}</p>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase">LTP</span>
                              <p className="font-bold text-slate-900 dark:text-white">{formatCurrency(h.currentPrice)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              onClick={() => handleTradeInstrument(h.symbol, 'BUY')}
                              className="flex-1 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-cyan-400 border border-blue-200 dark:border-blue-800/60 cursor-pointer text-center transition-colors"
                            >
                              Buy More
                            </button>
                            <button
                              onClick={() => handleTradeInstrument(h.symbol, 'SELL')}
                              className="flex-1 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 cursor-pointer text-center transition-colors"
                            >
                              Sell
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop Holdings Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-[#070B14] text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[10px] tracking-wider font-mono">
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
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                        {filteredHoldings.map(h => {
                          const isProfit = h.totalPnl >= 0;
                          return (
                            <tr key={h.symbol} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-sans">
                                <span>{h.symbol}</span>
                                <span className="block text-[11px] font-normal text-slate-400 font-mono">{h.name}</span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-semibold">{h.quantity}</td>
                              <td className="py-3.5 px-4 text-right">{formatCurrency(h.averagePrice)}</td>
                              <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(h.currentPrice)}</td>
                              <td className="py-3.5 px-4 text-right font-semibold">{formatCurrency(h.currentValue)}</td>
                              <td className={`py-3.5 px-4 text-right font-bold ${
                                isProfit ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {isProfit ? '+' : ''}{formatCurrency(h.totalPnl)} ({h.totalPnlPercent.toFixed(2)}%)
                              </td>
                              <td className={`py-3.5 px-4 text-right ${
                                h.dayPnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                              }`}>
                                {h.dayPnl >= 0 ? '+' : ''}{formatCurrency(h.dayPnl)} ({h.dayPnlPercent.toFixed(2)}%)
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <button
                                  onClick={() => handleTradeInstrument(h.symbol)}
                                  className="px-2.5 py-1 text-xs rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-cyan-300 font-bold transition-colors cursor-pointer"
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
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                    <ListOrdered className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No Open Orders</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Pending limit or stop-loss orders will appear here until triggered or executed.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-[#070B14] text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[10px] tracking-wider font-mono">
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
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                      {filteredOrders.map(ord => (
                        <tr key={ord.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 text-slate-400">{ord.placedAt}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-sans">{ord.symbol}</td>
                          <td className="py-3.5 px-4">{ord.product} • {ord.orderType}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.side === 'BUY'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                            }`}>
                              {ord.side}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">{ord.quantity}</td>
                          <td className="py-3.5 px-4 text-right font-bold">{formatCurrency(ord.price)}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.status === 'PENDING'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                : ord.status === 'EXECUTED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {ord.status === 'PENDING' && (
                              <button
                                onClick={() => cancelOrder(ord.id)}
                                className="px-2.5 py-1 text-xs rounded bg-slate-100 dark:bg-slate-800 text-rose-600 hover:bg-rose-50 cursor-pointer font-sans font-bold"
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
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                    <History className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">No Executed Trades</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
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
                        className="p-4 rounded-2xl bg-slate-50/80 dark:bg-[#070B14] border border-slate-200/90 dark:border-slate-800 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white font-sans">{t.symbol}</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              t.side === 'BUY'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                            }`}>
                              {t.side} • {t.product}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">{t.executedAt || t.placedAt}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 py-2 px-3 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200/70 dark:border-slate-800/70 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase">Qty</span>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{t.filledQuantity || t.quantity}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase">Price</span>
                            <p className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(t.price)}</p>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase">Turnover</span>
                            <p className="font-bold text-slate-900 dark:text-white">{formatCurrency((t.filledQuantity || t.quantity) * t.price)}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="text-slate-500 dark:text-slate-400 font-medium">Trade P&L Result:</span>
                          {t.pnl !== undefined ? (
                            <span className={`font-mono font-black text-sm ${
                              t.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                            }`}>
                              {t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl)}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-[11px]">Position Opened</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table (>= md) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-[#070B14] text-slate-500 border-b border-slate-200 dark:border-slate-800 font-semibold uppercase text-[10px] tracking-wider font-mono">
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
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                        {filteredHistory.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 text-slate-400">{t.executedAt || t.placedAt}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white font-sans">{t.symbol}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.side === 'BUY'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
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
                                <span className={t.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                  {t.pnl >= 0 ? '+' : ''}{formatCurrency(t.pnl)}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] font-sans font-normal">Entry / Placed</span>
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
