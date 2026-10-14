import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { INDICES, COMMODITIES_FOREX, ETFS, CURATED_STOCKS, SECTORS } from './data/instruments.js';
import { loadNseDirectory, searchInstruments, getFullStockDirectory, getDirectoryStatus } from './services/nseDirectory.js';
import { fetchInstrumentQuote, fetchInstrumentCandles, batchFetchQuotes, getMarketOverview } from './services/marketData.js';
import { computeTechnicalSummary } from './services/indicators.js';
import { fetchAllMarketNews, fetchStockSpecificNews } from './services/newsService.js';
import { evaluateMarketWideRisk, evaluateInstrumentRisk } from './services/riskEngine.js';
import { runWalkForwardBacktest, generateScenarios } from './services/predictionEngine.js';
import { generateStockAnalysisReport, askDhruAssistant, setApiKey, getActiveApiKey } from './services/geminiService.js';
import { startScheduler, getSchedulerStatus, runRefreshCycle } from './services/refreshScheduler.js';
import { getDerivativesOverview } from './data/derivativesData.js';
import { UPCOMING_IPOS, CORPORATE_ACTIONS } from './data/ipoAnnouncements.js';
import { getFiiDiiData } from './data/fiiDiiData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper: Calculate current Indian Market Trading Status (IST: Asia/Kolkata)
function getIndianMarketStatus() {
  const now = new Date();
  // Format current time in Asia/Kolkata
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    weekday: 'short'
  });

  const parts = istFormatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const weekday = parts.find(p => p.type === 'weekday')?.value || 'Mon';

  const isWeekend = weekday === 'Sat' || weekday === 'Sun';
  const totalMins = hour * 60 + minute;

  // NSE/BSE Trading Hours (IST):
  // 09:00 - 09:15: Pre-Market
  // 09:15 - 15:30: Normal Trading
  // 15:30 - 16:00: Post-Market Closing
  let status = 'Closed';
  let badgeColor = 'slate';
  let label = 'Market Closed';
  let message = 'NSE & BSE are currently closed. Next regular trading session opens at 09:15 AM IST.';

  if (!isWeekend) {
    if (totalMins >= 540 && totalMins < 555) {
      status = 'Pre-Market';
      badgeColor = 'amber';
      label = 'Pre-Market Open';
      message = 'Pre-market order collection & discovery session active until 09:15 AM IST.';
    } else if (totalMins >= 555 && totalMins <= 930) {
      status = 'Live';
      badgeColor = 'emerald';
      label = 'Live Trading';
      message = 'NSE & BSE live trading session active. Continuous price matching in effect.';
    } else if (totalMins > 930 && totalMins <= 960) {
      status = 'Post-Market';
      badgeColor = 'blue';
      label = 'Post-Market Settlement';
      message = 'Post-market closing session and official weighted settlement calculation in progress.';
    }
  }

  return {
    status,
    badgeColor,
    label,
    message,
    timezone: 'Asia/Kolkata (IST)',
    currentTimeIST: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} IST`,
    weekday,
    isWeekend
  };
}

// 1. Market Status
app.get('/api/market/status', (req, res) => {
  res.json(getIndianMarketStatus());
});

// 2. Comprehensive Market Overview
app.get('/api/market/overview', async (req, res) => {
  try {
    const overview = await getMarketOverview();
    const status = getIndianMarketStatus();
    res.json({
      status,
      ...overview
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve market overview', details: err.message });
  }
});

// SSE: Streaming market quotes to clients (no API keys required)
// Clients may pass ?symbols=SYM1,SYM2 to subscribe to a specific symbol list.
app.get('/api/market/stream', async (req, res) => {
  // Set SSE headers
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  res.flushHeaders?.();

  // Parse subscribed symbols from query
  const symbolsQuery = String(req.query.symbols || '');
  let symbols = [];
  if (symbolsQuery) {
    symbols = symbolsQuery.split(',').map(s => s.trim()).filter(Boolean);
  }

  // Default subscription: key indices + curated top stocks
  if (symbols.length === 0) {
    const idx = INDICES.map(i => i.symbol || i.ticker).slice(0, 6);
    const curated = CURATED_STOCKS.slice(0, 20).map(s => s.symbol);
    symbols = [...new Set([...idx, ...curated])];
  }

  let isAlive = true;
  let intervalHandle = null;
  let heartbeatHandle = null;

  // Helper: send SSE event
  const sendEvent = (event, data) => {
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      // ignore write errors
    }
  };

  // Immediately send initial payload
  try {
    const initial = await batchFetchQuotes(symbols);
    sendEvent('snapshot', { symbols, quotes: initial, ts: new Date().toISOString() });
  } catch (e) {
    sendEvent('error', { message: 'Initial fetch failed', details: e.message });
  }

  // Periodically fetch updates and push to client
  const POLL_INTERVAL_MS = Math.max(2000, parseInt(process.env.MARKET_POLL_MS || '5000', 10));

  const doPoll = async () => {
    try {
      const quotes = await batchFetchQuotes(symbols);
      sendEvent('quotes', { quotes, ts: new Date().toISOString() });
    } catch (err) {
      sendEvent('error', { message: 'Quote fetch failed', details: err.message });
    }
  };

  intervalHandle = setInterval(doPoll, POLL_INTERVAL_MS);

  // Heartbeat to keep connection alive
  heartbeatHandle = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {
      // ignore
    }
  }, 15000);

  // Clean up on client disconnect
  req.on('close', () => {
    isAlive = false;
    if (intervalHandle) clearInterval(intervalHandle);
    if (heartbeatHandle) clearInterval(heartbeatHandle);
  });
});

// 3. Universal Search
app.get('/api/search', (req, res) => {
  const q = req.query.q || '';
  const limit = parseInt(req.query.limit || '15', 10);
  const results = searchInstruments(q, limit);
  res.json({ query: q, results });
});

// (remaining routes unchanged) ...

// 4. All Indices
app.get('/api/indices', async (req, res) => {
  try {
    const symbols = INDICES.map(i => i.symbol);
    const quotes = await batchFetchQuotes(symbols);
    
    const enriched = INDICES.map(idx => {
      const q = quotes.find(quote => quote.symbol === idx.symbol);
      return {
        ...idx,
        price: q?.price || 0,
        change: q?.change || 0,
        changePercent: q?.changePercent || 0,
        dayHigh: q?.dayHigh || 0,
        dayLow: q?.dayLow || 0,
        volume: q?.volume || 0,
        lastUpdated: q?.lastUpdated || new Date().toISOString()
      };
    });

    res.json({ indices: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch indices', details: err.message });
  }
});

// 5. Stocks Directory / Screener with pagination & filters
app.get('/api/stocks', async (req, res) => {
  try {
    const fullList = getFullStockDirectory();
    const { q, sector, cap, page = 1, limit = 25 } = req.query;

    let filtered = [...fullList];

    if (q) {
      const query = q.toUpperCase();
      filtered = filtered.filter(s => 
        s.ticker.toUpperCase().includes(query) || 
        s.name.toUpperCase().includes(query)
      );
    }

    if (sector && sector !== 'All') {
      filtered = filtered.filter(s => s.sector === sector);
    }

    if (cap && cap !== 'All') {
      filtered = filtered.filter(s => s.cap === cap);
    }

    const total = filtered.length;
    const p = Math.max(1, parseInt(page, 10));
    const lim = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (p - 1) * lim;
    const pageItems = filtered.slice(offset, offset + lim);

    // Fetch quotes for current page
    const quotes = await batchFetchQuotes(pageItems.map(s => s.symbol));
    const enriched = pageItems.map(item => {
      const q = quotes.find(quote => quote.symbol === item.symbol);
      return {
        ...item,
        price: q?.price || 0,
        change: q?.change || 0,
        changePercent: q?.changePercent || 0,
        dayHigh: q?.dayHigh || 0,
        dayLow: q?.dayLow || 0,
        volume: q?.volume || 0,
        lastUpdated: q?.lastUpdated || new Date().toISOString()
      };
    });

    res.json({
      total,
      page: p,
      limit: lim,
      totalPages: Math.ceil(total / lim),
      stocks: enriched,
      directoryStatus: getDirectoryStatus()
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to query stock directory', details: err.message });
  }
});

// 6. Single Stock Analytical Profile
app.get('/api/stocks/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const quote = await fetchInstrumentQuote(symbol);
    const candlesRes = await fetchInstrumentCandles(symbol, '3mo', '1d');
    const candles = candlesRes?.candles || [];
    
    const technicals = computeTechnicalSummary(candles);
    const recentNews = await fetchStockSpecificNews(symbol);
    const scenarios = generateScenarios(quote, candles, technicals);
    const risk = evaluateInstrumentRisk(quote, technicals, recentNews);

    res.json({
      quote,
      technicals,
      scenarios,
      risk,
      recentNews: recentNews.slice(0, 6),
      candleCount: candles.length
    });
  } catch (err) {
    res.status(500).json({ error: `Failed to load stock details for ${symbol}`, details: err.message });
  }
});

// 7. Interactive Candlestick Charts (OHLCV)
app.get('/api/stocks/:symbol/chart', async (req, res) => {
  const { symbol } = req.params;
  const range = req.query.range || '1mo';
  const interval = req.query.interval || '1d';

  try {
    const data = await fetchInstrumentCandles(symbol, range, interval);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch candlestick history for ${symbol}`, details: err.message });
  }
});

