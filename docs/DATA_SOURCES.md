# Data sources and limits

| Data | Current source in code | Update / status | Limit |
|---|---|---|---|
| NSE/BSE equities and indices | Yahoo Finance chart endpoints in `server/services/marketData.js` | Cached public quote/history calls; actual exchange delay is not measured here. | Unofficial, no redistribution license established, not safe to call real-time or official. The UI must show source and received time. |
| NSE stock directory | `archives.nseindia.com/content/equities/EQUITY_L.csv` in `server/services/nseDirectory.js` | Loaded at server startup. | Public directory source; not a quote feed. |
| Crypto | Binance public ticker/klines endpoints in `server/services/marketStream.js`, `src/services/api.ts`, and `src/context/MarketStreamContext.tsx` | Browser WebSocket updates plus server REST snapshots. | Not licensed for redistribution review. |
| News | RSS sources in `server/services/newsService.js` | In-memory cache. | Publisher terms, completeness and sentiment methodology require review. |
| F&O option chain | None configured. | Unavailable. | No live PCR, OI or max pain is published until a source is added. |
| FII/DII flows | None configured. | Unavailable. | The committed static sample is not valid current data. |
| IPO/corporate actions | No reliable adapter configured. | Unavailable. | Committed sample entries are not presented as current exchange announcements. |
| Live scenarios / signal hit rates | Recent 5-minute candles and latest available quote; live prices re-anchor ranges. | Scenario inputs refresh every 15 seconds; live crypto ticks re-anchor continuously. | Experimental recent-return drift and volatility envelopes only; not calibrated probability forecasts and no holdout accuracy is claimed. |

For public redistribution of exchange data, configure a feed with explicit redistribution rights. Until then the application must label public-feed quotes as delayed/unverified and show last received time.
