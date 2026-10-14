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
  User
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
        { id: 'overview', label: 'Crypto & FX Overview', icon: LayoutDashboard },
        { id: 'terminal', label: 'Live Terminal', icon: CandlestickChart },
        { id: 'indices', label: 'Crypto & Forex Assets (38+)', icon: Coins },
        { id: 'sectors', label: 'Ecosystems & Heatmap', icon: PieChart },
        { id: 'news', label: 'Market News', icon: Newspaper },
        { id: 'ai-predictions', label: 'AI Predictions', icon: BrainCircuit },
        { id: 'risk-monitor', label: 'Risk Monitor', icon: ShieldAlert },
        { id: 'patterns', label: 'AI Pattern Scanner', icon: CandlestickChart },
        { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'ask-dhru', label: 'Ask DHRU AI', icon: Sparkles },
      ]
    : [
        { id: 'overview', label: 'Indian Overview', icon: LayoutDashboard },
        { id: 'terminal', label: 'Live Terminal', icon: CandlestickChart },
        { id: 'indices', label: 'All Indices', icon: TrendingUp },
        { id: 'stocks', label: 'All Stocks', icon: ListFilter },
        { id: 'sectors', label: 'Sectors & Heatmap', icon: PieChart },
        { id: 'commodities', label: 'Commodities & FX', icon: Coins },
        { id: 'derivatives', label: 'Futures & Options', icon: Binary },
        { id: 'news', label: 'Financial News', icon: Newspaper },
        { id: 'ai-predictions', label: 'AI Predictions', icon: BrainCircuit },
        { id: 'risk-monitor', label: 'Risk Monitor', icon: ShieldAlert },
        { id: 'patterns', label: 'AI Pattern Scanner', icon: CandlestickChart },
        { id: 'watchlist', label: 'Watchlist', icon: Bookmark },
        { id: 'profile', label: 'My Profile', icon: User },
        { id: 'ask-dhru', label: 'Ask DHRU AI', icon: Sparkles },
      ];

  return (
    <nav className="hidden lg:block w-full bg-white dark:bg-[#0A101D] border-b border-slate-200/80 dark:border-[#1A2744] overflow-x-auto scrollbar-none shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1.5 py-2 min-w-max">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectNav(item.id)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:bg-blue-50/70 dark:hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
