// DHRU.AI - Financial News Intelligence Engine
// Aggregated public RSS feeds from Livemint, Economic Times, Google News, and RBI.
// Sentiment badges, related instrument tags, verified source links, and instant filter.

import React, { useEffect, useState } from 'react';
import { getNews } from '../services/api';
import { NewsItem } from '../types';
import { Newspaper, Search, Filter, ExternalLink, RefreshCw, CheckCircle2, TrendingUp, TrendingDown, Sparkles } from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
}

export const NewsPage: React.FC<Props> = ({ onSelectStock }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState<'All' | 'Bullish' | 'Bearish' | 'Neutral'>('All');
  const [refreshing, setRefreshing] = useState(false);

  const loadNews = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getNews(force);
      setNews(data.news || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const filteredNews = news.filter(item => {
    const matchesSentiment = sentimentFilter === 'All' || item.sentiment === sentimentFilter;
    const matchesSearch = !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.publisher.toLowerCase().includes(search.toLowerCase()) ||
      item.relatedInstruments.some(inst => inst.toLowerCase().includes(search.toLowerCase()));
    return matchesSentiment && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Newspaper className="w-4 h-4 text-cyan-400" />
            </div>
            <h1 className="text-xl font-extrabold text-white">Financial News & Regulatory Announcements</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated without paid APIs directly from public financial feeds, deduplicated and sentiment-classified
          </p>
        </div>

        {/* Manual Refresh Trigger */}
        <button
          onClick={() => loadNews(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#070B14] border border-[#1A2744] text-xs font-semibold text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh Feeds
        </button>
      </div>

      {/* Search and Sentiment Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0D1527] border border-[#1A2744] p-3 rounded-2xl text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search news by company (e.g. Reliance, HDFC, Tata)..."
            className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1">Sentiment:</span>
          {(['All', 'Bullish', 'Bearish', 'Neutral'] as const).map(sent => (
            <button
              key={sent}
              onClick={() => setSentimentFilter(sent)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                sentimentFilter === sent
                  ? 'bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {sent}
            </button>
          ))}
        </div>
      </div>

      {/* News Feed Cards */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Parsing and deduplicating public RSS articles...</p>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          No news articles found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNews.map(item => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-[#0D1527] border border-[#1A2744] hover:border-cyan-500/40 hover:bg-[#111A30] transition-all shadow-md flex flex-col justify-between space-y-4 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-300">{item.publisher}</span>
                    <span>•</span>
                    <span>{item.sourceType}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    item.sentiment === 'Bullish'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : item.sentiment === 'Bearish'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {item.sentiment}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {/* Related Instruments & Link Footer */}
              <div className="pt-3 border-t border-[#1A2744]/70 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.relatedInstruments.slice(0, 3).map((inst, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectStock(`${inst}.NS`)}
                      className="px-2 py-0.5 rounded bg-[#070B14] hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-[#1A2744] transition-colors"
                    >
                      {inst}
                    </button>
                  ))}
                  <span className="text-slate-500">
                    {new Date(item.pubDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST
                  </span>
                </div>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-cyan-400 hover:underline font-semibold"
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
