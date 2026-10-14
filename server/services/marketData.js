// DHRU.AI - Genuine Market Data Service
// Connects to public exchange feeds (Yahoo Finance query endpoints for NSE/BSE)
// Provides OHLCV candles, real-time/delayed quotes, caching and rate-limiting.

import { INDICES, COMMODITIES_FOREX, ETFS, CURATED_STOCKS } from '../data/instruments.js';

// In-memory quote & candle cache
const quoteCache = new Map();
const candleCache = new Map();

const CACHE_TTL_MS = 60 * 1000; // 1 minute memory cache for single quotes
const BATCH_CACHE_TTL_MS = 90 * 1000; // 1.5 minutes for batch summaries

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

export async function fetchInstrumentQuote(symbol) {
  const cached = quoteCache.get(symbol);
  if (cached && (Date.now() - cached.cachedAt < CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    const encodedSym = encodeURIComponent(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSym}?range=1d&interval=1d`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
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
    const price = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
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
      lastUpdated: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
      timestampEpoch: meta.regularMarketTime || Math.floor(Date.now() / 1000),
      source: 'NSE / Yahoo Finance Public Feed',
      status: 'Delayed 15m / Latest Official Exchange Settlement',
      instrumentType: meta.instrumentType || 'EQUITY'
    };

    quoteCache.set(symbol, { data, cachedAt: Date.now() });
    return data;
  } catch (err) {
    console.error(`[MarketData] Error fetching quote for ${symbol}:`, err.message);
    // If we have stale cache, return it with warning
    if (cached) {
      return { ...cached.data, staleWarning: true, error: err.message };
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

  try {
    const encodedSym = encodeURIComponent(symbol);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodedSym}?range=${queryRange}&interval=${queryInterval}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' },
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
        rawCandles.push({
          time: t,
          open: Number(o.toFixed(2)),
          high: Number(h.toFixed(2)),
          low: Number(l.toFixed(2)),
          close: Number(c.toFixed(2)),
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
        aggCandles.push({
          time: chunk[0].time,
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
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
      lastUpdated: new Date().toISOString(),
      source: 'NSE / Global Multi-Market OHLCV Feed'
    };

    candleCache.set(cacheKey, { data: responseData, cachedAt: Date.now() });
    return responseData;
  } catch (err) {
    console.error(`[MarketData] Error fetching candles for ${symbol}:`, err.message);
    if (cached) return cached.data;
    throw err;
  }
}

// Batch fetch quotes concurrently with concurrency limiter
export async function batchFetchQuotes(symbols = []) {
  const results = [];
  const chunkSize = 8; // Fetch in polite batches of 8

  for (let i = 0; i < symbols.length; i += chunkSize) {
    const chunk = symbols.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(sym => 
      fetchInstrumentQuote(sym).catch(err => ({
        symbol: sym,
        error: err.message,
        price: 0,
        change: 0,
        changePercent: 0
      }))
    );
    const chunkResults = await Promise.all(chunkPromises);
    results.push(...chunkResults);
  }

  return results;
}

// Get complete market overview (Indices, Gainers, Losers, Commodities)
export async function getMarketOverview() {
  const cacheKey = 'market_overview_all';
  const cached = quoteCache.get(cacheKey);
  if (cached && (Date.now() - cached.cachedAt < BATCH_CACHE_TTL_MS)) {
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
      source: 'NSE, BSE, MCX Official Feeds via Public Aggregator',
      status: 'Delayed 15m / Latest Available Official Feed'
    };

    quoteCache.set(cacheKey, { data, cachedAt: Date.now() });
    return data;
  } catch (err) {
    console.error('[MarketData] Error assembling market overview:', err);
    throw err;
  }
}
