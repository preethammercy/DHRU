import React, { createContext, useContext, useEffect, useState } from 'react';

export interface WatchlistItem {
  symbol: string;
  name: string;
  type: string;
  addedAt: string;
}

interface WatchlistContextType {
  watchlist: WatchlistItem[];
  addToWatchlist: (item: { symbol: string; name: string; type?: string }) => void;
  removeFromWatchlist: (symbol: string) => void;
  isInWatchlist: (symbol: string) => boolean;
  clearWatchlist: () => void;
}

const WatchlistContext = createContext<WatchlistContextType>({
  watchlist: [],
  addToWatchlist: () => {},
  removeFromWatchlist: () => {},
  isInWatchlist: () => false,
  clearWatchlist: () => {},
});

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', type: 'Stock', addedAt: new Date().toISOString() },
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd', type: 'Stock', addedAt: new Date().toISOString() },
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', type: 'Stock', addedAt: new Date().toISOString() },
  { symbol: '^NSEI', name: 'NIFTY 50', type: 'Index', addedAt: new Date().toISOString() },
  { symbol: 'GC=F', name: 'Gold (COMEX/MCX Proxy)', type: 'Commodity', addedAt: new Date().toISOString() }
];

export const WatchlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem('dhru_watchlist');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return DEFAULT_WATCHLIST;
  });

  useEffect(() => {
    try {
      localStorage.setItem('dhru_watchlist', JSON.stringify(watchlist));
    } catch (e) {
      // ignore
    }
  }, [watchlist]);

  const addToWatchlist = (item: { symbol: string; name: string; type?: string }) => {
    if (watchlist.some(w => w.symbol === item.symbol)) return;
    setWatchlist(prev => [
      {
        symbol: item.symbol,
        name: item.name,
        type: item.type || 'Stock',
        addedAt: new Date().toISOString()
      },
      ...prev
    ]);
  };

  const removeFromWatchlist = (symbol: string) => {
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
  };

  const isInWatchlist = (symbol: string) => {
    return watchlist.some(w => w.symbol === symbol);
  };

  const clearWatchlist = () => {
    setWatchlist([]);
  };

  return (
    <WatchlistContext.Provider value={{ watchlist, addToWatchlist, removeFromWatchlist, isInWatchlist, clearWatchlist }}>
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => useContext(WatchlistContext);
