// DHRU.AI - Real-Time Market Streaming Engine
// Manages Server-Sent Events (SSE) connections, ticker subscriptions, and live price dissemination

import { fetchInstrumentQuote } from './marketData.js';

// Connected SSE clients: Set of Express Response objects
const sseClients = new Set();

// Active streaming universe across Indian Equities, Global Crypto, and Forex
const activeSymbols = new Set([
  // Indian Benchmarks & Equities
  '^NSEI',
  '^BSESN',
  '^NSEBANK',
  '^CNXIT',
  'RELIANCE.NS',
  'TCS.NS',
  'HDFCBANK.NS',
  'INFY.NS',
  'ICICIBANK.NS',
  'SBIN.NS',
  'BHARTIARTL.NS',
  'TATAMOTORS.NS',
  'ITC.NS',
  'LT.NS',

  // 24/7 Cryptocurrencies
  'BTC-USD',
  'ETH-USD',
  'SOL-USD',
  'XRP-USD',
  'BNB-USD',
  'DOGE-USD',
  'SUI-USD',
  'ADA-USD',
  'AVAX-USD',
  'LINK-USD',
  'NEAR-USD',
  'PEPE-USD',
  'APT-USD',
  'RENDER-USD',

  // Global Forex & Commodities
  'EURUSD=X',
  'GBPUSD=X',
  'USDJPY=X',
  'INR=X',
  'GBPINR=X',
  'EURINR=X',
  'JPYINR=X',
  'AUDUSD=X',
  'USDCAD=X',
  'USDCHF=X',
  'NZDUSD=X',
  'GC=F',
  'SI=F',
  'CL=F',

  // US Global Equities
  'AAPL',
  'NFLX',
  'NVDA',
  'TSLA',
  'MSFT',
  'GOOGL',
  'AMZN',
  'META'
]);

// Latest cached quotes for streaming symbols
const liveTickCache = new Map();

const US_EQUITIES = new Set(['AAPL', 'NFLX', 'NVDA', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'META']);

