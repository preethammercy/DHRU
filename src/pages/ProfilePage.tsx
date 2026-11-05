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

function maskId(id: string): string {
  if (!id) return '***';
  if (id.length <= 6) return id.slice(0, 2) + '***' + id.slice(-1);
  return id.slice(0, 3) + '***' + id.slice(-4);
}

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
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-32 lg:pb-16">
      
      {/* Paper Trading Simulation Compliance Banner */}
      <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3 text-xs leading-relaxed">
        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Paper Trading Simulation Environment:</span> DHRU.AI is a financial market intelligence and simulation research platform. Virtual balances and simulated order books carry zero real-world financial liability. DHRU.AI is not a SEBI-registered broker or registered investment advisor.
        </div>
      </div>

      {/* Top Profile Summary Header Card */}
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-3xl p-6 sm:p-8  zoom-card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-brand "
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-brand-fill    text-on-brand font-black text-2xl flex items-center justify-center  ">
                {(displayName || 'T').charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black text-ink dark:text-ink tracking-tight">
                  {displayName || 'Trader Profile'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Paper Simulation Account (Active)
                </span>
              </div>
              <p className="text-xs text-ink-2 dark:text-ink-3 mt-1 font-mono">
                Trader UID: {maskId(user?.uid || 'GUEST-8842')} • Paper Sim ID: {maskId('DHRU-IN-847291')}
              </p>
              <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-surface-2 dark:bg-surface-2 text-xs text-ink-2 dark:text-ink-3 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-brand dark:text-brand" />
                <span>{traderIdentity}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            <div className="p-3 rounded-2xl bg-surface-2 dark:bg-surface border border-line dark:border-line text-right w-full sm:w-48">
              <span className="text-ink-3 uppercase font-mono tracking-wider block">Allocated Margin</span>
              <span className="text-lg font-black font-mono text-pos dark:text-pos">
                {marketMode === 'crypto' ? `$${(marginAvailable / 85).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `₹${marginAvailable.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: Trader Identity & Personal Info */}
        <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-3xl p-6 sm:p-8  space-y-6">
          <div className="flex items-center justify-between border-b border-line dark:border-line pb-4">
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-ink flex items-center gap-2">
                <User className="w-5 h-5 text-brand dark:text-brand" />
                Personal Information & Identities
              </h2>
              <p className="text-xs text-ink-2 dark:text-ink-3 mt-0.5">
                Update your public trader name, verified contact points, and trading persona.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-ink-2 dark:text-ink-3 mb-1.5">
                Full Display Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Niranjan Trader"
                  className="w-full px-4 py-2.5 text-xs bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand font-semibold text-ink dark:text-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-2 dark:text-ink-3 mb-1.5">
                Primary Account Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-4 py-2.5 text-xs bg-surface-2 dark:bg-surface-2 border border-line dark:border-line rounded-xl text-ink-2 font-mono cursor-not-allowed"
                />
              </div>
              <p className="text-ink-3 mt-1">Authenticated via Google Account Services</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-2 dark:text-ink-3 mb-1.5">
                Registered Contact Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12890"
                className="w-full px-4 py-2.5 text-xs bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand font-mono font-medium text-ink dark:text-ink"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-2 dark:text-ink-3 mb-1.5">
                Trader Style & Desk Identity
              </label>
              <select
                value={traderIdentity}
                onChange={(e) => setTraderIdentity(e.target.value)}
                className="w-full px-4 py-2.5 text-xs bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand font-medium text-ink dark:text-ink cursor-pointer"
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
        <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-3xl p-6 sm:p-8  space-y-6">
          <div className="flex items-center justify-between border-b border-line dark:border-line pb-4">
            <div>
              <h2 className="text-lg font-bold text-ink dark:text-ink flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warn" />
                Risk Parameters & Capital Controls
              </h2>
              <p className="text-xs text-ink-2 dark:text-ink-3 mt-0.5">
                Configure your circuit breakers, maximum order allocation, and preferred base denomination.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-ink-2 dark:text-ink-3 mb-1.5">
                Base Trading Currency
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setBaseCurrency('INR')}
                  className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    baseCurrency === 'INR'
                      ? 'bg-surface-2 dark:bg-brand-fill border-line text-brand dark:text-brand '
                      : 'border-line dark:border-line text-ink-2 dark:text-ink-3 hover:bg-surface-2'
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
                      ? 'bg-surface-2 dark:bg-brand-fill border-line text-brand dark:text-brand '
                      : 'border-line dark:border-line text-ink-2 dark:text-ink-3 hover:bg-surface-2'
                  }`}
                >
                  <span>🪙</span>
                  <span>US Dollar ($)</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-2 dark:text-ink-3 mb-1.5">
                Max Daily Loss Limit ({baseCurrency === 'USD' ? '$' : '₹'})
              </label>
              <input
                type="number"
                value={maxDailyLoss}
                onChange={(e) => setMaxDailyLoss(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand font-mono font-bold text-ink dark:text-ink"
              />
              <p className="text-ink-3 mt-1">Trading desk automatically halts if intraday drawdown exceeds this</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-2 dark:text-ink-3 mb-1.5">
                Max Single Order Value ({baseCurrency === 'USD' ? '$' : '₹'})
              </label>
              <input
                type="number"
                value={maxOrderValue}
                onChange={(e) => setMaxOrderValue(Number(e.target.value))}
                className="w-full px-4 py-2.5 text-xs bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand font-mono font-bold text-ink dark:text-ink"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line">
              <div>
                <h4 className="text-xs font-bold text-ink dark:text-ink-3">Require Order Confirmation</h4>
                <p className="text-ink-3 mt-0.5">Show confirmation modal before sending to order book</p>
              </div>
              <input
                type="checkbox"
                checked={requireConfirmation}
                onChange={(e) => setRequireConfirmation(e.target.checked)}
                className="w-4 h-4 text-brand rounded cursor-pointer accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Paper Capital Reset */}
        <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-3xl p-6 sm:p-8  flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-ink dark:text-ink flex items-center gap-2">
              <Wallet className="w-4 h-4 text-pos" />
              Reset Virtual Trading Capital
            </h3>
            <p className="text-xs text-ink-2 dark:text-ink-3 mt-0.5">
              Restore your balance to fresh starting margin of ₹10,00,000 (or $12,000 USD).
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetCapital}
            className="px-4 py-2.5 rounded-xl border border-line dark:border-line hover:bg-surface-2 dark:hover:bg-surface-2 text-xs font-bold text-ink-2 dark:text-ink-3 transition-colors flex items-center gap-2 cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{resetFeedback ? 'Capital Restored!' : 'Reset to ₹10 Lakhs'}</span>
          </button>
        </div>

        {/* Action Button & Feedback */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {savedFeedback && (
              <span className="flex items-center gap-1.5 text-xs font-bold text-pos dark:text-pos animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Profile, identities and risk parameters saved successfully!
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-brand-fill     text-on-brand font-bold text-xs   transition-all flex items-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Save className="w-4 h-4" />
            Save Profile & Settings
          </button>
        </div>

      </form>

    </div>
  );
};
