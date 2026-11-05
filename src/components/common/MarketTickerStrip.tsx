import React, { useEffect, useMemo } from 'react';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketStream } from '../../context/MarketStreamContext';
import { useAuth } from '../../context/AuthContext';

interface Props {
  onSelectStock?: (symbol: string) => void;
  onOpenPredictions?: () => void;
}

interface TickerDef {
  symbol: string;
  label: string;
  basePrice: number;
  baseChange: number;
}

const CRYPTO_TICKERS: TickerDef[] = [
  { symbol: 'BTC-USD', label: 'BTC', basePrice: 77370.05, baseChange: -0.83 },
  { symbol: 'ETH-USD', label: 'ETH', basePrice: 2267.07, baseChange: -0.01 },
  { symbol: 'SOL-USD', label: 'SOL', basePrice: 93.15, baseChange: -1.71 },
  { symbol: 'BNB-USD', label: 'BNB', basePrice: 701.31, baseChange: -1.77 },
  { symbol: 'XRP-USD', label: 'XRP', basePrice: 1.25, baseChange: 0.45 },
  { symbol: 'DOGE-USD', label: 'DOGE', basePrice: 0.0748, baseChange: -1.06 },
  { symbol: 'LINK-USD', label: 'LINK', basePrice: 11.20, baseChange: -3.21 },
  { symbol: 'ADA-USD', label: 'ADA', basePrice: 0.354, baseChange: -0.92 },
  { symbol: 'AVAX-USD', label: 'AVAX', basePrice: 25.40, baseChange: -2.10 },
  { symbol: 'SUI-USD', label: 'SUI', basePrice: 2.85, baseChange: 3.40 },
  { symbol: 'NEAR-USD', label: 'NEAR', basePrice: 4.10, baseChange: 1.25 },
  { symbol: 'PEPE-USD', label: 'PEPE', basePrice: 0.0000094, baseChange: 4.12 }
];

const INDIAN_TICKERS: TickerDef[] = [
  { symbol: '^NSEI', label: 'NIFTY 50', basePrice: 24148.20, baseChange: 0.35 },
  { symbol: '^BSESN', label: 'SENSEX', basePrice: 77099.55, baseChange: 0.28 },
  { symbol: '^NSEBANK', label: 'BANK NIFTY', basePrice: 51820.40, baseChange: -0.15 },
  { symbol: 'RELIANCE.NS', label: 'RELIANCE', basePrice: 1245.50, baseChange: 1.20 },
  { symbol: 'TCS.NS', label: 'TCS', basePrice: 4120.00, baseChange: -0.40 },
  { symbol: 'HDFCBANK.NS', label: 'HDFCBANK', basePrice: 1780.10, baseChange: 0.85 },
  { symbol: 'INFY.NS', label: 'INFY', basePrice: 1850.25, baseChange: 0.60 },
  { symbol: 'ICICIBANK.NS', label: 'ICICIBANK', basePrice: 1290.00, baseChange: 1.10 },
  { symbol: 'SBIN.NS', label: 'SBIN', basePrice: 810.00, baseChange: 0.95 },
  { symbol: 'ITC.NS', label: 'ITC', basePrice: 485.00, baseChange: 0.20 },
  { symbol: 'BHARTIARTL.NS', label: 'BHARTIARTL', basePrice: 1610.00, baseChange: 0.75 }
];

export const MarketTickerStrip: React.FC<Props> = ({ onSelectStock, onOpenPredictions }) => {
  const { marketMode } = useAuth();
  const { ticks, subscribeSymbol, isMarketLive } = useMarketStream();
  const isCrypto = marketMode === 'crypto';

  const tickerList = useMemo(() => {
    return isCrypto ? CRYPTO_TICKERS : INDIAN_TICKERS;
  }, [isCrypto]);

  useEffect(() => {
    tickerList.forEach(item => subscribeSymbol(item.symbol));
  }, [tickerList, subscribeSymbol]);

  return (
    <div className="w-full max-w-[100vw] bg-surface-2 dark:bg-[#080d19] border-y border-line text-ink select-none relative z-20 overflow-hidden shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto flex items-center h-8 sm:h-8.5 px-2 sm:px-4 min-w-0">
        
        {/* Left: AI Signals Badge */}
        <button
          onClick={onOpenPredictions}
          className="shrink-0 flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded bg-brand-fill hover:bg-brand-hover text-on-brand text-[10px] sm:text-[11px] font-black uppercase tracking-wider shadow-sm transition-all cursor-pointer mr-2 sm:mr-3 z-10 active:scale-95"
          title="Open AI Prediction Signals"
        >
          <Zap className="w-3 h-3 fill-amber-300 text-amber-300 animate-pulse" />
          <span>AI SIGNALS</span>
        </button>

        {/* Center: Infinite Marquee Scrolling Container */}
        <div className="flex-1 overflow-hidden relative mask-fade-edges min-w-0">
          <div className="animate-marquee flex items-center gap-5 sm:gap-7 whitespace-nowrap text-xs font-mono py-0.5">
            {/* Render 2 identical arrays side-by-side for seamless infinite scroll */}
            {[...tickerList, ...tickerList].map((item, idx) => {
              const tick = ticks[item.symbol];
              const price = tick?.price && tick.price > 0 ? tick.price : item.basePrice;
              const changePercent = tick?.changePercent !== undefined && tick.changePercent !== 0 ? tick.changePercent : item.baseChange;
              const isPositive = changePercent >= 0;
              const currSym = isCrypto ? '$' : '₹';

              const formatPrice = (p: number) => {
                if (p < 0.001) return p.toFixed(7);
                if (p < 1) return p.toFixed(4);
                if (p >= 1000) return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                return p.toFixed(2);
              };

              return (
                <button
                  key={`${item.symbol}-${idx}`}
                  onClick={() => onSelectStock && onSelectStock(item.symbol)}
                  className="flex items-center gap-1.5 hover:bg-surface-3 dark:hover:bg-[#111c33] px-2 py-0.5 rounded transition-colors cursor-pointer group shrink-0"
                  title={`View ${item.label} real-time chart and intelligence`}
                >
                  <span className="font-bold text-ink-2 dark:text-[#cbd5e1] group-hover:text-brand dark:group-hover:text-[#38bdf8] transition-colors">
                    {item.label}
                  </span>
                  <span className="font-semibold text-ink dark:text-white">
                    {currSym}{formatPrice(price)}
                  </span>
                  <span className={`text-[11px] font-bold flex items-center ${isPositive ? 'text-pos dark:text-[#22c55e]' : 'text-neg dark:text-[#ef4444]'}`}>
                    {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Live Market Desk Status */}
        <div className={`shrink-0 hidden sm:flex items-center gap-1.5 pl-3 border-l border-line ml-2 text-[10px] sm:text-xs font-bold font-mono ${
          isCrypto || isMarketLive ? 'text-pos dark:text-[#22c55e]' : 'text-ink-3 dark:text-[#94a3b8]'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${
            isCrypto || isMarketLive ? 'bg-pos dark:bg-[#22c55e] animate-pulse' : 'bg-surface-3 dark:bg-[#94a3b8]'
          }`} />
          <span className="tracking-wider uppercase">
            {isCrypto ? 'CRYPTO 24/7' : isMarketLive ? 'NSE/BSE LIVE' : 'NSE/BSE CLOSED (15:30 Close)'}
          </span>
        </div>

      </div>
    </div>
  );
};
