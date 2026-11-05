// DHRU.AI - One-Tap AUTO TRADE button (master spec Sections 10 + 11)
//
// ONE button does everything:
//   idle      -> "AUTO TRADE": scans the desk, picks the best setup (or WAIT),
//                decides BUY/SELL, legs, quantity, entry, stop and the
//                scalp / swing / runner targets, then arms the basket.
//   scanning  -> shows progress.
//   basket on -> becomes "STOP & EXIT ALL" (kill switch).
// While switched on, it re-scans by itself after each basket finishes (with a
// per-symbol cooldown) until the user stops it. Execution, stops, break-even,
// profit lock and trailing are handled by AutoTradeMonitor from live ticks.
// Paper simulation only: no live broker orders are sent.

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Zap, Loader2, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTrading } from '../../context/TradingContext';
import { readAutoTradePlans, requestStopAutoTradePlan } from '../../services/autoTradePlans';
import { ScanResult, scanAndArm, setSymbolCooldown } from '../../services/autoTradeScanner';
import { requestWakeLock, releaseWakeLock } from '../../services/screenWakeLock';

const AUTO_KEY = 'dhru_one_tap_on';
const WAIT_RESCAN_MS = 5 * 60_000;
const DONE_RESCAN_MS = 60_000;
const TICK_MS = 15_000;

type Phase = 'idle' | 'scanning' | 'armed' | 'open';

function readPhase(): Phase {
  const plans = readAutoTradePlans();
  if (!plans.length) return 'idle';
  return plans.some(plan => plan.stage === 'open') ? 'open' : 'armed';
}

