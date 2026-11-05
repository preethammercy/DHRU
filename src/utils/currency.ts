// DHRU.AI - Multi-Currency Real-time FX Conversion Engine
// Seamlessly converts between Indian Rupee (₹ INR) and US Dollar ($ USD) for 24/7 Crypto Markets.

export function getUsdInrRate(ticks?: Record<string, any>): number {
  const tick = ticks?.['INR=X'];
  if (tick?.price && Number.isFinite(tick.price) && tick.price > 50 && tick.price < 120) {
    return Number(tick.price);
  }
  return 86.50; // Canonical Reserve Bank of India reference rate
}

export function inrToUsd(inrAmount: number, ticks?: Record<string, any>): number {
  const rate = getUsdInrRate(ticks);
  return Number(((Number(inrAmount) || 0) / rate).toFixed(2));
}

export function usdToInr(usdAmount: number, ticks?: Record<string, any>): number {
  const rate = getUsdInrRate(ticks);
  return Number(((Number(usdAmount) || 0) * rate).toFixed(2));
}

export function formatDualCurrencyBalance(
  amountInInr: number,
  isCryptoMode: boolean,
  ticks?: Record<string, any>
): {
  primary: string;
  secondary: string;
  numericUsd: number;
  numericInr: number;
  rate: number;
} {
  const rate = getUsdInrRate(ticks);
  const numericInr = Number(amountInInr) || 0;
  const numericUsd = Number((numericInr / rate).toFixed(2));

  if (isCryptoMode) {
    return {
      primary: `$${numericUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      secondary: `≈ ₹${numericInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      numericUsd,
      numericInr,
      rate
    };
  }

  return {
    primary: `₹${numericInr.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
    secondary: `≈ $${numericUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    numericUsd,
    numericInr,
    rate
  };
}
