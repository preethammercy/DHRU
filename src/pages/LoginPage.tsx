// DHRU.AI - Institutional Login & Authentication Portal
// White & Blue Fintrix aesthetic with Google Account login via Firebase.
// Allocates ₹10,00,000 Free Trading Capital upon entry.

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { DhruLogo } from '../components/common/DhruLogo';
import {
  ShieldCheck,
  Zap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Globe2,
  Lock,
  Wallet,
  Coins,
  CheckCircle2,
  CandlestickChart
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      if (onLoginSuccess) onLoginSuccess();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-br from-[#F8FAFC] via-[#EFF6FF] to-[#F1F5F9] dark:from-[#05080E] dark:via-[#070B14] dark:to-[#0D1527] text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Top Header Navigation */}
      <header className="w-full border-b border-slate-200/80 dark:border-[#1A2744] bg-white/80 dark:bg-[#070B14]/80 backdrop-blur-md py-4 px-6 sm:px-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DhruLogo size={36} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 dark:from-white dark:to-cyan-400 bg-clip-text text-transparent">
                  DHRU.AI
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-cyan-500/20 dark:text-cyan-300 font-bold border border-blue-200 dark:border-cyan-500/30">
                  PLATFORM 2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                “Understand Every Market. See Beyond the Numbers.”
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Exchange Feeds Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Authentication Card Hero */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 rounded-3xl bg-white dark:bg-[#0A101D] border border-slate-200 dark:border-[#1E293B] shadow-2xl overflow-hidden">
          
          {/* Left Column: Brand & Value Proposition (7 cols) */}
          <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-between space-y-6 bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 dark:from-[#0A1224] dark:via-[#090F1E] dark:to-[#070B14]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-cyan-400 border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                Institutional Financial Technology & Algorithmic Desk
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Enter the Next Era of{' '}
                <span className="bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-500 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
                  Intelligent Trading
                </span>
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Seamlessly trade Indian equities (NSE/BSE) or 24/7 Cryptocurrency markets with real-time candlestick feeds, Smart Money concept indicators, and verified AI trade predictions.
              </p>

              {/* Feature Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
                  <div className="p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">₹10 Lakh Free Capital</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Isolated virtual margin per user</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
                  <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-cyan-400 shrink-0">
                    <CandlestickChart className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">SMC & FVG Indicators</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Order Blocks, Ichimoku, Aroon</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
                  <div className="p-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">24/7 Crypto Hub</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">BTC, ETH, SOL, XRP & more</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
                  <div className="p-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">AI Vision Scanner</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Upload charts & export setups</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Security Assurance */}
            <div className="flex items-center gap-3 pt-3 border-t border-slate-200/70 dark:border-slate-800/70 text-[11px] text-slate-500 dark:text-slate-400">
              <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              <span>Firebase Enterprise Auth • Non-Custodial Simulation • Safe & Private</span>
            </div>
          </div>

          {/* Right Column: Google Account Login Action (5 cols) */}
          <div className="md:col-span-5 p-8 sm:p-10 flex flex-col justify-between items-center text-center border-t md:border-t-0 md:border-l border-slate-200 dark:border-[#1E293B] bg-white dark:bg-[#070B14]">
            
            <div className="w-full space-y-2 mt-2">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 p-0.5 shadow-xl shadow-blue-500/20 mx-auto flex items-center justify-center">
                <div className="w-full h-full bg-white dark:bg-[#0A101D] rounded-[14px] flex items-center justify-center">
                  <DhruLogo size={32} />
                </div>
              </div>

              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight pt-2">
                Sign in to DHRU.AI
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Access your personalized portfolio, watchlist, and paper trading accounts.
              </p>
            </div>

            {/* Primary Google Login Button */}
            <div className="w-full space-y-3 my-6">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 px-5 rounded-2xl bg-white dark:bg-[#0E1726] border-2 border-slate-200 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 text-slate-800 dark:text-white font-bold text-sm shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-3 group cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {/* Official Google G Logo SVG */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{loading ? 'Authenticating with Google...' : 'Continue with Google'}</span>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>

            {/* Bottom Disclaimer */}
            <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-500 font-mono">
              By continuing, you agree to DHRU.AI terms. Paper margin is for educational and algorithmic simulation only.
            </div>

          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-4 px-6 text-center text-xs text-slate-500 border-t border-slate-200/60 dark:border-slate-800/60 font-mono">
        © 2026 DHRU.AI • Powered by Google Firebase & Exchange Feeds
      </footer>

    </div>
  );
};
