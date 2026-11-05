// DHRU.AI - Market Condition & Risk Assessment Engine
// Provides an explicit, multi-factor, quantitative risk classification:
// Low, Moderate, High, Very High supported by verifiable mathematical inputs.

export function evaluateMarketWideRisk(niftyData, breadthData, macroData) {
  let score = 35; // Baseline neutral score
  const factors = [];
  const mitigations = [];

  // Factor 1: Drawdown from 52W High
  const niftyPrice = niftyData?.price || 22700;
  const nifty52High = niftyData?.fiftyTwoWeekHigh || 26277;
  const drawdownPct = ((nifty52High - niftyPrice) / nifty52High) * 100;

  if (drawdownPct > 15) {
    score += 25;
    factors.push({ name: 'Significant Benchmark Drawdown', impact: '+25 Risk', note: `NIFTY is down ${drawdownPct.toFixed(1)}% from its 52W peak, indicating structural correction.` });
  } else if (drawdownPct > 8) {
    score += 15;
    factors.push({ name: 'Moderate Pullback', impact: '+15 Risk', note: `NIFTY is down ${drawdownPct.toFixed(1)}% from peak, testing intermediate support levels.` });
  } else {
    mitigations.push({ name: 'Proximity to 52W Highs', impact: '-10 Risk', note: `NIFTY is within ${drawdownPct.toFixed(1)}% of its 52W high, reflecting broad structural strength.` });
    score -= 10;
  }

  // Factor 2: Market Breadth (Advances vs Declines)
  const advances = breadthData?.advances || 15;
  const declines = breadthData?.declines || 15;
  const breadthRatio = declines > 0 ? advances / declines : 1;

  if (breadthRatio < 0.6) {
    score += 20;
    factors.push({ name: 'Negative Market Breadth', impact: '+20 Risk', note: `Declining stocks heavily outnumber advancing stocks (${declines} Declines vs ${advances} Advances).` });
  } else if (breadthRatio > 1.5) {
    mitigations.push({ name: 'Positive Market Breadth', impact: '-15 Risk', note: `Broad participation with advancing stocks outpacing decliners (${advances} Advances vs ${declines} Declines).` });
    score -= 15;
  }

  // Factor 3: Macro Commodities (Crude Oil)
  const crude = macroData?.find(m => m.symbol === 'CL=F')?.price || 75;
  if (crude > 88) {
    score += 15;
    factors.push({ name: 'Elevated Crude Oil ($' + crude.toFixed(1) + '/bbl)', impact: '+15 Risk', note: 'Higher energy prices pressure India’s Current Account Deficit and fuel domestic inflation.' });
  } else if (crude < 75) {
    mitigations.push({ name: 'Subdued Crude Oil ($' + crude.toFixed(1) + '/bbl)', impact: '-10 Risk', note: 'Soft energy prices reduce imported inflation and improve corporate operating margins.' });
    score -= 10;
  }

  // Factor 4: Currency (USD/INR)
  const usdinr = macroData?.find(m => m.symbol === 'INR=X')?.price || 86;
  if (usdinr > 88) {
    score += 10;
    factors.push({ name: 'Rupee Depreciation Pressures (₹' + usdinr.toFixed(2) + '/$)', impact: '+10 Risk', note: 'Weaker rupee can trigger foreign institutional outflows (FII selling).' });
  }

  // Constrain score between 0 and 100
  const normalizedScore = Math.min(100, Math.max(5, Math.round(score)));

  let classification = 'Moderate';
  let badgeClass = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
  let description = 'Normal market volatility with balanced sector rotation. Disciplined risk management recommended.';

  if (normalizedScore <= 30) {
    classification = 'Low';
    badgeClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    description = 'Constructive environment. High market breadth, subdued macro headwinds, and strong technical support.';
  } else if (normalizedScore > 55 && normalizedScore <= 75) {
    classification = 'High';
    badgeClass = 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    description = 'Heightened vulnerability. Deteriorating breadth, adverse external shocks, or significant overhead resistance.';
  } else if (normalizedScore > 75) {
    classification = 'Very High';
    badgeClass = 'text-red-500 bg-red-600/15 border-red-500/40';
    description = 'Extreme caution required. Multiple compounding systemic risk factors across breadth, commodities, and technical breakdowns.';
  }

  return {
    score: normalizedScore,
    classification,
    badgeClass,
    description,
    factors,
    mitigations,
    metrics: {
      drawdownPct: Number(drawdownPct.toFixed(2)),
      breadthRatio: Number(breadthRatio.toFixed(2)),
      crudePrice: crude,
      usdInr: usdinr
    },
    methodology: 'Multi-factor composite scoring combining 52W benchmark drawdown, advance/decline breadth, imported macro commodity pressures, and currency volatility.'
  };
}

