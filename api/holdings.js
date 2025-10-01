// In-memory cache for serverless functions
let cache = new Map();
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes (shorter for holdings data)
const MAX_CACHE_SIZE = 200;

// Rate limiting
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 120; // Higher limit for holdings (more dynamic data)

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

function logDebug(...args) {
  if (!isProduction()) {
    console.log(...args);
  }
}

function logError(...args) {
  console.error(...args);
}

function cleanupCache() {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
    }
  }
  
  // Cleanup old rate limit entries
  for (const [ip, entries] of rateLimiter.entries()) {
    const validEntries = entries.filter(time => now - time < RATE_LIMIT_WINDOW);
    if (validEntries.length === 0) {
      rateLimiter.delete(ip);
    } else {
      rateLimiter.set(ip, validEntries);
    }
  }
  
  // Limit cache size
  if (cache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, cache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => cache.delete(key));
  }
}

function checkRateLimit(req) {
  const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
  const now = Date.now();
  
  if (!rateLimiter.has(clientIP)) {
    rateLimiter.set(clientIP, []);
  }
  
  const requests = rateLimiter.get(clientIP);
  const validRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (validRequests.length >= RATE_LIMIT_MAX) {
    return false;
  }
  
  validRequests.push(now);
  rateLimiter.set(clientIP, validRequests);
  return true;
}

function setSecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
}

function setCacheHeaders(res, maxAge = 120) { // Shorter cache for holdings
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge * 2}, stale-while-revalidate=3600`);
  res.setHeader('Vary', 'Accept-Encoding');
}

function setCORSHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // For API endpoints, allow all
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

function validateQueryParams(query) {
  const { strategyAddress, nftAddress } = query;
  
  if (!strategyAddress || !nftAddress) {
    return {
      valid: false,
      error: 'Missing required parameters: strategyAddress and nftAddress'
    };
  }
  
  // Basic validation - check if they look like valid addresses
  if (!/^0x[a-fA-F0-9]{40}$/.test(strategyAddress)) {
    return {
      valid: false,
      error: 'Invalid strategyAddress format'
    };
  }
  
  if (!/^0x[a-fA-F0-9]{40}$/.test(nftAddress)) {
    return {
      valid: false,
      error: 'Invalid nftAddress format'
    };
  }
  
  return { valid: true };
}

export default async function handler(req, res) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  logDebug(`🚀 [${requestId}] Holdings API called:`, {
    method: req.method,
    query: req.query,
    userAgent: req.headers['user-agent']?.substring(0, 100)
  });

  // Cleanup cache periodically
  cleanupCache();
  
  // Set security headers
  setSecurityHeaders(res);
  setCORSHeaders(res);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    logDebug(`✅ [${requestId}] Handling OPTIONS request`);
    return res.status(200).end();
  }

  // Rate limiting
  if (!checkRateLimit(req)) {
    logError(`🚦 [${requestId}] Rate limit exceeded`);
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ 
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 60,
      requestId
    });
  }

  if (req.method !== 'GET') {
    logError(`❌ [${requestId}] Method not allowed:`, req.method);
    return res.status(405).json({ error: 'Method not allowed', requestId });
  }

  try {
    // Validate query parameters
    const validation = validateQueryParams(req.query);
    if (!validation.valid) {
      logError(`❌ [${requestId}] Invalid parameters:`, validation.error);
      return res.status(400).json({ 
        error: validation.error,
        requestId
      });
    }
    
    const { strategyAddress, nftAddress } = req.query;
    const cacheKey = `holdings_${strategyAddress}_${nftAddress}`;
    const cached = cache.get(cacheKey);
    
    // Return cached response if available and fresh
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      logDebug(`⚡ [${requestId}] Cache HIT - returning cached holdings`);
      setCacheHeaders(res, 120);
      res.setHeader('X-Cache-Status', 'HIT');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
      return res.status(200).json(cached.data);
    }
    
    logDebug(`🔄 [${requestId}] Cache MISS - fetching fresh holdings data`);
    
    // Build URL with proper encoding
    const url = new URL('https://www.nftstrategy.fun/api/holdings');
    url.searchParams.append('strategyAddress', strategyAddress);
    url.searchParams.append('nftAddress', nftAddress);
    
    logDebug(`📡 [${requestId}] External API URL:`, url.toString());
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': `NFT-Floor-Strat-Dashboard/1.0 (${process.env.VERCEL_URL || 'localhost'})`,
        'X-Request-ID': requestId
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    logDebug(`📡 [${requestId}] External API response:`, {
      status: response.status,
      contentLength: response.headers.get('content-length'),
      contentType: response.headers.get('content-type')
    });

    if (!response.ok) {
      logError(`❌ [${requestId}] External API error:`, response.status, response.statusText);
      
      // Return appropriate error codes
      const errorResponse = { 
        error: 'External API error', 
        status: response.status,
        message: response.status === 429 ? 'External API rate limited' : response.statusText,
        timestamp: new Date().toISOString(),
        requestId
      };
      
      return res.status(response.status >= 500 ? 502 : response.status).json(errorResponse);
    }

    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      logError(`❌ [${requestId}] Invalid content type:`, contentType);
      return res.status(502).json({ 
        error: 'Invalid response format from external API',
        contentType: contentType,
        timestamp: new Date().toISOString(),
        requestId
      });
    }

    const data = await response.json();
    
    // Validate response structure (holdings can be array or object)
    if (data === null || data === undefined) {
      logError(`❌ [${requestId}] Empty response from external API`);
      return res.status(502).json({ 
        error: 'Empty response from external API',
        timestamp: new Date().toISOString(),
        requestId
      });
    }
    
    // Cache successful response
    cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    const dataSize = Array.isArray(data) ? data.length : typeof data === 'object' ? Object.keys(data).length : 1;
    logDebug(`✅ [${requestId}] Successfully fetched and cached holdings data (${dataSize} items)`);
    
    // Set response headers
    setCacheHeaders(res, 120);
    res.setHeader('X-Cache-Status', 'MISS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    res.setHeader('X-Data-Size', dataSize.toString());
    
    return res.status(200).json(data);

  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    const isNetworkError = error.code === 'ECONNRESET' || error.code === 'ENOTFOUND';
    
    logError(`❌ [${requestId}] API error:`, {
      message: error.message,
      type: error.name,
      code: error.code,
      timeout: isTimeout,
      network: isNetworkError
    });
    
    const errorResponse = {
      error: 'Internal server error',
      message: isTimeout ? 'Request timeout' : isNetworkError ? 'Network error' : 'Server error',
      timestamp: new Date().toISOString(),
      requestId
    };
    
    // Include stack trace only in development
    if (!isProduction()) {
      errorResponse.stack = error.stack;
    }
    
    const statusCode = isTimeout ? 504 : isNetworkError ? 502 : 500;
    return res.status(statusCode).json(errorResponse);
  }
}
