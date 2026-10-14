// DHRU.AI - Technical Indicator Configuration Types

export interface IndicatorConfig {
  id: string;
  name: string;
  shortName: string;
  category: 'overlay' | 'oscillator';
  enabled: boolean;
  color: string;
  secondaryColor?: string;
  lineWidth?: number;
  params: Record<string, number | string>;
}

export const DEFAULT_INDICATORS: IndicatorConfig[] = [
  // Overlays
  { id: 'sma20', name: 'Simple Moving Average (20)', shortName: 'SMA 20', category: 'overlay', enabled: true, color: '#F59E0B', lineWidth: 1.5, params: { period: 20 } },
  { id: 'sma50', name: 'Simple Moving Average (50)', shortName: 'SMA 50', category: 'overlay', enabled: false, color: '#3B82F6', lineWidth: 1.5, params: { period: 50 } },
  { id: 'sma200', name: 'Simple Moving Average (200)', shortName: 'SMA 200', category: 'overlay', enabled: true, color: '#8B5CF6', lineWidth: 2, params: { period: 200 } },
  { id: 'ema9', name: 'Exponential Moving Average (9)', shortName: 'EMA 9', category: 'overlay', enabled: false, color: '#06B6D4', lineWidth: 1.5, params: { period: 9 } },
  { id: 'ema21', name: 'Exponential Moving Average (21)', shortName: 'EMA 21', category: 'overlay', enabled: false, color: '#10B981', lineWidth: 1.5, params: { period: 21 } },
  { id: 'wma20', name: 'Weighted Moving Average (20)', shortName: 'WMA 20', category: 'overlay', enabled: false, color: '#EC4899', lineWidth: 1.5, params: { period: 20 } },
  { id: 'vwma20', name: 'Volume Weighted MA (20)', shortName: 'VWMA 20', category: 'overlay', enabled: false, color: '#14B8A6', lineWidth: 1.5, params: { period: 20 } },
  { id: 'hma14', name: 'Hull Moving Average (14)', shortName: 'HMA 14', category: 'overlay', enabled: false, color: '#6366F1', lineWidth: 2, params: { period: 14 } },
  { id: 'supertrend', name: 'Supertrend', shortName: 'Supertrend (10, 3)', category: 'overlay', enabled: false, color: '#10B981', secondaryColor: '#EF4444', lineWidth: 2, params: { period: 10, multiplier: 3 } },
  { id: 'bollinger', name: 'Bollinger Bands', shortName: 'BB (20, 2)', category: 'overlay', enabled: false, color: '#2563EB', lineWidth: 1, params: { period: 20, multiplier: 2 } },
  { id: 'keltner', name: 'Keltner Channels', shortName: 'KC (20, 2)', category: 'overlay', enabled: false, color: '#D97706', lineWidth: 1, params: { period: 20, multiplier: 2 } },
  { id: 'donchian', name: 'Donchian Channels', shortName: 'DC (20)', category: 'overlay', enabled: false, color: '#0284C7', lineWidth: 1, params: { period: 20 } },
  { id: 'vwap', name: 'Volume Weighted Avg Price', shortName: 'VWAP', category: 'overlay', enabled: false, color: '#E11D48', lineWidth: 2, params: {} },
  { id: 'sar', name: 'Parabolic SAR', shortName: 'SAR (0.02, 0.2)', category: 'overlay', enabled: false, color: '#A855F7', lineWidth: 1, params: { step: 0.02, maxStep: 0.2 } },
  { id: 'pivots', name: 'Pivot Points (Floor & Fib)', shortName: 'Pivots', category: 'overlay', enabled: true, color: '#64748B', params: { type: 'standard' } },

  // Oscillators (Separate Panes)
  { id: 'rsi', name: 'Relative Strength Index (14)', shortName: 'RSI 14', category: 'oscillator', enabled: true, color: '#8B5CF6', params: { period: 14, overbought: 70, oversold: 30 } },
  { id: 'macd', name: 'MACD (12, 26, 9)', shortName: 'MACD', category: 'oscillator', enabled: false, color: '#2563EB', secondaryColor: '#EF4444', params: { fast: 12, slow: 26, signal: 9 } },
  { id: 'stoch', name: 'Stochastic Oscillator (14, 3, 3)', shortName: 'Stoch', category: 'oscillator', enabled: false, color: '#0EA5E9', secondaryColor: '#F59E0B', params: { period: 14, smoothK: 3, smoothD: 3 } },
  { id: 'stochrsi', name: 'Stochastic RSI (14, 14, 3, 3)', shortName: 'Stoch RSI', category: 'oscillator', enabled: false, color: '#10B981', secondaryColor: '#6366F1', params: { rsiPeriod: 14, stochPeriod: 14, smoothK: 3, smoothD: 3 } },
  { id: 'cci', name: 'Commodity Channel Index (20)', shortName: 'CCI 20', category: 'oscillator', enabled: false, color: '#D97706', params: { period: 20 } },
  { id: 'roc', name: 'Rate of Change (12)', shortName: 'ROC 12', category: 'oscillator', enabled: false, color: '#059669', params: { period: 12 } },
  { id: 'williamsR', name: 'Williams %R (14)', shortName: '%R 14', category: 'oscillator', enabled: false, color: '#DC2626', params: { period: 14 } },
  { id: 'mfi', name: 'Money Flow Index (14)', shortName: 'MFI 14', category: 'oscillator', enabled: false, color: '#2563EB', params: { period: 14 } },
  { id: 'atr', name: 'Average True Range (14)', shortName: 'ATR 14', category: 'oscillator', enabled: false, color: '#9333EA', params: { period: 14 } },
  { id: 'obv', name: 'On-Balance Volume', shortName: 'OBV', category: 'oscillator', enabled: false, color: '#0D9488', params: {} },
  { id: 'adx', name: 'Average Directional Index (14)', shortName: 'ADX 14', category: 'oscillator', enabled: false, color: '#E11D48', params: { period: 14 } },
];
