// DHRU.AI - Live Trading & Portfolio Execution Engine
// Usability of Groww & Angel One with dynamic tick-by-tick P&L and broker connectivity

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useMarketStream } from './MarketStreamContext';

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
  // Balances
  cashBalance: number;
  marginAvailable: number;
  marginUsed: number;
  realizedPnl: number;

  // Tables
  positions: Position[];
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

const INITIAL_HOLDINGS: Holding[] = [
  {
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd',
    quantity: 50,
    averagePrice: 1140.00,
    currentPrice: 1166.70,
    investedValue: 57000,
    currentValue: 58335,
    totalPnl: 1335,
    totalPnlPercent: 2.34,
    dayPnl: 390,
    dayPnlPercent: 0.67
  },
  {
    symbol: 'TCS.NS',
    name: 'Tata Consultancy Services',
    quantity: 25,
    averagePrice: 2240.50,
    currentPrice: 2269.30,
    investedValue: 56012.50,
    currentValue: 56732.50,
    totalPnl: 720,
    totalPnlPercent: 1.28,
    dayPnl: -145,
    dayPnlPercent: -0.25
  },
  {
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd',
    quantity: 100,
    averagePrice: 705.20,
    currentPrice: 714.00,
    investedValue: 70520,
    currentValue: 71400,
    totalPnl: 880,
    totalPnlPercent: 1.25,
    dayPnl: 420,
    dayPnlPercent: 0.59
  },
  {
    symbol: 'INFY.NS',
    name: 'Infosys Ltd',
    quantity: 60,
    averagePrice: 1045.00,
    currentPrice: 1062.10,
    investedValue: 62700,
    currentValue: 63726,
    totalPnl: 1026,
    totalPnlPercent: 1.64,
    dayPnl: 280,
    dayPnlPercent: 0.44
  }
];

