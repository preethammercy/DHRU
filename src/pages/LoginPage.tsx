// DHRU.AI - WavexOne-Inspired Luxury Quantitative Home & Authentication Portal
import React, { useState, useRef } from 'react';
import { 
  ArrowRight, ShieldCheck, Zap, Sparkles, Lock, 
  TrendingUp, BarChart3, Coins, Layers, CheckCircle2, 
  Instagram, Mail, ChevronRight, Activity, Globe, UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DhruLogo } from '../components/common/DhruLogo';
import { AboutDhru } from '../components/common/AboutDhru';
import { ContactUsPage } from './ContactUsPage';
import { PrivacyPolicyPage } from './PrivacyPolicyPage';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'none' | 'contact' | 'privacy'>('none');

  const authCardRef = useRef<HTMLDivElement>(null);

  const scrollToAuth = () => {
    authCardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      if (onLoginSuccess) onLoginSuccess();
    } catch (e: any) {
      console.error('[Google Login Error]', e);
      if (e.code === 'auth/popup-closed-by-user' || e.code === 'auth/cancelled-popup-request') {
        setError(null);
      } else if (e.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase. Add your domain in Firebase Console → Authentication → Authorized domains.');
      } else {
        setError(e.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signInWithEmail(email, password);
      if (res.success) {
        if (onLoginSuccess) onLoginSuccess();
      } else {
        setError(res.message || 'Login failed.');
      }
    } catch (e: any) {
      setError(e.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const prefillAdmin = () => {
    setEmail('preethamjee2008@gmail.com');
    setPassword('Preetham@0416');
    setAuthMode('email');
  };

  return (
    <div className="min-h-screen w-full bg-[#070A10] text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      
      {/* 1. WavexOne Style Glass Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#070A10]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-8">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="relative">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-30 blur-xs animate-pulse" />
              <DhruLogo size={36} />
            </div>
            <div>
              <div className="font-black text-lg tracking-tight text-white flex items-center gap-2">
                <span>DHRU.AI</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-bold border border-cyan-500/20">
                  QUANT EDITION
                </span>
              </div>
              <p className="text-[10px] text-slate-400 hidden sm:block">Institutional AI Market Intelligence</p>
            </div>
          </div>

          {/* Quick Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-mono font-medium text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Architecture</a>
            <a href="#autotrade" className="hover:text-cyan-400 transition-colors">Auto-Trade Desk</a>
            <a href="#markets" className="hover:text-cyan-400 transition-colors">Markets 24/7</a>
            <button
              onClick={() => setActiveModal('contact')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Contact Us
            </button>
            <button
              onClick={() => setActiveModal('privacy')}
              className="hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Privacy Policy
            </button>
          </nav>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://instagram.com/dhruai.in"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-pink-500/30 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 text-xs font-mono font-bold transition-all"
              title="Official Platform Instagram"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>@dhruai.in</span>
            </a>

            <button
              onClick={scrollToAuth}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition-all cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* 2. WavexOne High-Impact Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-8 border-b border-slate-800/60">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-indigo-600/0 blur-[130px] pointer-events-none" />

        <div className="mx-auto max-w-7xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left 7 Cols: Typography, Badges & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>⚡ NEXT-GEN INSTITUTIONAL QUANT PLATFORM</span>
            </div>

            <h1 className="text-3xl sm:text-5xl xl:text-6xl font-black tracking-tight text-white leading-[1.1]">
              Trade Global Markets With <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">Institutional Precision.</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Empowering modern traders with Smart Money Concepts (BOS, Order Blocks, FVGs), autonomous multi-leg auto-trading with <strong className="text-emerald-400">-0.25% micro-stops</strong>, and sub-millisecond price ticks for 24/7 Global Crypto &amp; Indian Equities.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={scrollToAuth}
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm uppercase font-mono tracking-wider flex items-center gap-2 shadow-xl shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
              >
                <span>Launch Terminal (₹10L Virtual Capital)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={prefillAdmin}
                className="px-5 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-purple-500/50 text-purple-300 text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer"
                title="Super Admin Portal Login"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Super Admin Portal</span>
              </button>
            </div>

            {/* Platform Metrics Ribbon */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Latency</span>
                <strong className="text-base font-black font-mono text-cyan-400">&lt;0.001s</strong>
                <span className="text-[10px] text-slate-400 block">Binance Trade Firehose</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Risk Protection</span>
                <strong className="text-base font-black font-mono text-emerald-400">-0.25% Stop</strong>
                <span className="text-[10px] text-slate-400 block">Lowest Loss Ever</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Asset Coverage</span>
                <strong className="text-base font-black font-mono text-white">2,600+</strong>
                <span className="text-[10px] text-slate-400 block">Crypto &amp; NSE/BSE</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">Paper Capital</span>
                <strong className="text-base font-black font-mono text-amber-400">₹10 Lakhs</strong>
                <span className="text-[10px] text-slate-400 block">$12,000 USD Free</span>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: WavexOne Style Live Terminal Mockup & Sign-In Form */}
          <div className="lg:col-span-5 space-y-6" ref={authCardRef}>
            
            {/* The Authentication Card */}
            <div className="p-6 sm:p-8 rounded-3xl border border-cyan-500/30 bg-slate-900/90 shadow-2xl backdrop-blur-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-extrabold text-white">Trader Access Portal</h2>
                  <p className="text-xs text-slate-400">Sign in to your isolated algorithmic terminal.</p>
                </div>
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 font-mono text-xs">
                  <button
                    type="button"
                    onClick={() => setAuthMode('google')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                      authMode === 'google' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Google
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthMode('email')}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                      authMode === 'email' ? 'bg-cyan-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Email / Admin
                  </button>
                </div>
              </div>

              {/* Mode 1: Google One-Tap */}
              {authMode === 'google' ? (
                <div className="space-y-4 pt-1">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Instant 1-click Google Authentication. Segregates your orders, positions, and credits securely.
                  </p>

                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 px-6 py-3.5 font-bold text-sm shadow-md active:scale-98 transition-all disabled:opacity-60 cursor-pointer"
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.04h3.88c2.28-2.09 3.66-5.18 3.66-9.14z" />
                      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.04c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.13C3.26 21.43 7.33 24 12 24z" />
                      <path fill="#FBBC05" d="M5.28 14.28c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28V6.59H1.24C.45 8.16 0 9.97 0 12s.45 3.84 1.24 5.41l4.04-3.13z" />
                      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.57 1.24 6.59l4.04 3.13c.95-2.83 3.6-4.97 6.72-4.97z" />
                    </svg>
                    <span>{loading ? 'Connecting with Google...' : 'Continue with Google'}</span>
                    <ArrowRight className="h-4 w-4 ml-1 text-slate-500" />
                  </button>

                  <div className="pt-2 flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>256-Bit SSL Financial Isolation Guaranteed</span>
                  </div>
                </div>
              ) : (
                /* Mode 2: Email & Password (with Admin Support) */
                <form onSubmit={handleEmailLogin} className="space-y-3.5 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-300 block">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="trader@example.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-mono font-semibold text-slate-300 block">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-xs font-mono outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <button
                      type="button"
                      onClick={prefillAdmin}
                      className="text-cyan-400 hover:underline cursor-pointer"
                    >
                      Fill Admin Credentials
                    </button>
                    <span>Min 6 characters</span>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase font-mono tracking-wider shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? 'Authenticating...' : 'Sign In with Email'}
                  </button>
                </form>
              )}

              {error && (
                <div role="alert" className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs text-rose-300 font-mono">
                  {error}
                </div>
              )}
            </div>

            {/* Live Interactive Trading Mockup (WavexOne style card) */}
            <div className="p-5 rounded-3xl border border-slate-800 bg-slate-900/50 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <strong className="text-white text-sm">BTC-USD · 24/7 Binance Fast</strong>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">+3.42%</span>
              </div>

              <div className="flex items-baseline justify-between py-1">
                <span className="text-2xl font-black text-white">$76,892.40</span>
                <span className="text-slate-400 text-[11px]">SMC Confluence: 92%</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">⚡ Scalp Leg (+0.35%)</span>
                  <span className="text-emerald-400 font-bold">$77,161.50</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block">🛡️ Micro Stop (-0.25%)</span>
                  <span className="text-rose-400 font-bold">$76,700.15</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. WavexOne Style Feature Pillars */}
      <section id="features" className="py-20 px-4 sm:px-8 border-b border-slate-800/60 bg-[#0A0E17]">
        <div className="mx-auto max-w-7xl space-y-12">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-mono font-bold uppercase text-cyan-400 tracking-wider">Engineered for Alpha</span>
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Institutional Capabilities. Available to Every Trader.
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Built on mathematical parity, Smart Money Concepts, and multi-agent consensus algorithms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Card 1: Autonomous Auto-Trade */}
            <div id="autotrade" className="p-7 rounded-3xl border border-slate-800 bg-slate-900/60 hover:border-cyan-500/40 transition-all space-y-4">
              <div className="p-3 w-fit rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Autonomous Multi-Leg Auto-Trade</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Splits every setup into distinct Scalp (60%) and Swing (40%) legs. Uses Half-Kelly capital sizing with automated break-even ratchets at +0.15% gain and -0.25% micro-stops.
              </p>
            </div>

            {/* Card 2: Smart Money Concepts */}
            <div className="p-7 rounded-3xl border border-slate-800 bg-slate-900/60 hover:border-blue-500/40 transition-all space-y-4">
              <div className="p-3 w-fit rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Smart Money Concepts (SMC) Suite</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Algorithmic detection of Break of Structure (BOS), Bullish/Bearish Order Blocks, Fair Value Gaps (FVGs), and Optimal Trade Entries (OTE 61.8%–78.6% Fibonacci).
              </p>
            </div>

            {/* Card 3: Bank-Grade Settlement */}
            <div className="p-7 rounded-3xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 transition-all space-y-4">
              <div className="p-3 w-fit rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Verified UPI &amp; Bank Settlement</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Minimum deposit strictly ₹100. Every transaction UTR is securely routed to the Admin Verification Desk for manual banking verification before crediting.
              </p>
            </div>

          </div>

          {/* Social Follow Strip */}
          <div className="p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-pink-500/20 text-pink-400 border border-pink-500/30">
                <Instagram className="w-5 h-5" />
              </div>
              <div>
                <strong className="text-sm text-white font-mono block">Join Our Community on Instagram</strong>
                <span className="text-xs text-slate-400 font-mono">Daily signals, market structure breakdowns, and platform updates.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 font-mono text-xs">
              <a
                href="https://instagram.com/dhruai.in"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-pink-500 hover:bg-pink-600 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <span>@dhruai.in</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://instagram.com/preetham_va"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition-all"
              >
                <span>@preetham_va</span>
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Complete Footer */}
      <footer className="border-t border-slate-800 bg-[#05070B] py-12 px-4 sm:px-8 text-xs text-slate-400 font-mono">
        <div className="mx-auto max-w-7xl space-y-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <DhruLogo size={32} />
              <div>
                <span className="font-bold text-white text-sm">DHRU.AI Markets</span>
                <p className="text-[11px] text-slate-500">Autonomous Quantitative Finance &amp; Algorithmic Simulation</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-slate-300">
              <button onClick={() => setActiveModal('contact')} className="hover:text-cyan-400 cursor-pointer">
                Help &amp; Contact Us
              </button>
              <button onClick={() => setActiveModal('privacy')} className="hover:text-cyan-400 cursor-pointer">
                Privacy Policy
              </button>
              <a href="mailto:preethamjee2008@gmail.com" className="hover:text-cyan-400">
                Support: preethamjee2008@gmail.com
              </a>
              <button onClick={prefillAdmin} className="text-purple-400 hover:text-purple-300 cursor-pointer">
                Admin Portal
              </button>
            </div>
          </div>

          <div className="text-[11px] leading-relaxed text-slate-500 space-y-2">
            <p>
              © 2026 DHRU.AI. All rights reserved. Platform architecture designed by Preetham (@preetham_va).
            </p>
            <p>
              Educational Simulation Notice: DHRU.AI provides quantitative algorithmic indicators, market structure patterns, and simulated paper execution. It is not an investment advisory or SEBI-registered entity.
            </p>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {activeModal === 'contact' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-surface rounded-3xl p-6 border border-line my-8">
            <div className="flex justify-end">
              <button
                onClick={() => setActiveModal('none')}
                className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-surface-2 text-ink-2 hover:text-ink cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <ContactUsPage />
          </div>
        </div>
      )}

      {/* Privacy Policy Modal */}
      {activeModal === 'privacy' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-surface rounded-3xl p-6 border border-line my-8">
            <div className="flex justify-end">
              <button
                onClick={() => setActiveModal('none')}
                className="px-3 py-1 text-xs font-mono font-bold rounded-lg bg-surface-2 text-ink-2 hover:text-ink cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <PrivacyPolicyPage />
          </div>
        </div>
      )}

    </div>
  );
};
