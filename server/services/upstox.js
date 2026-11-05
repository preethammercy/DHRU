const API = 'https://api.upstox.com';
const keyCache = new Map();

const INDEX_NAMES = {
  '^NSEI': 'Nifty 50', '^BSESN': 'SENSEX', '^NSEBANK': 'Nifty Bank',
  '^CNXIT': 'Nifty IT', '^CNXAUTO': 'Nifty Auto', '^CNXMETAL': 'Nifty Metal',
  '^CNXPHARMA': 'Nifty Pharma', '^CNXENERGY': 'Nifty Energy'
};

export function hasUpstoxToken() {
  return Boolean(process.env.UPSTOX_ACCESS_TOKEN);
}

async function resolveKey(symbol) {
  if (keyCache.has(symbol)) return keyCache.get(symbol);
  const token = process.env.UPSTOX_ACCESS_TOKEN;
  if (!token) return null;
  const query = INDEX_NAMES[symbol] || symbol.replace(/\.(NS|BO)$/i, '').replace(/^\^/, '');
  const exchange = symbol.endsWith('.BO') || symbol === '^BSESN' ? 'BSE' : 'NSE';
  const segment = symbol.startsWith('^') ? 'INDICES' : 'EQ';
  const url = new URL(`${API}/v2/instruments/search`);
  url.searchParams.set('query', query);
  url.searchParams.set('exchange', exchange);
  url.searchParams.set('segment', segment);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Upstox instrument lookup failed (${response.status})`);
  const body = await response.json();
  const results = body.data || [];
  const exact = results.find(item => [item.trading_symbol, item.short_name, item.name].some(value =>
    String(value || '').toUpperCase() === query.toUpperCase()));
  const key = exact?.instrument_key || results[0]?.instrument_key || null;
  if (key) keyCache.set(symbol, key);
  return key;
}

export async function fetchUpstoxQuotes(symbols) {
  if (!hasUpstoxToken() || symbols.length === 0) return new Map();
  const mappings = await Promise.all(symbols.map(async symbol => [symbol, await resolveKey(symbol)]));
  const valid = mappings.filter(([, key]) => key);
  if (!valid.length) return new Map();
  const url = new URL(`${API}/v3/market-quote/ohlc`);
  url.searchParams.set('instrument_key', valid.map(([, key]) => key).join(','));
  url.searchParams.set('interval', '1d');
  const response = await fetch(url, { headers: { Authorization: `Bearer ${process.env.UPSTOX_ACCESS_TOKEN}`, Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Upstox quote request failed (${response.status})`);
  const body = await response.json();
  const byKey = new Map(Object.values(body.data || {}).map(row => [row.instrument_token || row.instrument_key, row]));
  const out = new Map();
  for (const [symbol, key] of valid) {
    const row = byKey.get(key);
    const price = Number(row?.last_price);
    const rawTime = row?.ltt || row?.timestamp || 0;
    const ts = Number(rawTime);
    const epoch = typeof rawTime === 'string' && Number.isNaN(ts) ? Date.parse(rawTime) : ts > 1e12 ? ts : ts > 0 ? ts * 1000 : 0;
    if (!row || !Number.isFinite(price) || price <= 0 || !epoch || epoch > Date.now() + 60_000 || Date.now() - epoch > 90_000) continue;
    const previousClose = Number(row.prev_ohlc?.close || row.ohlc?.close || 0);
    const change = previousClose > 0 ? price - previousClose : 0;
    out.set(symbol, {
      price, previousClose, change,
      changePercent: previousClose > 0 ? (change / previousClose) * 100 : 0,
      dayHigh: Number(row.ohlc?.high || price), dayLow: Number(row.ohlc?.low || price),
      volume: Number(row.ohlc?.volume || row.volume || 0),
      lastUpdated: new Date(epoch).toISOString(), timestamp: epoch,
      timestampEpoch: Math.floor(epoch / 1000), source: 'Upstox', status: 'LIVE'
    });
  }
  return out;
}
