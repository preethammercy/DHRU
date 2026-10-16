// DHRU.AI - Professional Technical Indicators Manager Modal
// Fully responsive, compact mobile-first bottom-sheet & desktop modal.
// Features 1-tap quick presets (SMC Suite, Trend, Momentum), touch-friendly cards,
// number steppers for mobile phones, color picker swatches, and createPortal to document.body.

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IndicatorConfig } from '../../types/indicators';
import {
  X,
  Search,
  Check,
  Sliders,
  RotateCcw,
  Sparkles,
  Plus,
  Minus,
  TrendingUp,
  Activity,
  Layers,
  Zap,
  SlidersHorizontal
} from 'lucide-react';

interface IndicatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  indicators: IndicatorConfig[];
  onToggleIndicator: (id: string) => void;
  onUpdateParams: (id: string, params: Record<string, any>) => void;
  onUpdateColor: (id: string, color: string) => void;
  onResetDefaults: () => void;
}

export const IndicatorModal: React.FC<IndicatorModalProps> = ({
  isOpen,
  onClose,
  indicators,
  onToggleIndicator,
  onUpdateParams,
  onUpdateColor,
  onResetDefaults,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'premium' | 'overlay' | 'oscillator'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Lock body scroll on mobile while modal is open
  useEffect(() => {
    if (isOpen && typeof document !== 'undefined') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  const filtered = indicators.filter(ind => {
    let matchCat = true;
    if (activeTab === 'premium') matchCat = ind.tier === 'premium';
    else if (activeTab === 'overlay') matchCat = ind.category === 'overlay';
    else if (activeTab === 'oscillator') matchCat = ind.category === 'oscillator';

    const matchSearch =
      ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ind.description && ind.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const activeCount = indicators.filter(i => i.enabled).length;

  // Quick 1-tap preset handlers
  const handleApplySmcPreset = () => {
    indicators.forEach(ind => {
      const shouldBeOn = ind.id === 'smc_order_blocks' || ind.id === 'smc_fvg';
      if (ind.enabled !== shouldBeOn) {
        onToggleIndicator(ind.id);
      }
    });
  };

  const handleApplyTrendPreset = () => {
    indicators.forEach(ind => {
      const shouldBeOn = ind.id === 'ema' || ind.id === 'supertrend' || ind.id === 'vwap';
      if (ind.enabled !== shouldBeOn) {
        onToggleIndicator(ind.id);
      }
    });
  };

  const handleApplyMomentumPreset = () => {
    indicators.forEach(ind => {
      const shouldBeOn = ind.id === 'rsi' || ind.id === 'macd';
      if (ind.enabled !== shouldBeOn) {
        onToggleIndicator(ind.id);
      }
    });
  };

  const handleClearAll = () => {
    indicators.forEach(ind => {
      if (ind.enabled) {
        onToggleIndicator(ind.id);
      }
    });
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      style={{ zIndex: 999999 }}
    >
      {/* Backdrop tap to close */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Main Bottom Sheet (Mobile) / Dialog (Desktop) */}
      <div
        className="relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[85vh] bg-white dark:bg-[#0A101D] border-t sm:border border-slate-200 dark:border-[#1E293B] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* 1. Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-[#070B14]/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 shrink-0">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                  Technical Indicators
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-cyan-300 shrink-0">
                  {activeCount} Active
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate hidden xs:block">
                SMC Order Flow, Multi-Timeframe Overlays & Oscillators
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-w-[38px] min-h-[38px] rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Mobile Quick Presets Strip */}
        <div className="px-4 sm:px-6 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#070B14]/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-400 shrink-0 mr-1 hidden sm:inline">
            Presets:
          </span>
          <button
            onClick={handleApplySmcPreset}
            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-[11px] font-bold shrink-0 flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>SMC Suite</span>
          </button>
          <button
            onClick={handleApplyTrendPreset}
            className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800/60 text-[11px] font-bold shrink-0 flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Trend Flow</span>
          </button>
          <button
            onClick={handleApplyMomentumPreset}
            className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 text-[11px] font-bold shrink-0 flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Activity className="w-3 h-3" />
            <span>Momentum</span>
          </button>
          {activeCount > 0 && (
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 text-[11px] font-bold shrink-0 hover:text-rose-600 transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* 3. Search & Category Tabs */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search indicators (SMC, EMA, RSI)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-100 dark:bg-[#070B14] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-0.5 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All ({indicators.length})
            </button>
            <button
              onClick={() => setActiveTab('premium')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'premium'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>SMC & Quant</span>
            </button>
            <button
              onClick={() => setActiveTab('overlay')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'overlay'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Overlays
            </button>
            <button
              onClick={() => setActiveTab('oscillator')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'oscillator'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Oscillators
            </button>
          </div>
        </div>

        {/* 4. Scrollable Indicator Cards List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5 divide-y-0 -webkit-overflow-scrolling-touch">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs sm:text-sm">
              No matching indicators found for "{searchQuery}"
            </div>
          ) : (
            filtered.map(ind => {
              const isEditing = editingId === ind.id;
              const hasParams = Object.keys(ind.params).length > 0;

              return (
                <div
                  key={ind.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    ind.enabled
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-300/80 dark:border-blue-800/60 shadow-xs'
                      : 'bg-white dark:bg-[#070B14] border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    
                    {/* Left: Tap to toggle + Indicator details */}
                    <div
                      onClick={() => onToggleIndicator(ind.id)}
                      className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0 cursor-pointer select-none"
                    >
                      {/* Checkbox button */}
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          ind.enabled
                            ? 'bg-blue-600 text-white shadow-xs shadow-blue-500/30'
                            : 'border-2 border-slate-300 dark:border-slate-600 hover:border-blue-400 bg-white dark:bg-slate-900'
                        }`}
                      >
                        {ind.enabled && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                            {ind.name}
                          </span>
                          {ind.badge && (
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-300/50">
                              {ind.badge}
                            </span>
                          )}
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                            {ind.category}
                          </span>
                        </div>

                        {ind.description && (
                          <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1 sm:line-clamp-2 mt-0.5">
                            {ind.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Color swatch & Tune Parameters Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Color Picker Swatch */}
                      <label
                        className="relative w-6 h-6 rounded-full cursor-pointer border-2 border-white dark:border-slate-800 shadow-xs overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-slate-300 dark:ring-slate-700"
                        style={{ backgroundColor: ind.color }}
                        title="Change indicator line color"
                      >
                        <input
                          type="color"
                          value={ind.color}
                          onChange={e => onUpdateColor(ind.id, e.target.value)}
                          className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                        />
                      </label>

                      {/* Tune Button */}
                      {hasParams && (
                        <button
                          onClick={() => setEditingId(isEditing ? null : ind.id)}
                          className={`px-2 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                            isEditing
                              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-400 bg-slate-50 dark:bg-slate-800/80'
                          }`}
                          title="Configure indicator parameters"
                        >
                          <SlidersHorizontal className="w-3 h-3" />
                          <span className="hidden xs:inline">{isEditing ? 'Close' : 'Tune'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 5. Parameter Tuning Drawer (Mobile-Compact with Steppers) */}
                  {isEditing && (
                    <div className="mt-3 p-3 bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 animate-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase font-mono">
                        <span>Parameter Tuning</span>
                        <span className="text-[10px] text-blue-600 dark:text-cyan-400 lowercase font-normal">
                          auto-saves instantly
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {Object.entries(ind.params).map(([key, val]) => {
                          const isNumeric = typeof val === 'number';
                          const step = typeof val === 'number' && val < 1 ? 0.05 : 1;

                          return (
                            <div
                              key={key}
                              className="p-2 rounded-lg bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                            >
                              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 capitalize truncate">
                                {key.replace(/([A-Z])/g, ' $1')}
                              </label>

                              {isNumeric ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = Math.max(0.01, Number(val) - step);
                                      onUpdateParams(ind.id, { [key]: parseFloat(newVal.toFixed(2)) });
                                    }}
                                    className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <input
                                    type="number"
                                    step={step}
                                    value={val as number}
                                    onChange={e => {
                                      const num = parseFloat(e.target.value);
                                      if (!isNaN(num)) {
                                        onUpdateParams(ind.id, { [key]: num });
                                      }
                                    }}
                                    className="w-14 px-1.5 py-0.5 text-center bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-mono font-bold text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = Number(val) + step;
                                      onUpdateParams(ind.id, { [key]: parseFloat(newVal.toFixed(2)) });
                                    }}
                                    className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={String(val)}
                                  onChange={e => {
                                    onUpdateParams(ind.id, { [key]: e.target.value });
                                  }}
                                  className="w-24 px-2 py-0.5 text-right bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-mono text-xs"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* 6. Mobile Safe Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-[#070B14] flex items-center justify-between gap-3 text-xs safe-area-bottom">
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-semibold cursor-pointer transition-colors py-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold rounded-xl shadow-xs shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Apply & Close</span>
            <span className="w-5 h-5 rounded-full bg-white/20 text-white font-mono text-[11px] flex items-center justify-center font-bold">
              {activeCount}
            </span>
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
