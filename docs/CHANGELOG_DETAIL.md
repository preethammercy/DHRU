# Detailed change log

## 2026-10-31 — Phase 1 baseline audit

- `docs/AUDIT.md` → Added measured install/build/typecheck/test/dev results, confirmed data-integrity and credential risks, deployment and repository structure concerns, and the work order. This records observed behavior before behavior changes. Verified with `npm run build`, `npx tsc --noEmit`, `npm test`, and `npm run dev`; baseline commands and limitations are listed in the audit.

## 2026-10-31 — Visual theme refresh

- `src/index.css` → Added shared light/dark surface tokens, removed card lift and heavy elevation, normalized gradient buttons and gradient text, added visible keyboard focus, mobile input sizing, and reduced-motion behavior. This tones down the previous glow-heavy style and makes interaction states easier to read. Verified with the production build and existing test suite.
- `src/App.tsx` → Applied a named shell class, widened the content measure to 1,440 px, updated spacing, and replaced promotional footer copy with a short product description. This gives all pages one consistent canvas and removes the marketing slogan. Verified with typecheck and production build.
- `src/components/common/Header.tsx` → Simplified the wordmark and tagline, reduced the search control and live signals button to flat surfaces, and removed promotional language. Verified with typecheck and production build.
- `src/components/common/Navigation.tsx` → Shortened menu labels, reduced active-tab decoration, added navigation semantics, and aligned content to the 1,440 px shell. This makes the crowded desktop nav easier to scan. Verified with typecheck and production build.
- `src/components/common/MobileBottomNav.tsx` → Replaced the raised gradient trade button with five consistent tabs: Markets, Stocks/Assets, Search, Watchlist, and More. Wired Search to the search modal and More to the existing drawer; added touch-sized controls and current-page semantics. Verified with typecheck and production build.
- `src/pages/OverviewPage.tsx` → Replaced the oversized promotional banner with a compact market heading and session status/actions, so the page gets to its market data sooner. Verified with typecheck and production build.

## 2026-10-31 — Data integrity and functional UI pass

- `src/App.tsx`, `src/components/common/{Header,Navigation,MobileBottomNav}.tsx`, and `src/index.css` → Reworked the application shell into a compact sidebar and content layout with a mobile tab bar, responsive spacing, accessible focus states, and reduced motion support. Removed the remote font dependency and applies the saved/system color mode before paint.
- `src/pages/OverviewPage.tsx`, `src/pages/DerivativesPage.tsx`, `src/pages/AiPredictionsPage.tsx`, `src/pages/PatternExplorerPage.tsx`, `src/pages/RiskMonitorPage.tsx`, and `src/pages/StockDetailPage.tsx` → Replaced fabricated breadth, derivatives, prediction, risk and chart-analysis claims with explicit unavailable states; the pattern scanner now reports detected candle shapes from fetched OHLC bars.
- `server/data/{derivativesData,fiiDiiData,ipoAnnouncements}.js`, `server/services/{marketStream,predictionEngine,indicators,geminiService}.js`, and `server/index.js` → Removed sample option-chain/flow/IPO values and seeded sample quotes, pause unvalidated forecasts and risk scores, and restrict assistant output to attached facts or plain educational definitions.
- `src/context/MarketStreamContext.tsx`, `src/pages/AskDhruPage.tsx`, and `src/services/api.ts` → Removed synthetic initial ticks and obsolete Gemini image/key APIs; grounded answers now include source and as-of context and use the instrument currency.
- `test/grounded-chat.test.js` and `test/indicators-and-trading.test.js` → Added coverage for grounded answers, missing context, recommendation refusal, and no synthesized initial quotes.
- `docs/DESIGN_AUDIT.md`, `docs/DESIGN_RATIONALE.md`, `docs/MOTION_SPEC.md`, `docs/DIAGNOSIS.md`, `docs/DATA_SOURCES.md`, `docs/PREDICTION_INVENTORY.md`, and `docs/QA_MATRIX.md` → Recorded the visual decisions, data source limits, validation gap, and QA status. Browser/device screenshot QA remains pending; see the matrix.

## 2026-10-31 — Live feedback, indicators, and assistant repair

- `src/types/indicators.ts` and `src/components/chart/TradingViewChart.tsx` → Disabled every indicator by default and added a one-time migration that turns off studies previously activated by the old defaults while preserving future user choices.
- `src/context/MarketStreamContext.tsx`, `server/services/marketStream.js`, and `src/index.css` → Carried provider/time metadata into live ticks, made up/down price flashes more visible, and rate-limited serverless crypto snapshot refreshes.
- `src/pages/AskDhruPage.tsx` and `server/services/geminiService.js` → Fixed USD chat display, refresh assistant context from live ticks, handle greetings, and support a secure optional Gemini Interactions API with a grounded fallback. The API key stays server-side and requests use `store: false`.
- `src/pages/AiPredictionsPage.tsx`, `server/services/predictionEngine.js`, `server/index.js`, and `src/services/api.ts` → Added live re-anchored 15-minute and 1-hour descriptive scenario ranges from recent 5-minute OHLC data. The interface explicitly labels the model experimental and does not show probabilities or recommendations.
- `src/components/stock/GeminiReport.tsx` and `src/services/api.ts` → Replaced the paused report panel with a live fact brief and an optional grounded explanation; removed invented fallback RSI/MACD/risk values.
- `src/pages/StockDetailPage.tsx` → Kept a valid quote page usable if candle history fails and added a retry state when the quote provider rejects a symbol.
- `test/live-scenarios.test.js` → Added deterministic checks for data sufficiency, current-price re-anchoring, and the absence of confidence claims.
