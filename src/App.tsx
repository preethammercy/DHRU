// DHRU.AI - Main Application Shell
// AI-Powered Real-Time Indian & Global Financial Market Intelligence Platform
// White & Blue Fintrix theme with smooth scrolling, zooming, and full Vercel compatibility.

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { duration, ease } from './design/motion';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { MarketTickerStrip } from './components/common/MarketTickerStrip';
import { SpatialBackground } from './components/ui/SpatialBackground';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { UniversalSearchModal } from './components/common/UniversalSearchModal';
import { MarketSelectorModal } from './components/common/MarketSelectorModal';
import { MarketStatus } from './types';
import { getMarketStatus } from './services/api';
import { DhruLogo } from './components/common/DhruLogo';
import { useScrollAnimation } from './hooks/useScrollAnimation';
import { MobileSidebarDrawer } from './components/common/MobileSidebarDrawer';
import { TradeNotificationToast } from './components/common/TradeNotificationToast';

// Pages
import { LoginPage } from './pages/LoginPage';
import { OverviewPage } from './pages/OverviewPage';
import { TradingTerminalPage } from './pages/TradingTerminalPage';
import { IndicesPage } from './pages/IndicesPage';
import { StocksPage } from './pages/StocksPage';
import { StockDetailPage } from './pages/StockDetailPage';
import { SectorsPage } from './pages/SectorsPage';
import { CommoditiesPage } from './pages/CommoditiesPage';
import { DerivativesPage } from './pages/DerivativesPage';
import { NewsPage } from './pages/NewsPage';
import { AiPredictionsPage } from './pages/AiPredictionsPage';
import { RiskMonitorPage } from './pages/RiskMonitorPage';
import { PatternExplorerPage } from './pages/PatternExplorerPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { AskDhruPage } from './pages/AskDhruPage';
import { ProfilePage } from './pages/ProfilePage';
import { PositionsHoldingsPage } from './pages/PositionsHoldingsPage';
import { LivePredictionsModal } from './components/common/LivePredictionsModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { AutoTradeMonitor } from './components/common/AutoTradeMonitor';
import { AutoTradePage } from './pages/AutoTradePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { UpiPaymentModal } from './components/payment/UpiPaymentModal';
import { WithdrawModal } from './components/payment/WithdrawModal';
import { MobilePromptModal } from './components/common/MobilePromptModal';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketStreamProvider } from './context/MarketStreamContext';
import { TradingProvider } from './context/TradingContext';
import { WalletProvider } from './context/WalletContext';

// Path mapping dictionary for URL routing (e.g., /home, /dashboard, /terminal, /markets, etc.)
const PATH_TO_NAV: Record<string, string> = {
  '': 'overview',
  'home': 'overview',
  'overview': 'overview',
  'dashboard': 'overview',
  'terminal': 'terminal',
  'trade': 'terminal',
  'autotrade': 'autotrade',
  'auto-trade': 'autotrade',
  'bot': 'autotrade',
  'algo': 'autotrade',
  'indices': 'indices',
  'markets': 'indices',
  'assets': 'indices',
  'stocks': 'stocks',
  'equities': 'stocks',
  'sectors': 'sectors',
  'heatmap': 'sectors',
  'commodities': 'commodities',
  'derivatives': 'derivatives',
  'fno': 'derivatives',
  'news': 'news',
  'ai-predictions': 'ai-predictions',
  'predictions': 'ai-predictions',
  'signals': 'ai-predictions',
  'risk-monitor': 'risk-monitor',
  'risk': 'risk-monitor',
  'patterns': 'patterns',
  'pattern-scanner': 'patterns',
  'watchlist': 'watchlist',
  'positions': 'positions',
  'holdings': 'positions',
  'portfolio': 'positions',
  'profile': 'profile',
  'account': 'profile',
  'admin': 'admin',
  'approvals': 'admin',
  'ask-dhru': 'ask-dhru',
  'ai': 'ask-dhru',
};

function getNavFromLocation(): { nav: string; symbol?: string } {
  if (typeof window === 'undefined') return { nav: 'overview' };
  const rawPath = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();

  if (rawPath.startsWith('stock/') || rawPath.startsWith('quote/')) {
    const sym = window.location.pathname.split('/')[2];
    return { nav: 'stock-detail', symbol: sym ? decodeURIComponent(sym).toUpperCase() : undefined };
  }

  const nav = PATH_TO_NAV[rawPath] || 'overview';
  return { nav };
}

