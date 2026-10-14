// DHRU.AI - User Profile & Trader Identity Settings Page
// Manage profile information, verified trader identity, exchange KYC status, and risk parameters.

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTrading } from '../context/TradingContext';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  AlertTriangle,
  RotateCcw,
  Save,
  Wallet,
  Zap,
  Globe2,
  Layers,
  Sparkles
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUserProfile, marketMode, setMarketMode } = useAuth();
  const {
    cashBalance,
    marginAvailable,
    realizedPnl,
    riskSettings,
    updateRiskSettings,
    resetSimulationBalance
  } = useTrading();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98450 12890');
  const [traderIdentity, setTraderIdentity] = useState(
    user?.traderIdentity || 'Intraday & Algorithmic Momentum Trader'
  );
  const [baseCurrency, setBaseCurrency] = useState<'INR' | 'USD'>(
    user?.baseCurrency || (marketMode === 'crypto' ? 'USD' : 'INR')
  );
  const [maxDailyLoss, setMaxDailyLoss] = useState(riskSettings.maxDailyLoss);
  const [maxOrderValue, setMaxOrderValue] = useState(riskSettings.maxOrderValue);
  const [requireConfirmation, setRequireConfirmation] = useState(riskSettings.requireConfirmation);

  const [savedFeedback, setSavedFeedback] = useState(false);
  const [resetFeedback, setResetFeedback] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      displayName: displayName.trim() || 'Active Trader',
      phone: phone.trim(),
      traderIdentity,
      baseCurrency,
      kycStatus: 'verified'
    });

    updateRiskSettings({
      maxDailyLoss: Number(maxDailyLoss),
      maxOrderValue: Number(maxOrderValue),
      requireConfirmation
    });

    if (baseCurrency === 'USD' && marketMode !== 'crypto') {
      setMarketMode('crypto');
    } else if (baseCurrency === 'INR' && marketMode !== 'indian') {
      setMarketMode('indian');
    }

    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3500);
  };

  const handleResetCapital = () => {
    resetSimulationBalance();
    setResetFeedback(true);
    setTimeout(() => setResetFeedback(false), 3500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      
      {/* Top Profile Summary Header Card */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-3xl p-6 sm:p-8 shadow-card zoom-card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-blue-500/20 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                {(displayName || 'T').charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {displayName || 'Trader Profile'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Tier 3 KYC Verified
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Trader UID: {user?.uid || 'GUEST-8842'} • Exchange License ID: DHRU-IN-847291
              </p>
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>{traderIdentity}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] text-right w-full sm:w-48">
              <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Allocated Margin</span>
              <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">
                {marketMode === 'crypto' ? `$${(marginAvailable / 85).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `₹${marginAvailable.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Trader Identity & Personal Info */}
        <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
                Personal Information & Identities
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Update your public trader name, verified contact points, and trading persona.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Full Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Niranjan Trader"
                  className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-[#070B14] border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Primary Account Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 text-xs bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Authenticated via Google Account Services</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Registered Contact Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12890"
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-[#070B14] border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Trader Style & Desk Identity
              </label>
              <select
                value={traderIdentity}
                onChange={(e) => setTraderIdentity(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-[#070B14] border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white cursor-pointer"
              >
                <option value="Intraday & Algorithmic Momentum Trader">Intraday & Algorithmic Momentum Trader</option>
                <option value="High-Frequency Scalper (1m - 5m)">High-Frequency Scalper (1m - 5m)</option>
                <option value="Smart Money Concept (SMC) & FVG Trader">Smart Money Concept (SMC) & FVG Trader</option>
                <option value="Macro & Positional Swing Trader">Macro & Positional Swing Trader</option>
                <option value="Options & Volatility Hedger">Options & Volatility Hedger</option>
                <option value="24/7 Global Crypto & Forex Arbitrageur">24/7 Global Crypto & Forex Arbitrageur</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Trading Currency & Risk Management Rules */}
        <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-3xl p-6 sm:p-8 shadow-card space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Risk Parameters & Capital Controls
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure your circuit breakers, maximum order allocation, and preferred base denomination.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Base Trading Currency
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBaseCurrency('INR')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    baseCurrency === 'INR'
                      ? 'bg-blue-50 dark:bg-cyan-500/15 border-blue-600 text-blue-700 dark:text-cyan-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <span>🇮🇳</span>
                  <span>Indian Rupee (₹)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBaseCurrency('USD')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    baseCurrency === 'USD'
                      ? 'bg-blue-50 dark:bg-cyan-500/15 border-blue-600 text-blue-700 dark:text-cyan-400 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <span>🪙</span>
                  <span>US Dollar ($)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Max Daily Loss Limit ({baseCurrency === 'USD' ? '$' : '₹'})
              </label>
              <input
                type="number"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-[#070B14] border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">Trading desk automatically halts if intraday drawdown exceeds this</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Max Single Order Value ({baseCurrency === 'USD' ? '$' : '₹'})
              </label>
              <input
                type="number"
                value={maxOrderValue}
                onChange={(e) => setMaxOrderValue(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs bg-slate-50 dark:bg-[#070B14] border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-bold text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Require Order Confirmation</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Show confirmation modal before sending to order book</p>
              </div>
              <input
                type="checkbox"
                checked={requireConfirmation}
                onChange={(e) => setRequireConfirmation(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Paper Capital Reset */}
        <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-3xl p-6 sm:p-8 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-600" />
              Reset Virtual Trading Capital
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Restore your balance to fresh starting margin of ₹10,00,000 (or $12,000 USD).
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetCapital}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{resetFeedback ? 'Capital Restored!' : 'Reset to ₹10 Lakhs'}</span>
          </button>
        </div>

        {/* Action Button & Feedback */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {savedFeedback && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Profile, identities and risk parameters saved successfully!
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            Save Profile & Settings
          </button>
        </div>

      </form>

    </div>
  );
};
