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
  Briefcase
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
        { id: 'positions', label: 'Portfolio', icon: Briefcase },
        { id: 'indices', label: 'Assets', icon: Coins },
        { id: 'sectors', label: 'Sectors', icon: PieChart },
        { id: 'news', label: 'News', icon: Newspaper },
        { id: 'ai-predictions', label: 'Scenarios', icon: BrainCircuit },
        { id: 'risk-monitor', label: 'Risk', icon: ShieldAlert },
        { id: 'patterns', label: 'Patterns', icon: CandlestickChart },
        { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'ask-dhru', label: 'Ask DHRU AI', icon: Sparkles },
      ]
    : [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'terminal', label: 'Terminal', icon: CandlestickChart },
        { id: 'positions', label: 'Portfolio', icon: Briefcase },
        { id: 'indices', label: 'Indices', icon: TrendingUp },
        { id: 'stocks', label: 'Stocks', icon: ListFilter },
        { id: 'sectors', label: 'Sectors', icon: PieChart },
        { id: 'commodities', label: 'Commodities', icon: Coins },
        { id: 'derivatives', label: 'Derivatives', icon: Binary },
        { id: 'news', label: 'News', icon: Newspaper },
        { id: 'ai-predictions', label: 'Scenarios', icon: BrainCircuit },
        { id: 'risk-monitor', label: 'Risk', icon: ShieldAlert },
        { id: 'patterns', label: 'Patterns', icon: CandlestickChart },
        { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'ask-dhru', label: 'Ask DHRU AI', icon: Sparkles },
      ];

  return (
    <aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-16 shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-2 py-4 dark:border-slate-800 dark:bg-[#181B21] md:block lg:w-56 lg:px-3" aria-label="Workspace navigation">
      <nav aria-label="Primary navigation" className="space-y-1">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectNav(item.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
              title={item.label}
              className={`flex min-h-10 w-full items-center justify-center gap-3 rounded-md px-2 text-sm transition-colors lg:justify-start lg:px-3 ${
                isActive
                  ? 'bg-[#F0EEE8] font-semibold text-[#1C2B45] dark:bg-[#20242B] dark:text-[#ECEDEF]'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              <Icon aria-hidden="true" className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              <span className="hidden truncate lg:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
