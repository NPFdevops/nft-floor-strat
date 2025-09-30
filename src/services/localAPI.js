/**
 * Local Database API Service
 * Serves chart data from local database with fallback to external API
 */

import { getDatabase } from './databaseService.js';
import { fetchFloorPriceHistory as externalFetchFloorPriceHistory, searchCollections as externalSearchCollections } from './nftAPI.js';

class LocalAPIService {
  constructor() {
    this.db = getDatabase();
    this.config = {
      maxFallbackDays: 7,    // Max days old data before falling back to external API
      enableFallback: true,  // Enable fallback to external API if local data is insufficient
    };

    console.log('🏠 Local API Service initialized');
  }

  /**
   * Get floor price history from local database with external API fallback
   */
  async fetchFloorPriceHistory(collectionSlug, granularity = '1d', startTimestamp = null, endTimestamp = null, timeframe = '30d') {
    try {
      // Calculate date range
      const endTime = endTimestamp || Math.floor(Date.now() / 1000);
      const startTime = startTimestamp || (endTime - (30 * 24 * 60 * 60)); // Default 30 days
      
      const startDate = new Date(startTime * 1000).toISOString().split('T')[0];
      const endDate = new Date(endTime * 1000).toISOString().split('T')[0];
      
      console.log(`🔍 Fetching local data for ${collectionSlug} from ${startDate} to ${endDate}`);

      // Try to get data from local database first
      const localData = this.db.getPriceHistory(collectionSlug, startDate, endDate);
      
      if (localData && localData.length > 0) {
        // Check data freshness
        const latestDataDate = new Date(Math.max(...localData.map(d => new Date(d.date))));
        const daysSinceLatest = Math.floor((Date.now() - latestDataDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceLatest <= this.config.maxFallbackDays) {
          console.log(`✅ Using local data for ${collectionSlug} (${localData.length} records, latest: ${latestDataDate.toISOString().split('T')[0]})`);
          
          // Transform local data to match external API format
          const transformedData = this.transformLocalDataToAPIFormat(localData, collectionSlug);
          return transformedData;
        } else {
          console.log(`⚠️ Local data for ${collectionSlug} is ${daysSinceLatest} days old, checking fallback...`);
        }
      }

      // Fallback to external API if enabled and local data is insufficient
      if (this.config.enableFallback) {
        console.log(`🌐 Falling back to external API for ${collectionSlug}`);
        
        const externalResult = await externalFetchFloorPriceHistory(
          collectionSlug, 
          granularity, 
          startTime, 
          endTime, 
          timeframe
        );
        
        if (externalResult.success) {
          // Store the new data in local database for future use
          this.storeExternalDataLocally(collectionSlug, externalResult.data);
          console.log(`💾 Cached external data for ${collectionSlug} locally`);
        }
        
        return externalResult;
      }

      // No local data and fallback disabled
      return {
        success: false,
        error: `No local data available for ${collectionSlug} and external API fallback is disabled`,
        data: null
      };

    } catch (error) {
      console.error(`❌ Error fetching price history for ${collectionSlug}:`, error);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Transform local database data to match external API format
   */
  transformLocalDataToAPIFormat(localData, collectionSlug) {
    const formattedPriceHistory = localData.map(dataPoint => ({
      x: new Date(dataPoint.date + 'T00:00:00.000Z'), // Ensure consistent date parsing
      y: parseFloat(dataPoint.floor_eth) || 0
    })).sort((a, b) => a.x - b.x);

    // Get collection info
    const collection = this.db.getCollection(collectionSlug);
    const collectionName = collection ? collection.name : collectionSlug;

    return {
      success: true,
      data: localData.map(d => ({
        timestamp: d.timestamp,
        lowestNative: d.floor_eth,
        lowestUsd: d.floor_usd,
        volumeNative: d.volume_eth,
        volumeUsd: d.volume_usd,
        salesCount: d.sales_count,
        slug: collectionSlug,
        collection: collectionName
      })),
      collectionName: collectionName,
      priceHistory: formattedPriceHistory,
      rawData: {
        dataPoints: localData,
        timestamps: localData.map(d => d.timestamp),
        floorEth: localData.map(d => d.floor_eth),
        floorUsd: localData.map(d => d.floor_usd)
      },
      source: 'local_database',
      dataCount: localData.length
    };
  }

  /**
   * Store external API data in local database
   */
  storeExternalDataLocally(collectionSlug, externalData) {
    if (!externalData || !Array.isArray(externalData)) {
      return;
    }

    try {
      const priceHistoryData = externalData.map(dataPoint => ({
        collectionSlug: collectionSlug,
        date: new Date(dataPoint.timestamp * 1000).toISOString().split('T')[0],
        timestamp: dataPoint.timestamp,
        floorEth: parseFloat(dataPoint.lowestNative) || null,
        floorUsd: parseFloat(dataPoint.lowestUsd) || null,
        volumeEth: parseFloat(dataPoint.volumeNative) || null,
        volumeUsd: parseFloat(dataPoint.volumeUsd) || null,
        salesCount: parseInt(dataPoint.salesCount) || null
      })).filter(data => data.floorEth !== null && data.floorEth > 0);

      if (priceHistoryData.length > 0) {
        this.db.bulkInsertPriceHistory(priceHistoryData);
      }
    } catch (error) {
      console.error(`❌ Failed to store external data locally for ${collectionSlug}:`, error);
    }
  }

  /**
   * Search collections from local database with external fallback
   */
  async searchCollections(query) {
    try {
      if (!query || query.length < 2) {
        return {
          success: true,
          collections: []
        };
      }

      console.log(`🔍 Searching local collections for: "${query}"`);

      // Search in local database
      const localCollections = this.db.query(`
        SELECT slug, name, ranking, image 
        FROM collections 
        WHERE (name LIKE ? OR slug LIKE ?) 
          AND is_active = 1 
        ORDER BY ranking ASC 
        LIMIT 10
      `, [`%${query}%`, `%${query}%`]);

      if (localCollections && localCollections.length > 0) {
        console.log(`✅ Found ${localCollections.length} collections locally`);
        
        return {
          success: true,
          collections: localCollections.map(col => ({
            name: col.name,
            slug: col.slug,
            ranking: col.ranking,
            image: col.image
          })),
          source: 'local_database'
        };
      }

      // Fallback to external search if enabled and no local results
      if (this.config.enableFallback) {
        console.log(`🌐 No local results for "${query}", falling back to external search`);
        const externalResult = await externalSearchCollections(query);
        
        // Mark the result as from external API
        if (externalResult.success) {
          externalResult.source = 'external_api';
        }
        
        return externalResult;
      }

      return {
        success: true,
        collections: [],
        source: 'local_database'
      };

    } catch (error) {
      console.error('❌ Error searching collections:', error);
      
      return {
        success: false,
        error: error.message,
        collections: []
      };
    }
  }

  /**
   * Get current floor price from local database
   */
  async getCurrentFloorPrice(collectionSlug) {
    try {
      const latestPrice = this.db.getLatestPrice(collectionSlug);
      
      if (latestPrice) {
        // Check if data is recent (within 24 hours)
        const dataAge = Date.now() - (latestPrice.timestamp * 1000);
        const hoursOld = dataAge / (1000 * 60 * 60);
        
        if (hoursOld <= 24) {
          return {
            success: true,
            data: {
              floor_price_eth: latestPrice.floor_eth,
              floor_price_usd: latestPrice.floor_usd,
              timestamp: latestPrice.timestamp
            },
            floorPrice: latestPrice.floor_eth,
            currency: 'ETH',
            source: 'local_database',
            age_hours: Math.round(hoursOld * 100) / 100
          };
        }
      }

      // Fallback to external API for current price if local data is stale
      if (this.config.enableFallback) {
        console.log(`🌐 Local price data is stale for ${collectionSlug}, using external API`);
        
        // Use external API but mark the source
        const externalResult = await externalFetchFloorPriceHistory(collectionSlug, '1d', 1);
        if (externalResult.success && externalResult.rawData.floorEth && externalResult.rawData.floorEth.length > 0) {
          const latestIndex = externalResult.rawData.floorEth.length - 1;
          return {
            success: true,
            data: {
              floor_price_eth: externalResult.rawData.floorEth[latestIndex],
              floor_price_usd: externalResult.rawData.floorUsd?.[latestIndex],
              timestamp: externalResult.rawData.timestamps?.[latestIndex]
            },
            floorPrice: externalResult.rawData.floorEth[latestIndex],
            currency: 'ETH',
            source: 'external_api'
          };
        }
      }

      return {
        success: false,
        error: 'No current price data available',
        data: null
      };

    } catch (error) {
      console.error(`❌ Error fetching current price for ${collectionSlug}:`, error);
      
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get multiple collections data for comparison
   */
  async getCollectionsComparison(collectionSlugs, timeframe = '30d') {
    try {
      // Calculate date range based on timeframe
      const endTime = Math.floor(Date.now() / 1000);
      let startTime;
      
      switch (timeframe) {
        case '7d':
          startTime = endTime - (7 * 24 * 60 * 60);
          break;
        case '30d':
          startTime = endTime - (30 * 24 * 60 * 60);
          break;
        case '90d':
          startTime = endTime - (90 * 24 * 60 * 60);
          break;
        case '1Y':
          startTime = endTime - (365 * 24 * 60 * 60);
          break;
        default:
          startTime = endTime - (30 * 24 * 60 * 60);
      }

      const startDate = new Date(startTime * 1000).toISOString().split('T')[0];
      const endDate = new Date(endTime * 1000).toISOString().split('T')[0];

      // Get data for all collections at once
      const multipleData = this.db.getMultipleCollectionHistory(collectionSlugs, startDate, endDate);
      
      // Group data by collection
      const groupedData = {};
      multipleData.forEach(record => {
        if (!groupedData[record.collection_slug]) {
          groupedData[record.collection_slug] = [];
        }
        groupedData[record.collection_slug].push(record);
      });

      // Transform data for each collection
      const results = {};
      collectionSlugs.forEach(slug => {
        if (groupedData[slug] && groupedData[slug].length > 0) {
          results[slug] = this.transformLocalDataToAPIFormat(groupedData[slug], slug);
        } else {
          results[slug] = {
            success: false,
            error: `No local data available for ${slug}`,
            data: null
          };
        }
      });

      return {
        success: true,
        results: results,
        source: 'local_database',
        timeframe: timeframe
      };

    } catch (error) {
      console.error('❌ Error fetching collections comparison:', error);
      
      return {
        success: false,
        error: error.message,
        results: {}
      };
    }
  }

  /**
   * Get database statistics and health
   */
  getDatabaseHealth() {
    try {
      const stats = this.db.getStats();
      const recentData = this.db.query(`
        SELECT 
          COUNT(DISTINCT collection_slug) as collections_with_recent_data,
          MAX(date) as most_recent_date,
          MIN(date) as oldest_date
        FROM price_history 
        WHERE date >= date('now', '-7 days')
      `)[0] || {};

      return {
        success: true,
        database: stats,
        recentActivity: {
          collectionsWithRecentData: recentData.collections_with_recent_data || 0,
          mostRecentDate: recentData.most_recent_date,
          oldestDate: recentData.oldest_date
        },
        health: {
          status: stats.totalPriceRecords > 0 ? 'healthy' : 'empty',
          dataFreshness: recentData.collections_with_recent_data > 0 ? 'fresh' : 'stale'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        health: {
          status: 'error',
          dataFreshness: 'unknown'
        }
      };
    }
  }

  /**
   * Enable or disable external API fallback
   */
  setFallbackEnabled(enabled) {
    this.config.enableFallback = enabled;
    console.log(`🔧 External API fallback ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get service configuration and status
   */
  getServiceStatus() {
    return {
      config: this.config,
      database: this.getDatabaseHealth(),
      capabilities: {
        localSearch: true,
        localHistory: true,
        localCurrentPrice: true,
        externalFallback: this.config.enableFallback
      }
    };
  }
}

// Create singleton instance
let localAPIInstance = null;

export const getLocalAPI = () => {
  if (!localAPIInstance) {
    localAPIInstance = new LocalAPIService();
  }
  return localAPIInstance;
};

// Export main functions for easy replacement of external API
export const fetchFloorPriceHistory = async (...args) => {
  return getLocalAPI().fetchFloorPriceHistory(...args);
};

export const searchCollections = async (...args) => {
  return getLocalAPI().searchCollections(...args);
};

export const getCurrentFloorPrice = async (...args) => {
  return getLocalAPI().getCurrentFloorPrice(...args);
};

export default LocalAPIService;
