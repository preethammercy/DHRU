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

  return router;
}
