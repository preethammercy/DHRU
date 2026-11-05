// DHRU.AI - Live Trading & Portfolio Execution Engine
// Usability of Groww & Angel One with dynamic tick-by-tick P&L and broker connectivity

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useMarketStream } from './MarketStreamContext';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { clearAutoTradePlans, removeAutoTradePlan } from '../services/autoTradePlans';
import { dispatchTradeNotification } from '../components/common/TradeNotificationToast';

export type ProductType = 'MIS' | 'CNC';
export type OrderType = 'MARKET' | 'LIMIT' | 'SL' | 'SL-M';
export type OrderSide = 'BUY' | 'SELL';
export type OrderStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'REJECTED';

export interface Position {
  id: string;
  symbol: string;
  name: string;
  product: ProductType;
  side: OrderSide;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  dayPnl: number;
  entryTime: string;
  legId?: string;
  tier?: 'scalp' | 'swing' | 'runner';
  tierLabel?: string;
  targetPrice?: number;
  stopLoss?: number;
}

export interface ClosedPosition {
  id: string;
  symbol: string;
  name: string;
  product: ProductType;
  side: OrderSide;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  pnlPercent: number;
  entryTime: string;
  closedAt: string;
}

export interface Holding {
  symbol: string;
  name: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  totalPnl: number;
  totalPnlPercent: number;
  dayPnl: number;
  dayPnlPercent: number;
}

export interface Order {
  id: string;
  symbol: string;
  name: string;
  side: OrderSide;
  product: ProductType;
  orderType: OrderType;
  quantity: number;
  filledQuantity: number;
  price: number;
  triggerPrice?: number;
  status: OrderStatus;
  placedAt: string;
  executedAt?: string;
  rejectionReason?: string;
  pnl?: number;
  legId?: string;
  tier?: 'scalp' | 'swing' | 'runner';
  tierLabel?: string;
  targetPrice?: number;
  stopLoss?: number;
}

export interface BrokerConfig {
  broker: 'simulation' | 'zerodha' | 'angelone' | 'dhan';
  mode: 'simulation' | 'live';
  clientId: string;
  apiKey: string;
  connected: boolean;
  lastConnectedTime?: string;
}

export interface RiskSettings {
  maxDailyLoss: number;
  maxOrderValue: number;
  requireConfirmation: boolean;
}

interface TradingContextType {
  // Account Mode: Demo Paper Simulation vs Real Account
  accountType: 'demo' | 'real';
  setAccountType: (type: 'demo' | 'real') => void;

  // Balances
  cashBalance: number;
  marginAvailable: number;
  marginUsed: number;
  realizedPnl: number;

  // Tables
  positions: Position[];
  closedPositions: ClosedPosition[];
  holdings: Holding[];
  orders: Order[];
  tradeHistory: Order[];

  // Aggregates
  totalInvested: number;
  totalCurrentValue: number;
  totalUnrealizedPnl: number;
  totalDayPnl: number;

  // Actions
  placeOrder: (params: {
    symbol: string;
    name?: string;
    side: OrderSide;
    product: ProductType;
    orderType: OrderType;
    quantity: number;
    price?: number;
    triggerPrice?: number;
    legId?: string;
    tier?: 'scalp' | 'swing' | 'runner';
    tierLabel?: string;
    targetPrice?: number;
    stopLoss?: number;
  }) => { success: boolean; message: string };

  cancelOrder: (orderId: string) => void;
  modifyOrder: (orderId: string, newQty: number, newPrice: number) => void;
  squareOffPosition: (positionId: string) => void;
  squareOffAll: () => void;

