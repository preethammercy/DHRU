// DHRU.AI - Derivatives & F&O Intelligence
// NIFTY and Bank NIFTY Put-Call Ratio (PCR), Max Pain strikes, and Open Interest distributions.

import React, { useEffect, useState } from 'react';
import { getDerivatives } from '../services/api';
import { Binary, TrendingUp, HelpCircle, Activity, BarChart2 } from 'lucide-react';

export const DerivativesPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDerivatives().then(res => {
      setData(res);
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
        <p className="text-xs text-slate-400">Loading derivatives Open Interest and Put-Call Ratio data...</p>
      </div>
    );
  }

  const nifty = data?.instruments?.nifty;
  const bankNifty = data?.instruments?.bankNifty;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <Binary className="w-4 h-4 text-cyan-400" />
          </div>
          <h1 className="text-xl font-extrabold text-white">NSE Derivatives Analytics (Futures & Options)</h1>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Put-Call Ratio (PCR), option strike Open Interest concentrations, and Max Pain settlement estimates derived from official exchange derivatives disclosures.
        </p>
      </div>

      {/* Top Derivatives Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* NIFTY F&O Card */}
        {nifty && (
          <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2744]">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold">NIFTY 50 INDEX DERIVATIVES</span>
                <div className="text-xl font-extrabold text-white font-mono mt-0.5">₹{nifty.underlyingPrice}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono">PUT-CALL RATIO (PCR)</span>
                <div className="text-lg font-bold font-mono text-cyan-300">{nifty.putCallRatio}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#070B14] border border-[#1A2744]">
                <div className="text-slate-500 text-[10px]">ATM STRIKE</div>
                <div className="font-bold text-white mt-0.5">{nifty.atmStrike}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#070B14] border border-[#1A2744]">
                <div className="text-slate-500 text-[10px]">MAX PAIN</div>
                <div className="font-bold text-amber-400 mt-0.5">{nifty.maxPainStrike}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#070B14] border border-[#1A2744]">
                <div className="text-slate-500 text-[10px]">INDIA VIX EST</div>
                <div className="font-bold text-emerald-400 mt-0.5">{nifty.indiaVixEstimate}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs">
              <strong className="text-cyan-300">PCR Interpretation: </strong>
              <span className="text-slate-300">{nifty.pcrInterpretation}</span>
            </div>
          </div>
        )}

        {/* BANK NIFTY F&O Card */}
        {bankNifty && (
          <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1A2744]">
              <div>
                <span className="text-xs font-mono text-blue-400 font-bold">BANK NIFTY DERIVATIVES</span>
                <div className="text-xl font-extrabold text-white font-mono mt-0.5">₹{bankNifty.underlyingPrice}</div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-mono">PUT-CALL RATIO (PCR)</span>
                <div className="text-lg font-bold font-mono text-blue-300">{bankNifty.putCallRatio}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#070B14] border border-[#1A2744]">
                <div className="text-slate-500 text-[10px]">ATM STRIKE</div>
                <div className="font-bold text-white mt-0.5">{bankNifty.atmStrike}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#070B14] border border-[#1A2744]">
                <div className="text-slate-500 text-[10px]">MAX PAIN</div>
                <div className="font-bold text-amber-400 mt-0.5">{bankNifty.maxPainStrike}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#070B14] border border-[#1A2744]">
                <div className="text-slate-500 text-[10px]">ATM IV (%)</div>
                <div className="font-bold text-emerald-400 mt-0.5">{bankNifty.impliedVolatilityPct}%</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs">
              <strong className="text-blue-300">PCR Interpretation: </strong>
              <span className="text-slate-300">{bankNifty.pcrInterpretation}</span>
            </div>
          </div>
        )}
      </div>

      {/* Strike-wise Open Interest Table */}
      {nifty?.strikes && (
        <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#1A2744]">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-cyan-400" />
              NIFTY Strike-wise Open Interest (OI Distribution)
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Contracts in Lot Equivalent</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono">
              <thead>
                <tr className="bg-[#070B14] text-slate-400 uppercase text-[10px]">
                  <th className="p-3 text-rose-400">CALL OI (Resistance)</th>
                  <th className="p-3 text-slate-200">STRIKE PRICE</th>
                  <th className="p-3 text-emerald-400">PUT OI (Support)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A2744]">
                {nifty.strikes.map((s: any) => (
                  <tr key={s.strike} className={s.isAtm ? 'bg-cyan-500/10 font-bold' : 'hover:bg-slate-800/30'}>
                    <td className="p-3 text-rose-400">
                      {s.callOi.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-bold text-white">
                      {s.strike} {s.isAtm && <span className="text-[10px] text-cyan-400 ml-1">(ATM)</span>}
                    </td>
                    <td className="p-3 text-emerald-400">
                      {s.putOi.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Educational Explainer */}
      <div className="p-5 rounded-2xl bg-[#070B14] border border-[#1A2744] flex items-start gap-3 text-xs">
        <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-200">Beginner’s Guide to Derivatives (F&O):</strong>
          <p className="text-slate-400 leading-relaxed">
            {data?.educationalNote}
            <br />
            <strong>Max Pain Theory:</strong> Proposes that option sellers (usually large institutions) tend to hedge prices such that the underlying index closes near the strike price causing the greatest number of expiring options to expire worthless.
          </p>
        </div>
      </div>
    </div>
  );
};
