import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2,
  Target,
  ShieldAlert,
  AlertTriangle,
  X,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export interface TradeNotification {
  id: string;
  type: 'OPEN' | 'PROFIT' | 'LOSS' | 'REJECTED' | 'ARMED';
  title: string;
  accountType?: 'DEMO' | 'REAL';
  side?: 'BUY' | 'SELL';
  symbol: string;
  name?: string;
  quantity?: number;
  price?: number;
  product?: string;
  status: string;
  stopLoss?: number;
  targetPrice?: number;
  pnl?: number;
  reason?: string;
  timestamp: number;
}

export function dispatchTradeNotification(notification: Omit<TradeNotification, 'id' | 'timestamp'> & { id?: string; timestamp?: number }) {
  if (typeof window === 'undefined') return;
  const fullNotification: TradeNotification = {
    ...notification,
    id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: notification.timestamp || Date.now()
  };
  window.dispatchEvent(new CustomEvent('dhru-trade-notification', { detail: fullNotification }));
}

function playNotificationChime(type: TradeNotification['type']) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'OPEN' || type === 'PROFIT' || type === 'ARMED') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.12); // A5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, now); // E4
      osc.frequency.exponentialRampToValueAtTime(261.63, now + 0.18); // C4
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch {}

  // Mobile haptic feedback
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'OPEN' || type === 'PROFIT') {
        navigator.vibrate([40, 60, 40]);
      } else {
        navigator.vibrate([80]);
      }
    }
  } catch {}
}

export function TradeNotificationToast() {
  const [notifications, setNotifications] = useState<TradeNotification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  useEffect(() => {
    const handleNotification = (event: Event) => {
      const customEvent = event as CustomEvent<TradeNotification>;
      if (!customEvent.detail) return;
      const notif = customEvent.detail;

      // Play chime & haptic
      playNotificationChime(notif.type);

      setNotifications(prev => {
        // Keep max 3 notifications visible
        const updated = [notif, ...prev.filter(n => n.id !== notif.id)].slice(0, 3);
        return updated;
      });

      // Auto-dismiss after 6.5 seconds
      setTimeout(() => {
        removeNotification(notif.id);
      }, 6500);
    };

    window.addEventListener('dhru-trade-notification', handleNotification);
    return () => window.removeEventListener('dhru-trade-notification', handleNotification);
  }, [removeNotification]);

  if (notifications.length === 0) return null;

  return (
    <div
      className="fixed top-3 inset-x-0 z-[9999] pointer-events-none flex flex-col items-center gap-2 px-3 sm:px-6"
      data-testid="trade-notification-container"
    >
      {notifications.map((notif) => {
        const isUsd = notif.symbol?.endsWith('-USD') || notif.symbol?.includes('$');
        const currency = isUsd ? '$' : '₹';
        const formattedPrice = notif.price != null
          ? `${currency}${notif.price.toLocaleString(isUsd ? 'en-US' : 'en-IN', { maximumFractionDigits: isUsd ? 4 : 2 })}`
          : null;

        return (
          <div
            key={notif.id}
            role="status"
            aria-live="polite"
            className={`pointer-events-auto w-full max-w-md rounded-2xl shadow-2xl border backdrop-blur-xl p-3.5 transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-top-4 ${
              notif.type === 'OPEN'
                ? 'bg-slate-900/95 dark:bg-slate-900/95 text-white border-emerald-500/40'
                : notif.type === 'PROFIT'
                ? 'bg-slate-900/95 dark:bg-slate-900/95 text-white border-cyan-500/40'
                : notif.type === 'LOSS'
                ? 'bg-slate-900/95 dark:bg-slate-900/95 text-white border-rose-500/40'
                : notif.type === 'ARMED'
                ? 'bg-slate-900/95 dark:bg-slate-900/95 text-white border-blue-500/40'
                : 'bg-slate-900/95 dark:bg-slate-900/95 text-white border-amber-500/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === 'OPEN'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : notif.type === 'PROFIT'
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : notif.type === 'LOSS'
                      ? 'bg-rose-500/20 text-rose-400'
                      : notif.type === 'ARMED'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {notif.type === 'OPEN' && <CheckCircle2 className="w-4 h-4" />}
                  {notif.type === 'PROFIT' && <Target className="w-4 h-4" />}
                  {notif.type === 'LOSS' && <ShieldAlert className="w-4 h-4" />}
                  {notif.type === 'ARMED' && <Zap className="w-4 h-4" />}
                  {notif.type === 'REJECTED' && <AlertTriangle className="w-4 h-4" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                      {notif.title}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                      notif.accountType === 'REAL'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {notif.accountType === 'REAL' ? 'REAL ACCOUNT' : 'DEMO SIMULATION'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs">
                    {notif.side && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black font-mono flex items-center gap-0.5 ${
                          notif.side === 'BUY'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {notif.side === 'BUY' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {notif.side}
                      </span>
                    )}

                    <span className="font-extrabold text-white truncate">
                      {notif.symbol}
                    </span>

                    {notif.quantity != null && (
                      <span className="text-slate-300 font-mono text-[11px]">
                        {notif.quantity.toLocaleString()} qty
                      </span>
                    )}

                    {formattedPrice && (
                      <span className="text-emerald-300 font-mono font-bold text-[11px]">
                        @ {formattedPrice}
                      </span>
                    )}
                  </div>

                  {/* Profit / Loss booked */}
                  {notif.pnl != null && (
                    <div className="mt-1 text-xs font-mono font-bold">
                      Realized P&L:{' '}
                      <span className={notif.pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {notif.pnl >= 0 ? '+' : ''}{currency}{Math.abs(notif.pnl).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Stop Loss & Target preview */}
                  {(notif.stopLoss != null || notif.targetPrice != null) && (
                    <div className="mt-1 flex items-center gap-3 text-[10px] font-mono text-slate-400">
                      {notif.stopLoss != null && (
                        <span>SL: <strong className="text-rose-400">{currency}{notif.stopLoss}</strong></span>
                      )}
                      {notif.targetPrice != null && (
                        <span>TP: <strong className="text-emerald-400">{currency}{notif.targetPrice}</strong></span>
                      )}
                    </div>
                  )}

                  {/* Rejection / Block reason */}
                  {notif.reason && (
                    <p className="mt-1 text-[11px] text-amber-300 leading-tight">
                      {notif.reason}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeNotification(notif.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
