export type Mode = 'NORMAL' | 'PROTECT' | 'DEFENSIVE';
export type Status = 'LIVE' | 'PAUSED' | 'HALTED';

export interface Config {
  capital: number;
  riskPerTradePct: number;
  initialStopPct: number;
  trailingStopPct: number;
  takeProfitPct: number;
  maxDailyLossPct: number;
  dailyProfitLockPct: number;
  maxOpenPositions: number;
}

export interface Position {
  id: string;
  symbol: string;
  qty: number;
  entry: number;
  lastPrice: number;
  hwm: number;
  stop: number;
  initialStop: number;
  takeProfit: number | null;
  stopKind: 'INITIAL' | 'TRAILING';
  trailMode: Mode;
  openedAt: string;
  unrealized: number;
  unrealizedPct: number;
  stopDistancePct: number;
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  qty: number;
  entry: number;
  exit: number;
  pnl: number;
  pnlPct: number;
  reason: string;
  openedAt: string;
  closedAt: string;
  dayKey: string;
}

export interface EventItem {
  at: string;
  type: string;
  message: string;
}

export interface State {
  paperMode: true;
  enabled: boolean;
  killed: boolean;
  status: Status;
  dayKey: string;
  equity: number;
  dayPnl: number;
  dayPnlPct: number;
  protectionMode: Mode;
  limits: { maxDailyLossPct: number; dailyProfitLockPct: number };
  config: Config;
  positions: Position[];
  closed: ClosedTrade[];
  events: EventItem[];
}

export interface Report {
  dayKey: string;
  headline: string;
  bullets: string[];
  trades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number | null;
  dayPnl: number;
  dayPnlPct: number;
  reasons: Record<string, number>;
  mode: Mode;
  killed: boolean;
}

const BASE = '/api/autotrade';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data as T;
}

const post = (path: string, body?: unknown) =>
  request<State>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });

export const autoTradeApi = {
  state: () => request<State>('/state'),
  report: () => request<Report>('/report'),
  updateConfig: (config: Config) =>
    request<State>('/config', { method: 'PUT', body: JSON.stringify(config) }),
  enable: (enabled: boolean) => post('/enable', { enabled }),
  open: (symbol: string) => post('/open', { symbol }),
  close: (symbol: string) => post('/close', { symbol }),
  kill: () => post('/kill'),
};
