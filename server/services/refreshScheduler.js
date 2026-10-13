// DHRU.AI - 10-Minute Background Refresh Architecture
// Incremental caching, rate-limit-aware updates, error logging, and data freshness tracking.

import { getMarketOverview } from './marketData.js';
import { fetchAllMarketNews } from './newsService.js';
import { INDICES, COMMODITIES_FOREX } from '../data/instruments.js';

let intervalHandle = null;
let isRefreshing = false;
let lastSuccessfulRefresh = null;
let nextScheduledRefresh = null;
let lastError = null;
const runHistory = [];

const REFRESH_INTERVAL_MS = (parseInt(process.env.REFRESH_INTERVAL_MINUTES || '10', 10)) * 60 * 1000;

export function startScheduler() {
  if (intervalHandle) return;

  console.log(`[Scheduler] Starting 10-minute automated background refresh loop (Interval: ${REFRESH_INTERVAL_MS / 60000} mins)...`);

  // Run initial warm-up refresh
  runRefreshCycle('Initial Startup');

  // Schedule recurring cycle
  scheduleNextRun();
}

function scheduleNextRun() {
  if (intervalHandle) clearTimeout(intervalHandle);

  nextScheduledRefresh = new Date(Date.now() + REFRESH_INTERVAL_MS).toISOString();

  intervalHandle = setTimeout(async () => {
    await runRefreshCycle('Scheduled 10-Min Cycle');
    scheduleNextRun();
  }, REFRESH_INTERVAL_MS);
}

export async function runRefreshCycle(triggerType = 'Manual Trigger') {
  if (isRefreshing) {
    console.log('[Scheduler] Refresh already in progress, skipping overlapping run.');
    return { status: 'already_running', lastSuccessfulRefresh };
  }

  isRefreshing = true;
  const startTime = Date.now();
  console.log(`[Scheduler] [${new Date().toLocaleTimeString('en-IN')}] Executing refresh cycle: ${triggerType}...`);

  let itemsCount = 0;
  let status = 'Success';
  let errorMsg = null;

  try {
    // 1. Refresh News Feeds
    const news = await fetchAllMarketNews(true);
    itemsCount += news.length;

    // 2. Refresh Market Overview (Indices, Top stocks, Gainers, Losers, Breadth)
    const overview = await getMarketOverview();
    if (overview?.indices) itemsCount += overview.indices.length;
    if (overview?.gainers) itemsCount += overview.gainers.length;

    lastSuccessfulRefresh = new Date().toISOString();
    lastError = null;
    console.log(`[Scheduler] Cycle complete! Updated ${itemsCount} records in ${(Date.now() - startTime)}ms.`);
  } catch (err) {
    status = 'Failed';
    errorMsg = err.message;
    lastError = err.message;
    console.error('[Scheduler] Error during refresh cycle:', err);
  } finally {
    isRefreshing = false;
  }

  const runRecord = {
    triggerType,
    executedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    itemsRefreshed: itemsCount,
    status,
    error: errorMsg
  };

  runHistory.unshift(runRecord);
  if (runHistory.length > 20) runHistory.pop();

  return runRecord;
}

export function getSchedulerStatus() {
  const now = Date.now();
  const nextMs = nextScheduledRefresh ? Math.max(0, new Date(nextScheduledRefresh).getTime() - now) : 0;
  const nextMinutes = Math.floor(nextMs / 60000);
  const nextSeconds = Math.floor((nextMs % 60000) / 1000);

  return {
    isRefreshing,
    lastSuccessfulRefresh,
    nextScheduledRefresh,
    nextCountdown: `${nextMinutes}m ${nextSeconds}s`,
    lastError,
    refreshIntervalMinutes: REFRESH_INTERVAL_MS / 60000,
    history: runHistory.slice(0, 8),
    disclaimer: 'Data updates reflect official public feeds. Intraday equity feeds operate with a standard 15-minute exchange delay during market hours.'
  };
}