const INITIAL_POSITIONS: Position[] = [
  {
    id: 'pos_1',
    symbol: 'RELIANCE.NS',
    name: 'Reliance Industries Ltd',
    product: 'MIS',
    side: 'BUY',
    quantity: 75,
    averagePrice: 1162.40,
    currentPrice: 1166.70,
    pnl: 322.50,
    pnlPercent: 0.37,
    dayPnl: 322.50,
    entryTime: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  },
  {
    id: 'pos_2',
    symbol: 'HDFCBANK.NS',
    name: 'HDFC Bank Ltd',
    product: 'MIS',
    side: 'BUY',
    quantity: 150,
    averagePrice: 711.50,
    currentPrice: 714.00,
    pnl: 375.00,
    pnlPercent: 0.35,
    dayPnl: 375.00,
    entryTime: new Date(Date.now() - 7200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ticks } = useMarketStream();

  // Cash & margin state
  const [cashBalance, setCashBalance] = useState<number>(() => {
    const saved = localStorage.getItem('dhru_cash_balance');
    return saved ? Number(saved) : 500000; // ₹5,00,000 starting margin
  });

  const [realizedPnl, setRealizedPnl] = useState<number>(() => {
    const saved = localStorage.getItem('dhru_realized_pnl');
    return saved ? Number(saved) : 1850.00;
  });

  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('dhru_positions');
    return saved ? JSON.parse(saved) : INITIAL_POSITIONS;
  });

  const [holdings, setHoldings] = useState<Holding[]>(() => {
    const saved = localStorage.getItem('dhru_holdings');
    return saved ? JSON.parse(saved) : INITIAL_HOLDINGS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('dhru_orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [tradeHistory, setTradeHistory] = useState<Order[]>(() => {
    const saved = localStorage.getItem('dhru_trades');
    return saved ? JSON.parse(saved) : [];
  });

  const [brokerConfig, setBrokerConfig] = useState<BrokerConfig>(() => {
    const saved = localStorage.getItem('dhru_broker_config');
    return saved ? JSON.parse(saved) : {
      broker: 'simulation',
      mode: 'simulation',
      clientId: 'SIM-9824',
      apiKey: '',
      connected: true,
      lastConnectedTime: new Date().toISOString()
    };
  });

  const [riskSettings, setRiskSettings] = useState<RiskSettings>(() => {
    const saved = localStorage.getItem('dhru_risk_settings');
    return saved ? JSON.parse(saved) : {
      maxDailyLoss: 25000,
      maxOrderValue: 200000,
      requireConfirmation: true
    };
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('dhru_cash_balance', String(cashBalance));
    localStorage.setItem('dhru_realized_pnl', String(realizedPnl));
    localStorage.setItem('dhru_positions', JSON.stringify(positions));
    localStorage.setItem('dhru_holdings', JSON.stringify(holdings));
    localStorage.setItem('dhru_orders', JSON.stringify(orders));
    localStorage.setItem('dhru_trades', JSON.stringify(tradeHistory));
    localStorage.setItem('dhru_broker_config', JSON.stringify(brokerConfig));
    localStorage.setItem('dhru_risk_settings', JSON.stringify(riskSettings));
  }, [cashBalance, realizedPnl, positions, holdings, orders, tradeHistory, brokerConfig, riskSettings]);

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
        const existingIdx = prev.findIndex(p => p.symbol === order.symbol && p.product === 'MIS');
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
              const bookedProfit = Number((bookedDiff * closedQty).toFixed(2));
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
            const profit = saleProceeds - costBasis;

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
  }) => {
    const { symbol, name = symbol, side, product, orderType, quantity, price = 0, triggerPrice } = params;

    if (quantity <= 0) {
      return { success: false, message: 'Quantity must be greater than zero.' };
    }

    const currentQuote = ticks[symbol];
    const ltp = currentQuote?.price || price || 1000;
    const estValue = (orderType === 'MARKET' ? ltp : (price || ltp)) * quantity;

    // Risk Check: Max order value
    if (estValue > riskSettings.maxOrderValue) {
      return {
        success: false,
        message: `Order value ₹${estValue.toLocaleString()} exceeds your configured max risk limit of ₹${riskSettings.maxOrderValue.toLocaleString()}`
      };
    }

    // Margin Check for Delivery Buy
    const requiredMargin = product === 'MIS' ? estValue * 0.20 : estValue; // 5x leverage for Intraday MIS
    if (side === 'BUY' && requiredMargin > cashBalance) {
      return {
        success: false,
        message: `Insufficient margin. Required: ₹${requiredMargin.toFixed(2)}, Available: ₹${cashBalance.toFixed(2)}`
      };
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
      executedAt: orderType === 'MARKET' ? new Date().toLocaleTimeString() : undefined
    };

    if (orderType === 'MARKET') {
      handleOrderExecution(newOrder, ltp);
      setOrders(prev => [newOrder, ...prev]);
      setTradeHistory(prev => [newOrder, ...prev]);
      return {
        success: true,
        message: `${side} order for ${quantity} shares of ${symbol} executed at ₹${ltp.toFixed(2)}`
      };
    } else {
      setOrders(prev => [newOrder, ...prev]);
      return {
        success: true,
        message: `${orderType} ${side} order placed for ${quantity} shares at ₹${(price || ltp).toFixed(2)}`
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
    const exitPrice = tick?.price || pos.currentPrice;

    // Opposite order
    const closeOrder: Order = {
      id: `SQ_${Date.now()}`,
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
      executedAt: new Date().toLocaleTimeString()
    };

    const bookedDiff = pos.side === 'BUY' ? (exitPrice - pos.averagePrice) : (pos.averagePrice - exitPrice);
    const bookedProfit = Number((bookedDiff * pos.quantity).toFixed(2));

    setRealizedPnl(r => Number((r + bookedProfit).toFixed(2)));
    setCashBalance(c => Number((c + bookedProfit).toFixed(2)));
    setPositions(prev => prev.filter(p => p.id !== positionId));
    setOrders(o => [closeOrder, ...o]);
    setTradeHistory(th => [closeOrder, ...th]);
  }, [positions, ticks]);

  // Square off all open positions
  const squareOffAll = useCallback(() => {
    for (const pos of positions) {
      squareOffPosition(pos.id);
    }
  }, [positions, squareOffPosition]);

  const updateBrokerConfig = useCallback((newConfig: Partial<BrokerConfig>) => {
    setBrokerConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  const updateRiskSettings = useCallback((newSettings: Partial<RiskSettings>) => {
    setRiskSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const resetSimulationBalance = useCallback(() => {
    setCashBalance(500000);
    setRealizedPnl(0);
    setPositions([]);
    setHoldings(INITIAL_HOLDINGS);
    setOrders([]);
    setTradeHistory([]);
  }, []);

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
    const posDay = positions.reduce((sum, p) => sum + p.dayPnl, 0);
    const holdDay = holdings.reduce((sum, h) => sum + h.dayPnl, 0);
    return Number((posDay + holdDay).toFixed(2));
  }, [positions, holdings]);

  const marginUsed = useMemo(() => {
    return positions.reduce((sum, p) => sum + (p.averagePrice * p.quantity * 0.2), 0);
  }, [positions]);

  const marginAvailable = useMemo(() => {
    return Math.max(0, cashBalance - marginUsed);
  }, [cashBalance, marginUsed]);

  return (
    <TradingContext.Provider
      value={{
        cashBalance,
        marginAvailable,
        marginUsed,
        realizedPnl,
        positions,
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
