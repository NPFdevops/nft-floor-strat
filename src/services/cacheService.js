/**
 * Enhanced Cache Service for NFT Price Floor API
 * Implements multi-layer caching with localStorage and intelligent TTL
 */

class CacheService {
  constructor() {
    // Memory cache for fastest access
    this.memoryCache = new Map();
    
    // Cache configuration with different TTL for different timeframes
    this.config = {
      TTL: {
        '30d': 30 * 60 * 1000,      // 30 minutes for 30-day data (fresh)
        '90d': 2 * 60 * 60 * 1000,  // 2 hours for 90-day data (fresh)
        '1Y': 6 * 60 * 60 * 1000,   // 6 hours for 1-year data (fresh)
        'YTD': 6 * 60 * 60 * 1000,  // 6 hours for YTD data (fresh)
        'collections': 60 * 60 * 1000, // 1 hour for collections list (fresh)
        'default': 30 * 60 * 1000   // 30 minutes default (fresh)
      },
      // Stale-while-revalidate: data is stale but usable for this additional time
      staleTTL: {
        '30d': 60 * 60 * 1000,      // Stale-usable for 1 hour
        '90d': 4 * 60 * 60 * 1000,  // Stale-usable for 4 hours  
        '1Y': 12 * 60 * 60 * 1000,  // Stale-usable for 12 hours
        'YTD': 12 * 60 * 60 * 1000, // Stale-usable for 12 hours
        'collections': 2 * 60 * 60 * 1000, // Stale-usable for 2 hours
        'default': 60 * 60 * 1000   // Stale-usable for 1 hour
      },
      maxMemorySize: 200,           // Increased from 150
      maxLocalStorageSize: 800,     // Increased from 500
      localStoragePrefix: 'nft_cache_v2_',
      compressionThreshold: 5 * 1024 // Compress data >5KB
    };
    
    // Track background refresh promises to avoid duplicate refreshes
    this.backgroundRefreshes = new Map();
    
    // Performance metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      staleHits: 0,
      backgroundRefreshes: 0
    };

