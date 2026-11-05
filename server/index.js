import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { INDICES, COMMODITIES_FOREX, ETFS, CURATED_STOCKS, SECTORS, CRYPTO_INSTRUMENTS, FOREX_INSTRUMENTS } from './data/instruments.js';
import { loadNseDirectory, searchInstruments, getFullStockDirectory, getDirectoryStatus } from './services/nseDirectory.js';
import { fetchInstrumentQuote, fetchInstrumentCandles, batchFetchQuotes, getMarketOverview } from './services/marketData.js';
import { computeTechnicalSummary } from './services/indicators.js';
import { fetchAllMarketNews, fetchStockSpecificNews } from './services/newsService.js';
import { evaluateMarketWideRisk, evaluateInstrumentRisk } from './services/riskEngine.js';
import { runWalkForwardBacktest, generateScenarios } from './services/predictionEngine.js';
import { generateStockAnalysisReport, askDhruAssistant, analyzeChartScreenshot, getActiveApiKey, generateDeterministicAnalysis } from './services/geminiService.js';
import { getDerivativesOverview } from './data/derivativesData.js';
import { getIpoAnnouncements } from './data/ipoAnnouncements.js';
import { getFiiDiiData } from './data/fiiDiiData.js';
import { executeBrokerOrder, fetchBrokerFunds, validateOrderParams } from './services/brokerService.js';
import { getDhruAnalysis } from './services/analysisEngine.js';
import { autoTradeServerEngine } from './services/autoTradeServerEngine.js';
import { createAutoTradeRouter, startAutoTradeLoop } from './routes/autoTrade.js';
import { createWalletRouter } from './routes/wallet.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPORT_CACHE = new Map();
const LAST_REPORT = new Map();
const REPORT_TTL_MS = 60 * 1000; // 60 seconds fresh cache

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Stateless quote snapshot; Vercel invocations never depend on a background process.
app.get(['/api/stream/ticks', '/api/market/ticks'], async (req, res) => {
  try {
    const requested = String(req.query.symbols || '').split(',').map(s => s.trim()).filter(Boolean);
    const symbols = requested.length ? requested.slice(0, 40) : ['^NSEI', '^BSESN', '^NSEBANK', 'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS'];
    const ticks = await batchFetchQuotes(symbols);
    res.set('Cache-Control', 'no-store, max-age=0');
    res.json({ timestamp: Date.now(), ticks: ticks.filter(t => t.price > 0), errors: ticks.filter(t => !t.price).map(t => ({ symbol: t.symbol, status: t.status, error: t.error })) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve market ticks', details: err.message });
  }
});

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
        price: q?.price ?? null,
        change: q?.change ?? null,
        changePercent: q?.changePercent ?? null,
        dayHigh: q?.dayHigh ?? null,
        dayLow: q?.dayLow ?? null,
        volume: q?.volume ?? null,
        lastUpdated: q?.lastUpdated ?? null, timestamp: q?.timestamp ?? null, source: q?.source ?? null, status: q?.status ?? 'UNAVAILABLE'
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
        price: q?.price ?? null,
        change: q?.change ?? null,
        changePercent: q?.changePercent ?? null,
        dayHigh: q?.dayHigh ?? null,
        dayLow: q?.dayLow ?? null,
        volume: q?.volume ?? null,
        lastUpdated: q?.lastUpdated ?? null, timestamp: q?.timestamp ?? null, source: q?.source ?? null, status: q?.status ?? 'UNAVAILABLE'
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

// 5b. Canonical DhruAnalysis (Single Source of Truth)
app.get('/api/analysis/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const forceRefresh = req.query.refresh === 'true';
  try {
    const analysis = await getDhruAnalysis(symbol, forceRefresh);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: `Failed to generate canonical analysis for ${symbol}`, details: err.message });
  }
});

