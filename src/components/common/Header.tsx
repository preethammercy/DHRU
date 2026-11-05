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
  User,
  ShieldCheck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useTrading } from '../../context/TradingContext';
import { useWallet } from '../../context/WalletContext';
import { AccountTypeSwitcher } from './AccountTypeSwitcher';
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
  const { wallet, openDepositModal } = useWallet();

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
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* 3-Line Hamburger Menu Button (at Left Corner Upside for Mobile) */}
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line text-ink dark:text-ink-3 hover:text-brand dark:hover:text-brand active:scale-95 transition-all cursor-pointer shrink-0"
            aria-label="Open Navigation Menu"
            title="Open Platform Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* 'D' Logo & Brand Title with Pulse Effect */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group shrink-0"
            onClick={() => onSelectNav('overview')}
          >
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-blue-600 to-sky-400 opacity-25 blur-xs group-hover:opacity-70 transition duration-500 group-hover:duration-200 animate-pulse" />
              <DhruLogo size={32} />
            </div>

            <div className="shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg sm:text-xl tracking-tight bg-brand-fill dark:from-white text-ink">
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
              <p className="text-ink-2 dark:text-ink-3 hidden sm:block tracking-wide font-medium truncate max-w-[280px]">
                Understand Every Market. See Beyond the Numbers.
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 xl:gap-2.5 ml-auto">
          {/* Quick Search Button */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line text-ink-2 dark:text-ink-3 hover:text-brand hover:border-brand transition-all cursor-pointer shrink-0 text-xs shadow-sm"
            type="button"
            aria-label="Search markets (Ctrl+K)"
            title="Search markets (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-ink-3 shrink-0" />
            <span className="hidden md:inline font-medium">Search</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.2 text-[10px] font-mono font-medium text-ink-3 bg-surface dark:bg-surface-2 rounded border border-line">
              Ctrl+K
            </kbd>
          </button>
          
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

          {/* Demo vs Real Account Switcher */}
          <AccountTypeSwitcher compact />

          {/* Wallet Credits & Real Funds / Add Funds Button */}
          <button
            type="button"
            onClick={() => openDepositModal('credits')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0"
            title="Buy AI Credits or Deposit Real Funds via UPI"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
            <div className="flex items-center gap-1 font-mono text-ink dark:text-ink">
              <strong className="text-amber-600 dark:text-amber-400 font-extrabold">{wallet.credits}</strong>
              <span className="text-[10px] text-ink-2">Cr</span>
            </div>
            <span className="hidden sm:inline-block w-px h-3 bg-amber-500/20 mx-0.5" />
            <span className="hidden md:inline font-mono text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
              ₹{wallet.tradingBalance.toLocaleString()}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-extrabold uppercase tracking-wide ml-0.5 shadow-sm">
              + Top Up
            </span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line text-ink hover:text-brand transition-all cursor-pointer shadow-sm active:scale-95 shrink-0"
            type="button"
            aria-label={`Switch to ${theme === 'dark' ? 'day' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'Day (Light)' : 'Dark'} mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 hover:-rotate-12 transition-transform" />
            )}
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
                  <div className="absolute right-0 mt-2 w-72 bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl py-3 px-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 shadow-xl">
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
                        <div className="text-ink-2 text-xs truncate">
                          {user.email || 'Google Account Active'}
                        </div>
                      </div>
                    </div>

                    <div className="py-2.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-ink-2 dark:text-ink-3">
                        <span>AI Report Credits:</span>
                        <span className="font-mono font-bold text-amber-500">
                          {wallet.credits} Credits
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-ink-2 dark:text-ink-3">
                        <span>Real Trading Funds:</span>
                        <span className="font-mono font-bold text-pos">
                          ₹{wallet.tradingBalance.toLocaleString()}
                        </span>
                      </div>
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

                    <div className="pt-2 border-t border-line dark:border-line space-y-1.5">
                      <button
                        onClick={() => {
                          openDepositModal('credits');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Buy Credits (Unlock SMC)</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500 text-white font-extrabold">UPI</span>
                      </button>

                      <button
                        onClick={() => {
                          openDepositModal('funds');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Add Funds (Real Balance)</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-600 text-white font-extrabold">Instant</span>
                      </button>

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
                          onSelectNav('admin');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all cursor-pointer text-left shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-sky-500" />
                          <span>Admin & Approvals Desk</span>
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-600 text-white font-extrabold">
                          {user?.email?.toLowerCase() === 'preethamjee2008@gmail.com' ? 'SUPER ADMIN' : 'PORTAL'}
                        </span>
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
