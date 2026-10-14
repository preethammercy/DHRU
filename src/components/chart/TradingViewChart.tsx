// DHRU.AI - Professional Trading Terminal Chart Engine
// Built using TradingView Lightweight Charts (Apache 2.0)
// Supports Non-Resetting Live Bar Updates, Granular Intraday + Multi-Year Historical Data,
// Standard & Premium Quant Indicators (SMC, Order Blocks, FVG, Supertrend, Ichimoku, CMF),
// Single-Choice Unified Timeframe Period Bar, and Precise Timestamp OHLC Inspection.

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { createChart, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';
import { Candle, VolumeBar } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { useMarketStream } from '../../context/MarketStreamContext';
import { IndicatorConfig, DEFAULT_INDICATORS } from '../../types/indicators';
import { IndicatorModal } from './IndicatorModal';
import {
  calculateSMA,
  calculateEMA,
  calculateWMA,
  calculateVWMA,
  calculateHMA,
  calculateSupertrend,
  calculateBollingerBands,
  calculateKeltnerChannels,
  calculateDonchianChannels,
  calculateVWAP,
  calculateParabolicSAR,
  calculatePivotPoints,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateStochRSI,
  calculateCCI,
  calculateROC,
  calculateWilliamsR,
  calculateMFI,
  calculateATR,
  calculateOBV,
  calculateADX,
  calculateOrderBlocks,
  calculateFVG,
  calculateIchimoku,
  calculateAtrTrailingStop,
  calculateCMF,
  calculateAroon,
  calculateTSI
} from '../../utils/indicators';

import {
  Sliders,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  BarChart2,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';

interface ChartProps {
  candles: Candle[];
  volumeData: VolumeBar[];
  symbol: string;
  currentPrice: number;
  onTimeframeChange?: (range: string, interval: string) => void;
  activeTimeframe?: string;
  activeInterval?: string;
}

// Single-choice unified timeframe periods (eliminates dual-selection conflicts & API 400 errors)
const UNIFIED_TIMEFRAMES = [
  { label: '1m', interval: '1m', range: '1d', title: '1-Minute Intraday (1 Day)' },
  { label: '5m', interval: '5m', range: '5d', title: '5-Minute Intraday (5 Days)' },
  { label: '15m', interval: '15m', range: '1mo', title: '15-Minute Intraday (1 Month)' },
  { label: '30m', interval: '30m', range: '1mo', title: '30-Minute Intraday (1 Month)' },
  { label: '1h', interval: '60m', range: '3mo', title: '1-Hour Intraday (3 Months)' },
  { label: '4h', interval: '4h', range: '6mo', title: '4-Hour Swing (6 Months)' },
  { label: '1D', interval: '1d', range: '1y', title: 'Daily (1 Year History)' },
  { label: '1W', interval: '1wk', range: '5y', title: 'Weekly (5 Years Macro)' },
  { label: '1M', interval: '1mo', range: 'max', title: 'Monthly (Maximum Available History)' },
];

function formatCandleTime(time: number | string | undefined, interval: string) {
  if (!time) return '';
  const date = typeof time === 'number' ? new Date(time * 1000) : new Date(time);
  if (isNaN(date.getTime())) return String(time);

  const isIntraday = ['1m', '5m', '15m', '30m', '60m', '1h', '4h'].includes(interval);
  if (isIntraday) {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export const TradingViewChart: React.FC<ChartProps> = ({
  candles,
  volumeData: _volumeData,
  symbol,
  currentPrice,
  onTimeframeChange,
  activeInterval = '1d'
}) => {
  const { theme } = useTheme();
  const { ticks } = useMarketStream();
  const isDark = theme === 'dark';

  const isUsd = symbol.includes('-USD') || (symbol.endsWith('=X') && !symbol.includes('INR'));
  const currencySym = isUsd ? '$' : '₹';

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const oscillatorContainerRef = useRef<HTMLDivElement>(null);

  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const overlaySeriesMap = useRef<Map<string, ISeriesApi<any>>>(new Map());

  const oscChartRef = useRef<IChartApi | null>(null);
  const oscSeriesMap = useRef<Map<string, ISeriesApi<any>>>(new Map());

  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [showVolume, setShowVolume] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [indicatorModalOpen, setIndicatorModalOpen] = useState(false);

  // Indicators state
  const [indicators, setIndicators] = useState<IndicatorConfig[]>(() => {
    const saved = localStorage.getItem('dhru_chart_indicators');
    return saved ? JSON.parse(saved) : DEFAULT_INDICATORS;
  });

  useEffect(() => {
    localStorage.setItem('dhru_chart_indicators', JSON.stringify(indicators));
  }, [indicators]);

  const [hoverData, setHoverData] = useState<{
    time?: string | number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
    change?: number;
    changePercent?: number;
  } | null>(null);

  // Deduplicate and sort candles strictly ascending
  const cleanCandles = useMemo(() => {
    if (!candles || candles.length === 0) return [];
    const valid = candles.filter(c => c && c.time != null && !isNaN(c.close) && c.open != null);
    
    // Sort ascending by time
    valid.sort((a, b) => {
      const ta = typeof a.time === 'number' ? a.time : new Date(a.time).getTime() / 1000;
      const tb = typeof b.time === 'number' ? b.time : new Date(b.time).getTime() / 1000;
      return ta - tb;
    });

    // Remove duplicates
    const seen = new Set<string | number>();
    const deduped: Candle[] = [];
    for (const c of valid) {
      if (!seen.has(c.time)) {
        seen.add(c.time);
        deduped.push(c);
      }
    }
    return deduped;
  }, [candles]);

  // Active oscillators
  const activeOscillators = useMemo(() => {
    return indicators.filter(ind => ind.enabled && ind.category === 'oscillator');
  }, [indicators]);

  // 1. Initialize Main Price Chart
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      overlaySeriesMap.current.clear();
    }

    const chart = createChart(container, {
      width: container.clientWidth,
      height: isFullscreen ? window.innerHeight - (activeOscillators.length > 0 ? 320 : 180) : 460,
      layout: {
        background: { color: isDark ? '#0D1527' : '#FFFFFF' },
        textColor: isDark ? '#94A3B8' : '#64748B',
      },
      grid: {
        vertLines: { color: isDark ? '#142036' : '#F1F5F9' },
        horzLines: { color: isDark ? '#142036' : '#F1F5F9' },
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: {
          color: isDark ? '#38BDF8' : '#2563EB',
          width: 1,
          style: LineStyle.Dashed,
        },
        horzLine: {
          color: isDark ? '#38BDF8' : '#2563EB',
          width: 1,
          style: LineStyle.Dashed,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? '#1E2D4A' : '#E2E8F0',
        scaleMargins: {
          top: 0.08,
          bottom: showVolume ? 0.22 : 0.08,
        },
      },
      timeScale: {
        borderColor: isDark ? '#1E2D4A' : '#E2E8F0',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    if (cleanCandles.length === 0) return;

    // Create Main Candlestick / Line Series
    let mainSeries: ISeriesApi<any>;
    if (chartType === 'candlestick') {
      mainSeries = chart.addCandlestickSeries({
        upColor: '#10B981',
        downColor: '#EF4444',
        borderUpColor: '#10B981',
        borderDownColor: '#EF4444',
        wickUpColor: '#10B981',
        wickDownColor: '#EF4444',
      });
      mainSeries.setData(cleanCandles as any);
    } else {
      mainSeries = chart.addLineSeries({
        color: '#2563EB',
        lineWidth: 2,
        priceLineColor: '#2563EB',
      });
      mainSeries.setData(cleanCandles.map(c => ({ time: c.time, value: c.close })) as any);
    }

    mainSeriesRef.current = mainSeries;

    // Volume Series
    if (showVolume) {
      const volSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '',
      });
      volSeries.priceScale().applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
      const volData = cleanCandles.map(c => ({
        time: c.time,
        value: c.volume || 0,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
      }));
      volSeries.setData(volData as any);
      volumeSeriesRef.current = volSeries;
    }

    // Crosshair inspection listener
    chart.subscribeCrosshairMove(param => {
      if (!param || !param.time || !param.seriesData) {
        setHoverData(null);
        return;
      }

      const data = param.seriesData.get(mainSeries) as any;
      if (data) {
        const o = data.open ?? data.value;
        const c = data.close ?? data.value;
        const diff = c - o;
        const diffPct = o > 0 ? (diff / o) * 100 : 0;
        setHoverData({
          time: param.time as any,
          open: data.open,
          high: data.high,
          low: data.low,
          close: c,
          volume: data.volume,
          change: Number(diff.toFixed(2)),
          changePercent: Number(diffPct.toFixed(2)),
        });
      }
    });

    // Draw Overlay Indicators
    for (const ind of indicators) {
      if (!ind.enabled || ind.category !== 'overlay') continue;

      try {
        if (ind.id.startsWith('sma')) {
          const period = Number(ind.params.period || 20);
          const data = calculateSMA(cleanCandles, period);
          if (data.length > 0) {
            const series = chart.addLineSeries({
              color: ind.color,
              lineWidth: (ind.lineWidth || 1.5) as any,
              title: ind.shortName,
            });
            series.setData(data as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id.startsWith('ema')) {
          const period = Number(ind.params.period || 20);
          const data = calculateEMA(cleanCandles, period);
          if (data.length > 0) {
            const series = chart.addLineSeries({
              color: ind.color,
              lineWidth: (ind.lineWidth || 1.5) as any,
              title: ind.shortName,
            });
            series.setData(data as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'wma20') {
          const period = Number(ind.params.period || 20);
          const data = calculateWMA(cleanCandles, period);
          if (data.length > 0) {
            const series = chart.addLineSeries({ color: ind.color, lineWidth: 2, title: 'WMA 20' });
            series.setData(data as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'vwma20') {
          const period = Number(ind.params.period || 20);
          const data = calculateVWMA(cleanCandles, period);
          if (data.length > 0) {
            const series = chart.addLineSeries({ color: ind.color, lineWidth: 2, title: 'VWMA 20' });
            series.setData(data as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'hma14') {
          const period = Number(ind.params.period || 14);
          const data = calculateHMA(cleanCandles, period);
          if (data.length > 0) {
            const series = chart.addLineSeries({ color: ind.color, lineWidth: 2, title: 'HMA 14' });
            series.setData(data as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'supertrend') {
          const period = Number(ind.params.period || 10);
          const mult = Number(ind.params.multiplier || 3);
          const stData = calculateSupertrend(cleanCandles, period, mult);
          if (stData.length > 0) {
            const series = chart.addLineSeries({
              color: ind.color,
              lineWidth: 2,
              title: 'Supertrend',
            });
            series.setData(stData as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'bollinger') {
          const period = Number(ind.params.period || 20);
          const mult = Number(ind.params.multiplier || 2);
          const bbData = calculateBollingerBands(cleanCandles, period, mult);
          if (bbData.length > 0) {
            const upper = chart.addLineSeries({ color: 'rgba(37, 99, 235, 0.7)', lineWidth: 1, lineStyle: LineStyle.Dotted });
            const mid = chart.addLineSeries({ color: ind.color, lineWidth: 2 });
            const lower = chart.addLineSeries({ color: 'rgba(37, 99, 235, 0.7)', lineWidth: 1, lineStyle: LineStyle.Dotted });
            upper.setData(bbData.map(v => ({ time: v.time, value: v.upper })) as any);
            mid.setData(bbData.map(v => ({ time: v.time, value: v.middle })) as any);
            lower.setData(bbData.map(v => ({ time: v.time, value: v.lower })) as any);
            overlaySeriesMap.current.set(`${ind.id}_upper`, upper);
            overlaySeriesMap.current.set(ind.id, mid);
            overlaySeriesMap.current.set(`${ind.id}_lower`, lower);
          }
        } else if (ind.id === 'keltner') {
          const period = Number(ind.params.period || 20);
          const mult = Number(ind.params.multiplier || 2);
          const kcData = calculateKeltnerChannels(cleanCandles, period, mult);
          if (kcData.length > 0) {
            const upper = chart.addLineSeries({ color: 'rgba(217, 119, 6, 0.6)', lineWidth: 1, lineStyle: LineStyle.Dotted });
            const mid = chart.addLineSeries({ color: ind.color, lineWidth: 2 });
            const lower = chart.addLineSeries({ color: 'rgba(217, 119, 6, 0.6)', lineWidth: 1, lineStyle: LineStyle.Dotted });
            upper.setData(kcData.map(v => ({ time: v.time, value: v.upper })) as any);
            mid.setData(kcData.map(v => ({ time: v.time, value: v.middle })) as any);
            lower.setData(kcData.map(v => ({ time: v.time, value: v.lower })) as any);
            overlaySeriesMap.current.set(`${ind.id}_upper`, upper);
            overlaySeriesMap.current.set(ind.id, mid);
            overlaySeriesMap.current.set(`${ind.id}_lower`, lower);
          }
        } else if (ind.id === 'donchian') {
          const period = Number(ind.params.period || 20);
          const dcData = calculateDonchianChannels(cleanCandles, period);
          if (dcData.length > 0) {
            const upper = chart.addLineSeries({ color: 'rgba(2, 132, 199, 0.7)', lineWidth: 1 });
            const lower = chart.addLineSeries({ color: 'rgba(2, 132, 199, 0.7)', lineWidth: 1 });
            upper.setData(dcData.map(v => ({ time: v.time, value: v.upper })) as any);
            lower.setData(dcData.map(v => ({ time: v.time, value: v.lower })) as any);
            overlaySeriesMap.current.set(`${ind.id}_upper`, upper);
            overlaySeriesMap.current.set(`${ind.id}_lower`, lower);
          }
        } else if (ind.id === 'vwap') {
          const vwapData = calculateVWAP(cleanCandles);
          if (vwapData.length > 0) {
            const series = chart.addLineSeries({ color: ind.color, lineWidth: 2, title: 'VWAP' });
            series.setData(vwapData as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'sar') {
          const step = Number(ind.params.step || 0.02);
          const maxStep = Number(ind.params.maxStep || 0.2);
          const sarData = calculateParabolicSAR(cleanCandles, step, maxStep);
          if (sarData.length > 0) {
            const series = chart.addLineSeries({ color: ind.color, lineWidth: 1, lineStyle: LineStyle.Dotted, title: 'SAR' });
            series.setData(sarData as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'pivots' && cleanCandles.length > 0) {
          const lastC = cleanCandles[cleanCandles.length - 1];
          const pivots = calculatePivotPoints(lastC.high, lastC.low, lastC.close);
          mainSeries.createPriceLine({
            price: pivots.r1,
            color: '#EF4444',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `R1: ${currencySym}${pivots.r1}`,
          });
          mainSeries.createPriceLine({
            price: pivots.p,
            color: '#3B82F6',
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `Pivot: ${currencySym}${pivots.p}`,
          });
          mainSeries.createPriceLine({
            price: pivots.s1,
            color: '#10B981',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `S1: ${currencySym}${pivots.s1}`,
          });
        }
        // ⭐ Premium Quant Indicators
        else if (ind.id === 'smc_order_blocks') {
          const obData = calculateOrderBlocks(cleanCandles);
          if (obData.length > 0) {
            const series = chart.addLineSeries({
              color: ind.color,
              lineWidth: 2,
              lineStyle: LineStyle.Solid,
              title: 'Order Block',
            });
            series.setData(obData as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'smc_fvg') {
          const fvgData = calculateFVG(cleanCandles);
          if (fvgData.length > 0) {
            const series = chart.addLineSeries({
              color: ind.color,
              lineWidth: 2,
              lineStyle: LineStyle.Dashed,
              title: 'FVG Imbalance',
            });
            series.setData(fvgData as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'ichimoku') {
          const { tenkan, kijun } = calculateIchimoku(cleanCandles);
          if (tenkan.length > 0) {
            const tSeries = chart.addLineSeries({ color: '#10B981', lineWidth: 2, title: 'Tenkan (9)' });
            const kSeries = chart.addLineSeries({ color: '#EF4444', lineWidth: 2, title: 'Kijun (26)' });
            tSeries.setData(tenkan as any);
            kSeries.setData(kijun as any);
            overlaySeriesMap.current.set(`${ind.id}_tenkan`, tSeries);
            overlaySeriesMap.current.set(`${ind.id}_kijun`, kSeries);
          }
        } else if (ind.id === 'atr_trailing_stop') {
          const trailData = calculateAtrTrailingStop(cleanCandles);
          if (trailData.length > 0) {
            const series = chart.addLineSeries({
              color: ind.color,
              lineWidth: 2,
              lineStyle: LineStyle.Dashed,
              title: 'ATR Trail Stop',
            });
            series.setData(trailData as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        }
      } catch (err) {
        console.error(`Error calculating indicator ${ind.id}:`, err);
      }
    }

    chart.timeScale().fitContent();

    const handleResize = () => {
      if (chartRef.current && container) {
        chartRef.current.applyOptions({
          width: container.clientWidth,
          height: isFullscreen ? window.innerHeight - (activeOscillators.length > 0 ? 320 : 180) : 460,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [cleanCandles, chartType, showVolume, indicators, isDark, isFullscreen, activeOscillators.length, currencySym]);

  // 2. Initialize Separate Subchart Oscillator Panes
  useEffect(() => {
    const container = oscillatorContainerRef.current;
    if (!container || activeOscillators.length === 0) {
      if (oscChartRef.current) {
        oscChartRef.current.remove();
        oscChartRef.current = null;
        oscSeriesMap.current.clear();
      }
      return;
    }

    if (oscChartRef.current) {
      oscChartRef.current.remove();
      oscChartRef.current = null;
      oscSeriesMap.current.clear();
    }

    const oscChart = createChart(container, {
      width: container.clientWidth,
      height: 140,
      layout: {
        background: { color: isDark ? '#070B14' : '#F8FAFC' },
        textColor: isDark ? '#94A3B8' : '#64748B',
      },
      grid: {
        vertLines: { color: isDark ? '#142036' : '#E2E8F0' },
        horzLines: { color: isDark ? '#142036' : '#E2E8F0' },
      },
      rightPriceScale: {
        borderColor: isDark ? '#1E2D4A' : '#E2E8F0',
      },
      timeScale: {
        visible: false,
      },
    });

    oscChartRef.current = oscChart;

    for (const osc of activeOscillators) {
      try {
        if (osc.id === 'rsi') {
          const rsiPeriod = Number(osc.params.period || 14);
          const rsiData = calculateRSI(cleanCandles, rsiPeriod);
          if (rsiData.length > 0) {
            const series = oscChart.addLineSeries({ color: osc.color, lineWidth: 2, title: 'RSI 14' });
            series.setData(rsiData as any);
            series.createPriceLine({ price: 70, color: '#EF4444', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'Overbought (70)' });
            series.createPriceLine({ price: 30, color: '#10B981', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'Oversold (30)' });
            oscSeriesMap.current.set(osc.id, series);
          }
        } else if (osc.id === 'macd') {
          const fast = Number(osc.params.fast || 12);
          const slow = Number(osc.params.slow || 26);
          const signal = Number(osc.params.signal || 9);
          const macdData = calculateMACD(cleanCandles, fast, slow, signal);
          if (macdData.length > 0) {
            const macdSeries = oscChart.addLineSeries({ color: '#2563EB', lineWidth: 2, title: 'MACD' });
            const sigSeries = oscChart.addLineSeries({ color: '#EF4444', lineWidth: 2, title: 'Signal' });
            macdSeries.setData(macdData.map(v => ({ time: v.time, value: v.macd })) as any);
            sigSeries.setData(macdData.map(v => ({ time: v.time, value: v.signal })) as any);
          }
        } else if (osc.id === 'stoch') {
          const period = Number(osc.params.period || 14);
          const smoothK = Number(osc.params.smoothK || 3);
          const smoothD = Number(osc.params.smoothD || 3);
          const stochData = calculateStochastic(cleanCandles, period, smoothK, smoothD);
          if (stochData.length > 0) {
            const kSeries = oscChart.addLineSeries({ color: '#0EA5E9', lineWidth: 2, title: '%K' });
            const dSeries = oscChart.addLineSeries({ color: '#F59E0B', lineWidth: 2, title: '%D' });
            kSeries.setData(stochData.map(v => ({ time: v.time, value: v.k })) as any);
            dSeries.setData(stochData.map(v => ({ time: v.time, value: v.d })) as any);
          }
        } else if (osc.id === 'cci') {
          const period = Number(osc.params.period || 20);
          const cciData = calculateCCI(cleanCandles, period);
          if (cciData.length > 0) {
            const series = oscChart.addLineSeries({ color: osc.color, lineWidth: 2, title: 'CCI 20' });
            series.setData(cciData as any);
            series.createPriceLine({ price: 100, color: '#EF4444', lineWidth: 1, lineStyle: LineStyle.Dashed });
            series.createPriceLine({ price: -100, color: '#10B981', lineWidth: 1, lineStyle: LineStyle.Dashed });
          }
        } else if (osc.id === 'adx') {
          const period = Number(osc.params.period || 14);
          const adxData = calculateADX(cleanCandles, period);
          if (adxData.length > 0) {
            const series = oscChart.addLineSeries({ color: osc.color, lineWidth: 2, title: 'ADX 14' });
            series.setData(adxData.map(v => ({ time: v.time, value: v.adx })) as any);
            series.createPriceLine({ price: 25, color: '#3B82F6', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'Trend Threshold (25)' });
          }
        } else if (osc.id === 'cmf') {
          const cmfData = calculateCMF(cleanCandles);
          if (cmfData.length > 0) {
            const series = oscChart.addLineSeries({ color: osc.color, lineWidth: 2, title: 'CMF (20)' });
            series.setData(cmfData as any);
            series.createPriceLine({ price: 0, color: '#64748B', lineWidth: 1, lineStyle: LineStyle.Dashed });
          }
        } else if (osc.id === 'aroon') {
          const aroonData = calculateAroon(cleanCandles);
          if (aroonData.length > 0) {
            const series = oscChart.addLineSeries({ color: osc.color, lineWidth: 2, title: 'Aroon Osc' });
            series.setData(aroonData as any);
            series.createPriceLine({ price: 0, color: '#64748B', lineWidth: 1, lineStyle: LineStyle.Dashed });
          }
        } else if (osc.id === 'tsi') {
          const tsiData = calculateTSI(cleanCandles);
          if (tsiData.length > 0) {
            const series = oscChart.addLineSeries({ color: osc.color, lineWidth: 2, title: 'TSI' });
            series.setData(tsiData as any);
            series.createPriceLine({ price: 0, color: '#64748B', lineWidth: 1, lineStyle: LineStyle.Dashed });
          }
        }
      } catch (err) {
        console.error(`Error in oscillator ${osc.id}:`, err);
      }
    }

    oscChart.timeScale().fitContent();

    const handleResize = () => {
      if (oscChartRef.current && container) {
        oscChartRef.current.applyOptions({ width: container.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [cleanCandles, activeOscillators, isDark]);

  // 3. Non-Resetting Incremental Live Bar Updates
  useEffect(() => {
    const liveTick = ticks[symbol];
    if (!liveTick || !mainSeriesRef.current || cleanCandles.length === 0) return;

    const lastCandle = cleanCandles[cleanCandles.length - 1];
    const newPrice = liveTick.price;
    if (newPrice <= 0) return;

    const updatedBar = {
      time: lastCandle.time,
      open: lastCandle.open,
      high: Math.max(lastCandle.high, newPrice),
      low: Math.min(lastCandle.low, newPrice),
      close: newPrice,
      volume: liveTick.volume || lastCandle.volume || 0,
    };

    try {
      if (chartType === 'candlestick') {
        mainSeriesRef.current.update(updatedBar as any);
      } else {
        mainSeriesRef.current.update({ time: lastCandle.time, value: newPrice } as any);
      }

      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.update({
          time: lastCandle.time,
          value: updatedBar.volume,
          color: updatedBar.close >= updatedBar.open ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
        } as any);
      }
    } catch {
      // Ignore transient bar update collision
    }
  }, [ticks, symbol, chartType, cleanCandles]);

  // Zoom / Pan actions
  const handleZoomIn = () => {
    if (!chartRef.current) return;
    const range = chartRef.current.timeScale().getVisibleLogicalRange();
    if (range) {
      const span = range.to - range.from;
      const shrink = Math.max(2, span * 0.2);
      chartRef.current.timeScale().setVisibleLogicalRange({
        from: range.from + shrink,
        to: range.to - shrink,
      });
    }
  };

  const handleZoomOut = () => {
    if (!chartRef.current) return;
    const range = chartRef.current.timeScale().getVisibleLogicalRange();
    if (range) {
      const span = range.to - range.from;
      const expand = Math.max(2, span * 0.2);
      chartRef.current.timeScale().setVisibleLogicalRange({
        from: range.from - expand,
        to: range.to + expand,
      });
    }
  };

  const handleResetZoom = () => {
    if (!chartRef.current) return;
    chartRef.current.timeScale().fitContent();
    if (oscChartRef.current) oscChartRef.current.timeScale().fitContent();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Toggle Indicator
  const handleToggleIndicator = (id: string) => {
    setIndicators(prev => prev.map(ind => ind.id === id ? { ...ind, enabled: !ind.enabled } : ind));
  };

  const handleUpdateParams = (id: string, newParams: Record<string, any>) => {
    setIndicators(prev => prev.map(ind => ind.id === id ? { ...ind, params: { ...ind.params, ...newParams } } : ind));
  };

  const handleUpdateColor = (id: string, color: string) => {
    setIndicators(prev => prev.map(ind => ind.id === id ? { ...ind, color } : ind));
  };

  const handleResetDefaults = () => {
    setIndicators(DEFAULT_INDICATORS);
  };

  const activeIndicatorCount = indicators.filter(i => i.enabled).length;

  return (
    <div className={`bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm transition-all ${
      isFullscreen ? 'fixed inset-0 z-50 rounded-none p-4' : ''
    }`}>
      
      {/* 1. Terminal Top Control Bar: Strictly Single-Choice Period Selection */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#070B14]/80 text-xs">
        
        {/* Left: Unified Single-Choice Timeframe Period Buttons (No dual selector!) */}
        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg">
          {UNIFIED_TIMEFRAMES.map(item => {
            const isActive = activeInterval === item.interval;
            return (
              <button
                key={item.label}
                title={item.title}
                onClick={() => onTimeframeChange?.(item.range, item.interval)}
                className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/40 dark:hover:bg-slate-700/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right: Chart Tools, Indicators & Zoom Controls */}
        <div className="flex items-center gap-2">
          
          {/* Indicator Manager Modal Trigger */}
          <button
            onClick={() => setIndicatorModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium hover:border-blue-500 transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>Indicators</span>
            <span className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-[10px] flex items-center justify-center font-bold">
              {activeIndicatorCount}
            </span>
          </button>

          {/* Candlestick vs Line Toggle */}
          <div className="flex items-center bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg">
            <button
              onClick={() => setChartType('candlestick')}
              title="Candlestick Chart"
              className={`p-1 rounded transition-colors cursor-pointer ${
                chartType === 'candlestick'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              title="Line Chart"
              className={`p-1 rounded transition-colors cursor-pointer ${
                chartType === 'line'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Volume Bars Toggle */}
          <button
            onClick={() => setShowVolume(!showVolume)}
            title="Toggle Volume Bars"
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold border transition-colors cursor-pointer ${
              showVolume
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-cyan-300'
                : 'border-slate-200 dark:border-slate-700 text-slate-500'
            }`}
          >
            VOL
          </button>

          {/* Zoom & Screen Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Fit to Data"
              className="p-1.5 bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-1.5 bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shadow-xs"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive OHLC Inspection Banner with Precise Date & Time */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-[#0D1527]/50 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900 dark:text-white font-sans text-sm">
            {symbol}
          </span>
          {hoverData ? (
            <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300">
              {hoverData.time && (
                <span className="text-[11px] font-sans px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-cyan-300 border border-blue-200/50 dark:border-blue-800/40">
                  📅 {formatCandleTime(hoverData.time, activeInterval)}
                </span>
              )}
              <span>O: <strong className="text-slate-900 dark:text-white">{currencySym}{hoverData.open?.toFixed(2) ?? '-'}</strong></span>
              <span>H: <strong className="text-emerald-600 dark:text-emerald-400">{currencySym}{hoverData.high?.toFixed(2) ?? '-'}</strong></span>
              <span>L: <strong className="text-rose-600 dark:text-rose-400">{currencySym}{hoverData.low?.toFixed(2) ?? '-'}</strong></span>
              <span>C: <strong className="text-slate-900 dark:text-white">{currencySym}{hoverData.close?.toFixed(2) ?? '-'}</strong></span>
              {hoverData.change !== undefined && (
                <span className={hoverData.change >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {hoverData.change >= 0 ? '+' : ''}{currencySym}{hoverData.change} ({hoverData.changePercent}%)
                </span>
              )}
            </div>
          ) : (
            <div className="text-slate-400 font-sans text-xs flex items-center gap-2">
              <span>Live LTP: <strong className="text-slate-900 dark:text-white font-mono">{currencySym}{currentPrice.toFixed(2)}</strong></span>
              <span className="text-[11px] text-slate-400">(Hover on candle to inspect historical timestamp & OHLC)</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-sans hidden sm:flex items-center gap-2">
          <span>Candles: <strong>{cleanCandles.length}</strong></span>
          <span>•</span>
          <span>Period: <strong className="text-blue-600 dark:text-cyan-400">{activeInterval}</strong></span>
        </div>
      </div>

      {/* 3. Main Chart Canvas Container */}
      <div className="relative">
        <div ref={chartContainerRef} className="w-full" />
      </div>

      {/* 4. Subchart Oscillator Panes (RSI, MACD, Stoch, CCI, ADX, CMF, Aroon, TSI) */}
      {activeOscillators.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800">
          <div className="px-4 py-1.5 bg-slate-50 dark:bg-[#070B14] border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold flex items-center justify-between text-slate-500">
            <span>Subchart Oscillators ({activeOscillators.map(o => o.shortName).join(' • ')})</span>
            <span className="text-[10px] text-slate-400">Synchronized Time Axis</span>
          </div>
          <div ref={oscillatorContainerRef} className="w-full" />
        </div>
      )}

      {/* Indicator Configuration Modal */}
      <IndicatorModal
        isOpen={indicatorModalOpen}
        onClose={() => setIndicatorModalOpen(false)}
        indicators={indicators}
        onToggleIndicator={handleToggleIndicator}
        onUpdateParams={handleUpdateParams}
        onUpdateColor={handleUpdateColor}
        onResetDefaults={handleResetDefaults}
      />
    </div>
  );
};
