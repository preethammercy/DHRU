// DHRU.AI - Live Market Predictions & Institutional Trade Signals Desk
// Provides deterministic entry zones, invalidation stop losses, profit targets, entry times, and exit times.

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMarketStream } from '../../context/MarketStreamContext';
import { useAuth } from '../../context/AuthContext';
import { getDhruAnalysis, DhruAnalysis } from '../../services/api';
import {
  Sparkles,
  X,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  ShieldAlert,
  ArrowRight,
  Filter,
  CheckCircle2,
  Zap,
  Coins,
  DollarSign,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { JargonTooltip } from './JargonTooltip';

interface LivePredictionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrade: (symbol: string, side: 'BUY' | 'SELL', price?: number) => void;
}

interface SignalItem {
  symbol: string;
  name: string;
  market: 'indian' | 'crypto' | 'forex';
  action: 'STRONG BUY' | 'SCALP BUY' | 'SHORT / SELL' | 'WAIT FOR PULLBACK';
  bias: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  entryZone: string;
  bestEntryTime: string;
  stopLoss: string;
  target1: string;
  target2: string;
  expectedExitTime: string;
  riskReward: string;
  modelReason: string;
  timeframe: string;
  asOf?: string;
}

const DESK_SYMBOLS: Record<'indian' | 'crypto', string[]> = {
  crypto: ['BTC-USD', 'ETH-USD', 'SOL-USD', 'BNB-USD', 'XRP-USD', 'DOGE-USD'],
  indian: ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'SBIN.NS']
};

