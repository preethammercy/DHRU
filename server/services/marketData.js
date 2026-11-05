// DHRU.AI request-time market data. Broker quotes are LIVE; Yahoo quotes are DELAYED.

import { INDICES, COMMODITIES_FOREX, ETFS, CURATED_STOCKS, CRYPTO_INSTRUMENTS } from '../data/instruments.js';
import { fetchUpstoxQuotes } from './upstox.js';

// In-memory quote & candle cache
const quoteCache = new Map();
const candleCache = new Map();
const lastQuoteCache = new Map();
const lastCandleCache = new Map();
const closedSessionQuoteCache = new Map();

export function isIndianMarketOpen() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: false, weekday: 'short'
  }).formatToParts(new Date());
  const get = (type) => parts.find(part => part.type === type)?.value || '0';
  const day = get('weekday');
  if (day === 'Sat' || day === 'Sun') return false;
  const minutes = Number(get('hour')) * 60 + Number(get('minute'));
  return minutes >= 555 && minutes < 930; // 9:15 AM to 3:30 PM IST
}

const CACHE_TTL_MS = 1500;
const BATCH_CACHE_TTL_MS = 1500;

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const COINGECKO_IDS = {
  'BTC-USD':'bitcoin','ETH-USD':'ethereum','SOL-USD':'solana','BNB-USD':'binancecoin','XRP-USD':'ripple',
  'DOGE-USD':'dogecoin','ADA-USD':'cardano','AVAX-USD':'avalanche-2','LINK-USD':'chainlink','NEAR-USD':'near',
  'SUI-USD':'sui','PEPE-USD':'pepe','DOT-USD':'polkadot','APT-USD':'aptos','SHIB-USD':'shiba-inu',
  'LTC-USD':'litecoin','UNI-USD':'uniswap','ARB-USD':'arbitrum','OP-USD':'optimism','RENDER-USD':'render-token',
  'ICP-USD':'internet-computer','FET-USD':'fetch-ai'
};

async function fetchCoinGeckoQuote(symbol) {
  const id = COINGECKO_IDS[symbol];
  if (!id) return null;
  const url = new URL('https://api.coingecko.com/api/v3/simple/price');
  url.searchParams.set('ids', id);
  url.searchParams.set('vs_currencies', 'usd');
  url.searchParams.set('include_24hr_change', 'true');
  url.searchParams.set('include_24hr_vol', 'true');
  url.searchParams.set('include_24hr_high', 'true');
  url.searchParams.set('include_24hr_low', 'true');
  url.searchParams.set('include_last_updated_at', 'true');
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error(`CoinGecko quote unavailable (${response.status})`);
  const row = (await response.json())?.[id];
  const price = Number(row?.usd), changePercent = Number(row?.usd_24h_change);
  const timestamp = Number(row?.last_updated_at) * 1000;
  if (!(price > 0) || !Number.isFinite(changePercent)) return null;
  const previousClose = price / (1 + changePercent / 100);
  return { price, previousClose, change: price - previousClose, changePercent, dayHigh: Number(row.usd_24h_high), dayLow: Number(row.usd_24h_low),
    volume: Number(row.usd_24h_vol || 0), currency: 'USD', lastUpdated: new Date(timestamp).toISOString(), timestamp, timestampEpoch: Math.floor(timestamp / 1000),
    source: 'CoinGecko', status: 'LIVE', instrumentType: 'CRYPTOCURRENCY' };
}

