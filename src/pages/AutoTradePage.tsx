import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import {
  autoTradeApi,
  type Config,
  type Mode,
  type Position,
  type Report,
  type State,
} from '../lib/autotradeApi';
import { AnimatedNumber, Reveal, ThemeToggle, fadeUp, stagger } from '../components/motion/primitives';

const POLL_MS = 15_000;

const MODE_PILL: Record<Mode, string> = {
  NORMAL: 'pill-accent',
  PROTECT: 'pill-up',
  DEFENSIVE: 'pill-warn',
};

const STATUS_PILL: Record<State['status'], string> = {
  LIVE: 'pill-up',
  PAUSED: 'pill-accent',
  HALTED: 'pill-down',
};

const CONFIG_FIELDS: { key: keyof Config; label: string; step: number; hint: string }[] = [
  { key: 'capital', label: 'Capital (₹)', step: 1000, hint: 'Paper bankroll' },
  { key: 'riskPerTradePct', label: 'Risk per trade (%)', step: 0.1, hint: 'Sizes each position' },
  { key: 'initialStopPct', label: 'Initial stop (%)', step: 0.1, hint: 'Hard stop below entry' },
  { key: 'trailingStopPct', label: 'Trailing stop (%)', step: 0.1, hint: 'Baseline trail below peak' },
  { key: 'takeProfitPct', label: 'Take profit (%)', step: 0.5, hint: '0 disables' },
  { key: 'maxDailyLossPct', label: 'Daily loss limit (%)', step: 0.5, hint: 'Kill switch threshold' },
  { key: 'dailyProfitLockPct', label: 'Profit lock at (%)', step: 0.5, hint: 'Tightens stops above this' },
  { key: 'maxOpenPositions', label: 'Max open positions', step: 1, hint: 'Concurrent trades' },
];

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const inr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

