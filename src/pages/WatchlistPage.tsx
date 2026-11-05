// DHRU.AI - Personal Watchlist Management
// Local storage persisted portfolio watchlist with live quote updates, quick removal, and export.

import React, { useEffect, useState } from 'react';
import { useWatchlist } from '../context/WatchlistContext';
import { getStockDetails } from '../services/api';
import { useMarketStream } from '../context/MarketStreamContext';
import { QuoteFreshness } from '../components/market/QuoteFreshness';
import { Bookmark, Trash2, ArrowUpRight, ArrowDownRight, ArrowRight, Download, Plus, Search } from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
  onOpenSearch: () => void;
}

export const WatchlistPage: React.FC<Props> = ({ onSelectStock, onOpenSearch }) => {
  const { watchlist, removeFromWatchlist, clearWatchlist } = useWatchlist();
  const { ticks, subscribeSymbol } = useMarketStream();
  const [quotes, setQuotes] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    watchlist.forEach(item => subscribeSymbol(item.symbol));
  }, [watchlist, subscribeSymbol]);

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
      <div className="bg-surface border border-line rounded-2xl p-6  flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-fill border border-line flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-brand" />
            </div>
            <h1 className="text-xl font-extrabold text-ink">Personal Watchlist & Portfolio Monitor</h1>
          </div>
          <p className="text-xs text-ink-3 mt-1">
            Persisted on-device tracking for your favorite stocks, indices, ETFs, and commodities
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-fill   text-on-brand text-xs font-semibold     transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Instruments
          </button>
          {watchlist.length > 0 && (
            <button
              onClick={exportWatchlist}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-line text-xs font-semibold text-ink-3 hover:text-ink hover:border-line transition-colors"
              title="Export Watchlist to JSON"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          )}
        </div>
      </div>

      {watchlist.length === 0 ? (
        <div className="p-16 rounded-2xl bg-surface border border-line text-center space-y-4">
          <Bookmark className="w-12 h-12 text-ink-2 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-ink-3">Your Watchlist is Empty</h3>
            <p className="text-xs text-ink-3 max-w-sm mx-auto">
              Search for Reliance, TCS, NIFTY 50, Gold, or any of the 2,600+ NSE stocks and tap the bookmark icon to start tracking.
            </p>
          </div>
          <button
            onClick={onOpenSearch}
            className="px-4 py-2 rounded-xl bg-brand-fill hover:bg-brand-fill text-brand border border-line text-xs font-semibold inline-flex items-center gap-1.5 transition-all"
          >
            <Search className="w-3.5 h-3.5" /> Search Market Universe
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-line rounded-2xl  overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-surface border-b border-line text-ink font-semibold text-ink-3 uppercase tracking-wider">
                  <th className="p-4">Instrument</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Latest Price</th>
                  <th className="p-4 text-right">24h Change</th>
                  <th className="p-4 text-right">Day High / Low</th>
                  <th className="p-4 text-center">Manage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {watchlist.map(item => {
                  const q = { ...(quotes[item.symbol] || {}), ...(ticks[item.symbol] || {}) };
                  const isCrypto = item.symbol.endsWith('-USD') || item.type?.toLowerCase().includes('crypto') || q.currency === 'USDT';
                  const isINRPair = item.symbol.includes('INR');
                  const isDollar = isCrypto || q.currency === 'USD' || item.symbol.includes('=X') && !isINRPair;
                  const currency = isINRPair || (!isDollar && (item.symbol.endsWith('.NS') || item.symbol.endsWith('.BO') || item.symbol.startsWith('^') || q.currency === 'INR')) ? '₹' : isDollar ? '$' : q.currency ? `${q.currency} ` : '₹';
                  const locale = isDollar ? 'en-US' : 'en-IN';
                  const isUp = Number(q?.changePercent || 0) >= 0;
                  return (
                    <tr
                      key={item.symbol}
                      onClick={() => onSelectStock(item.symbol)}
                      className="hover:bg-surface cursor-pointer transition-colors group"
                    >
                      <td className="p-4">
                        <div className="font-bold text-ink-3 group-hover:text-brand transition-colors">
                          {q?.name || item.name}
                        </div>
                        <div className="text-ink font-mono text-ink-2 mt-0.5">
                          {item.symbol}
                        </div>
                      </td>

                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-md bg-surface border border-line text-ink font-mono text-ink-3">
                          {item.type || 'Stock'}
                        </span>
                      </td>

                      <td className="p-4 text-right font-mono font-bold text-ink text-sm">
                        <span className={`inline-block rounded px-1 ${ticks[item.symbol]?.flash === 'up' ? 'flash-up text-pos' : ticks[item.symbol]?.flash === 'down' ? 'flash-down text-neg' : ''}`}>
                          {q?.price > 0 ? `${currency}${q.price.toLocaleString(locale, { maximumFractionDigits: isCrypto ? 8 : 2 })}` : loading ? '...' : '—'}
                        </span>
                        <QuoteFreshness status={ticks[item.symbol]?.status || q.status} source={ticks[item.symbol]?.source || q.source} lastUpdated={ticks[item.symbol]?.lastUpdated || q.lastUpdated} timestamp={ticks[item.symbol]?.timestamp || q.timestamp} />
                      </td>

                      <td className="p-4 text-right font-mono font-semibold">
                        {Number.isFinite(Number(q.changePercent)) ? (
                          <span className={`inline-flex items-center ${isUp ? 'text-pos' : 'text-neg'}`}>
                            {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                            {isUp ? `+${q.changePercent}%` : `${q.changePercent}%`}
                          </span>
                        ) : '—'}
                      </td>

                      <td className="p-4 text-right font-mono text-ink-3">
                        {q?.dayLow > 0 && q?.dayHigh > 0 ? `${currency}${q.dayLow.toLocaleString(locale, { maximumFractionDigits: isCrypto ? 8 : 2 })} — ${currency}${q.dayHigh.toLocaleString(locale, { maximumFractionDigits: isCrypto ? 8 : 2 })}` : '—'}
                      </td>

                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => onSelectStock(item.symbol)}
                            className="px-2.5 py-1 rounded-lg bg-brand-fill hover:bg-brand-fill text-brand border border-line text-ink font-semibold inline-flex items-center gap-1"
                          >
                            Analyze <ArrowRight className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => removeFromWatchlist(item.symbol)}
                            className="p-1.5 rounded-lg text-ink-2 hover:text-neg hover:bg-neg-tint transition-colors"
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

          <div className="p-3 bg-surface border-t border-line flex items-center justify-between text-xs text-ink-2">
            <span>Stored privately in your local browser storage</span>
            <button
              onClick={clearWatchlist}
              className="text-neg hover:underline text-ink"
            >
              Clear Entire Watchlist
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
