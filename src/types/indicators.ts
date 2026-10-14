// DHRU.AI - Technical Indicator Configuration Types
// Includes Standard & Premium Institutional Quant Indicators (SMC, Order Blocks, FVG, LuxAlgo style)

export interface IndicatorConfig {
  id: string;
  name: string;
  shortName: string;
  category: 'overlay' | 'oscillator';
  tier?: 'standard' | 'premium';
  badge?: string;
  description?: string;
  enabled: boolean;
  color: string;
  secondaryColor?: string;
  lineWidth?: number;
  params: Record<string, number | string | boolean>;
}

export const DEFAULT_INDICATORS: IndicatorConfig[] = [
  // --- ⭐ PREMIUM QUANT & INSTITUTIONAL INDICATORS ---
  {
    id: 'smc_order_blocks',
    name: 'Smart Money Concepts: Order Blocks',
    shortName: 'SMC Order Blocks',
    category: 'overlay',
    tier: 'premium',
    badge: 'Institutional',
    description: 'Detects high-probability institutional buy/sell order blocks before displacement moves',
    enabled: true,
    color: '#10B981',
    secondaryColor: '#EF4444',
    lineWidth: 2,
    params: { threshold: 1.5, lookback: 20 }
  },
  {
    id: 'smc_fvg',
    name: 'Fair Value Gaps (FVG / Imbalance)',
    shortName: 'FVG Imbalance',
    category: 'overlay',
    tier: 'premium',
    badge: 'Smart Money',
    description: 'Highlights 3-candle liquidity imbalances that act as magnetic support and resistance zones',
    enabled: true,
    color: '#06B6D4',
    secondaryColor: '#F59E0B',
    lineWidth: 1.5,
    params: { minGapPercent: 0.1 }
  },
  {
    id: 'smc_bos',
    name: 'Market Structure: BOS & CHoCH',
    shortName: 'BOS / CHoCH',
    category: 'overlay',
    tier: 'premium',
    badge: 'Market Structure',
    description: 'Automated Break of Structure (BOS) and Change of Character (CHoCH) swing tracker',
    enabled: false,
    color: '#3B82F6',
    secondaryColor: '#EC4899',
    lineWidth: 1.5,
    params: { swingLength: 5 }
  },
  {
    id: 'ichimoku',
    name: 'Ichimoku Kinko Hyo (Cloud)',
    shortName: 'Ichimoku Cloud',
    category: 'overlay',
    tier: 'premium',
    badge: 'Quant System',
    description: 'Comprehensive trend, momentum, and support/resistance cloud system (9, 26, 52)',
    enabled: false,
    color: '#10B981',
    secondaryColor: '#EF4444',
    lineWidth: 1.5,
    params: { tenkan: 9, kijun: 26, senkouB: 52 }
  },
  {
    id: 'atr_trailing_stop',
    name: 'ATR Volatility Trailing Stop',
    shortName: 'ATR Trail Stop',
    category: 'overlay',
    tier: 'premium',
    badge: 'Risk Control',
    description: 'Institutional dynamic trailing stop-loss line that ratchets with market volatility',
    enabled: false,
    color: '#F97316',
    lineWidth: 2,
    params: { period: 14, multiplier: 2.5 }
  },
  {
    id: 'zigzag',
    name: 'ZigZag Structural Waves',
    shortName: 'ZigZag (5%)',
    category: 'overlay',
    tier: 'premium',
    badge: 'Wave Theory',
    description: 'Filters market noise to highlight true macro swing highs and swing lows',
    enabled: false,
    color: '#EAB308',
    lineWidth: 2,
    params: { deviationPercent: 3 }
  },
  {
    id: 'cmf',
    name: 'Chaikin Money Flow (CMF 20)',
    shortName: 'CMF 20',
    category: 'oscillator',
    tier: 'premium',
    badge: 'Order Flow',
    description: 'Measures institutional buying and selling accumulation/distribution volume',
    enabled: false,
    color: '#10B981',
    secondaryColor: '#EF4444',
    params: { period: 20 }
  },
  {
    id: 'vortex',
    name: 'Vortex Indicator (VI+ / VI-)',
    shortName: 'Vortex 14',
    category: 'oscillator',
    tier: 'premium',
    badge: 'Trend Flow',
    description: 'Identifies the start of new bull and bear trends by tracking directional vortex flows',
    enabled: false,
    color: '#0284C7',
    secondaryColor: '#DC2626',
    params: { period: 14 }
  },
  {
    id: 'aroon',
    name: 'Aroon Oscillator (25)',
    shortName: 'Aroon 25',
    category: 'oscillator',
    tier: 'premium',
    badge: 'Trend Strength',
    description: 'Measures whether price is recording new 25-period highs or lows to anticipate reversals',
    enabled: false,
    color: '#8B5CF6',
    params: { period: 25 }
  },
  {
    id: 'tsi',
    name: 'True Strength Index (TSI 13, 25)',
    shortName: 'TSI (13, 25)',
    category: 'oscillator',
    tier: 'premium',
    badge: 'Momentum',
    description: 'Double-smoothed momentum oscillator that strips out false divergences',
    enabled: false,
    color: '#06B6D4',
    params: { longPeriod: 25, shortPeriod: 13 }
  },

  // --- 📈 STANDARD OVERLAY INDICATORS ---
  { id: 'sma20', name: 'Simple Moving Average (20)', shortName: 'SMA 20', category: 'overlay', tier: 'standard', enabled: true, color: '#F59E0B', lineWidth: 1.5, params: { period: 20 } },
  { id: 'sma50', name: 'Simple Moving Average (50)', shortName: 'SMA 50', category: 'overlay', tier: 'standard', enabled: false, color: '#3B82F6', lineWidth: 1.5, params: { period: 50 } },
  { id: 'sma200', name: 'Simple Moving Average (200)', shortName: 'SMA 200', category: 'overlay', tier: 'standard', enabled: true, color: '#8B5CF6', lineWidth: 2, params: { period: 200 } },
  { id: 'ema9', name: 'Exponential Moving Average (9)', shortName: 'EMA 9', category: 'overlay', tier: 'standard', enabled: false, color: '#06B6D4', lineWidth: 1.5, params: { period: 9 } },
  { id: 'ema21', name: 'Exponential Moving Average (21)', shortName: 'EMA 21', category: 'overlay', tier: 'standard', enabled: false, color: '#10B981', lineWidth: 1.5, params: { period: 21 } },
  { id: 'wma20', name: 'Weighted Moving Average (20)', shortName: 'WMA 20', category: 'overlay', tier: 'standard', enabled: false, color: '#EC4899', lineWidth: 1.5, params: { period: 20 } },
  { id: 'vwma20', name: 'Volume Weighted MA (20)', shortName: 'VWMA 20', category: 'overlay', tier: 'standard', enabled: false, color: '#14B8A6', lineWidth: 1.5, params: { period: 20 } },
  { id: 'hma14', name: 'Hull Moving Average (14)', shortName: 'HMA 14', category: 'overlay', tier: 'standard', enabled: false, color: '#6366F1', lineWidth: 2, params: { period: 14 } },
  { id: 'supertrend', name: 'Supertrend (10, 3)', shortName: 'Supertrend', category: 'overlay', tier: 'standard', enabled: false, color: '#10B981', secondaryColor: '#EF4444', lineWidth: 2, params: { period: 10, multiplier: 3 } },
  { id: 'bollinger', name: 'Bollinger Bands (20, 2)', shortName: 'BB (20, 2)', category: 'overlay', tier: 'standard', enabled: false, color: '#2563EB', lineWidth: 1, params: { period: 20, multiplier: 2 } },
  { id: 'keltner', name: 'Keltner Channels (20, 2)', shortName: 'KC (20, 2)', category: 'overlay', tier: 'standard', enabled: false, color: '#D97706', lineWidth: 1, params: { period: 20, multiplier: 2 } },
  { id: 'donchian', name: 'Donchian Channels (20)', shortName: 'DC (20)', category: 'overlay', tier: 'standard', enabled: false, color: '#0284C7', lineWidth: 1, params: { period: 20 } },
  { id: 'vwap', name: 'Volume Weighted Average Price', shortName: 'VWAP', category: 'overlay', tier: 'standard', enabled: false, color: '#E11D48', lineWidth: 2, params: {} },
  { id: 'sar', name: 'Parabolic SAR', shortName: 'SAR (0.02, 0.2)', category: 'overlay', tier: 'standard', enabled: false, color: '#A855F7', lineWidth: 1, params: { step: 0.02, maxStep: 0.2 } },
  { id: 'pivots', name: 'Pivot Points (Floor & Fib)', shortName: 'Pivots', category: 'overlay', tier: 'standard', enabled: true, color: '#64748B', params: { type: 'standard' } },

  // --- 📊 STANDARD OSCILLATOR INDICATORS ---
  { id: 'rsi', name: 'Relative Strength Index (14)', shortName: 'RSI 14', category: 'oscillator', tier: 'standard', enabled: true, color: '#8B5CF6', params: { period: 14, overbought: 70, oversold: 30 } },
  { id: 'macd', name: 'MACD (12, 26, 9)', shortName: 'MACD', category: 'oscillator', tier: 'standard', enabled: false, color: '#2563EB', secondaryColor: '#EF4444', params: { fast: 12, slow: 26, signal: 9 } },
  { id: 'stoch', name: 'Stochastic Oscillator (14, 3, 3)', shortName: 'Stoch', category: 'oscillator', tier: 'standard', enabled: false, color: '#0EA5E9', secondaryColor: '#F59E0B', params: { period: 14, smoothK: 3, smoothD: 3 } },
  { id: 'stochrsi', name: 'Stochastic RSI (14, 14, 3, 3)', shortName: 'Stoch RSI', category: 'oscillator', tier: 'standard', enabled: false, color: '#10B981', secondaryColor: '#6366F1', params: { rsiPeriod: 14, stochPeriod: 14, smoothK: 3, smoothD: 3 } },
  { id: 'cci', name: 'Commodity Channel Index (20)', shortName: 'CCI 20', category: 'oscillator', tier: 'standard', enabled: false, color: '#D97706', params: { period: 20 } },
  { id: 'roc', name: 'Rate of Change (12)', shortName: 'ROC 12', category: 'oscillator', tier: 'standard', enabled: false, color: '#059669', params: { period: 12 } },
  { id: 'williamsR', name: 'Williams %R (14)', shortName: '%R 14', category: 'oscillator', tier: 'standard', enabled: false, color: '#DC2626', params: { period: 14 } },
  { id: 'mfi', name: 'Money Flow Index (14)', shortName: 'MFI 14', category: 'oscillator', tier: 'standard', enabled: false, color: '#2563EB', params: { period: 14 } },
  { id: 'atr', name: 'Average True Range (14)', shortName: 'ATR 14', category: 'oscillator', tier: 'standard', enabled: false, color: '#9333EA', params: { period: 14 } },
  { id: 'obv', name: 'On-Balance Volume', shortName: 'OBV', category: 'oscillator', tier: 'standard', enabled: false, color: '#0D9488', params: {} },
  { id: 'adx', name: 'Average Directional Index (14)', shortName: 'ADX 14', category: 'oscillator', tier: 'standard', enabled: false, color: '#E11D48', params: { period: 14 } },
];
