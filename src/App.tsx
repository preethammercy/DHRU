// DHRU.AI - Main Application Shell
// AI-Powered Real-Time Indian Financial Market Intelligence Platform
// White & Blue Fintrix theme with smooth scrolling, zooming, and full Vercel compatibility.

import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { Navigation } from './components/common/Navigation';
import { UniversalSearchModal } from './components/common/UniversalSearchModal';
import { MarketStatus } from './types';
import { getMarketStatus } from './services/api';
import { DhruLogo } from './components/common/DhruLogo';

// Pages
import { OverviewPage } from './pages/OverviewPage';
import { IndicesPage } from './pages/IndicesPage';
import { StocksPage } from './pages/StocksPage';
import { StockDetailPage } from './pages/StockDetailPage';
import { SectorsPage } from './pages/SectorsPage';
import { CommoditiesPage } from './pages/CommoditiesPage';
import { DerivativesPage } from './pages/DerivativesPage';
import { IpoActionsPage } from './pages/IpoActionsPage';
import { NewsPage } from './pages/NewsPage';
import { AiPredictionsPage } from './pages/AiPredictionsPage';
import { RiskMonitorPage } from './pages/RiskMonitorPage';
import { PatternExplorerPage } from './pages/PatternExplorerPage';
import { BacktestingPage } from './pages/BacktestingPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { AskDhruPage } from './pages/AskDhruPage';
import { MethodologyPage } from './pages/MethodologyPage';

export function App() {
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE.NS');
  const [askDhruQuestion, setAskDhruQuestion] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);

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
    setActiveNav('stock-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskDhruContext = (question: string) => {
    setAskDhruQuestion(question);
    setActiveNav('ask-dhru');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 dark:bg-[#070B14] dark:text-[#F1F5F9] transition-colors">
      
      {/* 1. Global Header */}
      <Header
        marketStatus={marketStatus}
        onOpenSearch={() => setSearchOpen(true)}
        onSelectNav={setActiveNav}
        activeNav={activeNav}
      />

      {/* 2. Top Module Navigation Strip */}
      <Navigation
        activeNav={activeNav}
        onSelectNav={setActiveNav}
      />

      {/* 3. Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeNav === 'overview' && (
          <OverviewPage
            onSelectStock={handleSelectStock}
            onNavigate={setActiveNav}
          />
        )}

        {activeNav === 'indices' && (
          <IndicesPage
            onSelectIndex={handleSelectStock}
          />
        )}

        {activeNav === 'stocks' && (
          <StocksPage
            onSelectStock={handleSelectStock}
          />
        )}

        {activeNav === 'stock-detail' && (
          <StockDetailPage
            symbol={selectedSymbol}
            onBack={() => setActiveNav('stocks')}
            onAskDhru={handleAskDhruContext}
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
          />
        )}

        {activeNav === 'derivatives' && (
          <DerivativesPage />
        )}

        {activeNav === 'ipo-actions' && (
          <IpoActionsPage />
        )}

        {activeNav === 'news' && (
          <NewsPage
            onSelectStock={handleSelectStock}
          />
        )}

        {activeNav === 'ai-predictions' && (
          <AiPredictionsPage
            onSelectStock={handleSelectStock}
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

        {activeNav === 'backtesting' && (
          <BacktestingPage
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

        {activeNav === 'methodology' && (
          <MethodologyPage />
        )}
      </main>

      {/* 4. Global Modals */}
      <UniversalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectInstrument={handleSelectStock}
      />

      {/* 5. Institutional Footer */}
      <footer className="w-full bg-white dark:bg-[#05080E] border-t border-slate-200 dark:border-[#1A2744] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <DhruLogo size={22} />
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">DHRU.AI</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-700/50">
                  INDIA EDITION
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                “Understand Every Market. See Beyond the Numbers.”
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              <button onClick={() => setActiveNav('overview')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Overview</button>
              <button onClick={() => setActiveNav('indices')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Indices</button>
              <button onClick={() => setActiveNav('stocks')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Stocks</button>
              <button onClick={() => setActiveNav('sectors')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Sectors</button>
              <button onClick={() => setActiveNav('risk-monitor')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Risk Monitor</button>
              <button onClick={() => setActiveNav('ask-dhru')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Ask DHRU AI</button>
              <button onClick={() => setActiveNav('methodology')} className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors cursor-pointer">Methodology & Sources</button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
            <span>© 2026 DHRU.AI • Real-Time Exchange Data & DHRU Intelligence</span>
            <span>Educational Financial Platform • Not SEBI Registered Investment Advice</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
