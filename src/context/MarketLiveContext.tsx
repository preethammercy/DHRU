import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export interface LiveQuote {
  symbol: string;
  name?: string;
  price: number;
  change?: number;
  changePercent?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  lastUpdated?: string;
  source?: string;
}

interface MarketLiveContextValue {
  connected: boolean;
  lastEventAt?: string;
  quotes: LiveQuote[];
  getQuote: (symbol: string) => LiveQuote | undefined;
}

const MarketLiveContext = createContext<MarketLiveContextValue>({
  connected: false,
  quotes: [],
  getQuote: () => undefined,
});

export const MarketLiveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [quotesMap, setQuotesMap] = useState<Record<string, LiveQuote>>({});
  const [lastEventAt, setLastEventAt] = useState<string | undefined>(undefined);
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef({ attempts: 0, timer: 0 as any });

  // Tick state to force re-render every second so UI displays up-to-date 'LIVE' timers
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      // Use the SSE endpoint we added on the server
      const url = '/api/market/stream';
      try {
        const es = new EventSource(url, { withCredentials: false } as any);
        esRef.current = es;

        es.addEventListener('open', () => {
          reconnectRef.current.attempts = 0;
          setConnected(true);
        });

        es.addEventListener('snapshot', (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data);
            const incoming: LiveQuote[] = payload.quotes || [];
            const map: Record<string, LiveQuote> = {};
            incoming.forEach(q => map[q.symbol] = q);
            if (isMounted) {
              setQuotesMap(map);
              setLastEventAt(new Date().toISOString());
            }
          } catch (err) {
            // ignore
          }
        });

        es.addEventListener('quotes', (e: MessageEvent) => {
          try {
            const payload = JSON.parse(e.data);
            const incoming: LiveQuote[] = payload.quotes || [];
            if (incoming.length === 0) return;
            setQuotesMap(prev => {
              const copy = { ...prev };
              for (const q of incoming) {
                // Protect against stale writes by checking lastUpdated if present
                const prevQ = copy[q.symbol];
                const prevTs = prevQ?.lastUpdated ? new Date(prevQ.lastUpdated).getTime() : 0;
                const newTs = q.lastUpdated ? new Date(q.lastUpdated).getTime() : Date.now();
                if (!prevQ || newTs >= prevTs) {
                  copy[q.symbol] = q;
                }
              }
              return copy;
            });
            setLastEventAt(new Date().toISOString());
          } catch (err) {
            // ignore
          }
        });

        es.addEventListener('error', () => {
          setConnected(false);
          // Let EventSource itself handle reconnect but add exponential fallback
          if (es.readyState === EventSource.CLOSED) {
            tryReconnect();
          }
        });

      } catch (err) {
        tryReconnect();
      }
    };

    const tryReconnect = () => {
      reconnectRef.current.attempts += 1;
      const backoff = Math.min(30000, 1000 * Math.pow(2, Math.min(6, reconnectRef.current.attempts)));
      if (reconnectRef.current.timer) clearTimeout(reconnectRef.current.timer);
      reconnectRef.current.timer = setTimeout(() => {
        connect();
      }, backoff);
    };

    connect();

    return () => {
      isMounted = false;
      if (esRef.current) {
        try { esRef.current.close(); } catch (e) { }
        esRef.current = null;
      }
      if (reconnectRef.current.timer) clearTimeout(reconnectRef.current.timer);
    };
  }, []);

  const quotes = Object.values(quotesMap);

  const value: MarketLiveContextValue = {
    connected,
    lastEventAt,
    quotes,
    getQuote: (symbol: string) => quotesMap[symbol]
  };

  return (
    <MarketLiveContext.Provider value={value}>
      {children}
    </MarketLiveContext.Provider>
  );
};

export const useMarketLive = () => useContext(MarketLiveContext);

export default MarketLiveContext;
