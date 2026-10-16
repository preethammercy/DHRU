// DHRU.AI - Main Header Component
// Features 'D' Monogram Logo, White & Blue Fintrix theme, Live Market Status with IST clock,
// Firebase Google Auth login, ₹10,00,000 Trading Capital indicator, Market Mode Toggle,
// Universal Search bar, Theme toggle, and Watchlist counter.

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sun,
  Moon,
  Bookmark,
  Menu,
  X,
  Sparkles,
  Wallet,
  LogIn,
  LogOut,
  ChevronDown,
  Coins,
  Zap,
  User
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useWatchlist } from '../../context/WatchlistContext';
import { useAuth } from '../../context/AuthContext';
import { useTrading } from '../../context/TradingContext';
import { MarketStatus } from '../../types';
import { DhruLogo } from './DhruLogo';
import { MobileSidebarDrawer } from './MobileSidebarDrawer';

interface HeaderProps {
  marketStatus: MarketStatus | null;
  onOpenSearch: () => void;
  onSelectNav: (page: string) => void;
  activeNav: string;
  onOpenPredictions?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  marketStatus,
  onOpenSearch,
  onSelectNav,
  activeNav,
  onOpenPredictions,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { watchlist } = useWatchlist();
  const { user, signInWithGoogle, signOut, marketMode, setShowMarketSelector } = useAuth();
  const { marginAvailable } = useTrading();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatMargin = (val: number) => {
    if (marketMode === 'crypto') {
      const usdVal = val / 83.33;
      return `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070B14]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1A2744] shadow-[0_2px_12px_rgba(37,99,235,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Left: 'D' Logo & Brand Title */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none group"
          onClick={() => onSelectNav('overview')}
        >
          <DhruLogo size={36} />

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 dark:from-white dark:to-cyan-400 bg-clip-text text-transparent">
                DHRU.AI
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMarketSelector(true);
                }}
                className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  marketMode === 'crypto'
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                    : 'bg-blue-50 dark:bg-cyan-500/10 text-blue-700 dark:text-cyan-400 border border-blue-200 dark:border-cyan-500/20'
                }`}
                title="Click to switch trading markets"
              >
                {marketMode === 'crypto' ? (
                  <>
                    <Coins className="w-2.5 h-2.5" />
                    <span>CRYPTO DESK</span>
                  </>
                ) : (
                  <>
                    <span>🇮🇳</span>
                    <span>INDIA DESK</span>
                  </>
                )}
                <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
              </button>
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
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 hover:bg-white dark:hover:bg-[#131F38] rounded-xl transition-all shadow-2xs group hover:scale-[1.01]"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-cyan-400 transition-colors" />
              <span>
                {marketMode === 'crypto'
                  ? 'Search 20+ cryptos: Bitcoin, Ethereum, Solana, XRP, SUI...'
                  : 'Search 2,600+ NSE stocks, indices, sectors...'}
              </span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono font-medium text-slate-500 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-2xs">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          
          {/* Market Status Pill */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-50 dark:bg-[#0D1527] border border-slate-200/90 dark:border-[#1A2744] text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                marketMode === 'crypto' || marketStatus?.status === 'Live' ? 'bg-emerald-400' : 'bg-slate-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                marketMode === 'crypto' || marketStatus?.status === 'Live' ? 'bg-emerald-500' : 'bg-slate-500'
              }`} />
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {marketMode === 'crypto' ? 'Global 24/7' : marketStatus?.label || 'Market Closed'}
            </span>
          </div>

          {/* Virtual Paper Capital Pill */}
          <div 
            onClick={() => onSelectNav('terminal')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-xs font-bold text-emerald-700 dark:text-emerald-400 cursor-pointer hover:scale-[1.02] transition-transform shadow-2xs"
            title="Available Virtual Trading Margin"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="font-mono">{formatMargin(marginAvailable)}</span>
            <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-semibold hidden sm:inline">
              Margin
            </span>
          </div>

          {/* Live Terminal Fast Button */}
          <button
            onClick={() => onSelectNav('terminal')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              activeNav === 'terminal'
                ? 'bg-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] scale-[1.02]'
                : 'bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] text-slate-700 dark:text-slate-200 hover:border-blue-400'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Terminal</span>
          </button>

          {/* Live Predictions & Entry/Exit Signals Button */}
          <button
            onClick={() => onOpenPredictions ? onOpenPredictions() : onSelectNav('ai-predictions')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 hover:from-blue-800 hover:to-cyan-700 text-white shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:scale-[1.02]"
            title="Live AI Market Predictions: Entry, Stop Loss & Exit Times"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">Live Signals</span>
            <span className="sm:hidden">Signals</span>
          </button>

          {/* Ask DHRU AI Fast Button */}
          <button
            onClick={() => onSelectNav('ask-dhru')}
            className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              activeNav === 'ask-dhru'
                ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white shadow-[0_4px_14px_rgba(37,99,235,0.3)] scale-[1.02]'
                : 'bg-blue-50 dark:bg-[#0D1527] border border-blue-200 dark:border-[#1A2744] text-blue-700 dark:text-cyan-400 hover:bg-blue-100 hover:border-blue-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
            Ask DHRU
          </button>

          {/* Watchlist Counter Button */}
          <button
            onClick={() => onSelectNav('watchlist')}
            className={`relative p-2 rounded-xl border transition-all cursor-pointer ${
              activeNav === 'watchlist'
                ? 'bg-blue-50 dark:bg-cyan-500/15 border-blue-300 dark:border-cyan-500/40 text-blue-600 dark:text-cyan-400 shadow-xs'
                : 'bg-white dark:bg-[#0D1527] border-slate-200 dark:border-[#1A2744] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300'
            }`}
            title="My Watchlist"
          >
            <Bookmark className="w-4 h-4" />
            {watchlist.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-blue-600 text-white shadow-xs">
                {watchlist.length}
              </span>
            )}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-slate-300 transition-colors cursor-pointer"
            title={`Switch to ${theme === 'dark' ? 'White & Blue' : 'Dark'} theme`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User Profile / Firebase Google Login Button */}
          <div className="relative" ref={profileRef}>
            {user ? (
              <div>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all text-xs font-semibold cursor-pointer"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-blue-500"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-bold text-xs flex items-center justify-center">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[90px] truncate text-slate-800 dark:text-slate-200 font-bold">
                    {user.displayName}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0A101D] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                          {user.displayName}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {user.email || 'Google Account Active'}
                        </div>
                      </div>
                    </div>

                    <div className="py-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Allocated Margin:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatMargin(marginAvailable)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                        <span>Current Desk:</span>
                        <button
                          onClick={() => {
                            setShowMarketSelector(true);
                            setProfileDropdownOpen(false);
                          }}
                          className="text-blue-600 dark:text-cyan-400 font-bold hover:underline"
                        >
                          {marketMode === 'crypto' ? '🪙 Crypto Desk' : '🇮🇳 Indian NSE/BSE'}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <button
                        onClick={() => {
                          onSelectNav('profile');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                      >
                        <User className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                        <span>My Profile & Identities</span>
                      </button>

                      <button
                        onClick={() => {
                          signOut();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign in with Google</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] text-slate-600 lg:hidden cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Off-Canvas Sidebar Drawer */}
      <MobileSidebarDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeNav={activeNav}
        onSelectNav={onSelectNav}
        onOpenSearch={onOpenSearch}
        onOpenPredictions={onOpenPredictions}
      />
    </header>
  );
};
