// DHRU.AI - Production Multi-Broker Execution Engine
// Standardized integration for Zerodha Kite Connect, Angel One SmartAPI, DhanHQ & Sandbox Simulation

/**
 * Supported Retail Brokers & Exchanges
 */
export const SUPPORTED_BROKERS = {
  SIMULATION: 'simulation',
  ZERODHA: 'zerodha',
  ANGELONE: 'angelone',
  DHAN: 'dhan'
};

/**
 * Validate and sanitize order params before dispatch
 */
export function validateOrderParams(params) {
  const { symbol, side, product, orderType, quantity, price, triggerPrice } = params;

  if (!symbol || typeof symbol !== 'string') {
    throw new Error('Valid trading symbol is required');
  }
  if (!['BUY', 'SELL'].includes(side)) {
    throw new Error("Order side must be either 'BUY' or 'SELL'");
  }
  if (!['MIS', 'CNC'].includes(product)) {
    throw new Error("Product type must be 'MIS' (Intraday) or 'CNC' (Delivery)");
  }
  if (!['MARKET', 'LIMIT', 'SL', 'SL-M'].includes(orderType)) {
    throw new Error("Order type must be 'MARKET', 'LIMIT', 'SL', or 'SL-M'");
  }
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty <= 0) {
    throw new Error('Order quantity must be a positive integer');
  }
  if (['LIMIT', 'SL'].includes(orderType)) {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      throw new Error(`Limit price is required for ${orderType} orders`);
    }
  }
  if (['SL', 'SL-M'].includes(orderType)) {
    const numTrigger = parseFloat(triggerPrice);
    if (isNaN(numTrigger) || numTrigger <= 0) {
      throw new Error(`Trigger price is required for ${orderType} orders`);
    }
  }

  // Clean symbol: strip .NS or .BO suffix for broker tradingsymbol
  const cleanTradingSymbol = symbol.replace(/\.(NS|BO)$/i, '');
  const exchange = symbol.endsWith('.BO') ? 'BSE' : 'NSE';

  return {
    symbol: cleanTradingSymbol,
    exchange,
    side,
    product,
    orderType,
    quantity: qty,
    price: price ? parseFloat(price) : undefined,
    triggerPrice: triggerPrice ? parseFloat(triggerPrice) : undefined
  };
}

/**
 * Zerodha Kite Connect v3 Payload Formatter
 * Endpoint: POST https://api.kite.trade/orders/regular
 */
