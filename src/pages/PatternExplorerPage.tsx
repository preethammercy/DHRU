// DHRU.AI - Candlestick Pattern Explorer & AI Vision Chart Scanner
// Allows users to upload a market chart screenshot.
// AI Vision analyzes candle statistics and predicts Entry, Stop Loss, Targets, Timing, and Exit rules.
// Dynamically generates an annotated institutional photo via HTML5 Canvas with download & history persistence.

import React, { useEffect, useState, useRef } from 'react';
import { getPatterns } from '../services/api';
import {
  CandlestickChart,
  Sparkles,
  ArrowRight,
  Upload,
  Download,
  Clock,
  ShieldAlert,
  Target,
  TrendingUp,
  TrendingDown,
  History,
  Image as ImageIcon,
  CheckCircle2,
  RefreshCw,
  Eye,
  Trash2
} from 'lucide-react';

interface Props {
  onSelectStock: (symbol: string) => void;
}

interface ScanResult {
  id: string;
  detectedAsset: string;
  timeframe: string;
  patternDetected: string;
  bias: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  recommendedAction: string;
  entryZone: string;
  stopLoss: string;
  target1: string;
  target2: string;
  target3: string;
  riskRewardRatio: string;
  optimalTiming: string;
  exitRule: string;
  confidenceScore: number;
  annotations?: {
    entryYPercent: number;
    slYPercent: number;
    t1YPercent: number;
    t2YPercent: number;
  };
  summary: string;
  engine: string;
  timestamp: string;
  originalImage: string;
  annotatedImage?: string;
}

