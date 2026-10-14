// DHRU.AI - Full-Market Universal Search Modal
// Real-time instant search across 2,600+ equities, indices, commodities, ETFs, and sectors.

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Building2, Coins, Compass, ArrowRight, Sparkles } from 'lucide-react';
import { searchMarket } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectInstrument: (symbol: string, type?: string) => void;
  onTradeInstrument?: (symbol: string) => void;
}

export const UniversalSearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectInstrument,
  onTradeInstrument,
}) => {
  const { marketMode } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveFilter(marketMode === 'crypto' ? 'Crypto' : 'All');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, marketMode]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchMarket(query.trim(), 25);
        let resList = data.results || [];
        if (marketMode === 'crypto') {
          resList = resList.filter((r: any) => r.type === 'Crypto' || r.symbol.includes('USD'));
        } else {
          resList = resList.filter((r: any) => r.type !== 'Crypto' && !r.symbol.includes('-USD'));
        }
        setResults(resList);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query, marketMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredResults = activeFilter === 'All'
    ? results
    : results.filter(r => r.type === activeFilter);

  const popularSearches = marketMode === 'crypto'
    ? [
        { label: 'Bitcoin (BTC)', sym: 'BTC-USD' },
        { label: 'Apple Inc', sym: 'AAPL' },
        { label: 'Netflix Inc', sym: 'NFLX' },
        { label: 'NVIDIA Corp', sym: 'NVDA' },
        { label: 'Ethereum (ETH)', sym: 'ETH-USD' },
        { label: 'Tesla Inc', sym: 'TSLA' },
      ]
    : [
        { label: 'Reliance Industries', sym: 'RELIANCE.NS' },
        { label: 'NIFTY 50', sym: '^NSEI' },
        { label: 'HDFC Bank', sym: 'HDFCBANK.NS' },
        { label: 'Tata Consultancy Services', sym: 'TCS.NS' },
        { label: 'Infosys Ltd', sym: 'INFY.NS' },
        { label: 'Gold (MCX Proxy)', sym: 'GC=F' },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-[#1A2744] flex items-center gap-3 bg-slate-50/70 dark:bg-[#070B14]">
          <Search className="w-5 h-5 text-blue-600 dark:text-cyan-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search company (e.g. Reliance, TCS), symbol, index, sector..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-mono text-slate-500 px-2 py-1 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 hover:text-slate-900"
          >
            ESC
          </button>
        </div>

        {/* Filters Strip */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-200 dark:border-[#1A2744] bg-white dark:bg-[#0A101D] text-xs overflow-x-auto scrollbar-none">
          {(['All', 'Stock', 'Index', 'Crypto', 'Forex', 'Commodity', 'ETF'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-xl transition-all whitespace-nowrap ${
                activeFilter === f
                  ? 'bg-blue-50 dark:bg-cyan-500/20 text-blue-700 dark:text-cyan-400 font-bold border border-blue-200 dark:border-cyan-500/30'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/40'
              }`}
            >
              {f === 'Stock' ? 'Stocks' : f}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto flex-1 p-3 space-y-1 divide-y divide-slate-100 dark:divide-[#1A2744]/40">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Searching official NSE universe...
            </div>
          )}

          {!loading && query && filteredResults.length === 0 && (
            <div className="py-10 text-center text-slate-500 text-xs">
              No matching instruments found for "<span className="text-slate-900 font-bold">{query}</span>".
              <p className="mt-1 text-[11px] text-slate-400">Try searching by official NSE ticker (e.g. INFY, SBIN, MARUTI) or corporate name.</p>
            </div>
          )}

          {!query && (
            <div className="p-4 space-y-3">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Frequently Searched Instruments
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {popularSearches.map(ps => (
                  <button
                    key={ps.sym}
                    onClick={() => {
                      onSelectInstrument(ps.sym);
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 hover:bg-blue-50/50 text-left transition-all group hover:scale-[1.02]"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600">
                        {ps.label}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">{ps.sym}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results List */}
          {filteredResults.map((item, idx) => (
            <div
              key={`${item.symbol}_${idx}`}
              onClick={() => {
                onSelectInstrument(item.symbol, item.type);
                onClose();
              }}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/60 dark:hover:bg-[#131F38] cursor-pointer transition-all group hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] flex items-center justify-center shrink-0">
                  {item.type === 'Index' ? (
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  ) : item.type === 'Crypto' ? (
                    <span className="text-sm">🪙</span>
                  ) : item.type === 'Forex' ? (
                    <span className="text-sm">💱</span>
                  ) : item.type === 'Commodity' ? (
                    <Coins className="w-4 h-4 text-amber-500" />
                  ) : item.type === 'ETF' ? (
                    <Compass className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Building2 className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold">
                      {item.symbol}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>{item.exchange || 'NSE'}</span>
                    {item.sector && <span>• {item.sector}</span>}
                    {item.cap && <span className="text-slate-400">• {item.cap}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onTradeInstrument && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onTradeInstrument(item.symbol);
                      onClose();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                    title="Trade directly in Live Terminal"
                  >
                    <span>⚡ Trade</span>
                  </button>
                )}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/20">
                  Analyze
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-[#070B14] border-t border-slate-200 dark:border-[#1A2744] flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>Search backed by official NSE Equity Master file (2,606+ tickers)</span>
          <span>Click to open full analytics</span>
        </div>
      </div>
    </div>
  );
};
