// DHRU.AI - Professional Trading Terminal Chart Engine
// Built using TradingView Lightweight Charts (Apache 2.0)
// Supports Non-Resetting Live Bar Updates, Granular Intraday + Multi-Year Historical Data,
// 23+ Mathematical Indicators (Overlays & Separate Oscillators), Zoom/Pan, and Crosshair OHLC.

import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
  calculateADX
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
  Calendar
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

const SUPPORTED_INTERVALS = [
  { label: '1m', interval: '1m', defaultRange: '1d' },
  { label: '5m', interval: '5m', defaultRange: '5d' },
  { label: '15m', interval: '15m', defaultRange: '1mo' },
  { label: '30m', interval: '30m', defaultRange: '1mo' },
  { label: '1h', interval: '60m', defaultRange: '3mo' },
  { label: '4h', interval: '4h', defaultRange: '6mo' },
  { label: '1D', interval: '1d', defaultRange: '1y' },
  { label: '1W', interval: '1wk', defaultRange: '5y' },
  { label: '1M', interval: '1mo', defaultRange: 'max' },
];

const HISTORICAL_RANGES = [
  { label: '1D', range: '1d' },
  { label: '5D', range: '5d' },
  { label: '1M', range: '1mo' },
  { label: '3M', range: '3mo' },
  { label: '6M', range: '6mo' },
  { label: '1Y', range: '1y' },
  { label: '3Y', range: '3y' },
  { label: '5Y', range: '5y' },
  { label: 'MAX', range: 'max' },
];

