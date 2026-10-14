// DHRU.AI - Commodities & Currency Indicators
// Gold, Silver, Crude Oil, Natural Gas, USD/INR, EUR/INR, GBP/INR, and Indian G-Sec Bond Yields.
// Clearly differentiates MCX/COMEX commodities and RBI FX reference rates from NSE/BSE equities.

import React, { useEffect, useState } from 'react';
import { getCommoditiesForex, getEtfs } from '../services/api';
import { Coins, ArrowUpRight, ArrowDownRight, Compass, Shield, ExternalLink, HelpCircle } from 'lucide-react';

interface Props {
  onSelectInstrument: (symbol: string) => void;
  onTradeInstrument?: (symbol: string) => void;
}

export const CommoditiesPage: React.FC<Props> = ({ onSelectInstrument, onTradeInstrument }) => {
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

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-400">Loading verified commodities and currency rates...</p>
      </div>
    );
  }

  const commodities = items.filter(i => i.type === 'Commodity');
  const forex = items.filter(i => i.type === 'Forex');

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Coins className="w-4 h-4 text-amber-400" />
          </div>
          <h1 className="text-xl font-extrabold text-white">Commodities, Currencies & Macro Indicators</h1>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Physical bullion proxies, energy commodities, foreign exchange reference pairs, and sovereign debt rates.
          <strong className="text-slate-300 ml-1">Exchange Attribution:</strong> Gold, Silver, and Crude are traded on commodity exchanges (MCX / COMEX / NYMEX) and Currencies via Forex/RBI reference rates, independent of NSE/BSE equity trading books.
        </p>
      </div>

      {/* 1. Commodities Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-amber-400" />
            Key Commodities (MCX / Global Proxies)
          </h2>
          <span className="text-[11px] font-mono text-slate-500">Live Public Settlement Feeds</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {commodities.map(c => {
            const isUp = c.changePercent >= 0;
            return (
              <div
                key={c.symbol}
                onClick={() => onSelectInstrument(c.symbol)}
                className="p-5 rounded-2xl bg-[#0D1527] border border-[#1A2744] hover:border-amber-500/40 hover:bg-[#131F38] cursor-pointer transition-all shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#070B14] text-amber-400 border border-[#1A2744]">
                      {c.exchange}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{c.unit}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors mt-2">
                    {c.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">{c.description}</p>
                </div>

                <div className="pt-4 mt-3 border-t border-[#1A2744]/70 flex items-center justify-between">
                  <div className="text-lg font-bold font-mono text-white">
                    ${c.price.toLocaleString('en-IN')}
                  </div>
                  <div className="flex items-center gap-2">
                    {onTradeInstrument && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTradeInstrument(c.symbol);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        title="Trade in Live Terminal"
                      >
                        <span>⚡ Trade</span>
                      </button>
                    )}
                    <div className={`text-xs font-mono font-bold flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                      {isUp ? `+${c.changePercent}%` : `${c.changePercent}%`}
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
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          Foreign Exchange Pairs (Forex Reference Rates)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {forex.map(fx => {
            const isUp = fx.changePercent >= 0;
            return (
              <div
                key={fx.symbol}
                onClick={() => onSelectInstrument(fx.symbol)}
                className="p-5 rounded-2xl bg-[#0D1527] border border-[#1A2744] hover:border-cyan-500/40 hover:bg-[#131F38] cursor-pointer transition-all shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#070B14] text-cyan-400 border border-[#1A2744]">
                      {fx.exchange}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{fx.symbol}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors mt-2">
                    {fx.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">{fx.description}</p>
                </div>

                <div className="pt-4 mt-3 border-t border-[#1A2744]/70 flex items-center justify-between">
                  <div className="text-lg font-bold font-mono text-white">
                    ₹{fx.price}
                  </div>
                  <div className="flex items-center gap-2">
                    {onTradeInstrument && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTradeInstrument(fx.symbol);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-sm transition-all flex items-center gap-1 cursor-pointer"
                        title="Trade in Live Terminal"
                      >
                        <span>⚡ Trade</span>
                      </button>
                    )}
                    <div className={`text-xs font-mono font-bold flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                      {isUp ? `+${fx.changePercent}%` : `${fx.changePercent}%`}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Sovereign Debt & Macro Indicators */}
      <div className="p-6 rounded-2xl bg-[#0D1527] border border-[#1A2744] shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Indian Sovereign Debt & RBI Benchmark Macro Rates
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A2744] space-y-1">
            <span className="text-slate-500 text-[10px]">INDIA 10Y BENCHMARK G-SEC YIELD</span>
            <div className="text-xl font-bold text-white">6.85%</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Risk-free benchmark yield for Indian government bonds. Anchors sovereign borrowing rates.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A2744] space-y-1">
            <span className="text-slate-500 text-[10px]">RBI POLICY REPO RATE</span>
            <div className="text-xl font-bold text-white">6.50%</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Monetary Policy Committee (MPC) policy rate influencing retail lending, FD, and home loans.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#070B14] border border-[#1A2744] space-y-1">
            <span className="text-slate-500 text-[10px]">CPI INFLATION (HEADLINE)</span>
            <div className="text-xl font-bold text-white">4.80%</div>
            <p className="text-[11px] text-slate-400 font-sans">
              Within RBI's mandated target band of 4% (+/- 2%). Subdued food and fuel prices.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Listed Indian Exchange ETFs */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Compass className="w-4 h-4 text-purple-400" />
          NSE-Listed Exchange Traded Funds (ETFs)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {etfs.map(e => (
            <div
              key={e.symbol}
              onClick={() => onSelectInstrument(e.symbol)}
              className="p-5 rounded-2xl bg-[#0D1527] border border-[#1A2744] hover:border-purple-500/40 hover:bg-[#131F38] cursor-pointer transition-all shadow-md group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#070B14] text-purple-400 border border-[#1A2744]">
                    NSE ETF • Exp: {e.expenseRatio}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{e.symbol}</span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors mt-2">
                  {e.name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">{e.description}</p>
              </div>

              <div className="pt-4 mt-3 border-t border-[#1A2744]/70 flex items-center justify-between">
                <div className="text-lg font-bold font-mono text-white">
                  ₹{e.price > 0 ? e.price : '—'}
                </div>
                <div className={`text-xs font-mono font-bold ${e.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {e.changePercent >= 0 ? `+${e.changePercent}%` : `${e.changePercent}%`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