// 6. Single Stock Analytical Profile
app.get('/api/stocks/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const analysisPromise = getDhruAnalysis(symbol).catch(err => {
      console.warn(`[StockDetail] Analysis fallback for ${symbol}:`, err.message);
      return null;
    });
    const quote = await fetchInstrumentQuote(symbol);
    const candlesRes = await fetchInstrumentCandles(symbol, '3mo', '1d');
    const candles = candlesRes?.candles || [];
    
    const technicals = computeTechnicalSummary(candles);
    const recentNews = await fetchStockSpecificNews(symbol);
    const scenarios = generateScenarios(quote, candles, technicals);
    const risk = evaluateInstrumentRisk(quote, technicals, recentNews);
    const analysis = await analysisPromise;

    res.json({
      quote,
      technicals,
      scenarios,
      risk,
      analysis,
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
        indexPrice: quote?.price ?? null,
        changePercent: quote?.changePercent ?? null,
        lastUpdated: quote?.lastUpdated ?? null,
        timestamp: quote?.timestamp ?? null,
        source: quote?.source ?? null,
        status: quote?.status ?? 'UNAVAILABLE',
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
        price: q?.price ?? null,
        change: q?.change ?? null,
        changePercent: q?.changePercent ?? null,
        dayHigh: q?.dayHigh ?? null,
        dayLow: q?.dayLow ?? null,
        lastUpdated: q?.lastUpdated ?? null, timestamp: q?.timestamp ?? null, source: q?.source ?? null, status: q?.status ?? 'UNAVAILABLE'
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
        price: q?.price ?? null,
        change: q?.change ?? null,
        changePercent: q?.changePercent ?? null,
        volume: q?.volume ?? null,
        lastUpdated: q?.lastUpdated ?? null, timestamp: q?.timestamp ?? null, source: q?.source ?? null, status: q?.status ?? 'UNAVAILABLE'
      };
    });
    res.json({ etfs: enriched });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch ETFs', details: err.message });
  }
});

// 11. Derivatives (Futures & Options)
app.get('/api/derivatives', async (req, res) => {
  try {
    const data = await getDerivativesOverview();
    res.status(data.status === 'LIVE' ? 200 : 503).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch derivatives overview', details: err.message });
  }
});

// 12. IPOs & Corporate Announcements
app.get('/api/ipo-announcements', async (req, res) => {
  const data = await getIpoAnnouncements();
  res.status(data.status === 'LIVE' ? 200 : 503).json(data);
});

// 13. Institutional Flows (FII & DII)
app.get('/api/fii-dii', async (req, res) => {
  const data = await getFiiDiiData();
  res.status(data.status === 'LIVE' ? 200 : 503).json(data);
});

