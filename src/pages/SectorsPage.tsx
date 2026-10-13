// DHRU.AI - Indian Market Sectors Explorer
// Sector heatmaps, constituent drilldown, and AI-generated drivers.
// White & Blue Fintrix styling with smooth zoom animations.

import React, { useEffect, useState } from 'react';
import { getSectors } from '../services/api';
import { PieChart, ArrowUpRight, ArrowDownRight, Layers, ArrowRight, Sparkles } from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
}

export const SectorsPage: React.FC<Props> = ({ onSelectStock }) => {
  const [sectors, setSectors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<any>(null);

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
        <div className="w-8 h-8 border-2 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500 dark:text-slate-400">Loading sector performance and constituent mapping...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card zoom-card flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 flex items-center justify-center">
              <PieChart className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Sector Explorer & Heatmap</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analyze sectoral rotation, performance divergence, and heavyweights across all Indian industries
          </p>
        </div>
      </div>

      {/* Sector Performance Grid / Heatmap */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {sectors.map(sec => {
          const isUp = sec.changePercent >= 0;
          const isSelected = selectedSector?.id === sec.id;
          return (
            <div
              key={sec.id}
              onClick={() => setSelectedSector(sec)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all shadow-card zoom-card flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/80 dark:bg-[#131F38] border-blue-500 ring-2 ring-blue-500/20'
                  : 'bg-white dark:bg-[#0D1527] border-slate-200 dark:border-[#1A2744] hover:border-blue-400 hover:shadow-card-hover'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-[10px] font-mono text-slate-400">{sec.indexSymbol || 'SECTOR'}</span>
                  <span className={`text-xs font-mono font-bold flex items-center ${isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                    {isUp ? `+${sec.changePercent}%` : `${sec.changePercent}%`}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{sec.name}</h3>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#1A2744]/60 flex items-center justify-between text-[11px] text-slate-500">
                <span>{sec.constituentsCount} Listed Stocks</span>
                {sec.indexPrice > 0 && <span className="font-mono text-slate-700 dark:text-slate-200">₹{sec.indexPrice.toLocaleString('en-IN')}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Sector Deep Dive & Constituents */}
      {selectedSector && (
        <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-6 shadow-card space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1A2744]">
            <div>
              <div className="text-xs font-mono text-blue-600 dark:text-cyan-400 uppercase font-semibold">Constituent Heavyweights</div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{selectedSector.name}</h2>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              Benchmark Index: <strong className="text-slate-800 dark:text-slate-200">{selectedSector.indexSymbol || 'Composite Sector Basket'}</strong>
            </div>
          </div>

          {/* AI Sector Driver Insight */}
          <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-gradient-to-r dark:from-blue-950/30 dark:to-[#070B14] border border-blue-200 dark:border-cyan-500/20 text-xs flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-blue-600 dark:text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-blue-900 dark:text-slate-200">Sector Analysis & Macro Drivers:</div>
              <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                The {selectedSector.name} sector in India is influenced by domestic credit growth, quarterly earnings delivery, export dynamics, and RBI monetary policy interest rate cycles. Click on any constituent below to examine real charts and technical indicators.
              </p>
            </div>
          </div>

          {/* Constituents Grid */}
          <div>
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
              Key Listed Leaders in {selectedSector.name}:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {selectedSector.topConstituents?.map((c: any) => (
                <div
                  key={c.symbol}
                  onClick={() => onSelectStock(c.symbol)}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 dark:hover:border-cyan-500/40 hover:bg-white dark:hover:bg-[#0c1424] cursor-pointer transition-all flex items-center justify-between group shadow-sm zoom-card"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-cyan-300 transition-colors">
                      {c.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">{c.ticker}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
