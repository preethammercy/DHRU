// DHRU.AI - Technical Indicator Scorecard Component
// Visual breakdown of calculated moving averages, oscillators, pivots, and detected patterns.

import React from 'react';
import { TechnicalIndicators } from '../../types';
import { Activity, Compass, ShieldCheck, AlertCircle, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

interface Props {
  technicals: TechnicalIndicators | null;
  currentPrice: number;
}

export const TechnicalScorecard: React.FC<Props> = ({ technicals, currentPrice }) => {
  if (!technicals) {
    return (
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-6 text-center text-ink-2 text-xs ">
        Technical indicators calculation requires at least 20 historical daily candles.
      </div>
    );
  }

  const { sma, ema, rsi, macd, bollinger, pivots, patterns, consensus, score, signals } = technicals;

  const isBuy = consensus.includes('Buy');
  const isSell = consensus.includes('Sell');

  return (
    <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-5  flex flex-col gap-5">
      {/* Header & Consensus Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line dark:border-line">
        <div>
          <h3 className="text-sm font-bold text-ink dark:text-ink-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-brand dark:text-brand" />
            Technical Indicators & Consensus Meter
          </h3>
          <p className="text-xs text-ink-2 dark:text-ink-3 mt-0.5">
            Aggregated mathematical alignment across moving averages and oscillators
          </p>
        </div>

        {/* Big Consensus Badge */}
        <div className={`px-4 py-2 rounded-xl border flex items-center gap-2.5 ${
          isBuy
            ? 'bg-surface-2 border-line text-pos dark:bg-pos-tint dark:border-line dark:text-pos'
            : isSell
            ? 'bg-surface-2 border-line text-neg dark:bg-neg-tint dark:border-line dark:text-neg'
            : 'bg-surface-2 border-line text-warn dark:bg-surface-2 dark:border-line dark:text-warn'
        }`}>
          {isBuy ? <ArrowUpRight className="w-5 h-5 text-pos" /> : isSell ? <ArrowDownRight className="w-5 h-5 text-neg" /> : <Compass className="w-5 h-5 text-warn" />}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">{consensus}</div>
            <div className="text-ink font-mono opacity-80">Composite Score: {score > 0 ? `+${score}` : score}</div>
          </div>
        </div>
      </div>

      {/* Grid of Key Technical Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Moving Averages Posture */}
        <div className="bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs font-semibold text-ink-2 dark:text-ink-3 mb-3 flex items-center justify-between">
            <span>Moving Averages</span>
            <span className="text-ink font-mono text-brand dark:text-brand">Trend Posture</span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-ink-2">SMA 20 (Short-Term):</span>
              <span className={sma.sma20 && currentPrice >= sma.sma20 ? 'text-pos font-semibold' : 'text-neg font-semibold'}>
                ₹{sma.sma20 ?? 'N/A'} {sma.sma20 && (currentPrice >= sma.sma20 ? '▲ Above' : '▼ Below')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-2">SMA 50 (Intermediate):</span>
              <span className={sma.sma50 && currentPrice >= sma.sma50 ? 'text-pos font-semibold' : 'text-neg font-semibold'}>
                ₹{sma.sma50 ?? 'N/A'} {sma.sma50 && (currentPrice >= sma.sma50 ? '▲ Above' : '▼ Below')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-2">SMA 200 (Major Trend):</span>
              <span className={sma.sma200 && currentPrice >= sma.sma200 ? 'text-pos font-semibold' : 'text-neg font-semibold'}>
                ₹{sma.sma200 ?? 'N/A'} {sma.sma200 && (currentPrice >= sma.sma200 ? '▲ Above' : '▼ Below')}
              </span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-line dark:border-line">
              <span className="text-ink-2">EMA 9 / 21 Cross:</span>
              <span className={ema.ema9 && ema.ema21 && ema.ema9 > ema.ema21 ? 'text-pos font-semibold' : 'text-neg font-semibold'}>
                {ema.ema9 && ema.ema21 ? (ema.ema9 > ema.ema21 ? 'Bullish (9 > 21)' : 'Bearish (9 < 21)') : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Oscillators (RSI & MACD) */}
        <div className="bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs font-semibold text-ink-2 dark:text-ink-3 mb-3 flex items-center justify-between">
            <span>Momentum Oscillators</span>
            <span className="text-ink font-mono text-brand dark:text-brand">RSI & MACD</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="text-ink-2">RSI (14-Day):</span>
                <span className="font-bold text-ink dark:text-ink-3">{rsi ?? 'N/A'}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-2 dark:bg-surface-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    rsi && rsi > 70 ? 'bg-neg' : rsi && rsi < 30 ? 'bg-pos' : 'bg-brand-fill dark:bg-surface-2'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, rsi || 50))}%` }}
                />
              </div>
              <div className="text-ink-2 mt-1">
                {rsi && rsi > 70 ? 'Overbought zone' : rsi && rsi < 30 ? 'Oversold zone' : 'Normal momentum corridor'}
              </div>
            </div>

            <div className="pt-2 border-t border-line dark:border-line font-mono space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-2">MACD Histogram:</span>
                <span className={macd && macd.histogram >= 0 ? 'text-pos font-semibold' : 'text-neg font-semibold'}>
                  {macd?.histogram ?? 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-2">Bollinger %B:</span>
                <span className="text-ink-2 dark:text-ink-3">{bollinger?.percentB ?? 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Pivot Points Floor Levels */}
        <div className="bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl p-4 flex flex-col justify-between">
          <div className="text-xs font-semibold text-ink-2 dark:text-ink-3 mb-3 flex items-center justify-between">
            <span>Support & Resistance Pivots</span>
            <span className="text-ink font-mono text-brand dark:text-brand">Floor Matrix</span>
          </div>

          {pivots ? (
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between items-center text-neg">
                <span>Resistance 2 (R2):</span>
                <span className="font-semibold">₹{pivots.r2}</span>
              </div>
              <div className="flex justify-between items-center text-neg">
                <span>Resistance 1 (R1):</span>
                <span className="font-semibold">₹{pivots.r1}</span>
              </div>
              <div className="flex justify-between items-center text-warn py-0.5 border-y border-line dark:border-line">
                <span>Central Pivot (PP):</span>
                <span className="font-bold">₹{pivots.pivot}</span>
              </div>
              <div className="flex justify-between items-center text-pos">
                <span>Support 1 (S1):</span>
                <span className="font-semibold">₹{pivots.s1}</span>
              </div>
              <div className="flex justify-between items-center text-pos">
                <span>Support 2 (S2):</span>
                <span className="font-semibold">₹{pivots.s2}</span>
              </div>
            </div>
          ) : (
            <div className="text-ink-2 text-xs">Pivots require session high/low/close data.</div>
          )}
        </div>
      </div>

      {/* Candlestick Pattern Detection Box */}
      {patterns && patterns.length > 0 && (
        <div className="p-3.5 rounded-xl bg-surface-2 dark:bg-brand-fill    border border-line dark:border-line">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-brand-fill dark:bg-surface-2 animate-pulse" />
            <span className="text-xs font-bold text-brand dark:text-brand uppercase tracking-wider">
              Candlestick Pattern Detected on Latest Bar:
            </span>
          </div>
          <div className="space-y-2">
            {patterns.map((p, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div>
                  <span className="font-bold text-ink dark:text-ink-3">{p.name}</span>
                  <span className="text-ink-2 ml-2">({p.type})</span>
                  <p className="text-ink-2 dark:text-ink-3 text-ink mt-0.5">{p.explanation}</p>
                </div>
                <span className="text-ink font-mono px-2 py-0.5 rounded bg-surface-2 dark:bg-surface-2 text-brand dark:text-brand border border-line dark:border-line shrink-0">
                  Reliability: {p.strength}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positive and Negative Technical Evidence Badges */}
      <div className="space-y-1.5 pt-2 border-t border-line dark:border-line">
        <div className="text-xs font-semibold text-ink-2 uppercase tracking-wider">
          Evidence Summary ({signals.length} Signals):
        </div>
        <div className="flex flex-wrap gap-2">
          {signals.map((sig, i) => (
            <span
              key={i}
              className={`text-xs px-2.5 py-1 rounded-lg border font-mono ${
                sig.includes('(+)')
                  ? 'bg-surface-2 text-pos border-line dark:bg-pos-tint dark:text-pos dark:border-line'
                  : sig.includes('(-)')
                  ? 'bg-surface-2 text-neg border-line dark:bg-neg-tint dark:text-neg dark:border-line'
                  : 'bg-surface-2 text-ink-2 border-line dark:bg-surface-2 dark:text-ink-3 dark:border-line'
              }`}
            >
              {sig}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
