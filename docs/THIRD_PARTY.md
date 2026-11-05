# Third-party design assets and packages

| Item | Source / version | Licence | Derived or affected files |
|---|---|---|---|
| Geist Sans variable WOFF2 | `vercel/geist-font`, revision `2e554ff2ea3979b63afe770af6424eb8b9490a74` | SIL OFL 1.1; license retained at `public/fonts/OFL.txt` | `public/fonts/Geist-Variable.woff2`, `src/design/tokens.css`, `index.html`, `tailwind.config.js` |
| Motion | `motion@14.9.0`, `motiondivision/motion` | MIT; dependency package includes its license | `src/main.tsx`, `src/App.tsx`, `src/components/common/Navigation.tsx`, `src/components/common/UniversalSearchModal.tsx`, `src/components/common/SettingsModal.tsx`, `src/components/chart/TradingViewChart.tsx` |
| Lucide React | Existing `lucide-react@0.475.0` | ISC | Existing icons retained; no source copied |
| TradingView Lightweight Charts | Existing `lightweight-charts@4.2.3` | Apache 2.0 | Existing chart library retained |

No shadcn/ui, Radix, Vaul, Tremor, or paid template source was copied. Geist was obtained unmodified from the upstream WOFF2 distribution. Motion is used as an installed library, not copied source.
