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
      onClick: () => onSelectNav('ai-predictions')
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      onClick: () => onSelectNav('profile')
    }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface dark:bg-surface  border-t border-line dark:border-line m3-elevation-3 transition-colors safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;

          if (item.isSpecial) {
            return (
              <button
                key={item.id}
                onClick={item.onClick}
                className="relative -top-3 flex flex-col items-center justify-center p-2.5 rounded-2xl bg-brand-fill text-white shadow-lg shadow-blue-500/25 ring-2 ring-line dark:ring-line pressable active:scale-90 transition-all cursor-pointer"
                title="Open Live Trading Terminal"
              >
                <div className="relative">
                  <Icon className="w-5 h-5 text-white" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-300 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-sky-300" />
                </div>
                <span className="text-[10px] text-white font-black tracking-tight mt-0.5 font-mono uppercase">Trade</span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[52px] pressable ${
                isActive
                  ? 'text-brand dark:text-brand font-bold scale-105'
                  : 'text-ink-2 dark:text-ink-3 hover:text-ink dark:hover:text-ink-3 active:scale-95'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 transition-transform ${isActive ? 'scale-110 text-brand dark:text-brand' : ''}`} />
              <span className="text-ink tracking-tight">{item.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-brand-fill dark:bg-surface-2 mt-0.5 animate-zoom-in" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
