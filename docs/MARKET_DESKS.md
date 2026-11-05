# Market desks and automatic paper orders

## Separate desks

- Indian desk: NSE/BSE equities and indices, INR quotes, ₹10,00,000 paper capital.
- Crypto desk: cryptocurrency pairs only, USD quotes, $12,000 paper capital.
- Each desk has separate saved balances, positions, closed positions, orders, trade history, broker configuration, and risk settings. Existing shared portfolio data is retained under the Indian desk when migrating from the previous storage keys.
- The last selected instrument is saved so a refresh keeps the same asset. The AI analysis page also remembers its own selected ticker.
- With no saved theme choice, the app follows the computer's light/dark preference and updates if that preference changes. A manual theme choice is saved.

## AI report and paper auto-trade

The AI Predictions page recalculates the displayed setup from the selected asset's latest available quote and volatility inputs. DHRU Intelligence reports also include numeric entry, stop, and target levels in the quote currency. “Arm report auto-trade” or “Arm paper auto-trade” stores a snapshot of that report's entry zone, direction, stop, target 3, and quantity. It enters a simulated MIS position only when a live feed tick enters the armed zone, then places a simulated exit at the stop or target. The plan is monitored globally while the app tab remains open and can be canceled from the report.

This is a browser-side paper-trading feature. It does not place orders with Zerodha, Angel One, Dhan, a crypto exchange, or any other live broker. It requires the app tab and price feed to remain active; it is not a server-side or unattended execution service. Orders remain subject to the existing simulation margin and risk checks.

The report levels are model estimates based on the app's available quote/volatility data, not guaranteed future prices. A quote feed can be delayed, unavailable, or stale. The UI shows the latest tick timestamp; that timestamp and `isLive` flag are only as reliable as the underlying provider.