export const TradingViewChart: React.FC<ChartProps> = ({
  candles,
  volumeData,
  symbol,
  currentPrice,
  onTimeframeChange,
  activeTimeframe = '1y',
  activeInterval = '1d'
}) => {
  const { theme } = useTheme();
  const { ticks } = useMarketStream();
  const isDark = theme === 'dark';

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
    const sorted = [...candles]
      .filter(c => c && c.time != null && !isNaN(c.close) && c.open != null)
      .sort((a, b) => {
        const ta = typeof a.time === 'number' ? a.time : new Date(a.time).getTime() / 1000;
        const tb = typeof b.time === 'number' ? b.time : new Date(b.time).getTime() / 1000;
        return ta - tb;
      });

    const unique: Candle[] = [];
    const seen = new Set();
    for (const c of sorted) {
      if (!seen.has(c.time)) {
        seen.add(c.time);
        unique.push(c);
      }
    }
    return unique;
  }, [candles]);

  // Active oscillators count
  const activeOscillators = useMemo(() => {
    return indicators.filter(i => i.enabled && i.category === 'oscillator');
  }, [indicators]);

  // 1. Initialize Main Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      overlaySeriesMap.current.clear();
    }

    const container = chartContainerRef.current;
    const width = container.clientWidth;
    const height = isFullscreen ? window.innerHeight - 180 : 460;

    const chart = createChart(container, {
      width,
      height,
      layout: {
        background: { color: isDark ? '#0D1527' : '#FFFFFF' },
        textColor: isDark ? '#94A3B8' : '#475569',
        fontSize: 12,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(30, 45, 74, 0.4)' : '#F1F5F9' },
        horzLines: { color: isDark ? 'rgba(30, 45, 74, 0.4)' : '#F1F5F9' },
      },
      crosshair: {
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

    // Subscribe to crosshair move for OHLC inspection
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
            const series = chart.addLineSeries({
              color: ind.color,
              lineWidth: (ind.lineWidth || 1.5) as any,
              title: ind.shortName,
            });
            series.setData(data as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'vwma20') {
          const period = Number(ind.params.period || 20);
          const data = calculateVWMA(cleanCandles, period);
          if (data.length > 0) {
            const series = chart.addLineSeries({
              color: ind.color,
              lineWidth: (ind.lineWidth || 1.5) as any,
              title: ind.shortName,
            });
            series.setData(data as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'hma14') {
          const period = Number(ind.params.period || 14);
          const data = calculateHMA(cleanCandles, period);
          if (data.length > 0) {
            const series = chart.addLineSeries({
              color: ind.color,
              lineWidth: (ind.lineWidth || 2) as any,
              title: ind.shortName,
            });
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
            series.setData(stData.map(v => ({ time: v.time, value: v.value })) as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'bollinger') {
          const period = Number(ind.params.period || 20);
          const mult = Number(ind.params.multiplier || 2);
          const bbData = calculateBollingerBands(cleanCandles, period, mult);
          if (bbData.length > 0) {
            const upper = chart.addLineSeries({ color: 'rgba(37, 99, 235, 0.65)', lineWidth: 1, lineStyle: LineStyle.Dotted });
            const mid = chart.addLineSeries({ color: ind.color, lineWidth: 1 });
            const lower = chart.addLineSeries({ color: 'rgba(37, 99, 235, 0.65)', lineWidth: 1, lineStyle: LineStyle.Dotted });
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
            const mid = chart.addLineSeries({ color: ind.color, lineWidth: 1.5 });
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
            const series = chart.addLineSeries({
              color: ind.color,
              lineWidth: 2,
              title: 'VWAP',
            });
            series.setData(vwapData as any);
            overlaySeriesMap.current.set(ind.id, series);
          }
        } else if (ind.id === 'sar') {
          const step = Number(ind.params.step || 0.02);
          const maxStep = Number(ind.params.maxStep || 0.2);
          const sarData = calculateParabolicSAR(cleanCandles, step, maxStep);
          if (sarData.length > 0) {
            const series = chart.addLineSeries({
              color: ind.color,
              lineWidth: 1,
              lineStyle: LineStyle.Dotted,
              title: 'SAR',
            });
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
            title: `R1: ₹${pivots.r1}`,
          });
          mainSeries.createPriceLine({
            price: pivots.p,
            color: '#3B82F6',
            lineWidth: 1,
            lineStyle: LineStyle.Solid,
            axisLabelVisible: true,
            title: `Pivot: ₹${pivots.p}`,
          });
          mainSeries.createPriceLine({
            price: pivots.s1,
            color: '#10B981',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            axisLabelVisible: true,
            title: `S1: ₹${pivots.s1}`,
          });
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
          height: isFullscreen ? window.innerHeight - 180 : 460,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [cleanCandles, chartType, showVolume, isDark, isFullscreen, indicators]);

  // 2. Initialize Oscillator Subchart (RSI, MACD, Stochastic, etc.)
  useEffect(() => {
    if (!oscillatorContainerRef.current) return;

    if (oscChartRef.current) {
      oscChartRef.current.remove();
      oscChartRef.current = null;
      oscSeriesMap.current.clear();
    }

    if (activeOscillators.length === 0 || cleanCandles.length === 0) return;

    const container = oscillatorContainerRef.current;
    const oscChart = createChart(container, {
      width: container.clientWidth,
      height: 150,
      layout: {
        background: { color: isDark ? '#0A0F1D' : '#F8FAFC' },
        textColor: isDark ? '#94A3B8' : '#64748B',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: isDark ? 'rgba(30, 45, 74, 0.25)' : '#F1F5F9' },
        horzLines: { color: isDark ? 'rgba(30, 45, 74, 0.25)' : '#F1F5F9' },
      },
      timeScale: {
        visible: false,
      },
      rightPriceScale: {
        borderColor: isDark ? '#1E2D4A' : '#E2E8F0',
      },
    });

    oscChartRef.current = oscChart;

    for (const osc of activeOscillators) {
      try {
        if (osc.id === 'rsi') {
          const rsiData = calculateRSI(cleanCandles, Number(osc.params.period || 14));
          if (rsiData.length > 0) {
            const series = oscChart.addLineSeries({
              color: osc.color,
              lineWidth: 1.5,
              title: osc.shortName,
            });
            series.setData(rsiData as any);
            // Reference lines 70 & 30
            series.createPriceLine({ price: 70, color: '#EF4444', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: 'OB 70' });
            series.createPriceLine({ price: 30, color: '#10B981', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: 'OS 30' });
          }
        } else if (osc.id === 'macd') {
          const macdData = calculateMACD(cleanCandles);
          if (macdData.length > 0) {
            const macdLine = oscChart.addLineSeries({ color: osc.color, lineWidth: 1.5, title: 'MACD' });
            const signalLine = oscChart.addLineSeries({ color: osc.secondaryColor || '#EF4444', lineWidth: 1.5, title: 'Signal' });
            const histSeries = oscChart.addHistogramSeries({ color: '#10B981', title: 'Histogram' });

            macdLine.setData(macdData.map(v => ({ time: v.time, value: v.macd })) as any);
            signalLine.setData(macdData.map(v => ({ time: v.time, value: v.signal })) as any);
            histSeries.setData(macdData.map(v => ({
              time: v.time,
              value: v.histogram,
              color: v.histogram >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'
            })) as any);
          }
        } else if (osc.id === 'stoch') {
          const stochData = calculateStochastic(cleanCandles);
          if (stochData.length > 0) {
            const kLine = oscChart.addLineSeries({ color: osc.color, lineWidth: 1.5, title: '%K' });
            const dLine = oscChart.addLineSeries({ color: osc.secondaryColor || '#F59E0B', lineWidth: 1.5, title: '%D' });
            kLine.setData(stochData.map(v => ({ time: v.time, value: v.k })) as any);
            dLine.setData(stochData.map(v => ({ time: v.time, value: v.d })) as any);
            kLine.createPriceLine({ price: 80, color: '#EF4444', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: '80' });
            kLine.createPriceLine({ price: 20, color: '#10B981', lineWidth: 1, lineStyle: LineStyle.Dotted, axisLabelVisible: true, title: '20' });
          }
        } else if (osc.id === 'cci') {
          const cciData = calculateCCI(cleanCandles);
          if (cciData.length > 0) {
            const series = oscChart.addLineSeries({ color: osc.color, lineWidth: 1.5, title: 'CCI 20' });
            series.setData(cciData as any);
            series.createPriceLine({ price: 100, color: '#EF4444', lineWidth: 1, lineStyle: LineStyle.Dotted, title: '+100' });
            series.createPriceLine({ price: -100, color: '#10B981', lineWidth: 1, lineStyle: LineStyle.Dotted, title: '-100' });
          }
        } else if (osc.id === 'adx') {
          const adxData = calculateADX(cleanCandles);
          if (adxData.length > 0) {
            const series = oscChart.addLineSeries({ color: osc.color, lineWidth: 1.5, title: 'ADX 14' });
            series.setData(adxData.map(v => ({ time: v.time, value: v.adx })) as any);
            series.createPriceLine({ price: 25, color: '#3B82F6', lineWidth: 1, lineStyle: LineStyle.Dashed, title: 'Trend Threshold (25)' });
          }
        } else if (osc.id === 'atr') {
          const atrData = calculateATR(cleanCandles);
          if (atrData.length > 0) {
            const series = oscChart.addLineSeries({ color: osc.color, lineWidth: 1.5, title: 'ATR 14' });
            series.setData(atrData as any);
          }
        } else if (osc.id === 'obv') {
          const obvData = calculateOBV(cleanCandles);
          if (obvData.length > 0) {
            const series = oscChart.addLineSeries({ color: osc.color, lineWidth: 1.5, title: 'OBV' });
            series.setData(obvData as any);
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

  // 3. Non-Resetting Incremental Live Bar Updates!
  // Updates current live bar without destroying or resetting chart state
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
        from: range.from + shrink / 2,
        to: range.to - shrink / 2,
      });
    }
  };

  const handleZoomOut = () => {
    if (!chartRef.current) return;
    const range = chartRef.current.timeScale().getVisibleLogicalRange();
    if (range) {
      const span = range.to - range.from;
      const expand = Math.max(2, span * 0.25);
      chartRef.current.timeScale().setVisibleLogicalRange({
        from: range.from - expand / 2,
        to: range.to + expand / 2,
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
      
      {/* 1. Terminal Top Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#070B14]/80 text-xs">
        
        {/* Left: Timeframe Granularity & Historical Ranges */}
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex items-center gap-0.5 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg mr-2">
            {SUPPORTED_INTERVALS.map(item => (
              <button
                key={item.label}
                onClick={() => onTimeframeChange?.(item.defaultRange, item.interval)}
                className={`px-2.5 py-1 rounded font-semibold text-[11px] transition-all cursor-pointer ${
                  activeInterval === item.interval
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="hidden sm:flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <span>Range:</span>
            {HISTORICAL_RANGES.map(item => (
              <button
                key={item.label}
                onClick={() => onTimeframeChange?.(item.range, activeInterval)}
                className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                  activeTimeframe === item.range
                    ? 'text-blue-600 dark:text-cyan-400 font-bold underline'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Chart Tools, Indicators & Zoom Controls */}
        <div className="flex items-center gap-2">
          
          {/* Indicator Manager Modal Trigger */}
          <button
            onClick={() => setIndicatorModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-medium hover:border-blue-500 transition-colors cursor-pointer shadow-xs"
          >
            <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
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
              className={`p-1 rounded cursor-pointer ${chartType === 'candlestick' ? 'bg-white dark:bg-[#0D1527] text-blue-600 shadow-xs' : 'text-slate-500'}`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              title="Line Chart"
              className={`p-1 rounded cursor-pointer ${chartType === 'line' ? 'bg-white dark:bg-[#0D1527] text-blue-600 shadow-xs' : 'text-slate-500'}`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Zoom In, Out, Fit */}
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

      {/* 2. Interactive OHLC Inspection Banner */}
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/60 bg-white/50 dark:bg-[#0D1527]/50 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="font-bold text-slate-900 dark:text-white font-sans text-sm">
            {symbol}
          </span>
          {hoverData ? (
            <div className="flex flex-wrap items-center gap-3 text-slate-600 dark:text-slate-300">
              <span>O: <strong className="text-slate-900 dark:text-white">₹{hoverData.open?.toFixed(2) ?? '-'}</strong></span>
              <span>H: <strong className="text-emerald-600 dark:text-emerald-400">₹{hoverData.high?.toFixed(2) ?? '-'}</strong></span>
              <span>L: <strong className="text-rose-600 dark:text-rose-400">₹{hoverData.low?.toFixed(2) ?? '-'}</strong></span>
              <span>C: <strong className="text-slate-900 dark:text-white">₹{hoverData.close?.toFixed(2) ?? '-'}</strong></span>
              {hoverData.change !== undefined && (
                <span className={hoverData.change >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {hoverData.change >= 0 ? '+' : ''}{hoverData.change} ({hoverData.changePercent}%)
                </span>
              )}
            </div>
          ) : (
            <div className="text-slate-400 font-sans text-xs flex items-center gap-2">
              <span>Live LTP: <strong className="text-slate-900 dark:text-white font-mono">₹{currentPrice.toFixed(2)}</strong></span>
              <span className="text-[11px] text-slate-400">(Hover on chart to inspect historical OHLC)</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-sans hidden sm:flex items-center gap-2">
          <span>Candles: <strong>{cleanCandles.length}</strong></span>
          <span>•</span>
          <span>Feed: <strong>NSE Real-Time</strong></span>
        </div>
      </div>

      {/* 3. Main Chart Canvas */}
      <div ref={chartContainerRef} className="w-full relative min-h-[460px]" />

      {/* 4. Subchart Oscillator Panes (RSI / MACD / Stoch) */}
      {activeOscillators.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-800">
          <div className="px-4 py-1.5 bg-slate-50 dark:bg-[#070B14] border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-400 flex items-center justify-between">
            <span>Subchart Oscillators ({activeOscillators.map(o => o.shortName).join(', ')})</span>
          </div>
          <div ref={oscillatorContainerRef} className="w-full min-h-[150px]" />
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
