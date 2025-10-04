import axios from 'axios';
import { ethPriceService } from './ethPriceService.js';

class HoldingsService {
  constructor() {
    // Use relative API paths for both dev and production (handled by Vite proxy in dev, Vercel serverless functions in prod)
    this.baseURL = '/api';
    
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    console.log('🔧 HoldingsService initialized with baseURL:', this.baseURL);
  }

  /**
   * Get cached data if available and not expired
   * @param {string} key - Cache key
   * @returns {any|null} Cached data or null if expired/not found
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Fetch holdings data for a specific strategy and NFT collection
   * @param {string} strategyAddress - Strategy contract address
   * @param {string} nftAddress - NFT contract address
   * @returns {Promise<Array>} Array of holdings with token_id, current_price, and image_url
   */
  async fetchHoldings(strategyAddress, nftAddress) {
    const cacheKey = `holdings_${strategyAddress}_${nftAddress}`;
    
    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log('📦 Returning cached holdings data');
        return cached;
      }

      console.log(`🔄 Fetching holdings for strategy ${strategyAddress} and NFT ${nftAddress}...`);
      const requestUrl = `${this.baseURL}/holdings`;
      console.log('🔧 Request URL:', requestUrl);
      console.log('🔧 Environment:', import.meta.env.MODE);
      
      const response = await axios.get(requestUrl, {
        params: {
          strategyAddress,
          nftAddress
        },
        timeout: 30000
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      console.log('📡 Response data type:', typeof response.data);
      console.log('📡 Response data preview:', typeof response.data === 'string' ? response.data.substring(0, 200) : JSON.stringify(response.data).substring(0, 200));

      // Enhanced error detection for HTML responses (common in Vercel deployment issues)
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        const htmlSnippet = typeof response.data === 'string' 
          ? response.data.substring(0, 500) 
          : String(response.data).substring(0, 500);
        console.error('🚨 HTML Response detected:', htmlSnippet);
        throw new Error(`Received HTML instead of JSON. This usually indicates a deployment/routing issue. Content-Type: ${contentType}. Response: ${htmlSnippet}...`);
      }

      if (!response.data || !Array.isArray(response.data)) {
        const dataType = Array.isArray(response.data) ? 'array' : typeof response.data;
        const dataSnippet = typeof response.data === 'string' 
          ? response.data.substring(0, 100) 
          : JSON.stringify(response.data).substring(0, 100);
        throw new Error(`Invalid response format from holdings API. Expected array, got ${dataType}. Data: ${dataSnippet}...`);
      }

      const holdings = response.data.map(holding => ({
        tokenId: holding.token_id,
        currentPrice: holding.current_price,
        imageUrl: holding.image_url,
        // Convert price from wei to ETH for display
        priceInEth: holding.current_price ? (parseFloat(holding.current_price) / 1e18).toFixed(4) : null,
        // USD price will be calculated separately using real ETH price
        priceInUsd: null // Will be calculated later with real ETH price
      }));
      
      // Cache the result
      this.setCachedData(cacheKey, holdings);
      
      console.log(`✅ Successfully fetched ${holdings.length} holdings`);
      return holdings;
      
    } catch (error) {
      console.error('❌ Failed to fetch holdings:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: `${this.baseURL}/holdings`,
        params: { strategyAddress, nftAddress },
        headers: error.response?.headers
      });
      
      // Return cached data if available, even if expired
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log('⚠️ Returning stale cached holdings data due to API error');
        return cached.data;
      }
      
      // Return empty array if no cache available
      return [];
    }
  }

  /**
   * Calculate USD prices for holdings using current ETH price
   * @param {Array} holdings - Holdings array
   * @returns {Promise<Array>} Holdings with USD prices calculated
   */
  async calculateUsdPrices(holdings) {
    if (!holdings || holdings.length === 0) {
      return holdings;
    }

    const ethPriceInUsd = await ethPriceService.getEthPriceInUsd();
    
    if (!ethPriceInUsd) {
      console.warn('⚠️ Could not fetch ETH price, USD values will show as "No data"');
      return holdings.map(holding => ({
        ...holding,
        priceInUsd: null
      }));
    }

    return holdings.map(holding => {
      const ethPrice = parseFloat(holding.priceInEth);
      const usdPrice = ethPrice && !isNaN(ethPrice) ? ethPrice * ethPriceInUsd : null;
      
      return {
        ...holding,
        priceInUsd: usdPrice ? usdPrice.toFixed(2) : null
      };
    });
  }

  /**
   * Get holdings summary statistics using floor price calculation
   * @param {Array} holdings - Holdings array
   * @param {number} floorPriceEth - Floor price in ETH from NFTPriceFloor API
   * @returns {Promise<Object>} Summary statistics
   */
  async getHoldingsSummary(holdings, floorPriceEth = null) {
    if (!holdings || holdings.length === 0) {
      return {
        totalCount: 0,
        totalValueEth: null,
        totalValueUsd: null,
        averageValueEth: null,
        averageValueUsd: null
      };
    }

    // Calculate total value using floor price if provided
    let totalValueEth = null;
    if (floorPriceEth && !isNaN(floorPriceEth) && floorPriceEth > 0) {
      totalValueEth = floorPriceEth * holdings.length;
    }

    // Calculate total value in USD if we have ETH total
    let totalValueUsd = null;
    if (totalValueEth) {
      const usdValue = await ethPriceService.convertEthToUsd(totalValueEth);
      totalValueUsd = usdValue ? usdValue.toFixed(2) : null;
    }

    return {
      totalCount: holdings.length,
      totalValueEth: totalValueEth ? totalValueEth.toFixed(4) : null,
      totalValueUsd: totalValueUsd,
      averageValueEth: null, // Hide average as requested
      averageValueUsd: null  // Hide average as requested
    };
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ Holdings cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const holdingsService = new HoldingsService();
export default holdingsService;