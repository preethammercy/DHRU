# Motion specification

## Allowed

- Button, link, and focus feedback: 120 ms, ease-out. State changes remain visible with reduced motion.
- Loading indicators: only while work is pending. Do not animate market values as they update.
- Market-open status dot: may pulse while the tab is visible; show a static dot when closed or when reduced motion is requested.

## Removed

- Scroll-triggered fade and zoom on route content.
- Card hover lift and scale.
- Decorative glow, float, ticker, and animated gradient effects.

## Not yet implemented

- 200 ms route fade, value-change cross-fade, sheet drag/dismiss, chart expansion and chart-specific zoom behavior. These require page-level QA before shipping.