export function buildZerodhaPayload(validatedParams, apiKey, accessToken) {
  const { symbol, exchange, side, product, orderType, quantity, price, triggerPrice } = validatedParams;

  const payload = {
    tradingsymbol: symbol,
    exchange: exchange,
    transaction_type: side,
    order_type: orderType,
    quantity: quantity,
    product: product === 'MIS' ? 'MIS' : 'CNC',
    validity: 'DAY',
    disclosed_quantity: 0
  };

  if (price && ['LIMIT', 'SL'].includes(orderType)) {
    payload.price = price;
  }
  if (triggerPrice && ['SL', 'SL-M'].includes(orderType)) {
    payload.trigger_price = triggerPrice;
  }

  const headers = {
    'X-Kite-Version': '3',
    'Authorization': `token ${apiKey}:${accessToken}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  };

  return {
    url: 'https://api.kite.trade/orders/regular',
    headers,
    payload
  };
}

/**
 * Angel One SmartAPI v1 Payload Formatter
 * Endpoint: POST https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/placeOrder
 */
export function buildAngelOnePayload(validatedParams, jwtToken, apiKey, clientLocalIp = '127.0.0.1', clientMac = '00:00:00:00:00:00') {
  const { symbol, exchange, side, product, orderType, quantity, price, triggerPrice } = validatedParams;

  const payload = {
    variety: 'NORMAL',
    tradingsymbol: symbol,
    symboltoken: validatedParams.token || '3045', // Default or instrument token mapped
    transactiontype: side,
    exchange: exchange,
    ordertype: orderType,
    producttype: product === 'MIS' ? 'INTRADAY' : 'DELIVERY',
    duration: 'DAY',
    price: price ? String(price) : '0',
    squareoff: '0',
    stoploss: '0',
    quantity: String(quantity)
  };

  if (triggerPrice) {
    payload.triggerprice = String(triggerPrice);
  }

  const headers = {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-UserType': 'USER',
    'X-SourceID': 'WEB',
    'X-ClientLocalIP': clientLocalIp,
    'X-ClientPublicIP': clientLocalIp,
    'X-MACAddress': clientMac,
    'X-PrivateKey': apiKey
  };

  return {
    url: 'https://apiconnect.angelbroking.com/rest/secure/angelbroking/order/v1/placeOrder',
    headers,
    payload
  };
}

/**
 * DhanHQ v2 Payload Formatter
 * Endpoint: POST https://api.dhan.co/v2/orders
 */
export function buildDhanPayload(validatedParams, dhanClientId, accessToken) {
  const { symbol, exchange, side, product, orderType, quantity, price, triggerPrice } = validatedParams;

  const payload = {
    dhanClientId: String(dhanClientId),
    correlationId: `DHRU_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    transactionType: side,
    exchangeSegment: exchange === 'BSE' ? 'BSE_EQ' : 'NSE_EQ',
    productType: product === 'MIS' ? 'INTRADAY' : 'CNC',
    orderType: orderType,
    validity: 'DAY',
    tradingSymbol: symbol,
    securityId: validatedParams.securityId || '1333',
    quantity: quantity,
    disclosedQuantity: 0,
    price: price || 0,
    triggerPrice: triggerPrice || 0,
    afterMarketOrder: false
  };

  const headers = {
    'access-token': accessToken,
    'client-id': dhanClientId,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  return {
    url: 'https://api.dhan.co/v2/orders',
    headers,
    payload
  };
}

/**
 * Dispatch or Simulate Live Broker Order
 */
export async function executeBrokerOrder(orderRequest, brokerConfig) {
  const validated = validateOrderParams(orderRequest);
  const broker = (brokerConfig?.broker || 'simulation').toLowerCase();
  const isLive = brokerConfig?.mode === 'live';

  // 1. Simulation / Sandbox Mode
  if (!isLive || broker === 'simulation') {
    const simOrderId = `SIM_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    return {
      status: 'SUCCESS',
      mode: 'SIMULATION',
      broker: 'Simulation Engine',
      orderId: simOrderId,
      exchangeOrderId: `EXCH_${Math.floor(Math.random() * 899999 + 100000)}`,
      symbol: validated.symbol,
      side: validated.side,
      product: validated.product,
      quantity: validated.quantity,
      price: validated.price || orderRequest.currentPrice || 100,
      timestamp: new Date().toISOString(),
      message: `Simulation order filled successfully at ₹${validated.price || orderRequest.currentPrice || 100}`
    };
  }

  // 2. Zerodha Kite Live Execution
  if (broker === 'zerodha') {
    const { apiKey, accessToken } = brokerConfig;
    if (!apiKey || !accessToken) {
      throw new Error('Zerodha API Key and Access Token are required for Live Trading');
    }

    const { url, headers, payload } = buildZerodhaPayload(validated, apiKey, accessToken);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: new URLSearchParams(payload).toString()
      });
      const data = await response.json();

      if (!response.ok || data.status === 'error') {
        throw new Error(data.message || `Zerodha error (${response.status})`);
      }

      return {
        status: 'SUCCESS',
        mode: 'LIVE',
        broker: 'Zerodha Kite',
        orderId: data.data?.order_id,
        symbol: validated.symbol,
        side: validated.side,
        quantity: validated.quantity,
        timestamp: new Date().toISOString(),
        rawResponse: data
      };
    } catch (err) {
      throw new Error(`Zerodha Order Placement Failed: ${err.message}`);
    }
  }

  // 3. Angel One SmartAPI Live Execution
  if (broker === 'angelone') {
    const { apiKey, jwtToken, clientLocalIp } = brokerConfig;
    if (!apiKey || !jwtToken) {
      throw new Error('Angel One API Key and JWT Token are required for Live Trading');
    }

    const { url, headers, payload } = buildAngelOnePayload(validated, jwtToken, apiKey, clientLocalIp);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok || data.status === false) {
        throw new Error(data.message || `Angel One error (${response.status})`);
      }

      return {
        status: 'SUCCESS',
        mode: 'LIVE',
        broker: 'Angel One SmartAPI',
        orderId: data.data?.orderid,
        symbol: validated.symbol,
        side: validated.side,
        quantity: validated.quantity,
        timestamp: new Date().toISOString(),
        rawResponse: data
      };
    } catch (err) {
      throw new Error(`Angel One Order Placement Failed: ${err.message}`);
    }
  }

  // 4. DhanHQ Live Execution
  if (broker === 'dhan') {
    const { clientId, accessToken } = brokerConfig;
    if (!clientId || !accessToken) {
      throw new Error('Dhan Client ID and Access Token are required for Live Trading');
    }

    const { url, headers, payload } = buildDhanPayload(validated, clientId, accessToken);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok || data.status === 'failure') {
        throw new Error(data.remarks || data.message || `DhanHQ error (${response.status})`);
      }

      return {
        status: 'SUCCESS',
        mode: 'LIVE',
        broker: 'DhanHQ',
        orderId: data.orderId,
        orderStatus: data.orderStatus,
        symbol: validated.symbol,
        side: validated.side,
        quantity: validated.quantity,
        timestamp: new Date().toISOString(),
        rawResponse: data
      };
    } catch (err) {
      throw new Error(`DhanHQ Order Placement Failed: ${err.message}`);
    }
  }

  throw new Error(`Unsupported broker: ${broker}`);
}

/**
 * Fetch Broker Margins / Available Balance
 */
export async function fetchBrokerFunds(brokerConfig) {
  const broker = (brokerConfig?.broker || 'simulation').toLowerCase();
  const isLive = brokerConfig?.mode === 'live';

  if (!isLive || broker === 'simulation') {
    return {
      broker: 'Simulation Engine',
      mode: 'SIMULATION',
      availableCash: 500000.00,
      usedMargin: 0.00,
      collateral: 0.00,
      totalMargin: 500000.00,
      timestamp: new Date().toISOString()
    };
  }

  if (broker === 'zerodha') {
    const { apiKey, accessToken } = brokerConfig;
    const response = await fetch('https://api.kite.trade/user/margins/equity', {
      headers: {
        'X-Kite-Version': '3',
        'Authorization': `token ${apiKey}:${accessToken}`
      }
    });
    const data = await response.json();
    if (!response.ok || data.status === 'error') throw new Error(data.message);

    return {
      broker: 'Zerodha',
      mode: 'LIVE',
      availableCash: data.data?.net || 0,
      usedMargin: data.data?.utilised?.debits || 0,
      collateral: data.data?.collateral || 0,
      totalMargin: (data.data?.net || 0) + (data.data?.collateral || 0),
      timestamp: new Date().toISOString()
    };
  }

  if (broker === 'dhan') {
    const { clientId, accessToken } = brokerConfig;
    const response = await fetch('https://api.dhan.co/v2/margincalculator', {
      headers: {
        'access-token': accessToken,
        'client-id': clientId
      }
    });
    const data = await response.json();
    return {
      broker: 'DhanHQ',
      mode: 'LIVE',
      availableCash: data.availabelBalance || 0,
      usedMargin: data.sodLimit || 0,
      totalMargin: data.totalMargin || 0,
      timestamp: new Date().toISOString()
    };
  }

  throw new Error(`Margin inquiry not supported for ${broker}`);
}