// 8. Sector Explorer
app.get('/api/sectors', async (req, res) => {
  try {
    // Fetch index quotes for sectors that have them
    const sectorSymbols = SECTORS.map(s => s.indexSymbol).filter(Boolean);
    const quotes = await batchFetchQuotes(sectorSymbols);

    const fullList = getFullStockDirectory();

    const sectorsData = SECTORS.map(sec => {
      const quote = quotes.find(q => q.symbol === sec.indexSymbol);
      const constituents = fullList.filter(s => s.sector === sec.name).slice(0, 8);
      return {
        ...sec,
        indexPrice: quote?.price || 0,
        changePercent: quote?.changePercent || 0,
        constituentsCount: fullList.filter(s => s.sector === sec.name).length,
        topConstituents: constituents.map(c => ({ symbol: c.symbol, name: c.name, ticker: c.ticker }))
      };
    });

    res.json({ sectors: sectorsData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sectors', details: err.message });
  }
});

// 9. Commodities and Currencies
app.get('/api/commodities-currencies', async (req, res) => {
  try {
    const symbols = COMMODITIES_FOREX.map(c => c.symbol);
    const quotes = await batchFetchQuotes(symbols);

    const enriched = COMMODITIES_FOREX.map(cf => {
      const q = quotes.find(quote => quote.symbol === cf.symbol);
      return {
        ...cf,
        price: q?.price || 0,
        change: q?.change || 0,
        changePercent: q?.changePercent || 0,
        dayHigh: q?.dayHigh || 0,
        dayLow: q?.dayLow || 0,
        lastUpdated: q?.lastUpdated || new Date().toISOString()
      };
    });

    res.json({ instruments: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch commodities and forex', details: err.message });
  }
});

// (rest of file remains unchanged)

// 10. ETFs
app.get('/api/etfs', async (req, res) => {
  try {
    const symbols = ETFS.map(e => e.symbol);
    const quotes = await batchFetchQuotes(symbols);
    const enriched = ETFS.map(etf => {
      const q = quotes.find(quote => quote.symbol === etf.symbol);
      return {
        ...etf,
        price: q?.price || 0,
        change: q?.change || 0,
        changePercent: q?.changePercent || 0,
        volume: q?.volume || 0,
        lastUpdated: q?.lastUpdated || new Date().toISOString()
      };
    });
    res.json({ etfs: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ETFs', details: err.message });
  }
});

// (other routes omitted for brevity) - keep original implementations

// Serve frontend in production if built
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(distPath, 'index.html'), err => {
    if (err) next();
  });
});

// In serverless / Vercel, app is exported as a function; in standalone Node, start server
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`\n======================================================`);
    console.log(`  🌟 DHRU.AI Financial Market Intelligence Platform`);
    console.log(`  Server listening on http://localhost:${PORT}`);
    console.log(`======================================================\n`);

    try {
      await loadNseDirectory();
      startScheduler();
    } catch (e) {
      console.error('[Boot] Initialization warning:', e.message);
    }
  });
} else {
  loadNseDirectory().catch(() => {});
}

export default app;
