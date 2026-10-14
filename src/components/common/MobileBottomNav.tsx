// DHRU.AI - Mobile Bottom Navigation Bar
// Designed with native app ergonomics (Robinhood / Zerodha Kite style).
// Fixed bottom tab strip visible strictly on mobile viewports (< lg).

import React from 'react';
import {
  LayoutDashboard,
  CandlestickChart,
  TrendingUp,
  Coins,
  Zap,
  User,
  Search
} from 'lucide-react';

interface MobileBottomNavProps {
  activeNav: string;
  onSelectNav: (page: string) => void;
  marketMode: 'indian' | 'crypto';
  onOpenSearch: () => void;
  onOpenPredictions: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeNav,
  onSelectNav,
  marketMode,
  onOpenSearch,
  onOpenPredictions,
}) => {
  const isCrypto = marketMode === 'crypto';

  const items = [
    {
      id: 'overview',
      label: 'Home',
      icon: LayoutDashboard,
      onClick: () => onSelectNav('overview')
    },
    {
      id: 'indices',
      label: isCrypto ? 'Assets' : 'Markets',
      icon: isCrypto ? Coins : TrendingUp,
      onClick: () => onSelectNav('indices')
    },
    {
      id: 'terminal',
      label: 'Terminal',
      icon: CandlestickChart,
      isSpecial: true,
      onClick: () => onSelectNav('terminal')
    },
    {
      id: 'signals',
      label: 'AI Signals',
      icon: Zap,
      onClick: onOpenPredictions
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      onClick: () => onSelectNav('profile')
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 dark:bg-[#070B14]/95 backdrop-blur-xl border-t border-slate-200/90 dark:border-[#1A2744] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)] transition-colors safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1.5 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;

          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="relative -top-3.5 flex flex-col items-center justify-center p-2 rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-500 text-white shadow-[0_6px_20px_rgba(37,99,235,0.45)] active:scale-95 transition-transform"
                title="Open Live Trading Terminal"
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[10px] font-black tracking-tight mt-0.5 font-mono uppercase">Trade</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all cursor-pointer min-w-[56px] ${
                isActive
                  ? 'text-blue-600 dark:text-cyan-400 font-bold scale-105'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 active:scale-95'
              }`}
            >
              <Icon className={`w-4 h-4 mb-1 transition-transform ${isActive ? 'scale-110 text-blue-600 dark:text-cyan-400' : ''}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-cyan-400 mt-0.5 animate-zoom-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
