import { fetchNsePublic } from '../services/nsePublic.js';

const rowsOf = value => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];

export async function getIpoAnnouncements() {
  try {
    const [ipoResponse, actionsResponse] = await Promise.all([
      fetchNsePublic('/api/ipo-current-issue'),
      fetchNsePublic('/api/corporates-corporateActions', {
        index: 'equities', from_date: new Date(Date.now() - 14 * 86400000).toLocaleDateString('en-GB').replaceAll('/', '-'),
        to_date: new Date(Date.now() + 90 * 86400000).toLocaleDateString('en-GB').replaceAll('/', '-')
      })
    ]);
    const upcomingIpos = rowsOf(ipoResponse);
    const corporateActions = rowsOf(actionsResponse);
    const dates = [...upcomingIpos, ...corporateActions].map(row => Date.parse(row.updatedAt || row.lastUpdated || row.date || '')).filter(Number.isFinite);
    return { status: 'DELAYED', source: 'NSE corporate disclosures', lastUpdated: dates.length ? new Date(Math.max(...dates)).toISOString() : null, upcomingIpos, corporateActions };
  } catch (error) {
    return { status: 'UNAVAILABLE', source: 'NSE corporate disclosures', lastUpdated: null, upcomingIpos: [], corporateActions: [], message: error.message };
  }
}
