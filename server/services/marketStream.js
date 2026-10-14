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
    isLive: true,
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
