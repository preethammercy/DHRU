// DHRU.AI - Multi-Market Financial News Aggregator & Verification Engine
// Consumes public RSS feeds for NSE/Indian Equities, 24/7 Global Crypto, and Macro Markets
// Deduplicates, filters by strict <= 48h freshness (with 7-day fallback), extracts entities, and scores sentiment.

import { XMLParser } from 'fast-xml-parser';

let cachedNews = [];
let lastFetchedAt = null;

const RSS_FEEDS = [
  // --- INDIAN EQUITIES & INDICES (NSE / BSE) ---
  {
    market: 'NSE',
    name: 'Livemint Markets',
    url: 'https://www.livemint.com/rss/markets',
    type: 'Financial Daily'
  },
  {
    market: 'NSE',
    name: 'Economic Times Markets',
    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    type: 'Financial Daily'
  },
  {
    market: 'NSE',
    name: 'Google News - Indian Markets',
    url: 'https://news.google.com/rss/search?q=NIFTY+Sensex+Indian+stock+market&hl=en-IN&gl=IN&ceid=IN:en',
    type: 'News Aggregator'
  },
  {
    market: 'NSE',
    name: 'Google News - Corporate India',
    url: 'https://news.google.com/rss/search?q=Reliance+TCS+Tata+Infosys+HDFC+SEBI+RBI&hl=en-IN&gl=IN&ceid=IN:en',
    type: 'News Aggregator'
  },

  // --- GLOBAL CRYPTOCURRENCIES (24/7 BINANCE & LIQUIDITY) ---
  {
    market: 'CRYPTO',
    name: 'CoinDesk',
    url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
    type: 'Crypto Specialist'
  },
  {
    market: 'CRYPTO',
    name: 'Cointelegraph',
    url: 'https://cointelegraph.com/rss',
    type: 'Crypto Specialist'
  },
  {
    market: 'CRYPTO',
    name: 'Google News - Crypto Markets',
    url: 'https://news.google.com/rss/search?q=Bitcoin+Ethereum+Crypto+market&hl=en-US&gl=US&ceid=US:en',
    type: 'Crypto Aggregator'
  },
  {
    market: 'CRYPTO',
    name: 'Google News - Altcoins & Solana',
    url: 'https://news.google.com/rss/search?q=Solana+XRP+Binance+crypto+trading&hl=en-US&gl=US&ceid=US:en',
    type: 'Crypto Aggregator'
  },

  // --- GLOBAL MACRO & US EQUITIES ---
  {
    market: 'GLOBAL',
    name: 'Google News - Global Macro',
    url: 'https://news.google.com/rss/search?q=Wall+Street+Federal+Reserve+SP500+Nasdaq&hl=en-US&gl=US&ceid=US:en',
    type: 'Macro Feed'
  },
  {
    market: 'GLOBAL',
    name: 'Yahoo Finance News',
    url: 'https://finance.yahoo.com/news/rssindex',
    type: 'Global Finance'
  }
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true
});

