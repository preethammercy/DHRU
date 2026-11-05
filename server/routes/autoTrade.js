import express from 'express';
import { createAutoTrader, normalizeSymbol } from '../services/autoTrader.js';

const REFRESH_MS = 30_000;

/**
 * @param {{ getPrice: (symbol: string) => Promise<number> }} deps
 *        Pass your existing single-quote function from marketData.js.
 */
export function createAutoTradeRouter({ getPrice }) {
  const trader = createAutoTrader();
  const router = express.Router();
  router.use(express.json({ limit: '10kb' }));

  const fetchPrice = async (symbol) => {
    const px = Number(await getPrice(symbol));
    return Number.isFinite(px) && px > 0 ? px : null;
  };

  async function refresh() {
    const prices = {};
    await Promise.all(
      trader.openSymbols().map(async (s) => {
        try {
          const px = await fetchPrice(s);
          if (px) prices[s] = px;
        } catch {
          // leave stale; the trader skips positions without a fresh price
        }
      }),
    );
    return trader.tick(prices);
  }

  const handle = (fn) => async (req, res) => {
    try {
      res.json(await fn(req));
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  router.get('/state', handle(async () => {
    await refresh();
    return trader.snapshot();
  }));

  router.get('/report', handle(async () => {
    await refresh();
    return trader.report();
  }));

  router.put('/config', handle(async (req) => {
    trader.updateConfig(req.body ?? {});
    return trader.snapshot();
  }));

  router.post('/enable', handle(async (req) => {
    trader.setEnabled(req.body?.enabled === true);
    return trader.snapshot();
  }));

  router.post('/open', handle(async (req) => {
    const symbol = normalizeSymbol(req.body?.symbol);
    const price = await fetchPrice(symbol);
    trader.open(symbol, price ?? NaN);
    return trader.snapshot();
  }));

  router.post('/close', handle(async (req) => {
    const symbol = normalizeSymbol(req.body?.symbol);
    const price = await fetchPrice(symbol);
    trader.close(symbol, price ?? NaN);
    return trader.snapshot();
  }));

  router.post('/kill', handle(async () => {
    await refresh();
    trader.killSwitch();
    return trader.snapshot();
  }));

  return { router, trader, refresh };
}

/** Background stop-loss monitor. Call once at server startup. */
export function startAutoTradeLoop(refresh, ms = REFRESH_MS) {
  const timer = setInterval(() => {
    refresh().catch((err) => console.error('[autotrade]', err.message));
  }, ms);
  timer.unref?.();
  return timer;
}
