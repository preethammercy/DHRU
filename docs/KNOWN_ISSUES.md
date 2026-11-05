# Known issues and remaining acceptance gaps

## Prompt / product conflicts retained

- The user prompt requests zoom checks at 200%/400%, but `index.html` declares `maximum-scale=1.0, user-scalable=no`. The prompt permits editing that file only for theme metadata, font preloads, and the no-flash script, so the viewport setting was retained.
- F-18 names a standalone IPO & Corporate Actions page, and F-26 a Methodology & Sources page; neither exists as a page component in `src/pages/`. The repository has IPO API data and methodology text in other places. Adding either destination would change routes/features, so neither was invented.
- The running application also includes login, trading terminal, profile, and positions/holdings in addition to the README's 16 modules. Existing routes and navigation were retained.
- The prompt's two page-slide values differ (`4 px/180 ms` and `16 px/200 ms`); the later, detailed 16 px/200 ms specification is used.
- A desktop collapsible sidebar is specified, but the app has a horizontal destination bar and a mobile drawer. Replacing the structure with a sidebar would change navigation; no sidebar was introduced.
- Settings modal behavior remains as implemented. It does not gain drag dismissal, Escape handling, or new close rules. This differs from the new-motion acceptance section but preserves the explicit settings behavior lock.
- UI emoji glyphs remain in some existing labels and dynamic text because changing text/copy is forbidden. This means AS-03 is not fully met.

## Codebase limitations and issues found

- The Gemini API key is typed into the browser Settings modal, conflicting with the README statement that keys are never exposed to the client.
- The 10-minute background refresh loop requires a long-running process and does not run on serverless hosting.
- Reference values such as G-Sec yield and RBI repo rate may be static; labels and dates need checking.
- Symbols such as `^NSEI` and `.NS` suffixes use an unofficial quote source; terms and reliability need review.
- Prediction and scenario outputs are described probabilistically, but the repository does not show out-of-sample validation.
- Marketing copy includes claims such as “AI-powered”, “institutional-grade” and “100% functionality out of the box”; copy is protected and unchanged.
- `server/` and `api/` coexist as separate backends.
- The unrelated `screen-to-code-sidekick-main/` folder and prompt files are retained as required.

## Test and audit gaps

- The repository has no Playwright setup or F-01–F-32 feature tests. Existing tests cover calculation/trading engines only.
- No untouched API response snapshots were produced, so no before/after API body diff exists. The server, API, data, service, context, and type files have no changes in this patch.
- No full screenshot matrix, responsive 320–1920 px visual set, 200%/400% zoom capture, Lighthouse report, axe report, per-page console/network inventory, or storage-shape snapshot exists. The supplied screenshot shows a logged-in desktop Overview but cannot substitute for those captures.
- No browser-based verification of search focus/drag behavior, route timing, frame budget, theme contrast, or chart canvas was available. Motion and responsive style builds compile, but the visual acceptance audit is not a pass claim.
- Price flash styling fades in 500 ms, but `MarketStreamContext` owns the per-symbol flash cadence and is protected; the requested 2-second throttle is not proven.
- Some current loading states use spinners instead of content-shaped skeletons. No feature data or loading logic was changed.
- Settings lacks the requested Escape/focus-trap behavior in its baseline. Changing it conflicts with the instruction to preserve Settings behavior.
- The font is bundled from upstream with OFL; a direct local glyph-map check for ₹ was unavailable for the WOFF2 file, so U+20B9 rendering is not formally verified.
- The baseline clone was not committed before changes, and the requested `chore: baseline snapshots, no code changes` commit was not created. Complete baseline artifacts were not available before editing.
- npm reports 10 existing dependency audit findings (4 moderate, 6 high); dependencies were not broadly upgraded because runtime dependency versions are protected.