export const OneTapAutoTrade: React.FC = () => {
  const { marketMode } = useAuth();
  const { cashBalance, marginAvailable, brokerConfig } = useTrading();
  const [phase, setPhase] = useState<Phase>(readPhase);
  const [scanning, setScanning] = useState(false);
  const [autoOn, setAutoOn] = useState(() => localStorage.getItem(AUTO_KEY) === '1');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [events, setEvents] = useState<string[]>([]);
  const [expanded, setExpanded] = useState(true);
  const nextScanAt = useRef(0);
  const scanningRef = useRef(false);
  const latest = useRef({ marketMode, cashBalance, marginAvailable });
  latest.current = { marketMode, cashBalance, marginAvailable };

  const simulationOk = brokerConfig.broker === 'simulation' && brokerConfig.mode === 'simulation';

  const setAuto = useCallback((on: boolean) => {
    setAutoOn(on);
    localStorage.setItem(AUTO_KEY, on ? '1' : '0');
  }, []);

  // Screen Wake Lock API (Phase 5.4): keep device awake while a trade is armed or open
  useEffect(() => {
    if (phase === 'open' || phase === 'armed') {
      void requestWakeLock();
    } else {
      void releaseWakeLock();
    }
    return () => {
      void releaseWakeLock();
    };
  }, [phase]);

  // Keep the phase in sync with the plan store and surface engine messages.
  useEffect(() => {
    const sync = () => setPhase(prev => (prev === 'scanning' ? prev : readPhase()));
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent).detail as { symbol?: string; stage?: string; message?: string } | undefined;
      if (detail?.message) setEvents(prev => [detail.message!, ...prev].slice(0, 6));
      // A finished basket puts that symbol on cooldown and schedules the next scan.
      if (detail?.stage === 'done' && detail.symbol && /auto-trade complete/i.test(detail.message || '')) {
        setSymbolCooldown(detail.symbol);
        nextScanAt.current = Date.now() + DONE_RESCAN_MS;
      }
      sync();
    };
    window.addEventListener('dhru-auto-trade-plan', sync);
    window.addEventListener('dhru-auto-trade-update', onUpdate);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('dhru-auto-trade-plan', sync);
      window.removeEventListener('dhru-auto-trade-update', onUpdate);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const runScan = useCallback(async () => {
    if (scanningRef.current) return;
    scanningRef.current = true;
    setScanning(true);
    setPhase('scanning');
    try {
      const { marketMode: market, cashBalance: cash, marginAvailable: margin } = latest.current;
      const res = await scanAndArm({ market, cashBalance: cash, marginAvailable: margin });
      setResult(res);
      setExpanded(true);
      if (res.status === 'WAIT') nextScanAt.current = Date.now() + WAIT_RESCAN_MS;
    } catch (err) {
      setResult({
        status: 'WAIT',
        mode: 'PAPER',
        market: latest.current.marketMode,
        reason: `Scan failed: ${(err as Error)?.message || 'unknown error'}. No orders were placed.`,
        report: { direction: 'WAIT', action: 'WAIT' },
        scanned: 0,
        considered: []
      });
      nextScanAt.current = Date.now() + WAIT_RESCAN_MS;
    } finally {
      scanningRef.current = false;
      setScanning(false);
      setPhase(readPhase());
    }
  }, []);

  // Auto mode: whenever flat and the cooldown has passed, scan again.
  useEffect(() => {
    if (!autoOn || !simulationOk) return;
    const timer = setInterval(() => {
      if (scanningRef.current || readAutoTradePlans().length > 0) return;
      if (Date.now() < nextScanAt.current) return;
      void runScan();
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [autoOn, simulationOk, runScan]);

  const stopAll = useCallback(() => {
    setAuto(false);
    readAutoTradePlans().forEach(plan => {
      requestStopAutoTradePlan(plan.symbol);
      // Synchronize stop with server engine
      fetch('/api/autotrade/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: plan.symbol, reason: 'STOP & EXIT ALL pressed' })
      }).catch(() => {});
    });
    setPhase(readPhase());
    setEvents(prev => ['⏹️ STOP & EXIT ALL pressed. Pending plans cancelled; open legs close at the next live tick.', ...prev].slice(0, 6));
  }, [setAuto]);

  const onPress = () => {
    if (phase === 'scanning') return;
    if (phase === 'open' || phase === 'armed') {
      stopAll();
      return;
    }
    if (autoOn) {
      // Already switched on and flat: pressing turns it off.
      setAuto(false);
      return;
    }
    setAuto(true);
    nextScanAt.current = 0;
    void runScan();
  };

  const label =
    phase === 'scanning' ? 'SCANNING MARKET…'
    : phase === 'open' ? 'STOP & EXIT ALL'
    : phase === 'armed' ? 'CANCEL & STOP'
    : autoOn ? 'AUTO ON · TAP TO STOP'
    : 'AUTO TRADE';

  const danger = phase === 'open' || phase === 'armed';
  const report = result?.report as Record<string, any> | undefined;
  const showCard = Boolean(result) || events.length > 0 || !simulationOk;

  return (
    <div className="fixed right-3 bottom-24 lg:bottom-6 z-40 w-[min(22rem,calc(100vw-1.5rem))] flex flex-col items-end gap-2" data-testid="one-tap-auto-trade">
      {showCard && (
        <div role="status" className="w-full rounded-2xl border border-line bg-surface shadow-lg text-xs text-ink">
          <button
            onClick={() => setExpanded(v => !v)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 font-mono font-bold uppercase tracking-wider"
            aria-expanded={expanded}
          >
            <span>
              PAPER · {result ? (result.status === 'ARMED' ? 'BASKET ARMED' : 'WAIT') : 'AUTO-TRADE'}
              {autoOn ? ' · AUTO' : ''}
            </span>
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {expanded && (
            <div className="px-3 pb-3 space-y-2 max-h-[50vh] overflow-y-auto">
              {!simulationOk && (
                <p className="text-neg">Auto-trade runs in Simulation (paper) mode only. Switch the broker to Simulation to use it.</p>
              )}

              {result && <p className="leading-relaxed">{result.reason}</p>}

              {result?.status === 'ARMED' && report && (
                <div className="rounded-xl bg-surface-2 border border-line p-2 font-mono space-y-1">
                  <div className="flex justify-between"><span className="text-ink-3">Action</span><b>{report.action} {report.symbol}</b></div>
                  <div className="flex justify-between"><span className="text-ink-3">Entry zone</span><b>{report.entryRange}</b></div>
                  <div className="flex justify-between"><span className="text-ink-3">Stop-loss</span><b>{report.stopLoss}</b></div>
                  <div className="flex justify-between"><span className="text-ink-3">Legs · qty</span><b>{report.predictedPositionsCount} · {report.totalQty}</b></div>
                  <div className="flex justify-between"><span className="text-ink-3">Risk budget</span><b>{Number(report.riskBudget).toLocaleString('en-IN')}</b></div>
                  <div className="flex justify-between"><span className="text-ink-3">R:R to TP2</span><b>{report.riskReward}</b></div>
                  {Array.isArray(report.tiers) && report.tiers.map((t: any) => (
                    <div key={t.tier} className="flex justify-between">
                      <span className="text-ink-3">{t.label} ×{t.legs.length}</span>
                      <b>{t.target} ({t.expectedPct})</b>
                    </div>
                  ))}
                  {report.council && (
                    <div className="flex justify-between border-t border-line/50 pt-1">
                      <span className="text-ink-3">Council Consensus</span>
                      <b className="text-brand">{report.council.agreementPercent}% {report.council.consensusDirection}</b>
                    </div>
                  )}
                  {report.quantMetrics && (
                    <div className="flex justify-between">
                      <span className="text-ink-3">Quant EV · Kelly</span>
                      <b>{report.quantMetrics.expectedValueR > 0 ? '+' : ''}{report.quantMetrics.expectedValueR}R · {(report.quantMetrics.kellyFraction * 100).toFixed(1)}%</b>
                    </div>
                  )}
                  <div className="text-ink-3">Win rate: {report.winRate ?? 'Unvalidated'}</div>
                </div>
              )}

              {result?.status === 'WAIT' && report?.supportResistance && (
                <p className="font-mono text-ink-3">{report.symbol} range: {report.supportResistance}</p>
              )}

              {result && result.considered.length > 0 && (
                <details>
                  <summary className="cursor-pointer text-ink-3">Scanned {result.scanned} · why symbols were skipped</summary>
                  <ul className="mt-1 space-y-0.5 font-mono text-ink-3">
                    {result.considered.filter(c => c.rejected).slice(0, 12).map(c => (
                      <li key={c.symbol}>{c.symbol}: {c.rejected}</li>
                    ))}
                  </ul>
                </details>
              )}

              {events.length > 0 && (
                <ul className="space-y-1 border-t border-line pt-2">
                  {events.map((e, i) => <li key={i} className="leading-snug">{e}</li>)}
                </ul>
              )}

              <p className="text-ink-3 leading-snug">
                Paper simulation. Signals are probabilistic, not guaranteed. Stops can slip in gaps. No live broker orders are sent.
              </p>
            </div>
          )}
        </div>
      )}

      <button
        onClick={onPress}
        disabled={phase === 'scanning' || (!simulationOk && !danger)}
        className={`min-h-[44px] px-5 py-3 rounded-full shadow-lg text-xs font-black font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 ${
          danger ? 'bg-neg-fill text-on-brand hover:opacity-90' : 'bg-brand-fill hover:bg-brand-fill-hover text-on-brand'
        }`}
        aria-label={label}
      >
        {phase === 'scanning' ? <Loader2 className="w-4 h-4 animate-spin" /> : danger ? <Square className="w-4 h-4" /> : <Zap className="w-4 h-4 text-amber-300" />}
        {label}
      </button>
    </div>
  );
};