export function AutoTradePage() {
  const { wallet, openDepositModal, consumeCredits } = useWallet();
  const [state, setState] = useState<State | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [draft, setDraft] = useState<Config | null>(null);
  const [symbol, setSymbol] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, r] = await Promise.all([autoTradeApi.state(), autoTradeApi.report()]);
      setState(s);
      setReport(r);
      setDraft((d) => d ?? s.config);
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const act = async (fn: () => Promise<State>) => {
    setBusy(true);
    try {
      setState(await fn());
      setReport(await autoTradeApi.report());
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const onOpen = async () => {
    if (!symbol.trim()) return;
    const creditRes = await consumeCredits('autotrade', 10, symbol.trim());
    if (!creditRes.ok) {
      setError(creditRes.error || 'Opening an auto-trade requires 10 Credits. Please recharge your wallet.');
      openDepositModal('credits');
      return;
    }
    void act(() => autoTradeApi.open(symbol.trim()));
    setSymbol('');
  };

  const onKill = () => {
    if (window.confirm('Kill switch: close all positions and disable auto-trading?')) {
      void act(() => autoTradeApi.kill());
    }
  };

  const onSaveConfig = () => {
    if (draft) void act(() => autoTradeApi.updateConfig(draft));
  };

  return (
    <div className="min-h-screen px-4 py-6 md:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <motion.header
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="flex flex-wrap items-center justify-between gap-4"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] muted">DHRU.AI · Paper trading</p>
          <h1 className="text-3xl font-bold gradient-text">Auto-Trade Desk</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {state && (
            <span className={`pill ${STATUS_PILL[state.status]}`}>
              <span className="live-dot mr-2" aria-hidden />
              {state.status}
            </span>
          )}
          <ThemeToggle />
          <button
            className="btn btn-primary"
            disabled={!state || busy || state.killed}
            onClick={() => state && void act(() => autoTradeApi.enable(!state.enabled))}
          >
            {state?.enabled ? 'Pause' : 'Enable auto-trading'}
          </button>
          <button className="btn btn-danger" disabled={!state || busy} onClick={onKill}>
            ⏻ Kill switch
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="glass p-4 text-sm down"
            role="alert"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {!state ? (
        <div className="glass h-48 shimmer" aria-label="Loading" />
      ) : (
        <>
          {/* Quantitative Wallet & Credits Banner */}
          <div className="glass p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0 font-bold">
                ⚡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">DHRU Quantitative Wallet</h3>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    wallet.premiumUnlocked ? 'bg-pos-tint text-pos border-pos/30' : 'bg-warn-tint text-warn border-warn/30'
                  }`}>
                    {wallet.premiumUnlocked ? '✨ SMC Unlocked' : 'Standard'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs mt-0.5">
                  <span className="font-mono">Credits: <strong className="text-amber-500 font-bold">{wallet.credits}</strong></span>
                  <span className="text-line">•</span>
                  <span className="font-mono">Trading Funds: <strong className="text-emerald-500 font-bold">₹{wallet.tradingBalance.toLocaleString()}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => openDepositModal('credits')}
                className="btn btn-secondary flex-1 sm:flex-none text-xs font-bold"
              >
                ⚡ Buy Credits
              </button>
              <button
                type="button"
                onClick={() => openDepositModal('funds')}
                className="btn btn-primary flex-1 sm:flex-none text-xs font-bold"
              >
                + Add Funds (UPI)
              </button>
            </div>
          </div>

          {/* Stats */}
          <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Equity" value={state.equity} prefix="₹" />
            <Stat label="Day P&L" value={state.dayPnl} prefix="₹" tone={state.dayPnl >= 0 ? 'up' : 'down'} />
            <Stat label="Day P&L %" value={state.dayPnlPct} suffix="%" tone={state.dayPnlPct >= 0 ? 'up' : 'down'} />
            <Stat label="Open positions" value={state.positions.length} decimals={0} />
          </motion.div>

          <Reveal>
            <DailyMeter state={state} />
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Reveal>
                <div className="glass p-5 space-y-3">
                  <h2 className="font-semibold">Manual entry</h2>
                  <p className="text-xs muted">Uses risk sizing and the initial stop. Stops are managed automatically.</p>
                  <div className="flex gap-2">
                    <input
                      className="field"
                      placeholder="e.g. RELIANCE or TCS.NS"
                      value={symbol}
                      onChange={(e) => setSymbol(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
                      aria-label="Symbol"
                    />
                    <button className="btn btn-primary" disabled={busy || !symbol.trim() || !state.enabled} onClick={onOpen}>
                      Open
                    </button>
                  </div>
                </div>
              </Reveal>

              <Reveal>
                <div className="glass p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Risk parameters</h2>
                    <button className="btn btn-ghost" disabled={busy || !draft} onClick={onSaveConfig}>
                      Save
                    </button>
                  </div>
                  {draft && (
                    <div className="grid sm:grid-cols-2 gap-3">
                      {CONFIG_FIELDS.map((f) => (
                        <label key={f.key} className="space-y-1">
                          <span className="text-xs font-medium">{f.label}</span>
                          <input
                            type="number"
                            className="field"
                            step={f.step}
                            value={draft[f.key]}
                            onChange={(e) => setDraft({ ...draft, [f.key]: Number(e.target.value) })}
                          />
                          <span className="text-[11px] muted">{f.hint}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            </div>

            <Reveal>
              <div className="glass p-5 space-y-4 h-full">
                <h2 className="font-semibold">Open positions</h2>
                {state.positions.length === 0 && (
                  <p className="text-sm muted py-8 text-center">No open positions. Stops are armed automatically on entry.</p>
                )}
                <AnimatePresence initial={false}>
                  {state.positions.map((p) => (
                    <PositionCard key={p.id} p={p} disabled={busy} onClose={() => void act(() => autoTradeApi.close(p.symbol))} />
                  ))}
                </AnimatePresence>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <ReportCard report={report} />
          </Reveal>

          <div className="grid lg:grid-cols-2 gap-6">
            <Reveal>
              <div className="glass p-5">
                <h2 className="font-semibold mb-3">Closed trades</h2>
                {state.closed.length === 0 ? (
                  <p className="text-sm muted">No closed trades yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="muted text-xs uppercase">
                        <tr className="text-left">
                          <th className="py-2">Symbol</th><th>Qty</th><th>Entry → Exit</th><th>Reason</th><th className="text-right">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {state.closed.slice(0, 15).map((c) => (
                          <tr key={c.id} className="border-t" style={{ borderColor: 'var(--border)' }}>
                            <td className="py-2 font-medium">{c.symbol}</td>
                            <td>{c.qty}</td>
                            <td>{c.entry} → {c.exit}</td>
                            <td><span className="pill pill-accent">{c.reason}</span></td>
                            <td className={`text-right ${c.pnl >= 0 ? 'up' : 'down'}`}>{inr(c.pnl)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Reveal>

            <Reveal>
              <div className="glass p-5">
                <h2 className="font-semibold mb-3">Activity</h2>
                <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {state.events.slice(0, 30).map((e) => (
                      <motion.li
                        key={`${e.at}-${e.message}`}
                        layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm border-l-2 pl-3"
                        style={{ borderColor: 'var(--accent)' }}
                      >
                        <span className="text-[11px] muted mr-2">{new Date(e.at).toLocaleTimeString('en-IN')}</span>
                        {e.message}
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            </Reveal>
          </div>

          <p className="text-xs muted text-center pb-8">
            Paper trading only. Simulated fills at last available price. Educational use; not investment advice.
          </p>
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  prefix,
  suffix,
  decimals = 2,
  tone,
}: {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  tone?: 'up' | 'down';
}) {
  return (
    <motion.div variants={fadeUp} className="glass hoverable p-5">
      <p className="text-xs uppercase tracking-wider muted">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${tone ?? ''}`}>
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} decimals={decimals} />
      </p>
    </motion.div>
  );
}

