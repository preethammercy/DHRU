const base = (process.env.MARKET_API_BASE || 'http://localhost:5000/api').replace(/\/$/, '');
const samples = [
  { name: 'NIFTY 50', app: '^NSEI', ref: 'https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=1d&interval=1m' },
  { name: 'SENSEX', app: '^BSESN', ref: 'https://query1.finance.yahoo.com/v8/finance/chart/%5EBSESN?range=1d&interval=1m' },
  { name: 'RELIANCE', app: 'RELIANCE.NS', ref: 'https://query1.finance.yahoo.com/v8/finance/chart/RELIANCE.NS?range=1d&interval=1m' },
  { name: 'TCS', app: 'TCS.NS', ref: 'https://query1.finance.yahoo.com/v8/finance/chart/TCS.NS?range=1d&interval=1m' },
  { name: 'HDFCBANK', app: 'HDFCBANK.NS', ref: 'https://query1.finance.yahoo.com/v8/finance/chart/HDFCBANK.NS?range=1d&interval=1m' },
  ...['BTC','ETH','SOL'].map(t => ({ name: t, app: `${t}-USD`, ref: `https://api.binance.com/api/v3/ticker/price?symbol=${t}USDT`, crypto: true })),
  { name: 'USD/INR', app: 'INR=X', ref: 'https://query1.finance.yahoo.com/v8/finance/chart/INR=X?range=1d&interval=1m' },
  { name: 'Gold', app: 'GC=F', ref: 'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?range=1d&interval=1m' }
];

async function referencePrice(item) {
  const response = await fetch(item.ref, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!response.ok) throw new Error(`reference HTTP ${response.status}`);
  const body = await response.json();
  if (item.crypto) return Number(body.price);
  return Number(body?.chart?.result?.[0]?.meta?.regularMarketPrice || 0);
}

const quoteUrl = `${base}/stream/ticks?symbols=${encodeURIComponent(samples.map(s => s.app).join(','))}`;
const response = await fetch(quoteUrl, { headers: { Accept: 'application/json' } });
if (!response.ok) throw new Error(`DHRU API HTTP ${response.status}: ${await response.text()}`);
const body = await response.json();
const appQuotes = new Map((body.ticks || []).map(q => [q.symbol, q]));
let failures = 0;
console.log('Sample price comparison (DHRU vs provider reference)');
for (const item of samples) {
  try {
    const reference = await referencePrice(item);
    const appPrice = Number(appQuotes.get(item.app)?.price);
    if (!(appPrice > 0) || !(reference > 0)) throw new Error('price unavailable');
    const pct = Math.abs(appPrice - reference) / reference * 100;
    console.log(`${item.name.padEnd(10)} app=${appPrice} ref=${reference} diff=${pct.toFixed(3)}% source=${appQuotes.get(item.app)?.source || 'unknown'} status=${appQuotes.get(item.app)?.status || 'unknown'}`);
  } catch (error) {
    failures++;
    console.log(`${item.name.padEnd(10)} UNAVAILABLE (${error.message})`);
  }
}
if (failures) process.exitCode = 1;
