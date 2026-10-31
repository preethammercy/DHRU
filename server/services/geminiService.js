export async function askDhruAssistant({ query, currentContext }) {
  const text = String(query || '').trim();
  const q = text.toLowerCase();
  const context = currentContext && typeof currentContext === 'object' ? currentContext : null;
  const symbol = typeof context?.symbol === 'string' ? context.symbol : null;
  const instrument = typeof context?.name === 'string' ? context.name : symbol;
  const number = value => value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : null;
  const price = number(context?.price);
  const currency = typeof context?.currency === 'string' ? context.currency : 'INR';
  const currencyLabel = currency === 'USD' ? '$' : `${currency} `;
  const change = number(context?.changePercent);
  const source = typeof context?.source === 'string' && context.source.trim() ? context.source : 'Source unavailable';
  const asOf = context?.lastUpdated && Number.isFinite(Date.parse(context.lastUpdated))
    ? new Date(context.lastUpdated).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST'
    : 'time unavailable';
  const heading = instrument ? `${instrument} (${symbol})` : 'The open market view';
  const footer = `\n\nSource: ${source}. As of: ${asOf}.`;

  if (!text) return { reply: 'Enter a question about a displayed market fact.', engine: 'Grounded facts', sourceContext: symbol };
  if (/\b(should i buy|should i sell|buy or sell|will .+ go up|target price|price target|recommend(?:ation)?|good investment)\b/i.test(text)) {
    const facts = price ? ` Current displayed price for ${heading}: ${currencyLabel}${price}${change !== null ? ` (${change}% change)` : ''}.` : ' No current quote is attached to this question.';
    return { reply: `I can’t recommend a trade or provide a price target.${facts}${footer}`, engine: 'Grounded facts', sourceContext: symbol };
  }

  if (!context) {
    return { reply: `No instrument data is attached. Open a stock or index, then ask about its displayed quote or indicators.${footer}`, engine: 'Grounded facts', sourceContext: null };
  }

  const facts = [];
  const add = (label, value, unit = '') => {
    const formatted = number(value);
    if (formatted !== null) facts.push(`${label}: ${formatted}${unit}`);
  };

  if (/\b(price|quote|trading at|change|day high|day low|open|volume|previous close)\b/.test(q)) {
    add('Price', context.price, ` ${currency}`);
    add('Change', context.change, ` ${currency}`);
    add('Change', context.changePercent, '%');
    add('Day high', context.dayHigh, ` ${currency}`);
    add('Day low', context.dayLow, ` ${currency}`);
    add('Open', context.open, ` ${currency}`);
    add('Previous close', context.previousClose, ` ${currency}`);
    add('Volume', context.volume);
  }
  if (/\b(rsi|relative strength)\b/.test(q)) add('RSI', context.technicals?.rsi);
  if (/\b(macd)\b/.test(q)) add('MACD', context.technicals?.macd?.value);
  if (/\b(sma|moving average)\b/.test(q)) {
    add('SMA 20', context.technicals?.sma?.sma20, ` ${currency}`);
    add('SMA 50', context.technicals?.sma?.sma50, ` ${currency}`);
    add('SMA 200', context.technicals?.sma?.sma200, ` ${currency}`);
  }
  if (/\b(pivot|support|resistance|levels)\b/.test(q)) {
    add('Pivot', context.technicals?.pivots?.pivot, ` ${currency}`);
    add('Support 1', context.technicals?.pivots?.s1, ` ${currency}`);
    add('Resistance 1', context.technicals?.pivots?.r1, ` ${currency}`);
  }
  if (/\b(risk|score|rating)\b/.test(q)) {
    if (typeof context.risk?.rating === 'string') facts.push(`Risk classification: ${context.risk.rating}`);
    add('Risk score', context.risk?.score, ' / 100');
  }
  if (/\b(pattern|doji|hammer|engulfing|candlestick)\b/.test(q)) {
    const patterns = context.technicals?.patterns;
    if (Array.isArray(patterns) && patterns.length) facts.push(`Heuristic candle patterns: ${patterns.map(p => p.name).filter(Boolean).join(', ')}`);
  }

  if (facts.length) {
    return { reply: `${heading}\n${facts.join('\n')}.\nThese are descriptive values, not a trading recommendation.${footer}`, engine: 'Grounded facts', sourceContext: symbol };
  }

  if (/\b(doji|hammer|rsi|macd|moving average|candlestick|pcr|max pain)\b/.test(q)) {
    const glossary = q.includes('doji') ? 'A Doji is a candle where the open and close are near each other relative to the full candle range.'
      : q.includes('hammer') ? 'A Hammer is a candle shape with a relatively long lower shadow. Its context matters; it does not predict a reversal by itself.'
      : q.includes('rsi') ? 'RSI is a momentum indicator calculated from recent gains and losses. It describes recent momentum; it does not measure fair value.'
      : q.includes('macd') ? 'MACD compares two moving averages and a signal line to describe trend momentum.'
      : q.includes('max pain') ? 'Max pain is a descriptive calculation from option open interest. No verified option-chain source is configured here.'
      : q.includes('pcr') ? 'Put-call ratio compares put and call activity. No verified option-chain source is configured here.'
      : 'A moving average smooths past prices over a chosen number of periods.';
    return { reply: glossary + footer, engine: 'Grounded facts', sourceContext: symbol };
  }

  return { reply: `I don’t have verified facts for that question. Ask about the open instrument’s displayed price, range, RSI, moving averages, pivots, risk score, or heuristic candle patterns.${footer}`, engine: 'Grounded facts', sourceContext: symbol };
}
