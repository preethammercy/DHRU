import React, { useState } from 'react';
import { Bot, LoaderCircle, Sparkles } from 'lucide-react';
import { sendChatMessage } from '../../services/api';
import { useLivePrice } from '../../context/MarketStreamContext';

interface Props {
  symbol: string;
  quote?: any;
  technicals?: any;
}

export const GeminiReport: React.FC<Props> = ({ symbol, quote, technicals }) => {
  const live = useLivePrice(symbol, quote);
  const [reply, setReply] = useState('');
  const [engine, setEngine] = useState('');
  const [loading, setLoading] = useState(false);
  const price = live.price > 0 ? live.price : quote?.price;
  const currency = quote?.currency === 'USD' || symbol.includes('-USD') ? '$' : '₹';

  const explain = async () => {
    setLoading(true);
    try {
      const response = await sendChatMessage(
        'Summarize the current price, change, RSI, MACD, moving averages, pivot levels, and any detected candle patterns. Describe facts only; do not recommend a trade or invent missing values.',
        {
          symbol,
          name: quote?.name || symbol,
          price,
          currency: quote?.currency || (symbol.includes('-USD') ? 'USD' : 'INR'),
          change: live.change,
          changePercent: live.changePercent,
          dayHigh: live.dayHigh || quote?.dayHigh,
          dayLow: live.dayLow || quote?.dayLow,
          previousClose: quote?.previousClose,
          volume: live.volume || quote?.volume,
          source: live.source || quote?.source,
          lastUpdated: live.timestamp ? new Date(live.timestamp).toISOString() : quote?.lastUpdated,
          technicals,
          risk: { status: 'unavailable' }
        }
      );
      setReply(response.reply || 'No grounded report is available for this instrument.');
      setEngine(response.engine || 'Grounded facts');
    } catch {
      setReply('The market brief could not be refreshed. Please retry when the data service is available.');
      setEngine('Unavailable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-3 border-t border-slate-200 py-5 dark:border-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold text-slate-950 dark:text-white">Live market brief</h2>
            <p className="text-xs text-slate-500">Grounded in the displayed quote and calculated historical indicators.</p>
          </div>
        </div>
        <button onClick={explain} disabled={loading || !(price > 0)} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-slate-300 px-3 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? 'Preparing…' : 'Explain current facts'}
        </button>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-300">
        <span>Price: <strong className="font-mono text-slate-900 dark:text-white">{price > 0 ? `${currency}${price.toLocaleString(quote?.currency === 'USD' || symbol.includes('-USD') ? 'en-US' : 'en-IN', { minimumFractionDigits: price < 1 ? 4 : 2, maximumFractionDigits: price < 1 ? 6 : 2 })}` : 'Unavailable'}</strong></span>
        <span>RSI: <strong className="font-mono text-slate-900 dark:text-white">{Number.isFinite(technicals?.rsi) ? technicals.rsi.toFixed(1) : 'Unavailable'}</strong></span>
        <span>MACD: <strong className="font-mono text-slate-900 dark:text-white">{Number.isFinite(technicals?.macd?.macd) ? technicals.macd.macd.toFixed(2) : 'Unavailable'}</strong></span>
        <span>Source: {live.source || quote?.source || 'Unavailable'}</span>
      </div>

      {reply && <div className="whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"><p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{engine}</p>{reply}</div>}
      <p className="text-[11px] text-slate-500">Indicator readings describe past price data. They are not a prediction or a trading recommendation.</p>
    </section>
  );
};
