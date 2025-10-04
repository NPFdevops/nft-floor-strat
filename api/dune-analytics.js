/**
 * Dune Analytics Proxy API Endpoint
 * Fetches token holder data from Dune Analytics API server-side to avoid CORS issues
 * Provides caching, rate limiting, and error handling
 */

// In-memory cache for serverless functions
let cache = new Map();
const CACHE_TTL = 16 * 60 * 1000; // 16 minutes (as per user preference)
const MAX_CACHE_SIZE = 50;

// Rate limiting
const rateLimiter = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 30; // requests per window (conservative for Dune API)

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

function setCacheHeaders(res, maxAge = 900) { // 15 minutes default
  res.setHeader('Cache-Control', `public, max-age=${maxAge}, s-maxage=${maxAge * 2}, stale-while-revalidate=86400`);
  res.setHeader('Vary', 'Accept-Encoding');
}

function setCORSHeaders(res) {
  const allowedOrigins = isProduction() 
    ? ['https://www.nftstrategy.fun', 'https://nftstrategy.fun']
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://localhost:3000'];
    
  res.setHeader('Access-Control-Allow-Origin', '*'); // For API endpoints, allow all
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Transform Dune Analytics response data to match expected frontend format
 */
function transformDuneData(duneResponse, strategyLabel) {
  try {
    if (!duneResponse || !duneResponse.result || !duneResponse.result.rows) {
      logError('Invalid Dune response structure:', duneResponse);
      return [];
    }

    const rows = duneResponse.result.rows;
    
    // Filter rows by strategy label and transform data
    const filteredData = rows
      .filter(row => row.label === strategyLabel)
      .map((row, index) => ({
        id: `${strategyLabel}-${row.day}-${index}`,
        date: row.day,
        holdersCount: row.holders || 0,
        strategyLabel: row.label,
        rank: index + 1
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

    logDebug(`Transformed ${filteredData.length} records for strategy: ${strategyLabel}`);
    return filteredData;
  } catch (error) {
    logError('Error transforming Dune data:', error);
    return [];
  }
}

/**
 * Get the current token holders count for a strategy
 */
function getCurrentHoldersCount(transformedData) {
  if (!transformedData || transformedData.length === 0) {
    return 0;
  }
  
  // Return the most recent holders count
  const latest = transformedData[0];
  return latest ? latest.holdersCount : 0;
}

export default async function handler(req, res) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  logDebug(`🚀 [${requestId}] Dune Analytics API proxy called:`, {
    method: req.method,
    url: req.url,
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
      retryAfter: 60
    });
  }

  if (req.method !== 'GET') {
    logError(`❌ [${requestId}] Method not allowed:`, req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get query parameters
  const { strategy, query_id } = req.query;
  
  // Use default query ID if not provided (from your existing configuration)
  const duneQueryId = query_id || '3734699';
  
  // Validate required parameters
  if (!strategy) {
    logError(`❌ [${requestId}] Missing strategy parameter`);
    return res.status(400).json({ 
      error: 'Bad Request',
      message: 'strategy parameter is required',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Check environment variable (try both server-side and Vite formats)
    const duneApiKey = process.env.DUNE_API_KEY || process.env.VITE_DUNE_API_KEY;
    if (!duneApiKey) {
      logError(`❌ [${requestId}] Dune API key not configured`, {
        DUNE_API_KEY: process.env.DUNE_API_KEY ? 'Set' : 'Not set',
        VITE_DUNE_API_KEY: process.env.VITE_DUNE_API_KEY ? 'Set' : 'Not set'
      });
      return res.status(500).json({ 
        error: 'Configuration Error',
        message: 'Dune Analytics API key not configured',
        timestamp: new Date().toISOString()
      });
    }

    const cacheKey = `dune-${duneQueryId}-${strategy}`;
    const cached = cache.get(cacheKey);
    
    // Return cached response if available and fresh
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      logDebug(`⚡ [${requestId}] Cache HIT - returning cached Dune data for strategy: ${strategy}`);
      setCacheHeaders(res, 900);
      res.setHeader('X-Cache-Status', 'HIT');
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
      return res.status(200).json(cached.data);
    }
    
    logDebug(`🔄 [${requestId}] Cache MISS - fetching fresh Dune data for strategy: ${strategy}`);
    
    // Build Dune Analytics API URL
    const duneApiUrl = `https://api.dune.com/api/v1/query/${duneQueryId}/results`;
    
    logDebug(`📡 [${requestId}] Calling Dune API:`, duneApiUrl);
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    
    const response = await fetch(duneApiUrl, {
      method: 'GET',
      headers: {
        'X-Dune-API-Key': duneApiKey,
        'Accept': 'application/json',
        'User-Agent': `NFT-Floor-Strat-Dashboard/1.0 (${process.env.VERCEL_URL || 'localhost'})`,
        'X-Request-ID': requestId
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    logDebug(`📡 [${requestId}] Dune API response:`, {
      status: response.status,
      statusText: response.statusText,
      contentLength: response.headers.get('content-length'),
      contentType: response.headers.get('content-type')
    });

    if (!response.ok) {
      logError(`❌ [${requestId}] Dune API error:`, response.status, response.statusText);
      
      // Handle specific Dune API error codes
      let errorMessage = 'External API error';
      if (response.status === 401) {
        errorMessage = 'Invalid API credentials';
      } else if (response.status === 403) {
        errorMessage = 'API access forbidden - check subscription';
      } else if (response.status === 429) {
        errorMessage = 'API rate limit exceeded';
      } else if (response.status >= 500) {
        errorMessage = 'Dune Analytics service unavailable';
      }
      
      const errorResponse = { 
        error: 'External API error', 
        status: response.status,
        message: errorMessage,
        timestamp: new Date().toISOString()
      };
      
      return res.status(response.status >= 500 ? 502 : response.status).json(errorResponse);
    }

    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      logError(`❌ [${requestId}] Invalid content type from Dune API:`, contentType);
      return res.status(502).json({ 
        error: 'Invalid response format from Dune Analytics API',
        contentType: contentType,
        timestamp: new Date().toISOString()
      });
    }

    const duneData = await response.json();
    
    logDebug(`✅ [${requestId}] Successfully fetched Dune data:`, {
      execution_id: duneData.execution_id,
      rowCount: duneData.result?.rows?.length || 0,
      state: duneData.state
    });

    // Transform the data to match frontend expectations
    const transformedData = transformDuneData(duneData, strategy);
    const currentCount = getCurrentHoldersCount(transformedData);
    
    const responseData = {
      success: true,
      strategy: strategy,
      currentHoldersCount: currentCount,
      historicalData: transformedData,
      totalRecords: transformedData.length,
      lastUpdated: new Date().toISOString(),
      source: 'dune-analytics',
      execution_id: duneData.execution_id,
      query_id: duneQueryId
    };
    
    // Cache successful response
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    });
    
    logDebug(`✅ [${requestId}] Successfully processed and cached Dune data for strategy: ${strategy}`, {
      currentCount,
      historicalRecords: transformedData.length
    });
    
    // Set response headers
    setCacheHeaders(res, 900);
    res.setHeader('X-Cache-Status', 'MISS');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Response-Time', `${Date.now() - startTime}ms`);
    res.setHeader('X-Data-Count', transformedData.length.toString());
    res.setHeader('X-Current-Holders', currentCount.toString());
    
    return res.status(200).json(responseData);

  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    const isNetworkError = error.code === 'ECONNRESET' || error.code === 'ENOTFOUND';
    
    logError(`❌ [${requestId}] Dune Analytics API proxy error:`, {
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
      errorResponse.details = error;
    }
    
    const statusCode = isTimeout ? 504 : isNetworkError ? 502 : 500;
    return res.status(statusCode).json(errorResponse);
  }
}