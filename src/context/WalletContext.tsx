import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { dispatchTradeNotification } from '../components/common/TradeNotificationToast';

export interface WalletTransaction {
  id: string;
  type: 'WELCOME_BONUS' | 'CREDIT_PURCHASE' | 'FUND_DEPOSIT' | 'REPORT_CONSUME' | 'AUTOTRADE_CONSUME';
  amount?: number;
  credits?: number;
  symbol?: string;
  utr?: string;
  note?: string;
  at: string;
}

export interface WalletState {
  credits: number;
  tradingBalance: number;
  totalCreditsPurchased: number;
  premiumUnlocked: boolean;
  history: WalletTransaction[];
}

interface WalletContextType {
  wallet: WalletState;
  isUpiModalOpen: boolean;
  upiModalTab: 'credits' | 'funds';
  openDepositModal: (tab?: 'credits' | 'funds') => void;
  closeDepositModal: () => void;
  consumeCredits: (type: 'report' | 'autotrade', cost: number, symbol?: string) => Promise<{ ok: boolean; remaining?: number; error?: string }>;
  refreshWallet: () => Promise<void>;
  updateWalletDirectly: (patch: Partial<WalletState>) => void;
  adjustTradingBalance: (delta: number, note?: string) => void;
}

const WALLET_STORAGE_KEY = 'dhru_user_wallet_v2';

const DEFAULT_WALLET: WalletState = {
  credits: 100, // 100 Free starting credits
  tradingBalance: 0,
  totalCreditsPurchased: 0,
  premiumUnlocked: false,
  history: [
    {
      id: 'tx-welcome-100',
      type: 'WELCOME_BONUS',
      credits: 100,
      note: '100 Free Welcome Credits (Starter Pack)',
      at: new Date().toISOString()
    }
  ]
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [wallet, setWallet] = useState<WalletState>(() => {
    try {
      const saved = localStorage.getItem(WALLET_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          credits: Number.isFinite(parsed.credits) ? parsed.credits : 100,
          tradingBalance: Number.isFinite(parsed.tradingBalance) ? parsed.tradingBalance : 0,
          totalCreditsPurchased: Number(parsed.totalCreditsPurchased || 0),
          premiumUnlocked: Boolean(parsed.premiumUnlocked || parsed.credits >= 1000 || parsed.totalCreditsPurchased >= 1000),
          history: Array.isArray(parsed.history) ? parsed.history : DEFAULT_WALLET.history
        };
      }
    } catch {
      /* fallback */
    }
    return DEFAULT_WALLET;
  });

  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [upiModalTab, setUpiModalTab] = useState<'credits' | 'funds'>('credits');

  // Persist wallet state
  useEffect(() => {
    try {
      localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(wallet));
    } catch {
      /* storage unavailable */
    }
  }, [wallet]);

  // Sync with backend on startup
  const refreshWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/wallet/state?userId=active-trader');
      if (res.ok) {
        const data = await res.json();
        if (data.wallet) {
          setWallet(prev => ({
            ...prev,
            ...data.wallet,
            credits: Math.max(prev.credits, data.wallet.credits ?? 100),
            premiumUnlocked: Boolean(data.wallet.premiumUnlocked || prev.credits >= 1000 || (data.wallet.credits ?? 0) >= 1000)
          }));
        }
      }
    } catch {
      /* offline or local fallback */
    }
  }, []);

  useEffect(() => {
    void refreshWallet();
  }, [refreshWallet]);

  const openDepositModal = useCallback((tab: 'credits' | 'funds' = 'credits') => {
    setUpiModalTab(tab);
    setIsUpiModalOpen(true);
  }, []);

  const closeDepositModal = useCallback(() => {
    setIsUpiModalOpen(false);
  }, []);

  const updateWalletDirectly = useCallback((patch: Partial<WalletState>) => {
    setWallet(prev => {
      const nextCredits = patch.credits !== undefined ? patch.credits : prev.credits;
      const nextPurchased = patch.totalCreditsPurchased !== undefined ? patch.totalCreditsPurchased : prev.totalCreditsPurchased;
      const isPremium = nextCredits >= 1000 || nextPurchased >= 1000 || patch.premiumUnlocked || prev.premiumUnlocked;
      return {
        ...prev,
        ...patch,
        credits: nextCredits,
        premiumUnlocked: isPremium
      };
    });
  }, []);

  const adjustTradingBalance = useCallback((delta: number, note = 'Realized trade P&L') => {
    if (!Number.isFinite(delta) || delta === 0) return;
    setWallet(prev => {
      const nextBal = Math.max(0, Number((prev.tradingBalance + delta).toFixed(2)));
      const newTx: WalletTransaction = {
        id: `tx-trade-${Date.now()}`,
        type: delta >= 0 ? 'FUND_DEPOSIT' : 'AUTOTRADE_CONSUME',
        amount: Math.abs(delta),
        note: `${note}: ${delta >= 0 ? '+' : '-'}₹${Math.abs(delta).toFixed(2)}`,
        at: new Date().toISOString()
      };
      return {
        ...prev,
        tradingBalance: nextBal,
        history: [newTx, ...prev.history].slice(0, 100)
      };
    });
  }, []);

  // Consumes credits for Reports (5 credits) or Auto-Trade (10 credits)
  const consumeCredits = useCallback(async (
    type: 'report' | 'autotrade',
    cost: number,
    symbol = ''
  ): Promise<{ ok: boolean; remaining?: number; error?: string }> => {
    if (wallet.credits < cost) {
      dispatchTradeNotification({
        type: 'REJECTED',
        title: 'Credits Depleted',
        symbol: symbol || 'CREDITS',
        status: 'BLOCKED',
        reason: `Need ${cost} credits (you have ${wallet.credits}). Buy credits via UPI to continue.`
      });
      openDepositModal('credits');
      return { ok: false, error: 'Insufficient credits', remaining: wallet.credits };
    }

    try {
      // Notify backend if available
      void fetch('/api/wallet/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, cost, symbol, userId: 'active-trader' })
      }).catch(() => {});
    } catch {
      /* offline */
    }

    const nextCredits = wallet.credits - cost;
    const newTx: WalletTransaction = {
      id: `tx-${Date.now()}`,
      type: type === 'autotrade' ? 'AUTOTRADE_CONSUME' : 'REPORT_CONSUME',
      credits: -cost,
      symbol,
      at: new Date().toISOString()
    };

    setWallet(prev => ({
      ...prev,
      credits: nextCredits,
      history: [newTx, ...prev.history].slice(0, 100)
    }));

    return { ok: true, remaining: nextCredits };
  }, [wallet.credits, openDepositModal]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        isUpiModalOpen,
        upiModalTab,
        openDepositModal,
        closeDepositModal,
        consumeCredits,
        refreshWallet,
        updateWalletDirectly,
        adjustTradingBalance
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
