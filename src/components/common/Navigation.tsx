// DHRU.AI - Desktop Navigation Tab Bar
// Smooth horizontal tab strip styled in White & Blue Fintrix theme.
// Strictly adapts to marketMode (Indian vs Crypto) with zero overlapping clutter.

import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  ListFilter,
  PieChart,
  Coins,
  Binary,
  Newspaper,
  BrainCircuit,
  ShieldAlert,
  CandlestickChart,
  Bookmark,
  Sparkles,
  User,
  Briefcase,
  Bot
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'motion/react';
import { duration, ease } from '../../design/motion';

interface NavigationProps {
  activeNav: string;
  onSelectNav: (page: string) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeNav, onSelectNav }) => {
  const { marketMode } = useAuth();

  const navItems = marketMode === 'crypto'
    ? [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'terminal', label: 'Terminal', icon: CandlestickChart },
        { id: 'positions', label: 'Positions', icon: Briefcase },
        { id: 'autotrade', label: '⚡ Auto-Trade', icon: Bot },
        { id: 'indices', label: 'Crypto Assets', icon: Coins },
        { id: 'news', label: 'News', icon: Newspaper },
        { id: 'ai-predictions', label: 'AI Forecast', icon: BrainCircuit },
        { id: 'risk-monitor', label: 'Risk Monitor', icon: ShieldAlert },
        { id: 'patterns', label: 'Patterns', icon: CandlestickChart },
        { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'ask-dhru', label: 'DHRU AI', icon: Sparkles },
      ]
    : [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'terminal', label: 'Terminal', icon: CandlestickChart },
        { id: 'positions', label: 'Positions', icon: Briefcase },
        { id: 'autotrade', label: '⚡ Auto-Trade', icon: Bot },
        { id: 'indices', label: 'Indices', icon: TrendingUp },
        { id: 'stocks', label: 'Stocks', icon: ListFilter },
        { id: 'sectors', label: 'Sectors', icon: PieChart },
        { id: 'commodities', label: 'Commodities', icon: Coins },
        { id: 'derivatives', label: 'Futures & Options', icon: Binary },
        { id: 'news', label: 'News', icon: Newspaper },
        { id: 'ai-predictions', label: 'AI Forecast', icon: BrainCircuit },
        { id: 'risk-monitor', label: 'Risk Monitor', icon: ShieldAlert },
        { id: 'patterns', label: 'Patterns', icon: CandlestickChart },
        { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'ask-dhru', label: 'DHRU AI', icon: Sparkles },
      ];

  return (
    <nav
      aria-label="Primary navigation"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      className="hidden lg:block w-full bg-surface dark:bg-surface border-b border-line dark:border-line overflow-x-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 py-0 min-w-max">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectNav(item.id)}
                className={`relative flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-ink dark:text-ink font-bold'
                    : 'text-ink-2 dark:text-ink-3 hover:text-brand hover:bg-surface-2 dark:hover:bg-surface-2'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="primary-nav-indicator"
                    className="absolute bottom-0 left-2 right-2 h-[2.5px] bg-brand-fill rounded-full"
                    transition={{ duration: duration.base, ease: ease.out }}
                    aria-hidden="true"
                  />
                )}
                <Icon className={`relative z-10 w-3.5 h-3.5 ${isActive ? 'text-ink dark:text-ink' : 'text-ink-3 group-hover:text-brand'}`} />
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
