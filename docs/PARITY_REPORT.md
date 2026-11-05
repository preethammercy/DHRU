# Baseline and parity report

## Baseline before presentation changes

- Repository: `https://github.com/preetham999gaming-sys/dhru8`, branch `main`, cloned into this workspace on 2026-11-02.
- `npm ci`: completed. npm reported 10 audit findings (4 moderate, 6 high) and install-script approval notices for Firebase/esbuild/protobufjs packages.
- `npm run build`: passed with Vite 6.4.4; JS 939.56 kB (231.47 kB gzip), CSS 95.14 kB (15.31 kB gzip). Vite warned for the >500 kB JS chunk.
- `npm test`: 18 tests passed across six Node test suites.
- `npm start`: server started on port 5000; 2,635 listings indexed; one `LTIM.NS` quote returned 404 during initial refresh.
- `server/index.js` declares 31 route statements (some include aliases/arrays). API response snapshots and complete route requests were not captured.
- No Playwright setup, F-01–F-32 browser tests, screenshot baseline, axe, Lighthouse, console/network, or storage-shape baseline was present.
- No baseline commit was created. The baseline work was not committed before presentation edits.

## Presentation implementation

- Token/theme foundation, compact shared CSS, local Geist and OFL file, Tailwind token mapping, Motion configuration/tokens, page/navigation/timeframe/search/settings/chart motion, and chart visual options are in the source.
- Indian and crypto desks now have separated asset lists, search results, quote formats, remembered symbols, and market-specific portfolios. The default theme follows the OS and restores motion while respecting reduced-motion preferences.
- AI analysis supports 12 Indian tickers/indices and 20 USD-quoted crypto tickers; setups update from the selected instrument's available live quote. Explicit paper auto-trade plans monitor entry, stop, and target across the app while its tab and feed remain active.
- Automatic orders are simulation-only and browser-side. No real broker order execution or unattended/server-side execution is enabled.
- Protected server/API/data/service/context/types files, request/response handling, route mappings, storage keys/shapes, labels, disclosures, and calculations were not modified.

## Verification after changes

- `npm run build`: passed with Vite 6.4.4; JS 1,095.53 kB (285.44 kB gzip), CSS 96.44 kB (15.62 kB gzip). The production JS remains over Vite's 500 kB advisory limit.
- `npm test`: all 18 existing Node tests pass.
- Bundle change measured against baseline: JS gzip grew by 53.97 kB (231.47 → 285.44 kB), below the requested 60 kB target. No feature/component bundle split was measured.
- API response parity cannot be reported as an HTTP snapshot diff; no API/service/context/server source changed.
- Every route and storage shape was left as the baseline code defined them; no browser baseline was available to compare live behavior.
- Feature and motion tests F-01–F-32, reduced-motion text comparison, one-click test, sheet focus/drag test, frame budget, 200% zoom, axe, Lighthouse, screenshot matrix, no-scroll test, API snapshots, and console/network comparison were not run. Do not interpret build/unit test passes as full prompt acceptance.

See `KNOWN_ISSUES.md` for the remaining parity and audit gaps.
