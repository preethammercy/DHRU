// DHRU.AI - Contextual Conversational Financial Assistant
// Understands active instrument context, real exchange quotes, indicators, and market dynamics.
// Features clean White & Blue Fintrix fintech interface with zero vendor branding.

import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getStockDetails } from '../services/api';
import { Send, Bot, User, HelpCircle, ArrowRight, ShieldAlert, BarChart2, TrendingUp, Cpu, MessageSquare } from 'lucide-react';

interface Props {
  currentSymbol?: string;
  initialQuestion?: string;
  onSelectStock: (symbol: string) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  engine?: string;
  timestamp: string;
}

export const AskDhruPage: React.FC<Props> = ({ currentSymbol = 'RELIANCE.NS', initialQuestion, onSelectStock }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialQuestion || '');
  const [loading, setLoading] = useState(false);
  const [contextStock, setContextStock] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load context stock
  useEffect(() => {
    if (currentSymbol) {
      getStockDetails(currentSymbol).then(res => {
        setContextStock({
          symbol: currentSymbol,
          name: res?.quote?.name,
          price: res?.quote?.price,
          change: res?.quote?.change,
          changePercent: res?.quote?.changePercent,
          dayHigh: res?.quote?.dayHigh,
          dayLow: res?.quote?.dayLow,
          open: res?.quote?.open,
          previousClose: res?.quote?.previousClose,
          volume: res?.quote?.volume,
          lastUpdated: res?.quote?.lastUpdated,
          source: res?.quote?.source,
          currency: res?.quote?.currency || (currentSymbol?.endsWith('-USD') ? 'USD' : 'INR'),
          technicals: res?.technicals,
          risk: res?.risk,
          scenarios: res?.scenarios
        });
      }).catch(() => {});
    }
  }, [currentSymbol]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `### Market facts\n\nAsk about the displayed quote, price range, indicators, risk score or candle patterns for ${contextStock?.name || currentSymbol}. Answers use the facts currently attached to this instrument.`,
          engine: 'Grounded facts',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [contextStock]);

  // Handle initial question if passed from stock detail
  useEffect(() => {
    if (initialQuestion && messages.length === 1) {
      handleSend(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || input).trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: q,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(q, contextStock);
      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        engine: res.engine || 'Grounded facts',
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: `Unable to process query: ${e.message}. Please retry or verify your network connection.`,
          timestamp: new Date().toLocaleTimeString('en-IN')
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const samplePrompts = [
    `What is the displayed price for ${contextStock?.name || currentSymbol}?`,
    `What are the day high and low for ${currentSymbol}?`,
    `What is the current RSI for ${currentSymbol}?`,
    `Show the moving averages for ${currentSymbol}.`,
    `What pivot levels are available for ${currentSymbol}?`,
    `Which heuristic candle patterns were detected for ${currentSymbol}?`,
    `What does RSI mean?`,
    `What does a Doji mean?`
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-200" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">Ask DHRU</h1>
              <span className="text-xs text-slate-500">Answers from displayed market facts</span>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
          Factual answers about the open instrument. Advice and price targets are not provided.
          </p>
        </div>

        {/* In-View Instrument Chip */}
        {contextStock && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] text-xs font-mono flex items-center gap-2.5 shadow-sm">
            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">ACTIVE CONTEXT:</span>
            <span className="text-slate-900 dark:text-white font-bold">{contextStock.name || contextStock.symbol}</span>
            <span className={`font-semibold ${contextStock.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              ₹{contextStock.price} ({contextStock.changePercent >= 0 ? `+${contextStock.changePercent}%` : `${contextStock.changePercent}%`})
            </span>
          </div>
        )}
      </div>

      {/* Suggested questions */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            Suggested Questions for the Market:
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Click any prompt to ask</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="min-h-11 text-sm text-left text-blue-700 underline decoration-slate-300 underline-offset-4 hover:text-blue-900 dark:text-sky-300 dark:hover:text-sky-100"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Display Box */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl shadow-card p-6 min-h-[460px] max-h-[620px] overflow-y-auto flex flex-col space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
            )}

            <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-sm ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] text-slate-800 dark:text-slate-200 rounded-bl-none'
            }`}>
              <div className="prose prose-sm max-w-none text-xs">
                {msg.content.split('\n').map((paragraph, pIdx) => {
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h3 key={pIdx} className={`text-sm font-bold mt-2 mb-1 ${msg.role === 'user' ? 'text-white' : 'text-blue-600 dark:text-cyan-400'}`}>
                        {paragraph.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <li key={pIdx} className={`ml-3 list-disc ${msg.role === 'user' ? 'text-blue-100' : 'text-slate-700 dark:text-slate-300'}`}>
                        {paragraph.replace('- ', '')}
                      </li>
                    );
                  }
                  if (paragraph.trim() === '') {
                    return <div key={pIdx} className="h-1" />;
                  }
                  return <p key={pIdx} className="mb-1">{paragraph}</p>;
                })}
              </div>

              <div className={`flex items-center justify-between text-[10px] font-mono pt-2 border-t ${
                msg.role === 'user' ? 'border-blue-400/50 text-blue-100' : 'border-slate-200 dark:border-slate-800 text-slate-500'
              }`}>
                <span className="font-semibold">{msg.role === 'user' ? 'You' : 'DHRU Intelligence'}</span>
                <span>{msg.timestamp}</span>
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-blue-700 dark:text-blue-300" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2.5 shadow-sm">
              <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Synthesizing market response from verified exchange quotes and official data...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(); }}
        className="flex items-center gap-2 bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] p-2 rounded-2xl shadow-card"
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={`Ask DHRU AI about ${contextStock?.name || 'Indian financial markets, NIFTY trends, stocks...'} `}
          className="flex-1 bg-transparent px-4 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:shadow-md disabled:opacity-40 transition-all shrink-0 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" /> Send
        </button>
      </form>

    </div>
  );
};
