export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🔄 Proxying holdings request to nftstrategy.fun API...');
    
    const { strategyAddress, nftAddress } = req.query;
    
    if (!strategyAddress || !nftAddress) {
      return res.status(400).json({
        error: 'Missing required parameters',
        message: 'Both strategyAddress and nftAddress are required',
        timestamp: new Date().toISOString()
      });
    }

    const url = `https://www.nftstrategy.fun/api/holdings?strategyAddress=${encodeURIComponent(strategyAddress)}&nftAddress=${encodeURIComponent(nftAddress)}`;
    console.log(`📡 Fetching from: ${url}`);
    
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'NFT-Strategies-Dashboard/1.0'
      },
    });

    console.log(`📡 External API response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error(`Expected JSON response, got: ${contentType}`);
    }

    const data = await response.json();
    
    console.log(`✅ Successfully fetched holdings data for strategy: ${strategyAddress}`);
    
    res.status(200).json(data);
  } catch (error) {
    console.error('❌ Holdings API proxy error:', error.message);
    console.error('Full error:', error);
    
    res.status(500).json({ 
      error: 'Failed to fetch holdings',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}