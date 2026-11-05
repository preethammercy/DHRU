// DHRU.AI - Full Stock Screener & Official Directory
// Full universe of 2,600+ NSE equities loaded from official exchange master records.
// White & Blue Fintrix fintech styling with zoom animations.

import React, { useEffect, useState } from 'react';
import { getStocks } from '../services/api';
import { QuoteFreshness } from '../components/market/QuoteFreshness';
import { useMarketStream } from '../context/MarketStreamContext';
import { useWatchlist } from '../context/WatchlistContext';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Bookmark, ArrowRight, ChevronLeft, ChevronRight, Layers } from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
  onTradeStock?: (symbol: string) => void;
}

export const StocksPage: React.FC<Props> = ({ onSelectStock, onTradeStock }) => {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist();
  const { ticks, subscribeSymbol } = useMarketStream();

  const [stocks, setStocks] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedCap, setSelectedCap] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    stocks.forEach(stock => subscribeSymbol(stock.symbol));
  }, [stocks, subscribeSymbol]);

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
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-6  zoom-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-surface-2 dark:bg-brand-fill border border-line dark:border-line flex items-center justify-center">
              <Layers className="w-4 h-4 text-brand dark:text-brand" />
            </div>
            <h1 className="text-xl font-extrabold text-ink dark:text-ink">NSE Equity Universe & Screener</h1>
          </div>
          <p className="text-xs text-ink-2 dark:text-ink-3 mt-1">
            Searchable directory of {total.toLocaleString('en-IN')} listed Indian companies from official exchange master data
          </p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-ink-3 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search company or ticker (e.g. Reliance, TCS)..."
            className="w-full pl-9 pr-3 py-2 bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl text-xs text-ink dark:text-ink-3 placeholder-slate-400 focus:outline-none focus:border-line"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 bg-surface dark:bg-surface border border-line dark:border-line p-3 rounded-2xl text-xs ">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-brand dark:text-brand" />
          <span className="font-semibold text-ink-2 dark:text-ink-3">Filters:</span>
        </div>

        {/* Sector Filter Dropdown */}
        <select
          value={selectedSector}
          onChange={e => setSelectedSector(e.target.value)}
          className="bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl px-3 py-1.5 text-xs text-ink-2 dark:text-ink-3 focus:outline-none focus:border-line cursor-pointer"
        >
          {sectors.map(s => (
            <option key={s} value={s}>{s === 'All' ? 'All Sectors' : s}</option>
          ))}
        </select>

        {/* Cap Filter Dropdown */}
        <select
          value={selectedCap}
          onChange={e => setSelectedCap(e.target.value)}
          className="bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl px-3 py-1.5 text-xs text-ink-2 dark:text-ink-3 focus:outline-none focus:border-line cursor-pointer"
        >
          <option value="All">All Market Caps</option>
          <option value="Large Cap">Large Cap</option>
          <option value="Mid Cap">Mid Cap</option>
          <option value="Small Cap">Small Cap</option>
        </select>

        <span className="ml-auto text-ink font-mono text-ink-2">
          Showing {stocks.length} of {total} stocks
        </span>
      </div>

      {/* Stocks Table & Mobile Cards */}
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl  overflow-hidden">
        
        {/* Mobile Compact 2-Col Card Grid (< md) */}
        <div className="md:hidden mobile-compact-grid p-2.5">
          {loading ? (
            <div className="col-span-2 p-8 text-center text-ink-2">
              <div className="w-6 h-6 border-2 border-line dark:border-line border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading verified market prices...
            </div>
          ) : stocks.length === 0 ? (
            <div className="col-span-2 p-8 text-center text-ink-2">
              No listed companies found.
            </div>
          ) : (
            stocks.map(s => {
              const tick = ticks[s.symbol];
              const price = tick?.price ?? s.price;
              const changePercent = tick?.changePercent ?? s.changePercent;
              const isUp = Number(changePercent) >= 0;
              return (
                <div
                  key={s.symbol}
                  onClick={() => onSelectStock(s.symbol)}
                  className="stat-box mobile-stat-card pressable card-3d cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="stat-title truncate max-w-[85px]">
                      {s.name}
                    </span>
                    <span className="text-ink font-mono font-bold text-ink-3">
                      {s.ticker}
                    </span>
                  </div>
                  <QuoteFreshness status={tick?.status || s.status} source={tick?.source || s.source} lastUpdated={tick?.lastUpdated || s.lastUpdated} timestamp={tick?.timestamp || s.timestamp} />
                  <div className="my-1 text-base font-black font-mono tracking-tight text-ink dark:text-ink">
                    {price > 0 ? `₹${price}` : 'Unavailable'}
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-1 text-xs">
                    <span className={`stat-desc font-mono font-bold ${isUp ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'}`}>
                      {Number.isFinite(Number(changePercent)) ? `${isUp ? '+' : ''}${changePercent}%` : 'Unavailable'}
                    </span>
                    {onTradeStock && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onTradeStock(s.symbol);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-brand-fill text-on-brand text-ink font-bold active:scale-95 transition-all flex items-center gap-0.5 cursor-pointer"
                      >
                        ⚡ Trade
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop / Tablet Full Table (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-2 dark:bg-surface border-b border-line dark:border-line text-ink font-semibold text-ink-2 dark:text-ink-3 uppercase tracking-wider">
                <th className="p-4">Instrument / Company</th>
                <th className="p-4">Sector</th>
                <th className="p-4">Market Cap</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-right">24h Change</th>
                <th className="p-4 text-right">Day Range</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-line text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-ink-2">
                    <div className="w-6 h-6 border-2 border-line dark:border-line border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    Fetching verified public market prices...
                  </td>
                </tr>
              ) : stocks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-ink-2">
                    No listed companies matched your criteria.
                  </td>
                </tr>
              ) : (
                stocks.map(s => {
                  const tick = ticks[s.symbol];
                  const price = tick?.price ?? s.price;
                  const changePercent = tick?.changePercent ?? s.changePercent;
                  const isUp = Number(changePercent) >= 0;
                  const inWatch = isInWatchlist(s.symbol);
                  return (
                    <tr
                      key={s.symbol}
                      className="hover:bg-surface-2 dark:hover:bg-surface transition-colors cursor-pointer group"
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
                                ? 'bg-surface-2 text-brand border-line dark:bg-brand-fill dark:text-brand dark:border-line'
                                : 'bg-surface-2 text-ink-3 border-line hover:text-ink'
                            }`}
                            title={inWatch ? 'Remove from Watchlist' : 'Add to Watchlist'}
                          >
                            <Bookmark className="w-3.5 h-3.5" />
                          </button>
                          <div>
                            <div className="font-bold text-ink dark:text-ink-3 group-hover:text-brand dark:group-hover:text-brand transition-colors">
                              {s.name}
                            </div>
                            <div className="text-ink font-mono text-ink-3 mt-0.5">
                              {s.ticker} • {s.exchange} • {s.isin || 'INE'}
                            </div>
                            <QuoteFreshness status={tick?.status || s.status} source={tick?.source || s.source} lastUpdated={tick?.lastUpdated || s.lastUpdated} timestamp={tick?.timestamp || s.timestamp} />
                          </div>
                        </div>
                      </td>

                      {/* Sector */}
                      <td className="p-4 text-ink-2 dark:text-ink-3">
                        <span className="px-2 py-0.5 rounded-md bg-surface-2 dark:bg-surface border border-line dark:border-line text-ink">
                          {s.sector || 'General'}
                        </span>
                      </td>

                      {/* Market Cap */}
                      <td className="p-4 text-ink-2 dark:text-ink-3 font-mono text-ink">
                        {s.cap || 'Listed'}
                      </td>

                      {/* Price */}
                      <td className="p-4 text-right font-mono font-bold text-ink dark:text-ink text-sm">
                        {price > 0 ? `₹${price}` : 'Unavailable'}
                      </td>

                      {/* Change */}
                      <td className="p-4 text-right font-mono font-semibold">
                        {price > 0 && Number.isFinite(Number(changePercent)) ? (
                          <span className={`inline-flex items-center ${isUp ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'}`}>
                            {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                            {isUp ? `+${changePercent}%` : `${changePercent}%`}
                          </span>
                        ) : '—'}
                      </td>

                      {/* Day Range */}
                      <td className="p-4 text-right font-mono text-ink-2 dark:text-ink-3">
                        {tick?.dayLow > 0 && tick?.dayHigh > 0 ? `₹${tick.dayLow} — ₹${tick.dayHigh}` : s.dayLow > 0 && s.dayHigh > 0 ? `₹${s.dayLow} — ₹${s.dayHigh}` : '—'}
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
                              className="px-2.5 py-1 rounded-lg bg-brand-fill hover:bg-brand-fill-hover text-on-brand text-xs font-bold  inline-flex items-center gap-1 transition-all cursor-pointer"
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
                            className="px-2.5 py-1 rounded-lg bg-surface-2 hover:bg-surface-2 dark:bg-brand-fill dark:hover:bg-brand-fill text-brand dark:text-brand border border-line dark:border-line text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer"
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
        <div className="p-4 bg-surface-2 dark:bg-surface border-t border-line dark:border-line flex items-center justify-between text-xs">
          <span className="text-ink-2 font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchStockList(Math.max(1, page - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg bg-surface dark:bg-surface border border-line dark:border-line text-ink-2 dark:text-ink-3 disabled:opacity-40 hover:bg-surface-2 dark:hover:bg-surface-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchStockList(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg bg-surface dark:bg-surface border border-line dark:border-line text-ink-2 dark:text-ink-3 disabled:opacity-40 hover:bg-surface-2 dark:hover:bg-surface-2 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
