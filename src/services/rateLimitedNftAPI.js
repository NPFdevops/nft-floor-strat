/**
 * Rate-Limited NFTPriceFloor API Service
 * 
 * This service provides rate-limited access to the NFTPriceFloor API to prevent
 * timeout issues and ensure reliable data fetching for all collections.
 */

import { strategyToSlugMappingService } from './strategyToSlugMapping.js';

class RateLimitedNftAPIService {
  constructor() {
    this.requestQueue = [];
    this.isProcessing = false;
    this.rateLimitDelay = 1000; // 1 second between requests
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.maxRetries = 3;
    
    console.log('🚀 Rate-Limited NFT API Service initialized');
  }

  /**
   * Get cached data if available and not expired
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`📦 [RATE-LIMITED-API] Using cached data for: ${key}`);
      return cached.data;
    }
    return null;
  }

  /**
   * Set data in cache
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Add request to queue and process
   */
  async queueRequest(requestFunction) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ requestFunction, resolve, reject });
      this.processQueue();
    });
  }

  /**
   * Process request queue with rate limiting
   */
  async processQueue() {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 [RATE-LIMITED-API] Processing queue: ${this.requestQueue.length} requests`);

    while (this.requestQueue.length > 0) {
      const { requestFunction, resolve, reject } = this.requestQueue.shift();
      
      try {
        const result = await requestFunction();
        resolve(result);
      } catch (error) {
        reject(error);
      }

      // Wait before processing next request
      if (this.requestQueue.length > 0) {
        console.log(`⏳ [RATE-LIMITED-API] Waiting ${this.rateLimitDelay}ms before next request...`);
        await this.delay(this.rateLimitDelay);
      }
    }

    this.isProcessing = false;
    console.log('✅ [RATE-LIMITED-API] Queue processing complete');
  }

  /**
   * Utility function to create delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch collection details with rate limiting and caching
   */
  async fetchCollectionDetails(collectionName, rapidApiKey) {
    const cacheKey = `collection_${collectionName}`;
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // Get mapped slug
    const mappedSlug = strategyToSlugMappingService.getSlugFromStrategyName(collectionName);
    if (!mappedSlug) {
      throw new Error(`No mapping found for collection: ${collectionName}`);
    }

    console.log(`🔄 [RATE-LIMITED-API] Queuing collection details request for: ${collectionName} -> ${mappedSlug}`);

    return this.queueRequest(async () => {
      const url = `https://nftpf-api-v0.p.rapidapi.com/projects/${mappedSlug}`;
      console.log(`📡 [RATE-LIMITED-API] Fetching collection details: ${url}`);
      
      let lastError;
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': rapidApiKey,
              'X-RapidAPI-Host': 'nftpf-api-v0.p.rapidapi.com'
            },
            timeout: 30000 // 30 second timeout
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log(`✅ [RATE-LIMITED-API] Collection details fetched successfully: ${collectionName}`);
          
          // Cache the result
          this.setCachedData(cacheKey, data);
          return data;

        } catch (error) {
          lastError = error;
          console.warn(`⚠️ [RATE-LIMITED-API] Attempt ${attempt}/${this.maxRetries} failed for ${collectionName}: ${error.message}`);
          
          if (attempt < this.maxRetries) {
            await this.delay(attempt * 1000); // Exponential backoff
          }
        }
      }

      throw new Error(`Failed to fetch collection details for ${collectionName} after ${this.maxRetries} attempts: ${lastError.message}`);
    });
  }

  /**
   * Fetch price history with rate limiting and caching
   */
  async fetchPriceHistory(collectionName, timeframe = '2h', rapidApiKey) {
    const cacheKey = `price_${collectionName}_${timeframe}`;
    
    // Check cache first
    const cached = this.getCachedData(cacheKey);
    if (cached) {
      return cached;
    }

    // Get mapped slug
    const mappedSlug = strategyToSlugMappingService.getSlugFromStrategyName(collectionName);
    if (!mappedSlug) {
      throw new Error(`No mapping found for collection: ${collectionName}`);
    }

    console.log(`🔄 [RATE-LIMITED-API] Queuing price history request for: ${collectionName} -> ${mappedSlug} (${timeframe})`);

    return this.queueRequest(async () => {
      const url = `https://nftpf-api-v0.p.rapidapi.com/projects/${mappedSlug}/charts/${timeframe}`;
      console.log(`📡 [RATE-LIMITED-API] Fetching price history: ${url}`);
      
      // Use new API key specifically for 2h timeframe endpoint
      const apiKeyToUse = timeframe === '2h' ? import.meta.env.VITE_RAPIDAPI_KEY_NEW : rapidApiKey;
      console.log(`🔑 [RATE-LIMITED-API] Using ${timeframe === '2h' ? 'new' : 'original'} API key for ${timeframe} endpoint`);
      
      let lastError;
      for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': apiKeyToUse,
              'X-RapidAPI-Host': 'nftpf-api-v0.p.rapidapi.com'
            },
            timeout: 30000 // 30 second timeout
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          
          // Validate data structure
          if (!data.timestamps || !data.floorNative || !Array.isArray(data.timestamps) || !Array.isArray(data.floorNative)) {
            throw new Error('Invalid data structure received from API');
          }

          console.log(`✅ [RATE-LIMITED-API] Price history fetched successfully: ${collectionName} (${data.timestamps.length} points)`);
          
          // Cache the result
          this.setCachedData(cacheKey, data);
          return data;

        } catch (error) {
          lastError = error;
          console.warn(`⚠️ [RATE-LIMITED-API] Attempt ${attempt}/${this.maxRetries} failed for ${collectionName}: ${error.message}`);
          
          if (attempt < this.maxRetries) {
            await this.delay(attempt * 1000); // Exponential backoff
          }
        }
      }

      throw new Error(`Failed to fetch price history for ${collectionName} after ${this.maxRetries} attempts: ${lastError.message}`);
    });
  }

  /**
   * Batch fetch multiple collections with proper rate limiting
   */
  async batchFetchCollections(collectionNames, rapidApiKey) {
    console.log(`🔄 [RATE-LIMITED-API] Batch fetching ${collectionNames.length} collections`);
    
    const results = [];
    const errors = [];

    for (const collectionName of collectionNames) {
      try {
        const [collectionDetails, priceHistory] = await Promise.all([
          this.fetchCollectionDetails(collectionName, rapidApiKey),
          this.fetchPriceHistory(collectionName, '2h', rapidApiKey)
        ]);

        results.push({
          collectionName,
          collectionDetails,
          priceHistory,
          success: true
        });

      } catch (error) {
        console.error(`❌ [RATE-LIMITED-API] Failed to fetch data for ${collectionName}:`, error.message);
        errors.push({
          collectionName,
          error: error.message,
          success: false
        });
      }
    }

    console.log(`📊 [RATE-LIMITED-API] Batch fetch complete: ${results.length} successful, ${errors.length} failed`);
    
    return {
      successful: results,
      failed: errors,
      totalRequested: collectionNames.length,
      successRate: ((results.length / collectionNames.length) * 100).toFixed(1)
    };
  }

  /**
   * Clear cache for a specific collection or all collections
   */
  clearCache(collectionName = null) {
    if (collectionName) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.includes(collectionName)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
      console.log(`🗑️ [RATE-LIMITED-API] Cleared cache for: ${collectionName}`);
    } else {
      this.cache.clear();
      console.log('🗑️ [RATE-LIMITED-API] Cleared all cache');
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    const validEntries = Array.from(this.cache.values()).filter(
      entry => now - entry.timestamp < this.cacheTimeout
    );

    return {
      totalCached: this.cache.size,
      validCached: validEntries.length,
      cacheHitRate: validEntries.length > 0 ? ((validEntries.length / this.cache.size) * 100).toFixed(1) : '0',
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing
    };
  }

  /**
   * Update rate limiting settings
   */
  updateSettings(settings) {
    if (settings.rateLimitDelay) {
      this.rateLimitDelay = settings.rateLimitDelay;
      console.log(`🔧 [RATE-LIMITED-API] Updated rate limit delay to: ${this.rateLimitDelay}ms`);
    }
    
    if (settings.cacheTimeout) {
      this.cacheTimeout = settings.cacheTimeout;
      console.log(`🔧 [RATE-LIMITED-API] Updated cache timeout to: ${this.cacheTimeout}ms`);
    }

    if (settings.maxRetries) {
      this.maxRetries = settings.maxRetries;
      console.log(`🔧 [RATE-LIMITED-API] Updated max retries to: ${this.maxRetries}`);
    }
  }
}

// Create and export singleton instance
const rateLimitedNftAPI = new RateLimitedNftAPIService();

export { rateLimitedNftAPI };
export default rateLimitedNftAPI;