export function evaluateInstrumentRisk(stockQuote, technicals, recentNews = []) {
  if (!stockQuote) return null;

  let riskScore = 40; // baseline
  const positiveSignals = [];
  const riskSignals = [];

  const price = stockQuote.price;
  const high52 = stockQuote.fiftyTwoWeekHigh || price;
  const low52 = stockQuote.fiftyTwoWeekLow || price;

  // 1. Drawdown from 52W High
  const drawdown = high52 > 0 ? ((high52 - price) / high52) * 100 : 0;
  if (drawdown > 30) {
    riskScore += 25;
    riskSignals.push(`Deep drawdown of ${drawdown.toFixed(1)}% from 52-week high indicates lingering selling pressure.`);
  } else if (drawdown < 6) {
    riskScore -= 10;
    positiveSignals.push(`Trading within ${drawdown.toFixed(1)}% of 52-week peak, demonstrating sustained relative strength.`);
  }

  // 2. Technical indicator agreement / conflict
  if (technicals) {
    if (technicals.rsi != null) {
      if (technicals.rsi > 75) {
        riskScore += 15;
        riskSignals.push(`RSI is in heavily overbought territory (${technicals.rsi}), increasing probability of mean-reversion pullbacks.`);
      } else if (technicals.rsi < 28) {
        riskScore += 10;
        riskSignals.push(`RSI is oversold (${technicals.rsi}); while potentially bottoming, it confirms severe downside momentum.`);
      } else {
        positiveSignals.push(`RSI is balanced in the healthy zone (${technicals.rsi}).`);
      }
    }

    if (technicals.sma?.sma200) {
      if (price < technicals.sma.sma200) {
        riskScore += 20;
        riskSignals.push(`Price is trading below its 200-day Simple Moving Average (₹${technicals.sma.sma200}), indicating long-term downtrend.`);
      } else {
        riskScore -= 15;
        positiveSignals.push(`Price comfortably holds above the critical 200-day SMA institutional support (₹${technicals.sma.sma200}).`);
      }
    }

    if (technicals.bollinger) {
      if (technicals.bollinger.bandwidth > 25) {
        riskScore += 10;
        riskSignals.push(`Bollinger Bandwidth is elevated (${technicals.bollinger.bandwidth}%), signaling high historical price volatility.`);
      }
    }
  }

  // 3. Negative News count
  const negativeNews = recentNews.filter(n => n.sentiment === 'Bearish').length;
  if (negativeNews >= 2) {
    riskScore += 15;
    riskSignals.push(`${negativeNews} recent negative media or regulatory headlines identified.`);
  }

  const finalScore = Math.min(100, Math.max(10, Math.round(riskScore)));

  let rating = 'Moderate';
  let badgeColor = 'amber';
  if (finalScore <= 30) {
    rating = 'Low';
    badgeColor = 'emerald';
  } else if (finalScore > 55 && finalScore <= 75) {
    rating = 'High';
    badgeColor = 'rose';
  } else if (finalScore > 75) {
    rating = 'Very High';
    badgeColor = 'red';
  }

  return {
    score: finalScore,
    rating,
    badgeColor,
    positiveSignals,
    riskSignals,
    drawdownPct: Number(drawdown.toFixed(2)),
    methodology: 'Evaluated using 200-day trend posture, 52-week drawdown, RSI extremes, historical volatility, and sentiment checks.'
  };
}