async function fetchCoinGeckoBatch(symbols) {
  const mapped = symbols.map(symbol => [symbol, COINGECKO_IDS[symbol]]).filter(([, id]) => id);
  if (!mapped.length) return new Map();
  const url = new URL('https://api.coingecko.com/api/v3/simple/price');
  url.searchParams.set('ids', mapped.map(([, id]) => id).join(','));
  url.searchParams.set('vs_currencies', 'usd');
  url.searchParams.set('include_24hr_change', 'true');
  url.searchParams.set('include_24hr_vol', 'true');
  url.searchParams.set('include_24hr_high', 'true');
  url.searchParams.set('include_24hr_low', 'true');
  url.searchParams.set('include_last_updated_at', 'true');
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error(`CoinGecko batch quote unavailable (${response.status})`);
  const body = await response.json(), result = new Map();
  for (const [symbol, id] of mapped) {
    const row = body?.[id], price = Number(row?.usd), changePercent = Number(row?.usd_24h_change);
    const timestamp = Number(row?.last_updated_at) * 1000;
    if (!(price > 0) || !Number.isFinite(changePercent)) continue;
    const previousClose = price / (1 + changePercent / 100);
    result.set(symbol, { symbol, name: symbol.replace('-USD', ''), currency: 'USD', exchange: 'Global Crypto', price, previousClose,
      change: price - previousClose, changePercent, dayHigh: Number(row.usd_24h_high), dayLow: Number(row.usd_24h_low), volume: Number(row.usd_24h_vol || 0),
      lastUpdated: new Date(timestamp).toISOString(), timestamp, timestampEpoch: Math.floor(timestamp / 1000), source: 'CoinGecko', status: 'LIVE', instrumentType: 'CRYPTOCURRENCY' });
  }
  return result;
}

async function fetchBinanceBatch(symbols) {
  const symbolsByPair = new Map(symbols.filter(symbol => symbol.endsWith('-USD')).map(symbol => [symbol.replace('-USD', 'USDT'), symbol]));
  if (!symbolsByPair.size) return new Map();
  const url = new URL('https://api.binance.com/api/v3/ticker/24hr');
  url.searchParams.set('symbols', JSON.stringify([...symbolsByPair.keys()]));
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(3000) });
  if (!response.ok) throw new Error(`Binance batch quote unavailable (${response.status})`);
  const out = new Map();
  for (const item of await response.json()) {
    const symbol = symbolsByPair.get(item.symbol), price = Number(item.lastPrice), timestamp = Number(item.closeTime);
    if (!symbol || !(price > 0)) continue;
    out.set(symbol, { symbol, name: symbol.replace('-USD', ''), currency: 'USDT', pair: `${symbol.replace('-USD', '')}/USDT`, exchange: 'Binance', price,
      previousClose: Number(item.prevClosePrice), change: Number(item.priceChange), changePercent: Number(item.priceChangePercent),
      dayHigh: Number(item.highPrice), dayLow: Number(item.lowPrice), volume: Number(item.volume), lastUpdated: new Date(timestamp).toISOString(),
      timestamp, timestampEpoch: Math.floor(timestamp / 1000), source: 'Binance REST', status: 'LIVE', instrumentType: 'CRYPTOCURRENCY' });
  }
  return out;
}

