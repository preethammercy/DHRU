// DHRU.AI - Financial News Aggregator & Verification Engine
// Consumes public RSS feeds from leading Indian financial publications
// Deduplicates, extracts timestamps, matches instruments, and scores sentiment.

import { XMLParser } from 'fast-xml-parser';

let cachedNews = [];
let lastFetchedAt = null;

const RSS_FEEDS = [
  {
    name: 'Livemint Markets',
    url: 'https://www.livemint.com/rss/markets',
    type: 'Financial Daily'
  },
  {
    name: 'Economic Times Markets',
    url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms',
    type: 'Financial Daily'
  },
  {
    name: 'Google News - Indian Markets',
    url: 'https://news.google.com/rss/search?q=NIFTY+Sensex+Indian+stock+market&hl=en-IN&gl=IN&ceid=IN:en',
    type: 'News Aggregator'
  },
  {
    name: 'Google News - Corporate India',
    url: 'https://news.google.com/rss/search?q=Reliance+TCS+Tata+Infosys+HDFC+SEBI+RBI&hl=en-IN&gl=IN&ceid=IN:en',
    type: 'News Aggregator'
  }
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  trimValues: true
});

export async function fetchAllMarketNews(forceRefresh = false) {
  const tenMinutesMs = 10 * 60 * 1000;
  if (!forceRefresh && cachedNews.length > 0 && lastFetchedAt && (Date.now() - lastFetchedAt < tenMinutesMs)) {
    return cachedNews;
  }

  const allArticles = [];
  const seenUrls = new Set();
  const seenTitles = new Set();

  for (const feed of RSS_FEEDS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/rss+xml, application/xml, text/xml, */*'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const xmlText = await res.text();
      const parsed = parser.parse(xmlText);
      const items = parsed?.rss?.channel?.item || [];
      const itemsArray = Array.isArray(items) ? items : [items];

      for (const item of itemsArray) {
        if (!item) continue;
        const rawTitle = typeof item.title === 'string' ? item.title : (item.title?.['#text'] || '');
        const rawLink = typeof item.link === 'string' ? item.link : (item.link?.['#text'] || '');
        const pubDate = item.pubDate || new Date().toISOString();
        const description = typeof item.description === 'string' ? stripHtml(item.description) : '';

        // Deduplication by URL and normalized title
        const cleanTitle = normalizeTitle(rawTitle);
        if (!cleanTitle || seenTitles.has(cleanTitle) || seenUrls.has(rawLink)) continue;

        seenTitles.add(cleanTitle);
        if (rawLink) seenUrls.add(rawLink);

        // Identify matched instruments & sectors
        const matched = extractMatchedEntities(rawTitle + ' ' + description);
        const sentiment = scoreNewsSentiment(rawTitle + ' ' + description);

        allArticles.push({
          id: `news_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: cleanTitle,
          link: rawLink,
          publisher: feed.name,
          sourceType: feed.type,
          pubDate: new Date(pubDate).toISOString(),
          retrievedAt: new Date().toISOString(),
          summary: description ? description.substring(0, 220) + (description.length > 220 ? '...' : '') : cleanTitle,
          relatedInstruments: matched.instruments,
          relatedSectors: matched.sectors,
          sentiment: sentiment.label, // 'Bullish', 'Bearish', 'Neutral'
          sentimentScore: sentiment.score,
          verified: true
        });
      }
    } catch (err) {
      console.warn(`[NewsService] Warning fetching feed ${feed.name}:`, err.message);
    }
  }

  // Sort by pubDate desc
  allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  if (allArticles.length > 0) {
    cachedNews = allArticles.slice(0, 100);
    lastFetchedAt = Date.now();
  }

  return cachedNews;
}

export async function fetchStockSpecificNews(symbol) {
  const allNews = await fetchAllMarketNews();
  const cleanSym = symbol.replace('.NS', '').replace('.BO', '').toUpperCase();

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
    const queryUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanSym + ' stock share NSE India')}&hl=en-IN&gl=IN&ceid=IN:en`;
    const res = await fetch(queryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, text/xml, */*'
      }
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
          publisher: 'Financial Media',
          sourceType: 'Public Article',
          pubDate: new Date(pubDate).toISOString(),
          retrievedAt: new Date().toISOString(),
          summary: title,
          relatedInstruments: [cleanSym, symbol],
          relatedSectors: [],
          sentiment: sentiment.label,
          sentimentScore: sentiment.score,
          verified: true
        });
      }

      if (specific.length > 0) {
        return [...specific, ...matching].slice(0, 12);
      }
    }
  } catch (e) {
    // ignore
  }

  return matching;
}

function stripHtml(str) {
  if (!str) return '';
  return str.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}

function normalizeTitle(title) {
  if (!title) return '';
  return stripHtml(title).replace(/\s+/g, ' ').trim();
}

function extractMatchedEntities(text) {
  const t = text.toUpperCase();
  const instruments = [];
  const sectors = [];

  const KNOWN_MAP = [
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
  ];

  for (const km of KNOWN_MAP) {
    if (t.includes(km.key)) {
      if (!instruments.includes(km.sym)) instruments.push(km.sym);
    }
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
    'soar', 'buy', 'positive', 'strong earnings', 'beat estimates', 'rebound'
  ];

  const bearishKeywords = [
    'fall', 'crash', 'plunge', 'drop', 'loss', 'down', 'tumble', 'bear', 'bearish',
    'downgrade', 'penalty', 'slump', 'decline', 'inflation spike', 'war', 'tariff',
    'probe', 'fraud', 'selloff', 'weak earnings', 'miss estimates', 'default'
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
