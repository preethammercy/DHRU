// DHRU.AI - Personal Watchlist Management
// Local storage persisted portfolio watchlist with live quote updates, quick removal, and export.

import React, { useEffect, useState } from 'react';
import { useWatchlist } from '../context/WatchlistContext';
import { getStockDetails } from '../services/api';
import { Bookmark, Trash2, ArrowUpRight, ArrowDownRight, ArrowRight, Download, Plus, Search } from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
  onOpenSearch: () => void;
}

export const WatchlistPage: React.FC<Props> = ({ onSelectStock, onOpenSearch }) => {
  const { watchlist, removeFromWatchlist, clearWatchlist } = useWatchlist();
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (watchlist.length === 0) return;

    setLoading(true);
    const fetchAll = async () => {
      const map: Record<string, any> = {};
      for (const item of watchlist) {
        try {
          const res = await getStockDetails(item.symbol);
          if (res?.quote) map[item.symbol] = res.quote;
        } catch (e) {
          // ignore
        }
      }
      setQuotes(map);
      setLoading(false);
    };

    fetchAll();
  }, [watchlist]);

  const exportWatchlist = () => {
    const jsonStr = JSON.stringify(watchlist, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dhru_ai_watchlist_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white">Personal Watchlist & Portfolio Monitor</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Persisted on-device tracking for your favorite stocks, indices, ETFs, and commodities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 hover:from-blue-500 hover:to-cyan-400 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Instruments
          </button>
          {watchlist.length > 0 && (
            <button
              onClick={exportWatchlist}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#070B14] border border-[#1A2744] text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-600 transition-colors"
              title="Export Watchlist to JSON"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          )}
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="p-16 rounded-2xl bg-[#0D1527] border border-[#1A2744] text-center space-y-4">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-200">Your Watchlist is Empty</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Search for Reliance, TCS, NIFTY 50, Gold, or any of the 2,600+ NSE stocks and tap the bookmark icon to start tracking.
            </p>
          </div>
          <button
            onClick={onOpenSearch}
            className="px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
          >
            <Search className="w-3.5 h-3.5" /> Search Market Universe
          </button>
        </div>
      ) : (
        <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#070B14] border-b border-[#1A2744] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Instrument</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Latest Price</th>
                  <th className="p-4 text-right">24h Change</th>
                  <th className="p-4 text-right">Day High / Low</th>
                  <th className="p-4 text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2744]/60">
                {watchlist.map(item => {
                  const q = quotes[item.symbol];
                  const isUp = q?.changePercent >= 0;
                  return (
                    <tr
                      key={item.symbol}
                      onClick={() => onSelectStock(item.symbol)}
                      className="hover:bg-[#131F38]/60 cursor-pointer transition-colors group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {q?.name || item.name}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                          {item.symbol}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-[#070B14] border border-[#1A2744] text-[11px] font-mono text-slate-300">
                          {item.type || 'Stock'}
                        </span>
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-white text-sm">
                        {q?.price > 0 ? `₹${q.price.toLocaleString('en-IN')}` : loading ? '...' : '—'}
                      </td>

                      <td className="p-4 text-right font-mono font-semibold">
                        {q ? (
                          <span className={`inline-flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                            {isUp ? `+${q.changePercent}%` : `${q.changePercent}%`}
                          </span>
                        ) : '—'}
                      </td>

                      <td className="p-4 text-right font-mono text-[11px] text-slate-400">
                        {q?.dayLow > 0 && q?.dayHigh > 0 ? `₹${q.dayLow} — ₹${q.dayHigh}` : '—'}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectStock(item.symbol)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-semibold inline-flex items-center gap-1"
                          >
                            Analyze <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromWatchlist(item.symbol)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Remove from Watchlist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-[#070B14] border-t border-[#1A2744] flex items-center justify-between text-xs text-slate-500">
            <span>Stored privately in your local browser storage</span>
            <button
              onClick={clearWatchlist}
              className="text-rose-400 hover:underline text-[11px]"
            >
              Clear Entire Watchlist
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
