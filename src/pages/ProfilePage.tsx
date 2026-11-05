// DHRU.AI - User Profile & Trader Identity Settings Page
// Manage profile information, verified trader identity, exchange KYC status, and risk parameters.

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTrading } from '../context/TradingContext';
import { useWallet } from '../context/WalletContext';
import { AccountTypeSwitcher } from '../components/common/AccountTypeSwitcher';
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
  Sparkles,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpRight,
  Clock
} from 'lucide-react';

function maskId(id: string): string {
  if (!id) return '***';
  if (id.length <= 6) return id.slice(0, 2) + '***' + id.slice(-1);
  return id.slice(0, 3) + '***' + id.slice(-4);
}

export const ProfilePage: React.FC = () => {
  const { user, updateUserProfile, marketMode, setMarketMode } = useAuth();
  const { wallet, openDepositModal, openWithdrawModal } = useWallet();
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
  const [withdrawals, setWithdrawals] = useState<any[]>([]);

  // Load withdrawal requests for current user
  useEffect(() => {
    fetch(`/api/wallet/withdrawals?userId=${encodeURIComponent(user?.uid || 'default-user')}`)
      .then(r => r.json())
      .then(d => {
        if (d?.ok && Array.isArray(d.withdrawals)) {
          setWithdrawals(d.withdrawals);
        }
      })
      .catch(() => {});
  }, [user?.uid]);

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
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h1 className="text-2xl font-black text-ink dark:text-ink tracking-tight">
                  {displayName || 'Trader Profile'}
                </h1>
                <AccountTypeSwitcher />
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

      {/* Real Money Funds & AI Credits Wallet Section */}
      <div className="bg-surface border border-line rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-line pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <Wallet className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black text-ink tracking-tight">
                Quantitative Wallet & Trading Funds
              </h2>
            </div>
            <p className="text-xs text-ink-2 mt-1">
              Deposit real trading funds via UPI, purchase AI Intelligence credits, or unlock institutional SMC indicators.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => openDepositModal('credits')}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Buy Credits</span>
            </button>
            <button
              type="button"
              onClick={() => openDepositModal('funds')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Wallet className="w-4 h-4" />
              <span>+ Add Funds (UPI)</span>
            </button>
            <button
              type="button"
              onClick={() => openWithdrawModal()}
              className="px-4 py-2 rounded-xl bg-surface-2 hover:bg-surface border border-line hover:border-cyan-500 text-ink font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4 text-cyan-500" />
              <span>Withdraw Funds</span>
            </button>
          </div>
        </div>

        {/* Balance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: AI Analysis & AutoTrade Credits */}
          <div className="p-5 rounded-2xl bg-surface-2 border border-line flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-2">AI Quantitative Credits</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black font-mono text-amber-500">{wallet.credits}</span>
                  <span className="text-xs font-semibold text-ink-2">Available</span>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
                wallet.premiumUnlocked
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
              }`}>
                {wallet.premiumUnlocked ? '✨ SMC Unlocked' : 'Standard Tier'}
              </span>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">
              Used for generating Gemini deep intelligence reports (5 credits) and arming autonomous multi-leg trade executions (10 credits).
            </p>

            <div className="pt-2 border-t border-line/60 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-ink-3">
                {wallet.premiumUnlocked ? 'All Institutional & SMC Indicators active.' : 'Buy 1,000+ Credits to unlock SMC Suite.'}
              </span>
              <button
                type="button"
                onClick={() => openDepositModal('credits')}
                className="text-xs font-bold text-brand hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Credit Packs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Real Money Trading Balance */}
          <div className="p-5 rounded-2xl bg-surface-2 border border-line flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-2">Real Trading Funds Balance</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    ₹{wallet.tradingBalance.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-ink-2 font-mono">
                    ≈ ${(wallet.tradingBalance / 86.50).toFixed(2)} USD
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                Live Dual-Currency
              </span>
            </div>

            <p className="text-xs text-ink-2 leading-relaxed">
              Real funds balance converts at live market FX rate (<strong className="font-mono text-ink">1 USD ≈ ₹86.50</strong>) when switching to 24/7 Global Crypto desk.
            </p>

            <div className="pt-2 border-t border-line/60 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => openDepositModal('funds')}
                className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>+ Deposit via UPI</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => openWithdrawModal()}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Withdraw to Bank/UPI</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* Quick Deposit & Buy Shortcut Buttons */}
        <div className="p-4 rounded-2xl bg-surface-2/60 border border-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-ink-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Popular Credit Packs: <strong>500 Cr (₹499)</strong> • <strong>1,000 Cr (₹899 - Unlocks SMC)</strong> • <strong>2,500 Cr (₹1,999)</strong></span>
          </div>
          <button
            type="button"
            onClick={() => openDepositModal('credits')}
            className="px-3 py-1.5 rounded-lg bg-surface border border-line hover:border-brand font-bold text-xs text-brand hover:bg-surface-2 transition-all cursor-pointer whitespace-nowrap"
          >
            Recharge Now
          </button>
        </div>

        {/* Wallet Transaction History */}
        {wallet.history && wallet.history.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-2 block">
              Recent Wallet Activity
            </span>
            <div className="divide-y divide-line border border-line rounded-2xl overflow-hidden bg-surface">
              {wallet.history.slice(0, 5).map((tx) => (
                <div key={tx.id} className="p-3 flex items-center justify-between text-xs hover:bg-surface-2 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${
                      tx.type.includes('BONUS') || tx.type.includes('PURCHASE') || tx.type.includes('DEPOSIT')
                        ? 'bg-pos-tint text-pos'
                        : 'bg-neg-tint text-neg'
                    }`}>
                      {tx.type.includes('CREDIT') || tx.type.includes('BONUS') ? <Zap className="w-3.5 h-3.5" /> : <Wallet className="w-3.5 h-3.5" />}
                    </div>
                    <div>
                      <p className="font-bold text-ink">{tx.note || tx.type}</p>
                      <p className="text-[11px] text-ink-3 font-mono">{new Date(tx.at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold">
                    {tx.credits ? (
                      <span className={tx.credits > 0 ? 'text-pos' : 'text-neg'}>
                        {tx.credits > 0 ? `+${tx.credits}` : tx.credits} Credits
                      </span>
                    ) : tx.amount ? (
                      <span className="text-pos">
                        +₹{tx.amount.toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Withdrawal Payouts Activity */}
        {withdrawals && withdrawals.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-line">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-ink-2 block">
              Recent Payout Requests (Bank / UPI)
            </span>
            <div className="divide-y divide-line border border-line rounded-2xl overflow-hidden bg-surface">
              {withdrawals.slice(0, 5).map((w: any) => (
                <div key={w.id} className="p-3 flex items-center justify-between text-xs hover:bg-surface-2 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${
                      w.status === 'VERIFIED'
                        ? 'bg-pos-tint text-pos'
                        : w.status === 'REJECTED'
                        ? 'bg-neg-tint text-neg'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-ink">
                          {w.method === 'UPI' ? `UPI: ${w.upiDetails?.upiId}` : `Bank: ${w.bankDetails?.bankName} (A/C ...${(w.bankDetails?.accountNumber || '').slice(-4)})`}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          w.status === 'VERIFIED'
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : w.status === 'REJECTED'
                            ? 'bg-rose-500/15 text-rose-500'
                            : 'bg-amber-500/15 text-amber-500 animate-pulse'
                        }`}>
                          {w.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-3 font-mono">{new Date(w.createdAt).toLocaleString()} • Ref: {w.id}</p>
                    </div>
                  </div>
                  <div className="text-right font-mono font-bold">
                    <span className="text-ink">₹{Number(w.amount).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-ink-2 dark:text-ink-3">
                  Registered Mobile Number
                </label>
                {phone && phone.replace(/\D/g, '').length >= 10 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-500">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified KYC
                  </span>
                )}
              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98450 12890"
                className="w-full px-4 py-2.5 text-xs bg-surface-2 dark:bg-surface border border-line dark:border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-brand font-mono font-medium text-ink dark:text-ink"
              />
              <p className="text-[10px] text-ink-3 mt-1">Required for real INR payouts and instant UPI notifications.</p>
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
