// DHRU.AI - Professional Technical Indicators Manager Modal
// Allows search, enable/disable, parameter tuning, and color styling for 23+ indicators

import React, { useState } from 'react';
import { IndicatorConfig } from '../../types/indicators';
import { X, Search, Check, Sliders, RotateCcw } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'all' | 'overlay' | 'oscillator'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = indicators.filter(ind => {
    const matchCat = activeTab === 'all' || ind.category === activeTab;
    const matchSearch = ind.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        ind.shortName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeCount = indicators.filter(i => i.enabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              Technical Indicators & Oscillators
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select and configure overlay indicators and subchart oscillators ({activeCount} active)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search indicators (e.g. Supertrend, RSI, VWAP)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#070B14] border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              All ({indicators.length})
            </button>
            <button
              onClick={() => setActiveTab('overlay')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'overlay'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Overlays
            </button>
            <button
              onClick={() => setActiveTab('oscillator')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                activeTab === 'oscillator'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Oscillators
            </button>
          </div>
        </div>

        {/* Indicator List */}
        <div className="flex-1 overflow-y-auto p-6 divide-y divide-slate-100 dark:divide-slate-800/60">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No matching indicators found for "{searchQuery}"
            </div>
          ) : (
            filtered.map(ind => {
              const isEditing = editingId === ind.id;

              return (
                <div key={ind.id} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleIndicator(ind.id)}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                          ind.enabled
                            ? 'bg-blue-600 text-white'
                            : 'border border-slate-300 dark:border-slate-600 hover:border-slate-400'
                        }`}
                      >
                        {ind.enabled && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {ind.name}
                        </span>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                          {ind.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Color Dot Picker */}
                      <input
                        type="color"
                        value={ind.color}
                        onChange={e => onUpdateColor(ind.id, e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        title="Line Color"
                      />

                      {/* Params Editor Toggle */}
                      {Object.keys(ind.params).length > 0 && (
                        <button
                          onClick={() => setEditingId(isEditing ? null : ind.id)}
                          className={`text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                            isEditing
                              ? 'bg-blue-50 border-blue-300 text-blue-600 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                              : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                          }`}
                        >
                          Settings
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Parameter Editing */}
                  {isEditing && Object.keys(ind.params).length > 0 && (
                    <div className="ml-8 mt-1 p-3 bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-slate-800 rounded-lg grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      {Object.entries(ind.params).map(([key, val]) => (
                        <div key={key} className="flex flex-col gap-1">
                          <label className="text-[11px] font-medium text-slate-500 capitalize">{key}</label>
                          <input
                            type="number"
                            value={val as any}
                            onChange={e => {
                              const num = parseFloat(e.target.value);
                              if (!isNaN(num)) {
                                onUpdateParams(ind.id, { [key]: num });
                              }
                            }}
                            className="px-2 py-1 bg-white dark:bg-[#0D1527] border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#070B14] flex items-center justify-between text-xs">
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
