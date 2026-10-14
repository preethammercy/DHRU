// DHRU.AI - Instruments Master Database
// Covers NSE/BSE Equity Indices, Top NSE Listed Companies across all sectors,
// ETFs, Commodities, Forex, and Macro indicators.

export const INDICES = [
  { symbol: '^NSEI', name: 'NIFTY 50', exchange: 'NSE', category: 'Broad Market', benchmark: true, description: 'National Stock Exchange 50 leading companies across 13 sectors' },
  { symbol: '^BSESN', name: 'BSE SENSEX', exchange: 'BSE', category: 'Broad Market', benchmark: true, description: 'Bombay Stock Exchange 30 established and financially sound companies' },
  { symbol: '^NSEBANK', name: 'NIFTY Bank', exchange: 'NSE', category: 'Sectoral', description: '12 most liquid and large Indian banking stocks' },
  { symbol: '^CNXIT', name: 'NIFTY IT', exchange: 'NSE', category: 'Sectoral', description: 'Top Indian information technology and software services companies' },
  { symbol: '^CNXAUTO', name: 'NIFTY Auto', exchange: 'NSE', category: 'Sectoral', description: 'Automobile manufacturers, auto ancillaries, and EV makers' },
  { symbol: '^CNXPHARMA', name: 'NIFTY Pharma', exchange: 'NSE', category: 'Sectoral', description: 'Pharmaceutical, healthcare, and biotech leaders in India' },
  { symbol: '^CNXFMCG', name: 'NIFTY FMCG', exchange: 'NSE', category: 'Sectoral', description: 'Fast Moving Consumer Goods manufacturers and consumer staples' },
  { symbol: '^CNXMETAL', name: 'NIFTY Metal', exchange: 'NSE', category: 'Sectoral', description: 'Ferrous and non-ferrous metal, steel, and mining companies' },
  { symbol: '^CNXREALTY', name: 'NIFTY Realty', exchange: 'NSE', category: 'Sectoral', description: 'Real estate developers and commercial property builders' },
  { symbol: '^CNXENERGY', name: 'NIFTY Energy', exchange: 'NSE', category: 'Sectoral', description: 'Petroleum, gas, power utilities, and renewable energy providers' },
  { symbol: '^CNXINFRA', name: 'NIFTY Infrastructure', exchange: 'NSE', category: 'Thematic', description: 'Infrastructure builders, construction, ports, and logistics' },
  { symbol: '^CNX100', name: 'NIFTY 100', exchange: 'NSE', category: 'Broad Market', description: 'Top 100 companies representing major market capitalization' },
  { symbol: '^CNX200', name: 'NIFTY 200', exchange: 'NSE', category: 'Broad Market', description: 'Top 200 companies combining large and midcap universe' },
  { symbol: '^CRSLDX', name: 'NIFTY 500', exchange: 'NSE', category: 'Broad Market', description: 'Broadest market gauge representing 95% of total market capitalization' },
  { symbol: '^NSEMDCP50', name: 'NIFTY Midcap 50', exchange: 'NSE', category: 'Midcap', description: '50 prominent mid-sized growing companies' },
  { symbol: '^CNXSC', name: 'NIFTY Smallcap 100', exchange: 'NSE', category: 'Smallcap', description: '100 high-potential smallcap growth businesses' },
];

export const COMMODITIES_FOREX = [
  { symbol: 'GC=F', name: 'Gold (COMEX/MCX Proxy)', type: 'Commodity', unit: 'USD/oz / INR 10g', exchange: 'MCX / COMEX', category: 'Precious Metals', description: 'Benchmark gold contract tracking spot bullion rates' },
  { symbol: 'SI=F', name: 'Silver (COMEX/MCX Proxy)', type: 'Commodity', unit: 'USD/oz / INR 1kg', exchange: 'MCX / COMEX', category: 'Precious Metals', description: 'High-volatility industrial and precious silver proxy' },
  { symbol: 'CL=F', name: 'Crude Oil (WTI/Brent)', type: 'Commodity', unit: 'USD/barrel', exchange: 'MCX / NYMEX', category: 'Energy', description: 'Key macroeconomic driver influencing Indian inflation and CAD' },
  { symbol: 'NG=F', name: 'Natural Gas', type: 'Commodity', unit: 'USD/MMBtu', exchange: 'MCX / NYMEX', category: 'Energy', description: 'Clean energy transition and industrial fertilizer feedstock' },
  { symbol: 'INR=X', name: 'USD / INR', type: 'Forex', unit: '₹ per $', exchange: 'Forex (RBI Reference)', category: 'Currency', description: 'US Dollar to Indian Rupee reference exchange rate' },
  { symbol: 'EURINR=X', name: 'EUR / INR', type: 'Forex', unit: '₹ per €', exchange: 'Forex', category: 'Currency', description: 'Euro to Indian Rupee currency pair' },
  { symbol: 'GBPINR=X', name: 'GBP / INR', type: 'Forex', unit: '₹ per £', exchange: 'Forex', category: 'Currency', description: 'British Pound to Indian Rupee currency pair' },
];

