// DHRU.AI - Benchmark Indices & Crypto Markets Directory
// Strictly segregated:
// When in Indian Mode -> 100% Indian Indices (Nifty 50, Bank Nifty, Sensex, Sectorals in ₹)
// When in Crypto Mode -> 100% Crypto Markets (BTC, ETH, SOL, XRP, SUI, DOGE, ADA in $)
// White & Blue Fintrix fintech styling with zoom animations.

import React, { useEffect, useState } from 'react';
import { getAllIndices, getCryptoInstruments } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMarketStream } from '../context/MarketStreamContext';
import { QuoteFreshness } from '../components/market/QuoteFreshness';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Search, Coins } from 'lucide-react';

interface Props {
  onSelectIndex: (symbol: string) => void;
  onTradeIndex?: (symbol: string) => void;
}

const LiveAssetCard: React.FC<{
  item: any;
  isCrypto: boolean;
  onSelectIndex: (symbol: string) => void;
  onTradeIndex?: (symbol: string) => void;
}> = ({ item, isCrypto, onSelectIndex, onTradeIndex }) => {
  const { ticks } = useMarketStream();
  const tick = ticks[item.symbol];

  const price = tick?.price || item.price || 0;
  const changePercent = tick?.changePercent !== undefined ? tick.changePercent : (item.changePercent || 0);
  const isUp = changePercent >= 0;
  const flash = tick?.flash;

  const isForex = item.symbol.includes('=X') || item.symbol.includes('=F');
  const currency = isForex && item.symbol.includes('INR') ? '₹' : (isCrypto ? '$' : isForex ? '' : '₹');
  const maxDecimals = price < 0.001 ? 8 : (price < 2 ? 4 : (price < 100 ? 3 : 2));

  return (
    <div
      onClick={() => onSelectIndex(item.symbol)}
      className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-surface dark:bg-surface border cursor-pointer transition-all  card-3d zoom-card pressable group flex flex-col justify-between ${
        flash === 'up'
          ? 'flash-up border-line bg-surface-2'
          : flash === 'down'
          ? 'flash-down border-line bg-surface-2'
          : 'border-line dark:border-line hover:border-line dark:hover:border-line'
      }`}
    >
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-mono text-ink sm:text-ink px-1.5 sm:px-2 py-0.5 rounded bg-surface-2 text-brand dark:bg-surface dark:text-brand border border-line dark:border-line font-semibold truncate max-w-[100px] sm:max-w-none">
            {item.exchange || (isForex ? 'FOREX' : (isCrypto ? 'CRYPTO' : 'NSE'))} • {item.category}
          </span>
          <span className="text-ink sm:text-ink font-mono text-ink-3">{item.symbol}</span>
        </div>
        <h3 className="text-xs sm:text-sm font-bold text-ink dark:text-ink group-hover:text-brand dark:group-hover:text-brand transition-colors mt-1 sm:mt-2 truncate">
          {item.name}
        </h3>
        <p className="text-ink-2 dark:text-ink-3 mt-1 line-clamp-2 hidden sm:block">
          {item.description}
        </p>
      </div>

      <div className="pt-2 sm:pt-4 mt-2 sm:mt-3 border-t border-line dark:border-line flex items-center justify-between gap-1">
        <div className="text-sm sm:text-lg font-bold font-mono text-ink dark:text-ink">
          {price > 0 ? `${currency}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: maxDecimals })}` : 'N/A'}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {onTradeIndex && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTradeIndex(item.symbol);
              }}
              className="px-1.5 sm:px-2 py-0.5 rounded-lg bg-surface-2 hover:bg-brand-fill hover:text-white text-ink-2 font-bold transition-all flex items-center gap-0.5 cursor-pointer active:scale-95 border border-line"
              title={isCrypto ? "Trade in Live Terminal" : "View Index Chart & Constituents"}
            >
              <span>{isCrypto ? '⚡ Trade' : '📊 View'}</span>
            </button>
          )}
          <div className={`text-ink sm:text-xs font-mono font-bold flex items-center ${
            isUp ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'
          }`}>
            {isUp ? <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-0.5" />}
            {isUp ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`}
          </div>
        </div>
      </div>
      <QuoteFreshness status={tick?.status || item.status} source={tick?.source || item.source} lastUpdated={tick?.lastUpdated || item.lastUpdated} timestamp={tick?.timestamp} />
    </div>
  );
};

