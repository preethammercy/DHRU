# DHRU.AI — AI-Powered Real-Time Indian Financial Market Intelligence Platform

> **Official Name:** DHRU.AI  
> **Tagline:** *“Understand Every Market. See Beyond the Numbers.”*  
> **Mission:** Solve the fundamental problem: *“Ordinary investors struggle to understand the stock market.”*  
> **Core Architecture:** Real-time & delayed verifiable Indian market data, TradingView Lightweight Charts, Google Gemini AI synthesis, multi-source financial RSS engine, and a 10-minute automated background refresh loop.

---

## 1. Executive Summary & Vision

DHRU.AI is a production-grade Indian financial market intelligence platform designed to explain to everyday retail investors:
1. **What is happening** (verifiable latest price, percentage change, session high/low, volume)
2. **Why it may be happening** (sector rotation, macroeconomic catalysts, company announcements, news sentiment)
3. **What the risks are** (systemic 5-factor risk classification: Low, Moderate, High, or Very High)
4. **What historical evidence suggests could happen next** (transparent probabilistic scenarios for the next session, 5 days, and 1 month).

No fake demo values. No paid API paywalls. Everything runs on permitted, authoritative public feeds (NSE official archives, public quotes, financial RSS feeds, RBI statistics).

---

## 2. Complete Market Coverage

### A. NSE & BSE Equity Indices
- **NIFTY 50** (`^NSEI`), **BSE SENSEX** (`^BSESN`)
- **NIFTY Bank** (`^NSEBANK`), **NIFTY IT** (`^CNXIT`), **NIFTY Auto** (`^CNXAUTO`)
- **NIFTY Pharma** (`^CNXPHARMA`), **NIFTY FMCG** (`^CNXFMCG`), **NIFTY Metal** (`^CNXMETAL`)
- **NIFTY Realty** (`^CNXREALTY`), **NIFTY Energy** (`^CNXENERGY`), **NIFTY Infrastructure** (`^CNXINFRA`)
- **NIFTY 100**, **NIFTY 200**, **NIFTY 500** (`^CRSLDX`), **NIFTY Midcap 50**, **NIFTY Smallcap 100**

### B. Full NSE Universe (2,600+ Equities)
- Direct ingestion of the official National Stock Exchange master file (`archives.nseindia.com/content/equities/EQUITY_L.csv`).
- Full-text search by company name, ticker symbol, ISIN, and sector.
- Handled split listings and corporate name changes (e.g., `TMCV.NS` and `TMPV.NS` for Tata Motors; `ETERNAL`/`ZOMATO`).
- Detailed quotes for market leaders: Reliance, TCS, HDFC Bank, Infosys, ICICI Bank, SBI, Bharti Airtel, ITC, HUL, L&T, M&M, Maruti Suzuki, Bajaj Finance, Sun Pharma, Cipla, Adani Enterprises, and 2,600+ other NSE listed firms.

### C. Commodities & Forex Indicators
- **Gold & Silver Proxies** (COMEX / MCX proxies)
- **Crude Oil (WTI/Brent)** & **Natural Gas**
- **USD/INR**, **EUR/INR**, **GBP/INR** currency pairs
- **10-Year Indian Government Benchmark Bond Yield** (G-Sec ~6.85%) & **RBI Repo Rate** (6.50%)
- Clearly identified exchange and source attribution for each category.

### D. Listed ETFs & F&O Derivatives
- High-liquidity ETFs: `NIFTYBEES.NS`, `BANKBEES.NS`, `GOLDBEES.NS`, `ITBEES.NS`, `SILVERBEES.NS`.
- Derivatives: Put-Call Ratio (PCR), Max Pain strike calculation, and strike-wise Call/Put Open Interest distribution.

---

## 3. Core Capabilities & 16 Specialized Pages

| # | Page / Module | Key Functionality |
|---|---|---|
| **1** | **Market Overview** | Market status (Live / Closed / Pre-Market with IST clock), index ticker strip, gainers & losers, market breadth (Adv/Dec), institutional net flows (FII/DII), breaking news. |
| **2** | **All Indices** | Comprehensive performance table of 16+ NSE and BSE indices with category filtering and drill-down. |
| **3** | **All Stocks (Screener)** | Searchable 2,600+ stock directory with Sector, Market Cap, and Gain/Loss filters. |
| **4** | **Stock Detail & Deep Analysis** | Interactive TradingView Lightweight Chart, Technical Scorecard, Risk Rating, Gemini AI Deep Report, stock-specific news, and Watchlist toggle. |
| **5** | **Sector Explorer** | Sector heatmap, relative change across Indian industries, constituent leaders, and AI sector drivers. |
| **6** | **Commodities & Forex** | MCX/Global Gold, Silver, Crude, Natural Gas, USD/INR, EUR/INR, GBP/INR, and G-Sec Bond Yield. |
| **7** | **Futures & Options (F&O)** | NIFTY & Bank NIFTY PCR, Max Pain strikes, ATM implied volatility, and strike-wise Open Interest distribution. |
| **8** | **IPO & Corporate Actions** | Upcoming IPOs calendar, recent listing performance, and official corporate actions (dividends, splits, bonuses). |
| **9** | **Financial News Engine** | Zero-paid-API RSS news aggregator from Livemint, Economic Times, and Google News with sentiment scoring and source hyperlinks. |
| **10** | **AI Predictions & Scenario Lab** | 3-horizon probabilistic dispersion scenarios (Next session, 5 days, 1 month) based on 14-period ATR volatility and Fibonacci pivots. |
| **11** | **Market Risk Monitor** | 5-factor systemic risk index (0–100): 52W Drawdown, Market Breadth, Crude Oil stress, USD/INR pressure, and Institutional outflows. |
| **12** | **Candlestick Pattern Explorer** | Scanner detecting Hammers, Dojis, Engulfing patterns, and Morning/Evening stars with educational trading psychology guides. |
| **13** | **Backtesting Studio** | Walk-forward historical backtester evaluating Dual EMA crossovers and RSI mean reversion without look-ahead bias. |
| **14** | **Personal Watchlist** | Local browser storage persisted portfolio watchlist with real quote updates and JSON export. |
| **15** | **Ask DHRU AI** | Contextual conversational financial assistant that understands the stock in view and answers retail investor queries. |
| **16** | **Methodology & Sources** | Full institutional transparency disclosing public feeds, refresh schedules, indicator mathematics, and regulatory disclaimers. |