    // Initialize cleanup
    this.initPeriodicCleanup();
  }

  /**
   * Generate cache key with timeframe awareness
   */
  generateCacheKey(collectionSlug, granularity, startTimestamp, endTimestamp, timeframe = null) {
    const startDate = new Date(startTimestamp * 1000).toISOString().split('T')[0];
    const endDate = new Date(endTimestamp * 1000).toISOString().split('T')[0];
    
    return `${collectionSlug}_${granularity}_${startDate}_${endDate}${timeframe ? '_' + timeframe : ''}`;
  }

  /**
   * Get data from multi-layer cache with stale-while-revalidate pattern
   */
  async getWithRevalidate(cacheKey, timeframe = 'default', refreshFunction = null) {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(cacheKey);
    if (memoryItem) {
      if (this.isFresh(memoryItem, timeframe)) {
        memoryItem.lastAccessed = Date.now();
        this.metrics.hits++;
        console.log('🚀 Cache HIT (memory, fresh):', cacheKey);
        return memoryItem.data;
      } else if (this.isStaleButUsable(memoryItem, timeframe)) {
        memoryItem.lastAccessed = Date.now();
        this.metrics.staleHits++;
        console.log('🔄 Cache HIT (memory, stale) - refreshing in background:', cacheKey);
        
        // Return stale data immediately, refresh in background
        if (refreshFunction) {
          this.backgroundRefresh(cacheKey, timeframe, refreshFunction);
        }
        return memoryItem.data;
      }
    }

    // Check localStorage
    try {
      const storageKey = this.config.localStoragePrefix + cacheKey;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const item = this.decompressData(JSON.parse(stored));
        
        if (this.isFresh(item, timeframe)) {
          // Promote to memory cache
          item.lastAccessed = Date.now();
          this.memoryCache.set(cacheKey, item);
          this.manageMemoryCache();
          this.metrics.hits++;
          console.log('🚀 Cache HIT (localStorage, fresh):', cacheKey);
          return item.data;
        } else if (this.isStaleButUsable(item, timeframe)) {
          // Promote to memory cache and refresh in background
          item.lastAccessed = Date.now();
          this.memoryCache.set(cacheKey, item);
          this.manageMemoryCache();
          this.metrics.staleHits++;
          console.log('🔄 Cache HIT (localStorage, stale) - refreshing in background:', cacheKey);
          
          if (refreshFunction) {
            this.backgroundRefresh(cacheKey, timeframe, refreshFunction);
          }
          return item.data;
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.warn('localStorage cache error:', error);
    }

    this.metrics.misses++;
    console.log('❌ Cache MISS:', cacheKey);
    return null;
  }

  /**
   * Background refresh for stale-while-revalidate pattern
   */
  async backgroundRefresh(cacheKey, timeframe, refreshFunction) {
    // Avoid duplicate background refreshes
    if (this.backgroundRefreshes.has(cacheKey)) {
      return;
    }

    const refreshPromise = (async () => {
      try {
        console.log('🔄 Background refresh started:', cacheKey);
        const freshData = await refreshFunction();
        await this.set(cacheKey, freshData, timeframe);
        this.metrics.backgroundRefreshes++;
        console.log('✅ Background refresh completed:', cacheKey);
      } catch (error) {
        console.warn('Background refresh failed:', cacheKey, error);
      } finally {
        this.backgroundRefreshes.delete(cacheKey);
      }
    })();

    this.backgroundRefreshes.set(cacheKey, refreshPromise);
    return refreshPromise;
  }

  /**
   * Get data from multi-layer cache (memory first, then localStorage)
   */
  async get(cacheKey, timeframe = 'default') {
    // Check memory cache first
    const memoryItem = this.memoryCache.get(cacheKey);
    if (memoryItem && this.isFresh(memoryItem, timeframe)) {
      memoryItem.lastAccessed = Date.now();
      this.metrics.hits++;
      console.log('🚀 Cache HIT (memory):', cacheKey);
      return memoryItem.data;
    }

    // Check localStorage
    try {
      const storageKey = this.config.localStoragePrefix + cacheKey;
      const stored = localStorage.getItem(storageKey);
      
      if (stored) {
        const item = this.decompressData(JSON.parse(stored));
        if (this.isFresh(item, timeframe)) {
          // Promote to memory cache
          item.lastAccessed = Date.now();
          this.memoryCache.set(cacheKey, item);
          this.manageMemoryCache();
          this.metrics.hits++;
          console.log('🚀 Cache HIT (localStorage):', cacheKey);
          return item.data;
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch (error) {
      console.warn('localStorage cache error:', error);
    }

    this.metrics.misses++;
    console.log('❌ Cache MISS:', cacheKey);
    return null;
  }

  /**
   * Store data in both memory and localStorage with compression
   */
  async set(cacheKey, data, timeframe = 'default') {
    const now = Date.now();
    const item = {
      data,
      timestamp: now,
      lastAccessed: now,
      timeframe,
      size: JSON.stringify(data).length
    };

    // Store in memory cache
    this.memoryCache.set(cacheKey, item);
    this.manageMemoryCache();

    // Store in localStorage with compression
    try {
      const storageKey = this.config.localStoragePrefix + cacheKey;
      const compressedItem = this.compressData(item);
      localStorage.setItem(storageKey, JSON.stringify(compressedItem));
      this.manageLocalStorageCache();
    } catch (error) {
      console.warn('localStorage cache write error:', error);
      this.cleanupLocalStorage();
    }

    console.log('💾 Cache SET:', cacheKey, `(${timeframe})`);
  }

  /**
   * Compress data if it exceeds threshold
   */
  compressData(item) {
    const dataStr = JSON.stringify(item.data);
    
    if (dataStr.length > this.config.compressionThreshold) {
      try {
        // Simple compression using base64 encoding with URI encoding
        const compressed = btoa(encodeURIComponent(dataStr));
        console.log(`🗜️ Compressed data: ${dataStr.length} → ${compressed.length} bytes (${Math.round((1 - compressed.length/dataStr.length) * 100)}% reduction)`);
        
        return {
          ...item,
          data: compressed,
          compressed: true,
          originalSize: dataStr.length
        };
      } catch (error) {
        console.warn('Compression failed:', error);
        return item;
      }
    }
    
    return item;
  }

  /**
   * Decompress data if it was compressed
   */
  decompressData(item) {
    if (item.compressed) {
      try {
        const decompressed = decodeURIComponent(atob(item.data));
        return {
          ...item,
          data: JSON.parse(decompressed),
          compressed: false
        };
      } catch (error) {
        console.warn('Decompression failed:', error);
        return item;
      }
    }
    
    return item;
  }

  /**
   * Check if cached item is fresh (within TTL)
   */
  isFresh(item, timeframe) {
    if (!item || !item.timestamp) return false;
    
    const ttl = this.config.TTL[timeframe] || this.config.TTL.default;
    const age = Date.now() - item.timestamp;
    
    return age < ttl;
  }

  /**
   * Check if cached item is stale but still usable (within stale TTL)
   */
  isStaleButUsable(item, timeframe) {
    if (!item || !item.timestamp) return false;
    
    const freshTTL = this.config.TTL[timeframe] || this.config.TTL.default;
    const staleTTL = this.config.staleTTL[timeframe] || this.config.staleTTL.default;
    const age = Date.now() - item.timestamp;
    
    return age >= freshTTL && age < (freshTTL + staleTTL);
  }

  /**
   * Check if cached item is still valid (legacy method for backward compatibility)
   */
  isValid(item, timeframe) {
    return this.isFresh(item, timeframe) || this.isStaleButUsable(item, timeframe);
  }

  /**
   * Manage memory cache size with LRU eviction
   */
  manageMemoryCache() {
    if (this.memoryCache.size <= this.config.maxMemorySize) return;

    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    const toRemove = entries.slice(0, entries.length - this.config.maxMemorySize);
    toRemove.forEach(([key]) => {
      this.memoryCache.delete(key);
      this.metrics.evictions++;
    });
  }

  /**
   * Manage localStorage cache size
   */
  manageLocalStorageCache() {
    try {
      const cacheKeys = this.getLocalStorageCacheKeys();
      
      if (cacheKeys.length <= this.config.maxLocalStorageSize) return;

      const items = cacheKeys.map(key => {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          return { key, lastAccessed: item.lastAccessed || 0 };
        } catch {
          return { key, lastAccessed: 0 };
        }
      });

      items.sort((a, b) => a.lastAccessed - b.lastAccessed);
      const toRemove = items.slice(0, items.length - this.config.maxLocalStorageSize);
      
      toRemove.forEach(({ key }) => {
        localStorage.removeItem(key);
        this.metrics.evictions++;
      });
    } catch (error) {
      console.warn('localStorage cache management error:', error);
    }
  }

  /**
   * Get all localStorage cache keys
   */
  getLocalStorageCacheKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.config.localStoragePrefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  /**
   * Clean up expired entries
   */
  cleanupExpired() {
    // Clean memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (!this.isValid(item, item.timeframe)) {
        this.memoryCache.delete(key);
      }
    }

    // Clean localStorage cache
    try {
      const cacheKeys = this.getLocalStorageCacheKeys();
      cacheKeys.forEach(key => {
        try {
          const item = this.decompressData(JSON.parse(localStorage.getItem(key)));
          if (!this.isValid(item, item.timeframe)) {
            localStorage.removeItem(key);
          }
        } catch {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  }

  /**
   * Clean up localStorage when it's getting full
   */
  cleanupLocalStorage() {
    try {
      this.cleanupExpired();
      
      const cacheKeys = this.getLocalStorageCacheKeys();
      if (cacheKeys.length > this.config.maxLocalStorageSize * 0.8) {
        const items = cacheKeys.map(key => {
          try {
            const item = JSON.parse(localStorage.getItem(key));
            return { key, lastAccessed: item.lastAccessed || 0 };
          } catch {
            return { key, lastAccessed: 0 };
          }
        });

        items.sort((a, b) => a.lastAccessed - b.lastAccessed);
        const toRemove = items.slice(0, Math.floor(items.length * 0.3));
        
        toRemove.forEach(({ key }) => localStorage.removeItem(key));
      }
    } catch (error) {
      console.warn('localStorage cleanup error:', error);
    }
  }

  /**
   * Initialize periodic cleanup
   */
  initPeriodicCleanup() {
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Clear all cache
   */
  clear() {
    this.memoryCache.clear();
    
    try {
      const cacheKeys = this.getLocalStorageCacheKeys();
      cacheKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats() {
    const totalRequests = this.metrics.hits + this.metrics.misses + this.metrics.staleHits;
    const hitRate = totalRequests > 0 
      ? ((this.metrics.hits + this.metrics.staleHits) / totalRequests * 100).toFixed(2)
      : 0;
    const freshHitRate = totalRequests > 0 
      ? (this.metrics.hits / totalRequests * 100).toFixed(2)
      : 0;

    return {
      ...this.metrics,
      hitRate: `${hitRate}%`,
      freshHitRate: `${freshHitRate}%`,
      memoryCacheSize: this.memoryCache.size,
      localStorageSize: this.getLocalStorageCacheKeys().length,
      maxMemorySize: this.config.maxMemorySize,
      maxLocalStorageSize: this.config.maxLocalStorageSize,
      activeBackgroundRefreshes: this.backgroundRefreshes.size
    };
  }

  /**
   * Convenience method for stale-while-revalidate pattern
   * Returns cached data immediately if available (fresh or stale), 
   * and optionally refreshes stale data in background
   */
  async deduplicate(cacheKey, fetchFunction, timeframe = 'default') {
    // Try to get cached data first (with background refresh for stale data)
    const cachedData = await this.getWithRevalidate(cacheKey, timeframe, fetchFunction);
    
    if (cachedData !== null) {
      return cachedData;
    }
    
    // No cached data available, fetch fresh data
    console.log('🔄 Fetching fresh data:', cacheKey);
    const freshData = await fetchFunction();
    await this.set(cacheKey, freshData, timeframe);
    
    return freshData;
  }
}

// Export singleton instance
export const cacheService = new CacheService();
