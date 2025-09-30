import axios from 'axios';

class HoldingsService {
  constructor() {
    this.baseURL = '/api'; // Use local proxy instead of external URL
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
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
      
      const response = await axios.get(`${this.baseURL}/holdings`, {
        params: {
          strategyAddress,
          nftAddress
        },
        timeout: 30000
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from holdings API');
      }

      const holdings = response.data.map(holding => ({
        tokenId: holding.token_id,
        currentPrice: holding.current_price,
        imageUrl: holding.image_url,
        // Convert price from wei to ETH for display
        priceInEth: holding.current_price ? (parseFloat(holding.current_price) / 1e18).toFixed(4) : '0',
        // Format price in USD (assuming 1 ETH = $2000 for now, this could be dynamic)
        priceInUsd: holding.current_price ? ((parseFloat(holding.current_price) / 1e18) * 2000).toFixed(2) : '0'
      }));
      
      // Cache the result
      this.setCachedData(cacheKey, holdings);
      
      console.log(`✅ Successfully fetched ${holdings.length} holdings`);
      return holdings;
      
    } catch (error) {
      console.error('❌ Failed to fetch holdings:', error.message);
      
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
   * Get holdings summary statistics
   * @param {Array} holdings - Holdings array
   * @returns {Object} Summary statistics
   */
  getHoldingsSummary(holdings) {
    if (!holdings || holdings.length === 0) {
      return {
        totalCount: 0,
        totalValueEth: '0',
        totalValueUsd: '0',
        averageValueEth: '0',
        averageValueUsd: '0'
      };
    }

    const totalValueEth = holdings.reduce((sum, holding) => sum + parseFloat(holding.priceInEth || 0), 0);
    const totalValueUsd = holdings.reduce((sum, holding) => sum + parseFloat(holding.priceInUsd || 0), 0);
    const averageValueEth = totalValueEth / holdings.length;
    const averageValueUsd = totalValueUsd / holdings.length;

    return {
      totalCount: holdings.length,
      totalValueEth: totalValueEth.toFixed(4),
      totalValueUsd: totalValueUsd.toFixed(2),
      averageValueEth: averageValueEth.toFixed(4),
      averageValueUsd: averageValueUsd.toFixed(2)
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