export const CRYPTO_INSTRUMENTS = [
  { symbol: 'BTC-USD', name: 'Bitcoin', pair: 'BTC/USD', category: 'Layer 1 / Store of Value', exchange: 'Global Crypto', icon: 'Bitcoin', description: 'Decentralized digital currency and global benchmark crypto asset' },
  { symbol: 'ETH-USD', name: 'Ethereum', pair: 'ETH/USD', category: 'Smart Contracts', exchange: 'Global Crypto', icon: 'Coins', description: 'Leading smart contract and decentralized application platform' },
  { symbol: 'SOL-USD', name: 'Solana', pair: 'SOL/USD', category: 'High-Throughput L1', exchange: 'Global Crypto', icon: 'Zap', description: 'Ultra-fast Layer-1 blockchain for decentralized finance and web3' },
  { symbol: 'XRP-USD', name: 'XRP (Ripple)', pair: 'XRP/USD', category: 'Payments', exchange: 'Global Crypto', icon: 'Repeat', description: 'Institutional real-time gross settlement and remittance network' },
  { symbol: 'BNB-USD', name: 'Binance Coin', pair: 'BNB/USD', category: 'Exchange / Ecosystem', exchange: 'Global Crypto', icon: 'Shield', description: 'Utility and gas token powering the BNB Chain ecosystem' },
  { symbol: 'DOGE-USD', name: 'Dogecoin', pair: 'DOGE/USD', category: 'Meme / Payment', exchange: 'Global Crypto', icon: 'Smile', description: 'Widely recognized peer-to-peer digital payment currency' },
  { symbol: 'ADA-USD', name: 'Cardano', pair: 'ADA/USD', category: 'Proof-of-Stake L1', exchange: 'Global Crypto', icon: 'Layers', description: 'Peer-reviewed proof-of-stake blockchain platform' },
  { symbol: 'AVAX-USD', name: 'Avalanche', pair: 'AVAX/USD', category: 'Subnets / L1', exchange: 'Global Crypto', icon: 'Flame', description: 'Customizable multi-chain blockchain platform for scalable dApps' },
  { symbol: 'LINK-USD', name: 'Chainlink', pair: 'LINK/USD', category: 'Oracle / Infrastructure', exchange: 'Global Crypto', icon: 'Network', description: 'Decentralized oracle network bridging off-chain data to blockchains' },
  { symbol: 'SUI-USD', name: 'Sui Network', pair: 'SUI/USD', category: 'Move VM L1', exchange: 'Global Crypto', icon: 'Boxes', description: 'Object-centric high-performance blockchain platform' },
  { symbol: 'DOT-USD', name: 'Polkadot', pair: 'DOT/USD', category: 'Interoperability', exchange: 'Global Crypto', icon: 'Globe', description: 'Sharded protocol that connects multiple specialized blockchains into a unified network' },
  { symbol: 'NEAR-USD', name: 'NEAR Protocol', pair: 'NEAR/USD', category: 'AI & Sharding L1', exchange: 'Global Crypto', icon: 'Cpu', description: 'High-throughput layer-one blockchain designed for usability and AI compute' },
  { symbol: 'APT-USD', name: 'Aptos', pair: 'APT/USD', category: 'Move VM L1', exchange: 'Global Crypto', icon: 'Activity', description: 'Scalable layer 1 built with the Move smart contract language' },
  { symbol: 'PEPE-USD', name: 'Pepe', pair: 'PEPE/USD', category: 'Meme Asset', exchange: 'Global Crypto', icon: 'Smile', description: 'Deflationary meme token celebrating Pepe the Frog with strong community liquidity' },
  { symbol: 'SHIB-USD', name: 'Shiba Inu', pair: 'SHIB/USD', category: 'Meme / DeFi', exchange: 'Global Crypto', icon: 'Smile', description: 'Decentralized community building cryptocurrency ecosystem' },
  { symbol: 'LTC-USD', name: 'Litecoin', pair: 'LTC/USD', category: 'Payments', exchange: 'Global Crypto', icon: 'Coins', description: 'Established peer-to-peer cryptocurrency with fast block times and low transaction fees' },
  { symbol: 'UNI-USD', name: 'Uniswap', pair: 'UNI/USD', category: 'DeFi DEX', exchange: 'Global Crypto', icon: 'Repeat', description: 'Leading decentralized automated market maker exchange protocol' },
  { symbol: 'ARB-USD', name: 'Arbitrum', pair: 'ARB/USD', category: 'Ethereum Layer 2', exchange: 'Global Crypto', icon: 'Layers', description: 'Optimistic rollup scaling technology for Ethereum with low gas costs' },
  { symbol: 'OP-USD', name: 'Optimism', pair: 'OP/USD', category: 'Ethereum Layer 2', exchange: 'Global Crypto', icon: 'Zap', description: 'Low-cost and lightning-fast Ethereum Layer 2 blockchain architecture' },
  { symbol: 'RENDER-USD', name: 'Render Network', pair: 'RENDER/USD', category: 'DePIN / AI Compute', exchange: 'Global Crypto', icon: 'Cpu', description: 'Distributed GPU-based rendering and AI decentralized computing provider' },
  { symbol: 'ICP-USD', name: 'Internet Computer', pair: 'ICP/USD', category: 'Web3 Cloud', exchange: 'Global Crypto', icon: 'Globe', description: 'General-purpose blockchain hosting full-stack decentralized web services' },
  { symbol: 'FET-USD', name: 'Artificial Superintelligence Alliance', pair: 'FET/USD', category: 'AI & Autonomous Agents', exchange: 'Global Crypto', icon: 'BrainCircuit', description: 'Autonomous agent and decentralized machine learning intelligence network' }
];