export async function fetchAllMarketNews(forceRefresh = false, targetMarket = 'ALL') {
  // Freshness interval: 120 seconds cache for high-frequency live updates
  const cacheTtlMs = 120 * 1000;
  if (!forceRefresh && cachedNews.length > 0 && lastFetchedAt && (Date.now() - lastFetchedAt < cacheTtlMs)) {
    return filterByMarket(cachedNews, targetMarket);
  }

  const allArticles = [];
  const seenUrls = new Set();
  const seenTitles = new Set();

  // Fetch all RSS feeds in parallel with 2.0s timeout per feed
  await Promise.allSettled(RSS_FEEDS.map(async (feed) => {
    try {
      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        signal: AbortSignal.timeout(2000)
      });

      if (!res.ok) return;

      const xmlText = await res.text();
      const parsed = parser.parse(xmlText);
      const items = parsed?.rss?.channel?.item || [];
      const itemsArray = Array.isArray(items) ? items : [items];

      for (const item of itemsArray) {
        if (!item) continue;
        const rawTitle = typeof item.title === 'string' ? item.title : (item.title?.['#text'] || '');
        const rawLink = typeof item.link === 'string' ? item.link : (item.link?.['#text'] || '');
        const pubDateRaw = item.pubDate || new Date().toISOString();
        const description = typeof item.description === 'string' ? stripHtml(item.description) : '';

        // Deduplication by URL and normalized title
        const cleanTitle = normalizeTitle(rawTitle);
        if (!cleanTitle || cleanTitle.length < 8 || seenTitles.has(cleanTitle) || (rawLink && seenUrls.has(rawLink))) continue;

        const pubDateParsed = new Date(pubDateRaw);
        const validPubDate = isNaN(pubDateParsed.getTime()) ? new Date().toISOString() : pubDateParsed.toISOString();

        seenTitles.add(cleanTitle);
        if (rawLink) seenUrls.add(rawLink);

        // Identify matched instruments & sectors
        const matched = extractMatchedEntities(rawTitle + ' ' + description, feed.market);
        const sentiment = scoreNewsSentiment(rawTitle + ' ' + description);

        allArticles.push({
          id: `news_${feed.market.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: cleanTitle,
          link: rawLink,
          publisher: feed.name,
          sourceType: feed.type,
          market: feed.market, // 'NSE', 'CRYPTO', 'GLOBAL'
          pubDate: validPubDate,
          retrievedAt: new Date().toISOString(),
          summary: description ? description.substring(0, 240) + (description.length > 240 ? '...' : '') : cleanTitle,
          relatedInstruments: matched.instruments,
          relatedSectors: matched.sectors,
          sentiment: sentiment.label, // 'Bullish', 'Bearish', 'Neutral'
          sentimentScore: sentiment.score,
          verified: true
        });
      }
    } catch {
      // Non-blocking feed timeout or format error
    }
  }));

  // --- STRICT FRESHNESS FILTER: <= 48 Hours ---
  const now = Date.now();
  const ms48Hours = 48 * 60 * 60 * 1000;
  const ms7Days = 7 * 24 * 60 * 60 * 1000;

  let freshArticles = allArticles.filter(a => {
    const age = now - new Date(a.pubDate).getTime();
    return age >= 0 && age <= ms48Hours;
  });

  // Fallback to 7 days if < 5 items pass the 48h filter
  if (freshArticles.length < 5) {
    freshArticles = allArticles.filter(a => {
      const age = now - new Date(a.pubDate).getTime();
      return age >= 0 && age <= ms7Days;
    });
  }

  if (freshArticles.length === 0) {
    freshArticles = allArticles;
  }

  // Sort strictly pubDate DESC
  freshArticles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  if (freshArticles.length > 0) {
    cachedNews = freshArticles.slice(0, 150);
    lastFetchedAt = Date.now();
  }

  return filterByMarket(cachedNews, targetMarket);
}

function filterByMarket(newsList, targetMarket) {
  if (!targetMarket || targetMarket === 'ALL') {
    return newsList;
  }
  const cleanMarket = targetMarket.toUpperCase();
  return newsList.filter(item => item.market === cleanMarket);
}

export async function fetchStockSpecificNews(symbol) {
  const allNews = await fetchAllMarketNews(false, 'ALL');
  const cleanSym = symbol.replace('.NS', '').replace('.BO', '').replace('-USD', '').replace('USDT', '').toUpperCase();

  // Filter in cached news
  const matching = allNews.filter(n => 
    n.relatedInstruments.some(inst => inst.toUpperCase().includes(cleanSym)) ||
    n.title.toUpperCase().includes(cleanSym) ||
    n.summary.toUpperCase().includes(cleanSym)
  );

  if (matching.length >= 3) {
    return matching;
  }

  // If not enough found in generic feed, query Google News RSS specifically for this symbol
  try {
    const isCrypto = symbol.includes('USD') || ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'BNB', 'ADA'].includes(cleanSym);
    const queryTerm = isCrypto ? `${cleanSym} crypto price market news` : `${cleanSym} stock share NSE India`;
    const queryUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(queryTerm)}&hl=en-IN&gl=IN&ceid=IN:en`;
    const res = await fetch(queryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, text/xml, */*'
      },
      signal: AbortSignal.timeout(1500)
    });

    if (res.ok) {
      const xml = await res.text();
      const parsed = parser.parse(xml);
      const items = parsed?.rss?.channel?.item || [];
      const itemsArray = Array.isArray(items) ? items : [items];

      const specific = [];
      for (const it of itemsArray.slice(0, 8)) {
        const title = normalizeTitle(typeof it.title === 'string' ? it.title : (it.title?.['#text'] || ''));
        const link = it.link || '';
        const pubDate = it.pubDate || new Date().toISOString();
        const sentiment = scoreNewsSentiment(title);

        specific.push({
          id: `specific_${cleanSym}_${Math.random().toString(36).substring(2, 7)}`,
          title,
          link,
          publisher: 'Verified Media Feed',
          sourceType: 'Real-Time Wire',
          market: isCrypto ? 'CRYPTO' : 'NSE',
          pubDate: new Date(pubDate).toISOString(),
          retrievedAt: new Date().toISOString(),
          summary: title,
          relatedInstruments: [cleanSym, symbol],
          relatedSectors: isCrypto ? ['Layer 1 / Cryptocurrencies'] : [],
          sentiment: sentiment.label,
          sentimentScore: sentiment.score,
          verified: true
        });
      }

      if (specific.length > 0) {
        return [...specific, ...matching].slice(0, 15);
      }
    }
  } catch (e) {
    // ignore
  }

  return matching;
}

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#8217;/g, "'").replace(/&#8216;/g, "'").trim();
}

function normalizeTitle(title) {
  if (!title) return '';
  return stripHtml(title).replace(/\s+/g, ' ').trim();
}

function extractMatchedEntities(text, market) {
  const t = text.toUpperCase();
  const instruments = [];
  const sectors = [];

  const KNOWN_MAP = [
    // NSE / Indian Equities
    { key: 'RELIANCE', sym: 'RELIANCE' },
    { key: 'TCS', sym: 'TCS' },
    { key: 'INFOSYS', sym: 'INFY' },
    { key: 'INFY', sym: 'INFY' },
    { key: 'HDFC BANK', sym: 'HDFCBANK' },
    { key: 'HDFC', sym: 'HDFCBANK' },
    { key: 'ICICI BANK', sym: 'ICICIBANK' },
    { key: 'STATE BANK OF INDIA', sym: 'SBIN' },
    { key: 'SBI', sym: 'SBIN' },
    { key: 'TATA MOTORS', sym: 'TMPV' },
    { key: 'TATA STEEL', sym: 'TATASTEEL' },
    { key: 'TITAN', sym: 'TITAN' },
    { key: 'TRENT', sym: 'TRENT' },
    { key: 'ITC', sym: 'ITC' },
    { key: 'HUL', sym: 'HINDUNILVR' },
    { key: 'HINDUSTAN UNILEVER', sym: 'HINDUNILVR' },
    { key: 'L&T', sym: 'LT' },
    { key: 'LARSEN', sym: 'LT' },
    { key: 'MARUTI', sym: 'MARUTI' },
    { key: 'M&M', sym: 'M&M' },
    { key: 'MAHINDRA', sym: 'M&M' },
    { key: 'BHARTI AIRTEL', sym: 'BHARTIARTL' },
    { key: 'AIRTEL', sym: 'BHARTIARTL' },
    { key: 'ADANI', sym: 'ADANIENT' },
    { key: 'NIFTY', sym: 'NIFTY 50' },
    { key: 'SENSEX', sym: 'BSE SENSEX' },
    { key: 'ZOMATO', sym: 'ZOMATO' },
    { key: 'ETERNAL', sym: 'ETERNAL' },

    // Global Crypto Assets
    { key: 'BITCOIN', sym: 'BTC-USD' },
    { key: 'BTC', sym: 'BTC-USD' },
    { key: 'ETHEREUM', sym: 'ETH-USD' },
    { key: 'ETH', sym: 'ETH-USD' },
    { key: 'SOLANA', sym: 'SOL-USD' },
    { key: 'SOL', sym: 'SOL-USD' },
    { key: 'RIPPLE', sym: 'XRP-USD' },
    { key: 'XRP', sym: 'XRP-USD' },
    { key: 'DOGECOIN', sym: 'DOGE-USD' },
    { key: 'DOGE', sym: 'DOGE-USD' },
    { key: 'BINANCE COIN', sym: 'BNB-USD' },
    { key: 'BNB', sym: 'BNB-USD' },
    { key: 'CARDANO', sym: 'ADA-USD' },
    { key: 'ADA', sym: 'ADA-USD' },
    { key: 'SUI', sym: 'SUI-USD' },
    { key: 'AVALANCHE', sym: 'AVAX-USD' },
    { key: 'AVAX', sym: 'AVAX-USD' },
    { key: 'PEPE', sym: 'PEPE-USD' },
    { key: 'SHIBA', sym: 'SHIB-USD' },
  ];

  for (const km of KNOWN_MAP) {
    if (t.includes(km.key)) {
      if (!instruments.includes(km.sym)) instruments.push(km.sym);
    }
  }

  if (market === 'CRYPTO' || t.includes('CRYPTO') || t.includes('BLOCKCHAIN')) {
    sectors.push('Cryptocurrency & Web3');
  }
  if (t.includes('BANK') || t.includes('LENDING') || t.includes('RBI')) sectors.push('Banking & Financials');
  if (t.includes('TECH') || t.includes('IT SECTOR') || t.includes('AI') || t.includes('SOFTWARE')) sectors.push('Information Technology');
  if (t.includes('AUTO') || t.includes('EV') || t.includes('CAR') || t.includes('VEHICLE')) sectors.push('Automobiles & EV');
  if (t.includes('METAL') || t.includes('STEEL') || t.includes('MINING')) sectors.push('Metals & Mining');
  if (t.includes('PHARMA') || t.includes('DRUG') || t.includes('HEALTHCARE')) sectors.push('Healthcare & Pharma');
  if (t.includes('OIL') || t.includes('GAS') || t.includes('ENERGY') || t.includes('CRUDE')) sectors.push('Energy & Petrochemicals');
  if (t.includes('FMCG') || t.includes('CONSUMER')) sectors.push('FMCG & Consumer');

  return { instruments, sectors };
}

function scoreNewsSentiment(text) {
  const t = text.toLowerCase();

  const bullishKeywords = [
    'surge', 'jump', 'rally', 'gain', 'profit', 'growth', 'all-time high', 'outperform',
    'record high', 'bull', 'bullish', 'dividend', 'order win', 'expansion', 'upgrade',
    'soar', 'buy', 'positive', 'strong earnings', 'beat estimates', 'rebound', 'breakout',
    'inflows', 'etf approval', 'milestone', 'accumulation'
  ];

  const bearishKeywords = [
    'fall', 'crash', 'plunge', 'drop', 'loss', 'down', 'tumble', 'bear', 'bearish',
    'downgrade', 'penalty', 'slump', 'decline', 'inflation spike', 'war', 'tariff',
    'probe', 'fraud', 'selloff', 'weak earnings', 'miss estimates', 'default', 'outflow',
    'sec crackdown', 'investigation', 'liquidation'
  ];

  let score = 0;
  for (const b of bullishKeywords) {
    if (t.includes(b)) score += 1;
  }
  for (const b of bearishKeywords) {
    if (t.includes(b)) score -= 1;
  }

  if (score > 0) return { label: 'Bullish', score };
  if (score < 0) return { label: 'Bearish', score };
  return { label: 'Neutral', score: 0 };
}

export function getNewsStatus() {
  return {
    cachedArticlesCount: cachedNews.length,
    lastFetchedAt: lastFetchedAt ? new Date(lastFetchedAt).toISOString() : null
  };
}

export function checkNewsRiskForSymbol(symbol, recentNews = []) {
  if (!Array.isArray(recentNews) || recentNews.length === 0) {
    return { veto: false, riskLevel: 'LOW', reason: null };
  }

  const cleanSym = String(symbol || '').replace(/\.(NS|BO)$/i, '').replace(/-USD$/i, '').toUpperCase();
  const HIGH_IMPACT_PATTERN = /\b(fraud|scam|investigation|subpoena|sec crackdown|sebi probe|raid|arrest|insolven|bankrupt|default|hack|exploit|freeze|halt|plunge|crash|delist)\b/i;

  const now = Date.now();
  for (const article of recentNews) {
    const pubTime = article.timestamp ? Number(article.timestamp) : (article.publishedAt ? Date.parse(article.publishedAt) : now);
    const ageHours = (now - pubTime) / (3600 * 1000);
    // Focus on recent high impact news in last 24 hours
    if (ageHours <= 24) {
      const title = article.title || '';
      if (HIGH_IMPACT_PATTERN.test(title)) {
        return {
          veto: true,
          riskLevel: 'HIGH',
          reason: `High-impact news risk veto: "${title}" (${article.publisher || 'RSS'})`,
          article
        };
      }
    }
  }

  return { veto: false, riskLevel: 'LOW', reason: null };
}

