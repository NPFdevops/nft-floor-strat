import axios from 'axios';
import { cacheService } from './cacheService.js';

// Request deduplication to prevent multiple identical API calls
const pendingRequests = new Map();

// Environment variables validation
const RAPIDAPI_HOST = import.meta.env.VITE_RAPIDAPI_HOST;
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;

// Validate required environment variables
const validateEnvironmentVariables = () => {
  const missing = [];
  
  if (!RAPIDAPI_HOST) missing.push('VITE_RAPIDAPI_HOST');
  if (!RAPIDAPI_KEY) missing.push('VITE_RAPIDAPI_KEY');
  
  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    console.error('🔴 Environment Variables Error:', error);
    console.error('💡 Make sure to set these variables in Vercel dashboard or your .env file');
    throw new Error(error);
  }
  
  console.log('✅ Environment variables validated successfully');
  console.log('🔑 API Host:', RAPIDAPI_HOST);
  console.log('🔑 API Key:', RAPIDAPI_KEY ? `${RAPIDAPI_KEY.substring(0, 8)}...` : 'Not set');
};

// Validate on module load
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('❌ API service initialization failed:', error.message);
}

const API_BASE_URL = `https://${RAPIDAPI_HOST}`;

// Create axios instance with RapidAPI headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'X-RapidAPI-Key': RAPIDAPI_KEY,
    'X-RapidAPI-Host': RAPIDAPI_HOST,
    'Content-Type': 'application/json',
  },
  timeout: 30000 // 30 seconds - balanced between responsiveness and reliability
});

/**
 * Convert API response array to Chart.js compatible format
 * @param {Array} apiData - Array of price data objects from API
 * @returns {Array} Array of {x: Date, y: price} objects
 */
const formatPriceData = (apiData) => {
  if (!apiData || !Array.isArray(apiData)) {
    console.log('formatPriceData: No data or not array:', apiData);
    return [];
  }
  
  console.log('formatPriceData: Processing', apiData.length, 'data points');
  console.log('formatPriceData: Sample data point:', apiData[0]);
  
  return apiData.map((dataPoint, index) => {
    // Handle different timestamp formats (seconds, milliseconds, or microseconds)
    let timestamp = dataPoint.timestamp;
    if (timestamp > 1e12) {
      // Likely microseconds, convert to milliseconds
      timestamp = timestamp / 1000;
    } else if (timestamp < 1e10) {
      // Likely seconds, convert to milliseconds
      timestamp = timestamp * 1000;
    }
    // Otherwise assume it's already in milliseconds
    
    const result = {
      x: new Date(timestamp),
      y: parseFloat(dataPoint.lowestNative) || 0
    };
    
    if (index < 3) {
      console.log(`formatPriceData[${index}]:`, {
        originalTimestamp: dataPoint.timestamp,
        convertedTimestamp: timestamp,
        date: result.x,
        price: result.y
      });
    }
    
    return result;
  }).sort((a, b) => a.x - b.x); // Sort by date ascending
};

/**
 * Fetch floor price history for a specific NFT collection with smart caching
 * @param {string} collectionSlug - The collection identifier/slug
 * @param {string} granularity - Time granularity ('1d', '1h', etc.)
 * @param {number} startTimestamp - Start timestamp in seconds (optional)
 * @param {number} endTimestamp - End timestamp in seconds (optional)
 * @param {string} timeframe - Timeframe for cache TTL ('30d', '90d', '1Y', 'YTD')
 * @returns {Promise<Object>} Floor price data with timestamps and prices
 */
