// DHRU.AI - Market Selection Gateway Modal
// Lets user select between Indian Financial Markets (NSE/BSE) and Cryptocurrency Markets.
// Professional institutional FinTech design with 3D badges and smooth animations.

import React from 'react';
import { createPortal } from 'react-dom';
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
  if (typeof document === 'undefined') return null;

  const handleSelect = (mode: MarketMode) => {
    setMarketMode(mode);
    if (onSelectMode) onSelectMode(mode);
    onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-surface-2  animate-in fade-in duration-200"
      style={{ zIndex: 99999 }}
    >
      <div 
        className="relative w-full max-w-2xl bg-surface dark:bg-surface border border-line dark:border-line rounded-3xl  overflow-hidden transition-all transform scale-100 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Glow */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-brand-fill   " />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-ink-3 hover:text-ink-2 dark:hover:text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8">
          {/* Welcome User Banner */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand border border-line dark:border-line">
              <Zap className="w-3.5 h-3.5 text-brand dark:text-brand fill-current" />
              {user ? `Active Trader: ${user.displayName}` : 'Active Gateway Session'}
            </span>
            <span className="inline-flex items-center gap-1 text-ink font-mono font-medium text-pos dark:text-pos">
              <ShieldCheck className="w-3.5 h-3.5" />
              {marketMode === 'crypto' ? '$12,000 USD paper capital' : '₹10,00,000 INR paper capital'}
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-ink dark:text-ink tracking-tight">
            Choose Your Trading Desk
          </h2>
          <p className="text-sm text-ink-2 dark:text-ink-3 mt-1 max-w-lg">
            Choose an isolated Indian market portfolio in INR or a cryptocurrency portfolio in USD.
          </p>

          {/* Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            
            {/* Card 1: Indian Financial Markets */}
            <div
              onClick={() => handleSelect('indian')}
              className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover: ${
                marketMode === 'indian'
                  ? 'border-line bg-surface-2 dark:bg-brand-fill ring-4 ring-brand'
                  : 'border-line dark:border-line bg-surface-2 dark:bg-surface-2 hover:border-line'
              }`}
            >
              {marketMode === 'indian' && (
                <div className="absolute top-4 right-4 text-brand dark:text-brand">
                  <CheckCircle2 className="w-5 h-5 fill-blue-600 text-ink dark:fill-cyan-400 dark:text-ink" />
                </div>
              )}

              {/* 3D-styled Badge */}
              <div className="w-14 h-14 rounded-2xl bg-brand-fill    flex items-center justify-center text-on-brand   mb-4 group-hover:scale-105 transition-transform">
                <span className="text-2xl font-black drop-shadow">🇮🇳</span>
              </div>

              <div className="space-y-1">
                <span className="text-ink uppercase font-mono font-bold tracking-wider text-warn dark:text-warn">
                  NSE & BSE DIRECT
                </span>
                <h3 className="text-lg font-extrabold text-ink dark:text-ink">
                  Indian Markets
                </h3>
                <p className="text-xs text-ink-2 dark:text-ink-3 leading-relaxed">
                  Exclusively Nifty 50, Sensex, Bank Nifty, 2,600+ equities, F&O options, and Indian sector heatmaps in ₹ INR.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-line dark:border-line flex items-center justify-between text-xs font-bold text-brand dark:text-brand">
                <span>Enter Indian Desk (₹)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: Cryptocurrency 24/7 Global Desk */}
            <div
              onClick={() => handleSelect('crypto')}
              className={`group relative p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover: ${
                marketMode === 'crypto'
                  ? 'border-line bg-surface-2 dark:bg-surface-2 ring-4 ring-ai'
                  : 'border-line dark:border-line bg-surface-2 dark:bg-surface-2 hover:border-line'
              }`}
            >
              {marketMode === 'crypto' && (
                <div className="absolute top-4 right-4 text-ai dark:text-ai">
                  <CheckCircle2 className="w-5 h-5 fill-purple-600 text-ink dark:fill-purple-400 dark:text-ink" />
                </div>
              )}

              {/* 3D-styled Badge */}
              <div className="w-14 h-14 rounded-2xl bg-brand-fill   to-pink-500 flex items-center justify-center text-on-brand   mb-4 group-hover:scale-105 transition-transform">
                <Coins className="w-7 h-7 drop-shadow" />
              </div>

              <div className="space-y-1">
                <span className="text-ink uppercase font-mono font-bold tracking-wider text-ai dark:text-ai">
                  GLOBAL 24/7 TRADING
                </span>
                <h3 className="text-lg font-extrabold text-ink dark:text-ink">
                  Crypto Markets
                </h3>
                <p className="text-xs text-ink-2 dark:text-ink-3 leading-relaxed">
                  Exclusively Bitcoin, Ethereum, Solana, XRP, BNB, Doge, SUI, Cardano, Avalanche, and 20+ cryptos in $ USD.
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-line dark:border-line flex items-center justify-between text-xs font-bold text-ai dark:text-ai">
                <span>Enter Crypto Desk ($)</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>

          {/* Quick Info Footer */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-2 dark:text-ink-3 bg-surface-2 dark:bg-surface-2 p-3.5 rounded-xl border border-line dark:border-line">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pos animate-pulse" />
              <span>Separate paper balances: <strong>₹10,00,000 INR</strong> for India and <strong>$12,000 USD</strong> for crypto</span>
            </div>
            <span className="font-mono text-ink-2">Instant toggle anytime from the top bar</span>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
