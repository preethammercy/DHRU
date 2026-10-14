// DHRU.AI - API Client Service

const API_BASE = '/api';

export async function getMarketStatus() {
  const res = await fetch(`${API_BASE}/market/status`);
  if (!res.ok) throw new Error('Failed to fetch market status');
  return res.json();
}

export async function getMarketOverview() {
  const res = await fetch(`${API_BASE}/market/overview`);
  if (!res.ok) throw new Error('Failed to fetch market overview');
  return res.json();
}

export async function searchMarket(query: string, limit = 15) {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function getAllIndices() {
  const res = await fetch(`${API_BASE}/indices`);
  if (!res.ok) throw new Error('Failed to fetch indices');
  return res.json();
}

export async function getStocks(params: { q?: string; sector?: string; cap?: string; page?: number; limit?: number }) {
  const sp = new URLSearchParams();
  if (params.q) sp.append('q', params.q);
  if (params.sector) sp.append('sector', params.sector);
  if (params.cap) sp.append('cap', params.cap);
  if (params.page) sp.append('page', String(params.page));
  if (params.limit) sp.append('limit', String(params.limit));

  const res = await fetch(`${API_BASE}/stocks?${sp.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch stocks');
  return res.json();
}

export async function getStockDetails(symbol: string) {
  const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}`);
  if (!res.ok) throw new Error(`Failed to load details for ${symbol}`);
  return res.json();
}

export async function getStockCandles(symbol: string, range = '1mo', interval = '1d') {
  const res = await fetch(`${API_BASE}/stocks/${encodeURIComponent(symbol)}/chart?range=${range}&interval=${interval}`);
  if (!res.ok) throw new Error(`Failed to load candles for ${symbol}`);
  return res.json();
}

export async function getSectors() {
  const res = await fetch(`${API_BASE}/sectors`);
  if (!res.ok) throw new Error('Failed to load sectors');
  return res.json();
}

export async function getCommoditiesForex() {
  const res = await fetch(`${API_BASE}/commodities-currencies`);
  if (!res.ok) throw new Error('Failed to load commodities and currencies');
  return res.json();
}

export async function getEtfs() {
  const res = await fetch(`${API_BASE}/etfs`);
  if (!res.ok) throw new Error('Failed to load ETFs');
  return res.json();
}

export async function getDerivatives() {
  const res = await fetch(`${API_BASE}/derivatives`);
  if (!res.ok) throw new Error('Failed to load derivatives data');
  return res.json();
}

export async function getIpoAnnouncements() {
  const res = await fetch(`${API_BASE}/ipo-announcements`);
  if (!res.ok) throw new Error('Failed to load IPO data');
  return res.json();
}

export async function getFiiDiiData() {
  const res = await fetch(`${API_BASE}/fii-dii`);
  if (!res.ok) throw new Error('Failed to load institutional flows');
  return res.json();
}

export async function getNews(refresh = false) {
  const res = await fetch(`${API_BASE}/news?refresh=${refresh}`);
  if (!res.ok) throw new Error('Failed to load news');
  return res.json();
}

export async function getMarketRisk() {
  const res = await fetch(`${API_BASE}/risk`);
  if (!res.ok) throw new Error('Failed to load risk analysis');
  return res.json();
}

export async function getBacktest(symbol: string, strategy = 'ema_cross') {
  const res = await fetch(`${API_BASE}/backtest/${encodeURIComponent(symbol)}?strategy=${strategy}`);
  if (!res.ok) throw new Error('Failed to run backtest');
  return res.json();
}

export async function getPatterns() {
  const res = await fetch(`${API_BASE}/patterns`);
  if (!res.ok) throw new Error('Failed to scan patterns');
  return res.json();
}

export async function runAiAnalysis(symbol: string) {
  const res = await fetch(`${API_BASE}/ai/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbol })
  });
  if (!res.ok) throw new Error('AI analysis failed');
  return res.json();
}

export async function sendChatMessage(query: string, currentContext?: any) {
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, currentContext })
  });
  if (!res.ok) throw new Error('Chat failed');
  return res.json();
}

export async function getSchedulerStatus() {
  const res = await fetch(`${API_BASE}/scheduler/status`);
  if (!res.ok) throw new Error('Failed to get scheduler status');
  return res.json();
}

export async function triggerManualRefresh() {
  const res = await fetch(`${API_BASE}/scheduler/refresh`, { method: 'POST' });
  if (!res.ok) throw new Error('Refresh failed');
  return res.json();
}

export async function saveGeminiKey(apiKey: string) {
  const res = await fetch(`${API_BASE}/settings/key`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey })
  });
  if (!res.ok) throw new Error('Failed to save API key');
  return res.json();
}

export async function getSettingsStatus() {
  try {
    const res = await fetch(`${API_BASE}/settings/status`);
    if (!res.ok) return { configured: false, engine: 'Deterministic Mathematical Engine' };
    return res.json();
  } catch {
    return { configured: false, engine: 'Deterministic Mathematical Engine' };
  }
}

export async function getCryptoInstruments() {
  const res = await fetch(`${API_BASE}/crypto`);
  if (!res.ok) throw new Error('Failed to load crypto markets');
  return res.json();
}

export async function getForexInstruments() {
  const res = await fetch(`${API_BASE}/forex`);
  if (!res.ok) throw new Error('Failed to load forex instruments');
  return res.json();
}

export async function scanChartImage(imageBase64: string, mimeType = 'image/png') {
  const res = await fetch(`${API_BASE}/ai/scan-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mimeType })
  });
  if (!res.ok) throw new Error('Chart image scanning failed');
  return res.json();
}
