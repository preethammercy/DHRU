# Design decisions

- 2026-11-02 — Used the specified Quiet Ledger light/dark palette and kept existing API, context, route, storage, and text behavior untouched.
- 2026-11-02 — Downloaded unmodified Geist variable WOFF2 from Vercel's official `vercel/geist-font` revision `2e554ff2ea3979b63afe770af6424eb8b9490a74`; retained the upstream OFL license in `public/fonts/OFL.txt` and switched font loading to a local preload with `font-display: swap`.
- 2026-11-02 — Added Motion `14.9.0` (MIT) for page, navigation, timeframe, search, and settings transitions. MotionConfig honors the user's reduced-motion setting. The production gzip increase is below the 60 KB target.
- 2026-11-02 — Applied mobile table horizontal scrolling within table containers to keep columns reachable. No page route, bottom navigation destination, or table data was removed.
- 2026-11-02 — The two prompt variants disagree on page movement (`4 px/180 ms` versus `16 px/200 ms`); selected `16 px/200 ms`, matching the later detailed Motion prompt.
- 2026-11-02 — Search is a draggable mobile sheet with 40%/high-velocity dismissal. Settings retains its existing close behavior because the theme prompt explicitly protects it.
- 2026-11-02 — No shadcn, Radix, Vaul, or Tremor source was copied. Existing purpose-built controls were retained to limit behavioral drift.
- 2026-11-02 — No desktop sidebar-collapse animation was introduced; the current product uses a horizontal destination bar and a mobile drawer, not a collapsible desktop sidebar.
- 2026-11-02 — Did not add an IPO page, Methodology route, or design-preview route; those would create destinations/features beyond the existing product contract.
