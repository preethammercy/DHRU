import React from 'react';
import { X } from 'lucide-react';

interface LivePredictionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrade: (symbol: string, side: 'BUY' | 'SELL', price?: number) => void;
}

export const LivePredictionsModal: React.FC<LivePredictionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-6" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="signals-paused-title"
        className="w-full max-w-lg space-y-4 rounded-t-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-[#181B21] sm:rounded-xl"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Model status</p>
            <h2 id="signals-paused-title" className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Signals are paused</h2>
          </div>
          <button onClick={onClose} className="min-h-11 min-w-11 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close">
            <X className="mx-auto h-5 w-5" />
          </button>
        </div>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          DHRU does not have an out-of-sample record for its signal rules. Entry levels, targets and confidence scores are hidden until a reproducible evaluation is available.
        </p>
        <p className="text-xs text-slate-500">This page will show measured historical results only. It will not recommend trades.</p>
        <div className="flex justify-end">
          <button onClick={onClose} className="min-h-11 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">Close</button>
        </div>
      </section>
    </div>
  );
};