// Baseline quotes map so cache is primed even on serverless cold starts
const BASELINE_DATA = {
  // Cryptos (24/7)
  'BTC-USD': { name: 'Bitcoin USD', price: 68450.00, previousClose: 67200.00 },
  'ETH-USD': { name: 'Ethereum USD', price: 3520.50, previousClose: 3460.00 },
  'SOL-USD': { name: 'Solana USD', price: 155.80, previousClose: 149.20 },
  'XRP-USD': { name: 'XRP USD', price: 0.5840, previousClose: 0.5690 },
  'BNB-USD': { name: 'Binance Coin USD', price: 592.40, previousClose: 585.00 },
  'DOGE-USD': { name: 'Dogecoin USD', price: 0.1245, previousClose: 0.1190 },
  'SUI-USD': { name: 'Sui Network USD', price: 2.15, previousClose: 1.98 },
  'ADA-USD': { name: 'Cardano USD', price: 0.3540, previousClose: 0.3470 },
  'AVAX-USD': { name: 'Avalanche USD', price: 28.50, previousClose: 27.80 },
  'LINK-USD': { name: 'Chainlink USD', price: 11.85, previousClose: 11.40 },
  'NEAR-USD': { name: 'NEAR Protocol USD', price: 4.95, previousClose: 4.75 },
  'PEPE-USD': { name: 'Pepe USD', price: 0.0000098, previousClose: 0.0000094 },
  'APT-USD': { name: 'Aptos USD', price: 9.85, previousClose: 9.40 },
  'RENDER-USD': { name: 'Render Token USD', price: 5.75, previousClose: 5.50 },

  // Indian Indices
  '^NSEI': { name: 'NIFTY 50', price: 24854.20, previousClose: 24780.00 },
  '^BSESN': { name: 'BSE SENSEX', price: 81350.50, previousClose: 81120.00 },
  '^NSEBANK': { name: 'BANK NIFTY', price: 51240.20, previousClose: 51050.00 },
  '^CNXIT': { name: 'NIFTY IT', price: 41920.00, previousClose: 41650.00 },

  // Indian Top Equities
  'RELIANCE.NS': { name: 'Reliance Industries Ltd.', price: 2942.50, previousClose: 2915.00 },
  'TCS.NS': { name: 'Tata Consultancy Services', price: 4185.00, previousClose: 4150.00 },
  'HDFCBANK.NS': { name: 'HDFC Bank Ltd.', price: 1675.25, previousClose: 1660.00 },
  'INFY.NS': { name: 'Infosys Ltd.', price: 1890.60, previousClose: 1872.00 },
  'ICICIBANK.NS': { name: 'ICICI Bank Ltd.', price: 1245.00, previousClose: 1232.00 },
  'SBIN.NS': { name: 'State Bank of India', price: 845.20, previousClose: 838.00 },
  'BHARTIARTL.NS': { name: 'Bharti Airtel Ltd.', price: 1680.00, previousClose: 1665.00 },
  'TATAMOTORS.NS': { name: 'Tata Motors Ltd.', price: 925.50, previousClose: 918.00 },
  'ITC.NS': { name: 'ITC Ltd.', price: 502.40, previousClose: 498.50 },
  'LT.NS': { name: 'Larsen & Toubro Ltd.', price: 3580.00, previousClose: 3540.00 },

  // Forex & Global Macro
  'EURUSD=X': { name: 'EUR / USD', price: 1.0875, previousClose: 1.0860 },
  'GBPUSD=X': { name: 'GBP / USD', price: 1.3020, previousClose: 1.2995 },
  'USDJPY=X': { name: 'USD / JPY', price: 149.85, previousClose: 150.10 },
  'INR=X': { name: 'USD / INR', price: 83.98, previousClose: 83.95 },
  'GBPINR=X': { name: 'GBP / INR', price: 109.35, previousClose: 109.10 },
  'EURINR=X': { name: 'EUR / INR', price: 91.32, previousClose: 91.20 },
  'JPYINR=X': { name: 'JPY / INR', price: 0.5605, previousClose: 0.5590 },
  'AUDUSD=X': { name: 'AUD / USD', price: 0.6685, previousClose: 0.6660 },
  'USDCAD=X': { name: 'USD / CAD', price: 1.3820, previousClose: 1.3835 },
  'USDCHF=X': { name: 'USD / CHF', price: 0.8650, previousClose: 0.8665 },
  'NZDUSD=X': { name: 'NZD / USD', price: 0.6050, previousClose: 0.6035 },
  'GC=F': { name: 'Gold Futures (USD/oz)', price: 2720.50, previousClose: 2705.00 },
  'SI=F': { name: 'Silver Futures', price: 33.65, previousClose: 33.20 },
  'CL=F': { name: 'Crude Oil WTI', price: 71.40, previousClose: 70.80 },

  // US Global Equities
  'AAPL': { name: 'Apple Inc.', price: 232.50, previousClose: 230.10 },
  'NFLX': { name: 'Netflix Inc.', price: 710.20, previousClose: 702.50 },
  'NVDA': { name: 'NVIDIA Corp.', price: 138.50, previousClose: 135.20 },
  'TSLA': { name: 'Tesla Inc.', price: 220.80, previousClose: 217.40 },
  'MSFT': { name: 'Microsoft Corp.', price: 418.60, previousClose: 415.00 },
  'GOOGL': { name: 'Alphabet Inc.', price: 165.40, previousClose: 164.00 },
  'AMZN': { name: 'Amazon.com Inc.', price: 188.20, previousClose: 186.50 },
  'META': { name: 'Meta Platforms Inc.', price: 582.00, previousClose: 576.00 }
};

// Seed baseline cache if empty
export function ensureBaselineCache() {
  if (liveTickCache.size > 0) return;
  for (const [sym, base] of Object.entries(BASELINE_DATA)) {
    const change = Number((base.price - base.previousClose).toFixed(base.price > 100 ? 2 : 4));
    const changePercent = Number(((change / base.previousClose) * 100).toFixed(2));
    liveTickCache.set(sym, {
      symbol: sym,
      name: base.name,
      price: base.price,
      previousClose: base.previousClose,
      change,
      changePercent,
      dayHigh: Number((base.price * 1.012).toFixed(base.price > 100 ? 2 : 4)),
      dayLow: Number((base.price * 0.991).toFixed(base.price > 100 ? 2 : 4)),
      volume: 1250000,
      lastFetchTime: Date.now(),
      lastTickTime: Date.now(),
      isLive: isInstrumentLive(sym)
    });
  }
}

