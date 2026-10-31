# UI / UX audit

Audit date: 2026-10-31. This is a source-based audit. It does not claim pixel QA across every screen size; `docs/QA_MATRIX.md` records what remains to verify.

## System-level violations

| Area | Evidence | Rule | Finding |
|---|---|---|---|
| Browser zoom | `index.html:6` | UI brief §6.3 | `maximum-scale=1,user-scalable=no` blocks zoom. Removed in this pass. |
| Typography | `index.html:12-14`, `tailwind.config.js` | UI brief §2.2, §10 | Remote Google Fonts load several weights and two families. Removed external font request; system sans and mono stacks remain. |
| Theme | `src/index.css`, `tailwind.config.js` | UI brief §2, §9 | Cool white/navy palette, arbitrary colors, gradients, neon accents, large radii and shadows were inconsistent. Shared paper/graphite tokens now override much of the shell. |
| Layout | `src/App.tsx`, `src/components/common/Navigation.tsx` | UI brief §4 | Desktop used a crowded horizontal strip. Replaced with a 232 px sidebar and a 64 px tablet rail; mobile uses a bottom bar and drawer. |
| Motion | `src/hooks/useScrollAnimation.ts`, `src/App.tsx`, `src/index.css` | UI brief §1, §5, §6 | Route content used entrance classes and card lift. Removed the global scroll-animation hook and disabled decorative fade/zoom/glow/float/ticker effects. |
| Homepage | `src/pages/OverviewPage.tsx` | UI brief §4.4 | Large promotional hero displaced market data. Replaced with a market heading and session status. |
| Mobile nav | `src/components/common/MobileBottomNav.tsx`, `src/components/common/Header.tsx` | UI brief §4.1 | Prior floating gradient Trade control displaced common destinations and search was hidden on phone. Bottom tabs now show Markets, Stocks/Assets, Watchlist, News and More; header provides Search. |
| Contrast and affordance | `src/index.css` | UI brief §11 | Several styles relied on color alone and removed focus outlines. Shared visible keyboard focus added; comprehensive WCAG contrast and deuteranopia review remains outstanding. |
| Page-specific visual language | `src/pages/*.tsx`, `src/components/**/*.tsx` | UI brief §1, §2, §7 | Many pages still contain hardcoded colors, gradients, emoji, pills, dense text and inconsistent interactions. The shell overrides remove many decorative effects, but pages have not yet been fully migrated to reusable primitives. |

## Checks by screen

| Screen | Source review status | Main remaining issues |
|---|---|---|
| Overview | Updated | Dense benchmark/mover cards and hardcoded empty-data fallbacks still need correction. |
| Stock detail | Partial | Trade card and report include recommendation/target language; compact header and chart expansion not implemented. |
| Stocks / indices | Partial | Dense table/filter treatment; numeric alignment and 320 px overflow need browser QA. |
| Watchlist | Partial | Storage robustness and list row design need further work. |
| News | Partial | Sentiment method and empty/error specifics need review. |
| Commodities / FX | Partial | Source/delay labels need per-market validation. |
| Derivatives | Known data integrity block | No licensed option-chain source is configured; fabricated output must be suppressed. |
| Risk / scenarios / AI report | Known data integrity block | Unvalidated scores, confidence, forecasts and recommendations must not be presented as measured. |
| Patterns | Known data integrity block | Uploaded-image AI produces fabricated trade levels; replace with real OHLC heuristic output. |
| Chat | Known data integrity block | Existing model prompt and fallback add unsupported numbers and advice; replace with grounded facts only. |

## Anti-slop audit status

The previous version failed the gradient, glow, generic hero, long-label navigation, animation, and zoom checks. This pass addresses those shell-level issues. The 15 checks have not been completed for every page and are not claimed as passed. Remaining findings are tracked above and in the functional diagnosis.
