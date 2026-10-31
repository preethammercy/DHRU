import React from 'react';

interface Props {
  symbol: string;
  initialReport: unknown;
}

export const GeminiReport: React.FC<Props> = ({ symbol }) => (
  <section className="space-y-2 border-t border-slate-200 py-5 dark:border-slate-800">
    <h2 className="text-base font-semibold text-slate-950 dark:text-white">Analysis report paused</h2>
    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
      DHRU has not validated a report model for {symbol}. Numeric targets, confidence scores and trade recommendations are hidden.
    </p>
    <p className="text-xs text-slate-500">The technical indicators above describe historical market data only.</p>
  </section>
);
