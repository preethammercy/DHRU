import { fetchNsePublic } from '../services/nsePublic.js';

let cache;
const CACHE_MS = 2500;

async function loadIndexChain(symbol, name, indices) {
  const chain = await fetchNsePublic('/api/option-chain-indices', { symbol });
  const records = chain.records;
  const expiryDate = records?.expiryDates?.[0];
  if (!expiryDate || !Array.isArray(records?.data)) throw new Error(`${name} option chain has no current expiry`);
  const rows = records.data.filter(item => item.expiryDate === expiryDate).map(item => ({
    strike: Number(item.strikePrice),
    ce: item.CE || null,
    pe: item.PE || null
  })).filter(row => Number.isFinite(row.strike));
  if (!rows.length) throw new Error(`${name} option chain is empty`);
  const totalCallOi = rows.reduce((sum, row) => sum + Number(row.ce?.openInterest || 0), 0);
  const totalPutOi = rows.reduce((sum, row) => sum + Number(row.pe?.openInterest || 0), 0);
  const pcr = totalCallOi ? totalPutOi / totalCallOi : null;
  const maxPainStrike = rows.reduce((best, candidate) => {
    const payout = rows.reduce((sum, row) => sum
      + Number(row.ce?.openInterest || 0) * Math.max(0, candidate.strike - row.strike)
      + Number(row.pe?.openInterest || 0) * Math.max(0, row.strike - candidate.strike), 0);
    return !best || payout < best.payout ? { strike: candidate.strike, payout } : best;
  }, null)?.strike ?? null;
  const current = indices.find(item => item.index === name || item.indexSymbol === name);
  return {
    symbol, expiryDate, underlyingPrice: Number(records.underlyingValue || current?.last || 0),
    atmStrike: rows.reduce((closest, row) => Math.abs(row.strike - Number(records.underlyingValue || 0)) < Math.abs(closest - Number(records.underlyingValue || 0)) ? row.strike : closest, rows[0].strike),
    maxPainStrike, putCallRatio: pcr,
    pcrInterpretation: pcr == null ? 'Unavailable' : pcr > 1.2 ? 'Higher put open interest' : pcr < 0.8 ? 'Higher call open interest' : 'Near balanced open interest',
    indiaVix: Number(indices.find(item => item.index === 'INDIA VIX')?.last || 0) || null,
    strikes: rows.map(row => ({
      strike: row.strike,
      isAtm: row.strike === rows.reduce((closest, currentRow) => Math.abs(currentRow.strike - Number(records.underlyingValue || 0)) < Math.abs(closest - Number(records.underlyingValue || 0)) ? currentRow.strike : closest, rows[0].strike),
      callOi: Number(row.ce?.openInterest || 0), putOi: Number(row.pe?.openInterest || 0),
      callOiChange: Number(row.ce?.changeinOpenInterest || 0), putOiChange: Number(row.pe?.changeinOpenInterest || 0),
      callIv: Number(row.ce?.impliedVolatility || 0), putIv: Number(row.pe?.impliedVolatility || 0)
    })),
    totalCallOi, totalPutOi
  };
}

export async function getDerivativesOverview() {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;
  try {
    const indexResponse = await fetchNsePublic('/api/allIndices');
    const indices = indexResponse.data || [];
    const [nifty, bankNifty] = await Promise.all([
      loadIndexChain('NIFTY', 'NIFTY 50', indices),
      loadIndexChain('BANKNIFTY', 'NIFTY BANK', indices)
    ]);
    const sourceTime = Date.parse(indexResponse.timestamp || indexResponse.time || '');
    const fresh = Number.isFinite(sourceTime) && Date.now() - sourceTime <= 90_000 && Date.now() >= sourceTime - 60_000;
    const data = { status: fresh ? 'LIVE' : 'DELAYED', source: 'NSE option chain', lastUpdated: Number.isFinite(sourceTime) ? new Date(sourceTime).toISOString() : null, instruments: { nifty, bankNifty } };
    cache = { at: Date.now(), data };
    return data;
  } catch (error) {
    return { status: 'UNAVAILABLE', source: 'NSE option chain', lastUpdated: null, instruments: {}, message: `Live option-chain data unavailable: ${error.message}` };
  }
}
