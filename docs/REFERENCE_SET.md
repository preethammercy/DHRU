# Reference set

| Source | Version / revision | Licence | Use in project |
|---|---|---|---|
| [Vercel Geist](https://github.com/vercel/geist-font) | `2e554ff2ea3979b63afe770af6424eb8b9490a74` (main at 2026-11-02) | SIL Open Font License 1.1, confirmed in upstream `OFL.txt` | `public/fonts/Geist-Variable.woff2`; full license at `public/fonts/OFL.txt` |
| [Motion](https://github.com/motiondivision/motion) | npm package `motion@14.9.0` | MIT, confirmed in installed package metadata and `node_modules/motion/LICENSE.md` | MotionConfig and visual transitions in `src/main.tsx`, `src/App.tsx`, `src/components/common/Navigation.tsx`, `src/components/common/UniversalSearchModal.tsx`, `src/components/common/SettingsModal.tsx`, and `src/components/chart/TradingViewChart.tsx` |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | Not used | MIT (per upstream repository) | No source copied |
| [Radix UI](https://github.com/radix-ui/primitives) | Not used | Not independently checked | No dependency or source copied |
| [Vaul](https://github.com/emilkowalski/vaul) | Not used | Not independently checked | No dependency or source copied |
| [Tremor](https://github.com/tremorlabs/tremor) | Not used | Not independently checked | No dependency or source copied |
| TradingView Lightweight Charts | Existing dependency `lightweight-charts@4.2.3` from lockfile | Apache 2.0 (existing package) | Existing chart retained; options restyled through tokens |

No dashboard template or shadcn component source was copied. Existing Lucide icons and chart dependencies remain unchanged.