export const fetchFloorPriceHistory = async (collectionSlug, granularity = '1d', startTimestamp = null, endTimestamp = null, timeframe = '30d') => {
  try {
    // Use provided timestamps or default to last 30 days
    const endTime = endTimestamp || Math.floor(Date.now() / 1000);
    const startTime = startTimestamp || (endTime - (30 * 24 * 60 * 60));
    
    // Generate cache key with timeframe
    const cacheKey = cacheService.generateCacheKey(collectionSlug, granularity, startTime, endTime, timeframe);
    
    // Check if there's already a pending request for this data
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for pending request: ${collectionSlug}`);
      return await pendingRequests.get(cacheKey);
    }
    
    // Try to get from cache first (multi-layer cache)
    const cachedData = await cacheService.get(cacheKey, timeframe);
    if (cachedData) {
      console.log(`✅ Using cached data for ${collectionSlug} (${timeframe})`);
      return cachedData;
    }
    
    // Create a promise for this request and store it to prevent duplicates
    const requestPromise = (async () => {
      try {
        console.log(`🔄 Fetching fresh data for ${collectionSlug} (${timeframe})`);
        console.log('API request params:', {
      collectionSlug,
      granularity,
      startTime,
      endTime,
      startDate: new Date(startTime * 1000),
      endDate: new Date(endTime * 1000)
    });
    
    // Check for cached ETag
    const etagCacheKey = `etag_${cacheKey}`;
    const cachedETag = await cacheService.get(etagCacheKey);
    
    const requestConfig = {
      params: {
        start: startTime,
        end: endTime
      }
    };
    
    // Add If-None-Match header if we have a cached ETag
    if (cachedETag) {
      requestConfig.headers = {
        'If-None-Match': cachedETag
      };
    }
    
    const response = await apiClient.get(
      `/projects/${collectionSlug}/history/pricefloor/${granularity}`,
      requestConfig
    );
    
    console.log('API response status:', response.status);
    console.log('API response data type:', typeof response.data, Array.isArray(response.data));
    console.log('API response data length:', response.data?.length);
    
    const data = response.data;
    const formattedPriceHistory = formatPriceData(data);
    
    console.log('Formatted price history length:', formattedPriceHistory.length);
    if (formattedPriceHistory.length > 0) {
      console.log('First formatted data point:', formattedPriceHistory[0]);
      console.log('Last formatted data point:', formattedPriceHistory[formattedPriceHistory.length - 1]);
    }
    
    // Extract collection name from first data point
    const collectionName = data.length > 0 ? (data[0].slug || data[0].collection || collectionSlug) : collectionSlug;
    
    const result = {
      success: true,
      data: data,
      collectionName: collectionName,
      priceHistory: formattedPriceHistory,
      rawData: {
        dataPoints: data,
        timestamps: data.map(d => d.timestamp),
        floorEth: data.map(d => d.lowestNative),
        floorUsd: data.map(d => d.lowestUsd)
      }
    };
    
    console.log('Final result object:', {
      success: result.success,
      collectionName: result.collectionName,
      priceHistoryLength: result.priceHistory.length,
      hasData: result.data && result.data.length > 0
    });
    
    // Cache the result with timeframe-aware TTL
    await cacheService.set(cacheKey, result, timeframe);
    
    // Cache ETag for future conditional requests
    const etag = response.headers.etag;
    if (etag) {
      const etagCacheKey = `etag_${cacheKey}`;
      // Cache ETag for 30 minutes (same as API cache-control max-age=1800)
      await cacheService.set(etagCacheKey, etag, '30m');
    }
    
    return result;
  } catch (error) {
    // Handle 304 Not Modified - return cached data
    if (error.response?.status === 304) {
      console.log(`✅ Using cached data for ${collectionSlug} (304 Not Modified)`);
      const cachedData = await cacheService.get(cacheKey, timeframe);
      if (cachedData) {
        return cachedData;
      }
    }
    
    console.error(`❌ Error fetching floor price for ${collectionSlug}:`, error);
    
    // Enhanced error handling
    let errorMessage = 'Unknown error occurred';
    let errorDetails = {};
    
    if (error.code === 'ENOTFOUND') {
      errorMessage = 'DNS resolution failed - Check if the API host is correct';
      errorDetails = { host: RAPIDAPI_HOST };
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'Request timeout - API took too long to respond';
    } else if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      errorMessage = `API Error (${status}): ${error.response.data?.message || error.response.statusText}`;
      errorDetails = {
        status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers
      };
      
      // Specific handling for common API errors
      if (status === 401) {
        errorMessage = 'Authentication failed - Check your RapidAPI key';
      } else if (status === 403) {
        errorMessage = 'Access forbidden - Check API permissions or subscription status';
      } else if (status === 429) {
        errorMessage = 'Rate limit exceeded - Too many requests';
      } else if (status === 404) {
        errorMessage = `Collection '${collectionSlug}' not found or endpoint unavailable`;
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error - Unable to reach the API';
      errorDetails = { 
        code: error.code,
        message: error.message,
        baseURL: API_BASE_URL
      };
    } else {
      // Other error
      errorMessage = error.message || 'Request setup error';
    }
    
    console.error('🔍 Error details:', {
      message: errorMessage,
      details: errorDetails,
      originalError: error.message,
      apiBaseUrl: API_BASE_URL,
      hasApiKey: !!RAPIDAPI_KEY
    });
    
    return {
      success: false,
      error: errorMessage,
      errorDetails,
      data: null
    };
      } finally {
        // Remove the request from pending requests
        pendingRequests.delete(cacheKey);
      }
    })();

    // Store the promise to prevent duplicate requests
    pendingRequests.set(cacheKey, requestPromise);
    
    // Return the promise result
    return await requestPromise;
  } catch (error) {
    console.error(`❌ Unexpected error in fetchFloorPriceHistory for ${collectionSlug}:`, error);
    return {
      success: false,
      error: 'Unexpected error occurred',
      data: null
    };
  }
};

// Import collections from data file
import { TOP_COLLECTIONS } from '../data/collections.js';

/**
 * Search for NFT collections by name
 * Note: RapidAPI may not have a search endpoint, so we provide common collections
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of collection suggestions
 */
export const searchCollections = async (query) => {
  try {
    // Filter top collections based on query
    const filteredCollections = TOP_COLLECTIONS.filter(collection =>
      collection.name.toLowerCase().includes(query.toLowerCase()) ||
      collection.slug.toLowerCase().includes(query.toLowerCase())
    );
    
    return {
      success: true,
      collections: filteredCollections.slice(0, 10) // Limit to 10 results
    };
  } catch (error) {
    console.error('Error searching collections:', error);
    
    return {
      success: false,
      error: error.message,
      collections: []
    };
  }
};

/**
 * Fetch top collections from rankings-v2 endpoint with pagination
 * @param {number} limit - Total number of collections to fetch (default: 500)
 * @returns {Promise<Object>} Top collections data
 */
export const fetchTopCollections = async (limit = 500) => {
  try {
    console.log(`🔄 Fetching top ${limit} collections from projects API`);
    
    // Check cache first
    const cacheKey = `top-collections-${limit}`;
    const cachedData = await cacheService.get(cacheKey, '1h'); // Cache for 1 hour
    if (cachedData) {
      console.log(`✅ Using cached top collections data (${cachedData.collections?.length} collections)`);
      return cachedData;
    }
    
    console.log(`🌐 Making API request to fetch all collections...`);
    const response = await apiClient.get('/projects');
    
    console.log(`📄 Received ${response.data?.length || 0} collections`);
    
    const allCollections = [];
    if (response.data && Array.isArray(response.data)) {
      response.data.forEach((collection) => {
        // Transform API response to match our collection format
        allCollections.push({
          slug: collection.slug,
          name: collection.name,
          ranking: collection.ranking,
          image: collection.imageBlur || `https://api.dicebear.com/7.x/shapes/svg?seed=${collection.slug}`,
          floorPrice: collection.stats?.floorInfo?.currentFloorNative,
          floorPriceUsd: collection.stats?.floorInfo?.currentFloorUsd,
          volume: collection.stats?.salesTemporalityUsd?.volume?.val24h,
          marketCap: collection.stats?.floorCapUsd,
          totalSupply: collection.stats?.totalSupply,
          owners: collection.stats?.totalOwners
        });
      });
    }
    
    // Sort by ranking and limit to requested number
    const topCollections = allCollections
      .sort((a, b) => a.ranking - b.ranking)
      .slice(0, limit);
    
    console.log(`✅ Successfully fetched ${topCollections.length} collections`);
    console.log('Sample collections:', topCollections.slice(0, 3));
    
    const result = {
      success: true,
      collections: topCollections,
      totalFetched: topCollections.length,
      fetchedAt: Date.now()
    };
    
    // Cache the result for 1 hour
    await cacheService.set(cacheKey, result, '1h');
    
    return result;
    
  } catch (error) {
    console.error('❌ Error fetching top collections:', error);
    
    let errorMessage = 'Failed to fetch top collections';
    if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        errorMessage = 'Projects endpoint not found - API may have changed';
      } else if (status === 429) {
        errorMessage = 'Rate limit exceeded while fetching collections';
      } else {
        errorMessage = `API Error (${status}): ${error.response.data?.message || error.response.statusText}`;
      }
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Network error - Unable to reach projects API';
    }
    
    return {
      success: false,
      error: errorMessage,
      collections: [],
      totalFetched: 0
    };
  }
};

