// DHRU.AI - Global Real-Time Market Streaming Context
// Live market updates from the configured REST/SSE feeds and Binance for supported crypto pairs.

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
  source?: string;
  flash?: 'up' | 'down' | null;
}

interface MarketStreamContextType {
  ticks: Record<string, LiveTick>;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  isMarketLive: boolean;
  subscribeSymbol: (symbol: string) => void;
  getQuote: (symbol: string, fallback?: any) => LiveTick | null;
  syncQuote: (quote: Partial<LiveTick> & { symbol: string; price: number }) => void;
}

const MarketStreamContext = createContext<MarketStreamContextType>({
  ticks: {},
  connectionStatus: 'connecting',
  isMarketLive: false,
  subscribeSymbol: () => {},
  getQuote: () => null,
  syncQuote: () => {},
});

const BINANCE_PAIR_MAP: Record<string, string> = {
  'BTCUSDT': 'BTC-USD',
  'ETHUSDT': 'ETH-USD',
  'SOLUSDT': 'SOL-USD',
  'BNBUSDT': 'BNB-USD',
  'XRPUSDT': 'XRP-USD',
  'DOGEUSDT': 'DOGE-USD',
  'ADAUSDT': 'ADA-USD',
  'AVAXUSDT': 'AVAX-USD',
  'LINKUSDT': 'LINK-USD',
  'NEARUSDT': 'NEAR-USD',
  'SUIUSDT': 'SUI-USD',
  'PEPEUSDT': 'PEPE-USD',
  'DOTUSDT': 'DOT-USD',
  'APTUSDT': 'APT-USD',
  'SHIBUSDT': 'SHIB-USD',
  'LTCUSDT': 'LTC-USD',
  'UNIUSDT': 'UNI-USD',
  'ARBUSDT': 'ARB-USD',
  'OPUSDT': 'OP-USD',
  'RENDERUSDT': 'RENDER-USD',
  'ICPUSDT': 'ICP-USD',
  'FETUSDT': 'FET-USD',
};

// Check if instrument is an Indian stock, index, or derivative
export function isIndianSymbol(symbol: string): boolean {
  if (!symbol) return false;
  const s = symbol.toUpperCase();
  return (
    s.endsWith('.NS') ||
    s.endsWith('.BO') ||
    s.startsWith('^NSE') ||
    s.startsWith('^BSE') ||
    s.startsWith('^CNX') ||
    s === '^NSEI' ||
    s === '^BSESN'
  );
}

// Client-side IST trading session determination (NSE/BSE: 09:15 to 15:30 IST)
export function isIndianMarketOpenNow(): boolean {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short'
  });
  const parts = istFormatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const weekday = parts.find(p => p.type === 'weekday')?.value || 'Mon';
  if (weekday === 'Sat' || weekday === 'Sun') return false;
  const totalMins = hour * 60 + minute;
  // 09:15 to 15:30 IST
  return totalMins >= 555 && totalMins <= 930;
}

