// DHRU.AI - Main Application Shell
// AI-Powered Real-Time Indian & Global Financial Market Intelligence Platform
// White & Blue Fintrix theme with smooth scrolling, zooming, and full Vercel compatibility.

import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { UniversalSearchModal } from './components/common/UniversalSearchModal';
import { MarketSelectorModal } from './components/common/MarketSelectorModal';
import { MarketStatus } from './types';
import { getMarketStatus } from './services/api';
import { DhruLogo } from './components/common/DhruLogo';
import { useScrollAnimation } from './hooks/useScrollAnimation';

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
import { LivePredictionsModal } from './components/common/LivePredictionsModal';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Contexts
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarketStreamProvider } from './context/MarketStreamContext';
import { TradingProvider } from './context/TradingContext';

// Path mapping dictionary for URL routing (e.g., /home, /dashboard, /terminal, /markets, etc.)
const PATH_TO_NAV: Record<string, string> = {
  '': 'overview',
  'home': 'overview',
  'overview': 'overview',
  'dashboard': 'overview',
  'terminal': 'terminal',
  'trade': 'terminal',
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
  'profile': 'profile',
  'account': 'profile',
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
  const [activeNav, setActiveNavState] = useState(initialRoute.nav);
  const [selectedSymbol, setSelectedSymbol] = useState(initialRoute.symbol || 'RELIANCE.NS');
  const [askDhruQuestion, setAskDhruQuestion] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [predictionsModalOpen, setPredictionsModalOpen] = useState(false);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);

  const { user, loading, showMarketSelector, setShowMarketSelector, marketMode } = useAuth();

  // Scroll entrance animation hook
  useScrollAnimation(activeNav);

  // Synchronize URL and page state with HTML5 History API
  const setActiveNav = (page: string, symbolToSet?: string) => {
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
      setActiveNavState(route.nav);
      if (route.symbol) setSelectedSymbol(route.symbol);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // If user changes market mode, default selected symbol accordingly
  useEffect(() => {
    if (marketMode === 'crypto') {
      setSelectedSymbol('BTC-USD');
    } else {
      setSelectedSymbol('RELIANCE.NS');
    }
  }, [marketMode]);

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
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] dark:bg-[#070B14]">
        <div className="flex flex-col items-center gap-3">
          <DhruLogo size={44} />
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-500">Connecting to DHRU.AI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 dark:bg-[#070B14] dark:text-[#F1F5F9] transition-colors w-full max-w-full overflow-x-hidden">
      
      {/* 1. Global Header */}
      <Header
        marketStatus={marketStatus}
        onOpenSearch={() => setSearchOpen(true)}
        onSelectNav={setActiveNav}
        activeNav={activeNav}
        onOpenPredictions={() => setPredictionsModalOpen(true)}
      />

      {/* 2. Top Module Navigation Strip */}
      <Navigation
        activeNav={activeNav}
        onSelectNav={setActiveNav}
      />

      {/* 3. Main Content Container */}
      <main className={activeNav === 'terminal' ? "flex-1 w-full max-w-full px-2 sm:px-4 py-4 pb-24 lg:pb-4 overflow-x-hidden" : "flex-1 max-w-7xl w-full max-w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-24 lg:pb-8 overflow-x-hidden"}>
        {activeNav === 'terminal' && (
          <TradingTerminalPage
            initialSymbol={selectedSymbol}
            onSelectStock={handleSelectStock}
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
          />
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

        {activeNav === 'profile' && (
          <ProfilePage />
        )}
      </main>

      {/* 4. Global Modals */}
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
      <footer className="w-full bg-white dark:bg-[#05080E] border-t border-slate-200 dark:border-[#1A2744] py-8 pb-28 lg:pb-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <DhruLogo size={22} />
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">DHRU.AI</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-700/50">
                  {marketMode === 'crypto' ? 'GLOBAL CRYPTO DESK' : 'INDIA EDITION'}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                “Understand Every Market. See Beyond the Numbers.”
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              <button onClick={() => setActiveNav('terminal')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer font-bold">⚡ Live Terminal</button>
              <button onClick={() => setActiveNav('overview')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Overview</button>
              {marketMode === 'crypto' ? (
                <>
                  <button onClick={() => setActiveNav('indices')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Crypto Assets</button>
                  <button onClick={() => setActiveNav('patterns')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">AI Pattern Vision</button>
                  <button onClick={() => setActiveNav('risk-monitor')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Volatility & Risk</button>
                </>
              ) : (
                <>
                  <button onClick={() => setActiveNav('indices')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">NSE / BSE Indices</button>
                  <button onClick={() => setActiveNav('stocks')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Equities</button>
                  <button onClick={() => setActiveNav('sectors')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Sectors</button>
                  <button onClick={() => setActiveNav('derivatives')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Derivatives</button>
                  <button onClick={() => setActiveNav('commodities')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Commodities</button>
                </>
              )}
              <button onClick={() => setActiveNav('ask-dhru')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Ask DHRU AI</button>
              <button onClick={() => setShowMarketSelector(true)} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer font-bold text-blue-600 dark:text-cyan-400">🌐 Switch Market</button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
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
          <TradingProvider>
            <AppContent />
          </TradingProvider>
        </MarketStreamProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
