// DHRU.AI - IPO Watch & Corporate Actions Disclosures
// Official exchange filings for upcoming IPOs, recent listings, dividends, splits, and bonus issues.

import React, { useEffect, useState } from 'react';
import { getIpoAnnouncements } from '../services/api';
import { CalendarDays, Gift, Split, Sparkles, Building2, ExternalLink } from 'lucide-react';

export const IpoActionsPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getIpoAnnouncements().then(res => {
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
        <p className="text-xs text-slate-400">Loading IPO calendar and official corporate announcements...</p>
      </div>
    );
  }

  const upcoming = data?.upcomingIpos || [];
  const corporate = data?.corporateActions || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-cyan-400" />
          </div>
          <h1 className="text-xl font-extrabold text-white">IPO Tracker & Official Corporate Actions</h1>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Track verified initial public offerings filed with SEBI, recent listing gains, and official exchange corporate actions (dividends, splits, bonuses).
        </p>
      </div>

      {/* 1. IPO Watchlist */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Indian IPO Watchlist (Recent & Upcoming Issues)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcoming.map((ipo: any) => (
            <div
              key={ipo.symbol}
              className="p-5 rounded-2xl bg-[#0D1527] border border-[#1A2744] shadow-md flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#070B14] text-cyan-400 border border-[#1A2744]">
                    {ipo.status}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{ipo.listingExchange}</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-1.5">{ipo.companyName}</h3>
                <div className="text-[11px] text-slate-400 mt-0.5">{ipo.category}</div>
              </div>

              <div className="space-y-1.5 pt-3 border-t border-[#1A2744] text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Price Band:</span>
                  <span className="text-white font-semibold">{ipo.priceBand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Issue Size:</span>
                  <span className="text-cyan-300 font-semibold">₹{ipo.issueSizeCr} Cr</span>
                </div>
                {ipo.listingGainPct != null && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Listing Gain:</span>
                    <span className={ipo.listingGainPct >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {ipo.listingGainPct >= 0 ? `+${ipo.listingGainPct}%` : `${ipo.listingGainPct}%`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Corporate Actions (Dividends, Splits, Bonus) */}
      <div className="bg-[#0D1527] border border-[#1A2744] rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-[#1A2744]">
          <Gift className="w-4 h-4 text-emerald-400" />
          Official Corporate Actions & Shareholder Entitlements
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#070B14] text-slate-400 uppercase text-[10px] border-b border-[#1A2744]">
                <th className="p-3.5">Company</th>
                <th className="p-3.5">Action Type</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5">Ex-Date</th>
                <th className="p-3.5">Record Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1A2744]/60 font-mono">
              {corporate.map((c: any, i: number) => (
                <tr key={i} className="hover:bg-[#131F38]/40 transition-colors">
                  <td className="p-3.5 font-bold text-white font-sans">
                    {c.companyName}
                    <div className="text-[10px] text-slate-500 font-mono">{c.symbol}</div>
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      c.actionType.includes('Dividend')
                        ? 'bg-emerald-500/15 text-emerald-400'
                        : c.actionType.includes('Bonus')
                        ? 'bg-cyan-500/15 text-cyan-400'
                        : 'bg-purple-500/15 text-purple-400'
                    }`}>
                      {c.actionType}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-200 font-medium">{c.details}</td>
                  <td className="p-3.5 text-slate-300">{c.exDate}</td>
                  <td className="p-3.5 text-slate-400">{c.recordDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