export const FOREX_INSTRUMENTS = [
  { symbol: 'EURUSD=X', name: 'EUR / USD', pair: 'EUR/USD', category: 'Major Forex', exchange: 'Interbank Forex', description: 'Euro to US Dollar - highest volume traded currency pair globally' },
  { symbol: 'GBPUSD=X', name: 'GBP / USD (Cable)', pair: 'GBP/USD', category: 'Major Forex', exchange: 'Interbank Forex', description: 'British Pound Sterling to US Dollar' },
  { symbol: 'USDJPY=X', name: 'USD / JPY (Gopher)', pair: 'USD/JPY', category: 'Major Forex', exchange: 'Interbank Forex', description: 'US Dollar to Japanese Yen - major Asian forex benchmark' },
  { symbol: 'INR=X', name: 'USD / INR', pair: 'USD/INR', category: 'Exotic / Asia', exchange: 'RBI / Interbank', description: 'US Dollar to Indian Rupee reference exchange rate' },
  { symbol: 'GBPINR=X', name: 'GBP / INR', pair: 'GBP/INR', category: 'Cross Currency', exchange: 'Forex', description: 'British Pound to Indian Rupee cross rate' },
  { symbol: 'EURINR=X', name: 'EUR / INR', pair: 'EUR/INR', category: 'Cross Currency', exchange: 'Forex', description: 'Euro to Indian Rupee cross rate' },
  { symbol: 'JPYINR=X', name: 'JPY / INR (100 JPY)', pair: 'JPY/INR', category: 'Cross Currency', exchange: 'Forex', description: 'Japanese Yen to Indian Rupee reference exchange rate' },
  { symbol: 'AUDUSD=X', name: 'AUD / USD (Aussie)', pair: 'AUD/USD', category: 'Commodity Currency', exchange: 'Interbank Forex', description: 'Australian Dollar to US Dollar' },
  { symbol: 'USDCAD=X', name: 'USD / CAD (Loonie)', pair: 'USD/CAD', category: 'Commodity Currency', exchange: 'Interbank Forex', description: 'US Dollar to Canadian Dollar' },
  { symbol: 'USDCHF=X', name: 'USD / CHF (Swissy)', pair: 'USD/CHF', category: 'Safe Haven Forex', exchange: 'Interbank Forex', description: 'US Dollar to Swiss Franc safe haven rate' },
  { symbol: 'NZDUSD=X', name: 'NZD / USD (Kiwi)', pair: 'NZD/USD', category: 'Commodity Currency', exchange: 'Interbank Forex', description: 'New Zealand Dollar to US Dollar' },
  { symbol: 'EURGBP=X', name: 'EUR / GBP (Chunnel)', pair: 'EUR/GBP', category: 'Cross Currency', exchange: 'Interbank Forex', description: 'Euro to British Pound Sterling exchange rate' },
  { symbol: 'EURJPY=X', name: 'EUR / JPY (Yuppy)', pair: 'EUR/JPY', category: 'Cross Currency', exchange: 'Interbank Forex', description: 'Euro to Japanese Yen currency pair' },
  { symbol: 'GBPJPY=X', name: 'GBP / JPY (Guppy)', pair: 'GBP/JPY', category: 'Cross Currency', exchange: 'Interbank Forex', description: 'British Pound to Japanese Yen cross pair' },
  { symbol: 'GC=F', name: 'Gold Spot (XAU/USD)', pair: 'XAU/USD', category: 'Precious Metals', exchange: 'COMEX / London Bullion', description: 'International gold bullion benchmark per troy ounce' },
  { symbol: 'SI=F', name: 'Silver Spot (XAG/USD)', pair: 'XAG/USD', category: 'Precious Metals', exchange: 'COMEX', description: 'International spot silver benchmark' },
  { symbol: 'CL=F', name: 'Crude Oil (WTI)', pair: 'WTI/USD', category: 'Energy', exchange: 'NYMEX', description: 'West Texas Intermediate crude oil benchmark' },
  { symbol: 'BZ=F', name: 'Brent Crude Oil', pair: 'BRENT/USD', category: 'Energy', exchange: 'ICE', description: 'North Sea Brent crude oil global benchmark' },
  // US / Global Equities & Mega-Caps
  { symbol: 'AAPL', name: 'Apple Inc.', pair: 'AAPL/USD', category: 'US Mega-Cap Tech', exchange: 'NASDAQ', description: 'Global consumer electronics, iOS ecosystem, and computing leader' },
  { symbol: 'NFLX', name: 'Netflix, Inc.', pair: 'NFLX/USD', category: 'US Streaming & Media', exchange: 'NASDAQ', description: 'Global streaming entertainment, video production, and content network' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', pair: 'NVDA/USD', category: 'US AI & Semiconductors', exchange: 'NASDAQ', description: 'World leader in accelerated computing GPUs and AI data center hardware' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', pair: 'TSLA/USD', category: 'US EV & Clean Energy', exchange: 'NASDAQ', description: 'Autonomous electric vehicle, energy storage, and AI robotics pioneer' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', pair: 'MSFT/USD', category: 'US Cloud & Software', exchange: 'NASDAQ', description: 'Enterprise cloud computing, Azure AI, Windows, and productivity software' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. (Google)', pair: 'GOOGL/USD', category: 'US Search & AI', exchange: 'NASDAQ', description: 'Global search, Android OS, YouTube, Google Cloud, and AI intelligence' },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', pair: 'AMZN/USD', category: 'US E-Commerce & Cloud', exchange: 'NASDAQ', description: 'Global e-commerce marketplace, AWS cloud infrastructure, and logistics' },
  { symbol: 'META', name: 'Meta Platforms, Inc.', pair: 'META/USD', category: 'US Social Media & VR', exchange: 'NASDAQ', description: 'Instagram, WhatsApp, Facebook social platforms, and Llama AI models' }
];

