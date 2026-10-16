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
  Briefcase
} from 'lucide-react';
import { DhruLogo } from './DhruLogo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useWatchlist } from '../../context/WatchlistContext';
import { useTrading } from '../../context/TradingContext';
import { useMarketStream } from '../../context/MarketStreamContext';

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
      const usdVal = val / 83.33;
      return `$${usdVal.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
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
        className="absolute inset-0 bg-slate-950/75 dark:bg-black/85 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 2. Off-canvas sliding drawer container */}
      <div
        className="relative w-[86vw] max-w-[320px] bg-white dark:bg-[#070B14] text-slate-900 dark:text-slate-100 h-full shadow-2xl flex flex-col z-10 overflow-hidden border-r border-slate-200 dark:border-[#1A2744] animate-in slide-in-from-left duration-250"
        style={{
          height: '100%',
          maxHeight: '100dvh'
        }}
      >
        
        {/* Header with Logo, Version Badge, and Close Button */}
        <div className="p-4 border-b border-slate-200 dark:border-[#1A2744] flex items-center justify-between bg-slate-50/80 dark:bg-[#0D1527]/80">
          <div className="flex items-center gap-2.5">
            <DhruLogo size={28} />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 dark:from-white dark:to-cyan-400 bg-clip-text text-transparent">
                  DHRU.AI
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-cyan-300">
                  v2.0
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">
                {isCrypto ? 'Global 24/7 Desk' : 'NSE / BSE India'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-[#131F38] text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
            title="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 divide-y divide-slate-100 dark:divide-slate-800/60">
          
          {/* Quick-Access Horizontal Jump Strip */}
          <div className="pt-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-1 font-bold block mb-2">
              Featured Pages
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => handleNavClick('indices')}
                className="px-2.5 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[11px] font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Coins className="w-3 h-3" />
                <span>Crypto Assets</span>
              </button>
              <button
                onClick={() => handleNavClick('patterns')}
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-cyan-500/10 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-cyan-500/20 text-[11px] font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Eye className="w-3 h-3" />
                <span>AI Vision Scanner</span>
              </button>
              <button
                onClick={() => handleNavClick('ai-predictions')}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Target className="w-3 h-3" />
                <span>SMC Predictions</span>
              </button>
              <button
                onClick={() => handleNavClick('terminal')}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[11px] font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <CandlestickChart className="w-3 h-3 text-emerald-400" />
                <span>Terminal</span>
              </button>
              <button
                onClick={() => handleNavClick('positions')}
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 text-[11px] font-bold shrink-0 flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
              >
                <Briefcase className="w-3 h-3" />
                <span>Positions ({positions.length})</span>
              </button>
            </div>
          </div>

          {/* Market Desk Switcher Banner */}
          <div className="pt-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-[#0D1527] dark:to-[#131F38] border border-blue-200/80 dark:border-[#1E2D4A] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Trading Desk</span>
                <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  {isCrypto ? <span>🪙 Global Crypto & FX</span> : <span>🇮🇳 Indian NSE / BSE</span>}
                </div>
              </div>
              <button
                onClick={() => {
                  setShowMarketSelector(true);
                  onClose();
                }}
                className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer"
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
              className="w-full flex items-center justify-between px-3 py-2 text-xs bg-slate-50 dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 rounded-xl text-slate-500 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>Search stocks, cryptos, FX...</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">Search</span>
            </button>
          </div>

          {/* User Account / Virtual Margin Card */}
          <div className="pt-3">
            {user ? (
              <div className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="w-7 h-7 rounded-full ring-1 ring-blue-500 shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      {user.displayName?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">{user.displayName}</p>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      <Wallet className="w-3 h-3" />
                      <span>{formatMargin(marginAvailable)} Margin</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleNavClick('profile')}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 cursor-pointer"
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
                className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In with Google</span>
              </button>
            )}
          </div>

          {/* 1. Core Platform Pages */}
          <div className="pt-3 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 font-bold">
              Core Platform
            </span>

            {[
              { id: 'overview', label: isCrypto ? 'Crypto & FX Overview' : 'Market Overview', icon: LayoutDashboard },
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
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.count !== undefined && (
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}>
                        {item.count}
                      </span>
                    )}
                    {item.isLive && (
                      <span className="flex items-center gap-1 text-[10px] font-mono uppercase font-bold text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
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
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 font-bold">
              Market Assets Directory
            </span>

            {[
              { id: 'indices', label: isCrypto ? '🪙 Crypto & Forex Assets (48+)' : '📈 NSE & BSE Indices', icon: isCrypto ? Coins : TrendingUp, badge: isCrypto ? '38+ Coins' : 'Indices' },
              { id: 'stocks', label: '📊 All Stocks Screener (2,600+)', icon: ListFilter, badge: 'Equities' },
              { id: 'sectors', label: '🔥 Ecosystems & Heatmaps', icon: PieChart },
              { id: 'commodities', label: '🛢️ Commodities & FX (Gold, Oil)', icon: Coins },
              { id: 'derivatives', label: '⚡ Futures & Options (F&O)', icon: Binary },
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
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
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
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 px-2 font-bold">
              AI Quantitative Lab
            </span>

            {[
              { id: 'ai-predictions', label: '🎯 AI Market Predictions & SMC', icon: Zap, badge: 'SMC v3.5' },
              { id: 'patterns', label: '👁️ AI Pattern Vision Scanner', icon: CandlestickChart, badge: 'Vision' },
              { id: 'risk-monitor', label: '🛡️ Volatility & Risk Monitor', icon: ShieldAlert },
              { id: 'ask-dhru', label: '✨ Ask DHRU Assistant', icon: Sparkles }
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                      isActive ? 'bg-white/20 text-white' : 'bg-blue-50 dark:bg-cyan-500/10 text-blue-600 dark:text-cyan-400'
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
        <div className="p-3 border-t border-slate-200 dark:border-[#1A2744] bg-slate-50/80 dark:bg-[#070B14] flex items-center justify-between safe-area-bottom">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>

          {user && (
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
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