---

## 4. Technical Architecture

```
dhru.ai/
├── public/                     # Static assets, SVG favicon (Dhruva Star motif)
├── server/                     # Backend Express API Server (Node.js)
│   ├── index.js                # REST API wiring, static serving, startup routines
│   ├── data/
│   │   ├── instruments.js      # Curated universe, indices, commodities, ETFs, sectors
│   │   ├── derivativesData.js  # F&O PCR and Open Interest models
│   │   ├── ipoAnnouncements.js # IPO calendar and corporate actions
│   │   └── fiiDiiData.js       # Institutional flow tracker
│   └── services/
│       ├── nseDirectory.js     # Loads archives.nseindia.com/content/equities/EQUITY_L.csv
│       ├── marketData.js       # Real-time quotes, OHLCV candles, batching & caching
│       ├── indicators.js       # SMA, EMA, RSI, MACD, Bollinger Bands, VWAP, Pivots, Patterns
│       ├── newsService.js      # RSS aggregator (Livemint, Economic Times, Google News)
│       ├── riskEngine.js       # 5-factor systemic risk model (Low / Mod / High / Very High)
│       ├── predictionEngine.js # Walk-forward backtester and ATR dispersion envelopes
│       ├── geminiService.js    # Secure server-side Google Gemini 2.5 Flash + fallback engine
│       └── refreshScheduler.js # 10-minute automated background refresh loop
├── src/                        # Frontend React 18 Application
│   ├── components/             # Reusable UI components
│   │   ├── chart/              # TradingView Lightweight Charts (Candlesticks, Volume, Overlays)
│   │   ├── common/             # Header, Navigation, UniversalSearchModal, SettingsModal
│   │   └── stock/              # TechnicalScorecard, GeminiReport
│   ├── context/                # ThemeContext (Dark/Light), WatchlistContext
│   ├── pages/                  # 16 specialized full-page views
│   ├── services/api.ts         # Frontend API client
│   ├── types/index.ts          # TypeScript interfaces
│   ├── App.tsx                 # Root application shell
│   ├── main.tsx                # React DOM entry point
│   └── index.css               # Tailwind CSS & theme styling
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── .env.example
```

---

## 5. Security & Privacy Guarantees

1. **Zero Client Exposure of API Keys:**  
   Google Gemini API keys are configured and stored strictly in server-side protected memory or `.env`. They are never embedded in client JavaScript bundles, HTML documents, or browser network payloads.
2. **Deterministic Intelligence Fallback:**  
   If no Gemini key is provided, DHRU.AI runs an institutional-grade deterministic mathematical reasoning engine directly on the server, ensuring 100% platform functionality out of the box. Adding a free Gemini API key in the top Settings modal instantly activates full generative language capabilities.
3. **Local Storage Watchlist:**  
   Personal watchlists are saved directly on the client's browser without storing personally identifiable information on external databases.

---

## 6. How to Run

### Requirements
- Node.js v18+ (Node.js v24 tested)
- npm v9+

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Build frontend production assets
npm run build

# 3. Start production server (runs API + UI + 10-Min Scheduler on port 5000)
npm start
```
Open **`http://localhost:5000`** in any web browser.

### Development Mode (with Hot Module Replacement)
```bash
npm run dev
```
Runs the Express backend on `http://localhost:5000` and Vite dev server on `http://localhost:5173`.

---

## 7. Compliance & Regulatory Disclosures

- **Educational & Informational Purpose Only:** DHRU.AI is built for market education, financial research, and analytical training. It is NOT a SEBI-registered Research Analyst or Investment Advisor.
- **Probabilistic Scenarios, Not Guarantees:** Price forecasts and algorithmic models represent statistical envelopes of historical volatility. Past performance does not guarantee future results.
- **Consult a Certified Advisor:** Trading equities and derivatives carries substantial capital risk. Consult a SEBI-registered financial professional before executing trades.
