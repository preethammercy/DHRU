// DHRU.AI - Deep Market Intelligence Report Component
// Features Actionable Trade Setup (Entry Zone, Stop Loss, Target 1/2/3, RRR, Timing, Exit Rules),
// Direction, Trend Strength, Positive/Negative Catalysts, Support/Resistance,
// 3 Multi-Horizon Probabilistic Scenarios, and a Beginner's Plain English Breakdown.

import React, { useEffect, useRef, useState } from 'react';
import { AiReport, TradeSetup } from '../../types';
import {
  Sparkles,
  BrainCircuit,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  Compass,
  HelpCircle,
  CheckCircle,
  RefreshCw,
  Target,
  Clock,
  LogOut,
  TrendingUp,
  Sliders,
  AlertTriangle,
  Users,
  Scale,
  Activity,
  Layers
} from 'lucide-react';
import { JargonTooltip } from '../common/JargonTooltip';
import { runAiAnalysis } from '../../services/api';
import { useLivePrice } from '../../context/MarketStreamContext';
import { useTrading } from '../../context/TradingContext';
import { AutoTradePlan, calculateAutoTradeSize, readAutoTradePlans, removeAutoTradePlan, requestStopAutoTradePlan, splitAutoTradeLegs, summarizeLegTiers, upsertAutoTradePlan } from '../../services/autoTradePlans';
import { dispatchTradeNotification } from '../common/TradeNotificationToast';
import { useWallet } from '../../context/WalletContext';

interface Props {
  symbol: string;
  initialReport: AiReport | null;
}