export const MarketStreamProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ticks, setTicks] = useState<Record<string, LiveTick>>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [isMarketLive, setIsMarketLive] = useState(isIndianMarketOpenNow);
  const eventSourceRef = useRef<EventSource | null>(null);
  const flashTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const activeSymbolsRef = useRef<Set<string>>(new Set<string>());
  const binanceWsLastSeen = useRef<Map<string, number>>(new Map());

  // Batch process tick updates with strict after-hours freeze for Indian stocks and authoritative Binance WS priority
  const handleTickUpdate = useCallback((newTicks: LiveTick[], isLive?: boolean, isFromBinanceWs: boolean = false) => {
    const indianOpen = isIndianMarketOpenNow();
    if (isLive !== undefined) setIsMarketLive(indianOpen);

    setTicks(prev => {
      const next = { ...prev };
      const now = Date.now();

      for (const t of newTicks) {
        activeSymbolsRef.current.add(t.symbol);
        const existing = prev[t.symbol];

        // 1. FREEZE INDIAN EQUITIES & INDICES AFTER 3:30 PM IST (and weekends)
        if (isIndianSymbol(t.symbol) && !indianOpen) {
          if (existing) {
            // Keep existing settlement price 100% frozen, zero flashes, isLive = false
            next[t.symbol] = {
              ...existing,
              isLive: false,
              flash: null
            };
            continue;
          }
        }

        // 2. CRYPTO: DO NOT OVERWRITE NATIVE LIVE BINANCE WS TICKS WITH REST / SSE SNAPSHOTS
        if (t.symbol.includes('-USD') && !isFromBinanceWs) {
          const lastWs = binanceWsLastSeen.current.get(t.symbol) || 0;
          if (now - lastWs < 15000 && existing && existing.price > 0) {
            // Native WebSocket stream is live and fresh; skip stale REST update
            continue;
          }
        }

        let flash: 'up' | 'down' | null = null;
        if (existing && existing.price > 0 && t.price > 0) {
          if (t.price > existing.price) flash = 'up';
          else if (t.price < existing.price) flash = 'down';
        }

        next[t.symbol] = {
          ...existing,
          ...t,
          isLive: isIndianSymbol(t.symbol) ? indianOpen : (t.isLive !== undefined ? t.isLive : true),
          flash: flash || existing?.flash || null
        };

        // Reset flash after 750ms
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
        }, 1200);

          flashTimers.current.set(t.symbol, timer);
        }
      }
      return next;
    });
  }, []);

  // Fetch fresh ticks from the REST endpoint
  const pollTicks = useCallback(async () => {
    try {
      const res = await fetch('/api/stream/ticks', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.ticks) && data.ticks.length > 0) {
          handleTickUpdate(data.ticks, data.isLive);
          setConnectionStatus('connected');
        }
      }
    } catch {
      // Ignore network errors during polling
    }
  }, [handleTickUpdate]);

  // Dual Connection: SSE with automatic fast REST polling fallback for Vercel Serverless
  useEffect(() => {
    // 1. Initial snapshot fetch
    pollTicks();

    // 2. Continuous fallback polling (runs every 2 seconds, immune to Vercel SSE timeouts)
    const pollingInterval = setInterval(pollTicks, 2000);

    // 3. SSE Connection Attempt
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/stream');
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
        } catch {
          // ignore
        }
      });

      es.addEventListener('ticks', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (Array.isArray(data.ticks)) {
            handleTickUpdate(data.ticks, data.isLive);
          }
        } catch {
          // ignore
        }
      });

      es.addEventListener('heartbeat', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.isLive !== undefined) setIsMarketLive(data.isLive);
        } catch {
          // ignore
        }
      });

      es.onerror = () => {
        // When SSE drops (common on Vercel after 10-15s), remain 'connected' via REST polling
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      };
    } catch {
      // SSE not supported or blocked
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      clearInterval(pollingInterval);
      flashTimers.current.forEach(timer => clearTimeout(timer));
    };
  }, [pollTicks, handleTickUpdate]);

  // 1. Native Real-Time Binance WebSocket Stream (TradingView Exact Live Feeds)
  // Connects directly from client browser, 100% resilient on Vercel without server limits
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isUnmounted = false;

    const connectBinanceWs = () => {
      try {
        ws = new WebSocket('wss://stream.binance.com:9443/ws/!miniTicker@arr');

        ws.onopen = () => {
          setConnectionStatus('connected');
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (!Array.isArray(data)) return;

            const ticksToUpdate: LiveTick[] = [];
            for (const item of data) {
              const ourSymbol = BINANCE_PAIR_MAP[item.s];
              if (!ourSymbol) continue;

              const price = parseFloat(item.c);
              const open = parseFloat(item.o);
              const high = parseFloat(item.h);
              const low = parseFloat(item.l);
              const volume = parseFloat(item.v);
              if (isNaN(price) || price <= 0) continue;

              const change = Number((price - open).toFixed(price > 100 ? 2 : (price < 1 ? 6 : 4)));
              const changePercent = open > 0 ? Number((((price - open) / open) * 100).toFixed(2)) : 0;

              ticksToUpdate.push({
                symbol: ourSymbol,
                price,
                previousClose: open,
                change,
                changePercent,
                dayHigh: high,
                dayLow: low,
                volume,
                timestamp: item.E || Date.now(),
                source: 'Binance WebSocket',
                isLive: true
              });
            }

            if (ticksToUpdate.length > 0) {
              const now = Date.now();
              for (const t of ticksToUpdate) {
                binanceWsLastSeen.current.set(t.symbol, now);
              }
              handleTickUpdate(ticksToUpdate, true, true);
            }
          } catch {
            // ignore
          }
        };

        ws.onerror = () => {
          try { ws?.close(); } catch {}
        };

        ws.onclose = () => {
          if (!isUnmounted) {
            reconnectTimer = setTimeout(connectBinanceWs, 3000);
          }
        };
      } catch {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connectBinanceWs, 5000);
        }
      }
    };

    connectBinanceWs();

    // Direct Binance REST fetch on mount for instant zero-latency crypto quotes
    fetch('https://api.binance.com/api/v3/ticker/24hr')
      .then(res => res.json())
      .then((arr: any[]) => {
        if (!Array.isArray(arr)) return;
        const initialTicks: LiveTick[] = [];
        for (const item of arr) {
          const ourSymbol = BINANCE_PAIR_MAP[item.symbol];
          if (!ourSymbol) continue;
          const price = parseFloat(item.lastPrice);
          const prevClose = parseFloat(item.prevClosePrice);
          const change = parseFloat(item.priceChange);
          const changePercent = parseFloat(item.priceChangePercent);
          if (price > 0) {
            initialTicks.push({
              symbol: ourSymbol,
              price,
              previousClose: prevClose,
              change: Number(change.toFixed(price > 100 ? 2 : 4)),
              changePercent: Number(changePercent.toFixed(2)),
              dayHigh: parseFloat(item.highPrice),
              dayLow: parseFloat(item.lowPrice),
              volume: parseFloat(item.volume),
              timestamp: Date.now(),
              source: 'Binance REST ticker',
              isLive: true
            });
          }
        }
        if (initialTicks.length > 0) {
          handleTickUpdate(initialTicks, true);
        }
      })
      .catch(() => {});

    return () => {
      isUnmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (ws) {
        try { ws.close(); } catch {}
      }
    };
  }, [handleTickUpdate]);

  const subscribeSymbol = useCallback((symbol: string) => {
    if (!symbol) return;
    const clean = symbol.trim().toUpperCase();
    activeSymbolsRef.current.add(clean);

    fetch('/api/stream/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol: clean })
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

  const syncQuote = useCallback((quote: Partial<LiveTick> & { symbol: string; price: number }) => {
    if (!quote || !quote.symbol || typeof quote.price !== 'number' || quote.price <= 0) return;
    setTicks(prev => {
      const existing = prev[quote.symbol];
      // Don't overwrite live real-time Binance ticks with stale REST snapshots
      if (existing && existing.isLive && quote.symbol.includes('-USD') && existing.price > 0) {
        return prev;
      }
      if (!existing || existing.price <= 0 || Math.abs(existing.price - quote.price) / quote.price > 0.03 || (!existing.isLive && existing.price !== quote.price)) {
        return {
          ...prev,
          [quote.symbol]: {
            symbol: quote.symbol,
            price: quote.price,
            previousClose: quote.previousClose || quote.price,
            change: quote.change ?? (existing?.change || 0),
            changePercent: quote.changePercent ?? (existing?.changePercent || 0),
            dayHigh: quote.dayHigh || Math.max(existing?.dayHigh || 0, quote.price),
            dayLow: quote.dayLow || Math.min(existing?.dayLow || quote.price, quote.price),
            volume: quote.volume ?? existing?.volume ?? 0,
            timestamp: quote.timestamp || Date.now(),
            source: quote.source || existing?.source,
            isLive: existing ? existing.isLive : true,
            flash: null
          }
        };
      }
      return prev;
    });
  }, []);

  return (
    <MarketStreamContext.Provider
      value={{
        ticks,
        connectionStatus,
        isMarketLive,
        subscribeSymbol,
        getQuote,
        syncQuote,
      }}
    >
      {children}
    </MarketStreamContext.Provider>
  );
};

export const useMarketStream = () => useContext(MarketStreamContext);

// Hook to get a reactive live quote for a specific symbol
export function useLivePrice(symbol: string, initialQuote?: any) {
  const { ticks, subscribeSymbol, isMarketLive, connectionStatus, syncQuote } = useMarketStream();

  useEffect(() => {
    if (symbol) subscribeSymbol(symbol);
  }, [symbol, subscribeSymbol]);

  useEffect(() => {
    if (symbol && initialQuote && typeof initialQuote.price === 'number' && initialQuote.price > 0) {
      syncQuote({
        symbol,
        price: initialQuote.price,
        previousClose: initialQuote.previousClose,
        change: initialQuote.change,
        changePercent: initialQuote.changePercent,
        dayHigh: initialQuote.dayHigh,
        dayLow: initialQuote.dayLow,
        volume: initialQuote.volume,
        timestamp: initialQuote.timestampEpoch ? initialQuote.timestampEpoch * 1000 : initialQuote.timestamp,
        source: initialQuote.source
      });
    }
  }, [symbol, initialQuote?.price, syncQuote]);

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
        timestamp: liveTick?.timestamp,
        source: liveTick?.source || initialQuote?.source,
    flash,
    isMarketLive,
    connectionStatus,
    isTickLive: !!liveTick?.isLive
  };
}
