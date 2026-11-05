// DHRU.AI - Mobile Off-Canvas Sidebar Drawer Menu
// Spacious, highly organized, native app-like drawer for mobile devices.
// Features 3-line menu activation, categorized navigation, desk switcher, quick-access chips, and theme toggle.

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  LayoutDashboard,
  CandlestickChart,
  TrendingUp,
  ListFilter,
  PieChart,
  Coins,
  Binary,
  Newspaper,
  BrainCircuit,
  ShieldAlert,
  Bookmark,
  Sparkles,
  User,
  Sun,
  Moon,
  Search,
  ChevronRight,
  Wallet,
  Zap,
  LogOut,
  LogIn,
  Eye,
  Target,
  Briefcase,
  Bot,
  ArrowDownLeft
} from 'lucide-react';
import { DhruLogo } from './DhruLogo';
import { AccountTypeSwitcher } from './AccountTypeSwitcher';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useWatchlist } from '../../context/WatchlistContext';
import { useTrading } from '../../context/TradingContext';
import { useMarketStream } from '../../context/MarketStreamContext';
import { useWallet } from '../../context/WalletContext';

interface MobileSidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeNav: string;
  onSelectNav: (page: string) => void;
  onOpenSearch: () => void;
  onOpenPredictions?: () => void;
}

