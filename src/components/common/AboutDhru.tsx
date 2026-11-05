import React from 'react';
import { Star, ShieldCheck, BarChart3, CandlestickChart, WalletCards, Layers3, Coins, Newspaper, Sparkles, Shield, ScanEye, Bookmark, Bot, SunMoon } from 'lucide-react';

const features = [
  ['Market Overview','Market status, index strip, gainers and losers, breadth and dated FII/DII data when available.'],
  ['Live Terminal','Candlestick charts with SMA, EMA, RSI, MACD, Bollinger Bands, VWAP, Ichimoku, Aroon, Smart Money Concepts order blocks and fair value gaps, plus a paper order ticket.'],
  ['Positions & Portfolio','Open positions, closed trades, order history and profit/loss for the active desk.'],
  ['All Indices, All Stocks and Sectors & Heatmap','Searchable directory of 2,600+ NSE stocks, sector heatmap and index tables.'],
  ['Commodities & FX, Futures & Options','Gold, silver, crude, USD/INR and NSE option-chain measures when available.'],
  ['Financial News','Aggregated headlines with sentiment tags and source links.'],
  ['AI Predictions','Gemini-powered report with entry zone, stop, target and probabilistic scenarios; optional paper auto-trade arms a plan and enters only when live price touches the zone.'],
  ['Risk Monitor','Five-factor market risk score with Low / Moderate / High / Very High levels.'],
  ['AI Pattern Scanner','Detects Hammer, Doji, Engulfing, Morning/Evening Star patterns with plain-language explanations.'],
  ['Watchlist and My Profile','Personal watchlist saved in your browser, account and settings.'],
  ['DHRU AI','Chat assistant powered by Gemini that explains any stock, crypto, or market concept with live intelligence.'],
  ['Light and Dark themes','Follows your device, or choose manually.'],
];
const featureIcons = [BarChart3, CandlestickChart, WalletCards, Layers3, Coins, Newspaper, Sparkles, Shield, ScanEye, Bookmark, Bot, SunMoon];

export function DeveloperCredit() {
  return <div className="rounded-xl bg-surface-2/60 p-4 text-sm">
    <div className="flex items-center gap-1.5 font-semibold text-ink"><Star aria-hidden="true" className="h-4 w-4 fill-[var(--highlight)] text-ink" />Designed and developed by Mr. Preetham Alawandimath</div>
    <div className="mt-1 text-ink-2">1st Year / 1st Semester, Computer Science &amp; Engineering (CSE)<br />BMS Institute of Technology, Bengaluru</div>
  </div>;
}

export function AboutDhru({ compact = false }: { compact?: boolean }) {
  return <section aria-labelledby="about-dhru-title" className="space-y-5 text-ink">
    <div>
      <h1 id="about-dhru-title" className="text-2xl font-bold tracking-tight text-ink">DHRU.AI — Understand Every Market. See Beyond the Numbers.</h1>
      <p className="mt-3 leading-relaxed text-ink-2 max-w-[65ch]">DHRU.AI is an AI-assisted market intelligence and paper-trading platform for Indian equities (NSE/BSE) and 24/7 cryptocurrency markets. It helps everyday investors understand what is happening in a market, why it may be happening, how risky it is, and what the historical evidence suggests could happen next.</p>
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl bg-surface-2/60 p-4"><h2 className="font-semibold text-ink">Indian desk</h2><p className="mt-1 text-sm text-ink-2">NSE/BSE stocks and indices, prices in ₹, ₹10,00,000 virtual paper capital.</p></div>
      <div className="rounded-xl bg-surface-2/60 p-4"><h2 className="font-semibold text-ink">Crypto desk</h2><p className="mt-1 text-sm text-ink-2">Bitcoin, Ethereum, Solana, XRP, BNB, Doge, SUI, Cardano, Avalanche and 20+ more, Binance prices in USDT, $12,000 virtual paper capital.</p></div>
    </div>
    <p className="text-sm text-ink-2">Each desk keeps its own balance, positions, orders, trade history and risk settings.</p>
    {!compact && <div><h2 className="mb-3 text-lg font-bold text-ink">What you can do</h2><div className="grid gap-3 sm:grid-cols-2">{features.map(([title, body], index) => { const Icon = featureIcons[index]; return <div key={title} className="flex items-start gap-3 rounded-xl bg-surface-2/50 p-4"><span className="rounded-md bg-brand-tint p-2 text-brand"><Icon aria-hidden="true" className="h-4 w-4" /></span><div><h3 className="font-semibold text-ink">{title}</h3><p className="mt-1 text-sm leading-relaxed text-ink-2">{body}</p></div></div>; })}</div></div>}
    <div className="rounded-xl bg-warn-tint/60 p-4 text-sm text-ink"><h2 className="flex items-center gap-2 font-bold"><ShieldCheck className="h-4 w-4" />Trust and safety</h2><ul className="mt-2 list-disc space-y-1 pl-5"><li>All trading in DHRU.AI is <strong>paper (simulated) trading</strong>. No real money is used and no orders are sent to any real broker or exchange.</li><li>Predictions, scenarios and AI reports are model estimates, not investment advice or guaranteed outcomes. Quotes can be delayed.</li><li>Your watchlist and desk data are stored in your own browser.</li></ul></div>
    <DeveloperCredit />
  </section>;
}
