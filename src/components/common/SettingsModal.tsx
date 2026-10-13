// DHRU.AI - Security & API Configuration Modal
// Protects Gemini API keys: saved strictly in server memory, never exposed in frontend code.

import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, Shield, AlertTriangle, ExternalLink, Cpu } from 'lucide-react';
import { saveGeminiKey, getSettingsStatus } from '../../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [activeEngine, setActiveEngine] = useState('Deterministic Mathematical Engine');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      getSettingsStatus().then(status => {
        setIsConfigured(status.geminiConfigured);
        setActiveEngine(status.activeEngine);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setErrorMsg('Please enter a valid Gemini API Key.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await saveGeminiKey(apiKey.trim());
      if (res.success) {
        setSaveSuccess(true);
        setIsConfigured(true);
        setActiveEngine('Gemini 2.5 Flash');
        setApiKey('');
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save API Key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-[#0D1527] border border-[#1A2744] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-[#1A2744] flex items-center justify-between bg-[#070B14]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Key className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Settings & Intelligence Engine</h3>
              <p className="text-[11px] text-slate-400">Manage Gemini AI connectivity and engine modes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Active Engine Status Badge */}
          <div className="p-3.5 rounded-xl bg-[#070B14] border border-[#1A2744] flex items-start gap-3">
            <Cpu className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">Active Intelligence Engine:</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  isConfigured
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                }`}>
                  {activeEngine}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-1 leading-relaxed">
                {isConfigured
                  ? 'Connected to Google Gemini generative intelligence. Full dynamic scenarios and deep semantic synthesis enabled.'
                  : 'Running on DHRU.AI’s built-in deterministic mathematical engine using verified exchange indicators, formulas, and candlestick signals.'}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={isConfigured ? '•••••••••••••••••••••••• (Key Active - Enter to replace)' : 'AIzaSy...'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070B14] border border-[#1A2744] text-slate-100 text-xs focus:outline-none focus:border-cyan-400 font-mono"
              />
              <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-400">
                <span>Free tier key supported from Google AI Studio</span>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1"
                >
                  Get Free Key <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {saveSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-2 text-xs">
                <CheckCircle className="w-4 h-4 shrink-0" />
                Gemini API Key securely saved and active on server!
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Save API Key on Server'
              )}
            </button>
          </form>

          {/* Privacy & Security Note */}
          <div className="p-3 rounded-xl bg-[#070B14]/60 border border-[#1A2744] text-[11px] text-slate-400 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-200">Zero Client Exposure Guarantee:</strong> Your key is stored in protected server-side memory. It is never emitted in public frontend JavaScript, HTML bundles, network payload exports, or git repositories.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#070B14] border-t border-[#1A2744] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
