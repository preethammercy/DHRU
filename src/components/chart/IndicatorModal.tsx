// DHRU.AI - Professional Technical Indicators Manager Modal
// Fully responsive, compact mobile-first bottom-sheet & desktop modal.
// Features 1-tap quick presets (SMC Suite, Trend, Momentum), touch-friendly cards,
// number steppers for mobile phones, color picker swatches, and createPortal to document.body.

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { IndicatorConfig } from '../../types/indicators';
import { useWallet } from '../../context/WalletContext';
import { dispatchTradeNotification } from '../common/TradeNotificationToast';
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
  Lock,
  Wallet,
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
  const { wallet, openDepositModal } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'free' | 'premium' | 'overlay' | 'oscillator'>('all');
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
    if (activeTab === 'free') matchCat = ind.tier !== 'premium';
    else if (activeTab === 'premium') matchCat = ind.tier === 'premium';
    else if (activeTab === 'overlay') matchCat = ind.category === 'overlay';
    else if (activeTab === 'oscillator') matchCat = ind.category === 'oscillator';

    const matchSearch =
      ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ind.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ind.description && ind.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && matchSearch;
  });

  const activeCount = indicators.filter(i => i.enabled).length;

  const handleToggle = (ind: IndicatorConfig) => {
    if (ind.tier === 'premium' && !wallet.premiumUnlocked) {
      dispatchTradeNotification({
        type: 'REJECTED',
        title: 'Premium Indicator Locked',
        symbol: ind.shortName,
        status: 'BLOCKED',
        reason: 'Hold 1,000+ Credits to unlock all Institutional & SMC Indicators.'
      });
      openDepositModal('credits');
      return;
    }
    onToggleIndicator(ind.id);
  };

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
      className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-surface-2  animate-in fade-in duration-200"
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
        className="relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[85vh] bg-surface dark:bg-surface border-t sm:border border-line dark:border-line rounded-t-3xl sm:rounded-3xl  flex flex-col overflow-hidden text-ink dark:text-ink-3 z-10"
        onClick={e => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="w-full pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-12 h-1.5 rounded-full bg-surface-2 dark:bg-surface-2" />
        </div>

        {/* 1. Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-line dark:border-line bg-surface-2 dark:bg-surface">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand shrink-0">
              <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-ink dark:text-ink truncate">
                  Technical Indicators
                </h2>
                <span className="px-2 py-0.5 rounded-full text-ink font-mono font-bold bg-surface-2 text-brand dark:bg-brand-fill dark:text-brand shrink-0">
                  {activeCount} Active
                </span>
              </div>
              <p className="text-ink sm:text-xs text-ink-2 dark:text-ink-3 truncate hidden xs:block">
                SMC Order Flow, Multi-Timeframe Overlays & Oscillators
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-w-[38px] min-h-[38px] rounded-xl text-ink-3 hover:text-ink-2 dark:hover:text-ink hover:bg-surface-2 dark:hover:bg-surface-2 transition-colors flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1.5 Credits & Institutional Tier Status Banner */}
        <div className="mx-4 sm:mx-6 mt-3 p-2.5 rounded-xl bg-surface-2 border border-line flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-brand" />
            <span className="font-semibold text-ink">Credits: <strong className="font-mono text-brand">{wallet.credits}</strong></span>
            {wallet.premiumUnlocked ? (
              <span className="px-2 py-0.5 rounded-md bg-pos-tint text-pos font-bold text-[11px] flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> SMC & Quant Unlocked
              </span>
            ) : (
              <span className="text-ink-2 text-[11px] hidden xs:inline">(1,000+ unlocks SMC & Institutional Suite)</span>
            )}
          </div>
          {!wallet.premiumUnlocked && (
            <button
              type="button"
              onClick={() => openDepositModal('credits')}
              className="px-2.5 py-1 rounded-lg bg-brand-fill text-on-brand font-bold text-[11px] hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Unlock SMC</span>
            </button>
          )}
        </div>

        {/* 2. Mobile Quick Presets Strip */}
        <div className="px-4 sm:px-6 py-2 border-b border-line dark:border-line bg-surface-2 dark:bg-surface flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <span className="text-ink font-mono uppercase font-bold text-ink-3 shrink-0 mr-1 hidden sm:inline">
            Presets:
          </span>
          <button
            onClick={handleApplySmcPreset}
            className="px-2.5 py-1 rounded-lg bg-surface-2 dark:bg-surface-2 text-warn dark:text-warn border border-line dark:border-line text-ink font-bold shrink-0 flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-warn" />
            <span>SMC Suite</span>
          </button>
          <button
            onClick={handleApplyTrendPreset}
            className="px-2.5 py-1 rounded-lg bg-surface-2 dark:bg-brand-fill text-brand dark:text-brand border border-line dark:border-line text-ink font-bold shrink-0 flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Trend Flow</span>
          </button>
          <button
            onClick={handleApplyMomentumPreset}
            className="px-2.5 py-1 rounded-lg bg-surface-2 dark:bg-surface-2 text-ai dark:text-ai border border-line dark:border-line text-ink font-bold shrink-0 flex items-center gap-1 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Activity className="w-3 h-3" />
            <span>Momentum</span>
          </button>
          {activeCount > 0 && (
            <button
              onClick={handleClearAll}
              className="px-2.5 py-1 rounded-lg bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3 border border-line dark:border-line text-ink font-bold shrink-0 hover:text-neg transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>

        {/* 3. Search & Category Tabs */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-line dark:border-line flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-ink-3" />
            <input
              type="text"
              placeholder="Search indicators (SMC, EMA, RSI)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-ink-3 hover:text-ink-2 dark:hover:text-ink"
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
                  ? 'bg-brand-fill text-on-brand'
                  : 'bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3 hover:bg-surface-2'
              }`}
            >
              All ({indicators.length})
            </button>
            <button
              onClick={() => setActiveTab('free')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'free'
                  ? 'bg-brand-fill text-on-brand'
                  : 'bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3 hover:bg-surface-2'
              }`}
            >
              Free Standard
            </button>
            <button
              onClick={() => setActiveTab('premium')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'premium'
                  ? 'bg-brand-fill text-on-brand'
                  : 'bg-surface-2 dark:bg-surface-2 text-warn dark:text-warn border border-line dark:border-line'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>SMC & Quant {wallet.premiumUnlocked ? '✨' : '🔒'}</span>
            </button>
            <button
              onClick={() => setActiveTab('overlay')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'overlay'
                  ? 'bg-brand-fill text-on-brand'
                  : 'bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3 hover:bg-surface-2'
              }`}
            >
              Overlays
            </button>
            <button
              onClick={() => setActiveTab('oscillator')}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'oscillator'
                  ? 'bg-brand-fill text-on-brand'
                  : 'bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3 hover:bg-surface-2'
              }`}
            >
              Oscillators
            </button>
          </div>
        </div>

        {/* 4. Scrollable Indicator Cards List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-2.5 divide-y-0 -webkit-overflow-scrolling-touch">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-ink-3 text-xs sm:text-sm">
              No matching indicators found for "{searchQuery}"
            </div>
          ) : (
            filtered.map(ind => {
              const isEditing = editingId === ind.id;
              const hasParams = Object.keys(ind.params).length > 0;
              const isPremiumLocked = ind.tier === 'premium' && !wallet.premiumUnlocked;

              return (
                <div
                  key={ind.id}
                  className={`p-3 rounded-2xl border transition-all ${
                    ind.enabled
                      ? 'bg-surface-2 dark:bg-brand-fill border-line dark:border-line'
                      : isPremiumLocked
                      ? 'bg-surface/60 border-line/60 opacity-90'
                      : 'bg-surface dark:bg-surface border-line dark:border-line hover:border-line dark:hover:border-line'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    
                    {/* Left: Tap to toggle + Indicator details */}
                    <div
                      onClick={() => handleToggle(ind)}
                      className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0 cursor-pointer select-none"
                    >
                      {/* Checkbox button / Lock */}
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                          isPremiumLocked
                            ? 'bg-warn-tint text-warn border border-warn/30'
                            : ind.enabled
                            ? 'bg-brand-fill text-on-brand'
                            : 'border-2 border-line dark:border-line hover:border-line bg-surface dark:bg-surface-2'
                        }`}
                      >
                        {isPremiumLocked ? (
                          <Lock className="w-3.5 h-3.5" />
                        ) : ind.enabled ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-extrabold text-xs sm:text-sm text-ink dark:text-ink">
                            {ind.name}
                          </span>
                          {ind.tier === 'premium' ? (
                            wallet.premiumUnlocked ? (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-pos-tint text-pos border border-pos/30">
                                ✨ UNLOCKED
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-warn-tint text-warn border border-warn/30 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" /> 1K+ CREDITS
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-surface-2 text-ink-2 border border-line">
                              FREE
                            </span>
                          )}
                          {ind.badge && ind.badge !== 'Institutional' && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-surface-2 dark:bg-surface-2 text-warn dark:text-warn border border-line">
                              {ind.badge}
                            </span>
                          )}
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-surface-2 dark:bg-surface-2 text-ink-2 font-semibold">
                            {ind.category}
                          </span>
                        </div>

                        {ind.description && (
                          <p className="text-ink sm:text-xs text-ink-2 dark:text-ink-3 line-clamp-1 sm:line-clamp-2 mt-0.5">
                            {ind.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Color swatch & Tune Parameters Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Color Picker Swatch */}
                      <label
                        className="relative w-6 h-6 rounded-full cursor-pointer border-2 border-white dark:border-line  overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-slate-300 dark:ring-slate-700"
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
                              ? 'bg-brand-fill text-on-brand border-line '
                              : 'border-line dark:border-line text-ink-2 dark:text-ink-3 hover:border-line bg-surface-2 dark:bg-surface-2'
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
                    <div className="mt-3 p-3 bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl space-y-2.5 animate-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between text-ink font-bold text-ink-2 uppercase font-mono">
                        <span>Parameter Tuning</span>
                        <span className="text-ink text-brand dark:text-brand lowercase font-normal">
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
                              className="p-2 rounded-lg bg-surface dark:bg-surface border border-line dark:border-line flex items-center justify-between gap-2"
                            >
                              <label className="text-ink font-semibold text-ink-2 dark:text-ink-3 capitalize truncate">
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
                                    className="w-6 h-6 rounded bg-surface-2 dark:bg-surface-2 hover:bg-surface-2 flex items-center justify-center font-bold text-ink-2 dark:text-ink-3 cursor-pointer"
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
                                    className="w-14 px-1.5 py-0.5 text-center bg-surface-2 dark:bg-surface-2 border border-line dark:border-line rounded font-mono font-bold text-xs"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newVal = Number(val) + step;
                                      onUpdateParams(ind.id, { [key]: parseFloat(newVal.toFixed(2)) });
                                    }}
                                    className="w-6 h-6 rounded bg-surface-2 dark:bg-surface-2 hover:bg-surface-2 flex items-center justify-center font-bold text-ink-2 dark:text-ink-3 cursor-pointer"
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
                                  className="w-24 px-2 py-0.5 text-right bg-surface-2 dark:bg-surface-2 border border-line dark:border-line rounded font-mono text-xs"
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
        <div className="px-4 sm:px-6 py-3 border-t border-line dark:border-line bg-surface-2 dark:bg-surface flex items-center justify-between gap-3 text-xs safe-area-bottom">
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 text-ink-2 hover:text-ink dark:hover:text-ink-3 font-semibold cursor-pointer transition-colors py-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-brand-fill hover:bg-brand-fill active:scale-95 text-on-brand font-bold rounded-xl   transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Apply & Close</span>
            <span className="w-5 h-5 rounded-full bg-surface text-ink font-mono text-ink flex items-center justify-center font-bold">
              {activeCount}
            </span>
          </button>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
