// DHRU.AI - NSE Official Equity Directory Loader
// Ingests official NSE archives EQUITY_L.csv (2,600+ listed equities)
// Combines with curated sector and market cap classifications.

import { CURATED_STOCKS, INDICES, COMMODITIES_FOREX, ETFS, SECTORS, CRYPTO_INSTRUMENTS, FOREX_INSTRUMENTS } from '../data/instruments.js';

let fullStockDirectory = [];
let directoryLoaded = false;
let lastSyncTime = null;

// Map curated stocks by clean symbol for fast lookup
const curatedMap = new Map();
CURATED_STOCKS.forEach(s => {
  const cleanSym = s.symbol.replace('.NS', '').replace('.BO', '');
  curatedMap.set(cleanSym, s);
});

export async function loadNseDirectory() {
  if (directoryLoaded && fullStockDirectory.length > 500) {
    return fullStockDirectory;
  }

  try {
    console.log('[DHRU.AI] Fetching official NSE Equity Master Directory from archives.nseindia.com...');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch('https://archives.nseindia.com/content/equities/EQUITY_L.csv', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/csv,text/plain,*/*'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.ok) {
      const csvText = await res.text();
      const lines = csvText.split('\n');
      const stocks = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length >= 7) {
          const rawSymbol = parts[0].trim();
          const companyName = parts[1].trim();
          const series = parts[2].trim();
          const listingDate = parts[3].trim();
          const isin = parts[6]?.trim() || '';

          // Look up if curated metadata exists
          const curated = curatedMap.get(rawSymbol);

          stocks.push({
            symbol: `${rawSymbol}.NS`,
            ticker: rawSymbol,
            name: companyName,
            exchange: 'NSE',
            series: series,
            isin: isin,
            listingDate: listingDate,
            sector: curated ? curated.sector : inferSector(companyName, rawSymbol),
            cap: curated ? curated.cap : 'NSE Listed',
            curated: !!curated
          });
        }
      }

      if (stocks.length > 500) {
        fullStockDirectory = stocks;
        directoryLoaded = true;
        lastSyncTime = new Date().toISOString();
        console.log(`[DHRU.AI] Successfully indexed ${stocks.length} NSE listed companies directly from official NSE archives.`);
        return fullStockDirectory;
      }
    }
  } catch (err) {
    console.warn('[DHRU.AI] Note: Official NSE CSV direct fetch timed out or restricted. Falling back to built-in verified universe.', err.message);
  }

  // Fallback: Populate with curated stocks list
  fullStockDirectory = CURATED_STOCKS.map(s => ({
    symbol: s.symbol,
    ticker: s.symbol.replace('.NS', ''),
    name: s.name,
    exchange: 'NSE',
    series: 'EQ',
    isin: s.isin,
    listingDate: 'Historical',
    sector: s.sector,
    cap: s.cap,
    curated: true
  }));
  directoryLoaded = true;
  lastSyncTime = new Date().toISOString();
  return fullStockDirectory;
}

function inferSector(companyName, symbol) {
  const name = companyName.toUpperCase();
  const sym = symbol.toUpperCase();

  if (name.includes('BANK') || name.includes('FINANCE') || name.includes('FINANCIAL') || name.includes('INVESTMENT') || name.includes('CAPITAL') || name.includes('HOUSING')) {
    return 'Banking & Financials';
  }
  if (name.includes('TECH') || name.includes('INFOTECH') || name.includes('SOFTWARE') || name.includes('SYSTEMS') || name.includes('DIGITAL') || name.includes('CYBER')) {
    return 'Information Technology';
  }
  if (name.includes('PHARMA') || name.includes('HEALTH') || name.includes('DRUG') || name.includes('BIOTECH') || name.includes('LAB') || name.includes('HOSPITAL')) {
    return 'Healthcare & Pharma';
  }
  if (name.includes('MOTORS') || name.includes('AUTO') || name.includes('TYRE') || name.includes('VEHICLE')) {
    return 'Automobiles & EV';
  }
  if (name.includes('STEEL') || name.includes('METAL') || name.includes('IRON') || name.includes('MINING') || name.includes('ALUMINIUM') || name.includes('ZINC')) {
    return 'Metals & Mining';
  }
  if (name.includes('POWER') || name.includes('ENERGY') || name.includes('OIL') || name.includes('PETRO') || name.includes('GAS') || name.includes('SOLAR')) {
    return 'Energy & Petrochemicals';
  }
  if (name.includes('CEMENT') || name.includes('INFRA') || name.includes('ENGINEERING') || name.includes('CONSTRUCTION') || name.includes('BUILD') || name.includes('PROJECT')) {
    return 'Infrastructure & Capital Goods';
  }
  if (name.includes('REALTY') || name.includes('ESTATE') || name.includes('DEVELOPERS') || name.includes('PROPERTIES')) {
    return 'Real Estate';
  }
  if (name.includes('FOOD') || name.includes('CONSUMER') || name.includes('RETAIL') || name.includes('SUGAR') || name.includes('AGRO') || name.includes('FMCG') || name.includes('BEVERAGE')) {
    return 'FMCG & Consumer';
  }
  if (name.includes('CHEMICAL') || name.includes('FERTILIZER') || name.includes('POLYMER') || name.includes('ORGANIC')) {
    return 'Chemicals & Materials';
  }
  if (name.includes('TELE') || name.includes('COMMUNICATION') || name.includes('NETWORK') || name.includes('BROADCAST')) {
    return 'Telecommunications';
  }
  return 'Industrial & Other';
}

export function searchInstruments(query, limit = 20) {
  if (!query || typeof query !== 'string') return [];
  const q = query.trim().toUpperCase();

  const results = [];

  // 1. Search Indices
  for (const idx of INDICES) {
    if (idx.symbol.toUpperCase().includes(q) || idx.name.toUpperCase().includes(q) || idx.category.toUpperCase().includes(q)) {
      results.push({
        symbol: idx.symbol,
        name: idx.name,
        type: 'Index',
        exchange: idx.exchange,
        category: idx.category,
        relevance: idx.symbol.toUpperCase() === q || idx.name.toUpperCase() === q ? 100 : 70
      });
    }
  }

  // 2. Search Commodities & Forex
  for (const cf of COMMODITIES_FOREX) {
    if (cf.symbol.toUpperCase().includes(q) || cf.name.toUpperCase().includes(q) || cf.category.toUpperCase().includes(q)) {
      results.push({
        symbol: cf.symbol,
        name: cf.name,
        type: cf.type,
        exchange: cf.exchange,
        category: cf.category,
        relevance: cf.symbol.toUpperCase() === q || cf.name.toUpperCase() === q ? 95 : 65
      });
    }
  }

  // 3. Search ETFs
  for (const etf of ETFS) {
    if (etf.symbol.toUpperCase().includes(q) || etf.name.toUpperCase().includes(q)) {
      results.push({
        symbol: etf.symbol,
        name: etf.name,
        type: 'ETF',
        exchange: etf.exchange,
        category: 'ETF',
        relevance: etf.symbol.toUpperCase().includes(q) ? 90 : 60
      });
    }
  }

  // 3b. Search Crypto Instruments
  for (const crypto of (CRYPTO_INSTRUMENTS || [])) {
    if (crypto.symbol.toUpperCase().includes(q) || crypto.name.toUpperCase().includes(q)) {
      results.push({
        symbol: crypto.symbol,
        name: crypto.name,
        type: 'Crypto',
        exchange: 'BINANCE/COINBASE',
        category: 'Crypto',
        relevance: crypto.symbol.toUpperCase().includes(q) ? 98 : 68
      });
    }
  }

  // 3c. Search Forex Instruments
  for (const fx of (FOREX_INSTRUMENTS || [])) {
    if (fx.symbol.toUpperCase().includes(q) || fx.name.toUpperCase().includes(q) || fx.category.toUpperCase().includes(q)) {
      results.push({
        symbol: fx.symbol,
        name: fx.name,
        type: 'Forex',
        exchange: 'FOREX/GLOBAL',
        category: fx.category || 'Currency',
        relevance: fx.symbol.toUpperCase().includes(q) ? 95 : 65
      });
    }
  }

  // 4. Search Equities
  for (const stock of fullStockDirectory) {
    const symMatch = stock.ticker.toUpperCase() === q;
    const symPrefix = stock.ticker.toUpperCase().startsWith(q);
    const symContains = stock.ticker.toUpperCase().includes(q);
    const nameContains = stock.name.toUpperCase().includes(q);

    if (symMatch || symPrefix || symContains || nameContains) {
      let score = 0;
      if (symMatch) score = 100;
      else if (symPrefix) score = 85;
      else if (symContains) score = 60;
      else if (nameContains) score = 50;

      if (stock.curated) score += 10; // Curated heavyweight boost

      results.push({
        symbol: stock.symbol,
        ticker: stock.ticker,
        name: stock.name,
        type: 'Stock',
        exchange: stock.exchange,
        sector: stock.sector,
        cap: stock.cap,
        isin: stock.isin,
        relevance: score
      });
    }
  }

  // Sort by relevance desc
  results.sort((a, b) => b.relevance - a.relevance);
  return results.slice(0, limit);
}

export function getFullStockDirectory() {
  return fullStockDirectory;
}

export function getDirectoryStatus() {
  return {
    loaded: directoryLoaded,
    totalCount: fullStockDirectory.length,
    lastSyncTime: lastSyncTime
  };
}
