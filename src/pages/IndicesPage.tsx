// DHRU.AI - Benchmark Indices & Crypto Markets Directory
// Strictly segregated:
// When in Indian Mode -> 100% Indian Indices (Nifty 50, Bank Nifty, Sensex, Sectorals in ₹)
// When in Crypto Mode -> 100% Crypto Markets (BTC, ETH, SOL, XRP, SUI, DOGE, ADA in $)
// White & Blue Fintrix fintech styling with zoom animations.

import React, { useEffect, useState } from 'react';
import { getAllIndices, getCryptoInstruments, getForexInstruments } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useMarketStream } from '../context/MarketStreamContext';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Search, Coins, Globe2 } from 'lucide-react';

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
  const currency = isForex && item.symbol.includes('INR') ? '₹' : (isCrypto || isForex ? '$' : '₹');
  const maxDecimals = price < 2 ? 4 : (price < 100 ? 3 : 2);

  return (
    <div
      onClick={() => onSelectIndex(item.symbol)}
      className={`p-5 rounded-2xl bg-white dark:bg-[#0D1527] border cursor-pointer transition-all shadow-card card-3d zoom-card group flex flex-col justify-between ${
        flash === 'up'
          ? 'flash-up border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)] bg-emerald-50/30'
          : flash === 'down'
          ? 'flash-down border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.35)] bg-rose-50/30'
          : 'border-slate-200 dark:border-[#1A2744] hover:border-blue-400 dark:hover:border-cyan-500/40'
      }`}
    >
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-[#070B14] dark:text-cyan-400 border border-blue-200 dark:border-[#1A2744] font-semibold">
            {item.exchange || (isForex ? 'FOREX' : (isCrypto ? 'CRYPTO' : 'NSE'))} • {item.category}
          </span>
          <span className="text-[10px] font-mono text-slate-400">{item.symbol}</span>
        </div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors mt-2">
          {item.name}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
          {item.description}
        </p>
      </div>

      <div className="pt-4 mt-3 border-t border-slate-100 dark:border-[#1A2744]/70 flex items-center justify-between">
        <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
          {price > 0 ? `${currency}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: maxDecimals })}` : 'N/A'}
        </div>
        <div className="flex items-center gap-2">
          {onTradeIndex && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTradeIndex(item.symbol);
              }}
              className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
              title="Trade in Live Terminal"
            >
              <span>⚡ Trade</span>
            </button>
          )}
          <div className={`text-xs font-mono font-bold flex items-center ${
            isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
          }`}>
            {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
            {isUp ? `+${changePercent.toFixed(2)}%` : `${changePercent.toFixed(2)}%`}
          </div>
        </div>
      </div>
    </div>
  );
};

export const IndicesPage: React.FC<Props> = ({ onSelectIndex, onTradeIndex }) => {
  const { marketMode } = useAuth();
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
      Promise.all([
        getCryptoInstruments().catch(() => ({ crypto: [] })),
        getForexInstruments().catch(() => ({ forex: [] }))
      ]).then(([cData, fData]) => {
        const cryptos = (cData?.crypto || cData?.instruments || []).map((c: any) => ({ ...c, assetType: 'crypto' }));
        const forex = (fData?.forex || fData?.instruments || []).map((f: any) => ({ ...f, assetType: 'forex' }));
        setGlobalAssets([...cryptos, ...forex]);
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
    ? ['All', 'Crypto Assets', 'Forex Majors & Crosses', 'Layer 1', 'DeFi', 'AI & Compute', 'Meme']
    : ['All', 'Broad Market', 'Sectoral', 'Midcap', 'Smallcap', 'Thematic'];

  const items = isCrypto ? globalAssets : indices;

  const filtered = items.filter(item => {
    let matchesCategory = categoryFilter === 'All';
    if (!matchesCategory) {
      if (isCrypto) {
        const cat = (item.category || '').toLowerCase();
        if (categoryFilter === 'Crypto Assets') matchesCategory = item.assetType === 'crypto';
        else if (categoryFilter === 'Forex Majors & Crosses') matchesCategory = item.assetType === 'forex';
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
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card zoom-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${
              isCrypto
                ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400'
                : 'bg-blue-50 dark:bg-cyan-500/10 border-blue-200 dark:border-cyan-500/20 text-blue-600 dark:text-cyan-400'
            }`}>
              {isCrypto ? <Coins className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isCrypto ? 'All Cryptocurrency Assets (24/7 Global)' : 'NSE & BSE Equity Indices'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isCrypto
              ? 'Real-time spot quotes, 24h market movements, and instant candlestick terminal charting in $ USD'
              : 'Official benchmark and sectoral index performance with real-time delayed prices and timestamps in ₹ INR'}
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isCrypto ? "Filter Bitcoin, Solana, SUI..." : "Filter Nifty, Sensex..."}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 dark:focus:border-cyan-400"
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
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] text-slate-600 dark:text-slate-400 hover:text-slate-900 shadow-sm'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Loading {isCrypto ? 'cryptocurrency market data' : 'verified exchange indices'}...
          </p>
        </div>
      )}

      {/* Items Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
