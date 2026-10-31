import React from 'react';
import { Activity, ArrowRight, X } from 'lucide-react';

interface LivePredictionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenScenarios: () => void;
}

export const LivePredictionsModal: React.FC<LivePredictionsModalProps> = ({ isOpen, onClose, onOpenScenarios }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-6" role="presentation" onMouseDown={onClose}>
      <section role="dialog" aria-modal="true" aria-labelledby="scenario-modal-title" className="w-full max-w-lg space-y-4 rounded-t-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-[#181B21] sm:rounded-xl" onMouseDown={event => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Activity className="mt-1 h-5 w-5 text-slate-500" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Experimental · live market inputs</p>
              <h2 id="scenario-modal-title" className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">Live market scenarios</h2>
            </div>
          </div>
          <button onClick={onClose} className="min-h-11 min-w-11 rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close"><X className="mx-auto h-5 w-5" /></button>
        </div>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Recent-return and volatility ranges refresh from available candles and re-anchor to live prices. They are not calibrated probabilities or trade recommendations.</p>
        <div className="flex justify-end">
          <button onClick={onOpenScenarios} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">View scenarios <ArrowRight className="h-4 w-4" /></button>
        </div>
      </section>
    </div>
  );
};
