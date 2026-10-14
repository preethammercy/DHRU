// DHRU.AI - Market Selection Gateway Modal
// Lets user select between Indian Financial Markets (NSE/BSE) and Cryptocurrency Markets.
// Professional institutional FinTech design with 3D badges and smooth animations.

import React from 'react';
import { useAuth, MarketMode } from '../../context/AuthContext';
import { ShieldCheck, CheckCircle2, ArrowRight, Zap, X, Coins } from 'lucide-react';

interface MarketSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode?: (mode: MarketMode) => void;
}

export const MarketSelectorModal: React.FC<MarketSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectMode
}) => {
  const { marketMode, setMarketMode, user } = useAuth();

  if (!isOpen) return null;

  const handleSelect = (mode: MarketMode) => {
    setMarketMode(mode);
    if (onSelectMode) onSelectMode(mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-[#0A101D] border border-slate-200 dark:border-[#1E293B] rounded-3xl shadow-2xl overflow-hidden transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Welcome User Banner */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-400 border border-blue-200/80 dark:border-blue-800/60">
              <Zap className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 fill-current" />
              {user ? `Active Trader: ${user.displayName}` : 'Active Gateway Session'}
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              ₹10,00,000 Paper Capital Allocated
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Choose Your Trading Desk
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
            Switch between Indian equities & derivatives or international 24/7 cryptocurrency markets.
          </p>

          {/* Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            
            {/* Card 1: Indian Financial Markets */}
            <div
              onClick={() => handleSelect('indian')}
              className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl ${
                marketMode === 'indian'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 ring-4 ring-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-blue-400'
              }`}
            >
              {marketMode === 'indian' && (
                <div className="absolute top-4 right-4 text-blue-600 dark:text-cyan-400">
                  <CheckCircle2 className="w-5 h-5 fill-blue-600 text-white dark:fill-cyan-400 dark:text-slate-950" />
                </div>
              )}

              {/* 3D-styled Badge */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 mb-4 group-hover:scale-105 transition-transform">
                <span className="text-2xl font-black drop-shadow">🇮🇳</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-orange-600 dark:text-orange-400">
                  NSE & BSE DIRECT
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Indian Markets
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Exclusively Nifty 50, Sensex, Bank Nifty, 2,600+ equities, F&O options, and Indian sector heatmaps in ₹ INR.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-cyan-400">
                <span>Enter Indian Desk (₹)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Cryptocurrency 24/7 Global Desk */}
            <div
              onClick={() => handleSelect('crypto')}
              className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-xl ${
                marketMode === 'crypto'
                  ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/20 ring-4 ring-purple-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:border-purple-400'
              }`}
            >
              {marketMode === 'crypto' && (
                <div className="absolute top-4 right-4 text-purple-600 dark:text-purple-400">
                  <CheckCircle2 className="w-5 h-5 fill-purple-600 text-white dark:fill-purple-400 dark:text-slate-950" />
                </div>
              )}

              {/* 3D-styled Badge */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20 mb-4 group-hover:scale-105 transition-transform">
                <Coins className="w-7 h-7 drop-shadow" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-purple-600 dark:text-purple-400">
                  GLOBAL 24/7 TRADING
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                  Crypto Markets
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Exclusively Bitcoin, Ethereum, Solana, XRP, BNB, Doge, SUI, Cardano, Avalanche, and 20+ cryptos in $ USD.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                <span>Enter Crypto Desk ($)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>

          {/* Quick Info Footer */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Free Paper Margin: <strong>₹10,00,000 INR</strong> ($12,000 USD auto-converted for crypto)</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">Instant toggle anytime from the top bar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
