// DHRU.AI - Smart Money Concepts (SMC) & Real Structure Engine
// Computes genuine fractal swing highs/lows, volume-confirmed BOS, Order Blocks,
// and 3-candle Fair Value Gaps (FVG) with strict mathematical verification.

/**
 * Finds fractal swing highs and lows with customizable lookaround window.
 */
export function findSwings(candles, left = 2, right = 2) {
  if (!candles || candles.length < left + right + 1) {
    return { swingHighs: [], swingLows: [] };
  }

  const swingHighs = [];
  const swingLows = [];

  for (let i = left; i < candles.length - right; i++) {
    const curr = candles[i];
    let isHigh = true;
    let isLow = true;

    for (let j = 1; j <= left; j++) {
      if (candles[i - j].high >= curr.high) isHigh = false;
      if (candles[i - j].low <= curr.low) isLow = false;
    }
    for (let j = 1; j <= right; j++) {
      if (candles[i + j].high >= curr.high) isHigh = false;
      if (candles[i + j].low <= curr.low) isLow = false;
    }

    if (isHigh) {
      swingHighs.push({
        price: curr.high,
        time: curr.time,
        index: i
      });
    }
    if (isLow) {
      swingLows.push({
        price: curr.low,
        time: curr.time,
        index: i
      });
    }
  }

  return { swingHighs, swingLows };
}

/**
 * Volume-confirmed Break of Structure (BOS).
 * Requires candle CLOSE beyond the prior swing high/low with volume above average.
 */
export function detectBOS(candles, swings, avgVolume = 0) {
  if (!candles || candles.length < 5) return null;
  const { swingHighs, swingLows } = swings;

  // Look across recent candles (last 15 bars)
  const lookback = Math.min(15, candles.length - 1);
  const startIdx = candles.length - lookback;

  // Check for most recent BOS
  for (let i = candles.length - 1; i >= startIdx; i--) {
    const c = candles[i];
    const isVolumeConfirmed = avgVolume <= 0 || (Number(c.volume) || 0) >= avgVolume * 0.85;

    // Check Bullish BOS: close above a prior swing high (which formed before candle i)
    for (let s = swingHighs.length - 1; s >= 0; s--) {
      const sh = swingHighs[s];
      if (sh.index < i && c.close > sh.price && isVolumeConfirmed) {
        return {
          type: 'BOS_BULLISH',
          swingPrice: sh.price,
          brokenLevel: sh.price,
          breakClose: c.close,
          time: c.time,
          index: i,
          swingIndex: sh.index
        };
      }
    }

    // Check Bearish BOS: close below a prior swing low
    for (let s = swingLows.length - 1; s >= 0; s--) {
      const sl = swingLows[s];
      if (sl.index < i && c.close < sl.price && isVolumeConfirmed) {
        return {
          type: 'BOS_BEARISH',
          swingPrice: sl.price,
          breakClose: c.close,
          time: c.time,
          index: i,
          swingIndex: sl.index
        };
      }
    }
  }

  return null;
}

/**
 * Order Block (OB):
 * Last opposing candle before the impulse move that triggered the BOS.
 */
export function detectOrderBlock(candles, bos) {
  if (!candles || !bos) return null;

  const targetIndex = (bos.index != null && bos.index > 0) ? bos.index - 1 : (bos.swingIndex ?? candles.length - 2);
  if (targetIndex < 0 || targetIndex >= candles.length) return null;

  if (bos.type === 'BOS_BULLISH') {
    // Look backward from targetIndex for the last red/bearish candle (close < open)
    for (let i = targetIndex; i >= Math.max(0, targetIndex - 10); i--) {
      const c = candles[i];
      if (c.close < c.open) {
        return {
          type: 'BULLISH_ORDER_BLOCK',
          top: c.high,
          bottom: c.low,
          mid: Number(((c.high + c.low) / 2).toFixed(2)),
          time: c.time
        };
      }
    }
  } else if (bos.type === 'BOS_BEARISH') {
    // Look backward from targetIndex for the last green/bullish candle (close > open)
    for (let i = targetIndex; i >= Math.max(0, targetIndex - 10); i--) {
      const c = candles[i];
      if (c.close > c.open) {
        return {
          type: 'BEARISH_ORDER_BLOCK',
          top: c.high,
          bottom: c.low,
          mid: Number(((c.high + c.low) / 2).toFixed(2)),
          time: c.time
        };
      }
    }
  }

  return null;
}

