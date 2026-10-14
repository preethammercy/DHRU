// DHRU.AI - TypeScript Type Definitions

export interface MarketStatus {
  status: 'Live' | 'Pre-Market' | 'Post-Market' | 'Closed';
  badgeColor: string;
  label: string;
  message: string;
  timezone: string;
  currentTimeIST: string;
  weekday: string;
  isWeekend: boolean;
}

export interface Quote {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  price: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  marketCap?: number | null;
  lastUpdated: string;
  source: string;
  status: string;
  instrumentType?: string;
  sector?: string;
  cap?: string;
}

export interface Candle {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface VolumeBar {
  time: number | string;
  value: number;
  color: string;
}

export interface TechnicalIndicators {
  lastPrice: number;
  sma: {
    sma20: number | null;
    sma50: number | null;
    sma200: number | null;
  };
  ema: {
    ema9: number | null;
    ema21: number | null;
  };
  rsi: number | null;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
    status: 'Bullish' | 'Bearish';
  } | null;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
    percentB: number;
  } | null;
  vwap: number | null;
  pivots: {
    pivot: number;
    r1: number;
    s1: number;
    r2: number;
    s2: number;
    r3: number;
    s3: number;
  } | null;
  patterns: Array<{
    name: string;
    type: string;
    strength: string;
    explanation: string;
  }>;
  score: number;
  consensus: string;
  badgeColor: string;
  signals: string[];
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  publisher: string;
  sourceType: string;
  pubDate: string;
  retrievedAt: string;
  summary: string;
  relatedInstruments: string[];
  relatedSectors: string[];
  sentiment: 'Bullish' | 'Bearish' | 'Neutral';
  sentimentScore: number;
  verified: boolean;
}

export interface RiskAnalysis {
  score: number;
  rating?: string;
  classification?: string;
  badgeColor?: string;
  badgeClass?: string;
  description?: string;
  factors?: Array<{ name: string; impact: string; note: string }>;
  mitigations?: Array<{ name: string; impact: string; note: string }>;
  positiveSignals?: string[];
  riskSignals?: string[];
  drawdownPct: number;
  methodology: string;
}

export interface ScenarioHorizons {
  currentPrice: number;
  volatilityAtr: number;
  volatilityAtrPct: number;
  confidenceScore: number;
  uncertaintyLabel: string;
  horizons: {
    nextSession: {
      timeframe: string;
      bias: string;
      probabilityEstimate: string;
      projectedRange: string;
      keyTrigger: string;
    };
    fiveDays: {
      timeframe: string;
      bullishScenario: { target: string; probability: string; condition: string };
      sidewaysScenario: { target: string; probability: string; condition: string };
      bearishScenario: { target: string; probability: string; condition: string };
    };
    oneMonth: {
      timeframe: string;
      structuralPosture: string;
      broadRange: string;
      macroDrivers: string;
    };
  };
  methodologyNote: string;
}

export interface TradeSetup {
  action: 'BUY' | 'SELL' | 'WAIT';
  entryZone: string;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  target3: number;
  riskRewardRatio: string;
  optimalTimeWindow: string;
  exitCriteria: string;
}

export interface AiReport {
  direction: 'Bullish' | 'Bearish' | 'Sideways';
  trendStrength: 'Weak' | 'Moderate' | 'Strong';
  trendEvidence: string;
  indicatorInterpretation: string;
  candlestickExplanation: string;
  positiveCatalysts: string[];
  negativeCatalysts: string[];
  supportResistanceSummary: string;
  downsideRisk: string;
  scenarios: {
    nextSession: string;
    fiveDays: string;
    oneMonth: string;
  };
  tradeSetup?: TradeSetup;
  beginnerExplanation: string;
  confidenceRating: 'High' | 'Moderate' | 'Low';
  engine: string;
  modelTimestamp: string;
}

export interface BacktestResult {
  symbol: string;
  strategy: string;
  sampleSize: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPct: number;
  totalReturnPct: number;
  benchmarkReturnPct: number;
  trades: Array<{
    entryDate: string | number;
    exitDate: string | number;
    entryPrice: number;
    exitPrice: number;
    pnlPct: number;
    win: boolean;
  }>;
  disclaimer: string;
}