/**
 * Get current floor price for a collection
 * This will use the latest data from the history endpoint
 * @param {string} collectionSlug - The collection identifier/slug
 * @returns {Promise<Object>} Current floor price data
 */
export const getCurrentFloorPrice = async (collectionSlug) => {
  try {
    // Get recent 1-day data to extract current floor price
    const result = await fetchFloorPriceHistory(collectionSlug, '1d', 1);
    
    if (result.success && result.rawData.floorEth && result.rawData.floorEth.length > 0) {
      const latestIndex = result.rawData.floorEth.length - 1;
      return {
        success: true,
        data: {
          floor_price_eth: result.rawData.floorEth[latestIndex],
          floor_price_usd: result.rawData.floorUsd?.[latestIndex],
          timestamp: result.rawData.timestamps?.[latestIndex]
        },
        floorPrice: result.rawData.floorEth[latestIndex],
        currency: 'ETH'
      };
    } else {
      return {
        success: false,
        error: 'No current price data available',
        data: null
      };
    }
  } catch (error) {
    console.error(`Error fetching current floor price for ${collectionSlug}:`, error);
    
    return {
      success: false,
      error: error.message,
      data: null
    };
  }
};

/**
 * Fetch comprehensive collection details from NFTPricefloor API
 * @param {string} collectionSlug - The collection identifier/slug
 * @returns {Promise<Object>} Collection details including market cap, holders, etc.
 */
