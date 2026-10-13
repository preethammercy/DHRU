// DHRU.AI - Main Header Component
// Features 'D' Monogram Logo, White & Blue Fintrix theme, Live Market Status with IST clock,
// Universal Search bar, 10-Minute Refresh counter, Theme toggle, and Watchlist counter.

import React, { useState, useEffect } from 'react';
import { Search, Sun, Moon, RefreshCw, Bookmark, Menu, X, Clock, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useWatchlist } from '../../context/WatchlistContext';
import { MarketStatus } from '../../types';
import { getSchedulerStatus, triggerManualRefresh } from '../../services/api';
import { DhruLogo } from './DhruLogo';

interface HeaderProps {
  marketStatus: MarketStatus | null;
  onOpenSearch: () => void;
  onSelectNav: (page: string) => void;
  activeNav: string;
}

export const Header: React.FC<HeaderProps> = ({
  marketStatus,
  onOpenSearch,
  onSelectNav,
  activeNav,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { watchlist } = useWatchlist();

  const [schedulerCountdown, setSchedulerCountdown] = useState<string>('10m 00s');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchTimer = async () => {
      try {
        const data = await getSchedulerStatus();
        if (data?.nextCountdown) {
          setSchedulerCountdown(data.nextCountdown);
        }
      } catch (e) {
        // ignore
      }
    };

    fetchTimer();
    const interval = setInterval(fetchTimer, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await triggerManualRefresh();
      const data = await getSchedulerStatus();
      if (data?.nextCountdown) setSchedulerCountdown(data.nextCountdown);
    } catch (e) {
      // ignore
    } finally {
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#070B14]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1A2744] shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: 'D' Logo & Brand Title */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => onSelectNav('overview')}
        >
          <DhruLogo size={38} />

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 dark:from-white dark:to-cyan-400 bg-clip-text text-transparent">
                DHRU.AI
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-cyan-500/10 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/20 font-bold">
                INDIA
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block tracking-wide font-medium">
              Understand Every Market. See Beyond the Numbers.
            </p>
          </div>
        </div>

        {/* Center: Universal Search Bar Trigger */}
        <div className="flex-1 max-w-md mx-2 hidden md:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 hover:bg-white dark:hover:bg-[#131F38] rounded-xl transition-all shadow-sm group hover:scale-[1.01]"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors" />
              <span>Search 2,600+ NSE stocks, indices, sectors, gold...</span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Market Status Pill */}
          {marketStatus && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0D1527] border border-slate-200/90 dark:border-[#1A2744] text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  marketStatus.status === 'Live' ? 'bg-emerald-400' : 'bg-slate-400'
                }`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${
                  marketStatus.status === 'Live' ? 'bg-emerald-500' : 'bg-slate-500'
                }`} />
              </span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {marketStatus.label}
              </span>
              <span className="text-slate-500 font-mono text-[11px] border-l border-slate-200 dark:border-slate-800 pl-2">
                {marketStatus.currentTimeIST}
              </span>
            </div>
          )}

          {/* 10-Minute Refresh Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-700 dark:text-slate-300 text-[11px] font-medium" title="Next automated refresh cycle">
              {schedulerCountdown}
            </span>
            <button
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors ml-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800"
              title="Trigger instant public feed refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600 dark:text-cyan-400' : ''}`} />
            </button>
          </div>

          {/* Watchlist Counter Button */}
          <button
            onClick={() => onSelectNav('watchlist')}
            className={`relative p-2 rounded-xl border transition-all ${
              activeNav === 'watchlist'
                ? 'bg-blue-50 dark:bg-cyan-500/15 border-blue-300 dark:border-cyan-500/40 text-blue-600 dark:text-cyan-400 shadow-sm'
                : 'bg-white dark:bg-[#0D1527] border-slate-200 dark:border-[#1A2744] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300'
            }`}
            title="My Personal Watchlist"
          >
            <Bookmark className="w-4 h-4" />
            {watchlist.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-600 text-white shadow-sm">
                {watchlist.length}
              </span>
            )}
          </button>

          {/* Ask DHRU AI Fast Button */}
          <button
            onClick={() => onSelectNav('ask-dhru')}
            className={`hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              activeNav === 'ask-dhru'
                ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] scale-[1.02]'
                : 'bg-blue-50 dark:bg-[#0D1527] border border-blue-200 dark:border-[#1A2744] text-blue-700 dark:text-cyan-400 hover:bg-blue-100 hover:border-blue-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            Ask DHRU AI
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-slate-300 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'White & Blue' : 'Dark'} theme`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Mobile Search Button */}
          <button
            onClick={onOpenSearch}
            className="p-2 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] text-slate-600 md:hidden"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] text-slate-600 lg:hidden"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-[#070B14] border-b border-slate-200 dark:border-[#1A2744] px-4 py-3 space-y-2 text-sm shadow-xl">
          <div className="grid grid-cols-2 gap-2 pb-2">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'indices', label: 'All Indices' },
              { id: 'stocks', label: 'All Stocks' },
              { id: 'sectors', label: 'Sectors' },
              { id: 'commodities', label: 'Commodities & FX' },
              { id: 'derivatives', label: 'Futures & Options' },
              { id: 'ipo-actions', label: 'IPO & Actions' },
              { id: 'news', label: 'Financial News' },
              { id: 'ai-predictions', label: 'AI Predictions' },
              { id: 'risk-monitor', label: 'Risk Monitor' },
              { id: 'patterns', label: 'Candlestick Scanner' },
              { id: 'backtesting', label: 'Backtesting Studio' },
              { id: 'watchlist', label: 'Watchlist' },
              { id: 'ask-dhru', label: 'Ask DHRU AI' },
              { id: 'methodology', label: 'Methodology' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectNav(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                  activeNav === item.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
