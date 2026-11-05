import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Wallet,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  AlertTriangle,
  ArrowRight,
  User,
  Sliders,
  DollarSign,
  Layers,
  Activity,
  Power,
  ArrowDownLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { dispatchTradeNotification } from '../components/common/TradeNotificationToast';

interface AdminAnalytics {
  totalUsers: number;
  totalTradingFunds: number;
  totalCreditsOutstanding: number;
  totalRevenueInr: number;
  totalOrdersCount: number;
  verifiedOrdersCount: number;
  pendingOrdersCount: number;
  targetVpa: string;
  payeeName: string;
  systemStatus: string;
}

interface PaymentOrder {
  orderId: string;
  userId: string;
  type: 'credits' | 'funds';
  amount: number;
  credits: number;
  funds: number;
  targetVpa: string;
  payeeName: string;
  utr?: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  createdAt: number;
  expiresAt: number;
  verifiedAt?: number;
  adminNote?: string;
}

interface Props {
  onNavigate?: (nav: string) => void;
}

export const AdminDashboardPage: React.FC<Props> = ({ onNavigate }) => {
  const { user } = useAuth();
  const { refreshWallet } = useWallet();
  const isSuperAdmin = user?.email?.toLowerCase() === 'preethamjee2008@gmail.com';

  const [deskTab, setDeskTab] = useState<'deposits' | 'withdrawals'>('deposits');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Manual Adjuster Form State
  const [adjustUserId, setAdjustUserId] = useState('active-trader');
  const [adjustType, setAdjustType] = useState<'credits' | 'funds'>('credits');
  const [adjustDelta, setAdjustDelta] = useState<number>(500);
  const [adjustNote, setAdjustNote] = useState('Bonus credit adjustment by Admin');
  const [adjustBusy, setAdjustBusy] = useState(false);

  const fetchAdminData = useCallback(async () => {
    try {
      setLoading(true);
      const [overviewRes, ordersRes, withdrawalsRes] = await Promise.all([
        fetch('/api/wallet/admin/overview').then(r => r.json()).catch(() => null),
        fetch('/api/wallet/admin/orders').then(r => r.json()).catch(() => null),
        fetch('/api/wallet/admin/withdrawals').then(r => r.json()).catch(() => null)
      ]);

      if (overviewRes?.ok && overviewRes.analytics) {
        setAnalytics(overviewRes.analytics);
      }
      if (ordersRes?.ok && Array.isArray(ordersRes.orders)) {
        setOrders(ordersRes.orders);
      }
      if (withdrawalsRes?.ok && Array.isArray(withdrawalsRes.withdrawals)) {
        setWithdrawals(withdrawalsRes.withdrawals);
      }
    } catch (err) {
      console.error('[Admin] Failed to load admin desk:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAdminData();
    const interval = setInterval(fetchAdminData, 15000);
    return () => clearInterval(interval);
  }, [fetchAdminData]);

  const handleApproveWithdrawal = async (withdrawalId: string) => {
    const utr = window.prompt(`Enter Bank / UPI Transaction Reference (UTR) for ${withdrawalId}:`, `IMPS-${Date.now().toString().slice(-8)}`);
    if (!utr) return;

    setActionBusyId(withdrawalId);
    try {
      const res = await fetch('/api/wallet/admin/approve-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, adminNote: `Payout transferred. Bank UTR: ${utr}` })
      });
      const data = await res.json();
      if (data.ok) {
        dispatchTradeNotification({
          type: 'PROFIT',
          title: 'Withdrawal Payout Approved',
          symbol: 'PAYOUT',
          status: 'TRANSFERRED',
          reason: `Withdrawal ${withdrawalId} approved and transferred. Reference: ${utr}`
        });
        await fetchAdminData();
        await refreshWallet();
      } else {
        alert(data.error || 'Failed to approve withdrawal');
      }
    } catch (err: any) {
      alert(`Error approving withdrawal: ${err.message}`);
    } finally {
      setActionBusyId(null);
    }
  };

  const handleRejectWithdrawal = async (withdrawalId: string) => {
    const reason = window.prompt('Enter reason for rejecting withdrawal (funds will be refunded to user):', 'Incorrect Bank Account / IFSC mismatch');
    if (!reason) return;

    setActionBusyId(withdrawalId);
    try {
      const res = await fetch('/api/wallet/admin/reject-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ withdrawalId, reason })
      });
      const data = await res.json();
      if (data.ok) {
        dispatchTradeNotification({
          type: 'REJECTED',
          title: 'Withdrawal Request Rejected',
          symbol: 'REFUNDED',
          status: 'REFUNDED',
          reason: `Withdrawal ${withdrawalId} rejected. Funds refunded to user balance: ${reason}`
        });
        await fetchAdminData();
        await refreshWallet();
      } else {
        alert(data.error || 'Failed to reject withdrawal');
      }
    } catch (err: any) {
      alert(`Error rejecting withdrawal: ${err.message}`);
    } finally {
      setActionBusyId(null);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!window.confirm(`Confirm approval for Order ${orderId}? This will immediately credit the user's balance.`)) {
      return;
    }
    setActionBusyId(orderId);
    try {
      const res = await fetch('/api/wallet/admin/approve-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, adminNote: 'Verified and approved via Admin Desk' })
      });
      const data = await res.json();
      if (data.ok) {
        dispatchTradeNotification({
          type: 'OPEN',
          title: 'Payment Approved',
          accountType: 'REAL',
          symbol: 'UPI',
          status: 'VERIFIED',
          reason: `Order ${orderId} approved and credited successfully.`
        });
        await fetchAdminData();
        await refreshWallet();
      } else {
        alert(data.error || 'Failed to approve order');
      }
    } catch (err: any) {
      alert(`Error approving order: ${err.message}`);
    } finally {
      setActionBusyId(null);
    }
  };

  const handleRejectOrder = async (orderId: string) => {
    const reason = window.prompt('Enter reason for rejecting this payment order:', 'UTR verification failed / invalid reference');
    if (!reason) return;

    setActionBusyId(orderId);
    try {
      const res = await fetch('/api/wallet/admin/reject-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, reason })
      });
      const data = await res.json();
      if (data.ok) {
        dispatchTradeNotification({
          type: 'REJECTED',
          title: 'Payment Order Rejected',
          symbol: 'UPI',
          status: 'REJECTED',
          reason: `Order ${orderId} marked as rejected: ${reason}`
        });
        await fetchAdminData();
      } else {
        alert(data.error || 'Failed to reject order');
      }
    } catch (err: any) {
      alert(`Error rejecting order: ${err.message}`);
    } finally {
      setActionBusyId(null);
    }
  };

  const handleManualAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustUserId.trim() || !adjustDelta) {
      alert('Please enter valid user ID and adjustment value');
      return;
    }

    setAdjustBusy(true);
    try {
      const res = await fetch('/api/wallet/admin/adjust-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adjustUserId.trim(),
          creditsDelta: adjustType === 'credits' ? adjustDelta : 0,
          tradingFundsDelta: adjustType === 'funds' ? adjustDelta : 0,
          reason: adjustNote.trim() || 'Manual adjustment via Admin Panel'
        })
      });
      const data = await res.json();
      if (data.ok) {
        alert(`Successfully adjusted ${adjustType === 'credits' ? `${adjustDelta} Credits` : `₹${adjustDelta}`} for user ${adjustUserId}`);
        await fetchAdminData();
        await refreshWallet();
      } else {
        alert(data.error || 'Adjustment failed');
      }
    } catch (err: any) {
      alert(`Adjustment error: ${err.message}`);
    } finally {
      setAdjustBusy(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'PENDING' && o.status !== 'PENDING') return false;
    if (filter === 'VERIFIED' && o.status !== 'VERIFIED') return false;
    if (filter === 'REJECTED' && o.status !== 'REJECTED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = o.orderId.toLowerCase().includes(q);
      const matchUtr = (o.utr || '').toLowerCase().includes(q);
      const matchUser = (o.userId || '').toLowerCase().includes(q);
      return matchId || matchUtr || matchUser;
    }
    return true;
  });

  const filteredWithdrawals = withdrawals.filter(w => {
    if (filter === 'PENDING' && w.status !== 'PENDING') return false;
    if (filter === 'VERIFIED' && w.status !== 'VERIFIED') return false;
    if (filter === 'REJECTED' && w.status !== 'REJECTED') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = (w.id || '').toLowerCase().includes(q);
      const matchUser = (w.userId || '').toLowerCase().includes(q);
      const matchBank = (w.bankDetails?.bankName || '').toLowerCase().includes(q);
      const matchUpi = (w.upiDetails?.upiId || '').toLowerCase().includes(q);
      return matchId || matchUser || matchBank || matchUpi;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-28">
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-500" />
                DHRU.AI Core Operations
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Desk
              </span>
              {isSuperAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 font-black flex items-center gap-1 shadow-sm">
                  👑 Super Admin Master: {user?.email}
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight flex items-center gap-2">
              <span>Admin & Payment Approvals Control Center</span>
            </h1>
            <p className="text-xs text-ink-2 mt-1">
              Real-time platform revenue analytics, instant UPI verification desk, user balances, and system health.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-surface-2 border border-line text-ink hover:text-brand text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Desk</span>
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('overview')}
                className="px-3.5 py-2 rounded-xl bg-brand-fill hover:bg-brand-hover text-on-brand text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <span>Trading Overview</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Payee VPA Verification Banner */}
        <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2 text-ink-2">
            <span>Verified NPCI Merchant VPA:</span>
            <span className="px-2 py-0.5 rounded bg-surface-2 text-ink font-bold border border-line">
              preethamrishu@axl
            </span>
            <span className="text-ink-2 hidden sm:inline">(DHRU AI Quantitative Markets)</span>
          </div>
          <div className="text-ink-2">
            Order Expiry Window: <strong className="text-ink font-bold">10 Minutes (Strict NPCI TTL)</strong>
          </div>
        </div>
      </div>

      {/* 2. Platform Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between text-ink-2 text-xs font-mono mb-1">
            <span>Registered Traders</span>
            <User className="w-4 h-4 text-brand" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-ink">
            {analytics?.totalUsers ?? '—'}
          </div>
          <div className="text-[10px] text-ink-2 mt-1">Active platform accounts</div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between text-ink-2 text-xs font-mono mb-1">
            <span>Platform Revenue</span>
            <TrendingUp className="w-4 h-4 text-pos" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-pos">
            ₹{(analytics?.totalRevenueInr ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-ink-2 mt-1">Verified UPI receipts</div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between text-ink-2 text-xs font-mono mb-1">
            <span>User Trading Funds</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            ₹{(analytics?.totalTradingFunds ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-ink-2 mt-1">Real account margin pool</div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between text-ink-2 text-xs font-mono mb-1">
            <span>AI Credits Issued</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {(analytics?.totalCreditsOutstanding ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-ink-2 mt-1">Active user credit tokens</div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-surface col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-ink-2 text-xs font-mono mb-1">
            <span>Pending Approvals</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <div className={`text-xl sm:text-2xl font-black font-mono ${
            (analytics?.pendingOrdersCount ?? 0) > 0 ? 'text-amber-500 animate-pulse' : 'text-ink'
          }`}>
            {analytics?.pendingOrdersCount ?? 0}
          </div>
          <div className="text-[10px] text-ink-2 mt-1">Requires admin review</div>
        </div>
      </div>

      {/* Desk Mode Switcher: Deposits vs Withdrawals */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3">
        <button
          type="button"
          onClick={() => setDeskTab('deposits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            deskTab === 'deposits'
              ? 'bg-brand-fill text-on-brand shadow-sm'
              : 'bg-surface-2 text-ink-2 hover:text-ink'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>UPI Deposits Approval ({orders.filter(o => o.status === 'PENDING').length} Pending)</span>
        </button>

        <button
          type="button"
          onClick={() => setDeskTab('withdrawals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            deskTab === 'withdrawals'
              ? 'bg-brand-fill text-on-brand shadow-sm'
              : 'bg-surface-2 text-ink-2 hover:text-ink'
          }`}
        >
          <ArrowDownLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span>Bank &amp; UPI Withdrawals ({withdrawals.filter(w => w.status === 'PENDING').length} Pending)</span>
        </button>
      </div>

      {/* 3. Main Split View: Payment Approvals Desk & User Balance Adjuster */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Payment Orders Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
              <div>
                <h2 className="text-base font-bold text-ink">
                  {deskTab === 'deposits' ? 'UPI Payment Approval Desk' : 'Bank & UPI Withdrawal Approval Desk'}
                </h2>
                <p className="text-xs text-ink-2">
                  {deskTab === 'deposits'
                    ? 'Verify user UTR numbers and approve deposits into wallet accounts.'
                    : 'Process outgoing payouts to Indian bank accounts (IMPS/NEFT) and UPI VPAs.'}
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-surface-2 border border-line text-xs font-mono">
                {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilter(tab)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                      filter === tab
                        ? 'bg-brand-fill text-on-brand shadow-sm'
                        : 'text-ink-2 hover:text-ink'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Search filter */}
            <div className="mt-3 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by Order ID, UTR number, or User ID..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-surface-2 border border-line text-xs font-mono text-ink placeholder:text-ink-3 focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>

            {/* Content Table: Withdrawals or Deposits */}
            <div className="mt-4 overflow-x-auto">
              {deskTab === 'withdrawals' ? (
                /* WITHDRAWALS TABLE */
                filteredWithdrawals.length === 0 ? (
                  <div className="py-12 text-center text-xs text-ink-2">
                    <Clock className="w-8 h-8 text-ink-3 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">No withdrawal requests match this filter.</p>
                    <p className="text-[11px] text-ink-3 mt-0.5">Trader withdrawal requests for Bank/UPI will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredWithdrawals.map(w => {
                      const isPending = w.status === 'PENDING';
                      const isVerified = w.status === 'VERIFIED';
                      const isRejected = w.status === 'REJECTED';
                      const isBusy = actionBusyId === w.id;

                      return (
                        <div
                          key={w.id}
                          className={`p-3.5 rounded-xl border transition-all ${
                            isPending
                              ? 'border-amber-500/30 bg-amber-500/5'
                              : isVerified
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : 'border-line bg-surface-2/50'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-black text-xs text-ink">{w.id}</span>
                                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                  isPending
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                    : isVerified
                                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                                }`}>
                                  {w.status}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-ink-2 border border-line font-bold uppercase">
                                  {w.method === 'UPI' ? '📱 UPI VPA' : '🏦 Bank Transfer'}
                                </span>
                              </div>
                              <p className="text-xs text-ink-2 mt-1">
                                User: <strong className="text-ink font-semibold">{w.userId}</strong> • Requested: {new Date(w.createdAt).toLocaleString()}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-base font-black font-mono text-cyan-600 dark:text-cyan-400">
                                ₹{Number(w.amount).toLocaleString('en-IN')}
                              </span>
                              <span className="text-[10px] text-ink-3 font-mono block">
                                ≈ ${(Number(w.amount) / 86.50).toFixed(2)} USD
                              </span>
                            </div>
                          </div>

                          {/* Bank / UPI Details */}
                          <div className="mt-2.5 p-2 rounded-lg bg-surface border border-line/60 text-xs font-mono space-y-1">
                            {w.method === 'UPI' ? (
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="text-ink-2">UPI VPA: </span>
                                  <strong className="text-ink font-bold">{w.upiDetails?.upiId}</strong>
                                </div>
                                {w.upiDetails?.beneficiaryName && (
                                  <span className="text-ink-2">Beneficiary: <strong className="text-ink">{w.upiDetails.beneficiaryName}</strong></span>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-0.5">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <span className="text-ink-2">Bank: </span>
                                    <strong className="text-ink font-bold">{w.bankDetails?.bankName}</strong>
                                  </div>
                                  <div>
                                    <span className="text-ink-2">Account: </span>
                                    <strong className="text-ink font-bold">{w.bankDetails?.accountNumber}</strong>
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div>
                                    <span className="text-ink-2">IFSC: </span>
                                    <strong className="text-ink font-bold">{w.bankDetails?.ifscCode}</strong>
                                  </div>
                                  <div>
                                    <span className="text-ink-2">Holder: </span>
                                    <strong className="text-ink font-bold">{w.bankDetails?.accountHolderName}</strong>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action Controls */}
                          <div className="mt-2.5 pt-2 border-t border-line/50 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] text-ink-3 font-mono">
                              {w.adminNote ? `Admin note: ${w.adminNote}` : (w.rejectionReason ? `Reason: ${w.rejectionReason}` : 'Awaiting payout action')}
                            </span>

                            <div className="flex items-center gap-2">
                              {isPending && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleApproveWithdrawal(w.id)}
                                    disabled={isBusy}
                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>{isBusy ? 'Processing...' : 'Approve & Mark Paid'}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRejectWithdrawal(w.id)}
                                    disabled={isBusy}
                                    className="px-2.5 py-1.5 rounded-lg bg-surface-2 border border-line hover:border-rose-500/50 text-rose-600 text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject &amp; Refund</span>
                                  </button>
                                </>
                              )}
                              {isVerified && (
                                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Paid / Transferred</span>
                                </span>
                              )}
                              {isRejected && (
                                <span className="text-xs font-mono text-rose-500 font-semibold flex items-center gap-1">
                                  <XCircle className="w-4 h-4" />
                                  <span>Rejected &amp; Refunded</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                /* Orders Table */
                filteredOrders.length === 0 ? (
                <div className="py-12 text-center text-xs text-ink-2">
                  <Clock className="w-8 h-8 text-ink-3 mx-auto mb-2 opacity-50" />
                  <p className="font-semibold">No payment orders match this filter.</p>
                  <p className="text-[11px] text-ink-3 mt-0.5">Incoming UPI orders will automatically appear here for verification.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredOrders.map(order => {
                    const isPending = order.status === 'PENDING';
                    const isVerified = order.status === 'VERIFIED';
                    const isRejected = order.status === 'REJECTED';
                    const isBusy = actionBusyId === order.orderId;

                    return (
                      <div
                        key={order.orderId}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isPending
                            ? 'border-amber-500/30 bg-amber-500/5'
                            : isVerified
                            ? 'border-emerald-500/30 bg-emerald-500/5'
                            : 'border-line bg-surface-2/50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-xs text-ink">
                                {order.orderId}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                isPending
                                  ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                  : isVerified
                                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                              }`}>
                                {order.status}
                              </span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                                order.type === 'credits'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {order.type === 'credits' ? `⚡ ${order.credits} Credits` : `💼 ₹${order.amount} Funds`}
                              </span>
                            </div>

                            <div className="mt-1.5 flex items-center gap-3 text-[11px] font-mono text-ink-2">
                              <span>User: <strong className="text-ink">{order.userId}</strong></span>
                              <span>Amount: <strong className="text-ink">₹{order.amount}</strong></span>
                              <span>Time: {new Date(order.createdAt).toLocaleTimeString()}</span>
                            </div>

                            {order.utr && (
                              <div className="mt-1 text-xs font-mono">
                                <span className="text-ink-2">Bank UTR Ref: </span>
                                <strong className="text-brand font-bold bg-brand/10 px-1.5 py-0.5 rounded">
                                  {order.utr}
                                </strong>
                              </div>
                            )}

                            {order.adminNote && (
                              <div className="mt-1 text-[11px] text-ink-3 italic">
                                Note: {order.adminNote}
                              </div>
                            )}
                          </div>

                          {/* Approval Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleApproveOrder(order.orderId)}
                                  disabled={isBusy}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer disabled:opacity-50"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isBusy ? 'Crediting...' : 'Approve & Credit'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRejectOrder(order.orderId)}
                                  disabled={isBusy}
                                  className="px-2.5 py-1.5 rounded-lg bg-surface-2 border border-line hover:border-rose-500/50 text-rose-600 text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}
                            {isVerified && (
                              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Credited</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="text-xs font-mono text-rose-500 font-semibold flex items-center gap-1">
                                <XCircle className="w-4 h-4" />
                                <span>Rejected</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: User Balance Adjuster Desk */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <div className="flex items-center gap-2 pb-3 border-b border-line">
              <Sliders className="w-4 h-4 text-brand" />
              <div>
                <h3 className="text-sm font-bold text-ink">Manual Balance Adjuster</h3>
                <p className="text-[11px] text-ink-2">Credit/debit credits or real funds directly.</p>
              </div>
            </div>

            <form onSubmit={handleManualAdjust} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">
                  Target User ID
                </label>
                <input
                  type="text"
                  value={adjustUserId}
                  onChange={e => setAdjustUserId(e.target.value)}
                  placeholder="e.g. active-trader or UID"
                  required
                  className="w-full px-3 py-1.5 rounded-xl bg-surface-2 border border-line text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('credits')}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      adjustType === 'credits'
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40'
                        : 'bg-surface-2 text-ink-2 border-line'
                    }`}
                  >
                    ⚡ AI Credits
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('funds')}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      adjustType === 'funds'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40'
                        : 'bg-surface-2 text-ink-2 border-line'
                    }`}
                  >
                    💼 Real Funds (₹)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">
                  Delta Amount (+/-)
                </label>
                <input
                  type="number"
                  value={adjustDelta}
                  onChange={e => setAdjustDelta(Number(e.target.value))}
                  step="1"
                  required
                  className="w-full px-3 py-1.5 rounded-xl bg-surface-2 border border-line text-xs font-mono font-bold text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <span className="text-[10px] text-ink-3 mt-0.5 block">Use positive numbers to add, negative to deduct.</span>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">
                  Admin Audit Reason
                </label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={e => setAdjustNote(e.target.value)}
                  placeholder="Reason for audit log..."
                  className="w-full px-3 py-1.5 rounded-xl bg-surface-2 border border-line text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <button
                type="submit"
                disabled={adjustBusy}
                className="w-full py-2.5 rounded-xl bg-brand-fill hover:bg-brand-hover text-on-brand text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{adjustBusy ? 'Processing...' : 'Apply Balance Adjustment'}</span>
              </button>
            </form>
          </div>

          {/* Quick Info Card */}
          <div className="rounded-2xl border border-line bg-surface p-4 text-xs font-mono space-y-2 text-ink-2">
            <div className="flex items-center gap-1.5 font-bold text-ink">
              <Activity className="w-3.5 h-3.5 text-brand" />
              <span>Institutional Access Rules</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              • Any account reaching <strong>1,000+ Credits</strong> automatically unlocks Institutional Smart Money Concepts (SMC) & Multi-Agent Quantitative Council forever.
            </p>
            <p className="text-[11px] leading-relaxed">
              • Approving a real funds deposit updates <strong>wallet.tradingBalance</strong>, allowing real account trading instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
