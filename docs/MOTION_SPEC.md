# Motion specification

Durations and easings are centralized in `src/design/motion.ts` (`micro=.08`, `fast=.12`, `base=.2`, `panel=.28` seconds; ease-out `[.2, 0, 0, 1]`). The app is wrapped once in `MotionConfig reducedMotion="user"`.

| Motion | Component / trigger | Duration and easing | Reduced-motion behavior | Verification |
|---|---|---|---|---|
| Page change | `App.tsx`, when `activeNav` changes; direction follows the retained navigation ordering | `base` (200 ms), 16 px horizontal travel, ease-out | Hook changes to opacity-only, `fast` (120 ms) | Existing Node suite does not cover UI; Playwright page-timing test remains outstanding. |
| Desktop navigation indicator | `Navigation.tsx`, active destination changes | `base`, shared `layoutId`, ease-out | MotionConfig disables transform motion | No browser interaction test available. |
| Chart timeframe indicator | `TradingViewChart.tsx`, selected interval changes | `base`, shared `layoutId`, ease-out | MotionConfig disables transform motion | No browser interaction test available. |
| Search overlay and sheet | `UniversalSearchModal.tsx`, `isOpen` true/false | Backdrop `base`; desktop scale/fade `base`; mobile sheet `panel`; ease-out | `fast` opacity only / no travel | Component drag threshold is 40% of sheet height or >800 px/s; keyboard Escape and focus restoration remain. Automated Playwright sheet test is outstanding. |
| Settings dialog/sheet | `SettingsModal.tsx`, `isOpen` true/false | Backdrop `base`; desktop scale/fade `base`; mobile sheet `panel`; ease-out | `fast` opacity only / no travel | Existing settings controls remain; automated focus/escape parity test is outstanding. |
| Button press | All enabled native buttons via `src/index.css` | `micro` (80 ms), scale .98 | CSS reduced-motion rule removes the transition | Existing Node suite has no DOM click-count checks. |
| Focus and control colors | Native controls, hover/focus-visible | `fast` (120 ms), ease-out | Instant/minimal transition | Focus ring is visible for keyboard focus; no axe run available. |
| Price row flash | Existing `flash-up`/`flash-down` classes | 500 ms background-color fade at 8% tint | Off | The source context owns flash cadence and is protected; it can emit changes more frequently than the requested 2 s cap. See `KNOWN_ISSUES.md`. |
| Live status dot | Existing `.animate-ping` status classes | 1.6 s opacity pulse | Static | CSS honors reduced motion; market visibility gating is not in the presentation layer and has not been browser-tested. |
| Chart first draw | `.chart-first-draw` container | 300 ms opacity fade | Off | Chart build passed; no browser frame capture. |
| Chart timeframe series | Canvas opacity changes on `activeInterval` | 200 ms cross-fade; ease-out | Global reduced-motion rule shortens CSS transitions | Not browser-tested; no chart-frame capture. |
| Skeleton shimmer | No shimmer animation is enabled; blocks remain static | Static | Static | Existing screens still use some spinners; see the design audit. |
| Dropdowns / tooltips / accordion / toast | Existing product-specific controls | Shared primitive targets: 120 ms overlay, 300 ms tooltip delay, 200 ms accordion, 200/120 ms toast | CSS reduced-motion override | No shared components/tests exist for all of these in this repository. |

No spring or bounce transition is configured. Motion is visual and does not gate page mounting or data requests. The baseline did not contain Playwright, so interaction and frame-budget claims remain unverified.