export const ETFS = [
  { symbol: 'NIFTYBEES.NS', name: 'Nippon India ETF Nifty 50 BeES', exchange: 'NSE', underlying: 'NIFTY 50', expenseRatio: '0.04%', description: 'Highest liquidity passive ETF tracking NIFTY 50' },
  { symbol: 'BANKBEES.NS', name: 'Nippon India ETF Nifty Bank BeES', exchange: 'NSE', underlying: 'NIFTY Bank', expenseRatio: '0.19%', description: 'Direct exposure to top 12 Indian commercial banks' },
  { symbol: 'GOLDBEES.NS', name: 'Nippon India ETF Gold BeES', exchange: 'NSE', underlying: 'Domestic Physical Gold', expenseRatio: '0.79%', description: 'Physical 99.5% pure gold backed sovereign storage' },
  { symbol: 'ITBEES.NS', name: 'Nippon India ETF Nifty IT BeES', exchange: 'NSE', underlying: 'NIFTY IT', expenseRatio: '0.22%', description: 'Indian tech basket tracking global software demand' },
  { symbol: 'SILVERBEES.NS', name: 'Nippon India ETF Silver BeES', exchange: 'NSE', underlying: 'Physical Silver', expenseRatio: '0.50%', description: 'Physical silver bullion tracking domestic spot price' },
];

