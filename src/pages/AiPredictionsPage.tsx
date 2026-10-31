import React from 'react';

interface Props {
  onSelectStock: (symbol: string) => void;
  onTradeStock?: (symbol: string) => void;
}

export const AiPredictionsPage: React.FC<Props> = () => (
  <section className="max-w-2xl space-y-3 border-b border-slate-200 pb-6 dark:border-slate-800">
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Model status</p>
    <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Forecasts are paused</h1>
    <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
      The current scenario rules do not have a measured out-of-sample record. Price targets, direction probabilities and confidence scores are hidden until they can be compared with a documented baseline.
    </p>
    <p className="text-xs text-slate-500">
      Technical indicators describe historical prices. They do not establish a future price or a trading recommendation.
    </p>
  </section>
);
