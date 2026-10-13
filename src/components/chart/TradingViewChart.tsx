// DHRU.AI - Interactive Financial Charting System
// Built using TradingView Lightweight Charts (Free, Open Source Apache 2.0)
// Supports Candlesticks, Line, Volume, Multi-Timeframes, Overlays (SMA, EMA, Bollinger, VWAP, Pivots)
// Includes explicit Zoom In, Zoom Out, and Fit Content controls.

import React, { useEffect, useRef, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, LineStyle } from 'lightweight-charts';
import { Candle, VolumeBar, TechnicalIndicators } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { Activity, BarChart2, Layers, TrendingUp, ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';

interface ChartProps {
  candles: Candle[];
  volumeData: VolumeBar[];
  technicals?: TechnicalIndicators | null;
  symbol: string;
  currentPrice: number;
  onTimeframeChange?: (range: string, interval: string) => void;
  activeTimeframe?: string;
}

export const TradingViewChart: React.FC<ChartProps> = ({
  candles,
  volumeData,
  technicals,
  symbol,
  currentPrice,
  onTimeframeChange,
  activeTimeframe = '1mo'
}) => {
  const { theme } = useTheme();
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const [chartType, setChartType] = useState<'candlestick' | 'line'>('candlestick');
  const [showVolume, setShowVolume] = useState(true);
  const [showSma20, setShowSma20] = useState(true);
  const [showSma50, setShowSma50] = useState(false);
  const [showSma200, setShowSma200] = useState(true);
  const [showEma9, setShowEma9] = useState(false);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showPivots, setShowPivots] = useState(true);
  const [activeSubchart, setActiveSubchart] = useState<'none' | 'rsi' | 'macd'>('rsi');

  const [hoverData, setHoverData] = useState<{
    time?: string | number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    volume?: number;
  } | null>(null);

  // Zoom control handlers
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
  };

  // Initialize and update TradingView Chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up prior chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const isDark = theme === 'dark';
    const container = chartContainerRef.current;
    const width = container.clientWidth;
    const height = 480;

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
          top: 0.1,
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

    // Format & sort candle timestamps strictly ascending
    const sortedCandles = [...candles]
      .filter(c => c && c.time != null && !isNaN(c.close))
      .sort((a, b) => {
        const ta = typeof a.time === 'number' ? a.time : new Date(a.time).getTime() / 1000;
        const tb = typeof b.time === 'number' ? b.time : new Date(b.time).getTime() / 1000;
        return ta - tb;
      });

    // Deduplicate by timestamp
    const uniqueCandles: Candle[] = [];
    const seenTimes = new Set();
    for (const c of sortedCandles) {
      if (!seenTimes.has(c.time)) {
        seenTimes.add(c.time);
        uniqueCandles.push(c);
      }
    }

    if (uniqueCandles.length === 0) return;

    // 1. Add Main Series (Candlestick or Line)
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
      mainSeries.setData(uniqueCandles as any);
    } else {
      mainSeries = chart.addLineSeries({
        color: '#2563EB',
        lineWidth: 2,
        priceLineColor: '#2563EB',
      });
      mainSeries.setData(
        uniqueCandles.map(c => ({ time: c.time, value: c.close })) as any
      );
    }

    // 2. Add Volume Series Histogram
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: '#26a69a',
        priceFormat: { type: 'volume' },
        priceScaleId: '', // Overlay on same scale
      });
      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.82,
          bottom: 0,
        },
      });

      const sortedVol = uniqueCandles.map(c => ({
        time: c.time,
        value: c.volume || 0,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)',
      }));
      volumeSeries.setData(sortedVol as any);
    }

    // 3. Technical Indicator Overlays
    const closes = uniqueCandles.map(c => c.close);

    // SMA 20 Overlay
    if (showSma20 && uniqueCandles.length >= 20) {
      const sma20Data: any[] = [];
      for (let i = 19; i < uniqueCandles.length; i++) {
        const sum = closes.slice(i - 19, i + 1).reduce((a, b) => a + b, 0);
        sma20Data.push({ time: uniqueCandles[i].time, value: Number((sum / 20).toFixed(2)) });
      }
      const sma20Series = chart.addLineSeries({
        color: '#F59E0B',
        lineWidth: 1.5,
        title: 'SMA 20',
      });
      sma20Series.setData(sma20Data);
    }

    // SMA 50 Overlay
    if (showSma50 && uniqueCandles.length >= 50) {
      const sma50Data: any[] = [];
      for (let i = 49; i < uniqueCandles.length; i++) {
        const sum = closes.slice(i - 49, i + 1).reduce((a, b) => a + b, 0);
        sma50Data.push({ time: uniqueCandles[i].time, value: Number((sum / 50).toFixed(2)) });
      }
      const sma50Series = chart.addLineSeries({
        color: '#3B82F6',
        lineWidth: 1.5,
        title: 'SMA 50',
      });
      sma50Series.setData(sma50Data);
    }

    // SMA 200 Overlay
    if (showSma200 && uniqueCandles.length >= 200) {
      const sma200Data: any[] = [];
      for (let i = 199; i < uniqueCandles.length; i++) {
        const sum = closes.slice(i - 199, i + 1).reduce((a, b) => a + b, 0);
        sma200Data.push({ time: uniqueCandles[i].time, value: Number((sum / 200).toFixed(2)) });
      }
      const sma200Series = chart.addLineSeries({
        color: '#8B5CF6',
        lineWidth: 2,
        title: 'SMA 200',
      });
      sma200Series.setData(sma200Data);
    }

    // EMA 9 Overlay
    if (showEma9 && uniqueCandles.length >= 9) {
      const ema9Data: any[] = [];
      const k = 2 / 10;
      let ema = closes.slice(0, 9).reduce((a, b) => a + b, 0) / 9;
      for (let i = 9; i < uniqueCandles.length; i++) {
        ema = closes[i] * k + ema * (1 - k);
        ema9Data.push({ time: uniqueCandles[i].time, value: Number(ema.toFixed(2)) });
      }
      const ema9Series = chart.addLineSeries({
        color: '#06B6D4',
        lineWidth: 1.5,
        title: 'EMA 9',
      });
      ema9Series.setData(ema9Data);
    }

    // Bollinger Bands
    if (showBollinger && uniqueCandles.length >= 20) {
      const upperData: any[] = [];
      const lowerData: any[] = [];
      for (let i = 19; i < uniqueCandles.length; i++) {
        const slice = closes.slice(i - 19, i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / 20;
        const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / 20;
        const sd = Math.sqrt(variance);
        upperData.push({ time: uniqueCandles[i].time, value: Number((mean + 2 * sd).toFixed(2)) });
        lowerData.push({ time: uniqueCandles[i].time, value: Number((mean - 2 * sd).toFixed(2)) });
      }
      const upperSeries = chart.addLineSeries({ color: 'rgba(37, 99, 235, 0.7)', lineWidth: 1, lineStyle: LineStyle.Dotted });
      const lowerSeries = chart.addLineSeries({ color: 'rgba(37, 99, 235, 0.7)', lineWidth: 1, lineStyle: LineStyle.Dotted });
      upperSeries.setData(upperData);
      lowerSeries.setData(lowerData);
    }

    // Support and Resistance Price Lines
    if (showPivots && technicals?.pivots) {
      const p = technicals.pivots;
      mainSeries.createPriceLine({
        price: p.r1,
        color: '#EF4444',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `R1: ₹${p.r1}`,
      });
      mainSeries.createPriceLine({
        price: p.s1,
        color: '#10B981',
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        title: `S1: ₹${p.s1}`,
      });
      mainSeries.createPriceLine({
        price: p.pivot,
        color: '#F59E0B',
        lineWidth: 1,
        lineStyle: LineStyle.Dotted,
        axisLabelVisible: true,
        title: `PP: ₹${p.pivot}`,
      });
    }

    // Crosshair Hover Handler
    chart.subscribeCrosshairMove(param => {
      if (!param || !param.time || !param.seriesData) {
        const last = uniqueCandles[uniqueCandles.length - 1];
        setHoverData(last ? {
          time: last.time,
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
          volume: last.volume
        } : null);
        return;
      }
      const candleData = param.seriesData.get(mainSeries) as any;
      if (candleData) {
        setHoverData({
          time: param.time,
          open: candleData.open ?? candleData.value,
          high: candleData.high ?? candleData.value,
          low: candleData.low ?? candleData.value,
          close: candleData.close ?? candleData.value,
          volume: uniqueCandles.find(c => c.time === param.time)?.volume
        });
      }
    });

    // Auto-fit content
    chart.timeScale().fitContent();

    // Auto-resize on window resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [candles, chartType, showVolume, showSma20, showSma50, showSma200, showEma9, showBollinger, showPivots, theme]);

  const timeframes = [
    { label: '1D', range: '1d', interval: '5m' },
    { label: '5D', range: '5d', interval: '15m' },
    { label: '1M', range: '1mo', interval: '1d' },
    { label: '3M', range: '3mo', interval: '1d' },
    { label: '6M', range: '6mo', interval: '1d' },
    { label: '1Y', range: '1y', interval: '1d' },
    { label: '5Y', range: '5y', interval: '1wk' },
  ];

  return (
    <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-2xl p-4 shadow-card flex flex-col gap-3">
      {/* Chart Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1A2744]">
        
        {/* Left: Timeframe Selectors */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#070B14] p-1 rounded-xl border border-slate-200 dark:border-[#1A2744]">
          {timeframes.map(tf => (
            <button
              key={tf.label}
              onClick={() => onTimeframeChange?.(tf.range, tf.interval)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTimeframe === tf.range
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Center: Chart Type (Candle vs Line) + Zoom Buttons */}
        <div className="flex items-center gap-2">
          {/* Candle / Line toggle */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#070B14] p-1 rounded-xl border border-slate-200 dark:border-[#1A2744]">
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                chartType === 'candlestick'
                  ? 'bg-white dark:bg-blue-600/30 text-blue-600 dark:text-blue-400 font-semibold shadow-sm border border-slate-200 dark:border-blue-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Candles
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                chartType === 'line'
                  ? 'bg-white dark:bg-blue-600/30 text-blue-600 dark:text-blue-400 font-semibold shadow-sm border border-slate-200 dark:border-blue-500/40'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Line
            </button>
          </div>

          {/* Interactive Zoom In / Zoom Out / Reset controls */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#070B14] p-1 rounded-xl border border-slate-200 dark:border-[#1A2744]">
            <button
              onClick={handleZoomIn}
              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Reset Zoom / Fit Content"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Technical Overlays Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowSma20(!showSma20)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
              showSma20
                ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-500/15 dark:border-amber-500/40 dark:text-amber-400 font-semibold'
                : 'border-slate-200 dark:border-[#1A2744] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Simple Moving Average 20"
          >
            SMA 20
          </button>
          <button
            onClick={() => setShowSma50(!showSma50)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
              showSma50
                ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-500/15 dark:border-blue-500/40 dark:text-blue-400 font-semibold'
                : 'border-slate-200 dark:border-[#1A2744] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Simple Moving Average 50"
          >
            SMA 50
          </button>
          <button
            onClick={() => setShowSma200(!showSma200)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
              showSma200
                ? 'bg-purple-50 border-purple-300 text-purple-700 dark:bg-purple-500/15 dark:border-purple-500/40 dark:text-purple-400 font-semibold'
                : 'border-slate-200 dark:border-[#1A2744] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Simple Moving Average 200 (Long-Term Bull/Bear Floor)"
          >
            SMA 200
          </button>
          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
              showBollinger
                ? 'bg-sky-50 border-sky-300 text-sky-700 dark:bg-cyan-500/15 dark:border-cyan-500/40 dark:text-cyan-400 font-semibold'
                : 'border-slate-200 dark:border-[#1A2744] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Bollinger Bands (20, 2)"
          >
            Bollinger
          </button>
          <button
            onClick={() => setShowPivots(!showPivots)}
            className={`px-2.5 py-1 text-xs font-mono rounded-lg border transition-all cursor-pointer ${
              showPivots
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-500/15 dark:border-emerald-500/40 dark:text-emerald-400 font-semibold'
                : 'border-slate-200 dark:border-[#1A2744] text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title="Support and Resistance Pivot Lines"
          >
            Pivots (S/R)
          </button>
        </div>
      </div>

      {/* Hover OHLCV Status Bar */}
      {hoverData && (
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono py-1.5 px-3 bg-slate-50 dark:bg-[#070B14]/80 rounded-xl border border-slate-200 dark:border-[#1A2744]/70">
          <span className="text-slate-500">
            TIME: <span className="text-slate-800 dark:text-slate-200 font-medium">{typeof hoverData.time === 'number' ? new Date(hoverData.time * 1000).toLocaleDateString('en-IN') : String(hoverData.time)}</span>
          </span>
          <span className="text-slate-500">
            O: <span className="text-slate-800 dark:text-slate-100 font-semibold">₹{hoverData.open}</span>
          </span>
          <span className="text-slate-500">
            H: <span className="text-emerald-600 font-semibold">₹{hoverData.high}</span>
          </span>
          <span className="text-slate-500">
            L: <span className="text-rose-600 font-semibold">₹{hoverData.low}</span>
          </span>
          <span className="text-slate-500">
            C: <span className={hoverData.close && hoverData.open && hoverData.close >= hoverData.open ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>₹{hoverData.close}</span>
          </span>
          {hoverData.volume != null && (
            <span className="text-slate-500">
              VOL: <span className="text-blue-600 font-semibold">{hoverData.volume.toLocaleString('en-IN')}</span>
            </span>
          )}
        </div>
      )}

      {/* Main Chart Container */}
      <div className="relative w-full overflow-hidden rounded-xl bg-white dark:bg-[#0D1527]">
        <div ref={chartContainerRef} className="w-full h-[480px]" />
      </div>

      {/* Sub-Indicators Toggle Tabs: RSI, MACD */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-[#1A2744]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
              Sub-Oscillator Panel:
            </span>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#070B14] p-0.5 rounded-lg border border-slate-200 dark:border-[#1A2744]">
              <button
                onClick={() => setActiveSubchart('rsi')}
                className={`px-2.5 py-1 text-xs rounded-md font-mono transition-all cursor-pointer ${
                  activeSubchart === 'rsi'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                RSI (14)
              </button>
              <button
                onClick={() => setActiveSubchart('macd')}
                className={`px-2.5 py-1 text-xs rounded-md font-mono transition-all cursor-pointer ${
                  activeSubchart === 'macd'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                MACD (12, 26, 9)
              </button>
              <button
                onClick={() => setActiveSubchart('none')}
                className={`px-2.5 py-1 text-xs rounded-md font-mono transition-all cursor-pointer ${
                  activeSubchart === 'none'
                    ? 'bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Hide
              </button>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            TradingView Lightweight Charts • Real Exchange OHLCV
          </span>
        </div>

        {/* RSI Display Panel */}
        {activeSubchart === 'rsi' && technicals?.rsi != null && (
          <div className="bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 flex items-center justify-center font-mono font-bold text-blue-700 dark:text-cyan-400">
                {technicals.rsi}
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Relative Strength Index (RSI 14)</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {technicals.rsi > 70
                    ? '⚠️ Overbought Zone (>70): Increased chance of technical exhaustion'
                    : technicals.rsi < 30
                    ? '🟢 Oversold Zone (<30): High probability of mean-reversion recovery'
                    : 'Balanced Range (30-70): Consistent momentum without divergence'}
                </div>
              </div>
            </div>

            {/* Visual RSI Slider Bar */}
            <div className="w-full md:w-64 flex flex-col gap-1">
              <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
                <div className="absolute left-[30%] right-[30%] h-full bg-slate-300/80 dark:bg-slate-700/60" title="Neutral Range 30-70" />
                <div
                  className="absolute top-0 bottom-0 w-2.5 rounded-full bg-blue-600 dark:bg-cyan-400 shadow-[0_0_8px_#2563eb]"
                  style={{ left: `${Math.min(95, Math.max(5, technicals.rsi))}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0 (Oversold)</span>
                <span>30</span>
                <span>70</span>
                <span>100 (Overbought)</span>
              </div>
            </div>
          </div>
        )}

        {/* MACD Display Panel */}
        {activeSubchart === 'macd' && technicals?.macd && (
          <div className="bg-slate-50 dark:bg-[#070B14] border border-slate-200 dark:border-[#1A2744] rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-slate-500">MACD Line: </span>
                <span className={technicals.macd.macd >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {technicals.macd.macd}
                </span>
              </div>
              <div>
                <span className="text-slate-500">Signal Line: </span>
                <span className="text-amber-600 font-bold">{technicals.macd.signal}</span>
              </div>
              <div>
                <span className="text-slate-500">Histogram: </span>
                <span className={technicals.macd.histogram >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                  {technicals.macd.histogram > 0 ? `+${technicals.macd.histogram}` : technicals.macd.histogram}
                </span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              technicals.macd.status === 'Bullish'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30'
                : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-500/30'
            }`}>
              {technicals.macd.status} Momentum Crossover
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