// Master list of top ~120 prominent NSE/BSE equities categorized by sector & market cap
// Expanded on backend startup by parsing official NSE EQUITY_L.csv
export const CURATED_STOCKS = [
  // IT & Technology
  { symbol: 'TCS.NS', name: 'Tata Consultancy Services Ltd', sector: 'Information Technology', cap: 'Large Cap', isin: 'INE467B01029' },
  { symbol: 'INFY.NS', name: 'Infosys Limited', sector: 'Information Technology', cap: 'Large Cap', isin: 'INE009A01021' },
  { symbol: 'HCLTECH.NS', name: 'HCL Technologies Limited', sector: 'Information Technology', cap: 'Large Cap', isin: 'INE860A01027' },
  { symbol: 'WIPRO.NS', name: 'Wipro Limited', sector: 'Information Technology', cap: 'Large Cap', isin: 'INE075A01017' },
  { symbol: 'TECHM.NS', name: 'Tech Mahindra Limited', sector: 'Information Technology', cap: 'Large Cap', isin: 'INE669C01036' },
  { symbol: 'LTIM.NS', name: 'LTIMindtree Limited', sector: 'Information Technology', cap: 'Large Cap', isin: 'INE214T01019' },
  { symbol: 'PERSISTENT.NS', name: 'Persistent Systems Limited', sector: 'Information Technology', cap: 'Mid Cap', isin: 'INE262H01013' },
  { symbol: 'COFORGE.NS', name: 'Coforge Limited', sector: 'Information Technology', cap: 'Mid Cap', isin: 'INE591G01017' },
  { symbol: 'MPHASIS.NS', name: 'Mphasis Limited', sector: 'Information Technology', cap: 'Mid Cap', isin: 'INE356A01018' },
  { symbol: 'TATAELXSI.NS', name: 'Tata Elxsi Limited', sector: 'Information Technology', cap: 'Mid Cap', isin: 'INE670A01012' },
  { symbol: 'KPITTECH.NS', name: 'KPIT Technologies Limited', sector: 'Information Technology', cap: 'Mid Cap', isin: 'INE04I401011' },

  // Banking & Financial Services
  { symbol: 'HDFCBANK.NS', name: 'HDFC Bank Limited', sector: 'Banking & Financials', cap: 'Large Cap', isin: 'INE040A01034' },
  { symbol: 'ICICIBANK.NS', name: 'ICICI Bank Limited', sector: 'Banking & Financials', cap: 'Large Cap', isin: 'INE090A01021' },
  { symbol: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking & Financials', cap: 'Large Cap', isin: 'INE062A01020' },
  { symbol: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank Limited', sector: 'Banking & Financials', cap: 'Large Cap', isin: 'INE237A01028' },
  { symbol: 'AXISBANK.NS', name: 'Axis Bank Limited', sector: 'Banking & Financials', cap: 'Large Cap', isin: 'INE238A01034' },
  { symbol: 'BAJFINANCE.NS', name: 'Bajaj Finance Limited', sector: 'Banking & Financials', cap: 'Large Cap', isin: 'INE296A01024' },
  { symbol: 'BAJAJFINSV.NS', name: 'Bajaj Finserv Limited', sector: 'Banking & Financials', cap: 'Large Cap', isin: 'INE918I01026' },
  { symbol: 'INDUSINDBK.NS', name: 'IndusInd Bank Limited', sector: 'Banking & Financials', cap: 'Large Cap', isin: 'INE095A01012' },
  { symbol: 'BANKBARODA.NS', name: 'Bank of Baroda', sector: 'Banking & Financials', cap: 'Large Cap', isin: 'INE077A01010' },
  { symbol: 'PNB.NS', name: 'Punjab National Bank', sector: 'Banking & Financials', cap: 'Large Cap', isin: 'INE160A01022' },
  { symbol: 'CHOLAFIN.NS', name: 'Cholamandalam Investment and Finance', sector: 'Banking & Financials', cap: 'Large Cap', isin: 'INE121A01024' },
  { symbol: 'SHRIRAMFIN.NS', name: 'Shriram Finance Limited', sector: 'Banking & Financials', cap: 'Large Cap', isin: 'INE721A01013' },
  { symbol: 'MUTHOOTFIN.NS', name: 'Muthoot Finance Limited', sector: 'Banking & Financials', cap: 'Mid Cap', isin: 'INE414G01012' },

  // Energy, Oil & Gas, Power
  { symbol: 'RELIANCE.NS', name: 'Reliance Industries Limited', sector: 'Energy & Petrochemicals', cap: 'Large Cap', isin: 'INE002A01018' },
  { symbol: 'ONGC.NS', name: 'Oil & Natural Gas Corporation Limited', sector: 'Energy & Petrochemicals', cap: 'Large Cap', isin: 'INE213A01029' },
  { symbol: 'NTPC.NS', name: 'NTPC Limited', sector: 'Energy & Petrochemicals', cap: 'Large Cap', isin: 'INE733E01010' },
  { symbol: 'POWERGRID.NS', name: 'Power Grid Corporation of India Limited', sector: 'Energy & Petrochemicals', cap: 'Large Cap', isin: 'INE752E01010' },
  { symbol: 'COALINDIA.NS', name: 'Coal India Limited', sector: 'Energy & Petrochemicals', cap: 'Large Cap', isin: 'INE522F01014' },
  { symbol: 'TATAPOWER.NS', name: 'Tata Power Company Limited', sector: 'Energy & Petrochemicals', cap: 'Large Cap', isin: 'INE245A01021' },
  { symbol: 'BPCL.NS', name: 'Bharat Petroleum Corporation Limited', sector: 'Energy & Petrochemicals', cap: 'Large Cap', isin: 'INE029A01011' },
  { symbol: 'IOC.NS', name: 'Indian Oil Corporation Limited', sector: 'Energy & Petrochemicals', cap: 'Large Cap', isin: 'INE242A01010' },
  { symbol: 'GAIL.NS', name: 'GAIL (India) Limited', sector: 'Energy & Petrochemicals', cap: 'Large Cap', isin: 'INE129A01019' },
  { symbol: 'ADANIGREEN.NS', name: 'Adani Green Energy Limited', sector: 'Renewable Energy', cap: 'Large Cap', isin: 'INE364U01010' },
  { symbol: 'ADANIPOWER.NS', name: 'Adani Power Limited', sector: 'Energy & Petrochemicals', cap: 'Large Cap', isin: 'INE814H01011' },

  // Automobiles & EV
  { symbol: 'TMPV.NS', name: 'Tata Motors Passenger Vehicles Limited', sector: 'Automobiles & EV', cap: 'Large Cap', isin: 'INE155A01022' },
  { symbol: 'TMCV.NS', name: 'Tata Motors Commercial Vehicles Limited', sector: 'Automobiles & EV', cap: 'Large Cap', isin: 'INE155A01022' },
  { symbol: 'M&M.NS', name: 'Mahindra & Mahindra Limited', sector: 'Automobiles & EV', cap: 'Large Cap', isin: 'INE101A01026' },
  { symbol: 'MARUTI.NS', name: 'Maruti Suzuki India Limited', sector: 'Automobiles & EV', cap: 'Large Cap', isin: 'INE585B01010' },
  { symbol: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto Limited', sector: 'Automobiles & EV', cap: 'Large Cap', isin: 'INE917I01010' },
  { symbol: 'EICHERMOT.NS', name: 'Eicher Motors Limited (Royal Enfield)', sector: 'Automobiles & EV', cap: 'Large Cap', isin: 'INE066A01021' },
  { symbol: 'HEROMOTOCO.NS', name: 'Hero MotoCorp Limited', sector: 'Automobiles & EV', cap: 'Large Cap', isin: 'INE158A01026' },
  { symbol: 'TVSMOTOR.NS', name: 'TVS Motor Company Limited', sector: 'Automobiles & EV', cap: 'Large Cap', isin: 'INE494B01023' },
  { symbol: 'BHARATFORG.NS', name: 'Bharat Forge Limited', sector: 'Automobiles & EV', cap: 'Mid Cap', isin: 'INE465A01025' },
  { symbol: 'MOTHERSON.NS', name: 'Samvardhana Motherson International', sector: 'Automobiles & EV', cap: 'Large Cap', isin: 'INE775A01035' },

  // FMCG, Retail & Consumer
  { symbol: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG & Consumer', cap: 'Large Cap', isin: 'INE154A01025' },
  { symbol: 'HINDUNILVR.NS', name: 'Hindustan Unilever Limited', sector: 'FMCG & Consumer', cap: 'Large Cap', isin: 'INE030A01027' },
  { symbol: 'NESTLEIND.NS', name: 'Nestle India Limited', sector: 'FMCG & Consumer', cap: 'Large Cap', isin: 'INE239A01024' },
  { symbol: 'BRITANNIA.NS', name: 'Britannia Industries Limited', sector: 'FMCG & Consumer', cap: 'Large Cap', isin: 'INE216A01030' },
  { symbol: 'TATACONSUM.NS', name: 'Tata Consumer Products Limited', sector: 'FMCG & Consumer', cap: 'Large Cap', isin: 'INE192A01025' },
  { symbol: 'TITAN.NS', name: 'Titan Company Limited', sector: 'Consumer Discretionary', cap: 'Large Cap', isin: 'INE280A01028' },
  { symbol: 'TRENT.NS', name: 'Trent Limited (Westside/Zudio)', sector: 'Retail & Consumer', cap: 'Large Cap', isin: 'INE849A01020' },
  { symbol: 'ASIANPAINT.NS', name: 'Asian Paints Limited', sector: 'FMCG & Paints', cap: 'Large Cap', isin: 'INE021A01026' },
  { symbol: 'DABUR.NS', name: 'Dabur India Limited', sector: 'FMCG & Consumer', cap: 'Large Cap', isin: 'INE016A01026' },
  { symbol: 'GODREJCP.NS', name: 'Godrej Consumer Products Limited', sector: 'FMCG & Consumer', cap: 'Large Cap', isin: 'INE102D01028' },
  { symbol: 'MARICO.NS', name: 'Marico Limited', sector: 'FMCG & Consumer', cap: 'Large Cap', isin: 'INE196A01026' },
  { symbol: 'DMART.NS', name: 'Avenue Supermarts Limited (DMart)', sector: 'Retail & Consumer', cap: 'Large Cap', isin: 'INE192R01011' },

  // Metals & Mining
  { symbol: 'TATASTEEL.NS', name: 'Tata Steel Limited', sector: 'Metals & Mining', cap: 'Large Cap', isin: 'INE081A01020' },
  { symbol: 'JSWSTEEL.NS', name: 'JSW Steel Limited', sector: 'Metals & Mining', cap: 'Large Cap', isin: 'INE019A01038' },
  { symbol: 'HINDALCO.NS', name: 'Hindalco Industries Limited', sector: 'Metals & Mining', cap: 'Large Cap', isin: 'INE038A01020' },
  { symbol: 'VEDL.NS', name: 'Vedanta Limited', sector: 'Metals & Mining', cap: 'Large Cap', isin: 'INE205A01025' },
  { symbol: 'JINDALSTEL.NS', name: 'Jindal Steel & Power Limited', sector: 'Metals & Mining', cap: 'Large Cap', isin: 'INE749A01030' },
  { symbol: 'NMDC.NS', name: 'NMDC Limited', sector: 'Metals & Mining', cap: 'Large Cap', isin: 'INE584A01023' },
  { symbol: 'SAIL.NS', name: 'Steel Authority of India Limited', sector: 'Metals & Mining', cap: 'Mid Cap', isin: 'INE114A01011' },

  // Pharmaceuticals & Healthcare
  { symbol: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical Industries Limited', sector: 'Healthcare & Pharma', cap: 'Large Cap', isin: 'INE044A01036' },
  { symbol: 'CIPLA.NS', name: 'Cipla Limited', sector: 'Healthcare & Pharma', cap: 'Large Cap', isin: 'INE059A01026' },
  { symbol: 'DRREDDY.NS', name: "Dr. Reddy's Laboratories Limited", sector: 'Healthcare & Pharma', cap: 'Large Cap', isin: 'INE089A01023' },
  { symbol: 'DIVISLAB.NS', name: "Divi's Laboratories Limited", sector: 'Healthcare & Pharma', cap: 'Large Cap', isin: 'INE361B01024' },
  { symbol: 'APOLLOHOSP.NS', name: 'Apollo Hospitals Enterprise Limited', sector: 'Healthcare & Pharma', cap: 'Large Cap', isin: 'INE437A01024' },
  { symbol: 'ZYDUSLIFE.NS', name: 'Zydus Lifesciences Limited', sector: 'Healthcare & Pharma', cap: 'Large Cap', isin: 'INE010B01027' },
  { symbol: 'LUPIN.NS', name: 'Lupin Limited', sector: 'Healthcare & Pharma', cap: 'Large Cap', isin: 'INE326A01037' },
  { symbol: 'MANKIND.NS', name: 'Mankind Pharma Limited', sector: 'Healthcare & Pharma', cap: 'Large Cap', isin: 'INE634S01028' },
  { symbol: 'TORNTPHARM.NS', name: 'Torrent Pharmaceuticals Limited', sector: 'Healthcare & Pharma', cap: 'Large Cap', isin: 'INE685A01028' },

  // Capital Goods, Infrastructure & Defence
  { symbol: 'LT.NS', name: 'Larsen & Toubro Limited', sector: 'Infrastructure & Capital Goods', cap: 'Large Cap', isin: 'INE018A01030' },
  { symbol: 'HAL.NS', name: 'Hindustan Aeronautics Limited', sector: 'Defence & Aerospace', cap: 'Large Cap', isin: 'INE066F01020' },
  { symbol: 'BEL.NS', name: 'Bharat Electronics Limited', sector: 'Defence & Aerospace', cap: 'Large Cap', isin: 'INE263A01024' },
  { symbol: 'MAZDOCK.NS', name: 'Mazagon Dock Shipbuilders Limited', sector: 'Defence & Aerospace', cap: 'Mid Cap', isin: 'INE249Z01012' },
  { symbol: 'SIEMENS.NS', name: 'Siemens Limited', sector: 'Infrastructure & Capital Goods', cap: 'Large Cap', isin: 'INE003A01024' },
  { symbol: 'ABB.NS', name: 'ABB India Limited', sector: 'Infrastructure & Capital Goods', cap: 'Large Cap', isin: 'INE117A01022' },
  { symbol: 'ADANIPORTS.NS', name: 'Adani Ports and Special Economic Zone', sector: 'Infrastructure & Ports', cap: 'Large Cap', isin: 'INE742F01042' },
  { symbol: 'ADANIENT.NS', name: 'Adani Enterprises Limited', sector: 'Diversified Conglomerate', cap: 'Large Cap', isin: 'INE423A01024' },
  { symbol: 'BHEL.NS', name: 'Bharat Heavy Electricals Limited', sector: 'Infrastructure & Capital Goods', cap: 'Mid Cap', isin: 'INE257A01026' },

  // Telecom, Media & Internet
  { symbol: 'BHARTIARTL.NS', name: 'Bharti Airtel Limited', sector: 'Telecommunications', cap: 'Large Cap', isin: 'INE397D01024' },
  { symbol: 'IDEA.NS', name: 'Vodafone Idea Limited', sector: 'Telecommunications', cap: 'Mid Cap', isin: 'INE669E01016' },
  { symbol: 'INDUSTOWER.NS', name: 'Indus Towers Limited', sector: 'Telecommunications', cap: 'Large Cap', isin: 'INE121J01017' },

  // Chemicals & Fertilizers
  { symbol: 'TATACHEM.NS', name: 'Tata Chemicals Limited', sector: 'Chemicals & Materials', cap: 'Mid Cap', isin: 'INE092A01019' },
  { symbol: 'PIDILITIND.NS', name: 'Pidilite Industries Limited (Fevicol)', sector: 'Chemicals & Materials', cap: 'Large Cap', isin: 'INE318A01026' },
  { symbol: 'SRF.NS', name: 'SRF Limited', sector: 'Chemicals & Materials', cap: 'Large Cap', isin: 'INE647A01010' },
  { symbol: 'DEEPAKNTR.NS', name: 'Deepak Nitrite Limited', sector: 'Chemicals & Materials', cap: 'Mid Cap', isin: 'INE288B01029' },
  { symbol: 'GUJGASLTD.NS', name: 'Gujarat Gas Limited', sector: 'Energy & Petrochemicals', cap: 'Mid Cap', isin: 'INE844O01030' },

  // Cement & Building Materials
  { symbol: 'ULTRACEMCO.NS', name: 'UltraTech Cement Limited', sector: 'Cement & Construction Materials', cap: 'Large Cap', isin: 'INE481G01011' },
  { symbol: 'GRASIM.NS', name: 'Grasim Industries Limited', sector: 'Cement & Construction Materials', cap: 'Large Cap', isin: 'INE047A01021' },
  { symbol: 'AMBUJACEM.NS', name: 'Ambuja Cements Limited', sector: 'Cement & Construction Materials', cap: 'Large Cap', isin: 'INE079A01024' },
  { symbol: 'SHREECEM.NS', name: 'Shree Cement Limited', sector: 'Cement & Construction Materials', cap: 'Large Cap', isin: 'INE070A01015' },

  // Real Estate
  { symbol: 'DLF.NS', name: 'DLF Limited', sector: 'Real Estate', cap: 'Large Cap', isin: 'INE271C01023' },
  { symbol: 'GODREJPROP.NS', name: 'Godrej Properties Limited', sector: 'Real Estate', cap: 'Large Cap', isin: 'INE484J01027' },
  { symbol: 'MACROTECH.NS', name: 'Macrotech Developers (Lodha)', sector: 'Real Estate', cap: 'Large Cap', isin: 'INE670K01029' },
  { symbol: 'OBEROIRLTY.NS', name: 'Oberoi Realty Limited', sector: 'Real Estate', cap: 'Mid Cap', isin: 'INE093I01010' },
  { symbol: 'PHOENIXLTD.NS', name: 'The Phoenix Mills Limited', sector: 'Real Estate', cap: 'Mid Cap', isin: 'INE211B01039' },
];

export const SECTORS = [
  { id: 'it', name: 'Information Technology', indexSymbol: '^CNXIT', icon: 'Cpu', color: '#38BDF8' },
  { id: 'banking', name: 'Banking & Financials', indexSymbol: '^NSEBANK', icon: 'Building2', color: '#60A5FA' },
  { id: 'auto', name: 'Automobiles & EV', indexSymbol: '^CNXAUTO', icon: 'Car', color: '#F59E0B' },
  { id: 'energy', name: 'Energy & Petrochemicals', indexSymbol: '^CNXENERGY', icon: 'Zap', color: '#10B981' },
  { id: 'metals', name: 'Metals & Mining', indexSymbol: '^CNXMETAL', icon: 'Boxes', color: '#94A3B8' },
  { id: 'pharma', name: 'Healthcare & Pharma', indexSymbol: '^CNXPHARMA', icon: 'Activity', color: '#EC4899' },
  { id: 'fmcg', name: 'FMCG & Consumer', indexSymbol: '^CNXFMCG', icon: 'ShoppingBag', color: '#A78BFA' },
  { id: 'realty', name: 'Real Estate', indexSymbol: '^CNXREALTY', icon: 'Home', color: '#FB923C' },
  { id: 'infra', name: 'Infrastructure & Capital Goods', indexSymbol: '^CNXINFRA', icon: 'HardHat', color: '#EAB308' },
  { id: 'defence', name: 'Defence & Aerospace', indexSymbol: null, icon: 'Shield', color: '#14B8A6' },
  { id: 'telecom', name: 'Telecommunications', indexSymbol: null, icon: 'Radio', color: '#6366F1' },
  { id: 'chemicals', name: 'Chemicals & Materials', indexSymbol: null, icon: 'FlaskConical', color: '#06B6D4' },
];