export const fetchCollectionDetails = async (collectionSlug) => {
  try {
    const cacheKey = `collection_details_${collectionSlug}`;
    
    // Check if there's already a pending request for this data
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for pending collection details request: ${collectionSlug}`);
      return await pendingRequests.get(cacheKey);
    }
    
    // Try to get from cache first (5 minute TTL for collection details)
    const cachedData = await cacheService.get(cacheKey, '5m');
    if (cachedData) {
      console.log(`✅ Using cached collection details for ${collectionSlug}`);
      return cachedData;
    }
    
    // Create a promise for this request and store it to prevent duplicates
    const requestPromise = (async () => {
      try {
        console.log(`🔄 Fetching collection details for ${collectionSlug}`);
        
        const response = await apiClient.get(`/projects/${collectionSlug}`);
        
        console.log('Collection details API response status:', response.status);
        console.log('Collection details API response data:', response.data);
        
        const data = response.data;
        
        // Debug: Log the stats structure to understand the API response
        console.log('🔍 Debug - API data structure:', {
          hasStats: !!data.stats,
          statsKeys: data.stats ? Object.keys(data.stats) : [],
          floorInfo: data.stats?.floorInfo,
          salesTemporality: data.stats?.salesTemporalityUsd,
          totalOwners: data.stats?.totalOwners,
          totalSupply: data.stats?.totalSupply
        });
        
        // Extract and format the collection data based on NFTPriceFloor API structure
        const result = {
          success: true,
          data: {
            slug: data.slug || collectionSlug,
            name: data.name || data.title || collectionSlug,
            description: data.description,
            image: data.image || data.logo || data.imageBlur,
            website: data.website,
            twitter: data.twitter,
            discord: data.discord,
            
            // Market data from stats object
            floor_price_eth: data.stats?.floorInfo?.currentFloorNative || data.floor_price_eth || data.floorPrice,
            floor_price_usd: data.stats?.floorInfo?.currentFloorUsd || data.floor_price_usd || data.floorPriceUsd,
            market_cap_eth: data.stats?.floorCapEth || data.market_cap_eth || data.marketCapEth,
            market_cap_usd: data.stats?.floorCapUsd || data.market_cap_usd || data.marketCapUsd,
            
            // Volume and trading data from stats
            volume_24h_eth: data.stats?.salesTemporalityEth?.volume?.val24h || data.volume_24h_eth || data.volume24hEth,
            volume_24h_usd: data.stats?.salesTemporalityUsd?.volume?.val24h || data.volume_24h_usd || data.volume24hUsd,
            volume_7d_eth: data.stats?.salesTemporalityEth?.volume?.val7d || data.volume_7d_eth || data.volume7dEth,
            volume_7d_usd: data.stats?.salesTemporalityUsd?.volume?.val7d || data.volume_7d_usd || data.volume7dUsd,
            
            // Price changes from stats
            price_change_24h: data.stats?.floorInfo?.floorChange24h || data.price_change_24h || data.priceChange24h,
            price_change_7d: data.stats?.floorInfo?.floorChange7d || data.price_change_7d || data.priceChange7d,
            price_change_30d: data.stats?.floorInfo?.floorChange30d || data.price_change_30d || data.priceChange30d,
            
            // Collection stats
            total_supply: data.stats?.totalSupply || data.total_supply || data.totalSupply,
            holders_count: data.stats?.totalOwners || data.holders_count || data.holdersCount || data.holders,
            listed_count: data.stats?.totalListed || data.listed_count || data.listedCount,
            
            // Additional metadata
            contract_address: data.contract_address || data.contractAddress,
            blockchain: data.blockchain || 'ethereum',
            created_date: data.created_date || data.createdDate,
            verified: data.verified || false,
            ranking: data.ranking,
            
            // Raw data for debugging
            _raw: data
          },
          collectionName: data.name || data.title || collectionSlug,
          timestamp: Date.now()
        };
        
        console.log('Formatted collection details result:', {
          success: result.success,
          collectionName: result.collectionName,
          floorPrice: result.data.floor_price_eth,
          marketCap: result.data.market_cap_usd,
          holders: result.data.holders_count
        });
        
        // Cache the result with 5-minute TTL
        await cacheService.set(cacheKey, result, '5m');
        
        return result;
        
      } catch (error) {
        console.error(`❌ Error fetching collection details for ${collectionSlug}:`, error);
        
        let errorMessage = 'Failed to fetch collection details';
        if (error.response) {
          const status = error.response.status;
          if (status === 404) {
            errorMessage = `Collection '${collectionSlug}' not found`;
          } else if (status === 429) {
            errorMessage = 'Rate limit exceeded while fetching collection details';
          } else {
            errorMessage = `API Error (${status}): ${error.response.data?.message || error.response.statusText}`;
          }
        } else if (error.code === 'ENOTFOUND') {
          errorMessage = 'Network error - Unable to reach collection API';
        }
        
        const errorResult = {
          success: false,
          error: errorMessage,
          data: null,
          collectionName: collectionSlug
        };
        
        // Cache error result for 1 minute to prevent repeated failed requests
        await cacheService.set(cacheKey, errorResult, '1m');
        
        return errorResult;
      }
    })();
    
    // Store the promise to prevent duplicate requests
    pendingRequests.set(cacheKey, requestPromise);
    
    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up the pending request
      pendingRequests.delete(cacheKey);
    }
    
  } catch (error) {
    console.error(`❌ Unexpected error in fetchCollectionDetails for ${collectionSlug}:`, error);
    return {
      success: false,
      error: error.message,
      data: null,
      collectionName: collectionSlug
    };
  }
};
