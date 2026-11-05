// DHRU.AI - Security & API Configuration Modal
// Protects Gemini API keys: saved strictly in server memory, never exposed in frontend code.

import React, { useState, useEffect } from 'react';
import { X, Key, Shield, ExternalLink, Cpu, Sparkles } from 'lucide-react';
import { getSettingsStatus } from '../../services/api';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { duration, ease } from '../../design/motion';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const reduceMotion = useReducedMotion();
  const isMobileViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;
  const [isConfigured, setIsConfigured] = useState(false);
  const [activeEngine, setActiveEngine] = useState('Gemini API key not configured');
  const [reduceAnimations, setReduceAnimations] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('dhru_reduce_motion') === 'true';
  });

  const handleToggleReduceAnimations = () => {
    const nextVal = !reduceAnimations;
    setReduceAnimations(nextVal);
    localStorage.setItem('dhru_reduce_motion', String(nextVal));
    window.dispatchEvent(new CustomEvent('dhru_motion_preference_changed', { detail: { reduceMotion: nextVal } }));
  };

  useEffect(() => {
    if (isOpen) {
      getSettingsStatus().then(status => {
        setIsConfigured(status.geminiConfigured);
        setActiveEngine(status.activeEngine);
      }).catch(() => {});
    }
  }, [isOpen]);

  return (
    <AnimatePresence initial={false}>
    {isOpen && <motion.div
      key="settings-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduceMotion ? duration.fast : duration.base, ease: ease.out }}
      className="quiet-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black  animate-fade-in"
    >
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : isMobileViewport ? 24 : 0, scale: reduceMotion || isMobileViewport ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduceMotion ? 0 : isMobileViewport ? 16 : 0, scale: reduceMotion || isMobileViewport ? 1 : 0.98 }}
        transition={{ duration: reduceMotion ? duration.fast : isMobileViewport ? duration.panel : duration.base, ease: ease.out }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-dialog-title"
        className="quiet-sheet w-full max-w-lg bg-surface border border-line rounded-2xl  overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-line flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-fill border border-line flex items-center justify-center">
              <Key className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h3 id="settings-dialog-title" className="text-sm font-bold text-ink-3">Settings & Intelligence Engine</h3>
              <p className="text-ink-3">Manage Gemini AI connectivity and engine modes</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-ink-3 hover:text-ink-3">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Active Engine Status Badge */}
          <div className="p-3.5 rounded-xl bg-surface border border-line flex items-start gap-3">
            <Cpu className="w-5 h-5 text-brand shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink-3">Active Intelligence Engine:</span>
                <span className={`px-2 py-0.5 rounded text-ink font-bold ${
                  isConfigured
                    ? 'bg-pos-tint text-pos border border-line'
                    : 'bg-brand-fill text-brand border border-line'
                }`}>
                  {activeEngine}
                </span>
              </div>
              <p className="text-ink-3 text-ink mt-1 leading-relaxed">
                {isConfigured
                  ? 'Gemini is fully configured on the server. DHRU AI uses the Gemini API for live conversational intelligence.'
                  : 'Add the Gemini key to the server environment below. Chat will show a setup message until the key is configured; it will not return canned answers.'}
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-line bg-surface-2 p-4 text-ink-2">
            <h4 className="font-bold text-ink">Connect your Gemini API key</h4>
            <p>For local development, open the project root <code>.env</code> file beside <code>package.json</code> and set:</p>
            <pre className="overflow-x-auto rounded-lg border border-line bg-surface p-3 font-mono text-ink">GEMINI_API_KEY=your_Gemini_API_key</pre>
            <p>Restart the server after saving. For the live Vercel site, add <code>GEMINI_API_KEY</code> under <strong>Project → Settings → Environment Variables</strong>, then redeploy.</p>
            <p className="text-ink-3">Do not paste the key into React/TypeScript files, a <code>VITE_</code> variable, or commit it to Git.</p>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand hover:underline">Open Google AI Studio <ExternalLink className="h-3 w-3" /></a>
          </div>

          {/* Motion & Visual Ergonomics: Reduce Animations Toggle */}
          <div className="p-3.5 rounded-xl bg-surface border border-line flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="font-bold text-ink">Reduce Animations</span>
                <p className="text-[11px] text-ink-3 mt-0.5">Minimize 3D tilts, motion transitions, and particle depth</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleToggleReduceAnimations}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 cursor-pointer ${
                reduceAnimations ? 'bg-blue-600' : 'bg-slate-700'
              }`}
              title="Toggle reduce animations"
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                  reduceAnimations ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Privacy & Security Note */}
          <div className="p-3 rounded-xl bg-surface border border-line text-ink-3 flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-pos shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-ink-3">Server-side only:</strong> DHRU reads the key from <code>GEMINI_API_KEY</code> on the backend. The app does not send it from the browser or store it in project source.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-surface border-t border-line flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-surface-2 text-ink-3 hover:bg-surface-2 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>}
    </AnimatePresence>
  );
};
