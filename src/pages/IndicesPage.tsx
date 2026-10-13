// DHRU.AI - All Indian Equity Indices Directory
// Complete coverage of NSE and BSE benchmark, sectoral, and market-cap indices.
// White & Blue Fintrix fintech styling with zoom animations.

import React, { useEffect, useState } from 'react';
import { getAllIndices } from '../services/api';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Filter, Search, Layers } from 'lucide-react';

interface Props {
  onSelectIndex: (symbol: string) => void;
}

export const IndicesPage: React.FC<Props> = ({ onSelectIndex }) => {
  const [indices, setIndices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    getAllIndices().then(data => {
      setIndices(data.indices || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const categories = ['All', 'Broad Market', 'Sectoral', 'Midcap', 'Smallcap', 'Thematic'];

  const filtered = indices.filter(idx => {
    const matchesCategory = categoryFilter === 'All' || idx.category === categoryFilter;
    const matchesSearch = !searchQuery || 
      idx.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      idx.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Page Header */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card zoom-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">NSE & BSE Equity Indices</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official benchmark and sectoral index performance with real-time delayed prices and timestamps
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
              placeholder="Filter index name or ticker..."
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
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading verified exchange indices...</p>
        </div>
      )}

      {/* Indices Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(idx => {
            const isUp = idx.changePercent >= 0;
            return (
              <div
                key={idx.symbol}
                onClick={() => onSelectIndex(idx.symbol)}
                className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 dark:hover:border-cyan-500/40 hover:shadow-card-hover cursor-pointer transition-all shadow-card zoom-card group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-[#070B14] dark:text-cyan-400 border border-blue-200 dark:border-[#1A2744] font-semibold">
                      {idx.exchange} • {idx.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">{idx.symbol}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors mt-2">
                    {idx.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {idx.description}
                  </p>
                </div>

                <div className="pt-4 mt-3 border-t border-slate-100 dark:border-[#1A2744]/70 flex items-center justify-between">
                  <div className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                    {idx.price > 0 ? idx.price.toLocaleString('en-IN') : 'N/A'}
                  </div>
                  <div className={`text-xs font-mono font-bold flex items-center ${
                    isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                    {isUp ? `+${idx.changePercent}%` : `${idx.changePercent}%`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
