// DHRU.AI - Global System Broadcast & Announcement Banner
import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, AlertCircle, Sparkles, X } from 'lucide-react';

interface BroadcastData {
  id?: string;
  active: boolean;
  title: string;
  message: string;
  type: string;
  updatedAt?: string;
}

export const SystemBroadcastBanner: React.FC = () => {
  const [broadcast, setBroadcast] = useState<BroadcastData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchBroadcast = async () => {
      try {
        const res = await fetch('/api/wallet/broadcast/active');
        const data = await res.json();
        if (mounted && data.ok && data.broadcast?.active && data.broadcast.title) {
          const dismissedId = localStorage.getItem('dhru_dismissed_broadcast');
          if (dismissedId !== data.broadcast.id) {
            setBroadcast(data.broadcast);
            setDismissed(false);
          }
        } else if (mounted) {
          setBroadcast(null);
        }
      } catch {}
    };

    void fetchBroadcast();
    const interval = setInterval(fetchBroadcast, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!broadcast || !broadcast.active || dismissed) return null;

  const handleDismiss = () => {
    if (broadcast.id) {
      localStorage.setItem('dhru_dismissed_broadcast', broadcast.id);
    }
    setDismissed(true);
  };

  const isAlert = broadcast.type === 'ALERT' || broadcast.type === 'URGENT';
  const isWarn = broadcast.type === 'WARNING';
  const isPromo = broadcast.type === 'PROMO' || broadcast.type === 'FEATURE';

  return (
    <div
      role="region"
      aria-label="System Announcement"
      className={`w-full py-2 px-3 sm:px-6 text-xs font-mono select-none border-b transition-colors ${
        isAlert
          ? 'bg-rose-950/90 text-rose-200 border-rose-800'
          : isWarn
          ? 'bg-amber-950/90 text-amber-200 border-amber-800'
          : isPromo
          ? 'bg-purple-950/90 text-purple-200 border-purple-800'
          : 'bg-sky-950/90 text-sky-200 border-sky-800'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="shrink-0">
            {isAlert ? (
              <AlertCircle className="w-4 h-4 text-rose-400 animate-pulse" />
            ) : isWarn ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : isPromo ? (
              <Sparkles className="w-4 h-4 text-purple-400" />
            ) : (
              <Info className="w-4 h-4 text-sky-400" />
            )}
          </div>
          <div className="truncate">
            <strong className="font-bold mr-1.5">{broadcast.title}:</strong>
            <span className="opacity-90">{broadcast.message}</span>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1 rounded-md hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
          aria-label="Dismiss Announcement"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
