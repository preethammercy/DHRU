// DHRU.AI - Dedicated Super Admin Operations & Control Center
// Modules: Analytics, Users & Permissions, Payment Orders (UTR Desk), Withdrawals, System Broadcasting, Support Inquiries.
// Strictly administrative and financial operations (no market or trading clutter).

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
  User,
  Sliders,
  ArrowDownLeft,
  Copy,
  Mail,
  MessageSquare,
  Send,
  Bell,
  Lock,
  LogOut,
  Ban,
  Megaphone,
  Check,
  Phone,
  AlertCircle
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
  userEmail?: string;
  userName?: string;
  userPhone?: string;
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

interface RegisteredUser {
  userId: string;
  displayName?: string;
  email?: string;
  phone?: string;
  credits: number;
  tradingBalance: number;
  totalCreditsPurchased?: number;
  premiumUnlocked?: boolean;
  isBanned?: boolean;
  canTrade?: boolean;
  role?: string;
  txCount?: number;
  updatedAt?: string | null;
}

interface Props {
  onNavigate?: (nav: string) => void;
}

export const AdminDashboardPage: React.FC<Props> = ({ onNavigate }) => {
  const { user, signInWithEmail, signOut } = useAuth();
  const { refreshWallet } = useWallet();
  const isSuperAdmin = user?.email?.toLowerCase() === 'preethamjee2008@gmail.com';

  // Secret Gate Login State (when accessed via /admin without prior session)
  const [gateEmail, setGateEmail] = useState('');
  const [gatePass, setGatePass] = useState('');
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateBusy, setGateBusy] = useState(false);

  // Admin Desk Tabs
  const [deskTab, setDeskTab] = useState<'analytics' | 'users' | 'deposits' | 'withdrawals' | 'broadcast' | 'inquiries'>('deposits');
  
  // Data State
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<RegisteredUser[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [currentBroadcast, setCurrentBroadcast] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Manual Adjuster Form State
  const [adjustUserId, setAdjustUserId] = useState('');
  const [adjustType, setAdjustType] = useState<'credits' | 'funds'>('credits');
  const [adjustDelta, setAdjustDelta] = useState<number>(500);
  const [adjustNote, setAdjustNote] = useState('Manual adjustment by Super Admin');
  const [adjustBusy, setAdjustBusy] = useState(false);

  // Broadcast Composer State
  const [bcTitle, setBcTitle] = useState('');
  const [bcMessage, setBcMessage] = useState('');
  const [bcType, setBcType] = useState<'INFO' | 'WARNING' | 'ALERT' | 'PROMO'>('INFO');
  const [bcBusy, setBcBusy] = useState(false);

  const fetchAdminData = useCallback(async () => {
    if (!isSuperAdmin) return;
    try {
      setLoading(true);
      const headers = { 'Content-Type': 'application/json', 'x-admin-email': user?.email || '' };
      const [overviewRes, ordersRes, withdrawalsRes, inquiriesRes, usersRes, broadcastRes] = await Promise.all([
        fetch('/api/wallet/admin/overview', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/wallet/admin/orders', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/wallet/admin/withdrawals', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/contact/messages', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/wallet/admin/users', { headers }).then(r => r.json()).catch(() => null),
        fetch('/api/wallet/broadcast/active').then(r => r.json()).catch(() => null)
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
      if (inquiriesRes?.ok && Array.isArray(inquiriesRes.messages)) {
        setInquiries(inquiriesRes.messages);
      }
      if (usersRes?.ok && Array.isArray(usersRes.users)) {
        setUsersList(usersRes.users);
      }
      if (broadcastRes?.ok && broadcastRes.broadcast) {
        setCurrentBroadcast(broadcastRes.broadcast);
      }
    } catch (err) {
      console.error('[Admin] Failed to load admin desk:', err);
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, user?.email]);

  useEffect(() => {
    if (isSuperAdmin) {
      void fetchAdminData();
      const interval = setInterval(fetchAdminData, 15000);
      return () => clearInterval(interval);
    }
  }, [isSuperAdmin, fetchAdminData]);

  // Handle Secret Gate Login
  const handleGateLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateBusy(true);
    setGateError(null);
    try {
      const res = await signInWithEmail(gateEmail, gatePass);
      if (!res.success) {
        setGateError(res.message || 'Access Denied: Invalid Security Credentials');
      }
    } catch (err: any) {
      setGateError(err.message || 'Authentication error');
    } finally {
      setGateBusy(false);
    }
  };

  // Order Approvals
  const handleApproveOrder = async (orderId: string) => {
    if (!window.confirm(`Confirm verification for Order ${orderId}? This will credit the trader's balance.`)) {
      return;
    }
    setActionBusyId(orderId);
    try {
      const res = await fetch('/api/wallet/admin/approve-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': user?.email || '' },
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
          reason: `Order ${orderId} approved and credited.`
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
        headers: { 'Content-Type': 'application/json', 'x-admin-email': user?.email || '' },
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

  // Withdrawal Approvals
  const handleApproveWithdrawal = async (withdrawalId: string) => {
    const utr = window.prompt(`Enter Bank / UPI Transaction Reference (UTR) for ${withdrawalId}:`, `IMPS-${Date.now().toString().slice(-8)}`);
    if (!utr) return;

    setActionBusyId(withdrawalId);
    try {
      const res = await fetch('/api/wallet/admin/approve-withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': user?.email || '' },
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
        headers: { 'Content-Type': 'application/json', 'x-admin-email': user?.email || '' },
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

  // Manual Adjuster
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
        headers: { 'Content-Type': 'application/json', 'x-admin-email': user?.email || '' },
        body: JSON.stringify({
          userId: adjustUserId.trim(),
          credits: adjustType === 'credits' ? adjustDelta : 0,
          funds: adjustType === 'funds' ? adjustDelta : 0,
          note: adjustNote.trim() || 'Manual adjustment via Admin Panel'
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

  // User Permission Toggle
  const handleToggleUserPermission = async (userId: string, currentBanned: boolean) => {
    const willBan = !currentBanned;
    if (!window.confirm(`Are you sure you want to ${willBan ? 'SUSPEND/BAN' : 'UNBAN'} user "${userId}"?`)) {
      return;
    }
    try {
      const res = await fetch('/api/wallet/admin/update-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': user?.email || '' },
        body: JSON.stringify({ userId, isBanned: willBan })
      });
      const data = await res.json();
      if (data.ok) {
        await fetchAdminData();
      } else {
        alert(data.error || 'Failed to update user status');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Broadcast Publisher
  const handlePublishBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bcTitle.trim() || !bcMessage.trim()) {
      alert('Please enter broadcast title and message.');
      return;
    }
    setBcBusy(true);
    try {
      const res = await fetch('/api/wallet/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': user?.email || '' },
        body: JSON.stringify({ title: bcTitle, message: bcMessage, type: bcType, active: true })
      });
      const data = await res.json();
      if (data.ok) {
        alert('Broadcast published system-wide successfully!');
        setBcTitle('');
        setBcMessage('');
        await fetchAdminData();
      } else {
        alert(data.error || 'Failed to publish broadcast');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setBcBusy(false);
    }
  };

  const handleClearBroadcast = async () => {
    if (!window.confirm('Clear and deactivate the current system broadcast?')) return;
    try {
      await fetch('/api/wallet/admin/broadcast/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-email': user?.email || '' }
      });
      await fetchAdminData();
    } catch {}
  };

  // Filtered Orders & Withdrawals
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

  // ==========================================
  // 1. SECRET ADMIN GATE (When not authorized)
  // ==========================================
  if (!isSuperAdmin) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl border border-line bg-surface shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <ShieldCheck className="h-7 w-7 text-purple-400" />
            </div>
            <h2 className="text-xl font-black text-ink">Administrative Portal</h2>
            <p className="text-xs text-ink-3">Authorized access only. Enter security credentials to unlock desk.</p>
          </div>

          <form onSubmit={handleGateLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">Admin Email</label>
              <input
                type="email"
                value={gateEmail}
                onChange={e => setGateEmail(e.target.value)}
                placeholder="admin@dhruai.in"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-2 text-ink text-xs font-mono outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">Secret Key / Password</label>
              <input
                type="password"
                value={gatePass}
                onChange={e => setGatePass(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-2 text-ink text-xs font-mono outline-none focus:border-purple-500"
              />
            </div>

            {gateError && (
              <div role="alert" className="p-3 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs text-rose-400 font-mono">
                {gateError}
              </div>
            )}

            <button
              type="submit"
              disabled={gateBusy}
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase font-mono tracking-wider shadow-md active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{gateBusy ? 'Authenticating...' : 'Unlock Admin Desk'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. SUPER ADMIN COMMAND CENTER
  // ==========================================
  return (
    <div className="space-y-6 animate-fade-in pb-28">
      
      {/* 1. Header Banner */}
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
                Super Admin Master Desk
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Secure Session Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
              Administrative &amp; Operations Control Center
            </h1>
            <p className="text-xs text-ink-2 mt-1">
              Platform analytics, verified UPI approvals, user permissions, banking withdrawals, and system-wide broadcasting.
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
            <button
              onClick={() => signOut()}
              className="px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Merchant Settlement Information */}
        <div className="mt-4 pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-ink-2">
          <div className="flex items-center gap-2">
            <span>Verified NPCI Target VPA:</span>
            <span className="px-2 py-0.5 rounded bg-surface-2 text-ink font-bold border border-line">
              preethamrishu@axl
            </span>
          </div>
          <div>
            System Gateway: <strong className="text-ink font-bold">Encrypted End-to-End</strong>
          </div>
        </div>
      </div>

      {/* 2. Top Administrative Navigation Tabs */}
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
          <span>Payment Approvals ({orders.filter(o => o.status === 'PENDING').length} Pending)</span>
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
          <span>Withdrawals ({withdrawals.filter(w => w.status === 'PENDING').length} Pending)</span>
        </button>

        <button
          type="button"
          onClick={() => setDeskTab('users')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            deskTab === 'users'
              ? 'bg-brand-fill text-on-brand shadow-sm'
              : 'bg-surface-2 text-ink-2 hover:text-ink'
          }`}
        >
          <User className="w-3.5 h-3.5 text-purple-400" />
          <span>Users &amp; Permissions ({usersList.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setDeskTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            deskTab === 'broadcast'
              ? 'bg-brand-fill text-on-brand shadow-sm'
              : 'bg-surface-2 text-ink-2 hover:text-ink'
          }`}
        >
          <Megaphone className="w-3.5 h-3.5 text-pink-400" />
          <span>Broadcasting {currentBroadcast?.active && '• Live'}</span>
        </button>

        <button
          type="button"
          onClick={() => setDeskTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            deskTab === 'analytics'
              ? 'bg-brand-fill text-on-brand shadow-sm'
              : 'bg-surface-2 text-ink-2 hover:text-ink'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span>Analytics &amp; Treasury</span>
        </button>

        <button
          type="button"
          onClick={() => setDeskTab('inquiries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
            deskTab === 'inquiries'
              ? 'bg-brand-fill text-on-brand shadow-sm'
              : 'bg-surface-2 text-ink-2 hover:text-ink'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
          <span>Help Inquiries ({inquiries.filter(m => m.status === 'NEW').length} New)</span>
        </button>
      </div>

      {/* 3. Platform Analytics Overview Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between text-ink-2 text-xs font-mono mb-1">
            <span>Total Revenue</span>
            <TrendingUp className="w-4 h-4 text-pos" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-pos">
            ₹{(analytics?.totalRevenueInr ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-ink-2 mt-1">Verified UPI deposits</div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between text-ink-2 text-xs font-mono mb-1">
            <span>Real Trading Pool</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            ₹{(analytics?.totalTradingFunds ?? 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] text-ink-2 mt-1">Active trader balances</div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between text-ink-2 text-xs font-mono mb-1">
            <span>AI Credits Issued</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
            {(analytics?.totalCreditsOutstanding ?? 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-ink-2 mt-1">Total credit tokens</div>
        </div>

        <div className="p-4 rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between text-ink-2 text-xs font-mono mb-1">
            <span>Registered Traders</span>
            <User className="w-4 h-4 text-brand" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-ink">
            {analytics?.totalUsers ?? '—'}
          </div>
          <div className="text-[10px] text-ink-2 mt-1">Platform accounts</div>
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

      {/* 4. Tab Views */}

      {/* TAB A: PAYMENT ORDERS / UTR VERIFICATION DESK */}
      {deskTab === 'deposits' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                <div>
                  <h2 className="text-base font-bold text-ink">UPI Payment Approval Desk</h2>
                  <p className="text-xs text-ink-2">Inspect user-entered UTR references and verify payments against bank records.</p>
                </div>

                <div className="flex items-center p-1 rounded-xl bg-surface-2 border border-line text-xs font-mono">
                  {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilter(tab)}
                      className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                        filter === tab ? 'bg-brand-fill text-on-brand shadow-sm' : 'text-ink-2 hover:text-ink'
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

              <div className="mt-4 space-y-3">
                {filteredOrders.length === 0 ? (
                  <div className="py-12 text-center text-xs text-ink-2">
                    <Clock className="w-8 h-8 text-ink-3 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">No payment orders match this filter.</p>
                  </div>
                ) : (
                  filteredOrders.map(order => {
                    const isPending = order.status === 'PENDING';
                    const isVerified = order.status === 'VERIFIED';
                    const isRejected = order.status === 'REJECTED';
                    const isBusy = actionBusyId === order.orderId;

                    return (
                      <div
                        key={order.orderId}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isPending ? 'border-amber-500/30 bg-amber-500/5' : isVerified ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-line bg-surface-2/50'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-black text-xs text-ink">{order.orderId}</span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                                isPending ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : isVerified ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                              }`}>
                                {order.status}
                              </span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                                order.type === 'credits' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              }`}>
                                {order.type === 'credits' ? `⚡ ${order.credits} Credits` : `💼 ₹${order.amount} Funds`}
                              </span>
                            </div>

                            <div className="mt-2 p-2.5 rounded-xl bg-surface-2 border border-line space-y-1.5 text-xs font-mono">
                              <div className="flex flex-wrap items-center gap-3">
                                <span>Trader: <strong className="text-ink">{order.userName || order.userId}</strong></span>
                                {order.userEmail && <span>Email: <strong className="text-ink">{order.userEmail}</strong></span>}
                                {order.userPhone && <span>Phone: <strong className="text-ink">📱 +91 {order.userPhone}</strong></span>}
                                <span>Amount: <strong className="text-emerald-500 font-extrabold text-sm">₹{order.amount.toLocaleString('en-IN')}</strong></span>
                              </div>

                              {/* Highlighted UTR */}
                              <div className="flex items-center gap-2 pt-1">
                                <span className="text-ink-2 font-bold">User Entered UTR:</span>
                                {order.utr ? (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-700 dark:text-amber-300 font-black">
                                    <span>{order.utr}</span>
                                    <button
                                      type="button"
                                      onClick={() => navigator?.clipboard?.writeText?.(order.utr || '')}
                                      className="p-1 hover:text-ink cursor-pointer"
                                      title="Copy UTR"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-ink-3 italic">Pending user submission</span>
                                )}
                              </div>
                            </div>
                          </div>

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
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Manual Adjuster */}
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
                  <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">Target User ID / Email</label>
                  <input
                    type="text"
                    value={adjustUserId}
                    onChange={e => setAdjustUserId(e.target.value)}
                    placeholder="e.g. active-trader or user email"
                    required
                    className="w-full px-3 py-1.5 rounded-xl bg-surface-2 border border-line text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">Adjustment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAdjustType('credits')}
                      className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                        adjustType === 'credits' ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40' : 'bg-surface-2 text-ink-2 border-line'
                      }`}
                    >
                      ⚡ AI Credits
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdjustType('funds')}
                      className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                        adjustType === 'funds' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40' : 'bg-surface-2 text-ink-2 border-line'
                      }`}
                    >
                      💼 Real Funds (₹)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">Delta Amount (+/-)</label>
                  <input
                    type="number"
                    value={adjustDelta}
                    onChange={e => setAdjustDelta(Number(e.target.value))}
                    step="1"
                    required
                    className="w-full px-3 py-1.5 rounded-xl bg-surface-2 border border-line text-xs font-mono font-bold text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  <span className="text-[10px] text-ink-3 mt-0.5 block">Positive to add, negative to deduct.</span>
                </div>

                <div>
                  <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">Audit Log Note</label>
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
          </div>
        </div>
      )}

      {/* TAB B: WITHDRAWALS & PAYOUTS DESK */}
      {deskTab === 'withdrawals' && (
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
            <div>
              <h2 className="text-base font-bold text-ink">Bank &amp; UPI Withdrawal Approval Desk</h2>
              <p className="text-xs text-ink-2">Process outgoing payouts to Indian bank accounts (IMPS/NEFT) and UPI VPAs.</p>
            </div>

            <div className="flex items-center p-1 rounded-xl bg-surface-2 border border-line text-xs font-mono">
              {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                    filter === tab ? 'bg-brand-fill text-on-brand shadow-sm' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {filteredWithdrawals.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-2">
                <Clock className="w-8 h-8 text-ink-3 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">No withdrawal requests match this filter.</p>
              </div>
            ) : (
              filteredWithdrawals.map(w => {
                const isPending = w.status === 'PENDING';
                const isVerified = w.status === 'VERIFIED';
                const isRejected = w.status === 'REJECTED';
                const isBusy = actionBusyId === w.id;

                return (
                  <div
                    key={w.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isPending ? 'border-amber-500/30 bg-amber-500/5' : isVerified ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-line bg-surface-2/50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-xs text-ink">{w.id}</span>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                            isPending ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300' : isVerified ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                          }`}>
                            {w.status}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-2 text-ink-2 border border-line font-bold uppercase">
                            {w.method === 'UPI' ? '📱 UPI VPA' : '🏦 Bank Transfer'}
                          </span>
                        </div>
                        <p className="text-xs text-ink-2 mt-1">
                          Trader: <strong className="text-ink font-semibold">{w.userId}</strong> • {new Date(w.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-black font-mono text-cyan-600 dark:text-cyan-400">
                          ₹{Number(w.amount).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Bank / UPI Details */}
                    <div className="mt-2.5 p-2.5 rounded-lg bg-surface border border-line/60 text-xs font-mono space-y-1">
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
                            <div><span className="text-ink-2">Bank: </span><strong className="text-ink font-bold">{w.bankDetails?.bankName}</strong></div>
                            <div><span className="text-ink-2">Account: </span><strong className="text-ink font-bold">{w.bankDetails?.accountNumber}</strong></div>
                          </div>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div><span className="text-ink-2">IFSC: </span><strong className="text-ink font-bold">{w.bankDetails?.ifscCode}</strong></div>
                            <div><span className="text-ink-2">Holder: </span><strong className="text-ink font-bold">{w.bankDetails?.accountHolderName}</strong></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
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
                              <span>{isBusy ? 'Processing...' : 'Approve & Mark Transferred'}</span>
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
              })
            )}
          </div>
        </div>
      )}

      {/* TAB C: USERS & PERMISSIONS DESK */}
      {deskTab === 'users' && (
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
            <div>
              <h2 className="text-base font-bold text-ink">User Directory &amp; Permissions Desk</h2>
              <p className="text-xs text-ink-2">Manage registered trader accounts, balances, and permissions.</p>
            </div>
            <span className="text-xs font-mono font-bold text-ink bg-surface-2 px-3 py-1.5 rounded-xl border border-line">
              {usersList.length} Registered Traders
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-line text-ink-3 uppercase text-[10px]">
                  <th className="py-2.5 px-3">User ID / Name</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Trading Funds</th>
                  <th className="py-2.5 px-3">AI Credits</th>
                  <th className="py-2.5 px-3">Status / Permission</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {usersList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink-2 text-xs">
                      No user accounts found.
                    </td>
                  </tr>
                ) : (
                  usersList.map(u => {
                    const isSuper = (u.email || '').toLowerCase() === 'preethamjee2008@gmail.com';
                    return (
                      <tr key={u.userId} className="hover:bg-surface-2/40 transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-ink font-bold block">{u.displayName || u.userId}</strong>
                          <span className="text-[10px] text-ink-3">{u.userId}</span>
                          {isSuper && (
                            <span className="ml-1 text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-600 font-bold uppercase">
                              Super Admin
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="text-ink-2">{u.email || '—'}</div>
                          {u.phone && <div className="text-[10px] text-emerald-500">📱 +91 {u.phone}</div>}
                        </td>
                        <td className="py-3 px-3 font-extrabold text-emerald-600 dark:text-emerald-400">
                          ₹{u.tradingBalance.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 font-bold text-amber-500">
                          {u.credits} Cr
                        </td>
                        <td className="py-3 px-3">
                          {u.isBanned ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-600 font-bold uppercase text-[10px]">
                              Suspended / Banned
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 font-bold uppercase text-[10px]">
                              Active &amp; Verified
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAdjustUserId(u.userId);
                              setDeskTab('deposits');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-surface-2 border border-line hover:border-brand text-ink text-xs font-bold transition-all cursor-pointer"
                          >
                            Adjust Balance
                          </button>
                          {!isSuper && (
                            <button
                              type="button"
                              onClick={() => handleToggleUserPermission(u.userId, !!u.isBanned)}
                              className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                u.isBanned
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : 'bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500/20'
                              }`}
                            >
                              {u.isBanned ? 'Unban' : 'Suspend'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB D: BROADCASTING & SYSTEM ANNOUNCEMENTS */}
      {deskTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Composer */}
          <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 space-y-4">
            <div className="pb-3 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-ink flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-pink-500" />
                  <span>Broadcast System-Wide Announcement</span>
                </h2>
                <p className="text-xs text-ink-2">Send instant notice banners to all active traders across the site.</p>
              </div>
            </div>

            <form onSubmit={handlePublishBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">Headline / Title</label>
                <input
                  type="text"
                  value={bcTitle}
                  onChange={e => setBcTitle(e.target.value)}
                  placeholder="e.g. Scheduled Network Maintenance or New Crypto Pairs Live"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-line text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">Priority Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['INFO', 'WARNING', 'ALERT', 'PROMO'] as const).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBcType(t)}
                      className={`py-1.5 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                        bcType === t
                          ? 'bg-brand-fill text-on-brand shadow-sm'
                          : 'bg-surface-2 text-ink-2 border-line'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-ink-2 mb-1">Announcement Message Body</label>
                <textarea
                  value={bcMessage}
                  onChange={e => setBcMessage(e.target.value)}
                  placeholder="Type the message that all traders will see at the top of their dashboard..."
                  rows={4}
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-surface-2 border border-line text-xs font-mono text-ink focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={bcBusy}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-xs uppercase font-mono tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{bcBusy ? 'Broadcasting...' : 'Publish to All Users'}</span>
                </button>
                {currentBroadcast?.active && (
                  <button
                    type="button"
                    onClick={handleClearBroadcast}
                    className="px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-rose-500/10 border border-line hover:border-rose-500/40 text-rose-500 font-bold text-xs font-mono cursor-pointer"
                  >
                    Clear Active
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Current Broadcast Status & Live Preview */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5 space-y-4">
              <h3 className="text-sm font-bold text-ink">Active Platform Broadcast</h3>

              {currentBroadcast?.active ? (
                <div className="p-4 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded font-bold text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-600 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Broadcasting Live
                    </span>
                    <span className="text-[10px] font-mono text-ink-3">
                      {new Date(currentBroadcast.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <strong className="text-sm font-bold text-ink block">{currentBroadcast.title}</strong>
                    <p className="text-xs text-ink-2">{currentBroadcast.message}</p>
                  </div>

                  <div className="pt-2 border-t border-line/50 flex justify-end">
                    <button
                      onClick={handleClearBroadcast}
                      className="text-xs text-rose-500 hover:underline font-mono font-bold cursor-pointer"
                    >
                      Deactivate Broadcast ✕
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-ink-3">
                  <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-40 text-ink-3" />
                  <p>No broadcast is currently active.</p>
                  <p className="text-[11px] mt-0.5">Use the composer on the left to send an announcement to all users.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB E: ANALYTICS & TREASURY */}
      {deskTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
            <h2 className="text-base font-bold text-ink">Financial Operations Summary</h2>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-2 border border-line">
                <span className="text-ink-2">Total Verified Collections:</span>
                <strong className="text-emerald-500 font-bold">₹{(analytics?.totalRevenueInr ?? 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-2 border border-line">
                <span className="text-ink-2">Trader Real Funds Held:</span>
                <strong className="text-ink font-bold">₹{(analytics?.totalTradingFunds ?? 0).toLocaleString('en-IN')}</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-2 border border-line">
                <span className="text-ink-2">Outstanding AI Credits:</span>
                <strong className="text-amber-500 font-bold">{(analytics?.totalCreditsOutstanding ?? 0).toLocaleString()} Credits</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-2 border border-line">
                <span className="text-ink-2">Total Orders Recorded:</span>
                <strong className="text-ink font-bold">{analytics?.totalOrdersCount ?? 0} Orders</strong>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-5 space-y-4">
            <h2 className="text-base font-bold text-ink">Merchant Settlement Configuration</h2>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-2 border border-line">
                <span className="text-ink-2">Target UPI VPA:</span>
                <strong className="text-ink font-bold">{analytics?.targetVpa || 'preethamrishu@axl'}</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-2 border border-line">
                <span className="text-ink-2">Payee Name:</span>
                <strong className="text-ink font-bold">{analytics?.payeeName || 'Preetham (DHRU.AI)'}</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-2 border border-line">
                <span className="text-ink-2">NPCI Session Expiry Window:</span>
                <strong className="text-ink font-bold">10 Minutes TTL</strong>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-surface-2 border border-line">
                <span className="text-ink-2">Gateway Status:</span>
                <strong className="text-emerald-500 font-bold">ONLINE (100% Uptime)</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB F: INQUIRIES & TRADER CONTACT */}
      {deskTab === 'inquiries' && (
        <div className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
            <div>
              <h2 className="text-base font-bold text-ink">Trader Support &amp; Help Inquiries</h2>
              <p className="text-xs text-ink-2">Support requests, questions, and feedback submitted via the Contact Us form.</p>
            </div>
            <span className="text-xs font-mono font-bold text-ink bg-surface-2 px-3 py-1.5 rounded-xl border border-line">
              {inquiries.length} Inquiries Total
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {inquiries.length === 0 ? (
              <div className="py-12 text-center text-xs text-ink-2">
                <MessageSquare className="w-8 h-8 text-ink-3 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">No inquiries received yet.</p>
              </div>
            ) : (
              inquiries.map(item => {
                const isNew = item.status === 'NEW';
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isNew ? 'border-amber-500/40 bg-amber-500/5' : 'border-line bg-surface-2/40'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-line/60">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs text-ink">{item.name}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                          isNew ? 'bg-amber-500/20 text-amber-600' : 'bg-emerald-500/20 text-emerald-600'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-[11px] font-mono text-ink-3">
                          {new Date(item.createdAt).toLocaleTimeString()} · {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <a href={`mailto:${item.email}`} className="text-brand hover:underline flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{item.email}</span>
                        </a>
                        {item.phone && (
                          <a href={`tel:${item.phone}`} className="text-emerald-500 hover:underline">
                            📱 {item.phone}
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-xs space-y-1">
                      <strong className="text-ink font-bold block">{item.subject}</strong>
                      <p className="text-ink-2 whitespace-pre-wrap bg-surface p-3 rounded-lg border border-line/40">
                        {item.message}
                      </p>
                    </div>

                    {isNew && (
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await fetch('/api/contact/resolve', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'x-admin-email': user?.email || '' },
                                body: JSON.stringify({ id: item.id })
                              });
                              await fetchAdminData();
                            } catch (err) {
                              alert('Failed to mark resolved');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold flex items-center gap-1 cursor-pointer transition-all"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

    </div>
  );
};
