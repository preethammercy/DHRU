// DHRU.AI - Screen Wake Lock Service (Phase 5.4)
// Prevents mobile/laptop screens from dimming or sleeping while an auto-trade
// basket is actively armed or managing open positions.

let wakeLockSentinel: any = null;

export async function requestWakeLock(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return false;
  }
  try {
    if (wakeLockSentinel && !wakeLockSentinel.released) {
      return true;
    }
    wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
    wakeLockSentinel.addEventListener('release', () => {
      wakeLockSentinel = null;
    });
    return true;
  } catch (err) {
    console.warn('[ScreenWakeLock] Could not acquire screen wake lock:', err);
    return false;
  }
}

export async function releaseWakeLock(): Promise<void> {
  try {
    if (wakeLockSentinel && !wakeLockSentinel.released) {
      await wakeLockSentinel.release();
    }
  } catch (err) {
    console.warn('[ScreenWakeLock] Release error:', err);
  } finally {
    wakeLockSentinel = null;
  }
}
