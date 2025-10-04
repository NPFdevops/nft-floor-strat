class EthPriceService {
  constructor() {
    this.cache = null;
    this.cacheTimeout = 2 * 60 * 1000; // 2 minutes
    this.lastFetch = null;
    
    console.log('💱 EthPriceService initialized');
  }

  /**
   * Fetch current ETH to USD price from Coinbase API
   * @returns {Promise<number|null>} ETH price in USD or null if error
   */
  async getEthPriceInUsd() {
    try {
      // Check cache first
      if (this.cache && this.lastFetch && Date.now() - this.lastFetch < this.cacheTimeout) {
        console.log('💱 Returning cached ETH price:', this.cache);
        return this.cache;
      }

      console.log('💱 Fetching ETH price from Coinbase API...');
      const response = await fetch('https://api.coinbase.com/v2/prices/ETH-USD/spot', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000) // 10 seconds
      });

      if (!response.ok) {
        console.error('❌ Coinbase API error:', response.status, response.statusText);
        return null;
      }

      const data = await response.json();
      
      if (!data?.data?.amount) {
        console.error('❌ Invalid Coinbase API response:', data);
        return null;
      }

      const ethPrice = parseFloat(data.data.amount);
      
      if (isNaN(ethPrice) || ethPrice <= 0) {
        console.error('❌ Invalid ETH price received:', data.data.amount);
        return null;
      }

      // Cache the result
      this.cache = ethPrice;
      this.lastFetch = Date.now();
      
      console.log('✅ ETH price fetched successfully:', ethPrice, 'USD');
      return ethPrice;

    } catch (error) {
      console.error('❌ Failed to fetch ETH price:', error.message);
      return null;
    }
  }

  /**
   * Convert ETH amount to USD
   * @param {number} ethAmount - Amount in ETH
   * @returns {Promise<number|null>} USD value or null if error
   */
  async convertEthToUsd(ethAmount) {
    if (!ethAmount || isNaN(ethAmount) || ethAmount <= 0) {
      return null;
    }

    const ethPrice = await this.getEthPriceInUsd();
    if (!ethPrice) {
      return null;
    }

    return ethAmount * ethPrice;
  }

  /**
   * Clear price cache
   */
  clearCache() {
    this.cache = null;
    this.lastFetch = null;
    console.log('🗑️ ETH price cache cleared');
  }

  /**
   * Get cache status
   * @returns {Object} Cache information
   */
  getCacheStatus() {
    return {
      hasCache: !!this.cache,
      cachedPrice: this.cache,
      lastFetch: this.lastFetch,
      cacheAge: this.lastFetch ? Date.now() - this.lastFetch : null,
      cacheExpired: this.lastFetch ? Date.now() - this.lastFetch > this.cacheTimeout : true
    };
  }
}

export const ethPriceService = new EthPriceService();
export default ethPriceService;