export const MobileSidebarDrawer: React.FC<MobileSidebarDrawerProps> = ({
  isOpen,
  onClose,
  activeNav,
  onSelectNav,
  onOpenSearch,
  onOpenPredictions
}) => {
  const { user, signInWithGoogle, signOut, marketMode, setShowMarketSelector } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { watchlist } = useWatchlist();
  const { marginAvailable, positions } = useTrading();
  const { isMarketLive } = useMarketStream();
  const { wallet, openDepositModal, openWithdrawModal } = useWallet();

  const isCrypto = marketMode === 'crypto';

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleNavClick = (page: string) => {
    onSelectNav(page);
    onClose();
  };

  const formatMargin = (val: number) => {
    if (isCrypto) {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(2)}L`;
    }
    return `₹${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const drawerElement = (
    <div
      className="fixed inset-0 z-[999999] lg:hidden flex"
      style={{
        zIndex: 999999,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%'
      }}
    >
      {/* 1. Backdrop overlay */}
      <div
        className="absolute inset-0 bg-surface-2 dark:bg-black  transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Off-canvas sliding drawer container */}
      <div
        className="relative w-[86vw] max-w-[320px] bg-surface dark:bg-surface text-ink dark:text-ink-3 h-full  flex flex-col z-10 overflow-hidden border-r border-line dark:border-line animate-in slide-in-from-left duration-250"
        style={{
          height: '100%',
          maxHeight: '100dvh'
        }}
      >
        
        {/* Header with Logo, Version Badge, and Close Button */}
        <div className="p-4 border-b border-line dark:border-line flex items-center justify-between bg-surface-2 dark:bg-surface">
          <div className="flex items-center gap-2.5">
            <DhruLogo size={28} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight bg-brand-fill    dark:from-white   text-ink">
                  DHRU.AI
                </span>
                <span className="text-ink font-mono px-1.5 py-0.2 rounded-full font-bold bg-surface-2 text-brand dark:bg-brand-fill dark:text-brand">
                  v2.0
                </span>
              </div>
              <p className="text-ink-2 font-mono">
                {isCrypto ? 'Crypto 24/7 Desk' : 'NSE / BSE India'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-surface-2 dark:bg-surface text-ink-2 hover:text-ink dark:hover:text-ink transition-colors cursor-pointer"
            title="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 divide-y divide-line dark:divide-line">
          
          {/* Active Account Switcher (Demo vs Real) */}
          <div className="pt-1">
            <span className="text-ink font-mono uppercase tracking-wider text-ink-3 px-1 font-bold block mb-2 text-[10px]">
              Active Trading Mode
            </span>
            <div className="w-full flex justify-center">
              <AccountTypeSwitcher />
            </div>
          </div>

          {/* Quick-Access Horizontal Jump Strip */}
          <div className="pt-1">
            <span className="text-ink font-mono uppercase tracking-wider text-ink-3 px-1 font-bold block mb-2">
              Featured Pages
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => handleNavClick('indices')}
                className="px-2.5 py-1.5 rounded-xl bg-surface-2 dark:bg-surface-2 text-ai dark:text-ai border border-line dark:border-line text-ink font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Coins className="w-3 h-3" />
                <span>Crypto Assets</span>
              </button>
              <button
                onClick={() => handleNavClick('patterns')}
                className="px-2.5 py-1.5 rounded-xl bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand border border-line dark:border-line text-ink font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                <span>AI Vision Scanner</span>
              </button>
              <button
                onClick={() => handleNavClick('ai-predictions')}
                className="px-2.5 py-1.5 rounded-xl bg-surface-2 dark:bg-pos-tint text-pos dark:text-pos border border-line dark:border-line text-ink font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Target className="w-3 h-3" />
                <span>SMC Predictions</span>
              </button>
              <button
                onClick={() => handleNavClick('terminal')}
                className="px-2.5 py-1.5 rounded-xl bg-surface-2 dark:bg-surface-2 text-ink dark:text-ink-3 border border-line dark:border-line text-ink font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <CandlestickChart className="w-3 h-3 text-pos" />
                <span>Terminal</span>
              </button>
              <button
                onClick={() => handleNavClick('positions')}
                className="px-2.5 py-1.5 rounded-xl bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand border border-line dark:border-line text-ink font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Briefcase className="w-3 h-3" />
                <span>Positions ({positions.length})</span>
              </button>
            </div>
          </div>

          {/* Market Desk Switcher Banner */}
          <div className="pt-3">
            <div className="p-2.5 rounded-2xl bg-brand-fill     border border-line dark:border-line flex items-center justify-between">
              <div>
                <span className="text-ink font-mono text-ink-2 dark:text-ink-3 uppercase font-semibold">Trading Desk</span>
                <div className="font-bold text-xs text-ink dark:text-ink flex items-center gap-1.5 mt-0.5">
                  {isCrypto ? <span>🪙 Crypto Markets · USD</span> : <span>🇮🇳 Indian NSE / BSE · INR</span>}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMarketSelector(true);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-xl bg-brand-fill hover:bg-brand-fill text-on-brand text-ink font-bold  transition-all cursor-pointer"
              >
                Switch
              </button>
            </div>
          </div>

          {/* Quick Search Button */}
          <div className="pt-3">
            <button
              onClick={() => {
                onOpenSearch();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs bg-surface-2 dark:bg-surface border border-line dark:border-line hover:border-line rounded-xl text-ink-2 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-ink-3" />
                <span>Search stocks, cryptos, FX...</span>
              </div>
              <span className="text-ink font-mono text-ink-3">Search</span>
            </button>
          </div>

          {/* User Account / Virtual Margin Card */}
          <div className="pt-3">
            {user ? (
              <div className="p-2.5 rounded-2xl bg-surface-2 dark:bg-surface border border-line dark:border-line flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-7 h-7 rounded-full ring-1 ring-brand shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-fill text-on-brand font-bold flex items-center justify-center shrink-0 text-xs">
                      {user.displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-ink dark:text-ink truncate">{user.displayName}</p>
                    <div className="flex items-center gap-1 text-ink text-pos dark:text-pos font-mono font-bold">
                      <Wallet className="w-3 h-3" />
                      <span>{formatMargin(marginAvailable)} Margin</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleNavClick('profile')}
                  className="p-1.5 rounded-lg text-ink-3 hover:text-brand cursor-pointer"
                  title="Profile settings"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  signInWithGoogle();
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-brand-fill hover:bg-brand-fill text-on-brand text-xs font-bold flex items-center justify-center gap-2  transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>

          {/* Quantitative Credits & Real Funds Mobile Card */}
          <div className="pt-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-surface-2 to-emerald-500/10 border border-line space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-ink-2">DHRU Wallet</span>
                <span className={`text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded-full border ${
                  wallet.premiumUnlocked ? 'bg-pos-tint text-pos border-pos/30' : 'bg-warn-tint text-warn border-warn/30'
                }`}>
                  {wallet.premiumUnlocked ? '✨ SMC Active' : 'Standard'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-xl bg-surface border border-line">
                  <span className="text-[10px] text-ink-3 uppercase block font-mono">Credits</span>
                  <span className="text-base font-black font-mono text-amber-500">{wallet.credits}</span>
                </div>
                <div className="p-2 rounded-xl bg-surface border border-line">
                  <span className="text-[10px] text-ink-3 uppercase block font-mono">Real Funds</span>
                  <span className="text-base font-black font-mono text-emerald-600 dark:text-emerald-400">₹{wallet.tradingBalance.toLocaleString()}</span>
                  <span className="text-[10px] text-ink-3 font-mono block">≈ ${(wallet.tradingBalance / 86.50).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={() => {
                    openDepositModal('credits');
                    onClose();
                  }}
                  className="py-1.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Zap className="w-3 h-3 fill-current" />
                  <span>Buy Credits</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openDepositModal('funds');
                    onClose();
                  }}
                  className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Wallet className="w-3 h-3" />
                  <span>+ Add Funds</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  openWithdrawModal();
                  onClose();
                }}
                className="w-full py-1.5 px-2 rounded-xl bg-surface hover:bg-surface-2 border border-line hover:border-cyan-500 text-ink text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <ArrowDownLeft className="w-3 h-3 text-cyan-500" />
                <span>Withdraw Funds (Bank / UPI)</span>
              </button>
            </div>
          </div>

          {/* 1. Core Platform Pages */}
          <div className="pt-3 space-y-1">
            <span className="text-ink font-mono uppercase tracking-wider text-ink-3 px-2 font-bold">
              Core Platform
            </span>

            {[
              { id: 'overview', label: isCrypto ? 'Crypto Overview' : 'Market Overview', icon: LayoutDashboard },
              { id: 'terminal', label: 'Live Trading Terminal', icon: CandlestickChart, isLive: true },
              { id: 'positions', label: 'Positions & Portfolio', icon: Briefcase, count: positions.length },
              { id: 'watchlist', label: `My Watchlist (${watchlist.length})`, icon: Bookmark },
              { id: 'profile', label: 'Trader Profile & P&L', icon: User }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-fill text-on-brand  font-bold'
                      : 'text-ink-2 dark:text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-on-brand' : 'text-ink-3'}`} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.count !== undefined && (
                      <span className={`text-ink font-mono px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-surface text-ink' : 'bg-surface-2 dark:bg-surface-2 text-ink-2'
                      }`}>
                        {item.count}
                      </span>
                    )}
                    {item.isLive && (
                      <span className="flex items-center gap-1 text-ink font-mono uppercase font-bold text-pos">
                        <span className="w-1.5 h-1.5 rounded-full bg-surface-2 animate-ping" />
                        Live
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 2. Market Assets Directory */}
          <div className="pt-3 space-y-1">
            <span className="text-ink font-mono uppercase tracking-wider text-ink-3 px-2 font-bold">
              Market Assets Directory
            </span>

            {[
              { id: 'indices', label: isCrypto ? '🪙 Crypto Assets' : '📈 NSE & BSE Indices', icon: isCrypto ? Coins : TrendingUp, badge: isCrypto ? 'USD' : 'Indices' },
              ...(!isCrypto ? [{ id: 'stocks', label: '📊 All Stocks Screener (2,600+)', icon: ListFilter, badge: 'Equities' }] : []),
              ...(!isCrypto ? [{ id: 'sectors', label: '🔥 Sectors & Heatmaps', icon: PieChart }] : []),
              ...(!isCrypto ? [
                { id: 'commodities', label: '🛢️ Commodities & FX (Gold, Oil)', icon: Coins },
                { id: 'derivatives', label: '⚡ Futures & Options (F&O)', icon: Binary }
              ] : []),
              { id: 'news', label: '📰 Financial News Wire', icon: Newspaper }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-fill text-on-brand  font-bold'
                      : 'text-ink-2 dark:text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-on-brand' : 'text-ink-3'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-ink font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                      isActive ? 'bg-surface text-ink' : 'bg-surface-2 dark:bg-surface-2 text-ink-2'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 3. AI Quantitative Intelligence */}
          <div className="pt-3 space-y-1">
            <span className="text-ink font-mono uppercase tracking-wider text-ink-3 px-2 font-bold">
              AI Quantitative Lab
            </span>

            {[
              { id: 'autotrade', label: '⚡ Auto-Trade Bot Desk', icon: Bot, badge: 'Adaptive' },
              { id: 'ai-predictions', label: '🎯 AI Market Predictions & SMC', icon: Zap, badge: 'SMC v3.5' },
              { id: 'patterns', label: '👁️ AI Pattern Vision Scanner', icon: CandlestickChart, badge: 'Vision' },
              { id: 'risk-monitor', label: '🛡️ Volatility & Risk Monitor', icon: ShieldAlert },
              { id: 'ask-dhru', label: '✨ DHRU AI Assistant', icon: Sparkles }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-brand-fill text-on-brand  font-bold'
                      : 'text-ink-2 dark:text-ink-3 hover:bg-surface-2 dark:hover:bg-surface-2'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-on-brand' : 'text-ink-3'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-ink font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                      isActive ? 'bg-surface text-ink' : 'bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Footer Preferences Strip */}
        <div className="p-3 border-t border-line dark:border-line bg-surface-2 dark:bg-surface flex items-center justify-between safe-area-bottom">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-line dark:border-line text-xs font-semibold text-ink-2 dark:text-ink-3 hover:bg-surface dark:hover:bg-surface-2 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-warn" /> : <Moon className="w-3.5 h-3.5 text-ink-2" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          {user && (
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-neg hover:bg-surface-2 dark:hover:bg-neg-tint transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );

  return createPortal(drawerElement, document.body);
};
