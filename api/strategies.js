export default async function handler(req, res) {
  console.log('🚀 Strategies API function called');
  console.log('📝 Request method:', req.method);
  console.log('📝 Request URL:', req.url);
  console.log('📝 Request headers:', req.headers);

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔄 Proxying request to nftstrategy.fun API...');
    
    const response = await fetch('https://www.nftstrategy.fun/api/strategies', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NFT-Floor-Strat-Dashboard/1.0'
      }
    });

    console.log('📡 External API response status:', response.status);
    console.log('📡 External API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('❌ External API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'External API error', 
        status: response.status,
        statusText: response.statusText 
      });
    }

    const contentType = response.headers.get('content-type');
    console.log('📡 External API content-type:', contentType);
    
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Invalid content type from external API:', contentType);
      const textResponse = await response.text();
      console.error('❌ Response body:', textResponse.substring(0, 500));
      return res.status(502).json({ 
        error: 'Invalid response format from external API',
        contentType: contentType,
        responsePreview: textResponse.substring(0, 200)
      });
    }

    const data = await response.json();
    
    console.log('✅ Successfully proxied strategies data, items:', Array.isArray(data) ? data.length : 'not array');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      stack: error.stack
    });
  }
}