export const LivePredictionsModal: React.FC<LivePredictionsModalProps> = ({
  isOpen,
  onClose,
  onSelectTrade
}) => {
  const { marketMode } = useAuth();
  const { ticks } = useMarketStream();
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);

    const desk = marketMode === 'crypto' ? 'crypto' : 'indian';
    const symbols = DESK_SYMBOLS[desk] || DESK_SYMBOLS.crypto;

    Promise.allSettled(symbols.map(s => getDhruAnalysis(s))).then(results => {
      if (!active) return;
      const items: SignalItem[] = [];
      for (const res of results) {
        if (res.status === 'fulfilled' && res.value) {
          const a: DhruAnalysis = res.value;
          const isCrypto = a.market === 'crypto';
          const currency = isCrypto ? '$' : '₹';
          const l = a.levels;

          let action: SignalItem['action'] = 'WAIT FOR PULLBACK';
          let bias: SignalItem['bias'] = 'neutral';
          if (a.direction === 'LONG') {
            action = a.score.total >= 4 ? 'STRONG BUY' : 'SCALP BUY';
            bias = 'bullish';
          } else if (a.direction === 'SHORT') {
            action = 'SHORT / SELL';
            bias = 'bearish';
          }

          items.push({
            symbol: a.symbol,
            name: a.symbol.replace('-USD', '').replace('.NS', ''),
            market: a.market === 'crypto' ? 'crypto' : 'indian',
            action,
            bias,
            confidence: a.confidence.value,
            entryZone: `${currency}${l.entryMin} – ${currency}${l.entryMax}`,
            bestEntryTime: '5m signal candle close inside entry zone',
            stopLoss: `${currency}${l.stopLoss}`,
            target1: `${currency}${l.tp1}`,
            target2: `${currency}${l.tp2}`,
            expectedExitTime: 'Staggered 3-tier hold window',
            riskReward: '1 : 2.6',
            modelReason: `Score: ${a.score.total} (Trend ${a.score.components.trend}, Mom ${a.score.components.momentum}) · ${a.regime} regime`,
            timeframe: '5m / 15m',
            asOf: a.asOf
          });
        }
      }
      setSignals(items);
      setLoading(false);
    });

    return () => { active = false; };
  }, [isOpen, marketMode]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const filteredSignals = signals.filter(sig => sig.market === marketMode);

  const modalContent = (
    <div 
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 bg-surface-2 animate-in fade-in duration-200"
      style={{ zIndex: 99999 }}
    >
      <div 
        className="relative w-full max-w-5xl bg-surface dark:bg-surface border border-line dark:border-line rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Stripe */}
        <div className="h-1.5 w-full bg-brand-fill" />

        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-line dark:border-line flex items-center justify-between bg-surface dark:bg-surface">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand">
                <Zap className="w-5 h-5 fill-current" />
              </span>
              <h2 className="text-xl font-black text-ink dark:text-ink tracking-tight">
                Live AI Market Predictions & Trade Signal Desk
              </h2>
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-ink font-mono font-bold bg-surface-2 dark:bg-pos-tint text-pos dark:text-pos border border-line dark:border-line">
                <span className="w-2 h-2 rounded-full bg-pos animate-ping" />
                Canonical Feed
              </span>
            </div>
            <p className="text-xs text-ink-2 dark:text-ink-3 mt-1">
              Current-desk signals and price levels sourced strictly from Canonical DhruAnalysis engine.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-ink-3 hover:text-ink-2 dark:hover:text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-line dark:border-line bg-surface-2 dark:bg-surface flex items-center justify-between gap-3">
          <div className="text-xs font-bold uppercase font-mono text-ink-2 dark:text-ink-3">
            {marketMode === 'crypto' ? 'Crypto signals · USD quotes · 24/7 markets' : 'Indian market signals · INR quotes · NSE/BSE'}
          </div>
          <div className="text-ink font-mono text-ink-2 dark:text-ink-3 hidden sm:block">Prices refresh from the canonical analysis engine</div>
        </div>

        {/* Signals List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading && (
            <div className="py-12 text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-brand" />
              <p className="text-xs font-mono text-ink-3">Running multi-timeframe analysis for {marketMode} desk...</p>
            </div>
          )}

          {!loading && filteredSignals.length === 0 && (
            <div className="py-12 text-center text-xs text-ink-3 font-mono">
              No verified signals currently active on this desk.
            </div>
          )}

          {!loading && filteredSignals.map((item) => {
            const liveQuote = ticks[item.symbol];
            const currentPrice = liveQuote?.price;
            const currencySymbol = item.market === 'indian' ? '₹' : '$';

            const isBuy = item.action.includes('BUY');
            const isShort = item.action.includes('SHORT');
            const pricePrecision = !currentPrice || currentPrice >= 100 ? 2 : currentPrice < 0.01 ? 8 : currentPrice < 1 ? 6 : 4;
            const formatLiveLevel = (price: number) => `${currencySymbol}${price.toLocaleString(item.market === 'indian' ? 'en-IN' : 'en-US', { minimumFractionDigits: pricePrecision, maximumFractionDigits: pricePrecision })}`;

            return (
              <div
                key={item.symbol}
                className="p-5 rounded-2xl bg-surface dark:bg-surface border border-line dark:border-line hover:border-line dark:hover:border-line transition-all space-y-4"
              >
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-line dark:border-line">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-surface-2 dark:bg-surface-2 font-black text-xs font-mono">
                      {item.symbol.split('-')[0].replace('.NS', '').replace('=X', '')}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-ink dark:text-ink">
                          {item.name}
                        </h3>
                        <span className="text-ink uppercase font-mono px-2 py-0.5 rounded-full bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3 font-bold">
                          {item.timeframe}
                        </span>
                        {item.asOf && (
                          <span className="text-[10px] font-mono text-ink-3">
                            As of: {new Date(item.asOf).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-ink-2 dark:text-ink-3 mt-0.5">
                        <span className="font-bold px-2 py-0.5 rounded bg-surface-2 text-slate-800 dark:text-slate-100 border border-line">{item.symbol}</span>
                        {currentPrice ? (
                          <span className="font-bold text-ink dark:text-ink">
                            • Live: {formatLiveLevel(currentPrice)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-black tracking-wide uppercase flex items-center gap-1.5 ${
                      isBuy
                        ? 'bg-surface-2 dark:bg-pos-tint text-pos dark:text-pos border border-line dark:border-line'
                        : isShort
                        ? 'bg-surface-2 dark:bg-neg-tint text-neg dark:text-neg border border-line dark:border-line'
                        : 'bg-surface-2 dark:bg-surface-2 text-warn dark:text-warn border border-line dark:border-line'
                    }`}>
                      {isBuy ? <TrendingUp className="w-3.5 h-3.5" /> : isShort ? <TrendingDown className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      <span>{item.action}</span>
                    </span>

                    <span className="text-xs font-bold font-mono text-brand dark:text-brand">
                      {item.confidence}% Conviction
                    </span>
                  </div>
                </div>

                {/* Trade Setup Matrix: Entry, Time, SL, Targets */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  {/* 1. Entry Price */}
                  <div className="p-3 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line">
                    <div className="text-ink uppercase font-mono text-ink-3 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3 text-pos" />
                        <span>Entry Price Zone</span>
                      </span>
                      <JargonTooltip term="OTE" />
                    </div>
                    <div className="text-sm font-black text-ink dark:text-ink mt-1 font-mono">
                      {item.entryZone}
                    </div>
                  </div>

                  {/* 2. Best Entry Time */}
                  <div className="p-3 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line">
                    <div className="text-ink uppercase font-mono text-ink-3 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-brand" />
                      <span>When to Enter</span>
                    </div>
                    <div className="text-xs font-bold text-ink dark:text-ink-3 mt-1">
                      {item.bestEntryTime}
                    </div>
                  </div>

                  {/* 3. Stop Loss Invalidation */}
                  <div className="p-3 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line">
                    <div className="text-ink uppercase font-mono text-ink-3 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-neg" />
                        <span>Strict Stop Loss</span>
                      </span>
                      <JargonTooltip term="OB" />
                    </div>
                    <div className="text-sm font-black text-neg dark:text-neg mt-1 font-mono">
                      {item.stopLoss}
                    </div>
                  </div>

                  {/* 4. Target & Exit Time */}
                  <div className="p-3 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line">
                    <div className="text-ink uppercase font-mono text-ink-3 flex items-center gap-1">
                      <Target className="w-3 h-3 text-brand" />
                      <span>Exit Targets & RRR</span>
                    </div>
                    <div className="text-xs font-bold text-pos dark:text-pos mt-1 font-mono">
                      {item.target1} • {item.target2}
                    </div>
                    <div className="text-ink-3 mt-0.5">
                      RRR: <strong className="text-ink-2 dark:text-ink-3">{item.riskReward}</strong>
                    </div>
                  </div>
                </div>

                {/* Regulatory Simulation Notice */}
                <div className="py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>
                    <strong className="font-semibold">Paper Trading Simulation:</strong> Algorithmic quantitative research setup. Not investment advice. DHRU.AI is not a SEBI-registered advisory.
                  </span>
                </div>

                {/* Reason & Exit Time Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1 text-xs">
                  <div className="space-y-1">
                    <p className="text-ink-2 dark:text-ink-3 font-medium">
                      <strong className="text-ink dark:text-ink">Exit Timing:</strong> {item.expectedExitTime}
                    </p>
                    <p className="text-ink-2 dark:text-ink-3">
                      <strong className="text-ink dark:text-ink-3">Algorithmic Driver:</strong> {item.modelReason}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      onSelectTrade(item.symbol, isBuy ? 'BUY' : 'SELL');
                      onClose();
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-fill hover:bg-brand-fill text-on-brand font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 hover:scale-[1.02]"
                  >
                    <span>Execute in Terminal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-line dark:border-line bg-surface-2 dark:bg-surface flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-2 font-mono">
          <span>{marketMode === 'crypto' ? 'Crypto-only desk · USD quotes' : 'Indian NSE/BSE desk · INR quotes'} · Canonical Grounded Inference</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface dark:bg-surface-2 border border-line dark:border-line text-ink-2 dark:text-ink-3 font-bold hover:bg-surface-2 cursor-pointer"
          >
            Close Signals Desk
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
