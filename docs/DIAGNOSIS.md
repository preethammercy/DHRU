# Functional diagnosis

Audit date: 2026-10-31. Repository source review, baseline run, and targeted searches.

| Severity | Evidence | Root cause | Planned / current response |
|---|---|---|---|
| Blocker | `server/data/derivativesData.js:4-47` | Fabricated OI/PCR, random OI changes, fixed volatility and max-pain values claim exchange origin. | Suppress until a licensed option-chain adapter exists; show unavailable state. |
| Blocker | `server/data/fiiDiiData.js:4-34` | Fixed institutional flow figures are labeled with the current date and attributed to an exchange source. | Suppress and disclose missing source. |
| Blocker | `server/services/predictionEngine.js:134-253`, `src/pages/AiPredictionsPage.tsx` | ATR multipliers are presented as probabilistic forecasts, with hardcoded probabilities, win-rate/confidence and trade targets. | Pause predictive output until an out-of-sample evaluation exists; retain descriptive indicator facts only. |
| Blocker | `server/services/geminiService.js:245-500+` | The model is instructed to provide action/targets; fallback injects fabricated levels, market facts, advice and default ratings. | Replace chat output with deterministic renderers sourced only from attached context; refuse recommendations and say when facts are absent. |
| Blocker | `src/pages/PatternExplorerPage.tsx`, `/api/ai/scan-image` | Vision response is used to annotate uploaded chart with trade action, stop, targets, risk/reward and confidence. | Remove the synthetic image-based recommendation flow; scanner should show real OHLC detections only. |
| Major | `server/services/marketData.js:67,203` | Yahoo Finance public endpoints are the actual equity source; they are unofficial and not documented as licensed live redistribution. | Label source as Yahoo Finance public feed and not live/official; document redistribution limits. A licensed feed is a deployment decision. |
| Major | `server/services/marketStream.js:400-440` | Timer-based polling and a randomized shuffled symbol batch can create gaps and consume upstream requests. | Replace random shuffle with deterministic rotation; stale labeling and subscription-aware polling remain work. |
| Major | `index.html:6` | The viewport prevented user zoom. | Fixed; pinch/browser zoom is enabled. |
| Major | `npm run dev` baseline | Vite failed due an empty Lucide source map after dependency installation. | Still needs clean-install investigation; production build passes. |
| Major | `server/services/refreshScheduler.js`, `server/index.js`, `api/index.js` | Long-lived intervals run alongside Vercel serverless routing. | Keep deployment topology documented and remove reliance on serverless timers in a later backend phase. |

## Chat investigation

- `askDhruAssistant` sends the entire question and partial context to Gemini with no numeric fact guard.
- The deterministic path classifies broad words and returns long fixed responses that invent data or conclusions when context fields are missing.
- The open symbol is sent, but its `lastUpdated`, `source`, day range, and exchange timestamp were omitted from the chat context.
- No question-aware cache was found in the route. A default branch causes unrelated questions to share one response.
- The chat answer path is being changed to use only finite supplied facts and explicit unavailable messages. LLM-generated factual prose remains disabled until a numeric guard and evaluation fixtures exist.

## Limits

No licensed exchange or broker credential is configured in this repository. No deployment environment was inspected. No external source terms were evaluated here, so this document makes no legal conclusion about redistribution.
