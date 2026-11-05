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
  Wallet,
  LogIn,
  LogOut,
  ChevronDown,
  Coins,
  Zap,
  User,
  ShieldCheck,
  ArrowDownToLine,
  ArrowUpRight,
  CheckCircle2
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
  const { wallet, openDepositModal, openWithdrawModal } = useWallet();

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

  const cleanDisplayName = (name?: string) => {
    if (!name) return 'Trader';
    return name.replace(/\s*\(Local.*?\)/gi, '').trim() || 'Trader';
  };

  const isAdmin = user?.email?.toLowerCase() === 'preethamjee2008@gmail.com';
  const balanceInUsd = (wallet.tradingBalance / 86.5).toFixed(2);

  return (
    <header className="sticky top-0 z-40 w-full bg-surface dark:bg-surface border-b border-line dark:border-line">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Left: Mobile 3-Line Hamburger Menu Button + Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* 3-Line Hamburger Menu Button (at Left Corner for Mobile) */}
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
                  className={`text-ink uppercase font-mono px-1.5 sm:px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap shrink-0 text-[11px] ${
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
              <p className="text-ink-2 dark:text-ink-3 hidden md:block text-[11px] tracking-wide font-medium truncate max-w-[280px]">
                Understand Every Market. See Beyond the Numbers.
              </p>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5 ml-auto">
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

          {/* Demo vs Real Account Switcher (Desktop & Tablets) */}
          <div className="hidden sm:inline-flex shrink-0">
            <AccountTypeSwitcher compact />
          </div>

          {/* Wallet Credits & Real Funds / Add Funds Button */}
          <button
            type="button"
            onClick={() => openDepositModal('credits')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 group shrink-0"
            title="Buy AI Credits or Deposit Real Funds via UPI"
          >
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 group-hover:scale-110 transition-transform" />
            <div className="flex items-center gap-1 font-mono text-ink">
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

          {/* Spacious User Profile / Firebase Google Login Button (Both Mobile & PC) */}
          <div className="relative shrink-0" ref={profileRef}>
            {user ? (
              <div>
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  aria-label="Open User Profile & Settings"
                  className="flex items-center gap-2 sm:gap-2.5 p-1 sm:px-3 sm:py-1.5 rounded-xl border border-line hover:border-brand/50 bg-surface-2 hover:bg-surface-2/80 transition-all cursor-pointer shadow-xs active:scale-95 group"
                >
                  <div className="relative shrink-0">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={cleanDisplayName(user.displayName)}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-brand/40 group-hover:ring-brand transition-all"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs sm:text-sm flex items-center justify-center ring-2 ring-brand/40 shadow-sm">
                        {cleanDisplayName(user.displayName).charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-surface rounded-full shadow-xs" title="Online" />
                  </div>

                  <div className="hidden sm:flex flex-col text-left leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-ink truncate max-w-[120px] md:max-w-[150px]">
                        {cleanDisplayName(user.displayName)}
                      </span>
                      {isAdmin ? (
                        <span className="px-1.5 py-0.2 text-[9px] font-black uppercase tracking-wider rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                          Admin
                        </span>
                      ) : (
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      )}
                    </div>
                    <span className="text-[10px] text-ink-3 font-mono truncate max-w-[120px] md:max-w-[150px]">
                      {isAdmin ? 'Super Admin' : (user.phone ? `+91 ${user.phone}` : (user.email || 'Verified Account'))}
                    </span>
                  </div>

                  <ChevronDown className={`w-3.5 h-3.5 text-ink-3 group-hover:text-ink transition-transform duration-200 hidden sm:block ${profileDropdownOpen ? 'rotate-180 text-brand' : ''}`} />
                </button>

                {/* Profile Dropdown Menu (Full Width on Mobile, Fixed Width on PC) */}
                {profileDropdownOpen && (
                  <div className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full sm:mt-2 w-[calc(100vw-24px)] sm:w-84 max-w-sm bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl py-3.5 px-4 z-50 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-md">
                    <div className="flex items-center gap-3 pb-3 border-b border-line dark:border-line">
                      <div className="relative shrink-0">
                        {user.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt={cleanDisplayName(user.displayName)}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-brand"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-base flex items-center justify-center ring-2 ring-brand shadow-sm">
                            {cleanDisplayName(user.displayName).charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-surface rounded-full" />
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-ink truncate">
                            {cleanDisplayName(user.displayName)}
                          </span>
                          {isAdmin && (
                            <span className="px-1.5 py-0.5 text-[9px] font-black uppercase rounded bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                              SUPER ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-ink-2 text-xs truncate">
                          {user.email || 'Verified Account Active'}
                        </div>
                        {user.phone && (
                          <div className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            📱 +91 {user.phone}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Balances & Financial Summary */}
                    <div className="py-2.5 space-y-2 text-xs border-b border-line dark:border-line">
                      <div className="p-2.5 rounded-xl bg-surface-2 dark:bg-surface-2 border border-line dark:border-line">
                        <div className="flex items-center justify-between">
                          <span className="text-ink-2 dark:text-ink-3 text-xs font-medium">Real Trading Funds:</span>
                          <span className="font-mono font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                            ₹{wallet.tradingBalance.toLocaleString('en-IN')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-ink-3 font-mono">
                          <span>Crypto Equivalent:</span>
                          <span className="text-ai font-bold">≈ ${balanceInUsd} USDT</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between px-1 text-ink-2 dark:text-ink-3">
                        <span>AI Predictions Credits:</span>
                        <span className="font-mono font-bold text-amber-500">
                          {wallet.credits} Credits
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1 text-ink-2 dark:text-ink-3">
                        <span>Simulation Margin:</span>
                        <span className="font-mono font-bold text-pos">
                          {formatMargin(marginAvailable)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-1 text-ink-2 dark:text-ink-3">
                        <span>Current Desk:</span>
                        <button
                          onClick={() => {
                            setShowMarketSelector(true);
                            setProfileDropdownOpen(false);
                          }}
                          className="text-brand font-bold hover:underline"
                        >
                          {marketMode === 'crypto' ? '🪙 Crypto Desk (24/7)' : '🇮🇳 Indian NSE/BSE'}
                        </button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2.5 space-y-1.5">
                      <button
                        onClick={() => {
                          openDepositModal('funds');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                          <span>+ Add Funds (UPI Instant)</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-600 text-white font-extrabold">Instant</span>
                      </button>

                      <button
                        onClick={() => {
                          openWithdrawModal();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowDownToLine className="w-3.5 h-3.5 text-sky-500" />
                          <span>Withdraw Funds (Bank / UPI)</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sky-600 text-white font-extrabold">Payout</span>
                      </button>

                      <button
                        onClick={() => {
                          openDepositModal('credits');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>Buy Credits (Unlock SMC)</span>
                        </div>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500 text-white font-extrabold">UPI</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectNav('profile');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-semibold text-ink-2 dark:text-ink-3 hover:bg-surface-2 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-brand" />
                          <span>My Profile & KYC Settings</span>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-ink-3" />
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => {
                            onSelectNav('admin');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full flex items-center justify-between py-2 px-3 rounded-xl text-xs font-bold text-purple-700 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-all cursor-pointer text-left shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-purple-500" />
                            <span>Admin & Approvals Desk</span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-600 text-white font-extrabold">
                            SUPER ADMIN
                          </span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          signOut();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-neg hover:bg-neg-tint transition-colors cursor-pointer border border-transparent hover:border-neg/20 mt-1"
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
                type="button"
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-brand hover:bg-brand-fill text-white shadow-md active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <LogIn className="w-4 h-4" />
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
