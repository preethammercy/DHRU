// DHRU.AI - Live Market Ticker Strip
// A continuously scrolling tape of live quotes under the main navigation.

import React, { useEffect, useMemo } from 'react';
import { useMarketStream } from '../../context/MarketStreamContext';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, TrendingDown, Zap } from 'lucide-react';

interface MarketTickerProps {
  onSelectStock?: (symbol: string) => void;
  onOpenPredictions?: () => void;
}

const INDIAN_TICKERS = [
  { symbol: '^NSEI', label: 'NIFTY 50' },
  { symbol: '^BSESN', label: 'SENSEX' },
  { symbol: '^NSEBANK', label: 'BANK NIFTY' },
  { symbol: 'RELIANCE.NS', label: 'RELIANCE' },
  { symbol: 'TCS.NS', label: 'TCS' },
  { symbol: 'HDFCBANK.NS', label: 'HDFC BANK' },
  { symbol: 'INFY.NS', label: 'INFOSYS' },
  { symbol: 'ICICIBANK.NS', label: 'ICICI BANK' },
  { symbol: 'SBIN.NS', label: 'SBI' },
  { symbol: 'INR=X', label: 'USD/INR' }
];

const CRYPTO_TICKERS = [
  { symbol: 'BTC-USD', label: 'BTC' },
  { symbol: 'ETH-USD', label: 'ETH' },
  { symbol: 'SOL-USD', label: 'SOL' },
  { symbol: 'BNB-USD', label: 'BNB' },
  { symbol: 'XRP-USD', label: 'XRP' },
  { symbol: 'ADA-USD', label: 'ADA' },
  { symbol: 'AVAX-USD', label: 'AVAX' },
  { symbol: 'LINK-USD', label: 'LINK' },
  { symbol: 'DOGE-USD', label: 'DOGE' }
];

function priceDecimals(price: number): number {
  if (!Number.isFinite(price)) return 2;
  if (price >= 1000) return 2;
  if (price >= 1) return 2;
  if (price >= 0.01) return 4;
  return 6;
}

export const MarketTicker: React.FC<MarketTickerProps> = ({ onSelectStock, onOpenPredictions }) => {
  const { marketMode } = useAuth();
  const { ticks, subscribeSymbol } = useMarketStream();

  const tickers = marketMode === 'crypto' ? CRYPTO_TICKERS : INDIAN_TICKERS;

  useEffect(() => {
    tickers.forEach(item => subscribeSymbol(item.symbol));
  }, [tickers, subscribeSymbol]);

  const rows = useMemo(() => tickers.map(item => {
    const tick = ticks[item.symbol];
    return {
      ...item,
      price: tick?.price ?? null,
      changePercent: tick?.changePercent ?? null,
      isLive: Boolean(tick?.isLive),
      status: tick?.status || 'AWAITING'
    };
  }), [tickers, ticks]);

  // Duplicate the set so the marquee loops seamlessly.
  const loop = [...rows, ...rows];

  return (
    <div className="w-full border-b border-line bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-3 sm:px-6 lg:px-8">
        <button
          onClick={onOpenPredictions}
          className="hidden sm:flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-sm hover:shadow-md hover:-translate-y-px transition-all cursor-pointer"
        >
          <Zap className="w-3 h-3" />
          AI Signals
        </button>
        <div className="marquee flex-1 overflow-hidden py-1.5">
          <div className="ticker-track gap-5">
            {loop.map((item, index) => {
              const up = (item.changePercent ?? 0) >= 0;
              const currency = item.symbol.endsWith('-USD') ? '$' : item.symbol.includes('=X') ? '₹' : '₹';
              return (
                <button
                  key={`${item.symbol}-${index}`}
                  onClick={() => onSelectStock?.(item.symbol)}
                  className="group flex shrink-0 items-center gap-2 rounded-md px-1.5 py-0.5 text-[11px] hover:bg-surface-2 transition-colors cursor-pointer"
                >
                  <span className="font-mono font-bold text-ink-2 group-hover:text-brand transition-colors">{item.label}</span>
                  {item.price != null ? (
                    <>
                      <span className="font-mono font-bold text-ink tabular-nums">
                        {currency}{item.price.toLocaleString(item.symbol.endsWith('-USD') ? 'en-US' : 'en-IN', {
                          minimumFractionDigits: priceDecimals(item.price),
                          maximumFractionDigits: priceDecimals(item.price)
                        })}
                      </span>
                      <span className={`flex items-center gap-0.5 font-mono font-bold tabular-nums ${up ? 'text-pos' : 'text-neg'}`}>
                        {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {up ? '+' : ''}{(item.changePercent ?? 0).toFixed(2)}%
                      </span>
                    </>
                  ) : (
                    <span className="font-mono text-ink-3">{item.status === 'CLOSED' ? 'Closed' : 'Loading…'}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <span className="hidden md:flex shrink-0 items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-ink-3">
          <span className={`h-1.5 w-1.5 rounded-full ${marketMode === 'crypto' ? 'bg-pos animate-pulse' : 'bg-brand animate-pulse'}`} />
          {marketMode === 'crypto' ? 'Crypto 24/7' : 'NSE / BSE'}
        </span>
      </div>
    </div>
  );
};
