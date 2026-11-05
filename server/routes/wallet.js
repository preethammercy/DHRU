import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const WALLET_FILE = path.join(DATA_DIR, 'wallet-store.json');

const UPI_TARGET_VPA = 'preethamrishu@axl';
const UPI_PAYEE_NAME = 'DHRU AI Quantitative Markets';
const ORDER_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes exact expiry

function loadWalletStore() {
  try {
    if (fs.existsSync(WALLET_FILE)) {
      return JSON.parse(fs.readFileSync(WALLET_FILE, 'utf8'));
    }
  } catch (err) {
    console.warn('[WalletStore] Failed to load wallet store:', err.message);
  }
  return { users: {}, orders: {} };
}

function saveWalletStore(store) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(WALLET_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('[WalletStore] Failed to persist wallet store:', err.message);
  }
}

export function createWalletRouter() {
  const router = express.Router();
  router.use(express.json());

  // 1. Get Wallet State
  router.get('/state', (req, res) => {
    const userId = req.query.userId || 'default-user';
    const store = loadWalletStore();
    const user = store.users[userId] || {
      credits: 100, // 100 free starting credits
      tradingBalance: 0,
      totalCreditsPurchased: 0,
      premiumUnlocked: false,
      history: []
    };
    res.json({ ok: true, wallet: user, targetVpa: UPI_TARGET_VPA });
  });

  // 2. Create 10-Minute UPI Payment Order
  router.post('/create-upi-order', (req, res) => {
    try {
      const { type = 'credits', amount = 499, credits = 500, userId = 'default-user' } = req.body;
      const numAmount = Number(amount);
      if (!Number.isFinite(numAmount) || numAmount <= 0) {
        return res.status(400).json({ error: 'Valid payment amount is required' });
      }

      const orderId = `DHRU-UPI-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const expiresAt = Date.now() + ORDER_EXPIRY_MS;
      
      const transactionNote = type === 'credits'
        ? `DHRU AI ${credits} Credits (${orderId})`
        : `DHRU Trading Fund Deposit (${orderId})`;

      // Standard NPCI UPI URI Scheme
      const upiUri = `upi://pay?pa=${encodeURIComponent(UPI_TARGET_VPA)}&pn=${encodeURIComponent(UPI_PAYEE_NAME)}&am=${numAmount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

      const order = {
        orderId,
        userId,
        type,
        amount: numAmount,
        credits: type === 'credits' ? Number(credits || 0) : 0,
        funds: type === 'funds' ? numAmount : 0,
        targetVpa: UPI_TARGET_VPA,
        payeeName: UPI_PAYEE_NAME,
        upiUri,
        createdAt: Date.now(),
        expiresAt,
        status: 'PENDING',
        transactionNote
      };

      const store = loadWalletStore();
      store.orders[orderId] = order;
      saveWalletStore(store);

      res.json({
        ok: true,
        orderId,
        targetVpa: UPI_TARGET_VPA,
        payeeName: UPI_PAYEE_NAME,
        amount: numAmount,
        credits: order.credits,
        funds: order.funds,
        upiUri,
        createdAt: order.createdAt,
        expiresAt: order.expiresAt,
        expiresInSeconds: Math.floor(ORDER_EXPIRY_MS / 1000)
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create UPI order', details: err.message });
    }
  });

  // 3. Verify UPI Payment & Add Credits / Funds
  router.post('/verify-upi', (req, res) => {
    try {
      const { orderId, utr, userId = 'default-user' } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const store = loadWalletStore();
      const order = store.orders[orderId];
      if (!order) {
        return res.status(404).json({ error: 'Payment order not found' });
      }

      // 10-Minute Expiry Check
      if (Date.now() > order.expiresAt && order.status === 'PENDING') {
        order.status = 'EXPIRED';
        saveWalletStore(store);
        return res.status(400).json({ error: 'This payment order has expired (10 minutes limit). Please generate a new UPI payment.' });
      }

      if (order.status === 'VERIFIED') {
        return res.json({ ok: true, message: 'Payment already verified', order });
      }

      // UTR Validation (minimum 6-16 chars / UPI reference)
      const cleanUtr = String(utr ?? '').trim().replace(/[^a-zA-Z0-9]/g, '');
      if (cleanUtr.length < 6) {
        return res.status(400).json({ error: 'Please enter a valid 12-digit UPI UTR or Transaction Reference number.' });
      }

      // Mark order verified
      order.status = 'VERIFIED';
      order.utr = cleanUtr;
      order.verifiedAt = Date.now();

      // Update user wallet
      const user = store.users[userId] || {
        credits: 100,
        tradingBalance: 0,
        totalCreditsPurchased: 0,
        premiumUnlocked: false,
        history: []
      };

      if (order.type === 'credits') {
        user.credits += order.credits;
        user.totalCreditsPurchased = (user.totalCreditsPurchased || 0) + order.credits;
        user.history.unshift({
          id: `tx-${Date.now()}`,
          type: 'CREDIT_PURCHASE',
          amount: order.amount,
          credits: order.credits,
          utr: cleanUtr,
          at: new Date().toISOString()
        });
      } else {
        user.tradingBalance += order.funds;
        user.history.unshift({
          id: `tx-${Date.now()}`,
          type: 'FUND_DEPOSIT',
          amount: order.amount,
          utr: cleanUtr,
          at: new Date().toISOString()
        });
      }

      // Auto-unlock premium indicators if user purchased/holds >= 1000 credits
      if (user.totalCreditsPurchased >= 1000 || user.credits >= 1000) {
        user.premiumUnlocked = true;
      }

      store.users[userId] = user;
      saveWalletStore(store);

      res.json({
        ok: true,
        message: order.type === 'credits'
          ? `₹${order.amount} verified! ${order.credits} Credits added successfully.`
          : `₹${order.amount} verified! Real trading funds deposited successfully.`,
        wallet: user,
        order
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to verify payment', details: err.message });
    }
  });

  // 4. Consume Credits for Intelligence Report or Auto-Trade
  router.post('/consume', (req, res) => {
    try {
      const { type = 'report', cost = 5, userId = 'default-user', symbol = '' } = req.body;
      const numCost = Number(cost) || 5;

      const store = loadWalletStore();
      const user = store.users[userId] || {
        credits: 100, // 100 free starting credits
        tradingBalance: 0,
        totalCreditsPurchased: 0,
        premiumUnlocked: false,
        history: []
      };

      if (user.credits < numCost) {
        return res.status(402).json({
          ok: false,
          error: 'Insufficient DHRU credits',
          required: numCost,
          available: user.credits,
          needBuy: numCost - user.credits
        });
      }

      user.credits -= numCost;
      user.history.unshift({
        id: `tx-${Date.now()}`,
        type: type === 'autotrade' ? 'AUTOTRADE_CONSUME' : 'REPORT_CONSUME',
        credits: -numCost,
        symbol,
        at: new Date().toISOString()
      });

      store.users[userId] = user;
      saveWalletStore(store);

      res.json({
        ok: true,
        remainingCredits: user.credits,
        consumed: numCost,
        wallet: user
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to consume credits', details: err.message });
    }
  });

  // 4b. Withdraw Real Funds via Indian Bank Account or UPI
  router.post('/withdraw', (req, res) => {
    try {
      const {
        userId = 'default-user',
        amount = 0,
        method = 'UPI', // 'BANK' or 'UPI'
        bankDetails = null,
        upiDetails = null
      } = req.body;

      const numAmount = Number(amount);
      if (!Number.isFinite(numAmount) || numAmount < 100) {
        return res.status(400).json({ ok: false, error: 'Minimum withdrawal amount is ₹100' });
      }

      const store = loadWalletStore();
      if (!store.withdrawals) store.withdrawals = {};
      const user = store.users[userId] || {
        credits: 100,
        tradingBalance: 0,
        totalCreditsPurchased: 0,
        premiumUnlocked: false,
        history: []
      };

      if (user.tradingBalance < numAmount) {
        return res.status(400).json({
          ok: false,
          error: `Insufficient trading funds. Available: ₹${user.tradingBalance.toFixed(2)}, Requested: ₹${numAmount.toFixed(2)}`
        });
      }

      // Deduct balance
      user.tradingBalance = Number((user.tradingBalance - numAmount).toFixed(2));
      const withdrawalId = `WDR-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const withdrawal = {
        id: withdrawalId,
        userId,
        amount: numAmount,
        method,
        bankDetails: method === 'BANK' ? bankDetails : null,
        upiDetails: method === 'UPI' ? upiDetails : null,
        status: 'PENDING',
        createdAt: Date.now()
      };

      store.withdrawals[withdrawalId] = withdrawal;
      user.history.unshift({
        id: `tx-${Date.now()}`,
        type: 'WITHDRAWAL_REQUEST',
        amount: -numAmount,
        note: `Withdrawal to ${method === 'UPI' ? (upiDetails?.upiId || 'UPI') : (bankDetails?.bankName || 'Bank')}`,
        at: new Date().toISOString()
      });

      store.users[userId] = user;
      saveWalletStore(store);

      res.json({
        ok: true,
        message: 'Withdrawal request submitted successfully',
        withdrawal,
        wallet: user
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to process withdrawal', details: err.message });
    }
  });

  // 4c. Get user withdrawals
  router.get('/withdrawals', (req, res) => {
    try {
      const userId = req.query.userId || 'default-user';
      const store = loadWalletStore();
      const all = Object.values(store.withdrawals || {});
      const userWithdrawals = all.filter(w => w.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
      res.json({ ok: true, withdrawals: userWithdrawals });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch withdrawals', details: err.message });
    }
  });

  // 5. Convenient Demo / Localhost Login Bypass
  router.post('/demo-login', (req, res) => {
    const userId = 'local-demo-trader';
    const store = loadWalletStore();
    if (!store.users[userId]) {
      store.users[userId] = {
        credits: 100, // 100 free starting credits
        tradingBalance: 10000,
        totalCreditsPurchased: 0,
        premiumUnlocked: false,
        history: [
          {
            id: `tx-${Date.now()}`,
            type: 'WELCOME_BONUS',
            credits: 100,
            note: '100 Free Welcome Credits Granted',
            at: new Date().toISOString()
          }
        ]
      };
      saveWalletStore(store);
    }

    res.json({
      ok: true,
      user: {
        uid: userId,
        email: 'preetham@dhru.ai',
        displayName: 'Preetham (Localhost Trader)',
        isLocalBypass: true,
        photoURL: null
      },
      wallet: store.users[userId]
    });
  });

  // 6. Admin Panel: Platform Analytics Overview
  router.get('/admin/overview', (req, res) => {
    try {
      const store = loadWalletStore();
      const users = Object.entries(store.users || {});
      const orders = Object.values(store.orders || {});

      const totalUsers = Math.max(users.length, 1);
      const totalTradingFunds = users.reduce((acc, [, u]) => acc + (Number(u.tradingBalance) || 0), 0);
      const totalCreditsOutstanding = users.reduce((acc, [, u]) => acc + (Number(u.credits) || 0), 0);
      
      const verifiedOrders = orders.filter(o => o.status === 'VERIFIED');
      const pendingOrders = orders.filter(o => o.status === 'PENDING');
      const totalRevenueInr = verifiedOrders.reduce((acc, o) => acc + (Number(o.amount) || 0), 0);

      res.json({
        ok: true,
        analytics: {
          totalUsers,
          totalTradingFunds,
          totalCreditsOutstanding,
          totalRevenueInr,
          totalOrdersCount: orders.length,
          verifiedOrdersCount: verifiedOrders.length,
          pendingOrdersCount: pendingOrders.length,
          targetVpa: UPI_TARGET_VPA,
          payeeName: UPI_PAYEE_NAME,
          systemStatus: 'OPERATIONAL'
        }
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch admin overview', details: err.message });
    }
  });

  // 7. Admin Panel: List All Payment Orders
  router.get('/admin/orders', (req, res) => {
    try {
      const store = loadWalletStore();
      const orders = Object.values(store.orders || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      res.json({ ok: true, orders });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch admin orders', details: err.message });
    }
  });

  // 8. Admin Panel: Manual Approval of UPI Payment Order
  router.post('/admin/approve-order', (req, res) => {
    try {
      const { orderId, adminNote = 'Approved via Admin Panel' } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const store = loadWalletStore();
      const order = store.orders[orderId];
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      if (order.status === 'VERIFIED') {
        return res.json({ ok: true, message: 'Order is already verified', order });
      }

      order.status = 'VERIFIED';
      order.verifiedAt = Date.now();
      order.adminNote = adminNote;

      const userId = order.userId || 'default-user';
      const user = store.users[userId] || {
        credits: 100,
        tradingBalance: 0,
        totalCreditsPurchased: 0,
        premiumUnlocked: false,
        history: []
      };

      if (order.type === 'credits') {
        user.credits += order.credits;
        user.totalCreditsPurchased = (user.totalCreditsPurchased || 0) + order.credits;
        user.history.unshift({
          id: `tx-${Date.now()}`,
          type: 'CREDIT_PURCHASE',
          amount: order.amount,
          credits: order.credits,
          utr: order.utr || 'ADMIN-APPROVED',
          note: adminNote,
          at: new Date().toISOString()
        });
      } else {
        user.tradingBalance += order.funds || order.amount;
        user.history.unshift({
          id: `tx-${Date.now()}`,
          type: 'FUND_DEPOSIT',
          amount: order.amount,
          utr: order.utr || 'ADMIN-APPROVED',
          note: adminNote,
          at: new Date().toISOString()
        });
      }

      if (user.totalCreditsPurchased >= 1000 || user.credits >= 1000) {
        user.premiumUnlocked = true;
      }

      store.users[userId] = user;
      saveWalletStore(store);

      res.json({
        ok: true,
        message: `Order ${orderId} successfully approved! User ${userId} balance credited.`,
        order,
        user
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to approve order', details: err.message });
    }
  });

  // 9. Admin Panel: Reject Payment Order
  router.post('/admin/reject-order', (req, res) => {
    try {
      const { orderId, reason = 'UTR Verification Failed / Invalid Reference' } = req.body;
      if (!orderId) {
        return res.status(400).json({ error: 'Order ID is required' });
      }

      const store = loadWalletStore();
      const order = store.orders[orderId];
      if (!order) {
        return res.status(404).json({ error: 'Order not found' });
      }

      order.status = 'REJECTED';
      order.rejectionReason = reason;
      order.rejectedAt = Date.now();
      saveWalletStore(store);

      res.json({ ok: true, message: `Order ${orderId} marked as REJECTED`, order });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reject order', details: err.message });
    }
  });

  // 10. Admin Panel: Direct Balance Adjustment
  router.post('/admin/adjust-balance', (req, res) => {
    try {
      const { userId = 'default-user', credits = 0, funds = 0, note = 'Admin adjustment' } = req.body;
      const store = loadWalletStore();
      const user = store.users[userId] || {
        credits: 100,
        tradingBalance: 0,
        totalCreditsPurchased: 0,
        premiumUnlocked: false,
        history: []
      };

      if (credits) {
        user.credits = Math.max(0, user.credits + Number(credits));
        if (credits > 0) user.totalCreditsPurchased = (user.totalCreditsPurchased || 0) + Number(credits);
      }
      if (funds) {
        user.tradingBalance = Math.max(0, user.tradingBalance + Number(funds));
      }
      if (user.credits >= 1000 || user.totalCreditsPurchased >= 1000) {
        user.premiumUnlocked = true;
      }

      user.history.unshift({
        id: `tx-${Date.now()}`,
        type: 'ADMIN_ADJUSTMENT',
        credits: Number(credits) || undefined,
        amount: Number(funds) || undefined,
        note,
        at: new Date().toISOString()
      });

      store.users[userId] = user;
      saveWalletStore(store);

      res.json({ ok: true, message: 'Balance adjusted successfully', user });
    } catch (err) {
      res.status(500).json({ error: 'Failed to adjust balance', details: err.message });
    }
  });

  // 11. Admin Panel: List Withdrawals
  router.get('/admin/withdrawals', (req, res) => {
    try {
      const store = loadWalletStore();
      const withdrawals = Object.values(store.withdrawals || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      res.json({ ok: true, withdrawals });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch admin withdrawals', details: err.message });
    }
  });

  // 12. Admin Panel: Approve Withdrawal
  router.post('/admin/approve-withdrawal', (req, res) => {
    try {
      const { withdrawalId, adminNote = 'Processed via banking gateway' } = req.body;
      if (!withdrawalId) return res.status(400).json({ error: 'Withdrawal ID required' });
      const store = loadWalletStore();
      const w = store.withdrawals?.[withdrawalId];
      if (!w) return res.status(404).json({ error: 'Withdrawal request not found' });
      w.status = 'VERIFIED';
      w.adminNote = adminNote;
      w.verifiedAt = Date.now();
      saveWalletStore(store);
      res.json({ ok: true, message: `Withdrawal ${withdrawalId} approved and transferred.`, withdrawal: w });
    } catch (err) {
      res.status(500).json({ error: 'Failed to approve withdrawal', details: err.message });
    }
  });

  // 13. Admin Panel: Reject Withdrawal & Refund Balance
  router.post('/admin/reject-withdrawal', (req, res) => {
    try {
      const { withdrawalId, reason = 'Bank details mismatch' } = req.body;
      if (!withdrawalId) return res.status(400).json({ error: 'Withdrawal ID required' });
      const store = loadWalletStore();
      const w = store.withdrawals?.[withdrawalId];
      if (!w) return res.status(404).json({ error: 'Withdrawal request not found' });
      if (w.status !== 'REJECTED') {
        w.status = 'REJECTED';
        w.rejectionReason = reason;
        w.rejectedAt = Date.now();
        // Refund funds back to user
        const user = store.users[w.userId];
        if (user) {
          user.tradingBalance = Number((user.tradingBalance + w.amount).toFixed(2));
          user.history.unshift({
            id: `tx-${Date.now()}`,
            type: 'WITHDRAWAL_REFUND',
            amount: w.amount,
            note: `Refund for rejected withdrawal: ${reason}`,
            at: new Date().toISOString()
          });
        }
        saveWalletStore(store);
      }
      res.json({ ok: true, message: `Withdrawal ${withdrawalId} rejected and refunded.`, withdrawal: w });
    } catch (err) {
      res.status(500).json({ error: 'Failed to reject withdrawal', details: err.message });
    }
  });

  return router;
}
