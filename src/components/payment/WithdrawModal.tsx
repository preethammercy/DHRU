import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { useMarketStream } from '../../context/MarketStreamContext';
import { formatDualCurrencyBalance } from '../../utils/currency';
import {
  X,
  Building2,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Wallet,
  Clock,
  Sparkles
} from 'lucide-react';

export const WithdrawModal: React.FC = () => {
  const { wallet, isWithdrawModalOpen, closeWithdrawModal, requestWithdrawal } = useWallet();
  const { user, marketMode } = useAuth();
  const { ticks } = useMarketStream();
  const isCrypto = marketMode === 'crypto';

  const [method, setMethod] = useState<'BANK' | 'UPI'>('UPI');
  const [amount, setAmount] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Bank Form State
  const [accountHolder, setAccountHolder] = useState(user?.displayName || '');
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  // UPI Form State
  const [upiId, setUpiId] = useState('');
  const [upiName, setUpiName] = useState(user?.displayName || '');

  if (!isWithdrawModalOpen) return null;

  const dual = formatDualCurrencyBalance(wallet.tradingBalance, isCrypto, ticks);
  const availableBal = wallet.tradingBalance;

  const handleQuickAmount = (val: number) => {
    setErrorMsg('');
    setAmount(String(Math.min(availableBal, val)));
  };

  const handleMax = () => {
    setErrorMsg('');
    setAmount(String(availableBal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount < 100) {
      setErrorMsg('Minimum withdrawal amount is ₹100');
      return;
    }
    if (numAmount > availableBal) {
      setErrorMsg(`Withdrawal amount exceeds available real balance of ₹${availableBal.toLocaleString()}`);
      return;
    }

    if (method === 'BANK') {
      if (!accountHolder.trim()) {
        setErrorMsg('Account Holder Name is required');
        return;
      }
      if (!accountNumber.trim() || accountNumber.length < 8) {
        setErrorMsg('Please enter a valid bank account number');
        return;
      }
      if (accountNumber !== confirmAccountNumber) {
        setErrorMsg('Bank account numbers do not match');
        return;
      }
      if (!ifsc.trim() || ifsc.trim().length !== 11) {
        setErrorMsg('Please enter a valid 11-character IFSC code (e.g. SBIN0001234)');
        return;
      }
    } else {
      if (!upiId.trim() || !upiId.includes('@')) {
        setErrorMsg('Please enter a valid UPI ID (e.g. yourname@okaxis or mobile@upi)');
        return;
      }
      if (!upiName.trim()) {
        setErrorMsg('Beneficiary Name is required');
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await requestWithdrawal({
        amount: numAmount,
        method,
        bankDetails: method === 'BANK' ? {
          accountHolder: accountHolder.trim(),
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          ifsc: ifsc.trim().toUpperCase()
        } : undefined,
        upiDetails: method === 'UPI' ? {
          upiId: upiId.trim(),
          upiName: upiName.trim()
        } : undefined
      });

      if (!res.ok) {
        setErrorMsg(res.error || 'Failed to submit withdrawal request');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Withdrawal submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-surface border border-line rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-surface-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-ink tracking-tight">Withdraw Real Funds</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/30">
                  Instant RTGS / UPI
                </span>
              </div>
              <p className="text-xs text-ink-2">Transfer verified trading funds directly to your bank or UPI</p>
            </div>
          </div>
          <button
            onClick={closeWithdrawModal}
            className="p-2 rounded-xl text-ink-2 hover:text-ink hover:bg-surface border border-transparent hover:border-line transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Balance Preview Card */}
          <div className="p-4 rounded-2xl bg-surface-2 border border-line flex items-center justify-between">
            <div>
              <span className="text-[11px] font-mono text-ink-3 uppercase font-semibold">Available Real Balance</span>
              <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                {dual.primary}
              </div>
              <span className="text-xs text-ink-2 font-mono">{dual.secondary} (Rate: 1 USD ≈ ₹{dual.rate})</span>
            </div>
            <button
              type="button"
              onClick={handleMax}
              disabled={availableBal <= 0}
              className="px-3 py-1.5 rounded-xl bg-brand-fill text-white font-mono text-xs font-bold hover:bg-brand-hover active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              Withdraw All
            </button>
          </div>

          {availableBal < 100 && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>You need at least ₹100 real funds balance to submit a withdrawal request.</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Withdrawal Amount (₹ INR)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-3">₹</span>
                <input
                  type="number"
                  min="100"
                  max={availableBal}
                  step="any"
                  value={amount}
                  onChange={e => {
                    setErrorMsg('');
                    setAmount(e.target.value);
                  }}
                  placeholder="e.g. 5000"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface border border-line focus:border-brand outline-none text-sm font-mono font-bold text-ink"
                  required
                />
              </div>

              {/* Quick Chips */}
              <div className="flex flex-wrap gap-2 mt-2">
                {[500, 1000, 2500, 5000, 10000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickAmount(val)}
                    disabled={availableBal < val}
                    className="px-2.5 py-1 rounded-lg bg-surface-2 border border-line text-[11px] font-mono font-bold text-ink-2 hover:text-brand hover:border-brand disabled:opacity-40 transition-all cursor-pointer"
                  >
                    ₹{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-ink mb-1.5">Destination Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('UPI')}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-xs font-bold cursor-pointer ${
                    method === 'UPI'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'bg-surface-2 border-line text-ink-2 hover:border-line-strong'
                  }`}
                >
                  <QrCode className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <div>UPI ID (Instant)</div>
                    <span className="text-[10px] text-ink-3 font-normal">GPay, PhonePe, Paytm</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('BANK')}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all text-xs font-bold cursor-pointer ${
                    method === 'BANK'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                      : 'bg-surface-2 border-line text-ink-2 hover:border-line-strong'
                  }`}
                >
                  <Building2 className="w-4 h-4 shrink-0" />
                  <div className="text-left">
                    <div>Indian Bank Account</div>
                    <span className="text-[10px] text-ink-3 font-normal">IMPS / NEFT Transfer</span>
                  </div>
                </button>
              </div>
            </div>

            {/* UPI Form */}
            {method === 'UPI' ? (
              <div className="space-y-3 p-4 rounded-2xl bg-surface-2 border border-line">
                <div>
                  <label className="block text-[11px] font-mono text-ink-3 uppercase font-semibold mb-1">
                    Your UPI ID (VPA)
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    placeholder="e.g. mobile@upi or username@okhdfcbank"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-line focus:border-brand text-xs font-mono font-bold text-ink outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-ink-3 uppercase font-semibold mb-1">
                    Beneficiary Name (as registered with UPI)
                  </label>
                  <input
                    type="text"
                    value={upiName}
                    onChange={e => setUpiName(e.target.value)}
                    placeholder="e.g. Preetham"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-line focus:border-brand text-xs font-bold text-ink outline-none"
                    required
                  />
                </div>
              </div>
            ) : (
              /* Bank Account Form */
              <div className="space-y-3 p-4 rounded-2xl bg-surface-2 border border-line">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-ink-3 uppercase font-semibold mb-1">
                      Account Holder Name
                    </label>
                    <input
                      type="text"
                      value={accountHolder}
                      onChange={e => setAccountHolder(e.target.value)}
                      placeholder="Name on bank passbook"
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-line focus:border-brand text-xs font-bold text-ink outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-ink-3 uppercase font-semibold mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={e => setBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-line focus:border-brand text-xs font-bold text-ink outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-ink-3 uppercase font-semibold mb-1">
                      Bank Account Number
                    </label>
                    <input
                      type="password"
                      value={accountNumber}
                      onChange={e => setAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-line focus:border-brand text-xs font-mono font-bold text-ink outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-ink-3 uppercase font-semibold mb-1">
                      Confirm Account Number
                    </label>
                    <input
                      type="text"
                      value={confirmAccountNumber}
                      onChange={e => setConfirmAccountNumber(e.target.value)}
                      placeholder="Re-enter account number"
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-line focus:border-brand text-xs font-mono font-bold text-ink outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-ink-3 uppercase font-semibold mb-1">
                    IFSC Code (11 characters)
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={ifsc}
                    onChange={e => setIfsc(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234 or SBIN0004567"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-line focus:border-brand text-xs font-mono font-bold text-ink uppercase outline-none"
                    required
                  />
                </div>
              </div>
            )}

            {errorMsg && (
              <p className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-600 dark:text-rose-400">
                {errorMsg}
              </p>
            )}

            {/* Security Guarantee Notice */}
            <div className="flex items-center gap-2 text-[11px] text-ink-3 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Settled securely under RBI Immediate Payment Service (IMPS) guidelines. 0% processing fee.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || availableBal < 100}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing Transfer...</span>
                </>
              ) : (
                <>
                  <span>Confirm Withdrawal {amount ? `(₹${parseFloat(amount || '0').toLocaleString()})` : ''}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
