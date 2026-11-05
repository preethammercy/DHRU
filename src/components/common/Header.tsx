// DHRU.AI - Main Header Component
// Features 'D' Monogram Logo, White & Blue Fintrix theme, Live Market Status with IST clock,
// Firebase Google Auth login, ₹10,00,000 Trading Capital indicator, Market Mode Toggle,
// Universal Search bar, and Theme toggle.

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Sun,
  Moon,
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
import { useAuth } from '../../context/AuthContext';
import { useTrading } from '../../context/TradingContext';
import { MarketStatus } from '../../types';
import { DhruLogo } from './DhruLogo';

interface HeaderProps {
  marketStatus: MarketStatus | null;
  onOpenSearch: () => void;
  onSelectNav: (page: string) => void;
  activeNav: string;
  onOpenPredictions?: () => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  marketStatus,
  onOpenSearch,
  onSelectNav,
  activeNav,
  onOpenPredictions,
  onOpenMobileMenu,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { user, signInWithGoogle, signOut, marketMode, setShowMarketSelector } = useAuth();
  const { marginAvailable } = useTrading();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeColor) themeColor.content = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  }, [theme]);

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
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-surface dark:bg-surface  border-b border-line dark:border-line">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3">
        
        {/* Left: Mobile 3-Line Hamburger Menu Button + Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          
          {/* 3-Line Hamburger Menu Button (at Left Corner Upside for Mobile) */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line text-ink dark:text-ink-3 hover:text-brand dark:hover:text-brand active:scale-95 transition-all cursor-pointer shrink-0 "
            aria-label="Open Navigation Menu"
            title="Open Platform Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* 'D' Logo & Brand Title with Pulse Effect */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group min-w-0"
            onClick={() => onSelectNav('overview')}
          >
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-600 to-sky-400 opacity-25 blur-xs group-hover:opacity-70 transition duration-500 group-hover:duration-200 animate-pulse" />
              <DhruLogo size={32} />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg sm:text-xl tracking-tight bg-brand-fill    dark:from-white   text-ink">
                  DHRU.AI
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMarketSelector(true);
                  }}
                  className={`text-ink sm:text-ink uppercase font-mono px-1.5 sm:px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    marketMode === 'crypto'
                      ? 'bg-surface-2 text-ai dark:bg-surface-2 dark:text-ai border border-line dark:border-line'
                      : 'bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand border border-line dark:border-line'
                  }`}
                  title="Click to switch trading markets"
                >
                  {marketMode === 'crypto' ? (
                    <>
                      <Coins className="w-2.5 h-2.5" />
                      <span className="hidden sm:inline">CRYPTO DESK</span>
                    </>
                  ) : (
                    <>
                      <span>🇮🇳</span>
                      <span className="hidden sm:inline">INDIA DESK</span>
                    </>
                  )}
                  <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                </button>
              </div>
              <p className="text-ink-2 dark:text-ink-3 hidden sm:block tracking-wide font-medium truncate">
                Understand Every Market. See Beyond the Numbers.
              </p>
            </div>
          </div>
        </div>

        {/* Center: Universal Search Bar Trigger */}
        <div className="flex-1 max-w-md mx-2 hidden xl:block">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-ink-2 dark:text-ink-3 bg-surface-2 dark:bg-surface border border-line dark:border-line hover:border-line hover:bg-surface dark:hover:bg-surface rounded-xl transition-all  group hover:scale-[1.01]"
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-ink-3 group-hover:text-brand dark:group-hover:text-brand transition-colors" />
              <span>
                {marketMode === 'crypto'
                  ? 'Search 20+ cryptos: Bitcoin, Ethereum, Solana, XRP, SUI...'
                  : 'Search 2,600+ NSE stocks, indices, sectors...'}
              </span>
            </div>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-ink font-mono font-medium text-ink-2 bg-surface dark:bg-surface-2 rounded border border-line dark:border-line ">
              Ctrl + K
            </kbd>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 xl:gap-2.5">
          
          {/* Market Status Pill */}
          <div className="hidden xl:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                marketMode === 'crypto' || marketStatus?.status === 'Live' ? 'bg-surface-2' : 'bg-surface-2'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                marketMode === 'crypto' || marketStatus?.status === 'Live' ? 'bg-pos' : 'bg-surface-2'
              }`} />
            </span>
            <span className="font-semibold text-ink dark:text-ink-3">
              {marketMode === 'crypto' ? 'Global 24/7' : marketStatus?.label || 'Market Closed'}
            </span>
          </div>

          {/* Virtual Paper Capital Pill */}
          <div 
            onClick={() => onSelectNav('terminal')}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-2 dark:bg-pos-tint border border-line dark:border-line text-xs font-bold text-pos dark:text-pos cursor-pointer hover:scale-[1.02] transition-transform "
            title="Available Virtual Trading Margin"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span className="font-mono">{formatMargin(marginAvailable)}</span>
            <span className="text-ink uppercase font-mono px-1 py-0.2 rounded bg-surface-2 dark:bg-pos-tint text-pos dark:text-pos font-semibold hidden sm:inline">
              Margin
            </span>
          </div>

          {/* Live Terminal Fast Button */}
          <button
            onClick={() => onSelectNav('terminal')}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all  cursor-pointer ${
              activeNav === 'terminal'
                ? 'bg-brand-fill text-on-brand scale-[1.02]'
                : 'bg-surface dark:bg-surface border border-line dark:border-line text-ink-2 dark:text-ink-3 hover:border-line'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-pos animate-pulse" />
            <span>Terminal</span>
          </button>

          {/* Live Predictions & Entry/Exit Signals Button (Desktop/Tablet) */}
          <button
            onClick={() => onOpenPredictions ? onOpenPredictions() : onSelectNav('ai-predictions')}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all  cursor-pointer bg-brand-fill      text-on-brand hover:scale-[1.02]"
            title="Live AI Market Predictions: Entry, Stop Loss & Exit Times"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Live Signals</span>
          </button>

          {/* DHRU AI Fast Button */}
          <button
            onClick={() => onSelectNav('ask-dhru')}
            className={`hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all  cursor-pointer ${
              activeNav === 'ask-dhru'
                ? 'bg-brand-fill   text-on-brand scale-[1.02]'
                : 'bg-surface-2 dark:bg-surface border border-line dark:border-line text-brand dark:text-brand hover:bg-surface-2 hover:border-line'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-brand dark:text-brand" />
            DHRU AI
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-surface dark:bg-surface border border-line dark:border-line text-ink-2 dark:text-ink-3 hover:text-brand hover:border-line transition-colors cursor-pointer"
            type="button"
            aria-label={`Switch to ${theme === 'dark' ? 'day' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'Day' : 'Dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-warn" /> : <Moon className="w-4 h-4 text-ink-2" />}
          </button>

          {/* User Profile / Firebase Google Login Button */}
          <div className="relative" ref={profileRef}>
            {user ? (
              <div>
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-line dark:border-line bg-surface-2 dark:bg-surface-2 hover:bg-surface-2 dark:hover:bg-surface-2 transition-all text-xs font-semibold cursor-pointer"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-brand"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-brand-fill   text-on-brand font-bold text-xs flex items-center justify-center">
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline max-w-[90px] truncate text-ink dark:text-ink-3 font-bold">
                    {user.displayName}
                  </span>
                  <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-ink-3" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl  py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-3 pb-3 border-b border-line dark:border-line">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-brand"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-fill text-on-brand font-black text-sm flex items-center justify-center">
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <div className="font-extrabold text-sm text-ink dark:text-ink truncate">
                          {user.displayName}
                        </div>
                        <div className="text-ink-2 truncate">
                          {user.email || 'Google Account Active'}
                        </div>
                      </div>
                    </div>

                    <div className="py-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-ink-2 dark:text-ink-3">
                        <span>Allocated Margin:</span>
                        <span className="font-mono font-bold text-pos dark:text-pos">
                          {formatMargin(marginAvailable)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-ink-2 dark:text-ink-3">
                        <span>Current Desk:</span>
                        <button
                          onClick={() => {
                            setShowMarketSelector(true);
                            setProfileDropdownOpen(false);
                          }}
                          className="text-brand dark:text-brand font-bold hover:underline"
                        >
                          {marketMode === 'crypto' ? '🪙 Crypto Desk' : '🇮🇳 Indian NSE/BSE'}
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-line dark:border-line space-y-1">
                      <button
                        onClick={() => {
                          onSelectNav('profile');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-ink-2 dark:text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-2 transition-colors cursor-pointer text-left"
                      >
                        <User className="w-3.5 h-3.5 text-brand dark:text-brand" />
                        <span>My Profile & Identities</span>
                      </button>

                      <button
                        onClick={() => {
                          signOut();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-neg hover:bg-surface-2 dark:hover:bg-neg-tint transition-colors cursor-pointer"
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
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-fill hover:bg-brand-fill text-on-brand   transition-all hover:scale-[1.02] cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign in with Google</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
