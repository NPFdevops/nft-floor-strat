#!/usr/bin/env node

/**
 * Full Year Sync Script
 * Implements the complete 1-year methodology for top 250 collections
 * This is designed to run once for initial setup, then daily syncs maintain the data
 */

import { getDatabase } from '../services/databaseService.js';
import { getDataSyncService } from '../services/dataSyncService.js';
import { getMarketCapSelectionService } from '../services/marketCapSelectionService.js';
import { rateLimitManager } from '../services/rateLimitManager.js';

class FullYearSync {
  constructor() {
    this.db = getDatabase();
    this.syncService = getDataSyncService();
    this.marketCapService = getMarketCapSelectionService();
    this.config = {
      targetCollections: 250,    // Top 250 collections by market cap
      daysToSync: 365,          // 1 full year
      batchSize: 5,             // Smaller batches for large historical syncs
      delayBetweenCollections: 3000, // 3 seconds between collections
      progressReportInterval: 10,    // Report progress every 10 collections
      maxRetriesPerCollection: 5,    // More retries for large sync
    };
  }

  /**
   * Execute the full year sync methodology
   */
  async execute() {
    console.log('🎯 Full Year Sync - NFT Floor Compare Methodology');
    console.log('=' .repeat(60));
    console.log(`📊 Target: ${this.config.targetCollections} collections`);
    console.log(`📅 Period: ${this.config.daysToSync} days (1 year)`);
    console.log(`⏱️  Estimated time: 2-4 hours`);
    console.log('=' .repeat(60));
    console.log();

    const startTime = Date.now();
    let logId;

    try {
      // Step 1: Perform quarterly market cap selection
      console.log('🎯 Step 1: Performing market cap selection for top 250 collections...');
      logId = this.db.startSyncLog('full_year', null);
      
      const selectionResult = await this.marketCapService.performQuarterlySelection();
      if (!selectionResult.success) {
        throw new Error(`Market cap selection failed: ${selectionResult.error}`);
      }

      console.log(`✅ Selected ${selectionResult.selected} collections by market cap`);
      console.log(`💰 Market cap range: $${selectionResult.marketCapRange.min_market_cap.toLocaleString()} - $${selectionResult.marketCapRange.max_market_cap.toLocaleString()}\n`);

      // Step 2: Get selected top 250 collections
      const targetCollections = this.db.getCurrentTop250Collections();

      console.log(`🎯 Step 2: Selected top ${targetCollections.length} collections for 1-year sync\n`);

      // Step 3: Historical data sync with progress tracking
      console.log(`🔄 Step 3: Syncing ${this.config.daysToSync} days of historical data...`);
      console.log('⚠️  This will take several hours. Please be patient and keep the process running.\n');

      const results = await this.syncHistoricalDataBatch(targetCollections);

      // Step 4: Results summary
      const endTime = Date.now();
      const totalDuration = Math.round((endTime - startTime) / 1000);
      const hours = Math.floor(totalDuration / 3600);
      const minutes = Math.floor((totalDuration % 3600) / 60);

      console.log('\n' + '=' .repeat(60));
      console.log('🎉 Full Year Sync Complete!');
      console.log('=' .repeat(60));
      console.log(`⏱️  Total time: ${hours}h ${minutes}m`);
      console.log(`✅ Successful: ${results.successful}`);
      console.log(`❌ Failed: ${results.failed}`);
      console.log(`📊 Total records: ${results.totalRecords.toLocaleString()}`);
      console.log();

      // Final database stats
      const finalStats = this.db.getStats();
      console.log('📈 Final Database Statistics:');
      console.log(`   Collections: ${finalStats.totalCollections}`);
      console.log(`   Price records: ${finalStats.totalPriceRecords.toLocaleString()}`);
      console.log(`   Database size: ${finalStats.databaseSize} MB`);
      console.log(`   Date range: ${finalStats.earliestDate} to ${finalStats.latestDate}`);
      console.log();

      // Success recommendations
      console.log('🚀 Next Steps:');
      console.log('   1. Your database now contains 1 year of historical data');
      console.log('   2. Daily sync will automatically add new data each day');
      console.log('   3. Old data beyond 1 year will be automatically cleaned');
      console.log('   4. Your app will now serve charts instantly from local data');
      console.log();

      // Complete sync log
      this.db.completeSyncLog(logId, 'completed', {
        processed: targetCollections.length,
        inserted: results.totalRecords,
        updated: 0,
        error: results.failed > 0 ? `${results.failed} collections failed` : null
      });

      return {
        success: true,
        ...results,
        duration: totalDuration
      };

    } catch (error) {
      console.error('\n💥 Full year sync failed:', error.message);
      
      if (logId) {
        this.db.completeSyncLog(logId, 'failed', {
          error: error.message
        });
      }

      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Sync historical data for a batch of collections
   */
  async syncHistoricalDataBatch(collections) {
    let successful = 0;
    let failed = 0;
    let totalRecords = 0;

    console.log(`🔄 Processing ${collections.length} collections in batches of ${this.config.batchSize}...\n`);

    for (let i = 0; i < collections.length; i += this.config.batchSize) {
      const batch = collections.slice(i, i + this.config.batchSize);
      const batchNumber = Math.floor(i / this.config.batchSize) + 1;
      const totalBatches = Math.ceil(collections.length / this.config.batchSize);

      console.log(`📦 Batch ${batchNumber}/${totalBatches} (${batch.length} collections):`);

      // Process batch with rate limiting
      const batchPromises = batch.map(async (collection, batchIndex) => {
        const globalIndex = i + batchIndex;
        return this.syncSingleCollectionWithRetry(collection, globalIndex + 1, collections.length);
      });

      const batchResults = await Promise.allSettled(batchPromises);

      // Process batch results
      batchResults.forEach((result, batchIndex) => {
        const globalIndex = i + batchIndex;
        const collection = batch[batchIndex];

        if (result.status === 'fulfilled' && result.value.success) {
          successful++;
          totalRecords += result.value.records;
          
          if ((globalIndex + 1) % this.config.progressReportInterval === 0) {
            const progress = Math.round(((globalIndex + 1) / collections.length) * 100);
            console.log(`   📊 Progress: ${progress}% (${globalIndex + 1}/${collections.length})`);
          }
        } else {
          failed++;
          const error = result.status === 'rejected' ? result.reason : result.value.error;
          console.log(`   ❌ ${collection.name || collection.slug}: ${error}`);
        }
      });

      // Rate limiting delay between batches
      if (i + this.config.batchSize < collections.length) {
        const remainingBatches = Math.ceil((collections.length - i - this.config.batchSize) / this.config.batchSize);
        console.log(`   ⏳ Waiting 5s before next batch (${remainingBatches} batches remaining)...`);
        await this.sleep(5000);
      }

      console.log(); // Empty line for readability
    }

    return {
      successful,
      failed,
      totalRecords
    };
  }

  /**
   * Sync a single collection with retry logic
   */
  async syncSingleCollectionWithRetry(collection, index, total) {
    for (let attempt = 1; attempt <= this.config.maxRetriesPerCollection; attempt++) {
      try {
        // Add to rate limit queue
        const requestFn = async () => {
          return await this.syncService.syncCollectionPriceHistory(
            collection.slug, 
            this.config.daysToSync
          );
        };

        const result = await rateLimitManager.queueRequest(requestFn, 'normal');

        if (result.success) {
          return {
            success: true,
            records: result.inserted || 0,
            collection: collection.slug
          };
        } else {
          if (attempt === this.config.maxRetriesPerCollection) {
            return {
              success: false,
              error: result.error || 'Unknown error',
              collection: collection.slug
            };
          }
          // Wait before retry
          await this.sleep(2000 * attempt);
        }
      } catch (error) {
        if (attempt === this.config.maxRetriesPerCollection) {
          return {
            success: false,
            error: error.message,
            collection: collection.slug
          };
        }
        // Wait before retry
        await this.sleep(2000 * attempt);
      }
    }
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get estimated completion time
   */
  getEstimatedTime() {
    // Based on 250 collections, ~3-5 seconds per collection average
    const avgTimePerCollection = 4000; // 4 seconds average
    const totalMs = this.config.targetCollections * avgTimePerCollection;
    const hours = Math.floor(totalMs / (1000 * 60 * 60));
    const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }

  /**
   * Check prerequisites before starting
   */
  async checkPrerequisites() {
    const issues = [];

    // Check database
    try {
      const stats = this.db.getStats();
      if (stats.totalCollections === 0) {
        issues.push('No collections in database - will sync collections first');
      }
    } catch (error) {
      issues.push('Database connection failed');
    }

    // Check API configuration
    const apiKey = process.env.VITE_RAPIDAPI_KEY;
    if (!apiKey) {
      issues.push('VITE_RAPIDAPI_KEY environment variable not set');
    }

    return {
      canProceed: issues.length === 0 || issues.every(i => i.includes('will sync')),
      issues
    };
  }
}

/**
 * Run full year sync
 */
async function runFullYearSync() {
  const fullSync = new FullYearSync();

  console.log('🔍 Checking prerequisites...');
  const prereqCheck = await fullSync.checkPrerequisites();

  if (prereqCheck.issues.length > 0) {
    console.log('⚠️  Prerequisites check:');
    prereqCheck.issues.forEach(issue => console.log(`   - ${issue}`));
    console.log();
  }

  if (!prereqCheck.canProceed) {
    console.log('❌ Cannot proceed. Please fix the issues above.');
    process.exit(1);
  }

  console.log(`⏱️  Estimated completion time: ${fullSync.getEstimatedTime()}`);
  console.log('💡 Tip: This process can be interrupted and resumed by running the command again.');
  console.log();

  // Ask for confirmation
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    readline.question('🤔 Are you ready to start the full 1-year sync? (y/N): ', resolve);
  });
  readline.close();

  if (!answer.toLowerCase().startsWith('y')) {
    console.log('🛑 Sync cancelled by user');
    process.exit(0);
  }

  console.log();
  const result = await fullSync.execute();

  if (result.success) {
    console.log('🎉 Full year sync completed successfully!');
    process.exit(0);
  } else {
    console.log('💥 Full year sync failed. Check the logs above.');
    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runFullYearSync()
    .catch((error) => {
      console.error('Full year sync crashed:', error);
      process.exit(1);
    });
}

export default FullYearSync;
