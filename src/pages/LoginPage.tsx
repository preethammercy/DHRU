import React, { useState } from 'react';
import { ArrowRight, Circle, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DhruLogo } from '../components/common/DhruLogo';
import { AboutDhru } from '../components/common/AboutDhru';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { signInWithGoogle, signInLocalBypass } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLocalBypassLogin = () => {
    signInLocalBypass();
    if (onLoginSuccess) onLoginSuccess();
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      if (onLoginSuccess) onLoginSuccess();
    } catch (e: any) {
      console.error('[Login Error]', e);
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        setError(null);
      } else if (e.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase. Add your domain in Firebase Console → Authentication → Settings → Authorized domains.');
      } else if (e.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(e.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-bg text-ink flex flex-col justify-between">
      {/* Top Header */}
      <header className="border-b border-line bg-surface px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <DhruLogo size={36} />
            <div>
              <div className="font-bold tracking-tight text-ink flex items-center gap-2">
                <span>DHRU.AI</span>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-800 dark:text-sky-200 font-semibold border border-sky-500/20">Intelligence Platform</span>
              </div>
              <p className="hidden text-xs text-ink-2 sm:block">Understand Every Market. See Beyond the Numbers.</p>
            </div>
          </div>
          <span className="flex items-center gap-2 rounded-full bg-info-tint px-3 py-1 text-xs font-semibold text-info">
            <Circle className="h-2 w-2 fill-current" />
            Live Market Desks
          </span>
        </div>
      </header>

      {/* Main Container */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 space-y-8">
        {/* Full Top Prominent Google Sign-in Card */}
        <section className="relative overflow-hidden rounded-2xl border border-brand/30 bg-surface shadow-lg p-6 sm:p-10">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-brand/5 blur-3xl pointer-events-none" />
          
          <div className="max-w-2xl mx-auto text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10 text-brand shadow-inner">
              <Sparkles className="h-7 w-7 text-brand" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
                Sign in to DHRU.AI Platform
              </h1>
              <p className="mt-2 text-sm sm:text-base text-ink-2">
                Access deep market intelligence, DHRU AI conversational assistant, and fully automated multi-position paper trading.
              </p>
            </div>

            {/* Official Google Button - Prominent Up Full */}
            <div className="max-w-md mx-auto pt-2">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3.5 rounded-xl bg-white text-slate-800 border border-slate-300 dark:border-slate-700 px-6 py-3.5 font-bold text-sm sm:text-base shadow-sm hover:shadow-md hover:bg-slate-50 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
              >
                {/* Official Google G Logo */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.28-2.09 3.66-5.18 3.66-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.43 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.41l4.04-3.13z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.57 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z"
                  />
                </svg>
                <span>{loading ? 'Connecting with Google...' : 'Continue with Google'}</span>
                <ArrowRight className="h-4 w-4 ml-1 text-slate-400" />
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-line"></div></div>
                <div className="relative bg-surface px-3 text-xs uppercase font-mono text-ink-3">or instant guest access</div>
              </div>

              {/* Instant Guest Login Bypass Button */}
              <button
                type="button"
                onClick={handleLocalBypassLogin}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl bg-surface-2 hover:bg-surface border border-line hover:border-brand px-6 py-3 font-bold text-sm text-ink shadow-sm active:scale-[0.99] transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>⚡ 1-Click Instant Access (100 Free AI Credits Included)</span>
              </button>

              {error && (
                <div role="alert" className="mt-4 rounded-xl border border-neg bg-neg-tint p-3 text-xs text-left text-ink">
                  <p className="font-bold text-neg mb-0.5">Authentication Notice</p>
                  <p>{error}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-slate-900 dark:text-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Instant Google Auth • ₹10,00,000 / $12,000 Free Virtual Simulation Capital</span>
              </div>
            </div>
          </div>
        </section>

        {/* Website Details & Platform Features - Below Sign-in */}
        <section className="rounded-2xl border border-line bg-surface overflow-hidden p-6 sm:p-8">
          <div className="mb-6 pb-4 border-b border-line flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-ink">About DHRU.AI Platform</h2>
              <p className="text-xs text-ink-2">Complete market intelligence and algorithmic trade analytics overview.</p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-ink-2">v1.0 Pro</span>
          </div>
          <AboutDhru />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-line bg-surface px-5 py-4 text-center text-xs text-ink-2">
        © 2026 DHRU.AI • Real-Time Financial Market Intelligence & Multi-Desk Paper Trading
      </footer>
    </div>
  );
};