function AppContent() {
  const initialRoute = getNavFromLocation();
  const { user, loading, showMarketSelector, setShowMarketSelector, marketMode } = useAuth();
  const [activeNav, setActiveNavState] = useState(initialRoute.nav);
  const [pageDirection, setPageDirection] = useState(1);
  const systemReducedMotion = useReducedMotion();
  const [userReducedMotion, setUserReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('dhru_reduce_motion') === 'true';
  });
  const reduceMotion = systemReducedMotion || userReducedMotion;

  useEffect(() => {
    const handlePref = (e: any) => {
      setUserReducedMotion(Boolean(e.detail?.reduceMotion));
    };
    window.addEventListener('dhru_motion_preference_changed', handlePref);
    return () => window.removeEventListener('dhru_motion_preference_changed', handlePref);
  }, []);

  const [isNavigating, setIsNavigating] = useState(false);
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 300);
    return () => clearTimeout(timer);
  }, [activeNav]);
  const [selectedSymbol, setSelectedSymbol] = useState(() => {
    const savedSymbol = initialRoute.symbol || localStorage.getItem('dhru_selected_symbol');
    if (marketMode === 'crypto') return savedSymbol?.endsWith('-USD') ? savedSymbol : 'BTC-USD';
    return savedSymbol && !savedSymbol.endsWith('-USD') ? savedSymbol : 'RELIANCE.NS';
  });
  const [askDhruQuestion, setAskDhruQuestion] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [predictionsModalOpen, setPredictionsModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);

  const previousMarketMode = useRef(marketMode);

  // Browsers may restore the previous page's scroll offset after auth resumes.
  // Dashboard sessions should always open at the header and first market cards.
  useEffect(() => {
    if (loading || !user) return;
    window.history.scrollRestoration = 'manual';
    const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior }));
    return () => window.cancelAnimationFrame(frame);
  }, [loading, user?.uid]);

  useEffect(() => {
    localStorage.setItem('dhru_selected_symbol', selectedSymbol);
  }, [selectedSymbol]);

  const pageOrder = ['overview', 'terminal', 'positions', 'autotrade', 'indices', 'stocks', 'stock-detail', 'sectors', 'commodities', 'derivatives', 'news', 'ai-predictions', 'risk-monitor', 'patterns', 'watchlist', 'ask-dhru', 'profile'];

  // Scroll entrance animation hook
  useScrollAnimation(activeNav);

  // Synchronize URL and page state with HTML5 History API
  const setActiveNav = (page: string, symbolToSet?: string) => {
    const oldIndex = pageOrder.indexOf(activeNav);
    const nextIndex = pageOrder.indexOf(page);
    if (oldIndex >= 0 && nextIndex >= 0 && oldIndex !== nextIndex) {
      setPageDirection(nextIndex > oldIndex ? 1 : -1);
    }
    setActiveNavState(page);
    let targetPath = `/${page}`;
    if (page === 'overview') targetPath = '/dashboard';
    if (page === 'stock-detail' && symbolToSet) {
      targetPath = `/stock/${encodeURIComponent(symbolToSet)}`;
    }
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState({ page, symbol: symbolToSet }, '', targetPath);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Listen to browser Back / Forward history events
  useEffect(() => {
    const handlePopState = () => {
      const route = getNavFromLocation();
      const oldIndex = pageOrder.indexOf(activeNav);
      const nextIndex = pageOrder.indexOf(route.nav);
      if (oldIndex >= 0 && nextIndex >= 0 && oldIndex !== nextIndex) {
        setPageDirection(nextIndex > oldIndex ? 1 : -1);
      }
      setActiveNavState(route.nav);
      if (route.symbol) setSelectedSymbol(route.symbol);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeNav]);

  // Only select a new default when the user switches desks. Preserve deep-linked and saved symbols on refresh.
  useEffect(() => {
    if (previousMarketMode.current !== marketMode) {
      previousMarketMode.current = marketMode;
      setSelectedSymbol(marketMode === 'crypto' ? 'BTC-USD' : 'RELIANCE.NS');
    }
    const indiaOnlyPages = ['stocks', 'sectors', 'commodities', 'derivatives'];
    if (marketMode === 'crypto' && indiaOnlyPages.includes(activeNav)) {
      setActiveNavState('overview');
      window.history.replaceState({ page: 'overview' }, '', '/dashboard');
    }
  }, [marketMode, activeNav]);

  // Fetch initial market status
  useEffect(() => {
    getMarketStatus().then(setMarketStatus).catch(console.error);
    const interval = setInterval(() => {
      getMarketStatus().then(setMarketStatus).catch(() => {});
    }, 30000); // 30s update
    return () => clearInterval(interval);
  }, []);

  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveNav('stock-detail', symbol);
  };

  const handleTradeStock = (symbol: string) => {
    setSelectedSymbol(symbol);
    setActiveNav('terminal');
  };

  const handleAskDhruContext = (question: string) => {
    setAskDhruQuestion(question);
    setActiveNav('ask-dhru');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <DhruLogo size={44} />
          <div className="w-6 h-6 border-2 border-line border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-ink-2">Connecting to DHRU.AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg text-ink transition-colors w-full max-w-full overflow-x-hidden">
      
      {/* Global Top Route Progress Loader */}
      {isNavigating && !reduceMotion && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-500 shadow-[0_0_12px_rgba(56,189,248,0.8)] animate-pulse" />
      )}

      {/* 3D Spatial Interactive Depth Background */}
      <SpatialBackground reduceMotion={reduceMotion} />

      {/* 1. Global Header */}
      <Header
        marketStatus={marketStatus}
        onOpenSearch={() => setSearchOpen(true)}
        onSelectNav={setActiveNav}
        activeNav={activeNav}
        onOpenPredictions={() => setPredictionsModalOpen(true)}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* 2. Top Module Navigation Strip */}
      <Navigation
        activeNav={activeNav}
        onSelectNav={setActiveNav}
      />

      {/* 2.5 Real-Time Scrolling Market Prices Ticker Stripe */}
      <MarketTickerStrip
        onSelectStock={handleSelectStock}
        onOpenPredictions={() => setPredictionsModalOpen(true)}
      />

      {/* 3. Main Content Container */}
      <main className={activeNav === 'terminal' ? "flex-1 w-full max-w-full px-2 sm:px-4 py-4 pb-36 sm:pb-32 lg:pb-4 overflow-x-hidden" : "flex-1 max-w-7xl w-full max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-36 sm:pb-32 lg:pb-8 overflow-x-hidden"}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeNav}
            className="min-w-0"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.995 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : -8, scale: reduceMotion ? 1 : 0.995 }}
            transition={{ duration: reduceMotion ? 0.12 : 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
        {activeNav === 'terminal' && (
          <TradingTerminalPage
            initialSymbol={selectedSymbol}
            onSelectStock={handleSelectStock}
            onNavigate={setActiveNav}
          />
        )}

        {activeNav === 'overview' && (
          <OverviewPage
            onSelectStock={handleSelectStock}
            onTradeStock={handleTradeStock}
            onNavigate={setActiveNav}
          />
        )}

        {activeNav === 'indices' && (
          <IndicesPage
            onSelectIndex={handleSelectStock}
            onTradeIndex={handleTradeStock}
          />
        )}

        {activeNav === 'stocks' && (
          <StocksPage
            onSelectStock={handleSelectStock}
            onTradeStock={handleTradeStock}
          />
        )}

        {activeNav === 'stock-detail' && (
          <StockDetailPage
            symbol={selectedSymbol}
            onBack={() => setActiveNav(marketMode === 'crypto' ? 'indices' : 'stocks')}
            onAskDhru={handleAskDhruContext}
            onTradeStock={handleTradeStock}
          />
        )}

        {activeNav === 'sectors' && (
          <SectorsPage
            onSelectStock={handleSelectStock}
          />
        )}

        {activeNav === 'commodities' && (
          <CommoditiesPage
            onSelectInstrument={handleSelectStock}
            onTradeInstrument={handleTradeStock}
          />
        )}

        {activeNav === 'derivatives' && (
          <DerivativesPage />
        )}

        {activeNav === 'news' && (
          <NewsPage
            onSelectStock={handleSelectStock}
          />
        )}

        {activeNav === 'ai-predictions' && (
          <AiPredictionsPage
            onSelectStock={handleSelectStock}
            onTradeStock={handleTradeStock}
            onNavigate={setActiveNav}
          />
        )}

        {activeNav === 'autotrade' && (
          <AutoTradePage />
        )}

        {activeNav === 'risk-monitor' && (
          <RiskMonitorPage />
        )}

        {activeNav === 'patterns' && (
          <PatternExplorerPage
            onSelectStock={handleSelectStock}
          />
        )}

        {activeNav === 'watchlist' && (
          <WatchlistPage
            onSelectStock={handleSelectStock}
            onOpenSearch={() => setSearchOpen(true)}
          />
        )}

        {activeNav === 'ask-dhru' && (
          <AskDhruPage
            currentSymbol={selectedSymbol}
            initialQuestion={askDhruQuestion}
            onSelectStock={handleSelectStock}
          />
        )}

        {activeNav === 'positions' && (
          <PositionsHoldingsPage
            onSelectStock={handleSelectStock}
            onTradeStock={handleTradeStock}
            onNavigate={setActiveNav}
          />
        )}

        {activeNav === 'profile' && (
          <ProfilePage />
        )}

        {activeNav === 'admin' && (
          <AdminDashboardPage onNavigate={setActiveNav} />
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 4. Global Modals & Mobile Drawer */}
      <TradeNotificationToast />
      <AutoTradeMonitor />
      <MobileSidebarDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenPredictions={() => setPredictionsModalOpen(true)}
      />

      <UniversalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectInstrument={handleSelectStock}
        onTradeInstrument={handleTradeStock}
      />

      <MarketSelectorModal
        isOpen={showMarketSelector}
        onClose={() => setShowMarketSelector(false)}
        onSelectMode={(mode) => {
          if (mode === 'crypto') {
            setSelectedSymbol('BTC-USD');
          } else {
            setSelectedSymbol('RELIANCE.NS');
          }
        }}
      />

      <LivePredictionsModal
        isOpen={predictionsModalOpen}
        onClose={() => setPredictionsModalOpen(false)}
        onSelectTrade={(sym) => {
          setSelectedSymbol(sym);
          setActiveNav('terminal');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* 5. Institutional Footer */}
      <footer className="w-full bg-surface border-t border-line py-8 pb-28 lg:pb-8 text-xs text-ink-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <DhruLogo size={22} />
                <span className="font-extrabold text-base tracking-tight text-ink dark:text-ink">DHRU.AI</span>
                <span className="text-ink font-mono px-2 py-0.5 rounded-full bg-surface-2 text-brand dark:bg-brand-fill dark:text-brand font-semibold border border-line dark:border-line">
                  {marketMode === 'crypto' ? 'GLOBAL CRYPTO DESK' : 'INDIA EDITION'}
                </span>
              </div>
              <p className="text-ink-2 dark:text-ink-3 mt-1">
                “Understand Every Market. See Beyond the Numbers.”
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-ink-2 dark:text-ink-3">
              <button onClick={() => setActiveNav('terminal')} className="hover:text-brand dark:hover:text-brand transition-colors cursor-pointer font-bold">⚡ Live Terminal</button>
              <button onClick={() => setActiveNav('overview')} className="hover:text-brand dark:hover:text-brand transition-colors cursor-pointer">Overview</button>
              {marketMode === 'crypto' ? (
                <>
                  <button onClick={() => setActiveNav('indices')} className="hover:text-brand dark:hover:text-brand transition-colors cursor-pointer">Crypto Assets</button>
                  <button onClick={() => setActiveNav('patterns')} className="hover:text-brand dark:hover:text-brand transition-colors cursor-pointer">AI Pattern Vision</button>
                  <button onClick={() => setActiveNav('risk-monitor')} className="hover:text-brand dark:hover:text-brand transition-colors cursor-pointer">Volatility & Risk</button>
                </>
              ) : (
                <>
                  <button onClick={() => setActiveNav('indices')} className="hover:text-brand dark:hover:text-brand transition-colors cursor-pointer">NSE / BSE Indices</button>
                  <button onClick={() => setActiveNav('stocks')} className="hover:text-brand dark:hover:text-brand transition-colors cursor-pointer">Equities</button>
                  <button onClick={() => setActiveNav('sectors')} className="hover:text-brand dark:hover:text-brand transition-colors cursor-pointer">Sectors</button>
                  <button onClick={() => setActiveNav('derivatives')} className="hover:text-brand dark:hover:text-brand transition-colors cursor-pointer">Derivatives</button>
                  <button onClick={() => setActiveNav('commodities')} className="hover:text-brand dark:hover:text-brand transition-colors cursor-pointer">Commodities</button>
                </>
              )}
              <button onClick={() => setActiveNav('ask-dhru')} className="hover:text-brand dark:hover:text-brand transition-colors cursor-pointer">DHRU AI</button>
              <button onClick={() => setShowMarketSelector(true)} className="hover:text-brand dark:hover:text-brand transition-colors cursor-pointer font-bold text-brand dark:text-brand">🌐 Switch Market</button>
            </div>
          </div>

          <div className="pt-4 border-t border-line dark:border-line flex flex-col sm:flex-row items-center justify-between gap-2 text-ink-2 font-mono">
            <span>© 2026 DHRU.AI • Real-Time Exchange Data & DHRU Intelligence</span>
            <span>Educational Financial Platform • Free {marketMode === 'crypto' ? '$12,000' : '₹10,00,000'} Virtual Capital Included</span>
          </div>
        </div>
      </footer>

      {/* 6. Native Mobile Bottom Navigation Bar (Fixed for < lg screens) */}
      <MobileBottomNav
        activeNav={activeNav}
        onSelectNav={(page) => {
          setActiveNav(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        marketMode={marketMode}
        onOpenSearch={() => setSearchOpen(true)}
        onOpenPredictions={() => setPredictionsModalOpen(true)}
      />
    </div>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MarketStreamProvider>
          <WalletProvider>
            <TradingProvider>
              <AppContent />
              <UpiPaymentModal />
              <WithdrawModal />
              <MobilePromptModal />
            </TradingProvider>
          </WalletProvider>
        </MarketStreamProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
