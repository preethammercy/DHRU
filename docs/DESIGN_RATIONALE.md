# Design rationale

## Direction: Quiet Ledger

Use paper-like neutrals in light mode, graphite surfaces in dark mode, one restrained blue action/focus color, tabular figures, hairline dividers, and flat navigation. Market screens should lead with session context and values, not marketing copy. Keep motion to state changes and loading feedback; avoid decorative movement.

## Palette

The core values follow the supplied design brief: light page `#F6F5F1`, white surface, muted surface `#F0EEE8`, border `#E3E0D8`, primary text `#16181C`, secondary text `#5B6068`, action ink `#1C2B45`, and focus blue `#2C5EC8`. Dark mode is a designed graphite palette with `#111317` page, `#181B21` surface, `#20242B` muted surface and `#ECEDEF` text. Positive and negative values use separate green/red tokens; UI must retain signs and arrows alongside color.

## Typography

Use system sans and system monospace stacks instead of downloading remote font files. This avoids a third-party render-blocking request and supports offline use. Tabular numerals are enabled globally. The rupee glyph uses platform fallback fonts; it has not been visually checked on Android and iOS in this pass. An editorial serif is omitted because no dedicated methodology/learning page is currently present.

## Layout and shape

The desktop shell now uses a left navigation rail, collapsed at tablet widths; mobile keeps the five primary destinations in a bottom bar and places search in the top bar. Panels use a 10 px radius, controls 6 px, and shadows are removed from content surfaces. The terminal remains full-width for chart use.

## Motion

Decorative scroll entrances, lift, zoom, glow, floating and ticker animations are disabled. The status indicator and loading feedback remain. Price-flash timing and sheet drag motion have not been redesigned yet.

## Costs and open items

System fonts vary slightly by platform. Global CSS overrides currently coexist with legacy utility classes, so the full source still needs token-by-token migration. No screenshot comparison, browser zoom matrix, contrast tool, or real-device review has been completed.
