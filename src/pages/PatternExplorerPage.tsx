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
        const css = getComputedStyle(document.documentElement);
        const colors = { primary: css.getPropertyValue('--primary').trim(), text: css.getPropertyValue('--on-primary').trim(), pos: css.getPropertyValue('--pos').trim(), neg: css.getPropertyValue('--neg').trim(), warn: css.getPropertyValue('--warn').trim(), ai: css.getPropertyValue('--ai').trim(), muted: css.getPropertyValue('--text-3').trim(), overlay: css.getPropertyValue('--tooltip-bg').trim() };

        // 1. Top Header Banner Overlay
        ctx.fillStyle = colors.overlay;
        ctx.fillRect(0, 0, w, 75 * scale);

        // Banner Border
        ctx.fillStyle = colors.primary;
        ctx.fillRect(0, 73 * scale, w, 3 * scale);

        // Header Title
        ctx.font = `bold ${22 * scale}px sans-serif`;
        ctx.fillStyle = colors.text;
        ctx.fillText(`DHRU.AI VISION ENGINE • ${result.detectedAsset || 'CHART SCAN'}`, 24 * scale, 34 * scale);

        // Pattern & Action Subtitle
        ctx.font = `bold ${14 * scale}px sans-serif`;
        ctx.fillStyle = result.bias === 'BULLISH' ? colors.pos : result.bias === 'BEARISH' ? colors.neg : colors.warn;
        ctx.fillText(`${result.recommendedAction} SETUP • ${result.patternDetected} (${result.timeframe})`, 24 * scale, 58 * scale);

        // Top Right Confidence Tag
        ctx.font = `bold ${13 * scale}px monospace`;
        ctx.fillStyle = colors.muted;
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

          ctx.fillStyle = colors.text;
          ctx.fillText(tagText, pillX + 12 * scale, pillY + 18 * scale);
        };

        // Draw Entry, SL, T1, T2
        drawLevelLine(ann.slYPercent, colors.neg, 'STOP LOSS', result.stopLoss);
        drawLevelLine(ann.entryYPercent, colors.primary, 'ENTRY ZONE', result.entryZone);
        drawLevelLine(ann.t1YPercent, colors.pos, 'TARGET 1', result.target1);
        if (ann.t2YPercent) {
          drawLevelLine(ann.t2YPercent, colors.ai, 'TARGET 2', result.target2);
        }

        // 3. Bottom Watermark Pill
        const bottomH = 34 * scale;
        ctx.fillStyle = colors.overlay;
        ctx.fillRect(0, h - bottomH, w, bottomH);

        ctx.font = `normal ${11 * scale}px monospace`;
        ctx.fillStyle = colors.muted;
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
      <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-3xl p-6 sm:p-8  space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-surface-2 dark:bg-brand-fill border border-line dark:border-line flex items-center justify-center text-brand dark:text-brand ">
              <CandlestickChart className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-ink dark:text-ink tracking-tight">
                  AI Candlestick Vision Scanner
                </h1>
                <span className="text-ink uppercase font-mono px-2 py-0.5 rounded-full bg-surface-2 text-brand dark:bg-brand-fill dark:text-brand font-bold border border-line dark:border-line">
                  Multimodal Vision
                </span>
              </div>
              <p className="text-xs text-ink-2 dark:text-ink-3 mt-1 max-w-2xl">
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
                ? 'border-line bg-surface-2 dark:bg-brand-fill scale-[1.01]'
                : imagePreview
                ? 'border-line dark:border-line bg-surface-2 dark:bg-pos-tint'
                : 'border-line dark:border-line bg-surface dark:bg-surface hover:border-line'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />

            <div className="w-14 h-14 rounded-2xl bg-surface-2 dark:bg-surface-2 flex items-center justify-center text-brand dark:text-brand mx-auto mb-3 ">
              <Upload className="w-7 h-7" />
            </div>

            <h3 className="text-sm font-bold text-ink dark:text-ink">
              {imagePreview ? 'Click or Drag to Replace Screenshot' : 'Drop Chart Screenshot Here'}
            </h3>
            <p className="text-xs text-ink-2 dark:text-ink-3 mt-1 max-w-xs mx-auto">
              Supports PNG, JPG, WEBP from any broker or trading software
            </p>

            <button
              type="button"
              className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-surface dark:bg-surface-2 border border-line dark:border-line text-ink-2 dark:text-ink-3 hover:bg-surface-2 "
            >
              Select Image File
            </button>
          </div>

          {/* Action Trigger Button */}
          {imagePreview && (
            <button
              onClick={handleScanImage}
              disabled={scanning}
              className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black text-on-brand  flex items-center justify-center gap-2 transition-all cursor-pointer ${
                scanning
                  ? 'bg-surface-2 cursor-not-allowed'
                  : 'bg-brand-fill    hover:opacity-95  hover:scale-[1.01]'
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
            <div className="p-5 rounded-2xl bg-surface dark:bg-surface border border-line dark:border-line  space-y-3.5">
              <div className="flex items-center justify-between pb-2.5 border-b border-line dark:border-line">
                <div>
                  <span className="text-ink font-mono text-ink-3 uppercase">Identified Instrument</span>
                  <div className="font-extrabold text-sm text-ink dark:text-ink">
                    {currentResult.detectedAsset} ({currentResult.timeframe})
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                  currentResult.bias === 'BULLISH'
                    ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos'
                    : 'bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg'
                }`}>
                  {currentResult.recommendedAction}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-2">Pattern Detected:</span>
                  <span className="font-bold text-ink dark:text-ink-3">{currentResult.patternDetected}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2">Entry Zone:</span>
                  <span className="font-mono font-bold text-brand dark:text-brand">{currentResult.entryZone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2">Stop Loss:</span>
                  <span className="font-mono font-bold text-neg">{currentResult.stopLoss}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2">Target 1 & 2:</span>
                  <span className="font-mono font-bold text-pos">{currentResult.target1} / {currentResult.target2}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-2">Risk/Reward:</span>
                  <span className="font-mono font-bold text-ink-2 dark:text-ink-3">{currentResult.riskRewardRatio}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-2 dark:bg-surface text-ink-2 dark:text-ink-3 space-y-1">
                <div className="font-bold text-ink dark:text-ink-3 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-brand dark:text-brand" />
                  <span>Execution Timing:</span>
                </div>
                <p>{currentResult.optimalTiming}</p>
              </div>

              <div className="p-3 rounded-xl bg-surface-2 dark:bg-surface text-ink-2 dark:text-ink-3 space-y-1">
                <div className="font-bold text-ink dark:text-ink-3 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-neg" />
                  <span>Exit Rule:</span>
                </div>
                <p>{currentResult.exitRule}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Annotated Photo Display & Download Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface dark:bg-surface border border-line dark:border-line rounded-3xl p-5  space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-brand dark:text-brand" />
                <h3 className="text-sm font-bold text-ink dark:text-ink">
                  {annotatedDataUrl ? 'Annotated Institutional Chart Photo' : 'Image Preview'}
                </h3>
              </div>

              {annotatedDataUrl && (
                <button
                  onClick={handleDownloadImage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-fill hover:bg-brand-fill text-on-brand  transition-transform hover:scale-[1.02]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Prediction Photo</span>
                </button>
              )}
            </div>

            {/* Display Area */}
            <div className="relative w-full aspect-video sm:aspect-[1.6] bg-surface-2 rounded-2xl overflow-hidden border border-line dark:border-line flex items-center justify-center">
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
                <div className="text-center p-8 text-ink-2 space-y-2">
                  <CandlestickChart className="w-12 h-12 mx-auto text-ink-2 stroke-[1.5]" />
                  <p className="text-xs">No chart screenshot uploaded yet</p>
                  <span className="text-ink-2 block">Upload on the left to start AI analysis</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 3. Previous Scans History Section (User Requirement) */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-line dark:border-line pb-3">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-brand dark:text-brand" />
            <h2 className="text-base font-extrabold text-ink dark:text-ink">
              Previous Scanned Chart Predictions History
            </h2>
          </div>
          {scanHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-xs text-ink-2 hover:text-neg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>

        {scanHistory.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-surface dark:bg-surface border border-line dark:border-line text-xs text-ink-2">
            No scanned chart predictions saved yet. Upload a chart above to save your first prediction to this library!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {scanHistory.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-surface dark:bg-surface border border-line dark:border-line  space-y-3 hover:border-line transition-all group"
              >
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-surface-2 border border-line">
                  <img
                    src={item.annotatedImage || item.originalImage}
                    alt={item.detectedAsset}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-xs text-ink dark:text-ink">
                      {item.detectedAsset}
                    </h4>
                    <span className="text-ink-2">{new Date(item.timestamp).toLocaleString('en-IN')}</span>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-ink font-black uppercase ${
                    item.bias === 'BULLISH'
                      ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos'
                      : 'bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg'
                  }`}>
                    {item.recommendedAction}
                  </span>
                </div>

                <div className="text-ink-2 dark:text-ink-3 line-clamp-2">
                  {item.patternDetected} • Entry: <span className="font-mono font-bold text-brand dark:text-brand">{item.entryZone}</span>
                </div>

                <div className="pt-2 border-t border-line dark:border-line flex items-center justify-between text-xs">
                  <button
                    onClick={() => {
                      setCurrentResult(item);
                      setAnnotatedDataUrl(item.annotatedImage || null);
                      setImagePreview(item.originalImage);
                      window.scrollTo({ top: 100, behavior: 'smooth' });
                    }}
                    className="text-brand dark:text-brand font-bold hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Setup</span>
                  </button>

                  {item.annotatedImage && (
                    <a
                      href={item.annotatedImage}
                      download={`dhru_scan_${item.detectedAsset}.png`}
                      className="text-ink-2 hover:text-ink dark:hover:text-ink"
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
      <div className="space-y-3 pt-6 border-t border-line dark:border-line">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-ink dark:text-ink uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-brand dark:text-brand" />
            Live Formations Scanned on Today's Daily Bar
          </h2>
          <span className="text-ink font-mono text-ink-2">Live Exchange Screener</span>
        </div>

        {loadingPatterns ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-line dark:border-line border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-ink-3">Scanning OHLCV bars for Japanese candlestick formations...</p>
          </div>
        ) : detected.length === 0 ? (
          <div className="p-8 text-center text-ink-2 rounded-2xl bg-surface dark:bg-surface border border-line dark:border-line text-xs">
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
                  className="p-5 rounded-2xl bg-surface dark:bg-surface border border-line dark:border-line hover:border-line cursor-pointer transition-all  space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-sm text-ink dark:text-ink group-hover:text-brand transition-colors">
                        {p.name || p.symbol}
                      </h3>
                      <span className="text-ink font-mono text-ink-2">{p.symbol}</span>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-ink font-black uppercase ${
                      isBull
                        ? 'bg-surface-2 text-pos dark:bg-pos-tint dark:text-pos border border-line dark:border-line'
                        : 'bg-surface-2 text-neg dark:bg-neg-tint dark:text-neg border border-line dark:border-line'
                    }`}>
                      {p.pattern}
                    </span>
                  </div>

                  <p className="text-xs text-ink-2 dark:text-ink-3 leading-relaxed">
                    {p.explanation}
                  </p>

                  <div className="pt-3 border-t border-line dark:border-line flex items-center justify-between text-xs font-bold text-brand dark:text-brand">
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
