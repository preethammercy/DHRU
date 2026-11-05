// DHRU.AI - Multi-Market Financial News Intelligence Engine
// Aggregated public RSS feeds: CoinDesk, Cointelegraph, Livemint, Economic Times, Google News.
// Strictly filtered <= 48h freshness, relative timestamps, sentiment classification, and live auto-refresh.

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { getNews } from '../services/api';
import { NewsItem } from '../types';
import {
  Newspaper,
  Search,
  Filter,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Clock,
  Globe,
  Coins,
  Building2,
  Layers
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { formatTimeAgo } from '../utils/formatters';

interface Props {
  onSelectStock: (symbol: string) => void;
}

type MarketTab = 'ALL' | 'CRYPTO' | 'NSE' | 'GLOBAL';

export const NewsPage: React.FC<Props> = ({ onSelectStock }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<MarketTab>('ALL');
  const [sentimentFilter, setSentimentFilter] = useState<'All' | 'Bullish' | 'Bearish' | 'Neutral'>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  const loadNews = useCallback(async (force = false, market = selectedMarket) => {
    if (force) setRefreshing(true);
    else if (news.length === 0) setLoading(true);

    try {
      const data = await getNews(force, market);
      const items: NewsItem[] = data.news || data.articles || [];
      setNews(items);
      setLastRefreshedAt(new Date());
    } catch (e) {
      console.error('Error fetching market news:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMarket, news.length]);

  // Initial load and reload when market tab changes
  useEffect(() => {
    loadNews(false, selectedMarket);
  }, [selectedMarket]);

  // 60-Second Auto-refresh interval (pauses when user switches tabs/document is hidden)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadNews(false, selectedMarket);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [selectedMarket, loadNews]);

  const filteredNews = news.filter(item => {
    const matchesSentiment = sentimentFilter === 'All' || item.sentiment === sentimentFilter;
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.publisher.toLowerCase().includes(search.toLowerCase()) ||
      (item.relatedInstruments && item.relatedInstruments.some(inst => inst.toLowerCase().includes(search.toLowerCase())));
    return matchesSentiment && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Newspaper className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-ink dark:text-ink flex items-center gap-2">
                Real-Time Market News & Intelligence
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
              </h1>
              <p className="text-xs text-ink-2 dark:text-ink-3 mt-1">
                Public RSS feeds from CoinDesk, Cointelegraph, Livemint, ET & Reuters · Strictly filtered ≤ 48h freshness · Auto-refreshes every 60s
              </p>
            </div>
          </div>
        </div>

        {/* Manual Refresh Trigger using Button component */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-3 font-mono hidden sm:inline">
            Updated {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <Button
            variant="refresh"
            size="sm"
            onClick={() => loadNews(true, selectedMarket)}
            loading={refreshing}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh News
          </Button>
        </div>
      </div>

      {/* Market Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-surface-2 dark:bg-surface p-1.5 rounded-2xl border border-line">
        {[
          { key: 'ALL', label: 'All Markets', icon: <Layers className="w-3.5 h-3.5" /> },
          { key: 'CRYPTO', label: 'Crypto (24/7)', icon: <Coins className="w-3.5 h-3.5 text-amber-400" /> },
          { key: 'NSE', label: 'Indian (NSE/BSE)', icon: <Building2 className="w-3.5 h-3.5 text-emerald-400" /> },
          { key: 'GLOBAL', label: 'Global Macro', icon: <Globe className="w-3.5 h-3.5 text-sky-400" /> },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setSelectedMarket(tab.key as MarketTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedMarket === tab.key
                ? 'bg-brand-fill text-on-brand shadow-sm scale-[1.02]'
                : 'text-ink-2 dark:text-ink-3 hover:text-ink dark:hover:text-white hover:bg-surface'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search and Sentiment Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface dark:bg-surface border border-line p-3 sm:p-4 rounded-2xl text-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-[240px] max-w-md bg-surface-2 dark:bg-slate-900/60 px-3 py-2 rounded-xl border border-line">
          <Search className="w-4 h-4 text-ink-3 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search news by token or company (e.g. BTC, ETH, Reliance, HDFC)..."
            className="w-full bg-transparent text-ink placeholder-slate-500 text-xs focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-ink-3 font-semibold mr-1">Sentiment:</span>
          {(['All', 'Bullish', 'Bearish', 'Neutral'] as const).map(sent => (
            <button
              key={sent}
              onClick={() => setSentimentFilter(sent)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                sentimentFilter === sent
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-surface-2 dark:bg-slate-900/40 text-ink-3 hover:text-ink border border-line'
              }`}
            >
              {sent}
            </button>
          ))}
        </div>
      </div>

      {/* News Feed Cards / Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-surface border border-line space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 bg-slate-700/40 rounded w-28" />
                <div className="h-4 bg-slate-700/40 rounded w-16" />
              </div>
              <div className="h-5 bg-slate-700/50 rounded w-4/5" />
              <div className="space-y-1.5">
                <div className="h-3.5 bg-slate-700/30 rounded w-full" />
                <div className="h-3.5 bg-slate-700/30 rounded w-3/4" />
              </div>
              <div className="pt-3 border-t border-line flex justify-between items-center">
                <div className="h-4 bg-slate-700/40 rounded w-20" />
                <div className="h-4 bg-slate-700/40 rounded w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-surface border border-line rounded-2xl">
          <Newspaper className="w-8 h-8 text-ink-3 mx-auto opacity-50" />
          <h3 className="text-sm font-bold text-ink">No articles found in this time window</h3>
          <p className="text-xs text-ink-3 max-w-sm mx-auto">
            Try switching market tabs or clearing your search keywords.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNews.map(item => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-surface border border-line hover:border-blue-500/50 hover:shadow-lg transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-xs font-mono mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sky-400">{item.publisher}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-ink-3 text-[11px]">{item.sourceType}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      item.sentiment === 'Bullish'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : item.sentiment === 'Bearish'
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : 'bg-slate-700/40 text-slate-300 border border-slate-600/40'
                    }`}
                  >
                    {item.sentiment}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-ink group-hover:text-sky-400 transition-colors leading-snug">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    {item.title}
                  </a>
                </h3>

                <p className="text-xs text-ink-2 dark:text-ink-3 mt-2 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {/* Related Instruments & Relative Time Footer */}
              <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.relatedInstruments && item.relatedInstruments.slice(0, 3).map((inst, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectStock(inst.includes('-USD') ? inst : `${inst}.NS`)}
                      className="px-2 py-0.5 rounded-md bg-surface-2 hover:bg-blue-600 hover:text-white text-sky-400 border border-line text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {inst}
                    </button>
                  ))}
                  <span className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <Clock className="w-3 h-3 text-emerald-400" />
                    {formatTimeAgo(item.pubDate)}
                  </span>
                </div>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold hover:underline text-xs"
                >
                  Original Article <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