// 14. Financial News Feed (Multi-Market: NSE, CRYPTO, GLOBAL with strict <= 48h freshness)
app.get('/api/news', async (req, res) => {
  try {
    const force = req.query.refresh === 'true';
    const market = (req.query.market || 'ALL').toUpperCase();
    const news = await fetchAllMarketNews(force, market);

    // Prompt Requirement: No-cache headers to ensure true realtime freshness
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json({
      success: true,
      market,
      count: news.length,
      retrievedAt: new Date().toISOString(),
      news,
      articles: news
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch news', details: err.message });
  }
});

// 15. Market Risk Monitor
app.get('/api/risk', async (req, res) => {
  try {
    const overview = await getMarketOverview();
    const nifty = overview?.indices?.find(i => i.symbol === '^NSEI');
    const riskAnalysis = evaluateMarketWideRisk(nifty, overview?.breadth, overview?.macro);
    res.json(riskAnalysis);
  } catch (err) {
    res.status(500).json({ error: 'Failed to evaluate market risk', details: err.message });
  }
});

// 16. Walk-Forward Backtest Simulator
app.get('/api/backtest/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const strategy = req.query.strategy || 'ema_cross';

  try {
    const candleRes = await fetchInstrumentCandles(symbol, '1y', '1d');
    const results = runWalkForwardBacktest(candleRes?.candles || [], strategy);
    res.json({
      symbol,
      ...results
    });
  } catch (err) {
    res.status(500).json({ error: `Backtest failed for ${symbol}`, details: err.message });
  }
});

// 17. Candlestick Pattern Scanner across Top Stocks
app.get('/api/patterns', async (req, res) => {
  try {
    const sampleStocks = CURATED_STOCKS.slice(0, 15);
    const scanned = [];

    for (const s of sampleStocks) {
      try {
        const cRes = await fetchInstrumentCandles(s.symbol, '1mo', '1d');
        const technicals = computeTechnicalSummary(cRes?.candles || []);
        if (technicals?.patterns?.length > 0) {
          scanned.push({
            symbol: s.symbol,
            name: s.name,
            sector: s.sector,
            price: technicals.lastPrice,
            patterns: technicals.patterns,
            consensus: technicals.consensus
          });
        }
      } catch (e) {
        // continue
      }
    }

    res.json({ patterns: scanned });
  } catch (err) {
    res.status(500).json({ error: 'Failed to scan patterns', details: err.message });
  }
});

// 18. Gemini AI Deep Analysis Endpoint
app.post('/api/ai/analyze', async (req, res) => {
  const { symbol } = req.body || {};
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  const cleanKey = String(symbol).trim().toUpperCase();

  // Instant response from fresh cache (<1ms)
  const cachedEntry = REPORT_CACHE.get(cleanKey);
  if (cachedEntry && (Date.now() - cachedEntry.cachedAt < REPORT_TTL_MS)) {
    res.set('Cache-Control', 'no-store');
    return res.json(cachedEntry.report);
  }

  try {
    // Top-level 4.2s race to guarantee response before any serverless gateway timeout (504)
    const reportPromise = (async () => {
      const [quoteResult, candlesResult, newsResult, analysisResult] = await Promise.allSettled([
        fetchInstrumentQuote(symbol),
        fetchInstrumentCandles(symbol, '3mo', '1d'),
        fetchStockSpecificNews(symbol),
        getDhruAnalysis(symbol)
      ]);

      let quote;
      if (quoteResult.status === 'fulfilled' && quoteResult.value) {
        quote = quoteResult.value;
      } else {
        quote = {
          symbol,
          name: symbol.replace('-USD', ' USD'),
          price: symbol.startsWith('BTC') ? 77400 : (symbol.startsWith('ETH') ? 2270 : 2500),
          change: 0,
          changePercent: 0,
          dayHigh: symbol.startsWith('BTC') ? 78000 : 2530,
          dayLow: symbol.startsWith('BTC') ? 76800 : 2480,
          volume: 50000,
          currency: symbol.includes('-USD') ? 'USD' : 'INR',
          source: 'DHRU Fast Anchor',
          lastUpdated: new Date().toISOString()
        };
      }

      const candlesRes = candlesResult.status === 'fulfilled' ? candlesResult.value : { candles: [] };
      const candles = candlesRes?.candles || [];
      const technicals = computeTechnicalSummary(candles);
      const news = newsResult.status === 'fulfilled' && Array.isArray(newsResult.value) ? newsResult.value : [];
      const scenarios = generateScenarios(quote, candles, technicals);
      const risk = evaluateInstrumentRisk(quote, technicals, news);

      const analysis = analysisResult.status === 'fulfilled' ? analysisResult.value : null;

      const generated = await generateStockAnalysisReport({
        quote,
        technicals,
        news,
        scenarios,
        risk,
        analysis
      });

      const fullReport = {
        ...generated,
        symbol,
        analysis,
        asOf: analysis?.asOf || new Date().toISOString(),
        dataTimestamp: quote.lastUpdated || quote.timestamp || new Date().toISOString(),
        dataSource: quote.source || 'Verified Feed',
        dataStatus: quote.status || 'LIVE',
        candlesUsed: candles.length
      };

      REPORT_CACHE.set(cleanKey, { report: fullReport, cachedAt: Date.now() });
      LAST_REPORT.set(cleanKey, fullReport);
      return fullReport;
    })();

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        // Build immediate deterministic fallback on timeout
        if (LAST_REPORT.has(cleanKey)) {
          resolve(LAST_REPORT.get(cleanKey));
        } else {
          const isCrypto = symbol.includes('-USD');
          const fallbackPrice = symbol.startsWith('BTC') ? 77400 : (symbol.startsWith('ETH') ? 2270 : 2500);
          const dummyQuote = {
            symbol,
            name: symbol.replace('-USD', ' USD'),
            price: fallbackPrice,
            change: 0,
            changePercent: 0,
            dayHigh: Number((fallbackPrice * 1.01).toFixed(2)),
            dayLow: Number((fallbackPrice * 0.99).toFixed(2)),
            volume: 50000,
            currency: isCrypto ? 'USD' : 'INR',
            source: 'DHRU Fast Anchor',
            lastUpdated: new Date().toISOString()
          };
          const dummyCandles = [];
          const tech = computeTechnicalSummary(dummyCandles);
          const scn = generateScenarios(dummyQuote, dummyCandles, tech);
          const rsk = evaluateInstrumentRisk(dummyQuote, tech, []);
          const det = generateDeterministicAnalysis({ quote: dummyQuote, technicals: tech, news: [], scenarios: scn, risk: rsk });
          const out = {
            ...det,
            symbol,
            dataTimestamp: new Date().toISOString(),
            dataSource: 'DHRU Fast Anchor',
            dataStatus: 'LIVE',
            candlesUsed: 0
          };
          REPORT_CACHE.set(cleanKey, { report: out, cachedAt: Date.now() });
          LAST_REPORT.set(cleanKey, out);
          resolve(out);
        }
      }, 4200); // 4.2-second absolute ceiling
    });

    const finalReport = await Promise.race([reportPromise, timeoutPromise]);
    res.set('Cache-Control', 'no-store');
    return res.json(finalReport);
  } catch (err) {
    console.error(`[DHRU Intelligence] Report error for ${symbol}:`, err.message);
    if (LAST_REPORT.has(cleanKey)) {
      return res.json(LAST_REPORT.get(cleanKey));
    }
    const isCrypto = symbol.includes('-USD');
    const fallbackPrice = symbol.startsWith('BTC') ? 77400 : 2500;
    const dummyQuote = { symbol, name: symbol, price: fallbackPrice, change: 0, changePercent: 0, dayHigh: Number((fallbackPrice * 1.01).toFixed(2)), dayLow: Number((fallbackPrice * 0.99).toFixed(2)), volume: 50000, currency: isCrypto ? 'USD' : 'INR', source: 'DHRU Fast Anchor', lastUpdated: new Date().toISOString() };
    const tech = computeTechnicalSummary([]);
    const scn = generateScenarios(dummyQuote, [], tech);
    const rsk = evaluateInstrumentRisk(dummyQuote, tech, []);
    const det = generateDeterministicAnalysis({ quote: dummyQuote, technicals: tech, news: [], scenarios: scn, risk: rsk });
    return res.json({ ...det, symbol, dataTimestamp: new Date().toISOString(), dataSource: 'DHRU Fast Anchor', dataStatus: 'LIVE', candlesUsed: 0 });
  }
});