function DailyMeter({ state }: { state: State }) {
  const min = -state.limits.maxDailyLossPct;
  const max = Math.max(state.limits.dailyProfitLockPct * 2, 1);
  const range = max - min;
  const pointer = clamp(((state.dayPnlPct - min) / range) * 100, 0, 100);
  const lockAt = clamp(((state.limits.dailyProfitLockPct - min) / range) * 100, 0, 100);

  return (
    <div className="glass p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Daily risk meter</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs muted">Stop regime</span>
          <span className={`pill ${MODE_PILL[state.protectionMode]}`}>{state.protectionMode}</span>
        </div>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: '100%', opacity: 0.35 }} />
        <motion.div
          className="absolute inset-y-0 left-0 w-1.5 rounded-full"
          style={{ background: 'var(--text)', boxShadow: '0 0 12px var(--text)' }}
          initial={false}
          animate={{ left: `${pointer}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
        <div className="absolute inset-y-0 w-px" style={{ left: `${lockAt}%`, background: 'var(--up)' }} aria-hidden />
      </div>
      <div className="flex justify-between text-[11px] muted">
        <span>−{state.limits.maxDailyLossPct}% kill switch</span>
        <span>0%</span>
        <span>+{state.limits.dailyProfitLockPct}% profit lock</span>
      </div>
    </div>
  );
}

function PositionCard({ p, disabled, onClose }: { p: Position; disabled: boolean; onClose: () => void }) {
  const top = Math.max(p.takeProfit ?? p.hwm, p.hwm, p.lastPrice);
  const span = top - p.stop;
  const progress = span > 0 ? clamp(((p.lastPrice - p.stop) / span) * 100, 0, 100) : 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      className="rounded-2xl p-4 space-y-3 border"
      style={{ borderColor: 'var(--border)', background: 'color-mix(in srgb, var(--surface-solid) 60%, transparent)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{p.symbol}</p>
          <p className="text-xs muted">{p.qty} sh · entry {p.entry}</p>
        </div>
        <div className="text-right">
          <p className={`font-semibold ${p.unrealized >= 0 ? 'up' : 'down'}`}>
            {inr(p.unrealized)} ({p.unrealizedPct}%)
          </p>
          <div className="flex gap-1 justify-end mt-1">
            <span className={`pill ${MODE_PILL[p.trailMode]}`}>{p.trailMode}</span>
            <span className="pill pill-accent">{p.stopKind === 'TRAILING' ? 'TRAILING STOP' : 'INITIAL STOP'}</span>
          </div>
        </div>
      </div>

      <div>
        <div className="meter-track">
          <motion.div
            className="meter-fill h-full"
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          />
        </div>
        <div className="flex justify-between text-[11px] muted mt-1">
          <span>Stop {p.stop}</span>
          <span>Last {p.lastPrice}</span>
          <span>{p.takeProfit ? `TP ${p.takeProfit}` : `Peak ${p.hwm}`}</span>
        </div>
      </div>

      <button className="btn btn-ghost w-full justify-center" disabled={disabled} onClick={onClose}>
        Close position
      </button>
    </motion.div>
  );
}

function ReportCard({ report }: { report: Report | null }) {
  if (!report) return null;
  const items: { label: string; value: ReactNode }[] = [
    { label: 'Trades today', value: report.trades },
    { label: 'Win rate', value: `${report.winRate}%` },
    { label: 'Profit factor', value: report.profitFactor ?? '—' },
    { label: 'Day P&L', value: `${inr(report.dayPnl)} (${report.dayPnlPct}%)` },
  ];

  return (
    <div className="glass p-6 space-y-5 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-30 blur-3xl" style={{ background: 'var(--accent-2)' }} aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] muted">DHRU Intelligence · {report.dayKey}</p>
          <h2 className="text-xl font-bold mt-1">{report.headline}</h2>
        </div>
        <span className={`pill ${report.killed ? 'pill-down' : MODE_PILL[report.mode]}`}>
          {report.killed ? 'HALTED' : report.mode}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-xl p-3" style={{ background: 'color-mix(in srgb, var(--surface-solid) 60%, transparent)' }}>
            <p className="text-[11px] uppercase muted">{it.label}</p>
            <p className="font-semibold mt-1">{it.value}</p>
          </div>
        ))}
      </div>

      <motion.ul variants={stagger} initial="hidden" animate="show" className="space-y-2">
        {report.bullets.map((b) => (
          <motion.li key={b} variants={fadeUp} className="text-sm flex gap-2">
            <span style={{ color: 'var(--accent)' }}>▸</span>
            <span>{b}</span>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
}
