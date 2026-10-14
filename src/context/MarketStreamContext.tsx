// DHRU.AI - Global Real-Time Market Streaming Context
// Automatic streaming price updates across all components, watchlists, charts, and portfolios

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

export interface LiveTick {
  symbol: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  timestamp: number;
  isLive: boolean;
  flash?: 'up' | 'down' | null;
}

interface MarketStreamContextType {
  ticks: Record<string, LiveTick>;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  isMarketLive: boolean;
  subscribeSymbol: (symbol: string) => void;
  getQuote: (symbol: string, fallback?: any) => LiveTick | null;
}

const MarketStreamContext = createContext<MarketStreamContextType>({
  ticks: {},
  connectionStatus: 'connecting',
  isMarketLive: false,
  subscribeSymbol: () => {},
  getQuote: () => null,
});

export const MarketStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ticks, setTicks] = useState<Record<string, LiveTick>>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [isMarketLive, setIsMarketLive] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const flashTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleTickUpdate = useCallback((newTicks: LiveTick[], isLive: boolean) => {
    setIsMarketLive(isLive);
    setTicks(prev => {
      const next = { ...prev };
      for (const t of newTicks) {
        const existing = prev[t.symbol];
        let flash: 'up' | 'down' | null = null;
        if (existing) {
          if (t.price > existing.price) flash = 'up';
          else if (t.price < existing.price) flash = 'down';
        }

        next[t.symbol] = {
          ...t,
          flash
        };

        // Reset flash after 800ms
        if (flash) {
          const oldTimer = flashTimers.current.get(t.symbol);
          if (oldTimer) clearTimeout(oldTimer);

          const timer = setTimeout(() => {
            setTicks(current => {
              if (!current[t.symbol]) return current;
              return {
                ...current,
                [t.symbol]: {
                  ...current[t.symbol],
                  flash: null
                }
              };
            });
            flashTimers.current.delete(t.symbol);
          }, 800);

          flashTimers.current.set(t.symbol, timer);
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    const connectSSE = () => {
      setConnectionStatus('connecting');

      // In production or development, connect to /api/stream
      const streamUrl = '/api/stream';
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setConnectionStatus('connected');
      };

      es.addEventListener('init', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.isLive !== undefined) setIsMarketLive(data.isLive);
          if (Array.isArray(data.cachedTicks)) {
            handleTickUpdate(data.cachedTicks, data.isLive);
          }
        } catch (err) {
          console.error('[Stream] Failed to parse init event:', err);
        }
      });

      es.addEventListener('ticks', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (Array.isArray(data.ticks)) {
            handleTickUpdate(data.ticks, data.isLive);
          }
        } catch (err) {
          console.error('[Stream] Failed to parse ticks:', err);
        }
      });

      es.addEventListener('heartbeat', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.isLive !== undefined) setIsMarketLive(data.isLive);
        } catch (err) {
          // ignore
        }
      });

      es.onerror = () => {
        setConnectionStatus('disconnected');
        es.close();
        // Reconnect with backoff
        reconnectTimeout = setTimeout(connectSSE, 4000);
      };
    };

    connectSSE();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearTimeout(reconnectTimeout);
      flashTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, [handleTickUpdate]);

  const subscribeSymbol = useCallback((symbol: string) => {
    if (!symbol) return;
    fetch('/api/stream/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol })
    }).catch(() => {});
  }, []);

  const getQuote = useCallback((symbol: string, fallback?: any): LiveTick | null => {
    if (ticks[symbol]) return ticks[symbol];
    if (fallback) {
      return {
        symbol,
        price: fallback.price || 0,
        previousClose: fallback.previousClose || fallback.price || 0,
        change: fallback.change || 0,
        changePercent: fallback.changePercent || 0,
        dayHigh: fallback.dayHigh || fallback.price || 0,
        dayLow: fallback.dayLow || fallback.price || 0,
        volume: fallback.volume || 0,
        timestamp: Date.now(),
        isLive: isMarketLive,
        flash: null
      };
    }
    return null;
  }, [ticks, isMarketLive]);

  return (
    <MarketStreamContext.Provider
      value={{
        ticks,
        connectionStatus,
        isMarketLive,
        subscribeSymbol,
        getQuote,
      }}
    >
      {children}
    </MarketStreamContext.Provider>
  );
};

export const useMarketStream = () => useContext(MarketStreamContext);

// Hook to get a reactive live quote for a specific symbol
export function useLivePrice(symbol: string, initialQuote?: any) {
  const { ticks, subscribeSymbol, isMarketLive, connectionStatus } = useMarketStream();

  useEffect(() => {
    if (symbol) subscribeSymbol(symbol);
  }, [symbol, subscribeSymbol]);

  const liveTick = ticks[symbol];

  const price = liveTick ? liveTick.price : (initialQuote?.price ?? 0);
  const change = liveTick ? liveTick.change : (initialQuote?.change ?? 0);
  const changePercent = liveTick ? liveTick.changePercent : (initialQuote?.changePercent ?? 0);
  const dayHigh = liveTick ? liveTick.dayHigh : (initialQuote?.dayHigh ?? price);
  const dayLow = liveTick ? liveTick.dayLow : (initialQuote?.dayLow ?? price);
  const volume = liveTick ? liveTick.volume : (initialQuote?.volume ?? 0);
  const flash = liveTick?.flash || null;

  return {
    price,
    change,
    changePercent,
    dayHigh,
    dayLow,
    volume,
    flash,
    isMarketLive,
    connectionStatus,
    isTickLive: !!liveTick?.isLive
  };
}
