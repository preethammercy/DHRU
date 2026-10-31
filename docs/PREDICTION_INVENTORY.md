# Prediction and scoring inventory

| System | Current output | Input | Validation / issue | Status |
|---|---|---|---|---|
| Live market scenarios | 15-minute and 1-hour drift centers with recent-volatility envelopes | Latest quote and up to 60 recent 5-minute candles; price re-anchors on live ticks and model inputs refresh every 15 seconds | Experimental log-return drift and sample volatility; no calibration, costs, or holdout evaluation. Envelopes are not probability intervals. | Enabled as descriptive scenarios only; no recommendation or confidence claim. |
| Prediction engine | Entry, stop, targets, win-rate and confidence strings | ATR and technical score | Arithmetic rules are not validated predictive performance; fabricated “win rate” and trade recommendation. | Disable recommendations. |
| Risk engine | 0–100 market/instrument score | Drawdown, breadth, macro, technicals, news | Defaults invent NIFTY, crude, USD/INR and baseline risk values; weights are not validated. | Descriptive only after removing defaults. |
| Technical scorecard | Consensus and indicator signals | Candle history | Deterministic indicators, but Buy/Sell language overstates meaning. No outcome evaluation. | Label technical description, not recommendation. |
| Candlestick scanner | Heuristic patterns with “strength” levels | Recent OHLC candles | Rules lack versioned config and condition/context output; strength is not measured performance. | Heuristic only; no accuracy claim. |
| Backtester | Strategy trade results | Historical candles | Next-open execution is attempted, but no costs/slippage and open-position handling can misstate results. | Historical simulation, not a forward forecast. |
| F&O analytics | PCR, OI and max pain | Currently fabricated local arrays | No exchange option-chain data. | Unavailable. |
| News sentiment | Sentiment labels | RSS titles/descriptions | No calibrated method or validation. | Label as heuristic if retained. |
| Market breadth / institutional commentary | Advance/decline and flow text | Curated quote sample / static flows | Breadth is partial-universe; flow values are fabricated. | Breadth scope must be stated; FII/DII unavailable. |

No forward-scenario model has a verified out-of-sample record in the repository. The live scenarios are exposed with that limitation and no performance metrics are claimed.
