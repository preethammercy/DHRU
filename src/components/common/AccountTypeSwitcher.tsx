import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { useWallet } from '../../context/WalletContext';
import { ShieldCheck, Zap, Wallet } from 'lucide-react';

interface Props {
  compact?: boolean;
}

export const AccountTypeSwitcher: React.FC<Props> = ({ compact }) => {
  const { accountType, setAccountType } = useTrading();
  const { wallet, openDepositModal } = useWallet();

  if (compact) {
    return (
      <div className="inline-flex items-center p-0.5 rounded-xl bg-surface-2 border border-line text-[11px] font-mono font-bold select-none">
        <button
          type="button"
          onClick={() => setAccountType('demo')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
            accountType === 'demo'
              ? 'bg-amber-500 text-white shadow-sm'
              : 'text-ink-2 hover:text-ink'
          }`}
          title="Demo Paper Simulation (₹10,00,000 / $12,000)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-200" />
          <span>Demo</span>
        </button>
        <button
          type="button"
          onClick={() => setAccountType('real')}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
            accountType === 'real'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-ink-2 hover:text-ink'
          }`}
          title="Real Funds Account (UPI Balance)"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
          <span>Real</span>
        </button>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center p-1 rounded-2xl bg-surface-2 border border-line text-xs font-mono font-bold select-none">
      <button
        type="button"
        onClick={() => setAccountType('demo')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
          accountType === 'demo'
            ? 'bg-amber-500 text-white shadow-md font-black'
            : 'text-ink-2 hover:text-ink'
        }`}
        title="Switch to Demo Simulation Account (₹10L Paper Capital)"
      >
        <span className="w-2 h-2 rounded-full bg-amber-200 animate-pulse" />
        <span>Demo (Simulation)</span>
      </button>

      <button
        type="button"
        onClick={() => setAccountType('real')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
          accountType === 'real'
            ? 'bg-emerald-600 text-white shadow-md font-black'
            : 'text-ink-2 hover:text-ink'
        }`}
        title="Switch to Real Account (Live Wallet Funds)"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
        <span>Real Account</span>
        <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded font-mono ${
          accountType === 'real' ? 'bg-emerald-800/80 text-emerald-100' : 'bg-surface text-ink-2'
        }`}>
          ₹{wallet.tradingBalance.toLocaleString()}
        </span>
      </button>
    </div>
  );
};