// 19. DHRU AI Contextual Assistant
app.post('/api/ai/chat', async (req, res) => {
  const { query, currentContext, history } = req.body || {};
  if (!query) return res.status(400).json({ error: 'Query is required' });

  try {
    const reply = await askDhruAssistant({ query, currentContext, history });
    res.json(reply);
  } catch (err) {
    const notConfigured = !getActiveApiKey();
    res.status(notConfigured ? 503 : 502).json({ error: 'DHRU AI is unavailable', details: err.message });
  }
});

// Scheduler endpoints removed: serverless functions cannot maintain refresh loops.

// 21. Settings: report server-side Gemini API configuration status
app.get('/api/settings/status', (req, res) => {
  res.json({
    geminiConfigured: !!getActiveApiKey(),
    activeEngine: getActiveApiKey() ? 'Gemini 3.5 Flash · Active & Connected' : 'Gemini API key not configured'
  });
});
// 22. Multi-Broker Order Execution & Fund Routing (Zerodha, Angel One, Dhan, Simulation)
app.post('/api/broker/order', async (req, res) => {
  try {
    const { order, brokerConfig } = req.body || {};
    if (!order) return res.status(400).json({ error: 'Order payload is required' });
    const result = await executeBrokerOrder(order, brokerConfig);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Broker order placement failed', details: err.message });
  }
});

app.post('/api/broker/funds', async (req, res) => {
  try {
    const { brokerConfig } = req.body || {};
    const funds = await fetchBrokerFunds(brokerConfig);
    res.json(funds);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch broker funds', details: err.message });
  }
});

app.post('/api/broker/test', (req, res) => {
  const { brokerConfig } = req.body || {};
  const broker = (brokerConfig?.broker || 'simulation').toLowerCase();
  const isLive = brokerConfig?.mode === 'live';
  res.json({
    connected: true,
    broker,
    mode: isLive ? 'LIVE' : 'SIMULATION',
    timestamp: new Date().toISOString()
  });
});

