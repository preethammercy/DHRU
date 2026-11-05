# Design audit

Audit scope: shared CSS foundation only. The following status is for the repository as a whole, in both themes; page-by-page visual acceptance was not run.

| Check | Status | Note |
|---|---|---|
| AS-01 No gradient | Fail | Existing page classes and CSS retain gradients. |
| AS-02 Shadows only on overlays | Partial | Legacy card shadows removed; other shadow utilities remain. |
| AS-03 No emoji | Not audited | Existing UI strings/icons were not comprehensively scanned. |
| AS-04 Tokens only | Pass | Page and component colors use semantic tokens; chart and indicator color values are centralized in `src/design/chartTheme.ts`. |
| AS-05 Component states | Not audited | No storybook/test route. |
| AS-06 Skeleton shape | Not audited | No per-page visual review. |
| AS-07 Numeric alignment | Not audited | Tables require page-level review. |
| AS-08 Signed arrows | Not audited | Existing market values were not rewritten. |
| AS-09 No default shadcn styling | Pass by non-use | No shadcn code was added. |
| AS-10 Motion limits | Partial | Card hover/glow/float/ticker disabled; other legacy animations remain. |
| AS-11 Motion spec | Fail | Motion wrappers and sheet/tabs migration deferred. |
| AS-12 Reduced motion | Partial | Shared CSS rule added; CSS transforms outside this stylesheet may remain. |
| AS-13 Dominant element/page | Not audited | Requires page-by-page visual inspection. |
| AS-14 Empty/loading/error/stale states | Not audited | Requires page-level review. |
| AS-15 Distinctive page details | Not audited | Requires page-by-page visual inspection. |
