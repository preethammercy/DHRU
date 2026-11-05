import { fetchNsePublic } from '../services/nsePublic.js';

export async function getFiiDiiData() {
  try {
    const response = await fetchNsePublic('/api/fiidiiTradeReact');
    const rows = Array.isArray(response) ? response : response.data;
    if (!Array.isArray(rows) || !rows.length) throw new Error('NSE returned no dated flow rows');
    const normalized = rows.map(row => ({
      category: String(row.category || row.categoryName || ''),
      date: row.date || row.tradeDate || null,
      grossBuyCr: Number(row.buyValue ?? row.grossBuy ?? NaN),
      grossSellCr: Number(row.sellValue ?? row.grossSell ?? NaN),
      netInvestmentCr: Number(row.netValue ?? row.net ?? NaN)
    })).filter(row => row.category && row.date && Number.isFinite(row.netInvestmentCr));
    const fii = normalized.find(row => /FII|FPI/i.test(row.category));
    const dii = normalized.find(row => /DII/i.test(row.category));
    if (!fii || !dii) throw new Error('NSE response did not include dated FII and DII figures');
    const summarize = row => ({
      category: row.category, grossBuyCr: row.grossBuyCr, grossSellCr: row.grossSellCr,
      netInvestmentCr: row.netInvestmentCr,
      trend: row.netInvestmentCr > 0 ? '▲ Net Buyers' : row.netInvestmentCr < 0 ? '▼ Net Sellers' : 'Neutral'
    });
    const sourceDate = Date.parse(fii.date);
    return {
      status: 'DELAYED', source: 'NSE FII/DII report', asOfDate: fii.date,
      lastUpdated: Number.isFinite(sourceDate) ? new Date(sourceDate).toISOString() : null,
      todaySummary: { fii: summarize(fii), dii: summarize(dii), combinedNetCr: fii.netInvestmentCr + dii.netInvestmentCr },
      historicalDays: normalized.map(row => ({ date: row.date, category: row.category, netCr: row.netInvestmentCr }))
    };
  } catch (error) {
    return { status: 'UNAVAILABLE', source: 'NSE FII/DII report', asOfDate: null, todaySummary: null, historicalDays: [], message: error.message };
  }
}
