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
        <div className="w-8 h-8 border-2 border-line border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-ink-3">Loading derivatives Open Interest and Put-Call Ratio data...</p>
      </div>
    );
  }

  const nifty = data?.instruments?.nifty;
  const bankNifty = data?.instruments?.bankNifty;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-surface border border-line rounded-2xl p-6  space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-brand-fill border border-line flex items-center justify-center">
            <Binary className="w-4 h-4 text-brand" />
          </div>
          <h1 className="text-xl font-extrabold text-ink">NSE Derivatives Analytics (Futures & Options)</h1>
        </div>
        <p className="text-xs text-ink-3 leading-relaxed max-w-3xl">
          Put-Call Ratio (PCR), option strike Open Interest concentrations, and Max Pain settlement estimates derived from official exchange derivatives disclosures.
        </p>
      </div>

      {data?.status !== 'LIVE' && (
        <div role="status" className="rounded-xl border border-line bg-surface p-4 text-sm text-ink-2">
          {data?.message || 'Live NSE option-chain data is unavailable. PCR, open interest and max-pain values are not estimated.'}
        </div>
      )}

      {/* Top Derivatives Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* NIFTY F&O Card */}
        {nifty && (
          <div className="bg-surface border border-line rounded-2xl p-6  space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <span className="text-xs font-mono text-brand font-bold">NIFTY 50 INDEX DERIVATIVES</span>
                <div className="text-xl font-extrabold text-ink font-mono mt-0.5">₹{nifty.underlyingPrice}</div>
              </div>
              <div className="text-right">
                <span className="text-ink-2 font-mono">PUT-CALL RATIO (PCR)</span>
                <div className="text-lg font-bold font-mono text-brand">{nifty.putCallRatio}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-surface border border-line">
                <div className="text-ink-2 text-ink">ATM STRIKE</div>
                <div className="font-bold text-ink mt-0.5">{nifty.atmStrike}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-line">
                <div className="text-ink-2 text-ink">MAX PAIN</div>
                <div className="font-bold text-warn mt-0.5">{nifty.maxPainStrike}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-line">
                <div className="text-ink-2 text-ink">INDIA VIX EST</div>
                <div className="font-bold text-pos mt-0.5">{nifty.indiaVixEstimate}</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand-fill border border-line text-xs">
              <strong className="text-brand">PCR Interpretation: </strong>
              <span className="text-ink-3">{nifty.pcrInterpretation}</span>
            </div>
          </div>
        )}

        {/* BANK NIFTY F&O Card */}
        {bankNifty && (
          <div className="bg-surface border border-line rounded-2xl p-6  space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div>
                <span className="text-xs font-mono text-brand font-bold">BANK NIFTY DERIVATIVES</span>
                <div className="text-xl font-extrabold text-ink font-mono mt-0.5">₹{bankNifty.underlyingPrice}</div>
              </div>
              <div className="text-right">
                <span className="text-ink-2 font-mono">PUT-CALL RATIO (PCR)</span>
                <div className="text-lg font-bold font-mono text-brand">{bankNifty.putCallRatio}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              <div className="p-3 rounded-xl bg-surface border border-line">
                <div className="text-ink-2 text-ink">ATM STRIKE</div>
                <div className="font-bold text-ink mt-0.5">{bankNifty.atmStrike}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-line">
                <div className="text-ink-2 text-ink">MAX PAIN</div>
                <div className="font-bold text-warn mt-0.5">{bankNifty.maxPainStrike}</div>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-line">
                <div className="text-ink-2 text-ink">ATM IV (%)</div>
                <div className="font-bold text-pos mt-0.5">{bankNifty.impliedVolatilityPct}%</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand-fill border border-line text-xs">
              <strong className="text-brand">PCR Interpretation: </strong>
              <span className="text-ink-3">{bankNifty.pcrInterpretation}</span>
            </div>
          </div>
        )}
      </div>

      {/* Strike-wise Open Interest Table */}
      {nifty?.strikes && (
        <div className="bg-surface border border-line rounded-2xl p-6  space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-line">
            <h3 className="text-sm font-bold text-ink flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-brand" />
              NIFTY Strike-wise Open Interest (OI Distribution)
            </h3>
            <span className="text-ink-2 font-mono">Contracts in Lot Equivalent</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs font-mono">
              <thead>
                <tr className="bg-surface text-ink-3 uppercase text-ink">
                  <th className="p-3 text-neg">CALL OI (Resistance)</th>
                  <th className="p-3 text-ink-3">STRIKE PRICE</th>
                  <th className="p-3 text-pos">PUT OI (Support)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {nifty.strikes.map((s: any) => (
                  <tr key={s.strike} className={s.isAtm ? 'bg-brand-fill font-bold' : 'hover:bg-surface-2'}>
                    <td className="p-3 text-neg">
                      {s.callOi.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-bold text-ink">
                      {s.strike} {s.isAtm && <span className="text-ink text-brand ml-1">(ATM)</span>}
                    </td>
                    <td className="p-3 text-pos">
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
      <div className="p-5 rounded-2xl bg-surface border border-line flex items-start gap-3 text-xs">
        <HelpCircle className="w-5 h-5 text-brand shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-ink-3">Beginner’s Guide to Derivatives (F&O):</strong>
          <p className="text-ink-3 leading-relaxed">
            {data?.educationalNote}
            <br />
            <strong>Max Pain Theory:</strong> Proposes that option sellers (usually large institutions) tend to hedge prices such that the underlying index closes near the strike price causing the greatest number of expiring options to expire worthless.
          </p>
        </div>
      </div>
    </div>
  );
};
