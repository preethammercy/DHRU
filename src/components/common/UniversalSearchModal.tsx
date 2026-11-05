// DHRU.AI - Full-Market Universal Search Modal
// Real-time instant search across 2,600+ equities, indices, commodities, ETFs, and sectors.

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, TrendingUp, Building2, Coins, Compass, ArrowRight, Sparkles } from 'lucide-react';
import { searchMarket } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { duration, ease } from '../../design/motion';

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
  const reduceMotion = useReducedMotion();
  const isMobileViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const sheetRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setActiveFilter(marketMode === 'crypto' ? 'Crypto' : 'All');
      const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 50);
      return () => window.clearTimeout(focusTimer);
    } else if (returnFocusRef.current) {
      returnFocusRef.current.focus();
      returnFocusRef.current = null;
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
          resList = resList.filter((r: any) => r.type === 'Crypto' || r.symbol.endsWith('-USD'));
        } else {
          resList = resList.filter((r: any) => r.symbol.endsWith('.NS') || r.symbol.endsWith('.BO') || /^\^(NSE|BSE|CNX)/.test(r.symbol));
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

  const filteredResults = activeFilter === 'All'
    ? results
    : results.filter(r => r.type === activeFilter);

  const popularSearches = marketMode === 'crypto'
    ? [
        { label: 'Bitcoin (BTC)', sym: 'BTC-USD' },
        { label: 'Ethereum (ETH)', sym: 'ETH-USD' },
        { label: 'Solana (SOL)', sym: 'SOL-USD' },
        { label: 'BNB', sym: 'BNB-USD' },
        { label: 'XRP', sym: 'XRP-USD' },
        { label: 'Dogecoin (DOGE)', sym: 'DOGE-USD' },
      ]
    : [
        { label: 'Reliance Industries', sym: 'RELIANCE.NS' },
        { label: 'NIFTY 50', sym: '^NSEI' },
        { label: 'HDFC Bank', sym: 'HDFCBANK.NS' },
        { label: 'Tata Consultancy Services', sym: 'TCS.NS' },
        { label: 'Infosys Ltd', sym: 'INFY.NS' },
        { label: 'NIFTY Bank', sym: '^NSEBANK' },
      ];

  if (typeof document === 'undefined') return null;

  const modalContent = (
    <AnimatePresence initial={false}>
    {isOpen && <motion.div
      key="universal-search-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? duration.fast : duration.base, ease: ease.out }}
      className="quiet-overlay fixed inset-0 z-[99999] flex items-start justify-center pt-16 sm:pt-24 px-4 bg-surface-2  animate-fade-in"
      style={{ zIndex: 99999 }}
    >
      <motion.div
        ref={sheetRef}
        initial={{ opacity: 0, y: reduceMotion ? 0 : isMobileViewport ? 24 : 0, scale: reduceMotion || isMobileViewport ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduceMotion ? 0 : isMobileViewport ? 16 : 0, scale: reduceMotion || isMobileViewport ? 1 : 0.98 }}
        transition={{ duration: reduceMotion ? duration.fast : isMobileViewport ? duration.panel : duration.base, ease: ease.out }}
        drag={isMobileViewport && !reduceMotion ? 'y' : false}
        dragConstraints={{ top: 0, bottom: typeof window === 'undefined' ? 800 : window.innerHeight }}
        dragElastic={0}
        dragMomentum={false}
        dragTransition={{ power: 0, timeConstant: 120, bounceStiffness: 1000, bounceDamping: 100 }}
        onDragEnd={(_, info) => {
          const sheetHeight = sheetRef.current?.getBoundingClientRect().height ?? 0;
          if (info.offset.y > sheetHeight * 0.4 || info.velocity.y > 800) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Universal Search"
        className="quiet-sheet w-full max-w-2xl bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl  overflow-hidden flex flex-col max-h-[80vh] relative z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-line dark:border-line flex items-center gap-3 bg-surface-2 dark:bg-surface">
          <Search className="w-5 h-5 text-brand dark:text-brand shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search company (e.g. Reliance, TCS), symbol, index, sector..."
            className="w-full bg-transparent text-sm text-ink dark:text-ink-3 placeholder-slate-400 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-ink-3 hover:text-ink-2 dark:hover:text-ink-3"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs font-mono text-ink-2 px-2 py-1 bg-surface dark:bg-surface-2 rounded border border-line dark:border-line hover:text-ink"
          >
            ESC
          </button>
        </div>

        {/* Filters Strip */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-line dark:border-line bg-surface dark:bg-surface text-xs overflow-x-auto scrollbar-none">
          {(['All', 'Stock', 'Index', 'Crypto', 'Forex', 'Commodity', 'ETF'] as const).map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-3 py-1 rounded-xl transition-all whitespace-nowrap ${
                activeFilter === f
                  ? 'bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand font-bold border border-line dark:border-line'
                  : 'text-ink-2 dark:text-ink-3 hover:text-ink hover:bg-surface-2 dark:hover:bg-surface-2'
              }`}
            >
              {f === 'Stock' ? 'Stocks' : f}
            </button>
          ))}
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto flex-1 p-3 space-y-1 divide-y divide-line dark:divide-line">
          {loading && (
            <div className="py-8 text-center text-xs text-ink-2 flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-line border-t-transparent rounded-full animate-spin" />
              Searching official NSE universe...
            </div>
          )}

          {!loading && query && filteredResults.length === 0 && (
            <div className="py-10 text-center text-ink-2 text-xs">
              No matching instruments found for "<span className="text-ink font-bold">{query}</span>".
              <p className="mt-1 text-ink-3">Try searching by official NSE ticker (e.g. INFY, SBIN, MARUTI) or corporate name.</p>
            </div>
          )}

          {!query && (
            <div className="p-4 space-y-3">
              <div className="text-xs font-bold text-ink-2 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
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
                    className="flex items-center justify-between p-2.5 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line hover:border-line hover:bg-surface-2 text-left transition-all group hover:scale-[1.02]"
                  >
                    <div>
                      <div className="text-xs font-bold text-ink dark:text-ink-3 group-hover:text-brand">
                        {ps.label}
                      </div>
                      <div className="text-ink font-mono text-ink-2">{ps.sym}</div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-ink-3 group-hover:text-brand group-hover:translate-x-0.5 transition-transform" />
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
              className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-2 dark:hover:bg-surface cursor-pointer transition-all group hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line flex items-center justify-center shrink-0">
                  {item.type === 'Index' ? (
                    <TrendingUp className="w-4 h-4 text-brand dark:text-brand" />
                  ) : item.type === 'Crypto' ? (
                    <span className="text-sm">🪙</span>
                  ) : item.type === 'Forex' ? (
                    <span className="text-sm">💱</span>
                  ) : item.type === 'Commodity' ? (
                    <Coins className="w-4 h-4 text-warn" />
                  ) : item.type === 'ETF' ? (
                    <Compass className="w-4 h-4 text-ai" />
                  ) : (
                    <Building2 className="w-4 h-4 text-brand" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink dark:text-ink-3 group-hover:text-brand transition-colors">
                      {item.name}
                    </span>
                    <span className="text-ink font-mono px-1.5 py-0.5 rounded bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3 border border-line dark:border-line font-semibold">
                      {item.symbol}
                    </span>
                  </div>
                  <div className="text-xs text-ink-2 flex items-center gap-2 mt-0.5">
                    <span>{item.exchange || 'NSE'}</span>
                    {item.sector && <span>• {item.sector}</span>}
                    {item.cap && <span className="text-ink-3">• {item.cap}</span>}
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
                    className="px-2.5 py-1 rounded-lg bg-brand-fill hover:bg-brand-fill-hover text-on-brand text-xs font-bold  transition-all flex items-center gap-1 cursor-pointer"
                    title="Trade directly in Live Terminal"
                  >
                    <span>⚡ Trade</span>
                  </button>
                )}
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand border border-line dark:border-line">
                  Analyze
                </span>
                <ArrowRight className="w-4 h-4 text-ink-3 group-hover:text-brand group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-surface-2 dark:bg-surface border-t border-line dark:border-line flex items-center justify-between text-ink-2 font-medium">
          <span>Search backed by official NSE Equity Master file (2,606+ tickers)</span>
          <span>Click to open full analytics</span>
        </div>
      </motion.div>
    </motion.div>}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};
