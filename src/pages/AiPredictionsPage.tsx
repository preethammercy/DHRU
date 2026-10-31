import React, { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, RefreshCw } from 'lucide-react';
import { getLiveScenarios } from '../services/api';
import { useLivePrice } from '../context/MarketStreamContext';

interface Horizon {
  label: string;
  expectedMovePct: number;
  historicalEnvelopePct: number;
}

interface LiveScenario {
  status: 'ready' | 'insufficient_data' | 'unavailable';
  symbol: string;
  interval?: string;
  price?: number;
  currency?: string;
  source?: string;
  candleSource?: string;
  quoteAsOf?: string;
  generatedAt?: string;
  observations?: number;
  bias?: string;
  model?: string;
  horizons?: Horizon[];
  message?: string;
  quote?: { name?: string; price?: number; currency?: string; source?: string; lastUpdated?: string };
}

interface Props {
  currentSymbol: string;
  onSelectStock: (symbol: string) => void;
  onTradeStock?: (symbol: string) => void;
}

const formatTime = (value?: string) => value && Number.isFinite(Date.parse(value))
  ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST'
  : 'Time unavailable';

export const AiPredictionsPage: React.FC<Props> = ({ currentSymbol, onSelectStock }) => {
  const symbol = currentSymbol || 'RELIANCE.NS';
  const [scenario, setScenario] = useState<LiveScenario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const live = useLivePrice(symbol, scenario?.quote);

  const refresh = async () => {
    try {
      const next = await getLiveScenarios(symbol);
      setScenario(next);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scenario refresh failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await getLiveScenarios(symbol);
        if (active) { setScenario(next); setError(''); }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Scenario refresh failed.');
      } finally {
        if (active) setLoading(false);
      }
    };
    setLoading(true);
    setScenario(null);
    load();
    const timer = window.setInterval(load, 15_000);
    return () => { active = false; window.clearInterval(timer); };
  }, [symbol]);

  const currentPrice = live.price > 0 ? live.price : (scenario?.price || 0);
  const currencySymbol = scenario?.currency === 'USD' || symbol.includes('-USD') ? '$' : '₹';
  const liveHorizons = useMemo(() => (scenario?.horizons || []).map(horizon => {
    const center = currentPrice * (1 + horizon.expectedMovePct / 100);
    const radius = currentPrice * horizon.historicalEnvelopePct / 100;
    const digits = currentPrice < 1 ? 6 : 2;
    return { ...horizon, center, low: center - radius, high: center + radius, digits };
  }), [scenario?.horizons, currentPrice]);

  return (
    <section className="space-y-6 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Experimental model · live inputs</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Live market scenarios</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            Rolling recent-return and volatility calculations for the selected market. The live quote re-anchors each range as prices move; model inputs refresh every 15 seconds.
          </p>
        </div>
        <button onClick={refresh} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <div>
          <p className="text-xs text-slate-500">Selected instrument</p>
          <button onClick={() => onSelectStock(symbol)} className="mt-1 font-semibold text-blue-700 hover:underline dark:text-sky-300">{scenario?.quote?.name || symbol} <span className="font-mono text-xs text-slate-500">{symbol}</span></button>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Latest available price</p>
          <p className={`mt-1 font-mono text-xl font-semibold ${live.flash === 'up' ? 'flash-up' : live.flash === 'down' ? 'flash-down' : 'text-slate-950 dark:text-white'}`}>
            {currentPrice > 0 ? `${currencySymbol}${currentPrice.toLocaleString(scenario?.currency === 'USD' ? 'en-US' : 'en-IN', { minimumFractionDigits: currentPrice < 1 ? 4 : 2, maximumFractionDigits: currentPrice < 1 ? 6 : 2 })}` : '—'}
          </p>
        </div>
      </div>

      {loading && !scenario && <p className="py-8 text-sm text-slate-500">Loading current quote and recent candles…</p>}
      {error && <div className="rounded-md border border-rose-300 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">{error} <button onClick={refresh} className="ml-2 underline">Retry</button></div>}
      {scenario?.status === 'insufficient_data' && <p className="rounded-md border border-slate-200 p-4 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-300">{scenario.message || 'There are not enough recent candles to calculate a scenario.'}</p>}

      {scenario?.status === 'ready' && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {liveHorizons.map(horizon => (
              <article key={horizon.label} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">Historical range · {horizon.label}</p>
                    <h2 className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">{scenario.bias}</h2>
                  </div>
                  <Activity className="h-5 w-5 text-slate-500" aria-hidden="true" />
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-right font-mono dark:border-slate-800">
                  <div className="text-left"><p className="text-[10px] uppercase text-slate-500">Low</p><p className="mt-1 text-xs text-rose-700 dark:text-rose-300">{currencySymbol}{horizon.low.toLocaleString(undefined, { minimumFractionDigits: horizon.digits, maximumFractionDigits: horizon.digits })}</p></div>
                  <div><p className="text-[10px] uppercase text-slate-500">Drift center</p><p className="mt-1 text-xs font-semibold text-slate-900 dark:text-slate-100">{currencySymbol}{horizon.center.toLocaleString(undefined, { minimumFractionDigits: horizon.digits, maximumFractionDigits: horizon.digits })}</p></div>
                  <div><p className="text-[10px] uppercase text-slate-500">High</p><p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">{currencySymbol}{horizon.high.toLocaleString(undefined, { minimumFractionDigits: horizon.digits, maximumFractionDigits: horizon.digits })}</p></div>
                </div>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  {horizon.expectedMovePct >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                  Recent-return drift {horizon.expectedMovePct > 0 ? '+' : ''}{horizon.expectedMovePct}% · historical envelope ±{horizon.historicalEnvelopePct}%
                </p>
              </article>
            ))}
          </div>

          <div className="space-y-1 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500 dark:border-slate-800">
            <p><span className="font-medium text-slate-700 dark:text-slate-300">Model:</span> {scenario.model}; {scenario.observations} recent {scenario.interval} candles.</p>
            <p>Quote source: {scenario.source || 'unavailable'} · Quote time: {formatTime(scenario.quoteAsOf)} · Scenarios refreshed: {formatTime(scenario.generatedAt)}.</p>
            <p>Ranges are not calibrated probability intervals and can be wrong. This experimental model is not a trade recommendation.</p>
          </div>
        </>
      )}
    </section>
  );
};
