import React, { useEffect, useState } from 'react';
import { getPatterns } from '../services/api';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Detection {
  name: string;
  type: string;
}

interface PatternRow {
  symbol: string;
  name: string;
  sector?: string;
  price: number;
  timeframe: string;
  asOf: number | null;
  source: string;
  candles: Candle[];
  patterns: Detection[];
}

interface Props {
  onSelectStock: (symbol: string) => void;
}

const dateLabel = (value: number | null) => value
  ? new Date(value * 1000).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }) + ' IST'
  : 'Date unavailable';

export const PatternExplorerPage: React.FC<Props> = ({ onSelectStock }) => {
  const [rows, setRows] = useState<PatternRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    getPatterns()
      .then(result => setRows(Array.isArray(result?.patterns) ? result.patterns : []))
      .catch(() => setError('Pattern data could not be loaded. Check the connection and retry.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Daily candle scan</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">Candlestick patterns</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-300">Heuristic descriptions of recent OHLC bars. They are not signals and have no measured predictive performance.</p>
        </div>
        <button onClick={load} disabled={loading} className="min-h-11 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">{loading ? 'Loading…' : 'Refresh'}</button>
      </header>

      {loading && <p className="py-8 text-sm text-slate-500">Loading pattern results from available candle data…</p>}
      {!loading && error && <div className="space-y-2 py-6"><p className="text-sm text-slate-700 dark:text-slate-200">{error}</p><button onClick={load} className="min-h-11 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-950">Retry</button></div>}
      {!loading && !error && rows.length === 0 && <p className="py-8 text-sm text-slate-600 dark:text-slate-300">No pattern was detected in the available candles. Missing candle data is not replaced with a sample chart.</p>}

      {!loading && !error && rows.map(row => (
        <section key={row.symbol} className="border-b border-slate-200 py-4 dark:border-slate-800">
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px] sm:items-center">
            <div className="min-w-0">
              <button onClick={() => onSelectStock(row.symbol)} className="text-left text-sm font-semibold text-blue-700 hover:underline dark:text-sky-300">{row.name} <span className="font-mono text-xs text-slate-500">{row.symbol}</span></button>
              <p className="mt-1 text-xs text-slate-500">{row.timeframe} · {dateLabel(row.asOf)} · {row.source}</p>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-800 dark:text-slate-200">
                {row.patterns.map(pattern => <li key={`${row.symbol}-${pattern.name}`}><span className="font-medium">{pattern.name}</span><span className="ml-1 text-xs text-slate-500">{pattern.type}</span></li>)}
              </ul>
            </div>
            <CandleStrip candles={row.candles} />
          </div>
        </section>
      ))}
    </div>
  );
};

const CandleStrip: React.FC<{ candles: Candle[] }> = ({ candles }) => {
  if (!candles.length) return <p className="text-xs text-slate-500">No candle data for this period.</p>;
  const lows = candles.map(candle => candle.low);
  const highs = candles.map(candle => candle.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const span = max - min || 1;
  const y = (value: number) => 52 - ((value - min) / span) * 44;
  const step = 170 / candles.length;
  return (
    <svg viewBox="0 0 180 56" role="img" aria-label={`${candles.length} recent real OHLC candles`} className="h-14 w-full max-w-[180px] justify-self-start text-slate-700 dark:text-slate-200 sm:justify-self-end">
      {candles.map((candle, index) => {
        const x = 5 + index * step + step / 2;
        const rising = candle.close >= candle.open;
        const top = Math.min(y(candle.open), y(candle.close));
        const bodyHeight = Math.max(1.5, Math.abs(y(candle.open) - y(candle.close)));
        return <g key={`${candle.time}-${index}`} stroke={rising ? '#0F7B4F' : '#B3261E'} fill={rising ? '#0F7B4F' : '#B3261E'}><line x1={x} x2={x} y1={y(candle.high)} y2={y(candle.low)} strokeWidth="1"/><rect x={x - 2} y={top} width="4" height={bodyHeight}/></g>;
      })}
    </svg>
  );
};