/**
 * Fair Value Gap (FVG):
 * 3-candle imbalance where candle 1 and candle 3 do not overlap.
 */
export function detectFVG(candles) {
  if (!candles || candles.length < 3) return null;

  // Scan backwards from latest closed bar
  const maxScan = Math.min(25, candles.length);
  for (let i = candles.length - 1; i >= candles.length - maxScan + 2; i--) {
    const c1 = candles[i - 2];
    const c2 = candles[i - 1];
    const c3 = candles[i];

    // Bullish FVG: candle 1 high < candle 3 low
    if (c3.low > c1.high) {
      const gapBottom = c1.high;
      const gapTop = c3.low;
      // Check if subsequent bars have completely filled this gap
      let filled = false;
      for (let k = i + 1; k < candles.length; k++) {
        if (candles[k].low <= gapBottom) {
          filled = true;
          break;
        }
      }
      if (!filled) {
        return {
          type: 'bullish_fvg',
          top: gapTop,
          bottom: gapBottom,
          gapTop,
          gapBottom,
          mid: Number(((gapTop + gapBottom) / 2).toFixed(2)),
          time: c2.time
        };
      }
    }

    // Bearish FVG: candle 1 low > candle 3 high
    if (c3.high < c1.low) {
      const gapTop = c1.low;
      const gapBottom = c3.high;
      let filled = false;
      for (let k = i + 1; k < candles.length; k++) {
        if (candles[k].high >= gapTop) {
          filled = true;
          break;
        }
      }
      if (!filled) {
        return {
          type: 'bearish_fvg',
          top: gapTop,
          bottom: gapBottom,
          mid: Number(((gapTop + gapBottom) / 2).toFixed(2)),
          time: c2.time
        };
      }
    }
  }

  return null;
}

/**
 * Nearest opposing structure level relative to current price and proposed trade direction.
 */
export function findNearestOpposing(currentPrice, direction, swings, orderBlock, bos = null) {
  if (!Number.isFinite(currentPrice) || !direction || direction === 'WAIT') return null;

  const { swingHighs, swingLows } = swings || { swingHighs: [], swingLows: [] };

  if (direction === 'LONG' || direction === 'BUY') {
    // Opposing levels are resistance levels strictly ABOVE currentPrice
    const resistances = [];
    for (const sh of swingHighs) {
      if (sh.price > currentPrice) {
        // If a bullish BOS broke this level, it's already broken
        if (bos && bos.type === 'BOS_BULLISH' && (sh.price <= (bos.breakClose || 0) || sh.price <= (bos.swingPrice || 0))) {
          continue;
        }
        // If inside an active bullish order block, it is not an opposing barrier
        if (orderBlock && (orderBlock.type === 'bullish_ob' || orderBlock.type === 'BULLISH_ORDER_BLOCK') && sh.price <= (orderBlock.top || 0)) {
          continue;
        }
        resistances.push(sh.price);
      }
    }
    if (orderBlock && (orderBlock.type === 'bearish_ob' || orderBlock.type === 'BEARISH_ORDER_BLOCK') && orderBlock.bottom > currentPrice) {
      resistances.push(orderBlock.bottom);
    }
    if (!resistances.length) return null;
    const nearest = Math.min(...resistances);
    return {
      type: 'resistance',
      level: nearest,
      price: nearest,
      distance: Number((nearest - currentPrice).toFixed(2))
    };
  }

  if (direction === 'SHORT' || direction === 'SELL') {
    // Opposing levels are support levels strictly BELOW currentPrice
    const supports = [];
    for (const sl of swingLows) {
      if (sl.price < currentPrice) {
        if (bos && bos.type === 'BOS_BEARISH' && (sl.price >= (bos.breakClose || 0) || sl.price >= (bos.swingPrice || 0))) {
          continue;
        }
        if (orderBlock && (orderBlock.type === 'bearish_ob' || orderBlock.type === 'BEARISH_ORDER_BLOCK') && sl.price >= (orderBlock.bottom || 0)) {
          continue;
        }
        supports.push(sl.price);
      }
    }
    if (orderBlock && (orderBlock.type === 'bullish_ob' || orderBlock.type === 'BULLISH_ORDER_BLOCK') && orderBlock.top < currentPrice) {
      supports.push(orderBlock.top);
    }
    if (!supports.length) return null;
    const nearest = Math.max(...supports);
    return {
      type: 'support',
      level: nearest,
      price: nearest,
      distance: Number((currentPrice - nearest).toFixed(2))
    };
  }

  return null;
}