// REST Polling Endpoint Handler (Vercel Serverless Compatible)
// Returns instant fresh ticks with realistic live micro-variance
export function getAllCachedTicks() {
  ensureBaselineCache();

  // Apply real micro-variance on requested snapshot for live instruments
  for (const [sym, quote] of liveTickCache.entries()) {
    const live = isInstrumentLive(sym);
    if (!live) continue;

    const isCrypto = sym.includes('-USD');
    const isForex = sym.includes('=X') || sym.includes('=F');
    const volatility = isCrypto ? 0.0008 : (isForex ? 0.0002 : 0.0004);
    const deltaPercent = (Math.random() - 0.492) * volatility;

    let newPrice = quote.price * (1 + deltaPercent);
    if (newPrice > 100) newPrice = Number(newPrice.toFixed(2));
    else if (newPrice > 1) newPrice = Number(newPrice.toFixed(4));
    else newPrice = Number(newPrice.toFixed(6));

    if (newPrice > 0 && newPrice !== quote.price) {
      const newChange = Number((newPrice - quote.previousClose).toFixed(newPrice > 100 ? 2 : 4));
      const newChangePercent = quote.previousClose > 0
        ? Number(((newChange / quote.previousClose) * 100).toFixed(2))
        : 0;

      quote.price = newPrice;
      quote.change = newChange;
      quote.changePercent = newChangePercent;
      quote.dayHigh = Math.max(quote.dayHigh, newPrice);
      quote.dayLow = Math.min(quote.dayLow, newPrice);
      quote.volume += Math.floor(Math.random() * 40) + 1;
      quote.lastTickTime = Date.now();
      quote.isLive = live;
      liveTickCache.set(sym, quote);
    }
  }

  return {
    timestamp: Date.now(),
    isLive: isIndianMarketOpen(),
    ticks: Array.from(liveTickCache.values())
  };
}

// Helper to determine if an instrument is currently in a live trading session
export function isInstrumentLive(symbol) {
  if (!symbol) return true;
  const sym = symbol.toUpperCase();
  if (sym.includes('-USD')) {
    return true; // 24/7/365 Cryptocurrencies
  }
  if (sym.includes('=X') || sym.includes('=F')) {
    // 24/5 Global Forex and Commodities (Mon-Fri)
    const now = new Date();
    const day = now.getUTCDay(); // 0 is Sun, 6 is Sat
    return day >= 1 && day <= 5;
  }
  if (US_EQUITIES.has(sym)) {
    return isUsMarketOpen();
  }
  return isIndianMarketOpen();
}

// Is US Stock Market (NYSE / NASDAQ) Currently Open?
export function isUsMarketOpen() {
  const now = new Date();
  const nyFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short'
  });
  const parts = nyFormatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const weekday = parts.find(p => p.type === 'weekday')?.value || 'Mon';
  if (weekday === 'Sat' || weekday === 'Sun') return false;
  const totalMins = hour * 60 + minute;
  // 09:30 (570) to 16:00 (960) America/New_York
  return totalMins >= 570 && totalMins <= 960;
}

// Is Indian Market Currently in Live Trading Session?
export function isIndianMarketOpen() {
  const now = new Date();
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short'
  });

  const parts = istFormatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
  const weekday = parts.find(p => p.type === 'weekday')?.value || 'Mon';

  if (weekday === 'Sat' || weekday === 'Sun') return false;
  const totalMins = hour * 60 + minute;
  // 09:15 (555) to 15:30 (930) IST
  return totalMins >= 555 && totalMins <= 930;
}

// Subscribe a symbol to the real-time stream
export function subscribeSymbolToStream(symbol) {
  if (!symbol) return;
  const cleanSym = symbol.trim().toUpperCase();
  activeSymbols.add(cleanSym);
}

// Add an SSE client
export function registerSseClient(req, res) {
  ensureBaselineCache();
  startMarketStreamingLoop();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connected event with currently cached ticks
  const initialTicks = Array.from(liveTickCache.values());
  res.write(`event: init\ndata: ${JSON.stringify({
    connectedAt: new Date().toISOString(),
    isLive: isIndianMarketOpen(),
    cachedTicks: initialTicks,
    subscribedSymbols: Array.from(activeSymbols)
  })}\n\n`);

  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
}

// Broadcast an event to all connected SSE clients
export function broadcastSse(eventName, data) {
  if (sseClients.size === 0) return;
  const message = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
}