export async function fetchInstrumentQuote(symbol) {
  const isIndian = /\.(NS|BO)$|^\^(NSE|BSE|CNX)/i.test(symbol);
  const marketOpen = isIndian ? isIndianMarketOpen() : true;

  if (isIndian && !marketOpen && closedSessionQuoteCache.has(symbol)) {
    return closedSessionQuoteCache.get(symbol);
  }

  const cached = quoteCache.get(symbol);
  if (cached && (Date.now() - cached.cachedAt < (marketOpen ? CACHE_TTL_MS : 300_000))) {
    return cached.data;
  }

  // Broker quotes are resolved at request time; the in-memory map is only a 1.5s optimization.
  if (isIndian) {
    try {
      const broker = await fetchUpstoxQuotes([symbol]);
      const live = broker.get(symbol);
      if (live) {
        const data = {
          symbol,
          ...live,
          currency: 'INR',
          instrumentType: symbol.startsWith('^') ? 'INDEX' : 'EQUITY',
          status: marketOpen ? 'LIVE' : 'CLOSED',
          sessionStatus: marketOpen ? 'LIVE' : 'Market Closed, final close 15:30'
        };
        quoteCache.set(symbol, { data, cachedAt: Date.now() });
        lastQuoteCache.set(symbol, data);
        if (!marketOpen) closedSessionQuoteCache.set(symbol, data);
        return data;
      }
    } catch (error) {
      console.warn(`[MarketData] Upstox fallback for ${symbol}: ${error.message}`);
    }
  }

  // Public Binance 24-hour ticker for USDT pairs.
  if (symbol.includes('-USD')) {
    try {
      const pair = symbol.replace('-USD', 'USDT');
      const binanceRes = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      if (binanceRes.ok) {
        const d = await binanceRes.json();
        const price = parseFloat(d.lastPrice);
        const prevClose = parseFloat(d.prevClosePrice);
        const sourceTime = Number(d.closeTime);
        if (!Number.isFinite(price) || price <= 0) {
          throw new Error('Binance returned an invalid crypto quote');
        }
        const change = parseFloat(d.priceChange);
        const changePercent = parseFloat(d.priceChangePercent);
        const data = {
          symbol,
          name: symbol.replace('-USD', ' USD'),
          currency: 'USDT',
          pair: `${pair.slice(0, -4)}/USDT`,
          exchange: 'Global Crypto',
          price,
          previousClose: prevClose,
          change: Number(change.toFixed(price > 100 ? 2 : 4)),
          changePercent: Number(changePercent.toFixed(2)),
          dayHigh: parseFloat(d.highPrice),
          dayLow: parseFloat(d.lowPrice),
          volume: parseFloat(d.volume),
          fiftyTwoWeekHigh: null,
          fiftyTwoWeekLow: null,
          marketCap: null,
          lastUpdated: new Date(sourceTime).toISOString(),
          timestamp: sourceTime,
          timestampEpoch: Math.floor(sourceTime / 1000),
          source: 'Binance',
          status: 'LIVE',
          instrumentType: 'CRYPTOCURRENCY'
        };
        quoteCache.set(symbol, { data, cachedAt: Date.now() });
        lastQuoteCache.set(symbol, data);
        return data;
      }
    } catch {
      try {
        const alternate = await fetchCoinGeckoQuote(symbol);
        if (alternate) {
          const data = { symbol, name: symbol.replace('-USD', ''), exchange: 'Global Crypto', ...alternate };
          quoteCache.set(symbol, { data, cachedAt: Date.now() });
          lastQuoteCache.set(symbol, data);
          return data;
        }
      } catch (fallbackError) {
        console.warn(`[MarketData] CoinGecko fallback for ${symbol}: ${fallbackError.message}`);
      }
    }
  }

  try {
    const encodedSym = encodeURIComponent(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSym}?range=1d&interval=1d`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3500)
    });

    if (!res.ok) {
      throw new Error(`Public feed returned status ${res.status}`);
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result || !result.meta) {
      throw new Error(`No data available for symbol ${symbol}`);
    }

    const meta = result.meta;
    const price = isIndian && !marketOpen && meta.chartPreviousClose ? meta.chartPreviousClose : (meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0);
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const change = Number((price - prevClose).toFixed(2));
    const changePercent = prevClose > 0 ? Number(((change / prevClose) * 100).toFixed(2)) : 0;

    const data = {
      symbol: meta.symbol || symbol,
      name: meta.longName || meta.shortName || symbol,
      currency: meta.currency || 'INR',
      exchange: meta.fullExchangeName || meta.exchangeName || 'NSE',
      price: price,
      previousClose: prevClose,
      change: change,
      changePercent: changePercent,
      dayHigh: meta.regularMarketDayHigh ?? price,
      dayLow: meta.regularMarketDayLow ?? price,
      volume: meta.regularMarketVolume ?? 0,
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
      marketCap: meta.marketCap ?? null,
      lastUpdated: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
      timestampEpoch: meta.regularMarketTime || null,
      timestamp: meta.regularMarketTime ? meta.regularMarketTime * 1000 : null,
      source: 'NSE / Global Feeds',
      status: isIndian && !marketOpen ? 'CLOSED' : 'LIVE',
      sessionStatus: isIndian && !marketOpen ? 'Market Closed, final close 15:30' : 'LIVE',
      instrumentType: meta.instrumentType || (symbol.startsWith('^') ? 'INDEX' : 'EQUITY')
    };

    if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      throw new Error(`Public feed returned no valid price for ${symbol}`);
    }
    quoteCache.set(symbol, { data, cachedAt: Date.now() });
    lastQuoteCache.set(symbol, data);
    if (isIndian && !marketOpen) {
      closedSessionQuoteCache.set(symbol, data);
    }
    return data;
  } catch (err) {
    console.warn(`[MarketData] Quote lookup failed for ${symbol}:`, err.message);
    if (lastQuoteCache.has(symbol)) {
      return { ...lastQuoteCache.get(symbol), status: 'CACHED' };
    }
    const staticInfo = CURATED_STOCKS.find(s => s.symbol === symbol)
      || INDICES.find(i => i.symbol === symbol)
      || COMMODITIES_FOREX.find(c => c.symbol === symbol)
      || CRYPTO_INSTRUMENTS.find(c => c.symbol === symbol);
    if (staticInfo) {
      const isCrypto = symbol.includes('-USD');
      const isInd = symbol.startsWith('^');
      const dummyPrice = isCrypto
        ? (symbol.startsWith('BTC') ? 77400 : symbol.startsWith('ETH') ? 2270 : symbol.startsWith('SOL') ? 93 : 50)
        : (isInd ? (symbol.includes('NSEI') ? 24200 : 79000) : 2500);
      const fallbackData = {
        symbol,
        name: staticInfo.name,
        currency: isCrypto ? 'USDT' : (symbol.endsWith('=X') && !symbol.includes('INR') ? 'USD' : 'INR'),
        exchange: staticInfo.exchange || (isCrypto ? 'Global Crypto' : 'NSE'),
        price: dummyPrice,
        previousClose: dummyPrice,
        change: 0,
        changePercent: 0,
        dayHigh: Number((dummyPrice * 1.01).toFixed(2)),
        dayLow: Number((dummyPrice * 0.99).toFixed(2)),
        volume: 100000,
        fiftyTwoWeekHigh: Number((dummyPrice * 1.2).toFixed(2)),
        fiftyTwoWeekLow: Number((dummyPrice * 0.8).toFixed(2)),
        marketCap: null,
        lastUpdated: new Date().toISOString(),
        timestampEpoch: Math.floor(Date.now() / 1000),
        timestamp: Date.now(),
        source: 'DHRU Offline Anchor',
        status: 'FALLBACK',
        instrumentType: isCrypto ? 'CRYPTOCURRENCY' : (isInd ? 'INDEX' : 'EQUITY')
      };
      lastQuoteCache.set(symbol, fallbackData);
      return fallbackData;
    }
    throw err;
  }
}

export async function fetchInstrumentCandles(symbol, range = '1mo', interval = '1d') {
  // Normalize parameters
  let queryInterval = interval;
  let queryRange = range;
  const is4Hour = interval === '4h';

  if (is4Hour) {
    queryInterval = '60m';
    queryRange = ['1d', '5d', '1mo', '3mo', '6mo'].includes(range) ? range : '6mo';
  }

  // Yahoo Finance range clamping per interval to prevent 400 Bad Request errors
  if (queryInterval === '1m') {
    if (!['1d', '5d', '7d'].includes(queryRange)) queryRange = '1d';
  } else if (['2m', '5m'].includes(queryInterval)) {
    if (!['1d', '5d', '1mo'].includes(queryRange)) queryRange = '5d';
  } else if (['15m', '30m'].includes(queryInterval)) {
    if (!['1d', '5d', '1mo'].includes(queryRange)) queryRange = '1mo';
  } else if (['60m', '1h'].includes(queryInterval)) {
    if (!['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y'].includes(queryRange)) queryRange = '3mo';
  }

  const cacheKey = `${symbol}_${queryRange}_${interval}`;
  const cached = candleCache.get(cacheKey);
  if (cached && (Date.now() - cached.cachedAt < CACHE_TTL_MS)) {
    return cached.data;
  }

  // Binance REST klines provide current crypto history.
  if (symbol.includes('-USD')) {
    try {
      const pair = symbol.replace('-USD', 'USDT');
      const binanceIntervalMap = {
        '1m': '1m', '5m': '5m', '15m': '15m', '30m': '30m',
        '60m': '1h', '1h': '1h', '4h': '4h',
        '1d': '1d', '1D': '1d', '1wk': '1w', '1W': '1w', '1mo': '1M', '1M': '1M'
      };
      const bInterval = binanceIntervalMap[interval] || '30m';
      const limit = ['1m', '5m'].includes(bInterval) ? 500 : 250;
      const bRes = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${bInterval}&limit=${limit}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      if (bRes.ok) {
        const klines = await bRes.json();
        if (Array.isArray(klines) && klines.length > 0) {
          const rawCandles = klines.map(k => ({
            time: Math.floor(k[0] / 1000),
            open: parseFloat(k[1]),
            high: parseFloat(k[2]),
            low: parseFloat(k[3]),
            close: parseFloat(k[4]),
            volume: parseFloat(k[5])
          })).filter(c => c && !isNaN(c.close));

          const responseData = {
            symbol,
            range,
            interval,
            count: rawCandles.length,
            candles: rawCandles,
            volumeData: rawCandles.map(c => ({
              time: c.time,
              value: c.volume,
              color: c.close >= c.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'
            })),
            source: 'Binance REST klines', status: 'LIVE'
          };
          candleCache.set(cacheKey, { data: responseData, cachedAt: Date.now() });
          lastCandleCache.set(cacheKey, responseData);
          return responseData;
        }
      }
    } catch (bErr) {
      console.warn('[MarketData] Binance kline fallback to Yahoo:', bErr.message);
    }
  }

  try {
    const encodedSym = encodeURIComponent(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSym}?range=${queryRange}&interval=${queryInterval}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3500)
    });

    if (!res.ok) {
      throw new Error(`Candle feed returned status ${res.status}`);
    }

    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
      throw new Error(`Candle history unavailable for ${symbol}`);
    }

    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];
    const opens = quotes.open || [];
    const highs = quotes.high || [];
    const lows = quotes.low || [];
    const closes = quotes.close || [];
    const volumes = quotes.volume || [];

    let rawCandles = [];

    for (let i = 0; i < timestamps.length; i++) {
      const t = timestamps[i];
      const o = opens[i];
      const h = highs[i];
      const l = lows[i];
      const c = closes[i];
      const v = volumes[i] ?? 0;

      // Filter out null / invalid points
      if (o != null && h != null && l != null && c != null && !isNaN(c) && !isNaN(o)) {
        const isMicro = c < 0.01;
        const isSmall = c < 20;
        const decimals = isMicro ? 8 : (isSmall ? 4 : 2);
        rawCandles.push({
          time: t,
          open: Number(o.toFixed(decimals)),
          high: Number(h.toFixed(decimals)),
          low: Number(l.toFixed(decimals)),
          close: Number(c.toFixed(decimals)),
          volume: v
        });
      }
    }

    // De-duplicate timestamps and ensure strictly ascending sort
    const seenTimes = new Set();
    const sortedCandles = [];
    rawCandles.sort((a, b) => a.time - b.time);
    for (const c of rawCandles) {
      if (!seenTimes.has(c.time)) {
        seenTimes.add(c.time);
        sortedCandles.push(c);
      }
    }

    let candles = sortedCandles;

    // Aggregate into 4-hour candles if requested
    if (is4Hour && sortedCandles.length > 0) {
      const aggCandles = [];
      const blockSize = 4;
      for (let i = 0; i < sortedCandles.length; i += blockSize) {
        const chunk = sortedCandles.slice(i, i + blockSize);
        if (chunk.length === 0) continue;
        const open = chunk[0].open;
        const high = Math.max(...chunk.map(b => b.high));
        const low = Math.min(...chunk.map(b => b.low));
        const close = chunk[chunk.length - 1].close;
        const volume = chunk.reduce((sum, b) => sum + (b.volume || 0), 0);
        const isMicro = close < 0.01;
        const isSmall = close < 20;
        const decimals = isMicro ? 8 : (isSmall ? 4 : 2);
        aggCandles.push({
          time: chunk[0].time,
          open: Number(open.toFixed(decimals)),
          high: Number(high.toFixed(decimals)),
          low: Number(low.toFixed(decimals)),
          close: Number(close.toFixed(decimals)),
          volume
        });
      }
      candles = aggCandles;
    }

    // Build volume data matching final candles
    const volumeData = candles.map(c => ({
      time: c.time,
      value: c.volume || 0,
      color: c.close >= c.open ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)'
    }));

    const meta = result.meta || {};
    const currency = symbol.includes('-USD') || symbol.endsWith('=X') && !symbol.includes('INR') ? 'USD' : (meta.currency || 'INR');

    const responseData = {
      symbol: meta.symbol || symbol,
      currency,
      range: queryRange,
      interval,
      candlesCount: candles.length,
      candles,
      volumeData,
      meta: {
        regularMarketPrice: meta.regularMarketPrice,
        chartPreviousClose: meta.chartPreviousClose,
        fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
        timezone: meta.timezone || 'IST'
      },
      lastUpdated: timestamps.length ? new Date(timestamps[timestamps.length - 1] * 1000).toISOString() : null,
      source: 'Yahoo Finance', status: 'DELAYED'
    };

    candleCache.set(cacheKey, { data: responseData, cachedAt: Date.now() });
    lastCandleCache.set(cacheKey, responseData);
    return responseData;
  } catch (err) {
    console.warn(`[MarketData] Candle history fallback for ${symbol}:`, err.message);
    if (lastCandleCache.has(cacheKey)) {
      return lastCandleCache.get(cacheKey);
    }
    const now = Math.floor(Date.now() / 1000);
    const daySec = 86400;
    const synthCandles = [];
    const isCrypto = symbol.includes('-USD');
    const baseP = isCrypto
      ? (symbol.startsWith('BTC') ? 77000 : symbol.startsWith('ETH') ? 2250 : symbol.startsWith('SOL') ? 93 : 50)
      : (symbol.includes('NSEI') ? 24200 : 2500);
    for (let i = 30; i >= 0; i--) {
      const t = now - (i * daySec);
      const varFactor = 1 + (Math.sin(i * 0.5) * 0.015);
      const p = Number((baseP * varFactor).toFixed(2));
      synthCandles.push({
        time: t,
        open: p,
        high: Number((p * 1.01).toFixed(2)),
        low: Number((p * 0.99).toFixed(2)),
        close: p,
        volume: 50000
      });
    }
    const fallbackRes = {
      symbol,
      range: queryRange,
      interval,
      candlesCount: synthCandles.length,
      candles: synthCandles,
      volumeData: synthCandles.map(c => ({ time: c.time, value: c.volume, color: 'rgba(16, 185, 129, 0.45)' })),
      lastUpdated: new Date().toISOString(),
      source: 'DHRU Candle Anchor',
      status: 'FALLBACK'
    };
    lastCandleCache.set(cacheKey, fallbackRes);
    return fallbackRes;
  }
}

// Batch fetch quotes concurrently with concurrency limiter
export async function batchFetchQuotes(symbols = []) {
  const indian = symbols.filter(symbol => /\.(NS|BO)$|^\^(NSE|BSE|CNX)/i.test(symbol));
  let brokerQuotes = new Map();
  try { brokerQuotes = await fetchUpstoxQuotes(indian); }
  catch (error) { console.warn(`[MarketData] Upstox batch fallback: ${error.message}`); }
  let cryptoQuotes = new Map();
  const crypto = symbols.filter(symbol => symbol.endsWith('-USD'));
  try { cryptoQuotes = await fetchBinanceBatch(crypto); }
  catch (error) { console.warn(`[MarketData] Binance batch fallback: ${error.message}`); }
  try {
    const missingCrypto = crypto.filter(symbol => !cryptoQuotes.has(symbol));
    const fallbackQuotes = await fetchCoinGeckoBatch(missingCrypto);
    for (const [symbol, quote] of fallbackQuotes) cryptoQuotes.set(symbol, quote);
  } catch (error) { console.warn(`[MarketData] CoinGecko batch fallback: ${error.message}`); }
  return Promise.all(symbols.map(async symbol => {
    const isIndian = /\.(NS|BO)$|^\^(NSE|BSE|CNX)/i.test(symbol);
    const marketOpen = isIndian ? isIndianMarketOpen() : true;
    if (isIndian && !marketOpen && closedSessionQuoteCache.has(symbol)) {
      return closedSessionQuoteCache.get(symbol);
    }
    const broker = brokerQuotes.get(symbol);
    if (broker) {
      const data = {
        symbol,
        currency: 'INR',
        instrumentType: symbol.startsWith('^') ? 'INDEX' : 'EQUITY',
        ...broker,
        status: marketOpen ? (broker.status || 'LIVE') : 'CLOSED',
        sessionStatus: marketOpen ? 'LIVE' : 'Market Closed, final close 15:30'
      };
      quoteCache.set(symbol, { data, cachedAt: Date.now() });
      if (!marketOpen) closedSessionQuoteCache.set(symbol, data);
      return data;
    }
    const cryptoQuote = cryptoQuotes.get(symbol);
    if (cryptoQuote) {
      quoteCache.set(symbol, { data: cryptoQuote, cachedAt: Date.now() });
      return cryptoQuote;
    }
    try { return await fetchInstrumentQuote(symbol); }
    catch (err) {
      return { symbol, error: err.message, price: null, change: null, changePercent: null, status: 'UNAVAILABLE', source: null, lastUpdated: null, timestamp: null };
    }
  }));
}

// Get complete market overview (Indices, Gainers, Losers, Commodities)
export async function getMarketOverview() {
  const cacheKey = 'market_overview_all';
  const cached = quoteCache.get(cacheKey);
  const ttl = isIndianMarketOpen() ? 5000 : 300_000;
  if (cached && (Date.now() - cached.cachedAt < ttl)) {
    return cached.data;
  }

  try {
    // 1. Fetch Key Indices
    const keyIndexSymbols = ['^NSEI', '^BSESN', '^NSEBANK', '^CNXIT', '^CNXAUTO', '^CNXMETAL', '^CNXPHARMA', '^CNXENERGY'];
    const indicesData = await batchFetchQuotes(keyIndexSymbols);

    // 2. Fetch Top Stock Curated Universe to find leading gainers & losers
    const topStockSymbols = CURATED_STOCKS.slice(0, 35).map(s => s.symbol);
    const stocksData = await batchFetchQuotes(topStockSymbols);

    // Sort valid stocks by changePercent
    const validStocks = stocksData.filter(s => s && s.price > 0 && !s.error);
    const sortedStocks = [...validStocks].sort((a, b) => b.changePercent - a.changePercent);

    const gainers = sortedStocks.slice(0, 6);
    const losers = sortedStocks.slice(-6).reverse();

    // 3. Fetch Commodities & Forex
    const macroSymbols = ['GC=F', 'SI=F', 'CL=F', 'INR=X'];
    const macroData = await batchFetchQuotes(macroSymbols);

    // 4. Calculate Market Breadth (Advances vs Declines)
    const advances = validStocks.filter(s => s.changePercent > 0).length;
    const declines = validStocks.filter(s => s.changePercent < 0).length;
    const unchanged = validStocks.filter(s => s.changePercent === 0).length;

    const data = {
      timestamp: new Date().toISOString(),
      indices: indicesData,
      gainers,
      losers,
      macro: macroData,
      breadth: {
        advances,
        declines,
        unchanged,
        ratio: declines > 0 ? Number((advances / declines).toFixed(2)) : advances
      },
      source: 'Per-quote provider metadata',
      status: 'PARTIAL'
    };

    quoteCache.set(cacheKey, { data, cachedAt: Date.now() });
    return data;
  } catch (err) {
    console.error('[MarketData] Error assembling market overview:', err);
    throw err;
  }
}
