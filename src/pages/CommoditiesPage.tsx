// DHRU.AI - Commodities & Currency Indicators
// Gold, Silver, Crude Oil, Natural Gas, USD/INR, EUR/INR, GBP/INR, and Indian G-Sec Bond Yields.
// Clearly differentiates MCX/COMEX commodities and RBI FX reference rates from NSE/BSE equities.

import React, { useEffect, useState } from 'react';
import { getCommoditiesForex, getEtfs } from '../services/api';
import { QuoteFreshness } from '../components/market/QuoteFreshness';
import { useMarketStream } from '../context/MarketStreamContext';
import { Coins, ArrowUpRight, ArrowDownRight, Compass, Shield, ExternalLink, HelpCircle } from 'lucide-react';

interface Props {
  onSelectInstrument: (symbol: string) => void;
  onTradeInstrument?: (symbol: string) => void;
}

export const CommoditiesPage: React.FC<Props> = ({ onSelectInstrument, onTradeInstrument }) => {
  const { ticks, subscribeSymbol } = useMarketStream();
  const [items, setItems] = useState<any[]>([]);
  const [etfs, setEtfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getCommoditiesForex(), getEtfs()]).then(([cf, etfRes]) => {
      setItems(cf.instruments || []);
      setEtfs(etfRes.etfs || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    items.forEach(item => subscribeSymbol(item.symbol));
  }, [items, subscribeSymbol]);

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-line border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-ink-3">Loading verified commodities and currency rates...</p>
      </div>
    );
  }

  const commodities = items.filter(i => i.type === 'Commodity');
  const forex = items.filter(i => i.type === 'Forex');

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-surface border border-line rounded-2xl p-6  space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-surface-2 border border-line flex items-center justify-center">
            <Coins className="w-4 h-4 text-warn" />
          </div>
          <h1 className="text-xl font-extrabold text-ink">Commodities, Currencies & Macro Indicators</h1>
        </div>
        <p className="text-xs text-ink-3 leading-relaxed max-w-3xl">
          Physical bullion proxies, energy commodities, foreign exchange reference pairs, and sovereign debt rates.
          <strong className="text-ink-3 ml-1">Exchange Attribution:</strong> Gold, Silver, and Crude are traded on commodity exchanges (MCX / COMEX / NYMEX) and Currencies via Forex/RBI reference rates, independent of NSE/BSE equity trading books.
        </p>
      </div>

      {/* 1. Commodities Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-warn" />
            Key Commodities (MCX / Global Proxies)
          </h2>
          <span className="text-ink-2 font-mono">Provider and freshness shown per quote</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {commodities.map(c => {
            const tick = ticks[c.symbol];
            const price = tick?.price ?? c.price;
            const change = tick?.changePercent ?? c.changePercent;
            const isUp = Number(change) >= 0;
            return (
              <div
                key={c.symbol}
                onClick={() => onSelectInstrument(c.symbol)}
                className="p-5 rounded-2xl bg-surface border border-line hover:border-line hover:bg-surface cursor-pointer transition-all  group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-ink px-2 py-0.5 rounded bg-surface text-warn border border-line">
                      {c.exchange}
                    </span>
                    <span className="text-ink font-mono text-ink-2">{c.unit}</span>
                  </div>
                  <h3 className="text-sm font-bold text-ink group-hover:text-warn transition-colors mt-2">
                    {c.name}
                  </h3>
                  <p className="text-ink-3 mt-1">{c.description}</p>
                </div>

                <div className="pt-4 mt-3 border-t border-line flex items-center justify-between">
                  <div className="text-lg font-bold font-mono text-ink">
                    {price > 0 ? `${c.currency === 'INR' ? '₹' : '$'}${Number(price).toLocaleString('en-IN')}` : 'Unavailable'}
                  </div>
                  <QuoteFreshness status={tick?.status || c.status} source={tick?.source || c.source} lastUpdated={tick?.lastUpdated || c.lastUpdated} timestamp={tick?.timestamp || c.timestamp} />
                  <div className="flex items-center gap-2">
                    {onTradeInstrument && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTradeInstrument(c.symbol);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-brand-fill hover:bg-brand-fill-hover text-on-brand text-ink font-bold  transition-all flex items-center gap-1 cursor-pointer"
                        title="Trade in Live Terminal"
                      >
                        <span>⚡ Trade</span>
                      </button>
                    )}
                    <div className={`text-xs font-mono font-bold flex items-center ${isUp ? 'text-pos' : 'text-neg'}`}>
                      {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                      {Number.isFinite(Number(change)) ? `${isUp ? '+' : ''}${Number(change).toFixed(2)}%` : 'Unavailable'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Forex Currencies Section */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
          <Compass className="w-4 h-4 text-brand" />
          Foreign Exchange Pairs (Forex Reference Rates)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {forex.map(fx => {
            const tick = ticks[fx.symbol];
            const price = tick?.price ?? fx.price;
            const change = tick?.changePercent ?? fx.changePercent;
            const isUp = Number(change) >= 0;
            return (
              <div
                key={fx.symbol}
                onClick={() => onSelectInstrument(fx.symbol)}
                className="p-5 rounded-2xl bg-surface border border-line hover:border-line hover:bg-surface cursor-pointer transition-all  group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-ink px-2 py-0.5 rounded bg-surface text-brand border border-line">
                      {fx.exchange}
                    </span>
                    <span className="text-ink font-mono text-ink-2">{fx.symbol}</span>
                  </div>
                  <h3 className="text-sm font-bold text-ink group-hover:text-brand transition-colors mt-2">
                    {fx.name}
                  </h3>
                  <p className="text-ink-3 mt-1">{fx.description}</p>
                </div>

                <div className="pt-4 mt-3 border-t border-line flex items-center justify-between">
                  <div className="text-lg font-bold font-mono text-ink">
                    {price > 0 ? Number(price).toLocaleString('en-IN') : 'Unavailable'}
                  </div>
                  <QuoteFreshness status={tick?.status || fx.status} source={tick?.source || fx.source} lastUpdated={tick?.lastUpdated || fx.lastUpdated} timestamp={tick?.timestamp || fx.timestamp} />
                  <div className="flex items-center gap-2">
                    {onTradeInstrument && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTradeInstrument(fx.symbol);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-brand-fill hover:bg-brand-fill-hover text-on-brand text-ink font-bold  transition-all flex items-center gap-1 cursor-pointer"
                        title="Trade in Live Terminal"
                      >
                        <span>⚡ Trade</span>
                      </button>
                    )}
                    <div className={`text-xs font-mono font-bold flex items-center ${isUp ? 'text-pos' : 'text-neg'}`}>
                      {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                      {Number.isFinite(Number(change)) ? `${isUp ? '+' : ''}${Number(change).toFixed(2)}%` : 'Unavailable'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Sovereign Debt & Macro Indicators */}
      <div className="p-6 rounded-2xl bg-surface border border-line  space-y-4">
        <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand" />
          Indian Sovereign Debt & RBI Benchmark Macro Rates
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-surface border border-line space-y-1">
            <span className="text-ink-2 text-ink">INDIA 10Y BENCHMARK G-SEC YIELD</span>
            <div className="text-xl font-bold text-ink">Unavailable</div>
            <p className="text-ink-3 font-sans">
              Live dated yield source is not connected. No estimate is shown.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-line space-y-1">
            <span className="text-ink-2 text-ink">RBI POLICY REPO RATE</span>
            <div className="text-xl font-bold text-ink">Unavailable</div>
            <p className="text-ink-3 font-sans">
              Live RBI policy source is not connected. No estimate is shown.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-line space-y-1">
            <span className="text-ink-2 text-ink">CPI INFLATION (HEADLINE)</span>
            <div className="text-xl font-bold text-ink">Unavailable</div>
            <p className="text-ink-3 font-sans">
              Latest dated CPI release source is not connected.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Listed Indian Exchange ETFs */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-ink uppercase tracking-wider flex items-center gap-2">
          <Compass className="w-4 h-4 text-ai" />
          NSE-Listed Exchange Traded Funds (ETFs)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {etfs.map(e => (
            <div
              key={e.symbol}
              onClick={() => onSelectInstrument(e.symbol)}
              className="p-5 rounded-2xl bg-surface border border-line hover:border-line hover:bg-surface cursor-pointer transition-all  group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-ink px-2 py-0.5 rounded bg-surface text-ai border border-line">
                    NSE ETF • Exp: {e.expenseRatio}
                  </span>
                  <span className="text-ink font-mono text-ink-2">{e.symbol}</span>
                </div>
                <h3 className="text-sm font-bold text-ink group-hover:text-ai transition-colors mt-2">
                  {e.name}
                </h3>
                <p className="text-ink-3 mt-1">{e.description}</p>
              </div>

              <div className="pt-4 mt-3 border-t border-line flex items-center justify-between">
                <div className="text-lg font-bold font-mono text-ink">
                  ₹{e.price > 0 ? e.price : '—'}
                </div>
                <QuoteFreshness status={e.status} source={e.source} lastUpdated={e.lastUpdated} timestamp={e.timestamp} />
                <div className={`text-xs font-mono font-bold ${e.changePercent >= 0 ? 'text-pos' : 'text-neg'}`}>
                  {Number.isFinite(Number(e.changePercent)) ? `${e.changePercent >= 0 ? '+' : ''}${e.changePercent}%` : 'Unavailable'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
