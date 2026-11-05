import React, { useEffect, useState } from 'react';

type Props = { status?: string | null; source?: string | null; lastUpdated?: string | null; timestamp?: number };

export const QuoteFreshness: React.FC<Props> = ({ status, source, lastUpdated, timestamp }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);
  const updated = lastUpdated || (timestamp ? new Date(timestamp).toISOString() : null);
  const ageMs = updated ? now - Date.parse(updated) : Number.POSITIVE_INFINITY;
  const isClosed = status === 'CLOSED';
  const label = isClosed
    ? 'Market Closed, final close 15:30'
    : status === 'STALE' || (status === 'LIVE' && ageMs > 15_000)
      ? 'STALE'
      : status === 'LIVE'
        ? 'LIVE'
        : status === 'DELAYED'
          ? 'DELAYED'
          : 'UNAVAILABLE';
  const timeLabel = updated && Number.isFinite(Date.parse(updated))
    ? new Date(updated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'no timestamp';
  return (
    <span className="inline-flex max-w-full items-center gap-1 text-[9px] leading-4 text-ink-3" title={`${label} · ${source || 'no source'} · ${updated || 'no timestamp'}`}>
      <span className={label === 'LIVE' ? 'font-bold text-info' : 'font-semibold text-ink-3'}>{label}</span>
      <span aria-hidden="true">·</span><span className="truncate">{source || 'No feed'}</span>
      <span aria-hidden="true">·</span><time dateTime={updated || undefined}>{timeLabel}</time>
    </span>
  );
};
