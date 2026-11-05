// DHRU.AI - Indian Market Sectors Explorer
// Sector heatmaps, constituent drilldown, and AI-generated drivers.
// White & Blue Fintrix styling with smooth zoom animations.

import React, { useEffect, useState } from 'react';
import { getSectors } from '../services/api';
import { QuoteFreshness } from '../components/market/QuoteFreshness';
import { useMarketStream } from '../context/MarketStreamContext';
import { PieChart, ArrowUpRight, ArrowDownRight, Layers, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
}

export const SectorsPage: React.FC<Props> = ({ onSelectStock }) => {
  const { ticks, subscribeSymbol } = useMarketStream();
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<any>(null);

  useEffect(() => {
    sectors.map(sector => sector.indexSymbol).filter(Boolean).forEach(subscribeSymbol);
  }, [sectors, subscribeSymbol]);

  useEffect(() => {
    getSectors().then(data => {
      setSectors(data.sectors || []);
      if (data.sectors && data.sectors.length > 0) {
        setSelectedSector(data.sectors[0]);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-line dark:border-line border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-ink-2 dark:text-ink-3">Loading sector performance and constituent mapping...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-6  zoom-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-surface-2 dark:bg-brand-fill border border-line dark:border-line flex items-center justify-center">
              <PieChart className="w-4 h-4 text-brand dark:text-brand" />
            </div>
            <h1 className="text-xl font-extrabold text-ink dark:text-ink">Sector Explorer & Heatmap</h1>
          </div>
          <p className="text-xs text-ink-2 dark:text-ink-3 mt-1">
            Analyze sectoral rotation, performance divergence, and heavyweights across all Indian industries
          </p>
        </div>
      </div>

      {/* Sector Performance Grid / Heatmap */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sectors.map(sec => {
          const tick = ticks[sec.indexSymbol];
          const price = tick?.price ?? sec.indexPrice;
          const changePercent = tick?.changePercent ?? sec.changePercent;
          const isUp = Number(changePercent) >= 0;
          const isSelected = selectedSector?.id === sec.id;
          return (
            <div
              key={sec.id}
              onClick={() => setSelectedSector(sec)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all  zoom-card flex flex-col justify-between ${
                isSelected
                  ? 'bg-surface-2 dark:bg-surface border-line ring-2 ring-brand'
                  : 'bg-surface dark:bg-surface border-line dark:border-line hover:border-line hover:'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-ink font-mono text-ink-3">{sec.indexSymbol || 'SECTOR'}</span>
                  <span className={`text-xs font-mono font-bold flex items-center ${isUp ? 'text-pos dark:text-pos' : 'text-neg dark:text-neg'}`}>
                    {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                    {Number.isFinite(Number(changePercent)) ? `${isUp ? '+' : ''}${changePercent}%` : 'Unavailable'}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-ink dark:text-ink mt-1">{sec.name}</h3>
              </div>

              <div className="mt-3 pt-2 border-t border-line dark:border-line flex items-center justify-between text-ink-2">
                <span>{sec.constituentsCount} Listed Stocks</span>
                {price > 0 && <span className="font-mono text-ink-2 dark:text-ink-3">₹{Number(price).toLocaleString('en-IN')}</span>}
              </div>
              <QuoteFreshness status={tick?.status || sec.status} source={tick?.source || sec.source} lastUpdated={tick?.lastUpdated || sec.lastUpdated} timestamp={tick?.timestamp || sec.timestamp} />
            </div>
          );
        })}
      </div>

      {/* Selected Sector Deep Dive & Constituents */}
      {selectedSector && (
        <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-6  space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-line dark:border-line">
            <div>
              <div className="text-xs font-mono text-brand dark:text-brand uppercase font-semibold">Constituent Heavyweights</div>
              <h2 className="text-lg font-bold text-ink dark:text-ink mt-0.5">{selectedSector.name}</h2>
            </div>
            <div className="text-xs text-ink-2 font-mono">
              Benchmark Index: <strong className="text-ink dark:text-ink-3">{selectedSector.indexSymbol || 'Composite Sector Basket'}</strong>
            </div>
          </div>

          {/* AI Sector Driver Insight */}
          <div className="p-4 rounded-xl bg-surface-2 dark:bg-brand-fill   border border-line dark:border-line text-xs flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-brand dark:text-brand shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-brand dark:text-ink-3">Sector Analysis & Macro Drivers:</div>
              <p className="text-ink-2 dark:text-ink-3 mt-1 leading-relaxed">
                The {selectedSector.name} sector in India is influenced by domestic credit growth, quarterly earnings delivery, export dynamics, and RBI monetary policy interest rate cycles. Click on any constituent below to examine real charts and technical indicators.
              </p>
            </div>
          </div>

          {/* Constituents Grid */}
          <div>
            <div className="text-xs font-bold text-ink-2 dark:text-ink-3 uppercase tracking-wider mb-3">
              Key Listed Leaders in {selectedSector.name}:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {selectedSector.topConstituents?.map((c: any) => (
                <div
                  key={c.symbol}
                  onClick={() => onSelectStock(c.symbol)}
                  className="p-3.5 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line hover:border-line dark:hover:border-line hover:bg-surface dark:hover:bg-surface cursor-pointer transition-all flex items-center justify-between group  zoom-card"
                >
                  <div>
                    <div className="text-xs font-bold text-ink dark:text-ink-3 group-hover:text-brand dark:group-hover:text-brand transition-colors">
                      {c.name}
                    </div>
                    <div className="text-ink font-mono text-ink-3 mt-0.5">{c.ticker}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-ink-3 group-hover:text-brand group-hover:translate-x-0.5 transition-transform" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