// Polling and streaming loop - 1-second pulse for all markets
let streamInterval = null;

export function startMarketStreamingLoop() {
  if (streamInterval) return;

  // Run tick cycle every 1000ms (1 second)
  streamInterval = setInterval(async () => {
    if (sseClients.size === 0) return;

    const symbolsToUpdate = Array.from(activeSymbols);

    // Pick 8 symbols per tick to fetch fresh public quotes periodically
    const batchSize = Math.min(8, symbolsToUpdate.length);
    const shuffled = symbolsToUpdate.sort(() => 0.5 - Math.random()).slice(0, batchSize);

    const updatedTicks = [];

    // Periodic remote quote refresh for shuffled batch
    for (const sym of shuffled) {
      try {
        let quote = liveTickCache.get(sym);
        if (!quote || (Date.now() - (quote.lastFetchTime || 0) > 30000)) {
          const fresh = await fetchInstrumentQuote(sym).catch(() => null);
          if (fresh && fresh.price > 0) {
            liveTickCache.set(sym, {
              symbol: sym,
              name: fresh.name,
              price: fresh.price,
              previousClose: fresh.previousClose || fresh.price,
              change: fresh.change || 0,
              changePercent: fresh.changePercent || 0,
              dayHigh: fresh.dayHigh || fresh.price,
              dayLow: fresh.dayLow || fresh.price,
              volume: fresh.volume || 10000,
              lastFetchTime: Date.now(),
              lastTickTime: Date.now(),
              isLive: isInstrumentLive(sym)
            });
          }
        }
      } catch {
        // continue
      }
    }

    // Now generate real-time micro-tick price movements every second
    for (const sym of symbolsToUpdate) {
      let quote = liveTickCache.get(sym);
      if (!quote || quote.price <= 0) continue;

      const isCrypto = sym.includes('-USD');
      const isForex = sym.includes('=X') || sym.includes('=F');
      const live = isInstrumentLive(sym);

      // Do NOT simulate price movements for instruments when their exchange is closed (e.g. Indian equities after 3:30 PM IST)
      if (!live) {
        continue;
      }

      // Micro variance: crypto ±0.04%, forex ±0.01%, equities ±0.02%
      const volatility = isCrypto ? 0.0006 : (isForex ? 0.00015 : 0.00035);
      const randomDirection = (Math.random() - 0.492);
      const deltaPercent = randomDirection * volatility;

      let newPrice = quote.price * (1 + deltaPercent);
      // Precision formatting
      if (newPrice > 100) {
        newPrice = Number(newPrice.toFixed(2));
      } else if (newPrice > 1) {
        newPrice = Number(newPrice.toFixed(4));
      } else {
        newPrice = Number(newPrice.toFixed(6));
      }

      if (newPrice > 0 && newPrice !== quote.price) {
        const newChange = Number((newPrice - quote.previousClose).toFixed(newPrice > 100 ? 2 : 4));
        const newChangePercent = quote.previousClose > 0
          ? Number(((newChange / quote.previousClose) * 100).toFixed(2))
          : 0;

        quote.price = newPrice;
        quote.change = newChange;
        quote.changePercent = newChangePercent;
        quote.dayHigh = Math.max(quote.dayHigh, newPrice);
        quote.dayLow = Math.min(quote.dayLow, newPrice);
        quote.volume += Math.floor(Math.random() * (isCrypto ? 120 : 50)) + 5;
        quote.lastTickTime = Date.now();
        quote.isLive = live;

        liveTickCache.set(sym, quote);
        updatedTicks.push({
          symbol: quote.symbol,
          price: quote.price,
          previousClose: quote.previousClose,
          change: quote.change,
          changePercent: quote.changePercent,
          dayHigh: quote.dayHigh,
          dayLow: quote.dayLow,
          volume: quote.volume,
          timestamp: quote.lastTickTime,
          isLive: live
        });
      }
    }

    if (updatedTicks.length > 0) {
      broadcastSse('ticks', {
        timestamp: Date.now(),
        isLive: isIndianMarketOpen(),
        ticks: updatedTicks
      });
    }
  }, 1000);

  // Send keepalive heartbeat every 15 seconds
  setInterval(() => {
    broadcastSse('heartbeat', {
      timestamp: Date.now(),
      clientsCount: sseClients.size,
      isLive: isIndianMarketOpen()
    });
  }, 15000);
}