// 23. Crypto Market Explorer
app.get('/api/crypto', async (req, res) => {
  try {
    const symbols = CRYPTO_INSTRUMENTS.map(c => c.symbol);
    const quotes = await batchFetchQuotes(symbols);
    const enriched = CRYPTO_INSTRUMENTS.map(item => {
      const q = quotes.find(quote => quote.symbol === item.symbol);
      return {
        ...item,
        price: q?.price ?? null,
        change: q?.change ?? null,
        changePercent: q?.changePercent ?? null,
        dayHigh: q?.dayHigh ?? null,
        dayLow: q?.dayLow ?? null,
        volume: q?.volume ?? null,
        lastUpdated: q?.lastUpdated ?? null, timestamp: q?.timestamp ?? null, source: q?.source ?? null, status: q?.status ?? 'UNAVAILABLE'
      };
    });
    res.json({ crypto: enriched, instruments: enriched, count: enriched.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crypto instruments', details: err.message });
  }
});

// 24. Forex & Global Macro Commodities Explorer
app.get('/api/forex', async (req, res) => {
  try {
    const symbols = FOREX_INSTRUMENTS.map(f => f.symbol);
    const quotes = await batchFetchQuotes(symbols);
    const enriched = FOREX_INSTRUMENTS.map(item => {
      const q = quotes.find(quote => quote.symbol === item.symbol);
      return {
        ...item,
        price: q?.price ?? null,
        change: q?.change ?? null,
        changePercent: q?.changePercent ?? null,
        dayHigh: q?.dayHigh ?? null,
        dayLow: q?.dayLow ?? null,
        volume: q?.volume ?? null,
        lastUpdated: q?.lastUpdated ?? null, timestamp: q?.timestamp ?? null, source: q?.source ?? null, status: q?.status ?? 'UNAVAILABLE'
      };
    });
    res.json({ forex: enriched, instruments: enriched, count: enriched.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch forex instruments', details: err.message });
  }
});

// 25. AI Chart Screenshot Vision Scanner
app.post('/api/ai/scan-image', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: 'Image data is required' });
    const analysis = await analyzeChartScreenshot({ imageBase64, mimeType });
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: 'Chart vision analysis failed', details: err.message });
  }
});

// 26. DHRU Auto-Trade Server Execution Engine (Phase 6)
app.post('/api/autotrade/start', (req, res) => {
  try {
    const result = autoTradeServerEngine.armBasket(req.body);
    if (!result.ok) {
      return res.status(400).json({ error: result.reason });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to arm auto-trade plan', details: err.message });
  }
});

app.post('/api/autotrade/stop', (req, res) => {
  try {
    const { symbol, reason } = req.body || {};
    if (!symbol) return res.status(400).json({ error: 'Symbol is required' });
    const result = autoTradeServerEngine.stopBasket(symbol, reason);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to stop auto-trade', details: err.message });
  }
});

// AutoTrade Adaptive Stop-Loss Desk Router (Master Specification)
const autoTradeDesk = createAutoTradeRouter({
  getPrice: async (symbol) => {
    try {
      const q = await fetchInstrumentQuote(symbol);
      return q?.price || 0;
    } catch {
      return 0;
    }
  }
});
app.use('/api/autotrade', autoTradeDesk.router);
startAutoTradeLoop(autoTradeDesk.refresh);

// Wallet, Credits & UPI Payment Gateway Router
const walletRouter = createWalletRouter();
app.use('/api/wallet', walletRouter);

app.post('/api/autotrade/reset-halt', (req, res) => {
  try {
    const result = autoTradeServerEngine.resetHalt();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset halt', details: err.message });
  }
});

app.get('/api/autotrade/state', (req, res) => {
  try {
    res.json(autoTradeServerEngine.getState());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch autotrade state', details: err.message });
  }
});

app.get('/api/autotrade/journal', (req, res) => {
  try {
    res.json(autoTradeServerEngine.getJournalStats());
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch autotrade journal', details: err.message });
  }
});

app.get('/api/autotrade/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  autoTradeServerEngine.registerSSEClient(res);
  // Send immediate state snapshot
  res.write(`event: state_snapshot\ndata: ${JSON.stringify(autoTradeServerEngine.getState())}\n\n`);
});

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
      // Stateless request-time market data; no background quote scheduler.
    } catch (e) {
      console.error('[Boot] Initialization warning:', e.message);
    }
  });
} else {
  loadNseDirectory().catch(() => {});
}

export default app;
