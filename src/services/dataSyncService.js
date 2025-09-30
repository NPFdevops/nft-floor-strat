/**
 * Data Sync Service for Daily NFT Floor Price Updates
 * Fetches data from external API and stores in local database
 */

import { getDatabase } from './databaseService.js';
import { rateLimitManager } from './rateLimitManager.js';
import { fetchFloorPriceHistory, fetchTopCollections } from './nftAPI.js';
import { getMarketCapSelectionService } from './marketCapSelectionService.js';
import axios from 'axios';

class DataSyncService {
  constructor() {
    this.db = getDatabase();
    this.marketCapService = getMarketCapSelectionService();
    this.config = {
      maxCollections: 250,        // Top 250 collections by market cap
      batchSize: 10,              // Process in batches to respect rate limits
      delayBetweenBatches: 2000,  // 2 second delay between batches
      maxRetries: 3,              // Max retries per collection
      timeoutPerCollection: 60000, // 60s timeout per collection
      dataRetentionDays: 365,     // Keep 1 year of data (rolling window)
    };

    console.log('📊 Data Sync Service initialized (Market Cap Methodology)');
  }

  /**
   * Main daily sync function - syncs all collections
   */
  async performDailySync() {
    const logId = this.db.startSyncLog('daily');
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting daily sync...');
      
      // Step 1: Check if quarterly selection update is needed
      const selectionCheck = this.marketCapService.needsNewSelection();
      if (selectionCheck.needed) {
        console.log(`📅 Quarterly selection update needed: ${selectionCheck.reason}`);
        const selectionResult = await this.marketCapService.performQuarterlySelection();
        if (selectionResult.success) {
          console.log(`✅ Quarterly selection completed for period ${selectionResult.period}`);
        } else {
          console.warn(`⚠️  Quarterly selection failed: ${selectionResult.error}`);
        }
      }
      
      // Step 2: Update collections list (metadata refresh)
      const collectionsResult = await this.syncCollectionsList();
      
      // Step 3: Get TOP 250 collections by market cap to sync
      const activeCollections = this.db.getCurrentTop250Collections();
      console.log(`📋 Found ${activeCollections.length} collections to sync`);
      
      // Step 3: Sync price history for all collections
      const syncResults = await this.syncPriceHistoryBatch(activeCollections);
      
      // Step 4: Calculate final statistics
      const totalProcessed = syncResults.processed;
      const totalInserted = syncResults.inserted;
      const totalErrors = syncResults.errors;
      
      console.log('✅ Daily sync completed:', {
        collections: activeCollections.length,
        processed: totalProcessed,
        inserted: totalInserted,
        errors: totalErrors,
        duration: `${Math.round((Date.now() - startTime) / 1000)}s`
      });

      // Complete sync log
      this.db.completeSyncLog(logId, 'completed', {
        processed: totalProcessed,
        inserted: totalInserted,
        updated: 0,
        error: totalErrors > 0 ? `${totalErrors} collections failed` : null
      });

      return {
        success: true,
        processed: totalProcessed,
        inserted: totalInserted,
        errors: totalErrors,
        duration: Date.now() - startTime
      };

    } catch (error) {
      console.error('❌ Daily sync failed:', error);
      
      this.db.completeSyncLog(logId, 'failed', {
        error: error.message
      });

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Sync collections list from API
   */
  async syncCollectionsList() {
    console.log('📋 Syncing collections list...');
    
    try {
      const result = await fetchTopCollections(this.config.maxCollections);
      
      if (!result.success || !result.collections) {
        throw new Error('Failed to fetch collections from API');
      }

      // Transform API data to database format
      const collectionsData = result.collections.map(collection => ({
        slug: collection.slug,
        name: collection.name,
        ranking: collection.ranking,
        image: collection.image,
        totalSupply: collection.totalSupply,
        owners: collection.owners,
        marketCap: collection.marketCap
      }));

      // Bulk insert/update collections
      const insertedCount = this.db.bulkInsertCollections(collectionsData);
      
      console.log(`✅ Synced ${insertedCount} collections`);
      
      return {
        success: true,
        processed: collectionsData.length,
        inserted: insertedCount
      };
    } catch (error) {
      console.error('❌ Collections sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync price history for a batch of collections
   */
  async syncPriceHistoryBatch(collections) {
    let totalProcessed = 0;
    let totalInserted = 0;
    let totalErrors = 0;

    // Process collections in batches
    for (let i = 0; i < collections.length; i += this.config.batchSize) {
      const batch = collections.slice(i, i + this.config.batchSize);
      console.log(`📦 Processing batch ${Math.floor(i / this.config.batchSize) + 1}/${Math.ceil(collections.length / this.config.batchSize)} (${batch.length} collections)`);
      
      // Process batch with concurrency control
      const batchPromises = batch.map(collection => 
        this.syncCollectionPriceHistory(collection.slug)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Aggregate batch results
      batchResults.forEach((result, index) => {
        totalProcessed++;
        
        if (result.status === 'fulfilled' && result.value.success) {
          totalInserted += result.value.inserted;
          console.log(`✅ ${batch[index].slug}: ${result.value.inserted} records`);
        } else {
          totalErrors++;
          const error = result.status === 'rejected' ? result.reason : result.value.error;
          console.error(`❌ ${batch[index].slug}: ${error}`);
        }
      });
      
      // Rate limiting delay between batches
      if (i + this.config.batchSize < collections.length) {
        console.log(`⏳ Waiting ${this.config.delayBetweenBatches / 1000}s before next batch...`);
        await this.sleep(this.config.delayBetweenBatches);
      }
    }

    return {
      processed: totalProcessed,
      inserted: totalInserted,
      errors: totalErrors
    };
  }

  /**
   * Sync price history for a single collection
   */
  async syncCollectionPriceHistory(collectionSlug, daysToFetch = 1) {
    try {
      // Calculate date range (fetch last N days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysToFetch);
      
      const endTimestamp = Math.floor(endDate.getTime() / 1000);
      const startTimestamp = Math.floor(startDate.getTime() / 1000);

      // Check if we already have today's data
      const today = endDate.toISOString().split('T')[0];
      const existingData = this.db.getPriceHistory(collectionSlug, today, today);
      
      if (existingData.length > 0) {
        console.log(`⏭️ ${collectionSlug}: Already have today's data`);
        return { success: true, inserted: 0, skipped: true };
      }

      // Fetch data from API with rate limiting
      const requestFn = async () => {
        return await fetchFloorPriceHistory(
          collectionSlug, 
          '1d', 
          startTimestamp, 
          endTimestamp
        );
      };

      const result = await rateLimitManager.queueRequest(requestFn, 'normal');
      
      if (!result.success || !result.data || result.data.length === 0) {
        return { 
          success: false, 
          error: result.error || 'No data received',
          inserted: 0 
        };
      }

      // Transform and insert data
      const priceHistoryData = result.data.map(dataPoint => ({
        collectionSlug: collectionSlug,
        date: new Date(dataPoint.timestamp * 1000).toISOString().split('T')[0],
        timestamp: dataPoint.timestamp,
        floorEth: parseFloat(dataPoint.lowestNative) || null,
        floorUsd: parseFloat(dataPoint.lowestUsd) || null,
        volumeEth: parseFloat(dataPoint.volumeNative) || null,
        volumeUsd: parseFloat(dataPoint.volumeUsd) || null,
        salesCount: parseInt(dataPoint.salesCount) || null
      }));

      // Filter out invalid data
      const validData = priceHistoryData.filter(data => 
        data.floorEth !== null && data.floorEth > 0
      );

      if (validData.length === 0) {
        return { 
          success: false, 
          error: 'No valid price data found',
          inserted: 0 
        };
      }

      // Insert into database
      const insertedCount = this.db.bulkInsertPriceHistory(validData);
      
      return {
        success: true,
        inserted: insertedCount,
        dataPoints: validData.length
      };

    } catch (error) {
      console.error(`❌ Failed to sync ${collectionSlug}:`, error);
      return {
        success: false,
        error: error.message,
        inserted: 0
      };
    }
  }

  /**
   * Sync historical data for a single collection (for initial setup)
   */
  async syncCollectionHistoricalData(collectionSlug, daysBack = 30) {
    const logId = this.db.startSyncLog('collection', collectionSlug);
    
    try {
      console.log(`🔄 Syncing ${daysBack} days of historical data for ${collectionSlug}`);
      
      const result = await this.syncCollectionPriceHistory(collectionSlug, daysBack);
      
      this.db.completeSyncLog(logId, result.success ? 'completed' : 'failed', {
        processed: 1,
        inserted: result.inserted || 0,
        error: result.error || null
      });

      return result;
    } catch (error) {
      this.db.completeSyncLog(logId, 'failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get sync status and statistics
   */
  getSyncStatus() {
    const recentLogs = this.db.getRecentSyncLogs(10);
    const dbStats = this.db.getStats();
    
    const lastSync = recentLogs.length > 0 ? recentLogs[0] : null;
    const lastSuccessfulSync = recentLogs.find(log => log.status === 'completed');
    
    return {
      database: dbStats,
      lastSync: lastSync ? {
        type: lastSync.sync_type,
        status: lastSync.status,
        startedAt: lastSync.started_at,
        completedAt: lastSync.completed_at,
        duration: lastSync.duration_seconds,
        processed: lastSync.records_processed,
        inserted: lastSync.records_inserted,
        error: lastSync.error_message
      } : null,
      lastSuccessfulSync: lastSuccessfulSync ? {
        startedAt: lastSuccessfulSync.started_at,
        completedAt: lastSuccessfulSync.completed_at,
        processed: lastSuccessfulSync.records_processed,
        inserted: lastSuccessfulSync.records_inserted
      } : null,
      recentLogs: recentLogs.slice(0, 5)
    };
  }

  /**
   * Clean up old sync logs
   */
  cleanupSyncLogs(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString();

    const result = this.db.query(
      'DELETE FROM sync_log WHERE started_at < ?', 
      [cutoffDateStr]
    );

    console.log(`🧹 Cleaned up ${result.changes} old sync logs`);
    return result.changes;
  }

  /**
   * Force sync specific collections
   */
  async forceSyncCollections(collectionSlugs, daysBack = 1) {
    console.log(`🔄 Force syncing ${collectionSlugs.length} collections...`);
    
    const results = [];
    for (const slug of collectionSlugs) {
      try {
        const result = await this.syncCollectionPriceHistory(slug, daysBack);
        results.push({ slug, ...result });
      } catch (error) {
        results.push({ 
          slug, 
          success: false, 
          error: error.message,
          inserted: 0 
        });
      }
    }
    
    return results;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
let syncInstance = null;

export const getDataSyncService = () => {
  if (!syncInstance) {
    syncInstance = new DataSyncService();
  }
  return syncInstance;
};

export default DataSyncService;