export const IndicesPage: React.FC<Props> = ({ onSelectIndex, onTradeIndex }) => {
  const { marketMode } = useAuth();
  const { subscribeSymbol } = useMarketStream();
  const [indices, setIndices] = useState<any[]>([]);
  const [globalAssets, setGlobalAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const isCrypto = marketMode === 'crypto';

  useEffect(() => {
    setLoading(true);
    setCategoryFilter('All');
    if (isCrypto) {
      getCryptoInstruments().catch(() => ({ crypto: [], instruments: [], count: 0 })).then(cData => {
        const cryptos = (cData?.crypto || cData?.instruments || []).map((c: any) => ({ ...c, assetType: 'crypto' }));
        setGlobalAssets(cryptos);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    } else {
      getAllIndices()
        .then(data => {
          setIndices(data.indices || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [marketMode]);

  const categories = isCrypto
    ? ['All', 'Crypto Assets', 'Layer 1', 'DeFi', 'AI & Compute', 'Meme']
    : ['All', 'Broad Market', 'Sectoral', 'Midcap', 'Smallcap', 'Thematic'];

  const items = isCrypto ? globalAssets : indices;

  useEffect(() => {
    items.forEach(item => subscribeSymbol(item.symbol));
  }, [items, subscribeSymbol]);

  const filtered = items.filter(item => {
    let matchesCategory = categoryFilter === 'All';
    if (!matchesCategory) {
      if (isCrypto) {
        const cat = (item.category || '').toLowerCase();
        if (categoryFilter === 'Crypto Assets') matchesCategory = item.assetType === 'crypto';
        else if (categoryFilter === 'Layer 1') matchesCategory = cat.includes('layer 1') || cat.includes('l1');
        else if (categoryFilter === 'DeFi') matchesCategory = cat.includes('defi') || cat.includes('dex') || cat.includes('payments');
        else if (categoryFilter === 'AI & Compute') matchesCategory = cat.includes('ai') || cat.includes('compute') || cat.includes('oracle');
        else if (categoryFilter === 'Meme') matchesCategory = cat.includes('meme');
      } else {
        matchesCategory = item.category === categoryFilter;
      }
    }

    const matchesSearch = !searchQuery || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.symbol.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-32 lg:pb-16">
      
      {/* Page Header */}
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-6  zoom-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
              isCrypto
                ? 'bg-surface-2 dark:bg-surface-2 border-line dark:border-line text-ai dark:text-ai'
                : 'bg-surface-2 dark:bg-brand-fill border-line dark:border-line text-brand dark:text-brand'
            }`}>
              {isCrypto ? <Coins className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
            <h1 className="text-xl font-extrabold text-ink dark:text-ink">
              {isCrypto ? 'All Cryptocurrency Assets (24/7 Global)' : 'NSE & BSE Equity Indices'}
            </h1>
          </div>
          <p className="text-xs text-ink-2 dark:text-ink-3 mt-1">
            {isCrypto
              ? 'Real-time spot quotes, 24h market movements, and instant candlestick terminal charting in $ USD'
              : 'Official benchmark and sectoral index performance with real-time delayed prices and timestamps in ₹ INR'}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-ink-3 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isCrypto ? "Filter Bitcoin, Solana, SUI..." : "Filter Nifty, Sensex..."}
              className="w-full pl-9 pr-3 py-2 bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl text-xs text-ink dark:text-ink-3 placeholder-slate-400 focus:outline-none focus:border-line dark:focus:border-line"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              categoryFilter === cat
                ? 'bg-brand-fill text-on-brand '
                : 'bg-surface dark:bg-surface border border-line dark:border-line text-ink-2 dark:text-ink-3 hover:text-ink '
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-line dark:border-line border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-ink-2 dark:text-ink-3">
            Loading {isCrypto ? 'cryptocurrency market data' : 'verified exchange indices'}...
          </p>
        </div>
      )}

      {/* Items Grid */}
      {!loading && (
        <div className="mobile-compact-grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(item => (
            <LiveAssetCard
              key={item.symbol}
              item={item}
              isCrypto={isCrypto}
              onSelectIndex={onSelectIndex}
              onTradeIndex={onTradeIndex}
            />
          ))}
        </div>
      )}
    </div>
  );
};
