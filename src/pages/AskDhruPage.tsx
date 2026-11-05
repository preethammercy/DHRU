// DHRU.AI - Contextual Conversational Financial Assistant
// Understands active instrument context, real exchange quotes, indicators, and market dynamics.
// Features clean White & Blue Fintrix fintech interface with zero vendor branding.

import React, { useState, useEffect, useRef } from 'react';
import { sendChatMessage, getStockDetails } from '../services/api';
import { Sparkles, Send, Bot, User, HelpCircle, ArrowRight, ShieldAlert, BarChart2, TrendingUp, Cpu, MessageSquare } from 'lucide-react';

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
          currency: res?.quote?.currency || (currentSymbol.endsWith('-USD') ? 'USD' : 'INR'),
          price: res?.quote?.price,
          changePercent: res?.quote?.changePercent,
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
          content: `### Welcome to DHRU Intelligence 🌟\n\nI am your market intelligence copilot. I explain available quotes, technical indicators, risk levels, and relevant market context.\n\nAsk me about **${contextStock?.name || currentSymbol}** or general ${currentSymbol.endsWith('-USD') ? 'crypto' : 'Indian market'} dynamics. Forecasts are estimates, not guarantees.`,
          engine: 'Welcome',
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
      const history = messages.filter(message => message.id !== 'welcome').slice(-10).map(message => ({ role: message.role, content: message.content }));
      const res = await sendChatMessage(q, contextStock, history);
      const assistantMsg: ChatMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: res.reply,
        engine: res.engine || 'Gemini',
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
    `Why is ${contextStock?.name || 'Reliance Industries'} moving today?`,
    `What are immediate support and resistance levels for ${currentSymbol}?`,
    `Explain current Indian market risk and volatility in simple terms`,
    `Is NIFTY IT showing stronger momentum than NIFTY Bank?`,
    `How should a beginner analyze candlestick patterns for short-term trades?`,
    `Compare Tata Motors with Mahindra & Mahindra outlook`,
    `What do current FII and DII institutional flow trends indicate?`,
    `What is the 5-day scenario for ${contextStock?.name || currentSymbol}?`
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      
      {/* Header Banner */}
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-6  zoom-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-fill   flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-ink" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-ink dark:text-ink">DHRU AI · Gemini Assistant</h1>
              <span className="text-ink font-mono font-semibold px-2 py-0.5 rounded-full bg-surface-2 text-brand dark:bg-brand-fill dark:text-brand">
                GEMINI POWERED
              </span>
            </div>
          </div>
          <p className="text-xs text-ink-2 dark:text-ink-3 mt-2">
            Ask general questions or get context-aware help with Indian markets and crypto. Replies use your server-configured Gemini API key.
          </p>
        </div>

        {/* In-View Instrument Chip */}
        {contextStock && (
          <div className="p-3 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line text-xs font-mono flex items-center gap-2.5 ">
            <span className="text-ink-2 text-ink uppercase font-bold tracking-wider">ACTIVE CONTEXT:</span>
            <span className="text-ink dark:text-ink font-bold">{contextStock.name || contextStock.symbol}</span>
            <span className={`font-semibold ${contextStock.changePercent >= 0 ? 'text-pos' : 'text-neg'}`}>
              {contextStock.currency === 'USD' || contextStock.currency === 'USDT' || currentSymbol.endsWith('-USD') ? '$' : '₹'}{contextStock.price} ({contextStock.changePercent >= 0 ? `+${contextStock.changePercent}%` : `${contextStock.changePercent}%`})
            </span>
          </div>
        )}
      </div>

      {/* Suggested Prompt Chips */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-ink-2 dark:text-ink-3 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-brand" />
            Suggested Questions for the Market:
          </span>
          <span className="text-ink-2 dark:text-ink-3">Click any prompt to ask</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              className="text-xs px-3.5 py-2 rounded-xl bg-surface dark:bg-surface hover:bg-surface-2 dark:hover:bg-surface text-ink-2 dark:text-ink-3 hover:text-brand border border-line dark:border-line hover:border-line transition-all text-left  zoom-card"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Display Box */}
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl  p-6 min-h-[460px] max-h-[620px] overflow-y-auto flex flex-col space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-brand-fill   flex items-center justify-center shrink-0 mt-1 ">
                <Bot className="w-4 h-4 text-ink" />
              </div>
            )}

            <div className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2  ${
              msg.role === 'user'
                ? 'bg-brand-fill text-on-brand rounded-br-none'
                : 'bg-surface-2 dark:bg-surface border border-line dark:border-line text-ink dark:text-ink-3 rounded-bl-none'
            }`}>
              <div className="prose prose-sm max-w-none text-xs">
                {msg.content.split('\n').map((paragraph, pIdx) => {
                  if (paragraph.startsWith('### ')) {
                    return (
                      <h3 key={pIdx} className={`text-sm font-bold mt-2 mb-1 ${msg.role === 'user' ? 'text-on-brand' : 'text-brand dark:text-brand'}`}>
                        {paragraph.replace('### ', '')}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('- ')) {
                    return (
                      <li key={pIdx} className={`ml-3 list-disc ${msg.role === 'user' ? 'text-brand' : 'text-ink-2 dark:text-ink-3'}`}>
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

              <div className={`flex items-center justify-between text-ink font-mono pt-2 border-t ${
                msg.role === 'user' ? 'border-line text-brand' : 'border-line dark:border-line text-ink-2'
              }`}>
                <span className="font-semibold">{msg.role === 'user' ? 'You' : msg.engine && msg.engine !== 'Welcome' ? `DHRU · ${msg.engine}` : 'DHRU'}</span>
                <span>{msg.timestamp}</span>
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-surface-2 dark:bg-brand-fill border border-line dark:border-line flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-brand dark:text-brand" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-fill   flex items-center justify-center shrink-0 ">
              <Bot className="w-4 h-4 text-ink" />
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-2 dark:bg-surface border border-line dark:border-line text-xs text-ink-2 dark:text-ink-3 flex items-center gap-2.5 ">
              <span className="w-3.5 h-3.5 border-2 border-line border-t-transparent rounded-full animate-spin" />
              Asking Gemini and preparing a context-aware reply...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={e => { e.preventDefault(); handleSend(); }}
        className="flex items-center gap-2 bg-surface dark:bg-surface border border-line dark:border-line p-2 rounded-2xl "
      >
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask DHRU AI anything…"
          className="flex-1 bg-transparent px-4 py-2.5 text-xs text-ink dark:text-ink-3 placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-5 py-2.5 rounded-xl bg-brand-fill hover:bg-brand-fill text-on-brand font-semibold text-xs flex items-center gap-1.5  hover: disabled:opacity-40 transition-all shrink-0 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" /> Send
        </button>
      </form>

    </div>
  );
};