export const PatternExplorerPage: React.FC<Props> = ({ onSelectStock }) => {
  const [detected, setDetected] = useState<any[]>([]);
  const [loadingPatterns, setLoadingPatterns] = useState(true);

  // Vision Scanner States
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [annotatedDataUrl, setAnnotatedDataUrl] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanResult[]>(() => {
    try {
      const saved = localStorage.getItem('dhru_scanned_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    getPatterns()
      .then(res => {
        setDetected(res.patterns || []);
        setLoadingPatterns(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingPatterns(false);
      });
  }, []);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid chart image (PNG, JPG, WEBP).');
      return;
    }
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setCurrentResult(null);
      setAnnotatedDataUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleScanImage = async () => {
    if (!imagePreview) return;
    setScanning(true);

    try {
      const res = await fetch('/api/ai/scan-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: selectedFile?.type || 'image/png'
        })
      });

      if (!res.ok) throw new Error('Scan failed');
      const data: ScanResult = await res.json();
      data.id = 'scan_' + Date.now();
      data.originalImage = imagePreview;

      // Draw annotation on HTML5 Canvas
      const annotatedUrl = await generateAnnotatedImage(imagePreview, data);
      data.annotatedImage = annotatedUrl;

      setCurrentResult(data);
      setAnnotatedDataUrl(annotatedUrl);

      // Save to history
      const updatedHistory = [data, ...scanHistory.slice(0, 19)];
      setScanHistory(updatedHistory);
      localStorage.setItem('dhru_scanned_history', JSON.stringify(updatedHistory));
    } catch (err: any) {
      console.error('AI Scan Error:', err);
      alert('Scanning failed. Please check connection and try again.');
    } finally {
      setScanning(false);
    }
  };

  const generateAnnotatedImage = (imgSrc: string, result: ScanResult): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imgSrc);
          return;
        }

        // Draw original screenshot
        ctx.drawImage(img, 0, 0);

        const w = canvas.width;
        const h = canvas.height;
        const scale = Math.max(1, w / 1200);

        // 1. Top Header Banner Overlay
        ctx.fillStyle = 'rgba(7, 11, 20, 0.88)';
        ctx.fillRect(0, 0, w, 75 * scale);

        // Banner Border
        ctx.fillStyle = '#2563EB';
        ctx.fillRect(0, 73 * scale, w, 3 * scale);

        // Header Title
        ctx.font = `bold ${22 * scale}px sans-serif`;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`DHRU.AI VISION ENGINE • ${result.detectedAsset || 'CHART SCAN'}`, 24 * scale, 34 * scale);

        // Pattern & Action Subtitle
        ctx.font = `bold ${14 * scale}px sans-serif`;
        ctx.fillStyle = result.bias === 'BULLISH' ? '#10B981' : result.bias === 'BEARISH' ? '#F43F5E' : '#F59E0B';
        ctx.fillText(`${result.recommendedAction} SETUP • ${result.patternDetected} (${result.timeframe})`, 24 * scale, 58 * scale);

        // Top Right Confidence Tag
        ctx.font = `bold ${13 * scale}px monospace`;
        ctx.fillStyle = '#94A3B8';
        const rightText = `CONFIDENCE: ${result.confidenceScore}% | RRR: ${result.riskRewardRatio}`;
        ctx.fillText(rightText, w - ctx.measureText(rightText).width - (24 * scale), 46 * scale);

        // 2. Overlay Horizontal Target & Stop Loss Lines
        const ann = result.annotations || { entryYPercent: 50, slYPercent: 72, t1YPercent: 32, t2YPercent: 18 };

        // Helper to draw horizontal tagged lines
        const drawLevelLine = (yPct: number, color: string, label: string, priceText: string) => {
          const y = (h * yPct) / 100;

          // Line
          ctx.beginPath();
          ctx.setLineDash([8 * scale, 6 * scale]);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2 * scale;
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Tag Pill on Right
          const tagText = `${label}: ${priceText}`;
          ctx.font = `bold ${12 * scale}px sans-serif`;
          const textWidth = ctx.measureText(tagText).width;
          const pillW = textWidth + 24 * scale;
          const pillH = 26 * scale;
          const pillX = w - pillW - 20 * scale;
          const pillY = y - pillH / 2;

          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect ? ctx.roundRect(pillX, pillY, pillW, pillH, 6 * scale) : ctx.rect(pillX, pillY, pillW, pillH);
          ctx.fill();

          ctx.fillStyle = '#FFFFFF';
          ctx.fillText(tagText, pillX + 12 * scale, pillY + 18 * scale);
        };

        // Draw Entry, SL, T1, T2
        drawLevelLine(ann.slYPercent, '#DC2626', 'STOP LOSS', result.stopLoss);
        drawLevelLine(ann.entryYPercent, '#2563EB', 'ENTRY ZONE', result.entryZone);
        drawLevelLine(ann.t1YPercent, '#059669', 'TARGET 1', result.target1);
        if (ann.t2YPercent) {
          drawLevelLine(ann.t2YPercent, '#7C3AED', 'TARGET 2', result.target2);
        }

        // 3. Bottom Watermark Pill
        const bottomH = 34 * scale;
        ctx.fillStyle = 'rgba(7, 11, 20, 0.85)';
        ctx.fillRect(0, h - bottomH, w, bottomH);

        ctx.font = `normal ${11 * scale}px monospace`;
        ctx.fillStyle = '#94A3B8';
        ctx.fillText(`DHRU.AI • Institutional Quant Pattern Engine • ${new Date().toLocaleDateString('en-IN')}`, 20 * scale, h - 12 * scale);

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = imgSrc;
    });
  };

  const handleDownloadImage = () => {
    if (!annotatedDataUrl) return;
    const a = document.createElement('a');
    a.href = annotatedDataUrl;
    a.download = `dhru_prediction_${currentResult?.detectedAsset || 'chart'}_${Date.now()}.png`;
    a.click();
  };

  const clearHistory = () => {
    if (confirm('Clear your scanned charts history?')) {
      setScanHistory([]);
      localStorage.removeItem('dhru_scanned_history');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* 1. Header Hero */}
      <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-3xl p-6 sm:p-8 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-cyan-500/10 border border-blue-200 dark:border-cyan-500/20 flex items-center justify-center text-blue-600 dark:text-cyan-400 shadow-xs">
              <CandlestickChart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  AI Candlestick Vision Scanner
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-cyan-500/20 dark:text-cyan-300 font-bold border border-blue-200 dark:border-cyan-500/30">
                  Multimodal Vision
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                Upload any candlestick chart screenshot from TradingView, Zerodha, Angel One, or Binance. Our AI vision engine analyzes candle formations, flags Entry/SL/Target levels, and generates a downloadable annotated institutional chart.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Screenshot Uploader Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Upload & Live Analysis Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 sm:p-8 rounded-3xl border-2 border-dashed text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/30 scale-[1.01]'
                : imagePreview
                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10'
                : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0A101D] hover:border-blue-400'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-600 dark:text-cyan-400 mx-auto mb-3 shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {imagePreview ? 'Click or Drag to Replace Screenshot' : 'Drop Chart Screenshot Here'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Supports PNG, JPG, WEBP from any broker or trading software
            </p>

            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-2xs"
            >
              Select Image File
            </button>
          </div>

          {/* Action Trigger Button */}
          {imagePreview && (
            <button
              onClick={handleScanImage}
              disabled={scanning}
              className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black text-white shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                scanning
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 hover:opacity-95 shadow-blue-500/25 hover:scale-[1.01]'
              }`}
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>AI Model Reading Candles & Support Levels...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Screenshot & Generate Prediction Photo</span>
                </>
              )}
            </button>
          )}

          {/* Current Scan Details Card */}
          {currentResult && (
            <div className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">Identified Instrument</span>
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {currentResult.detectedAsset} ({currentResult.timeframe})
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                  currentResult.bias === 'BULLISH'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {currentResult.recommendedAction}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pattern Detected:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{currentResult.patternDetected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Entry Zone:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">{currentResult.entryZone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Stop Loss:</span>
                  <span className="font-mono font-bold text-rose-600">{currentResult.stopLoss}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target 1 & 2:</span>
                  <span className="font-mono font-bold text-emerald-600">{currentResult.target1} / {currentResult.target2}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Risk/Reward:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{currentResult.riskRewardRatio}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070B14] text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-blue-600 dark:text-cyan-400" />
                  <span>Execution Timing:</span>
                </div>
                <p>{currentResult.optimalTiming}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070B14] text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-rose-600" />
                  <span>Exit Rule:</span>
                </div>
                <p>{currentResult.exitRule}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Annotated Photo Display & Download Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {annotatedDataUrl ? 'Annotated Institutional Chart Photo' : 'Image Preview'}
                </h3>
              </div>

              {annotatedDataUrl && (
                <button
                  onClick={handleDownloadImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-transform hover:scale-[1.02]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Prediction Photo</span>
                </button>
              )}
            </div>

            {/* Display Area */}
            <div className="relative w-full aspect-video sm:aspect-[16/10] bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              {annotatedDataUrl ? (
                <img
                  src={annotatedDataUrl}
                  alt="Annotated Chart Prediction"
                  className="w-full h-full object-contain"
                />
              ) : imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Uploaded Preview"
                  className="w-full h-full object-contain opacity-80"
                />
              ) : (
                <div className="text-center p-8 text-slate-500 space-y-2">
                  <CandlestickChart className="w-12 h-12 mx-auto text-slate-600 stroke-[1.5]" />
                  <p className="text-xs">No chart screenshot uploaded yet</p>
                  <span className="text-[10px] text-slate-600 block">Upload on the left to start AI analysis</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Previous Scans History Section (User Requirement) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              Previous Scanned Chart Predictions History
            </h2>
          </div>
          {scanHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {scanHistory.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] text-xs text-slate-500">
            No scanned chart predictions saved yet. Upload a chart above to save your first prediction to this library!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scanHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] shadow-xs space-y-3 hover:border-blue-400 transition-all group"
              >
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
                  <img
                    src={item.annotatedImage || item.originalImage}
                    alt={item.detectedAsset}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {item.detectedAsset}
                    </h4>
                    <span className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleString('en-IN')}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                    item.bias === 'BULLISH'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}>
                    {item.recommendedAction}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                  {item.patternDetected} • Entry: <span className="font-mono font-bold text-blue-600 dark:text-cyan-400">{item.entryZone}</span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setCurrentResult(item);
                      setAnnotatedDataUrl(item.annotatedImage || null);
                      setImagePreview(item.originalImage);
                      window.scrollTo({ top: 100, behavior: 'smooth' });
                    }}
                    className="text-blue-600 dark:text-cyan-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Setup</span>
                  </button>

                  {item.annotatedImage && (
                    <a
                      href={item.annotatedImage}
                      download={`dhru_scan_${item.detectedAsset}.png`}
                      className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
                      title="Download image"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Live Detected Formations Scanner across Market Universe */}
      <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
            Live Formations Scanned on Today's Daily Bar
          </h2>
          <span className="text-[11px] font-mono text-slate-500">Live Exchange Screener</span>
        </div>

        {loadingPatterns ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Scanning OHLCV bars for Japanese candlestick formations...</p>
          </div>
        ) : detected.length === 0 ? (
          <div className="p-8 text-center text-slate-500 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] text-xs">
            No rare reversal candle patterns detected on the latest completed daily session.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {detected.map((p, idx) => {
              const isBull = p.type?.toLowerCase().includes('bullish');
              return (
                <div
                  key={idx}
                  onClick={() => onSelectStock(p.symbol)}
                  className="p-5 rounded-2xl bg-white dark:bg-[#0D1527] border border-slate-200 dark:border-[#1A2744] hover:border-blue-400 cursor-pointer transition-all shadow-xs space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                        {p.name || p.symbol}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-500">{p.symbol}</span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                      isBull
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                    }`}>
                      {p.pattern}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {p.explanation}
                  </p>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-cyan-400">
                    <span>Open in Terminal</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