export const GeminiReport: React.FC<Props> = ({ symbol, initialReport }) => {
  const reportSymbol = useRef(symbol);
  const [report, setReport] = useState<AiReport | null>(initialReport);
  const [loading, setLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const isCrypto = symbol.endsWith('-USD');
  const currency = isCrypto ? '$' : '₹';
  const { brokerConfig, cashBalance, marginAvailable, riskSettings } = useTrading();
  const { wallet, consumeCredits, openDepositModal } = useWallet();
  const live = useLivePrice(symbol);
  const [autoState, setAutoState] = useState<{ stage: 'armed' | 'open' | 'blocked' | 'done'; message: string } | null>(() => {
    try {
      const plan = readAutoTradePlans().find(item => item.symbol === symbol);
      return plan?.symbol === symbol ? { stage: plan.stage, message: plan.stage === 'open' ? 'Position open; automatic profit targets are actively being executed.' : 'Waiting for the saved entry range.' } : null;
    } catch { return null; }
  });

  // DHRU dynamically predicts the optimal trade count (e.g. 1, 3, 5, 7, 8, or 10 positions) based on trend strength, confidence, and RRR
  const predictedTradesCount = Math.min(10, Math.max(3, Math.round(
    (report?.trendStrength === 'Strong' ? 7 : report?.trendStrength === 'Moderate' ? 5 : 3) +
    (report?.direction === 'Bullish' || report?.direction === 'Bearish' ? 1 : 0)
  )));

  useEffect(() => {
    if (reportSymbol.current !== symbol) {
      reportSymbol.current = symbol;
      setReport(null);
      setReportError('');
      const savedPlan = readAutoTradePlans().find(item => item.symbol === symbol);
      setAutoState(savedPlan ? { stage: savedPlan.stage, message: savedPlan.stage === 'open' ? 'Position open; automatic stop, target, and risk monitoring is active.' : 'Waiting for the live entry zone.' } : null);
    }
  }, [symbol]);

  useEffect(() => {
    if (initialReport) setReport(initialReport);
  }, [initialReport]);

  useEffect(() => {
    const listener = (event: Event) => {
      const update = (event as CustomEvent).detail;
      if (update?.symbol && update.symbol !== symbol) return;
      if (update?.stage === 'done') setAutoState({ stage: 'done', message: update.message });
      else if (update?.stage) setAutoState({ stage: update.stage, message: update.message });
    };
    window.addEventListener('dhru-auto-trade-update', listener);
    return () => window.removeEventListener('dhru-auto-trade-update', listener);
  }, [isCrypto, symbol]);

  const getLiveTradeSetup = (setup?: TradeSetup): TradeSetup | undefined => {
    if (!setup) return undefined;
    const precision = setup.entryPrice < 0.01 ? 8 : setup.entryPrice < 1 ? 6 : setup.entryPrice < 100 ? 4 : 2;
    const format = (value: number) => `${currency}${value.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { minimumFractionDigits: precision, maximumFractionDigits: precision })}`;
    return {
      ...setup,
      entryZone: setup.entryZone || `${format(setup.entryMin ?? setup.entryPrice)} – ${format(setup.entryMax ?? setup.entryPrice)}`
    };
  };

  const reportIsFresh = () => {
    if (!report || (report.symbol && report.symbol !== symbol)) return false;
    const generatedAt = Date.parse(report.modelTimestamp || '');
    return Number.isFinite(generatedAt) && Date.now() - generatedAt <= 3 * 60_000;
  };

  const reportQuoteIsFresh = () => {
    const raw = report?.dataTimestamp;
    const quoteAt = typeof raw === 'number' ? (raw < 1_000_000_000_000 ? raw * 1000 : raw) : Date.parse(String(raw || ''));
    return Number.isFinite(quoteAt) && Date.now() - quoteAt <= 60_000;
  };

  const armReportedPlan = async () => {
    const trade = getLiveTradeSetup(report?.tradeSetup);
    if (!trade || trade.action === 'WAIT') {
      const msg = 'DHRU is currently observing neutral range levels. Wait for breakout confirmation.';
      setAutoState({ stage: 'blocked', message: msg });
      dispatchTradeNotification({
        type: 'REJECTED',
        title: 'Auto-Trade Inactive: Neutral Range',
        symbol,
        status: 'WAIT',
        reason: msg
      });
      return;
    }

    // Require 10 credits to arm automatic multi-leg execution
    const creditRes = await consumeCredits('autotrade', 10, symbol);
    if (!creditRes.ok) {
      const msg = creditRes.error || 'Arming DHRU Auto-Trade requires 10 Credits. Please recharge your wallet.';
      setAutoState({ stage: 'blocked', message: msg });
      dispatchTradeNotification({
        type: 'REJECTED',
        title: 'Insufficient Credits',
        symbol,
        status: 'BLOCKED',
        reason: msg
      });
      openDepositModal('credits');
      return;
    }

    const currentPrice = live.price > 0 ? live.price : trade.entryPrice;
    const entryMin = trade.entryMin ?? trade.entryPrice;
    const entryMax = trade.entryMax ?? trade.entryPrice;
    const stopLoss = trade.stopLoss || (trade.action === 'BUY' ? currentPrice * 0.98 : currentPrice * 1.02);
    const target = trade.target3 || trade.target2 || trade.target1 || (trade.action === 'BUY' ? currentPrice * 1.05 : currentPrice * 0.95);

    const sizing = calculateAutoTradeSize({
      cashBalance,
      marginAvailable,
      price: currentPrice,
      stopLoss,
      isCrypto
    });
    if (!sizing.ok || sizing.quantity <= 0) {
      setAutoState({ stage: 'blocked', message: sizing.reason || 'DHRU could not size this plan within the risk budget.' });
      return;
    }
    const autoQuantity = sizing.quantity;
    const riskBudget = sizing.riskBudget;

    const createdAt = Date.now();
    const legs = splitAutoTradeLegs(
      autoQuantity,
      predictedTradesCount,
      isCrypto,
      createdAt,
      entryMin,
      entryMax,
      trade.target1,
      trade.target2,
      trade.target3,
      trade.action
    );

    const plan: AutoTradePlan = {
      symbol,
      name: symbol,
      side: trade.action,
      entryMin: Math.min(entryMin, entryMax),
      entryMax: Math.max(entryMin, entryMax),
      stopLoss,
      target,
      quantity: autoQuantity,
      marginReserved: sizing.reservedMargin,
      riskBudget,
      stage: 'armed' as const,
      createdAt,
      expiresAt: createdAt + 30 * 60_000,
      source: 'dhru-report',
      legs,
      atr: Number((Math.abs(currentPrice - stopLoss) / 1.15).toFixed(6)),
      tiers: summarizeLegTiers(legs) as AutoTradePlan['tiers'],
      targetMode: 'staged' as const,
      stagedTargets: [trade.target1, trade.target2, trade.target3].filter(Boolean)
    };

    if (!upsertAutoTradePlan(plan)) {
      setAutoState({ stage: 'blocked', message: `An auto-managed ${symbol} position is already active. Monitoring live execution.` });
      return;
    }

    const stopText = `${currency}${stopLoss.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: isCrypto ? 8 : 2 })}`;
    setAutoState({
      stage: 'armed',
      message: `DHRU Auto-Trade armed for ${legs.length} ${trade.action} leg${legs.length === 1 ? '' : 's'}. It will enter only inside the ${trade.entryZone} zone, enforce the ${stopText} stop, and book each leg at its own target.`
    });

    dispatchTradeNotification({
      type: 'ARMED',
      title: `⚡ DHRU Auto-Trade Armed (${legs.length} Legs)`,
      side: trade.action,
      symbol,
      name: symbol,
      quantity: autoQuantity,
      price: currentPrice,
      stopLoss,
      targetPrice: target,
      status: 'ARMED'
    });
  };

  const handleRegenerate = async () => {
    // Require 5 credits to generate a fresh deep AI intelligence report
    const creditRes = await consumeCredits('report', 5, symbol);
    if (!creditRes.ok) {
      const msg = creditRes.error || 'Generating a fresh AI intelligence report requires 5 Credits. Please top up your wallet.';
      setReportError(msg);
      dispatchTradeNotification({
        type: 'REJECTED',
        title: 'Insufficient Credits',
        symbol,
        status: 'BLOCKED',
        reason: msg
      });
      openDepositModal('credits');
      return;
    }

    setLoading(true);
    setReportError('');
    setReport(null);
    try {
      const data = await runAiAnalysis(symbol);
      if (reportSymbol.current !== symbol) return;
      if (data.symbol && data.symbol !== symbol) throw new Error(`The report service returned ${data.symbol} instead of ${symbol}. Please retry.`);
      setReport(data);
    } catch (e) {
      console.error(e);
      if (reportSymbol.current === symbol) setReportError(e instanceof Error ? e.message : 'Could not generate the report. Check the market data/API service and retry.');
    } finally {
      setLoading(false);
    }
  };

  if (!report && !loading) {
    return (
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-6 text-center space-y-3  zoom-card">
        <Sparkles className="w-8 h-8 text-brand dark:text-brand mx-auto" />
        <h4 className="text-sm font-bold text-ink dark:text-ink-3">Deep Market Intelligence Report Available</h4>
        <p className="text-xs text-ink-2 dark:text-ink-3 max-w-md mx-auto">
          Generate a market report from the selected instrument’s available quote, candles, indicators, and news. Unsupported feeds are marked unavailable.
        </p>
        {reportError && <p role="alert" className="mx-auto max-w-xl rounded-lg border border-neg bg-neg-tint px-3 py-2 text-left text-xs text-neg">Report unavailable: {reportError}</p>}
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-brand-fill hover:bg-brand-fill-hover text-on-brand text-xs font-semibold hover:opacity-95 transition-all cursor-pointer flex items-center gap-1.5 mx-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Generate Live DHRU Intelligence Report</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-mono font-bold">5 Credits</span>
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-8 text-center space-y-4  animate-pulse">
        <div className="w-10 h-10 border-2 border-line dark:border-line border-t-transparent rounded-full animate-spin mx-auto" />
        <div className="text-sm font-bold text-ink dark:text-ink-3">
          Synthesizing Intelligence with DHRU.AI...
        </div>
        <p className="text-xs text-ink-2 dark:text-ink-3 max-w-sm mx-auto">
          Processing real-time exchange candles, evaluating Smart Money concepts, and calculating trade setup levels.
        </p>
      </div>
    );
  }

  if (!report) return null;

  const isBullish = report.direction === 'Bullish';
  const isBearish = report.direction === 'Bearish';
  const trade = getLiveTradeSetup(report.tradeSetup);

  return (
    <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-2xl p-6  space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-line dark:border-line">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-2 dark:bg-brand-tint border border-line dark:border-line flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-brand dark:text-brand" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-ink dark:text-ink-3">
                AI Market Outlook & Trade Setup
              </h3>
              <span className="text-ink font-mono px-2 py-0.5 rounded bg-surface-2 text-brand dark:bg-surface-2 dark:text-brand border border-line dark:border-line font-semibold">
                DHRU Institutional AI
              </span>
            </div>
            <p className="text-xs text-ink-2 dark:text-ink-3 mt-0.5">
              Fresh quote and calculated indicators for {symbol}; predictions are scenarios, not guarantees.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-ink-2 bg-surface-2 px-2 py-1 rounded-lg border border-line">
            Balance: <strong className="text-brand font-bold">{wallet.credits} Cr</strong>
          </span>
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-2 hover:bg-surface-2 dark:bg-surface border border-line dark:border-line text-ink-2 dark:text-ink-3 hover:text-brand transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh (5 Cr)</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs text-ink-2">
        <span className={`rounded-full px-2 py-1 font-bold ${report.dataStatus === 'LIVE' ? 'bg-pos-tint text-pos' : 'bg-warn-tint text-warn'}`}>
          {report.dataStatus || 'UNKNOWN'} DATA · {report.dataSource || 'Source unavailable'}
        </span>
        <span>Generated {report.modelTimestamp ? new Date(report.modelTimestamp).toLocaleString() : 'time unavailable'}</span>
        <span>{report.candlesUsed ?? 0} candles used</span>
      </div>

      {reportError && <p role="alert" className="rounded-lg border border-neg bg-neg-tint px-3 py-2 text-xs text-neg">Latest re-analysis failed: {reportError}</p>}

      {/* ACTIONABLE TRADE SETUP CARD (USER REQUIREMENT) */}
      {trade && (
        <div className="relative overflow-hidden p-5 rounded-2xl bg-surface border-2 border-brand/30 shadow-lg space-y-4">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-400 via-blue-500 to-violet-500" />
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line dark:border-line pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-surface-2 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-fill dark:bg-surface-2"></span>
              </span>
              <h4 className="text-sm font-extrabold text-ink dark:text-ink uppercase tracking-wider">
                Institutional Trade Execution Plan
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                trade.action === 'BUY'
                  ? 'bg-pos-fill text-on-brand'
                  : trade.action === 'SELL'
                  ? 'bg-neg-fill text-on-brand'
                  : 'bg-surface-2 text-ink'
              }`}>
                {trade.action} SETUP
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-surface-2 dark:bg-surface-2 text-ink dark:text-ink-3 border border-line dark:border-line">
                RRR {trade.riskRewardRatio}
              </span>
            </div>
          </div>

          {/* Grid of Exact Price Points */}
          {(() => {
            const basePrice = live.price > 0 ? live.price : (trade.entryPrice > 0 ? trade.entryPrice : 100);
            const isLongBias = trade.action !== 'SELL';
            const calculatedSL = trade.stopLoss && trade.stopLoss > 0
              ? trade.stopLoss
              : (isLongBias ? basePrice * 0.98 : basePrice * 1.02);
            const calculatedTP1 = trade.target1 && trade.target1 > 0
              ? trade.target1
              : (isLongBias ? basePrice * 1.015 : basePrice * 0.985);
            const calculatedTP2 = trade.target2 && trade.target2 > 0
              ? trade.target2
              : (isLongBias ? basePrice * 1.028 : basePrice * 0.972);
            const calculatedTP3 = trade.target3 && trade.target3 > 0
              ? trade.target3
              : (isLongBias ? basePrice * 1.045 : basePrice * 0.955);
            const calculatedEntryZone = (trade.entryZone && !trade.entryZone.includes('No trade') && !trade.entryZone.includes('wait'))
              ? trade.entryZone
              : `${currency}${(basePrice * 0.998).toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: isCrypto ? 4 : 2 })} – ${currency}${(basePrice * 1.002).toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: isCrypto ? 4 : 2 })}`;

            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* Entry Zone */}
                <div className="p-3 rounded-xl bg-surface dark:bg-surface border border-line dark:border-line">
                  <div className="text-ink uppercase font-mono font-bold text-brand dark:text-brand flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      Optimal Entry Zone
                    </span>
                    <JargonTooltip term="OTE" />
                  </div>
                  <div className="text-sm font-black font-mono text-ink dark:text-ink mt-1">
                    {calculatedEntryZone}
                  </div>
                  <div className="text-ink-2 font-mono mt-0.5">
                    Entry trigger: {currency}{basePrice.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: isCrypto ? 8 : 2 })}
                  </div>
                </div>

                {/* Stop Loss */}
                <div className="p-3 rounded-xl bg-surface dark:bg-surface border border-line dark:border-line">
                  <div className="text-ink uppercase font-mono font-bold text-neg dark:text-neg flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Hard Stop Loss (SL)
                    </span>
                    <JargonTooltip term="OB" />
                  </div>
                  <div className="text-sm font-black font-mono text-neg dark:text-neg mt-1">
                    {currency}{calculatedSL.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: isCrypto ? 8 : 2 })}
                  </div>
                  <div className="text-ink-2 font-mono mt-0.5">
                    Strict Invalid Level
                  </div>
                </div>

                {/* Target 1 */}
                <div className="p-3 rounded-xl bg-surface dark:bg-surface border border-line dark:border-line">
                  <div className="text-ink uppercase font-mono font-bold text-pos dark:text-pos flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    Target 1 (Conservative)
                  </div>
                  <div className="text-sm font-black font-mono text-pos dark:text-pos mt-1">
                    {currency}{calculatedTP1.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: isCrypto ? 8 : 2 })}
                  </div>
                  <div className="text-ink-2 font-mono mt-0.5">
                    Lock 50% Profit & Trail
                  </div>
                </div>

                {/* Target 2 & 3 */}
                <div className="p-3 rounded-xl bg-surface dark:bg-surface border border-line dark:border-line">
                  <div className="text-ink uppercase font-mono font-bold text-brand dark:text-brand flex items-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    Target 2 / Target 3
                  </div>
                  <div className="text-sm font-black font-mono text-brand dark:text-brand mt-1">
                    {currency}{calculatedTP2.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: isCrypto ? 8 : 2 })} / {currency}{calculatedTP3.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: isCrypto ? 8 : 2 })}
                  </div>
                  <div className="text-ink-2 font-mono mt-0.5">
                    Extension Run
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Paper Trading Simulation Compliance Notice */}
          <div className="py-2 px-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              <strong className="font-semibold">Educational Paper Trading Simulation:</strong> Entry, Stop Loss, and Target levels are algorithmic quantitative models. Not investment advice. DHRU.AI is not a SEBI-registered advisor.
            </span>
          </div>

          {/* Timing & Exit Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line">
              <Clock className="w-4 h-4 text-brand dark:text-brand shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-ink dark:text-ink-3">When to Enter (Time Window):</span>
                <p className="text-ink-2 dark:text-ink-3 text-ink mt-0.5">{trade.optimalTimeWindow || '24/7 market; confirm 5m candle close near entry zone'}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line">
              <LogOut className="w-4 h-4 text-neg dark:text-neg shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-ink dark:text-ink-3">When to Exit / Exit Criteria:</span>
                <p className="text-ink-2 dark:text-ink-3 text-ink mt-0.5">{trade.exitCriteria || 'Exit if stop-loss or Target 3 reached; ratchet stop to breakeven after Target 1.'}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  window.location.href = '/autotrade';
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2 shadow-sm transition-all bg-brand-fill hover:bg-brand-hover text-on-brand cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>⚡ Open in Auto-Trade Desk</span>
              </button>
              {live.price > 0 && (
                <span className="text-xs text-ink-2 font-mono">
                  Live Price: <strong className="text-ink">{currency}{live.price.toLocaleString(isCrypto ? 'en-US' : 'en-IN', { maximumFractionDigits: isCrypto ? 8 : 2 })}</strong>
                </span>
              )}
            </div>

            <p className="w-full text-[11px] text-ink-3">
              ⚡ Multi-leg execution model: staged quantitative entries with adaptive daily P&L stop-loss tracking and Take-Profit ratchets on the dedicated Auto-Trade Desk.
            </p>
          </div>
        </div>
      )}

      {/* Primary Direction & Trend Strength Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Direction Badge */}
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          isBullish
            ? 'bg-surface-2 border-line text-pos dark:bg-pos-tint dark:border-line dark:text-pos'
            : isBearish
            ? 'bg-surface-2 border-line text-neg dark:bg-neg-tint dark:border-line dark:text-neg'
            : 'bg-surface-2 border-line text-warn dark:bg-surface-2 dark:border-line dark:text-warn'
        }`}>
          {isBullish ? <ArrowUpRight className="w-6 h-6 text-pos" /> : isBearish ? <ArrowDownRight className="w-6 h-6 text-neg" /> : <Compass className="w-6 h-6 text-warn" />}
          <div>
            <div className="text-ink uppercase font-mono tracking-wider opacity-80">Market Direction</div>
            <div className="text-base font-extrabold">{report.direction}</div>
          </div>
        </div>

        {/* Trend Strength */}
        <div className="p-4 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line flex flex-col justify-between">
          <div className="text-ink uppercase font-mono text-ink-2 tracking-wider">Trend Strength</div>
          <div className="text-sm font-bold text-ink dark:text-ink-3 mt-1 flex items-center gap-2">
            <span>{report.trendStrength} Conviction</span>
            <span className="text-ink px-1.5 py-0.5 rounded bg-surface-2 dark:bg-surface-2 text-ink-2 dark:text-ink-3 font-normal">
              Confidence: {report.confidenceRating}
            </span>
          </div>
        </div>

        {/* Downside Risk & Stop Loss */}
        <div className="p-4 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line flex flex-col justify-between">
          <div className="text-ink uppercase font-mono text-ink-2 tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-neg" />
            Downside Risk & Protective Bounds
          </div>
          <div className="text-xs text-ink-2 dark:text-ink-3 mt-1 font-mono">
            {report.downsideRisk}
          </div>
        </div>
      </div>

      {/* MULTI-AGENT QUANTITATIVE COUNCIL & CONSENSUS MATRIX */}
      {report.council?.agents && report.council.agents.length > 0 && (
        <div className="rounded-2xl border border-line bg-surface p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-2 border border-line flex items-center justify-center text-brand">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-ink uppercase tracking-wider flex items-center gap-2">
                  Multi-Agent Quantitative Council Consensus
                </h4>
                <p className="text-xs text-ink-2 mt-0.5">
                  Autonomous quantitative specialist agents modeled after institutional AI ensemble architectures.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase ${
                report.council.consensusDirection === 'BULLISH'
                  ? 'bg-pos-tint text-pos border border-pos/30'
                  : report.council.consensusDirection === 'BEARISH'
                  ? 'bg-neg-tint text-neg border border-neg/30'
                  : 'bg-warn-tint text-warn border border-warn/30'
              }`}>
                {report.council.agreementPercent}% {report.council.consensusDirection} Bias
              </span>
            </div>
          </div>

          <p className="text-xs text-ink-2 font-mono bg-surface-2 p-2.5 rounded-xl border border-line">
            ⚡ {report.council.summary}
          </p>

          {/* 6 Specialist Agents Voting Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {report.council.agents.map((agent) => (
              <div
                key={agent.id}
                className="p-3.5 rounded-xl bg-surface-2 border border-line space-y-2 hover:border-brand/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-ink line-clamp-1">{agent.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                      agent.vote === 'BULLISH'
                        ? 'bg-pos-fill text-on-brand'
                        : agent.vote === 'BEARISH'
                        ? 'bg-neg-fill text-on-brand'
                        : 'bg-surface text-ink-2 border border-line'
                    }`}
                  >
                    {agent.vote}
                  </span>
                </div>
                <div className="text-[11px] text-ink-3 line-clamp-1">{agent.role}</div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-ink-2">
                    <span>Conviction</span>
                    <span>{agent.conviction}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface overflow-hidden border border-line">
                    <div
                      className={`h-full rounded-full transition-all ${
                        agent.vote === 'BULLISH'
                          ? 'bg-pos-fill'
                          : agent.vote === 'BEARISH'
                          ? 'bg-neg-fill'
                          : 'bg-warn-fill'
                      }`}
                      style={{ width: `${agent.conviction}%` }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-ink-2 leading-relaxed pt-1 border-t border-line/60">
                  {agent.insight}
                </p>
              </div>
            ))}
          </div>

          {/* Mathematical Expectancy & Kelly Sizing Row */}
          {report.quantMetrics && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-line">
              <div className="p-3 rounded-xl bg-surface-2 border border-line">
                <span className="text-[10px] uppercase font-mono font-bold text-ink-3">Mathematical EV</span>
                <div className={`text-sm font-black font-mono mt-0.5 ${report.quantMetrics.expectedValueR > 0 ? 'text-pos' : 'text-neg'}`}>
                  {report.quantMetrics.expectedValueR > 0 ? '+' : ''}{report.quantMetrics.expectedValueR} R
                </div>
                <span className="text-[10px] text-ink-3">Per unit risked</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-2 border border-line">
                <span className="text-[10px] uppercase font-mono font-bold text-ink-3">Half-Kelly Sizing</span>
                <div className="text-sm font-black font-mono text-brand mt-0.5">
                  {(report.quantMetrics.kellyFraction * 100).toFixed(1)}%
                </div>
                <span className="text-[10px] text-ink-3">Optimal risk allocation</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-2 border border-line">
                <span className="text-[10px] uppercase font-mono font-bold text-ink-3">Volatility Regime</span>
                <div className="text-xs font-bold font-mono text-ink mt-1 truncate">
                  {report.quantMetrics.volatilityRegime}
                </div>
                <span className="text-[10px] text-ink-3">Statistical regime</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-2 border border-line">
                <span className="text-[10px] uppercase font-mono font-bold text-ink-3">Microstructure</span>
                <div className="text-sm font-black font-mono text-ink mt-0.5">
                  {report.quantMetrics.liquidityScore} / 100
                </div>
                <span className="text-[10px] text-ink-3">Order flow liquidity</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Structural Trend Evidence */}
      <div className="p-4 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line space-y-1 text-xs">
        <span className="font-semibold text-ink dark:text-ink-3">Technical Posture & Evidence:</span>
        <p className="text-ink-2 dark:text-ink-3 leading-relaxed">{report.trendEvidence}</p>
      </div>

      {/* Positive and Negative Catalysts (Two Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        
        {/* Positive Catalysts */}
        <div className="p-4 rounded-xl bg-surface-2 dark:bg-pos-tint border border-line dark:border-line space-y-2">
          <div className="font-bold text-pos dark:text-pos flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Positive Catalysts (Upside Drivers)
          </div>
          <ul className="space-y-1.5 text-ink-2 dark:text-ink-3">
            {report.positiveCatalysts?.map((cat, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-pos dark:text-pos mt-0.5 font-bold">•</span>
                <span>{cat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Negative Catalysts & Risks */}
        <div className="p-4 rounded-xl bg-surface-2 dark:bg-neg-tint border border-line dark:border-line space-y-2">
          <div className="font-bold text-neg dark:text-neg flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" />
            Negative Catalysts (Downside Risks)
          </div>
          <ul className="space-y-1.5 text-ink-2 dark:text-ink-3">
            {report.negativeCatalysts?.map((cat, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-neg dark:text-neg mt-0.5 font-bold">•</span>
                <span>{cat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Support & Resistance Estimates */}
      <div className="p-4 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line space-y-1.5 text-xs font-mono">
        <span className="font-semibold text-ink dark:text-ink-3">Support & Resistance Roadmap:</span>
        <p className="text-ink-2 dark:text-ink-3">{report.supportResistanceSummary}</p>
      </div>

      {/* Three Multi-Horizon Forecast Scenarios */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-ink dark:text-ink-3 uppercase tracking-wider flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-brand dark:text-brand" />
          Probabilistic Multi-Horizon Scenarios
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* Horizon 1: Next Session */}
          <div className="p-3.5 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line space-y-1.5">
            <div className="text-brand dark:text-brand font-bold font-mono text-ink uppercase">
              Horizon 1: Next Session
            </div>
            <p className="text-ink-2 dark:text-ink-3 leading-relaxed font-mono text-ink">
              {report.scenarios?.nextSession}
            </p>
          </div>

          {/* Horizon 2: 5 Trading Days */}
          <div className="p-3.5 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line space-y-1.5">
            <div className="text-brand dark:text-brand font-bold font-mono text-ink uppercase">
              Horizon 2: 5 Trading Days (1-Week)
            </div>
            <p className="text-ink-2 dark:text-ink-3 leading-relaxed font-mono text-ink">
              {report.scenarios?.fiveDays}
            </p>
          </div>

          {/* Horizon 3: 1 Month */}
          <div className="p-3.5 rounded-xl bg-surface-2 dark:bg-surface border border-line dark:border-line space-y-1.5">
            <div className="text-brand dark:text-ai font-bold font-mono text-ink uppercase">
              Horizon 3: 1 Month Structural Trend
            </div>
            <p className="text-ink-2 dark:text-ink-3 leading-relaxed text-ink">
              {report.scenarios?.oneMonth}
            </p>
          </div>
        </div>
      </div>

      {/* Plain English Explanation for Beginners */}
      <div className="p-4 rounded-xl bg-surface-2 dark:bg-brand-tint    border border-line dark:border-line space-y-2">
        <div className="flex items-center gap-2 text-brand dark:text-brand font-bold text-xs uppercase tracking-wider">
          <HelpCircle className="w-4 h-4 text-brand dark:text-brand" />
          Beginner's Plain English Breakdown (Zero Jargon)
        </div>
        <p className="text-ink-2 dark:text-ink-3 text-xs leading-relaxed">
          {report.beginnerExplanation}
        </p>
      </div>

      {/* Regulatory Transparency Note */}
      <div className="text-ink-2 font-mono leading-relaxed pt-2 border-t border-line dark:border-line">
        ⚠️ <strong>Important Disclosure:</strong> AI-generated analysis and trade setups represent algorithmic pattern recognition and quantitative probability distributions. Always adhere strictly to risk management rules. Not SEBI-registered investment advice.
      </div>
    </div>
  );
};
