# Phase 1 audit

Audit date: 2026-10-31. Scope: cloned repository baseline. No application behavior was changed during this audit.

## Baseline commands

| Command | Result |
|---|---|
| `npm install --no-audit --no-fund` | Completed; npm warned that install scripts for `@firebase/util`, `esbuild`, and `protobufjs` need approval. |
| `npm run build` | Pass. Vite 6.4.4 built 1,649 modules. Main JS bundle is 940.17 kB (231.49 kB gzip); Vite warns that chunks exceed 500 kB. |
| `npx tsc --noEmit` | Pass with no diagnostics. |
| `npm test` | Pass: 18 tests, 6 suites, 0 failures. Coverage is not configured/reported. |
| `npm run dev` | Backend starts on port 5000 and NSE directory indexes 2,620 entries. Vite exits because `node_modules/lucide-react/dist/esm/icons/align-start-vertical.js.map` is empty/truncated (`Unexpected end of file in source map`). Server logs a Yahoo Finance 404 for `LTIM.NS`; its 10-minute refresh scheduler starts. |

The original first `npm install` did not return output within the initial wait and was interrupted; a second install completed. No before-install dependency state was present in the clone.

## Blocker

- **Data integrity / live market claims — `server/data/derivativesData.js`, `server/data/fiiDiiData.js`, `server/data/ipoAnnouncements.js`, `server/services/marketData.js`, `README.md`:** F&O strikes and OI changes are generated locally (including `Math.random()`), PCR and max pain are derived from fabricated distributions, FII/DII values are fixed but stamped with the current date, IPO/corporate-action entries are static, and README presents G-Sec/repo values as current. Quote code uses Yahoo Finance public chart endpoints, contrary to README claims of permitted authoritative feeds. This can present invented or stale data as live. **Plan:** trace all user-facing fields to sources; hide unsupported metrics or label dated reference/sample data and provide provenance/as-of metadata.
- **Credential handling — `src/components/common/SettingsModal.tsx`, `src/services/api.ts`, `server/index.js`, `server/services/geminiService.js`:** UI accepts a Gemini key and sends it to an in-memory server setting endpoint. This contradicts README's claim that users configure only a server-side key and lacks an account-scoped secure secret store. **Plan:** remove per-user key submission and use server environment configuration only; ensure request bodies and logs never expose credentials.

## Major

- **Dev server fails — `package.json`, installed Lucide dependency:** `npm run dev` brings up Express but the Vite process fails parsing a broken Lucide source map. Production build passes. **Plan:** determine whether the package artifact is corrupted versus a dependency issue; clean reinstall/pin or update dependency and verify both dev and production builds.
- **Unreliable upstream integration — `server/services/marketData.js`:** Yahoo endpoints are called without a timeout, retry/backoff, upstream rate limiter, or circuit breaker. A live run returned 404 for `LTIM.NS`. Stale cache is returned for some quote failures but not consistently marked and candle failures can throw. **Plan:** shared bounded HTTP client, coalesced TTL cache, per-upstream breaker, and explicit stale/error metadata.
- **Serverless incompatibility — `server/index.js`, `server/services/refreshScheduler.js`, `vercel.json`, `api/index.js`:** Express startup starts a ten-minute in-process interval while Vercel routes through a serverless adapter. The refresh loop cannot be relied on in a serverless runtime. **Plan:** identify canonical deployment and use on-demand TTL refresh or a Vercel Cron endpoint; share route service logic.
- **Generated side project — `screen-to-code-sidekick-main/`:** unrelated Vite application and its own prompt files are committed at root. No imports from it were found in `src/`, `server/`, or `api/`. **Plan:** remove after confirming no intended deliverable depends on it.
- **Prompt artifacts — `/PROMPT.md`, `/PROJECT_PROMPT.md`:** repository root contains extensive AI prompt documents. **Plan:** move any durable technical requirements to concise project docs and remove prompt artifacts.
- **Security/behavior mismatch — `server/services/brokerService.js`, `src/context/TradingContext.tsx`:** UI contains virtual trading flows and broker-shaped operations. Randomly generated simulation IDs occur in code; actual broker integration and side effects have not been validated. **Plan:** clearly label simulation behavior, constrain endpoints, validate inputs, and avoid claims that simulated orders are exchange orders.
- **Mobile/accessibility unknowns — all `src/pages/*`, `src/components/*`:** the required six viewport widths, keyboard flows, screen-reader checks, tap target measurements, and visual regressions were not run in this baseline. **Plan:** browser-based page-by-page inspection and automated accessibility checks after implementation.
- **Quality gates missing — `package.json`, `.github/workflows/`:** no lint, typecheck, e2e, accessibility, coverage, or Lighthouse scripts/workflows were found. Only a small Node test suite exists. **Plan:** add scoped static checks and journey tests, then configure CI.

## Minor

- **Watchlist robustness — `src/context/WatchlistContext.tsx`:** watchlist is stored as unversioned JSON in localStorage; source inspection found direct reads/writes without visible corruption or storage-denial handling. Cross-tab sync and import are not evident. **Plan:** versioned validation, guarded storage, sync, and export/import.
- **Large initial bundle — Vite build output:** 940.17 kB minified JS entry chunk. **Plan:** split route/page bundles and heavy chart modules; compare build output after changes.
- **No repeatable source inventory report:** project includes React/TypeScript client, Express backend, Vercel adapter, and one Node test file. `server/index.js` defines many routes in one file (market, stocks, AI, broker, scheduler, news, and others), increasing validation/error-handling drift. **Plan:** modular route/service boundaries with consistent response/error handling.

## Polish / documentation drift

- **`README.md`:** claims no fake demo values, authoritative feeds, real-time data, and secure server-only Gemini configuration. Source inspection contradicts these statements (see Blocker). It also advertises 16 page modules; routes/pages need a full behavior-by-behavior verification before those claims can be retained.
- **Data provenance:** quote payload strings such as “NSE / Yahoo Finance Public Feed” and “NSE, BSE, MCX Official Feeds via Public Aggregator” overstate what was verified. Record the actual upstream and delay per response.
- **Initial runtime output:** startup and service code use direct `console.log`/`console.error` messages without a shared request ID or structured logger.

## Required checks not completed in this baseline

- No Lighthouse runs or desktop/mobile screenshots were captured; browser automation and a page-by-page visual pass are not part of this command baseline.
- No click-through inventory of every control was completed.
- No exhaustive API route curl sweep or latency/validation matrix was completed. The server starts, but a single upstream quote failure was observed during startup refresh.
- The instruction to read every source file, especially each of the 16 page implementations, remains an outstanding audit task; this document records findings from repository inventory, configs, representative files, and targeted source searches rather than claiming exhaustive review.
- No lint command exists. No coverage tool/configuration exists.

## Root cause and work order

1. Make data provenance and credential handling truthful and safe before visual polish.
2. Fix local development, define serverless versus long-lived deployment behavior, and centralize resilient upstream access.
3. Verify every existing page and interaction before replacing or removing it.
4. Establish lint, type, unit, integration, browser, accessibility, and performance checks before claiming completion.