  // Broker & Risk Config
  brokerConfig: BrokerConfig;
  updateBrokerConfig: (config: Partial<BrokerConfig>) => void;
  riskSettings: RiskSettings;
  updateRiskSettings: (settings: Partial<RiskSettings>) => void;
  resetSimulationBalance: () => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

// Clean 0-trades starting portfolio for all traders
const INITIAL_HOLDINGS: Holding[] = [];
const INITIAL_POSITIONS: Position[] = [];

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ticks } = useMarketStream();
  const { user, marketMode } = useAuth();
  const { wallet, adjustTradingBalance } = useWallet();

  const [accountType, setAccountTypeState] = useState<'demo' | 'real'>(() => {
    if (typeof window === 'undefined') return 'demo';
    return (localStorage.getItem('dhru_active_account_type') as 'demo' | 'real') || 'demo';
  });

  const setAccountType = useCallback((type: 'demo' | 'real') => {
    setAccountTypeState(type);
    try {
      localStorage.setItem('dhru_active_account_type', type);
    } catch {}
  }, []);

  const userKey = useCallback((key: string, overrideType?: 'demo' | 'real') => {
    const acc = overrideType || accountType;
    return user?.uid ? `dhru_user_${user.uid}_${acc}_${marketMode}_${key}` : `dhru_guest_${acc}_${marketMode}_${key}`;
  }, [user?.uid, marketMode, accountType]);

  const legacyUserKey = useCallback((key: string) => user?.uid ? `dhru_user_${user.uid}_${key}` : `dhru_guest_${key}`, [user?.uid]);
  const readPortfolioValue = useCallback((key: string) => {
    const current = localStorage.getItem(userKey(key));
    if (current !== null) return current;
    if (accountType === 'demo' && marketMode === 'indian') {
      return localStorage.getItem(legacyUserKey(key)) || localStorage.getItem(`dhru_${key}`);
    }
    return null;
  }, [userKey, legacyUserKey, accountType, marketMode]);
  const [storageReadyKey, setStorageReadyKey] = useState('');

  // Each desk gets its own currency-native paper balance and portfolio storage.
  const [cashBalance, setCashBalance] = useState<number>(() => {
    if (accountType === 'real') return wallet.tradingBalance;
    const saved = readPortfolioValue('cash_balance');
    return saved ? Number(saved) : marketMode === 'crypto' ? 12000 : 1000000;
  });

  const [realizedPnl, setRealizedPnl] = useState<number>(() => {
    const saved = readPortfolioValue('realized_pnl');
    return saved ? Number(saved) : 0;
  });

  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = readPortfolioValue('positions');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // Clean only legacy mock positions (pos_1, pos_2), preserve all real user positions
      return Array.isArray(parsed) ? parsed.filter((p: Position) => p.id !== 'pos_1' && p.id !== 'pos_2') : [];
    } catch {
      return [];
    }
  });

  const [closedPositions, setClosedPositions] = useState<ClosedPosition[]>(() => {
    const saved = readPortfolioValue('closed_positions');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [holdings, setHoldings] = useState<Holding[]>(() => {
    const saved = readPortfolioValue('holdings');
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      // Clean legacy mock holdings
      return Array.isArray(parsed) ? parsed.filter((h: Holding) => h.averagePrice !== 1140 && h.averagePrice !== 2240.50) : [];
    } catch {
      return [];
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = readPortfolioValue('orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [tradeHistory, setTradeHistory] = useState<Order[]>(() => {
    const saved = readPortfolioValue('trades');
    return saved ? JSON.parse(saved) : [];
  });

  const [brokerConfig, setBrokerConfig] = useState<BrokerConfig>(() => {
    const saved = readPortfolioValue('broker_config');
    return saved ? JSON.parse(saved) : {
      broker: 'simulation',
      mode: 'simulation',
      clientId: user?.displayName ? `TRADER-${user.displayName.replace(/\s+/g, '').toUpperCase()}` : 'SIM-9824',
      apiKey: '',
      connected: true,
      lastConnectedTime: new Date().toISOString()
    };
  });

  const [riskSettings, setRiskSettings] = useState<RiskSettings>(() => {
    const saved = readPortfolioValue('risk_settings');
    return saved ? JSON.parse(saved) : {
      maxDailyLoss: 50000,
      maxOrderValue: 500000,
      requireConfirmation: true
    };
  });

  // Reload the correct portfolio whenever user, account type (demo vs real), or market desk changes.
  useEffect(() => {
    if (accountType === 'real') {
      setCashBalance(wallet.tradingBalance);
    } else {
      const savedBalance = readPortfolioValue('cash_balance');
      setCashBalance(savedBalance ? Number(savedBalance) : marketMode === 'crypto' ? 12000 : 1000000);
    }

    const savedRealized = readPortfolioValue('realized_pnl');
    setRealizedPnl(savedRealized ? Number(savedRealized) : 0);

    const savedPos = readPortfolioValue('positions');
    if (savedPos) {
      try {
        const parsed = JSON.parse(savedPos);
        setPositions(Array.isArray(parsed) ? parsed.filter((p: Position) => p.id !== 'pos_1' && p.id !== 'pos_2') : []);
      } catch {
        setPositions([]);
      }
    } else {
      setPositions([]);
    }

    const savedClosed = readPortfolioValue('closed_positions');
    if (savedClosed) {
      try {
        const parsed = JSON.parse(savedClosed);
        setClosedPositions(Array.isArray(parsed) ? parsed : []);
      } catch {
        setClosedPositions([]);
      }
    } else {
      setClosedPositions([]);
    }

    const savedHoldings = readPortfolioValue('holdings');
    if (savedHoldings) {
      try {
        const parsed = JSON.parse(savedHoldings);
        setHoldings(Array.isArray(parsed) ? parsed.filter((h: Holding) => h.averagePrice !== 1140 && h.averagePrice !== 2240.50) : []);
      } catch {
        setHoldings([]);
      }
    } else {
      setHoldings([]);
    }

    const savedOrders = readPortfolioValue('orders');
    setOrders(savedOrders ? JSON.parse(savedOrders) : []);

    const savedTrades = readPortfolioValue('trades');
    setTradeHistory(savedTrades ? JSON.parse(savedTrades) : []);
    const savedBroker = readPortfolioValue('broker_config');
    setBrokerConfig(savedBroker ? JSON.parse(savedBroker) : {
      broker: 'simulation', mode: 'simulation',
      clientId: user?.displayName ? `TRADER-${user.displayName.replace(/\s+/g, '').toUpperCase()}` : 'SIM-9824',
      apiKey: '', connected: true, lastConnectedTime: new Date().toISOString()
    });
    const savedRisk = readPortfolioValue('risk_settings');
    setRiskSettings(savedRisk ? JSON.parse(savedRisk) : { maxDailyLoss: 50000, maxOrderValue: 500000, requireConfirmation: true });
    setStorageReadyKey(userKey('cash_balance'));
  }, [userKey, readPortfolioValue, marketMode, user?.displayName, accountType, wallet.tradingBalance]);

  // Persist only to the active desk's isolated storage namespace.
  useEffect(() => {
    if (storageReadyKey !== userKey('cash_balance')) return;
    localStorage.setItem(userKey('cash_balance'), String(cashBalance));
    localStorage.setItem(userKey('realized_pnl'), String(realizedPnl));
    localStorage.setItem(userKey('positions'), JSON.stringify(positions));
    localStorage.setItem(userKey('closed_positions'), JSON.stringify(closedPositions));
    localStorage.setItem(userKey('holdings'), JSON.stringify(holdings));
    localStorage.setItem(userKey('orders'), JSON.stringify(orders));
    localStorage.setItem(userKey('trades'), JSON.stringify(tradeHistory));
    localStorage.setItem(userKey('broker_config'), JSON.stringify(brokerConfig));
    localStorage.setItem(userKey('risk_settings'), JSON.stringify(riskSettings));
  }, [storageReadyKey, userKey, cashBalance, realizedPnl, positions, closedPositions, holdings, orders, tradeHistory, brokerConfig, riskSettings]);

  // Recalculate dynamic tick-by-tick P&L when prices stream in
  useEffect(() => {
    setPositions(prevPositions => {
      let changed = false;
      const updated = prevPositions.map(pos => {
        const tick = ticks[pos.symbol];
        if (!tick || tick.price <= 0 || tick.price === pos.currentPrice) {
          return pos;
        }
        changed = true;
        const currentPrice = tick.price;
        const diff = pos.side === 'BUY' ? (currentPrice - pos.averagePrice) : (pos.averagePrice - currentPrice);
        const pnl = Number((diff * pos.quantity).toFixed(2));
        const pnlPercent = Number(((diff / pos.averagePrice) * 100).toFixed(2));
        const dayPnl = Number((tick.change * (pos.side === 'BUY' ? 1 : -1) * pos.quantity).toFixed(2));

        return {
          ...pos,
          currentPrice,
          pnl,
          pnlPercent,
          dayPnl
        };
      });
      return changed ? updated : prevPositions;
    });

    setHoldings(prevHoldings => {
      let changed = false;
      const updated = prevHoldings.map(h => {
        const tick = ticks[h.symbol];
        if (!tick || tick.price <= 0 || tick.price === h.currentPrice) {
          return h;
        }
        changed = true;
        const currentPrice = tick.price;
        const currentValue = Number((currentPrice * h.quantity).toFixed(2));
        const totalPnl = Number((currentValue - h.investedValue).toFixed(2));
        const totalPnlPercent = Number(((totalPnl / h.investedValue) * 100).toFixed(2));
        const dayPnl = Number((tick.change * h.quantity).toFixed(2));
        const dayPnlPercent = tick.previousClose > 0 ? Number(((tick.change / tick.previousClose) * 100).toFixed(2)) : 0;

        return {
          ...h,
          currentPrice,
          currentValue,
          totalPnl,
          totalPnlPercent,
          dayPnl,
          dayPnlPercent
        };
      });
      return changed ? updated : prevHoldings;
    });

    // Check limit and SL orders against stream ticks
    setOrders(prevOrders => {
      let changed = false;
      const updated: Order[] = [];

      for (const order of prevOrders) {
        if (order.status !== 'PENDING') {
          updated.push(order);
          continue;
        }

        const tick = ticks[order.symbol];
        if (!tick || tick.price <= 0) {
          updated.push(order);
          continue;
        }

        let triggerExecution = false;

        if (order.orderType === 'LIMIT') {
          if (order.side === 'BUY' && tick.price <= order.price) triggerExecution = true;
          if (order.side === 'SELL' && tick.price >= order.price) triggerExecution = true;
        } else if (order.orderType === 'SL') {
          if (order.triggerPrice) {
            if (order.side === 'BUY' && tick.price >= order.triggerPrice) triggerExecution = true;
            if (order.side === 'SELL' && tick.price <= order.triggerPrice) triggerExecution = true;
          }
        }

        if (triggerExecution) {
          changed = true;
          const execPrice = order.price || tick.price;
          const executedOrder: Order = {
            ...order,
            status: 'EXECUTED',
            filledQuantity: order.quantity,
            executedAt: new Date().toLocaleTimeString()
          };

          // Apply to positions/holdings
          handleOrderExecution(executedOrder, execPrice);
          setTradeHistory(th => [executedOrder, ...th]);
        } else {
          updated.push(order);
        }
      }

      return changed ? updated : prevOrders;
    });
  }, [ticks]);

  // Execute an order and update positions/cash
  const handleOrderExecution = (order: Order, execPrice: number) => {
    const orderCost = execPrice * order.quantity;

    if (order.product === 'MIS') {
      // Intraday Position
      setPositions(prev => {
        // Multi-Position Auto-Trade: If order carries a legId, maintain as independent position
        if (order.legId) {
          const matchIdx = prev.findIndex(p => p.legId === order.legId);
          if (matchIdx >= 0) {
            const existing = prev[matchIdx];
            if (existing.side !== order.side) {
              // Opposite side: Square off this individual trade leg!
              const closedQty = order.quantity;
              const bookedDiff = existing.side === 'BUY' ? (execPrice - existing.averagePrice) : (existing.averagePrice - execPrice);
              let bookedProfit = Number((bookedDiff * closedQty).toFixed(2));
              if (bookedProfit === 0 && existing.pnl !== 0 && existing.pnl !== undefined) {
                bookedProfit = existing.pnl;
              }
              const closedPos: ClosedPosition = {
                id: `closed_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                symbol: existing.symbol,
                name: existing.name,
                product: existing.product,
                side: existing.side,
                quantity: closedQty,
                entryPrice: existing.averagePrice,
                exitPrice: execPrice,
                pnl: bookedProfit,
                pnlPercent: existing.averagePrice > 0 ? Number(((bookedProfit / (existing.averagePrice * closedQty)) * 100).toFixed(2)) : 0,
                entryTime: existing.entryTime,
                closedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              };
              setClosedPositions(cp => [closedPos, ...cp]);
              setRealizedPnl(r => Number((r + bookedProfit).toFixed(2)));
              setCashBalance(c => Number((c + bookedProfit).toFixed(2)));

              // Remove this specific position
              return prev.filter((_, idx) => idx !== matchIdx);
            }
          } else {
            // New independent auto-trade position!
            const newPos: Position = {
              id: `pos_${order.legId}`,
              symbol: order.symbol,
              name: order.name,
              product: order.product,
              side: order.side,
              quantity: order.quantity,
              averagePrice: execPrice,
              currentPrice: execPrice,
              pnl: 0,
              pnlPercent: 0,
              dayPnl: 0,
              entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              legId: order.legId,
              tier: order.tier,
              tierLabel: order.tierLabel,
              targetPrice: order.targetPrice,
              stopLoss: order.stopLoss
            };
            return [newPos, ...prev];
          }
        }

        const existingIdx = prev.findIndex(p => p.symbol === order.symbol && p.product === 'MIS' && !p.legId);
        if (existingIdx >= 0) {
          const existing = prev[existingIdx];
          if (existing.side === order.side) {
            // Add to existing position
            const newQty = existing.quantity + order.quantity;
            const newAvgPrice = Number(((existing.averagePrice * existing.quantity + execPrice * order.quantity) / newQty).toFixed(2));
            const diff = existing.side === 'BUY' ? (execPrice - newAvgPrice) : (newAvgPrice - execPrice);
            const copy = [...prev];
            copy[existingIdx] = {
              ...existing,
              quantity: newQty,
              averagePrice: newAvgPrice,
              currentPrice: execPrice,
              pnl: Number((diff * newQty).toFixed(2)),
              pnlPercent: Number(((diff / newAvgPrice) * 100).toFixed(2))
            };
            return copy;
          } else {
            // Opposite side: Square off partially or fully
            if (order.quantity >= existing.quantity) {
              // Position fully closed
              const closedQty = existing.quantity;
              const bookedDiff = existing.side === 'BUY' ? (execPrice - existing.averagePrice) : (existing.averagePrice - execPrice);
              let bookedProfit = Number((bookedDiff * closedQty).toFixed(2));
              if (bookedProfit === 0 && existing.pnl !== 0 && existing.pnl !== undefined) {
                bookedProfit = existing.pnl;
              }
              const closedPos: ClosedPosition = {
                id: `closed_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                symbol: existing.symbol,
                name: existing.name,
                product: existing.product,
                side: existing.side,
                quantity: closedQty,
                entryPrice: existing.averagePrice,
                exitPrice: execPrice,
                pnl: bookedProfit,
                pnlPercent: existing.averagePrice > 0 ? Number(((bookedProfit / (existing.averagePrice * closedQty)) * 100).toFixed(2)) : 0,
                entryTime: existing.entryTime,
                closedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              };
              setClosedPositions(cp => [closedPos, ...cp]);
              setRealizedPnl(r => Number((r + bookedProfit).toFixed(2)));
              setCashBalance(c => Number((c + bookedProfit).toFixed(2)));

              // Remove position
              return prev.filter((_, idx) => idx !== existingIdx);
            } else {
              // Partial square off
              const closedQty = order.quantity;
              const remainingQty = existing.quantity - order.quantity;
              const bookedDiff = existing.side === 'BUY' ? (execPrice - existing.averagePrice) : (existing.averagePrice - execPrice);
              const bookedProfit = Number((bookedDiff * closedQty).toFixed(2));
              order.pnl = bookedProfit;

              const closedPos: ClosedPosition = {
                id: `closed_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                symbol: existing.symbol,
                name: existing.name,
                product: existing.product,
                side: existing.side,
                quantity: closedQty,
                entryPrice: existing.averagePrice,
                exitPrice: execPrice,
                pnl: bookedProfit,
                pnlPercent: existing.averagePrice > 0 ? Number(((bookedProfit / (existing.averagePrice * closedQty)) * 100).toFixed(2)) : 0,
                entryTime: existing.entryTime,
                closedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
              };
              setClosedPositions(cp => [closedPos, ...cp]);
              setRealizedPnl(r => Number((r + bookedProfit).toFixed(2)));
              setCashBalance(c => Number((c + bookedProfit).toFixed(2)));

              const copy = [...prev];
              copy[existingIdx] = {
                ...existing,
                quantity: remainingQty
              };
              return copy;
            }
          }
        } else {
          // New intraday position
          const newPos: Position = {
            id: `pos_${Date.now()}`,
            symbol: order.symbol,
            name: order.name,
            product: 'MIS',
            side: order.side,
            quantity: order.quantity,
            averagePrice: execPrice,
            currentPrice: execPrice,
            pnl: 0,
            pnlPercent: 0,
            dayPnl: 0,
            entryTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          return [...prev, newPos];
        }
      });
    } else {
      // Longterm CNC Delivery
      if (order.side === 'BUY') {
        setCashBalance(c => Math.max(0, Number((c - orderCost).toFixed(2))));
        setHoldings(prev => {
          const idx = prev.findIndex(h => h.symbol === order.symbol);
          if (idx >= 0) {
            const h = prev[idx];
            const newQty = h.quantity + order.quantity;
            const newInvested = Number((h.investedValue + orderCost).toFixed(2));
            const newAvgPrice = Number((newInvested / newQty).toFixed(2));
            const copy = [...prev];
            copy[idx] = {
              ...h,
              quantity: newQty,
              averagePrice: newAvgPrice,
              investedValue: newInvested,
              currentPrice: execPrice,
              currentValue: Number((execPrice * newQty).toFixed(2)),
              totalPnl: Number((execPrice * newQty - newInvested).toFixed(2)),
              totalPnlPercent: Number((((execPrice * newQty - newInvested) / newInvested) * 100).toFixed(2))
            };
            return copy;
          } else {
            const newHolding: Holding = {
              symbol: order.symbol,
              name: order.name,
              quantity: order.quantity,
              averagePrice: execPrice,
              currentPrice: execPrice,
              investedValue: orderCost,
              currentValue: orderCost,
              totalPnl: 0,
              totalPnlPercent: 0,
              dayPnl: 0,
              dayPnlPercent: 0
            };
            return [...prev, newHolding];
          }
        });
      } else {
        // CNC Sell
        setHoldings(prev => {
          const idx = prev.findIndex(h => h.symbol === order.symbol);
          if (idx >= 0) {
            const h = prev[idx];
            const sellQty = Math.min(order.quantity, h.quantity);
            const remainingQty = h.quantity - sellQty;
            const saleProceeds = sellQty * execPrice;
            const costBasis = sellQty * h.averagePrice;
            const profit = Number((saleProceeds - costBasis).toFixed(2));
            order.pnl = profit;

            setRealizedPnl(r => Number((r + profit).toFixed(2)));
            setCashBalance(c => Number((c + saleProceeds).toFixed(2)));

            if (remainingQty <= 0) {
              return prev.filter((_, i) => i !== idx);
            } else {
              const copy = [...prev];
              const newInvested = Number((remainingQty * h.averagePrice).toFixed(2));
              copy[idx] = {
                ...h,
                quantity: remainingQty,
                investedValue: newInvested,
                currentValue: Number((execPrice * remainingQty).toFixed(2)),
                totalPnl: Number((execPrice * remainingQty - newInvested).toFixed(2))
              };
              return copy;
            }
          }
          return prev;
        });
      }
    }
  };

  // Place order implementation
  const placeOrder = useCallback((params: {
    symbol: string;
    name?: string;
    side: OrderSide;
    product: ProductType;
    orderType: OrderType;
    quantity: number;
    price?: number;
    triggerPrice?: number;
    legId?: string;
    tier?: 'scalp' | 'swing' | 'runner';
    tierLabel?: string;
    targetPrice?: number;
    stopLoss?: number;
  }) => {
    const {
      symbol,
      name = symbol,
      side,
      product,
      orderType,
      quantity,
      price = 0,
      triggerPrice,
      legId,
      tier,
      tierLabel,
      targetPrice,
      stopLoss
    } = params;

    if (quantity <= 0) {
      return { success: false, message: 'Quantity must be greater than zero.' };
    }

    const currentQuote = ticks[symbol];
    const ltp = currentQuote?.price || price || 1000;
    const estValue = (orderType === 'MARKET' ? ltp : (price || ltp)) * quantity;

    // Risk Check: Max order value (currency aware)
    const US_STOCKS = ['AAPL', 'NFLX', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META'];
    const isUsd = symbol.includes('-USD') || (symbol.includes('=X') && !symbol.includes('INR')) || symbol.includes('=F') || US_STOCKS.includes(symbol);
    const currSym = isUsd ? '$' : '₹';
    const effectiveMaxOrderValue = isUsd ? Math.max(100000, riskSettings.maxOrderValue / 10) : Math.max(1000000, riskSettings.maxOrderValue);
    if (!legId && estValue > effectiveMaxOrderValue) {
      return {
        success: false,
        message: `Order value ${currSym}${estValue.toLocaleString()} exceeds your configured max risk limit of ${currSym}${Math.round(effectiveMaxOrderValue).toLocaleString()}`
      };
    }

    // Margin Check
    const requiredMargin = product === 'MIS' ? estValue * 0.20 : estValue; // 5x leverage for Intraday MIS
    if (accountType === 'real') {
      if (side === 'BUY' && requiredMargin > wallet.tradingBalance && !legId) {
        const msg = `Insufficient Real Trading Funds. Required: ${currSym}${requiredMargin.toFixed(2)}, Available: ${currSym}${wallet.tradingBalance.toFixed(2)}. Please add funds via UPI to execute real trades.`;
        dispatchTradeNotification({
          type: 'REJECTED',
          title: 'Insufficient Real Funds',
          accountType: 'REAL',
          side,
          symbol,
          name,
          quantity,
          price: ltp,
          product,
          status: 'BLOCKED',
          reason: msg
        });
        return { success: false, message: msg };
      }
    } else {
      const availablePool = Math.max(cashBalance, marginAvailable);
      if (side === 'BUY' && requiredMargin > availablePool && !legId) {
        return {
          success: false,
          message: `Insufficient margin. Required: ${currSym}${requiredMargin.toFixed(2)}, Available: ${currSym}${availablePool.toFixed(2)}`
        };
      }
    }

    const orderId = `ORD_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const newOrder: Order = {
      id: orderId,
      symbol,
      name,
      side,
      product,
      orderType,
      quantity,
      filledQuantity: orderType === 'MARKET' ? quantity : 0,
      price: orderType === 'MARKET' ? ltp : (price || ltp),
      triggerPrice,
      status: orderType === 'MARKET' ? 'EXECUTED' : 'PENDING',
      placedAt: new Date().toLocaleTimeString(),
      executedAt: orderType === 'MARKET' ? new Date().toLocaleTimeString() : undefined,
      legId,
      tier,
      tierLabel,
      targetPrice,
      stopLoss
    };

    if (orderType === 'MARKET') {
      handleOrderExecution(newOrder, ltp);
      setOrders(prev => [newOrder, ...prev]);
      setTradeHistory(prev => [newOrder, ...prev]);

      dispatchTradeNotification({
        id: orderId,
        type: 'OPEN',
        title: legId ? (tierLabel ? `Auto-Trade (${tierLabel}) Executed` : 'Auto-Trade Leg Executed') : 'Trade Executed Successfully',
        accountType: (accountType.toUpperCase() as 'DEMO' | 'REAL'),
        side,
        symbol,
        name,
        quantity,
        price: ltp,
        product,
        status: 'EXECUTED',
        stopLoss,
        targetPrice
      });

      return {
        success: true,
        message: `${side} order for ${quantity} units of ${symbol} executed at ${currSym}${ltp.toFixed(2)}`
      };
    } else {
      setOrders(prev => [newOrder, ...prev]);

      dispatchTradeNotification({
        id: orderId,
        type: 'OPEN',
        title: `${orderType} Order Placed`,
        accountType: (accountType.toUpperCase() as 'DEMO' | 'REAL'),
        side,
        symbol,
        name,
        quantity,
        price: price || ltp,
        product,
        status: 'PENDING',
        stopLoss,
        targetPrice
      });

      return {
        success: true,
        message: `${orderType} ${side} order placed for ${quantity} units at ${currSym}${(price || ltp).toFixed(2)}`
      };
    }
  }, [ticks, cashBalance, riskSettings]);

  // Cancel order
  const cancelOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'CANCELLED' } : o));
  }, []);

  // Modify pending order
  const modifyOrder = useCallback((orderId: string, newQty: number, newPrice: number) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId && o.status === 'PENDING') {
        return {
          ...o,
          quantity: newQty,
          price: newPrice
        };
      }
      return o;
    }));
  }, []);

  // Square off single position
  const squareOffPosition = useCallback((positionId: string) => {
    const pos = positions.find(p => p.id === positionId);
    if (!pos) return;

    const tick = ticks[pos.symbol];
    const exitPrice = tick?.price || pos.currentPrice || pos.averagePrice;

    const bookedDiff = pos.side === 'BUY' ? (exitPrice - pos.averagePrice) : (pos.averagePrice - exitPrice);
    let bookedProfit = Number((bookedDiff * pos.quantity).toFixed(2));
    if (bookedProfit === 0 && pos.pnl !== 0 && pos.pnl !== undefined) {
      bookedProfit = pos.pnl;
    }

    // Opposite order
    const closeOrder: Order = {
      id: `SQ_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      symbol: pos.symbol,
      name: pos.name,
      side: pos.side === 'BUY' ? 'SELL' : 'BUY',
      product: pos.product,
      orderType: 'MARKET',
      quantity: pos.quantity,
      filledQuantity: pos.quantity,
      price: exitPrice,
      status: 'EXECUTED',
      placedAt: new Date().toLocaleTimeString(),
      executedAt: new Date().toLocaleTimeString(),
      pnl: bookedProfit
    };

    const closedPos: ClosedPosition = {
      id: `closed_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      symbol: pos.symbol,
      name: pos.name,
      product: pos.product,
      side: pos.side,
      quantity: pos.quantity,
      entryPrice: pos.averagePrice,
      exitPrice,
      pnl: bookedProfit,
      pnlPercent: pos.averagePrice > 0 ? Number(((bookedProfit / (pos.averagePrice * pos.quantity)) * 100).toFixed(2)) : 0,
      entryTime: pos.entryTime,
      closedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    if (accountType === 'real') {
      adjustTradingBalance(bookedProfit, `${pos.symbol} (${pos.side} ${pos.product})`);
      setRealizedPnl(r => Number((r + bookedProfit).toFixed(2)));
    } else {
      setRealizedPnl(r => Number((r + bookedProfit).toFixed(2)));
      setCashBalance(c => Number((c + bookedProfit).toFixed(2)));
    }
    setPositions(prev => prev.filter(p => p.id !== positionId));
    setClosedPositions(cp => [closedPos, ...cp]);
    setOrders(o => [closeOrder, ...o]);
    setTradeHistory(th => [closeOrder, ...th]);

    dispatchTradeNotification({
      id: closeOrder.id,
      type: bookedProfit >= 0 ? 'PROFIT' : 'LOSS',
      title: bookedProfit >= 0 ? 'Target Reached / Position Closed' : 'Stop Loss / Position Closed',
      accountType: (accountType.toUpperCase() as 'DEMO' | 'REAL'),
      side: closeOrder.side,
      symbol: pos.symbol,
      name: pos.name,
      quantity: pos.quantity,
      price: exitPrice,
      product: pos.product,
      status: 'CLOSED',
      pnl: bookedProfit
    });

    // Only remove the entire auto plan if no open positions remain for this symbol
    const remainingForSym = positions.filter(p => p.id !== positionId && p.symbol === pos.symbol);
    if (remainingForSym.length === 0) {
      removeAutoTradePlan(pos.symbol);
    }
  }, [positions, ticks]);

  // Square off all open positions
  const squareOffAll = useCallback(() => {
    if (positions.length === 0) {
      clearAutoTradePlans('All auto-trade plans cancelled.');
      return;
    }
    let totalBooked = 0;
    const closeOrders: Order[] = [];
    const closedList: ClosedPosition[] = [];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    for (const pos of positions) {
      const tick = ticks[pos.symbol];
      const exitPrice = tick?.price || pos.currentPrice || pos.averagePrice;
      const bookedDiff = pos.side === 'BUY' ? (exitPrice - pos.averagePrice) : (pos.averagePrice - exitPrice);
      let bookedProfit = Number((bookedDiff * pos.quantity).toFixed(2));
      if (bookedProfit === 0 && pos.pnl !== 0 && pos.pnl !== undefined) {
        bookedProfit = pos.pnl;
      }
      totalBooked += bookedProfit;

      closeOrders.push({
        id: `SQ_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        symbol: pos.symbol,
        name: pos.name,
        side: pos.side === 'BUY' ? 'SELL' : 'BUY',
        product: pos.product,
        orderType: 'MARKET',
        quantity: pos.quantity,
        filledQuantity: pos.quantity,
        price: exitPrice,
        status: 'EXECUTED',
        placedAt: nowTime,
        executedAt: nowTime,
        pnl: bookedProfit
      });

      closedList.push({
        id: `closed_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        symbol: pos.symbol,
        name: pos.name,
        product: pos.product,
        side: pos.side,
        quantity: pos.quantity,
        entryPrice: pos.averagePrice,
        exitPrice,
        pnl: bookedProfit,
        pnlPercent: pos.averagePrice > 0 ? Number(((bookedProfit / (pos.averagePrice * pos.quantity)) * 100).toFixed(2)) : 0,
        entryTime: pos.entryTime,
        closedAt: nowTime
      });
    }

    if (accountType === 'real') {
      adjustTradingBalance(totalBooked, 'Square Off All');
      setRealizedPnl(r => Number((r + totalBooked).toFixed(2)));
    } else {
      setRealizedPnl(r => Number((r + totalBooked).toFixed(2)));
      setCashBalance(c => Number((c + totalBooked).toFixed(2)));
    }
    setPositions([]);
    setClosedPositions(cp => [...closedList, ...cp]);
    setOrders(o => [...closeOrders, ...o]);
    setTradeHistory(th => [...closeOrders, ...th]);
    clearAutoTradePlans('All positions and auto-trade plans closed.');
  }, [positions, ticks, accountType, adjustTradingBalance]);

  const updateBrokerConfig = useCallback((newConfig: Partial<BrokerConfig>) => {
    setBrokerConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const updateRiskSettings = useCallback((newSettings: Partial<RiskSettings>) => {
    setRiskSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetSimulationBalance = useCallback(() => {
    if (accountType === 'real') return;
    clearAutoTradePlans('Simulation reset; all auto-trade plans were cleared.');
    setCashBalance(marketMode === 'crypto' ? 12000 : 1000000);
    setRealizedPnl(0);
    setPositions([]);
    setClosedPositions([]);
    setHoldings(INITIAL_HOLDINGS);
    setOrders([]);
    setTradeHistory([]);
  }, [marketMode, accountType]);

  // Compute portfolio aggregates
  const totalInvested = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.investedValue, 0);
  }, [holdings]);

  const totalCurrentValue = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.currentValue, 0);
  }, [holdings]);

  const totalUnrealizedPnl = useMemo(() => {
    const posPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
    const holdPnl = holdings.reduce((sum, h) => sum + h.totalPnl, 0);
    return Number((posPnl + holdPnl).toFixed(2));
  }, [positions, holdings]);

  const totalDayPnl = useMemo(() => {
    const posOpenPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
    const holdDayPnl = holdings.reduce((sum, h) => sum + h.dayPnl, 0);
    return Number((posOpenPnl + holdDayPnl + realizedPnl).toFixed(2));
  }, [positions, holdings, realizedPnl]);

  const marginUsed = useMemo(() => {
    return positions.reduce((sum, p) => sum + (p.averagePrice * p.quantity * 0.2), 0);
  }, [positions]);

  const marginAvailable = useMemo(() => {
    return Math.max(0, cashBalance - marginUsed);
  }, [cashBalance, marginUsed]);

  return (
    <TradingContext.Provider
      value={{
        accountType,
        setAccountType,
        cashBalance: accountType === 'real' ? wallet.tradingBalance : cashBalance,
        marginAvailable,
        marginUsed,
        realizedPnl,
        positions,
        closedPositions,
        holdings,
        orders,
        tradeHistory,
        totalInvested,
        totalCurrentValue,
        totalUnrealizedPnl,
        totalDayPnl,
        placeOrder,
        cancelOrder,
        modifyOrder,
        squareOffPosition,
        squareOffAll,
        brokerConfig,
        updateBrokerConfig,
        riskSettings,
        updateRiskSettings,
        resetSimulationBalance
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
