import { randomUUID } from 'node:crypto';

const IST_OFFSET_MS = 330 * 60 * 1000;

export const DEFAULT_CONFIG = Object.freeze({
  capital: 100000,
  riskPerTradePct: 1,      // % of capital risked per trade (sizes the position)
  initialStopPct: 2,       // hard stop, % below entry
  trailingStopPct: 1.5,    // baseline trailing distance, % below high-water mark
  takeProfitPct: 4,        // 0 disables take-profit
  maxDailyLossPct: 3,      // kill switch: halt + flatten when day P&L <= -this
  dailyProfitLockPct: 2,   // at/above this day gain, stops tighten to protect profit
  maxOpenPositions: 3,
});

const LIMITS = {
  capital: [1000, 1e9],
  riskPerTradePct: [0.1, 5],
  initialStopPct: [0.2, 15],
  trailingStopPct: [0.2, 15],
  takeProfitPct: [0, 50],
  maxDailyLossPct: [0.5, 20],
  dailyProfitLockPct: [0.2, 20],
  maxOpenPositions: [1, 20],
};

const SYMBOL_RE = /^\^?[A-Z0-9&-]{1,20}(\.[A-Z]{1,4})?$/;

const round2 = (n) => Math.round(n * 100) / 100;
const inr = (n) => `₹${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export function normalizeSymbol(input) {
  const s = String(input ?? '').trim().toUpperCase();
  if (!s) throw new Error('Symbol is required');
  const full = s.includes('.') || s.startsWith('^') ? s : `${s}.NS`;
  if (!SYMBOL_RE.test(full)) throw new Error(`Invalid symbol: ${s}`);
  return full;
}

export function istDateKey(date) {
  return new Date(date.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function validateConfig(input = {}) {
  const cfg = {};
  for (const key of Object.keys(DEFAULT_CONFIG)) {
    cfg[key] = Number(input[key] ?? DEFAULT_CONFIG[key]);
  }
  for (const [key, [min, max]] of Object.entries(LIMITS)) {
    const v = cfg[key];
    if (!Number.isFinite(v) || v < min || v > max) {
      throw new RangeError(`${key} must be between ${min} and ${max}`);
    }
  }
  if (!Number.isInteger(cfg.maxOpenPositions)) {
    throw new RangeError('maxOpenPositions must be a whole number');
  }
  return cfg;
}

/**
 * Adaptive trailing distance driven by today's P&L.
 * PROTECT: after a good day, trail tighter to lock in gains.
 * DEFENSIVE: as losses build, trail tighter to cut damage earlier.
 */
export function adaptiveTrail(baseTrailPct, dayPnlPct, cfg) {
  let mode = 'NORMAL';
  let factor = 1;
  if (dayPnlPct >= cfg.dailyProfitLockPct) {
    mode = 'PROTECT';
    factor = 0.5;
  } else if (dayPnlPct <= -cfg.maxDailyLossPct / 2) {
    mode = 'DEFENSIVE';
    factor = 0.6;
  }
  return { mode, pct: Math.max(0.25, round2(baseTrailPct * factor)) };
}

/** Shares sized by risk per trade, capped by per-position capital allocation. */
export function computeQty(cfg, price) {
  const riskAmount = (cfg.capital * cfg.riskPerTradePct) / 100;
  const stopDistance = (price * cfg.initialStopPct) / 100;
  const byRisk = Math.floor(riskAmount / stopDistance);
  const byAllocation = Math.floor(cfg.capital / cfg.maxOpenPositions / price);
  return Math.max(0, Math.min(byRisk, byAllocation));
}

export function createAutoTrader(input = {}, { now = () => new Date() } = {}) {
  let cfg = validateConfig(input);
  let enabled = false;
  let killed = false;
  let dayKey = istDateKey(now());
  let realizedTotal = 0;
  let dayStartEquity = cfg.capital;
  const positions = new Map(); // symbol -> position
  const closed = [];
  const events = [];

  const log = (type, message) => {
    events.unshift({ at: now().toISOString(), type, message });
    events.length = Math.min(events.length, 200);
  };

  const unrealized = () =>
    [...positions.values()].reduce((s, p) => s + (p.lastPrice - p.entry) * p.qty, 0);
  const equity = () => cfg.capital + realizedTotal + unrealized();
  const dayPnl = () => equity() - dayStartEquity;
  const dayPnlPct = () => (dayStartEquity > 0 ? (dayPnl() / dayStartEquity) * 100 : 0);

  function rollDay() {
    const key = istDateKey(now());
    if (key === dayKey) return;
    dayKey = key;
    killed = false;
    dayStartEquity = equity();
    log('SESSION', `New trading session ${key}. Daily loss limit reset.`);
  }

  function closePosition(pos, price, reason) {
    const pnl = (price - pos.entry) * pos.qty;
    realizedTotal += pnl;
    positions.delete(pos.symbol);
    const record = {
      id: pos.id,
      symbol: pos.symbol,
      qty: pos.qty,
      entry: round2(pos.entry),
      exit: round2(price),
      pnl: round2(pnl),
      pnlPct: round2((price / pos.entry - 1) * 100),
      reason,
      openedAt: pos.openedAt,
      closedAt: now().toISOString(),
      dayKey,
    };
    closed.unshift(record);
    closed.length = Math.min(closed.length, 500);
    log('CLOSE', `${pos.symbol} exited @ ${inr(record.exit)} · ${reason} · P&L ${inr(record.pnl)}`);
    return record;
  }

  function open(rawSymbol, price) {
    rollDay();
    const symbol = normalizeSymbol(rawSymbol);
    if (!enabled) throw new Error('Auto-trading is paused. Enable it before opening trades.');
    if (killed) throw new Error('Daily loss limit reached. New entries are blocked until the next session.');
    if (positions.has(symbol)) throw new Error(`${symbol} already has an open position.`);
    if (positions.size >= cfg.maxOpenPositions) {
      throw new Error(`Max open positions (${cfg.maxOpenPositions}) reached.`);
    }
    if (!Number.isFinite(price) || price <= 0) throw new Error('Live price unavailable for entry.');

    const qty = computeQty(cfg, price);
    if (qty < 1) throw new Error('Position size rounds to zero with current risk settings.');

    const stop = price * (1 - cfg.initialStopPct / 100);
    const pos = {
      id: randomUUID(),
      symbol,
      qty,
      entry: price,
      lastPrice: price,
      hwm: price,
      initialStop: stop,
      stop,
      takeProfit: cfg.takeProfitPct > 0 ? price * (1 + cfg.takeProfitPct / 100) : null,
      stopKind: 'INITIAL',
      trailMode: 'NORMAL',
      openedAt: now().toISOString(),
    };
    positions.set(symbol, pos);
    log('OPEN', `${symbol} ${qty} sh @ ${inr(price)} · initial stop ${inr(stop)}`);
    return pos;
  }

  /** Updates marks, ratchets stops, and executes any exits. */
  function tick(prices = {}) {
    rollDay();

    const fresh = [];
    const stale = [];
    for (const pos of positions.values()) {
      const px = Number(prices[pos.symbol]);
      if (!Number.isFinite(px) || px <= 0) {
        stale.push(pos.symbol);
        continue;
      }
      pos.lastPrice = px;
      if (px > pos.hwm) pos.hwm = px;
      fresh.push(pos);
    }

    const { mode, pct } = adaptiveTrail(cfg.trailingStopPct, dayPnlPct(), cfg);
    const exits = [];

    for (const pos of fresh) {
      pos.trailMode = mode;
      // Trailing only engages once the trade is in profit; the stop never moves down.
      if (pos.hwm > pos.entry) {
        const trailing = pos.hwm * (1 - pct / 100);
        if (trailing > pos.stop) pos.stop = trailing;
      }
      pos.stopKind = pos.stop > pos.initialStop ? 'TRAILING' : 'INITIAL';

      if (pos.lastPrice <= pos.stop) {
        exits.push([pos, pos.stopKind === 'TRAILING' ? 'TRAILING_STOP' : 'STOP_LOSS']);
      } else if (pos.takeProfit && pos.lastPrice >= pos.takeProfit) {
        exits.push([pos, 'TAKE_PROFIT']);
      }
    }

    const closedNow = exits.map(([pos, reason]) => closePosition(pos, pos.lastPrice, reason));

    if (!killed && dayPnlPct() <= -cfg.maxDailyLossPct) {
      killed = true;
      log('RISK', `Day loss ${round2(dayPnlPct())}% breached the ${cfg.maxDailyLossPct}% limit. Flattening and pausing entries.`);
      for (const pos of [...positions.values()]) {
        closedNow.push(closePosition(pos, pos.lastPrice, 'DAILY_LOSS_LIMIT'));
      }
    }

    return { closed: closedNow.map((c) => c.symbol), stale, mode };
  }

  function close(rawSymbol, price, reason = 'MANUAL') {
    const symbol = normalizeSymbol(rawSymbol);
    const pos = positions.get(symbol);
    if (!pos) throw new Error(`No open position for ${symbol}`);
    const exitPrice = Number.isFinite(price) && price > 0 ? price : pos.lastPrice;
    return closePosition(pos, exitPrice, reason);
  }

  function killSwitch() {
    enabled = false;
    killed = true;
    log('KILL', 'Kill switch engaged. Auto-trading disabled and all positions closed.');
    return [...positions.values()].map((p) => closePosition(p, p.lastPrice, 'KILL_SWITCH'));
  }

  function setEnabled(value) {
    rollDay();
    const next = Boolean(value);
    if (next && killed) throw new Error('Daily loss limit is active. Auto-trading resumes next session.');
    enabled = next;
    log('STATUS', enabled ? 'Auto-trading enabled (paper mode).' : 'Auto-trading paused.');
  }

  function updateConfig(patch) {
    const next = validateConfig({ ...cfg, ...patch });
    dayStartEquity += next.capital - cfg.capital; // keep day P&L honest if capital changes
    cfg = next;
    log('CONFIG', 'Risk parameters updated.');
  }

  function snapshot() {
    rollDay();
    const pct = dayPnlPct();
    const { mode } = adaptiveTrail(cfg.trailingStopPct, pct, cfg);
    return {
      paperMode: true,
      enabled,
      killed,
      status: killed ? 'HALTED' : enabled ? 'LIVE' : 'PAUSED',
      dayKey,
      equity: round2(equity()),
      dayPnl: round2(dayPnl()),
      dayPnlPct: round2(pct),
      protectionMode: mode,
      limits: {
        maxDailyLossPct: cfg.maxDailyLossPct,
        dailyProfitLockPct: cfg.dailyProfitLockPct,
      },
      config: { ...cfg },
      positions: [...positions.values()].map((p) => ({
        id: p.id,
        symbol: p.symbol,
        qty: p.qty,
        entry: round2(p.entry),
        lastPrice: round2(p.lastPrice),
        hwm: round2(p.hwm),
        stop: round2(p.stop),
        initialStop: round2(p.initialStop),
        takeProfit: p.takeProfit ? round2(p.takeProfit) : null,
        stopKind: p.stopKind,
        trailMode: p.trailMode,
        openedAt: p.openedAt,
        unrealized: round2((p.lastPrice - p.entry) * p.qty),
        unrealizedPct: round2((p.lastPrice / p.entry - 1) * 100),
        stopDistancePct: round2(((p.lastPrice - p.stop) / p.lastPrice) * 100),
      })),
      closed: closed.slice(0, 50),
      events: events.slice(0, 60),
    };
  }

  function report() {
    rollDay();
    const today = closed.filter((c) => c.dayKey === dayKey);
    const wins = today.filter((c) => c.pnl > 0);
    const losses = today.filter((c) => c.pnl < 0);
    const grossWin = wins.reduce((s, c) => s + c.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, c) => s + c.pnl, 0));
    const reasons = {};
    for (const c of today) reasons[c.reason] = (reasons[c.reason] ?? 0) + 1;

    const pct = dayPnlPct();
    const { mode } = adaptiveTrail(cfg.trailingStopPct, pct, cfg);

    let headline = 'Trading within normal risk limits';
    if (killed) headline = 'Loss limit triggered. Trading halted for this session';
    else if (mode === 'PROTECT') headline = 'Profit protection active. Stops tightened to lock gains';
    else if (mode === 'DEFENSIVE') headline = 'Defensive mode. Stops tightened as losses build';

    const bullets = [
      `Day P&L ${inr(round2(dayPnl()))} (${round2(pct)}%) against a -${cfg.maxDailyLossPct}% daily loss limit.`,
      `${today.length} closed trade(s): ${wins.length} winner(s), ${losses.length} loser(s).`,
      `${positions.size} open position(s). Stops start at -${cfg.initialStopPct}% and only ratchet up.`,
    ];
    if (mode !== 'NORMAL') {
      bullets.push(
        mode === 'PROTECT'
          ? 'Trailing distance is tighter than baseline to protect today’s gains.'
          : 'Trailing distance is tighter than baseline to limit further damage.',
      );
    }
    if (reasons.STOP_LOSS) {
      bullets.push(`${reasons.STOP_LOSS} stop-loss exit(s) today. Review entry quality before adding size.`);
    }
    if (today.length === 0) bullets.push('No closed trades yet this session.');

    return {
      dayKey,
      headline,
      bullets,
      trades: today.length,
      wins: wins.length,
      losses: losses.length,
      winRate: today.length ? round2((wins.length / today.length) * 100) : 0,
      profitFactor: grossLoss > 0 ? round2(grossWin / grossLoss) : null,
      dayPnl: round2(dayPnl()),
      dayPnlPct: round2(pct),
      reasons,
      mode,
      killed,
    };
  }

  return {
    snapshot,
    report,
    tick,
    open,
    close,
    killSwitch,
    setEnabled,
    updateConfig,
    openSymbols: () => [...positions.keys()],
  };
}
