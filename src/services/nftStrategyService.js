import axios from 'axios';
import { cacheService } from './cacheService.js';

class NFTStrategyService {
  constructor() {
    this.baseURL = '/api/strategies';
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
   * Fetch all strategies from nftstrategy API
   * @returns {Promise<Array>} Array of strategy objects
   */
  async fetchStrategies() {
    const cacheKey = 'all_strategies';
    
    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log('📦 Returning cached strategies data');
        return cached;
      }

      console.log('🔄 Fetching strategies from nftstrategy API...');
      const response = await axios.get(this.baseURL, {
        timeout: 30000
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from nftstrategy API');
      }

      const strategies = response.data;
      
      // Cache the result
      this.setCachedData(cacheKey, strategies);
      
      console.log(`✅ Successfully fetched ${strategies.length} strategies`);
      return strategies;
      
    } catch (error) {
      console.error('❌ Failed to fetch strategies:', error.message);
      
      // Return cached data if available, even if expired
      const cached = this.cache.get(cacheKey);
      if (cached) {
        console.log('⚠️ Returning stale cached data due to API error');
        return cached.data;
      }
      
      throw error;
    }
  }

  /**
   * Fetch burn percentage for a specific strategy
   * @param {string} strategyId - Strategy ID
   * @returns {Promise<number|null>} Burn percentage or null if not available
   */
  async fetchBurnPercentage(strategyId) {
    const cacheKey = `burn_${strategyId}`;
    
    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const response = await axios.get(`${this.baseURL}/${strategyId}/burn`, {
        timeout: 15000
      });

      console.log(`🔍 Burn API response for strategy ${strategyId}:`, response.data);

      // Calculate burn percentage as deadwalletbalance / 1000000000
      const deadWalletBalance = response.data?.deadwalletbalance || 0;
      console.log(`💰 Dead wallet balance for ${strategyId}:`, deadWalletBalance);
      
      const burnPercentage = (deadWalletBalance / 1000000000) * 100; // Convert to percentage
      console.log(`🔥 Calculated burn percentage for ${strategyId}:`, burnPercentage);
      
      // Cache the result
      this.setCachedData(cacheKey, burnPercentage);
      
      return burnPercentage;
      
    } catch (error) {
      console.warn(`Failed to fetch burn percentage for strategy ${strategyId}:`, error.message);
      return null;
    }
  }

  /**
   * Fetch holders count for a specific strategy
   * @param {string} strategyId - Strategy ID
   * @returns {Promise<number|null>} Holders count or null if not available
   */
  async fetchHolders(strategyId) {
    const cacheKey = `holders_${strategyId}`;
    
    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const response = await axios.get(`${this.baseURL}/${strategyId}/holders`, {
        timeout: 15000
      });

      const holders = response.data?.holders || null;
      
      // Cache the result
      this.setCachedData(cacheKey, holders);
      
      return holders;
      
    } catch (error) {
      console.warn(`Failed to fetch holders for strategy ${strategyId}:`, error.message);
      return null;
    }
  }

  /**
   * Enhance strategies data with additional information
   * @param {Array} strategies - Array of strategy objects
   * @returns {Promise<Array>} Enhanced strategies array
   */
  async enhanceStrategiesData(strategies) {
    if (!Array.isArray(strategies)) {
      return strategies;
    }

    console.log(`🔄 Enhancing ${strategies.length} strategies with burn data...`);
    
    const enhancedStrategies = strategies.map((strategy) => {
      try {
        // Calculate burn percentage directly from deadWalletBalance in the strategy data
        const deadWalletBalance = strategy.deadWalletBalance || 0;
        console.log(`💰 Dead wallet balance for ${strategy.name || strategy.id}:`, deadWalletBalance);
        
        const burnPercentage = deadWalletBalance > 0 ? (deadWalletBalance / 1000000000) * 100 : 0;
        console.log(`🔥 Calculated burn percentage for ${strategy.name || strategy.id}:`, burnPercentage);

        return {
          ...strategy,
          burnPercentage
        };
      } catch (error) {
        console.warn(`Failed to enhance strategy ${strategy.id}:`, error.message);
        return {
          ...strategy,
          burnPercentage: 0
        };
      }
    });

    console.log('✅ Successfully enhanced strategies data');
    return enhancedStrategies;
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ NFT Strategy service cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      timeout: this.cacheTimeout
    };
  }

  /**
   * Get token price history for a strategy
   * @param {string} tokenAddress - Token contract address
   * @returns {Promise<Array>} Token price history data
   */
  async getTokenPriceHistory(tokenAddress) {
    const cacheKey = `token_price_${tokenAddress}`;
    
    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // Mock data for now - in a real implementation, this would call a price API
      const mockData = this.generateMockPriceData();
      
      // Cache the result
      this.setCachedData(cacheKey, mockData);
      
      return mockData;
      
    } catch (error) {
      console.warn(`Failed to fetch token price history for ${tokenAddress}:`, error.message);
      return [];
    }
  }

  /**
   * Get holdings breakdown for a strategy
   * @param {string} tokenAddress - Token contract address
   * @returns {Promise<Array>} Holdings breakdown data
   */
  async getHoldingsBreakdown(tokenAddress) {
    const cacheKey = `holdings_${tokenAddress}`;
    
    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // Mock data for now - in a real implementation, this would call the strategy API
      const mockHoldings = this.generateMockHoldings();
      
      // Cache the result
      this.setCachedData(cacheKey, mockHoldings);
      
      return mockHoldings;
      
    } catch (error) {
      console.warn(`Failed to fetch holdings breakdown for ${tokenAddress}:`, error.message);
      return [];
    }
  }

  /**
   * Get historical sales data for a collection
   * @param {string} collectionSlug - Collection slug or name
   * @returns {Promise<Array>} Historical sales data
   */
  async getHistoricalSales(collectionSlug) {
    const cacheKey = `sales_${collectionSlug}`;
    
    try {
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return cached;
      }

      // Mock data for now - in a real implementation, this would call OpenSea or similar API
      const mockSales = this.generateMockSales();
      
      // Cache the result
      this.setCachedData(cacheKey, mockSales);
      
      return mockSales;
      
    } catch (error) {
      console.warn(`Failed to fetch historical sales for ${collectionSlug}:`, error.message);
      return [];
    }
  }

  /**
   * Generate mock price data for demonstration
   * @returns {Array} Mock price data
   */
  generateMockPriceData() {
    const data = [];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    for (let i = 30; i >= 0; i--) {
      const timestamp = now - (i * oneDay);
      const basePrice = 0.05;
      const variation = (Math.random() - 0.5) * 0.02;
      const price = Math.max(0.01, basePrice + variation);
      
      data.push({
        timestamp: Math.floor(timestamp / 1000),
        price: price,
        priceUsd: price * 2000, // Assuming ETH = $2000
        volume: Math.random() * 1000000
      });
    }
    
    return data;
  }

  /**
   * Generate mock holdings data for demonstration
   * @returns {Array} Mock holdings data
   */
  generateMockHoldings() {
    const holdings = [];
    const numHoldings = Math.floor(Math.random() * 10) + 5; // 5-15 holdings
    
    for (let i = 0; i < numHoldings; i++) {
      holdings.push({
        tokenId: `#${Math.floor(Math.random() * 10000)}`,
        rarity: ['Common', 'Rare', 'Epic', 'Legendary'][Math.floor(Math.random() * 4)],
        estimatedValue: Math.random() * 5 + 0.5, // 0.5-5.5 ETH
        acquisitionDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
    
    return holdings.sort((a, b) => b.estimatedValue - a.estimatedValue);
  }

  /**
   * Generate mock sales data for demonstration
   * @returns {Array} Mock sales data
   */
  generateMockSales() {
    const sales = [];
    const numSales = Math.floor(Math.random() * 20) + 10; // 10-30 sales
    
    for (let i = 0; i < numSales; i++) {
      sales.push({
        tokenId: `#${Math.floor(Math.random() * 10000)}`,
        price: Math.random() * 10 + 0.1, // 0.1-10.1 ETH
        date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        buyer: `0x${Math.random().toString(16).substr(2, 40)}`,
        marketplace: ['OpenSea', 'LooksRare', 'X2Y2', 'Blur'][Math.floor(Math.random() * 4)]
      });
    }
    
    return sales.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
}

// Create and export singleton instance
export const nftStrategyService = new NFTStrategyService();
export default nftStrategyService;