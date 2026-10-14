// DHRU.AI - Full Stock Screener & Official Directory
// Full universe of 2,600+ NSE equities loaded from official exchange master records.
// White & Blue Fintrix fintech styling with zoom animations.

import React, { useEffect, useState } from 'react';
import { getStocks } from '../services/api';
import { useWatchlist } from '../context/WatchlistContext';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Bookmark, ArrowRight, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
  onTradeStock?: (symbol: string) => void;
}

export const StocksPage: React.FC<Props> = ({ onSelectStock, onTradeStock }) => {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();

  const [stocks, setStocks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedCap, setSelectedCap] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchStockList = async (p = 1) => {
    setLoading(true);
    try {
      const data = await getStocks({
        q: search,
        sector: selectedSector,
        cap: selectedCap,
        page: p,
        limit: 20
      });
      setStocks(data.stocks || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockList(1);
  }, [selectedSector, selectedCap]);

  // Handle search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStockList(1);
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const sectors = [
    'All',
    'Information Technology',
    'Banking & Financials',
    'Automobiles & EV',
    'Energy & Petrochemicals',
    'Metals & Mining',
    'Healthcare & Pharma',
    'FMCG & Consumer',
    'Real Estate',
    'Infrastructure & Capital Goods',
    'Chemicals & Materials',
    'Telecommunications',
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card zoom-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">NSE Equity Universe & Screener</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Searchable directory of {total.toLocaleString('en-IN')} listed Indian companies from official exchange master data
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company or ticker (e.g. Reliance, TCS)..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] p-3 rounded-2xl text-xs shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Filters:</span>
        </div>

        {/* Sector Filter Dropdown */}
        <select
          value={selectedSector}
          onChange={e => setSelectedSector(e.target.value)}
          className="bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          {sectors.map(s => (
            <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>
          ))}
        </select>

        {/* Cap Filter Dropdown */}
        <select
          value={selectedCap}
          onChange={e => setSelectedCap(e.target.value)}
          className="bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] rounded-xl px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="All">All Market Caps</option>
          <option value="Large Cap">Large Cap</option>
          <option value="Mid Cap">Mid Cap</option>
          <option value="Small Cap">Small Cap</option>
        </select>

        <span className="ml-auto text-[11px] font-mono text-slate-500">
          Showing {stocks.length} of {total} stocks
        </span>
      </div>

      {/* Stocks Table */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#070B14] border-b border-slate-200 dark:border-[#1A2744] text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="p-4">Instrument / Company</th>
                <th className="p-4">Sector</th>
                <th className="p-4">Market Cap</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-right">24h Change</th>
                <th className="p-4 text-right">Day Range</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1A2744]/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    <div className="w-6 h-6 border-2 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching verified public market prices...
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-500">
                    No listed companies matched your criteria.
                  </td>
                </tr>
              ) : (
                stocks.map(s => {
                  const isUp = s.changePercent >= 0;
                  const inWatch = isInWatchlist(s.symbol);
                  return (
                    <tr
                      key={s.symbol}
                      className="hover:bg-slate-50 dark:hover:bg-[#131F38]/60 transition-colors cursor-pointer group"
                      onClick={() => onSelectStock(s.symbol)}
                    >
                      {/* Name & Ticker */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              inWatch ? removeFromWatchlist(s.symbol) : addToWatchlist({ symbol: s.symbol, name: s.name, type: 'Stock' });
                            }}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              inWatch
                                ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-cyan-500/20 dark:text-cyan-400 dark:border-cyan-500/30'
                                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-800'
                            }`}
                            title={inWatch ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                              {s.name}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              {s.ticker} • {s.exchange} • {s.isin || 'INE'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="p-4 text-slate-600 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] text-[11px]">
                          {s.sector || 'General'}
                        </span>
                      </td>

                      {/* Market Cap */}
                      <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {s.cap || 'Listed'}
                      </td>

                      {/* Price */}
                      <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                        {s.price > 0 ? `₹${s.price}` : 'N/A'}
                      </td>

                      {/* Change */}
                      <td className="p-4 text-right font-mono font-semibold">
                        {s.price > 0 ? (
                          <span className={`inline-flex items-center ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                            {isUp ? `+${s.changePercent}%` : `${s.changePercent}%`}
                          </span>
                        ) : '—'}
                      </td>

                      {/* Day Range */}
                      <td className="p-4 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {s.dayLow > 0 && s.dayHigh > 0 ? `₹${s.dayLow} — ₹${s.dayHigh}` : '—'}
                      </td>

                      {/* Action */}
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onTradeStock && (
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                onTradeStock(s.symbol);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm inline-flex items-center gap-1 transition-all cursor-pointer"
                              title="Trade in Live Terminal"
                            >
                              <span>⚡ Trade</span>
                            </button>
                          )}
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              onSelectStock(s.symbol);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/30 text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
                          >
                            Analyze <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 dark:bg-[#070B14] border-t border-slate-200 dark:border-[#1A2744] flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStockList(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchStockList(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] text-slate-700 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
