# UI QA matrix

Status as of 2026-10-31. A checked build is not a substitute for browser or device QA.

| Scenario | 360 px Android | 390 px iPhone | 430 px | 768 px | 1440 px | Result |
|---|---:|---:|---:|---:|---:|---|
| Source build | n/a | n/a | n/a | n/a | n/a | Build passes. |
| Typecheck and unit tests | n/a | n/a | n/a | n/a | n/a | Typecheck passes; 23 tests pass. |
| Live scenario API smoke test | n/a | n/a | n/a | n/a | n/a | BTC-USD and RELIANCE.NS both returned 15-minute and 1-hour scenarios with quote source/time metadata. |
| Assistant API smoke test | n/a | n/a | n/a | n/a | n/a | USD quote response showed USD, source and timestamp; Gemini was not configured in this environment, so grounded fallback was active. |
| Navigation visual/keyboard review | Pending | Pending | Pending | Pending | Pending | New responsive shell is implemented; visual review outstanding. |
| 200% / 400% zoom and 320 CSS px reflow | Pending | Pending | Pending | Pending | Pending | Viewport zoom restriction removed; actual reflow not yet measured. |
| Color contrast / screen reader | Pending | Pending | Pending | Pending | Pending | Visible focus styles added; automated axe review outstanding. |
| Offline, stale and reconnect behavior | Pending | Pending | Pending | Pending | Pending | Not verified. |
| Live tick / source labels | Pending | Pending | Pending | Pending | Pending | No licensed live feed configured. |
| Screenshots, light and dark | Pending | Pending | Pending | Pending | Pending | Not captured. |
