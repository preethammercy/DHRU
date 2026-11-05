# Feature contract

These features and behaviors are protected from presentation changes. Entry points below are based on the source tree and the README. The prompt asked for Playwright tests F-01–F-32; this repository does not include Playwright, and those named tests have not been created. Existing Node tests cover calculations and trading engines, not UI behavior.

| ID | Protected capability | Existing entry point | Baseline feature test |
|---|---|---|---|
| F-01 | Live/Closed/Pre-Market status and IST clock | `src/components/common/Header.tsx`, `src/services/api.ts` | Not available |
| F-02 | Index ticker strip | `src/pages/OverviewPage.tsx` | Not available |
| F-03 | Top gainers and losers | `src/pages/OverviewPage.tsx` | Not available |
| F-04 | Advances and declines | `src/pages/OverviewPage.tsx` | Not available |
| F-05 | FII/DII net flows and labels | `src/pages/OverviewPage.tsx`, `server/data/fiiDiiData.js` | Not available |
| F-06 | Breaking Market Overview news | `src/pages/OverviewPage.tsx` | Not available |
| F-07 | Indices table, category filters, drill-down | `src/pages/IndicesPage.tsx` | Not available |
| F-08 | Stock screener, search and filters | `src/pages/StocksPage.tsx` | Not available |
| F-09 | Lightweight Charts candles, volume, overlays, timeframes | `src/components/chart/TradingViewChart.tsx` | Not available |
| F-10 | Stock technical scorecard | `src/components/stock/TechnicalScorecard.tsx` | Not available |
| F-11 | Stock risk rating and five factors | `src/pages/StockDetailPage.tsx`, `server/services/riskEngine.js` | Not available |
| F-12 | Gemini report and deterministic fallback | `src/components/stock/GeminiReport.tsx`, `server/services/geminiService.js` | Not available |
| F-13 | Stock-specific news | `src/pages/StockDetailPage.tsx` | Not available |
| F-14 | Stock detail watchlist toggle | `src/pages/StockDetailPage.tsx`, `src/context/WatchlistContext.tsx` | Not available |
| F-15 | Sector heatmap, relative change, leaders and drivers | `src/pages/SectorsPage.tsx` | Not available |
| F-16 | Commodities, Forex, G-Sec yield and RBI rate | `src/pages/CommoditiesPage.tsx`, `server/data/instruments.js` | Not available |
| F-17 | F&O PCR, max pain, ATM IV and strike OI | `src/pages/DerivativesPage.tsx`, `server/data/derivativesData.js` | Not available |
| F-18 | IPO calendar, listings and corporate actions | `server/data/ipoAnnouncements.js`, API routes | Not available |
| F-19 | RSS financial news, sentiment and links | `src/pages/NewsPage.tsx`, `server/services/newsService.js` | Not available |
| F-20 | Three prediction horizons and Scenario Lab | `src/pages/AiPredictionsPage.tsx`, `server/services/predictionEngine.js` | Not available |
| F-21 | Five-factor 0–100 Market Risk Monitor | `src/pages/RiskMonitorPage.tsx`, `server/services/riskEngine.js` | Not available |
| F-22 | Pattern scanner and educational content | `src/pages/PatternExplorerPage.tsx` | Not available |
| F-23 | EMA crossover and RSI mean-reversion backtests | `src/pages/TradingTerminalPage.tsx`, `server/services/predictionEngine.js` | Not available |
| F-24 | Watchlist live quotes, export and persistence | `src/pages/WatchlistPage.tsx`, `src/context/WatchlistContext.tsx` | Not available |
| F-25 | Contextual Ask DHRU AI | `src/pages/AskDhruPage.tsx` | Not available |
| F-26 | Methodology, sources and disclosures | Methodology content in `src/pages/` | Not available |
| F-27 | Universal Search matching and keyboard behavior | `src/components/common/UniversalSearchModal.tsx` | Not available |
| F-28 | Settings modal and Gemini key behavior | `src/components/common/SettingsModal.tsx` | Not available |
| F-29 | Theme toggle and persisted choice | `src/context/ThemeContext.tsx` | Not available |
| F-30 | `/api` endpoints, refresh loop and fallback engine | `server/index.js`, `api/index.js`, `server/services/refreshScheduler.js` | Existing Node suite does not check API parity |
| F-31 | Navigation order and existing routes/state behavior | `src/App.tsx`, `src/components/common/Navigation.tsx` | Not available |
| F-32 | Disclosures and disclaimers word-for-word | Content in `src/pages/` and `README.md` | Not available |

The runtime contains additional destinations (login, terminal, profile and positions/holdings) beyond the README's 16-module list. Those routes are also protected and have been preserved.
