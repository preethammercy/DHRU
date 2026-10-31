// DHRU.AI - Mobile Bottom Navigation Bar
// Designed with native app ergonomics (Robinhood / Zerodha Kite style).
// Fixed bottom tab strip visible strictly on mobile viewports (< lg).

import React from 'react';
import { LayoutDashboard, TrendingUp, Coins, Bookmark, Newspaper, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  activeNav: string;
  onSelectNav: (page: string) => void;
  marketMode: 'indian' | 'crypto';
  onOpenMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeNav,
  onSelectNav,
  marketMode,
  onOpenMenu,
}) => {
  const isCrypto = marketMode === 'crypto';

  const items = [
    {
      id: 'overview',
      label: 'Markets',
      icon: LayoutDashboard,
      onClick: () => onSelectNav('overview')
    },
    {
      id: 'indices',
      label: isCrypto ? 'Assets' : 'Stocks',
      icon: isCrypto ? Coins : TrendingUp,
      onClick: () => onSelectNav(isCrypto ? 'indices' : 'stocks')
    },
    {
      id: 'watchlist',
      label: 'Watchlist',
      icon: Bookmark,
      onClick: () => onSelectNav('watchlist')
    },
    {
      id: 'news',
      label: 'News',
      icon: Newspaper,
      onClick: () => onSelectNav('news')
    },
    {
      id: 'more',
      label: 'More',
      icon: Menu,
      onClick: onOpenMenu
    }
  ];

  return (
    <nav aria-label="Primary navigation" className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-[#070B14] border-t border-slate-200 dark:border-[#1A2744] transition-colors safe-area-bottom">
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              aria-current={activeNav === item.id ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-colors cursor-pointer min-w-[52px] min-h-11 ${
                isActive
                  ? 'text-blue-700 dark:text-sky-300 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 active:scale-95'
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
