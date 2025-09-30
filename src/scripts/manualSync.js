#!/usr/bin/env node

/**
 * Manual Sync Script
 * Allows manual execution of data sync for testing and maintenance
 */

import { getDataSyncService } from '../services/dataSyncService.js';
import { getDailySyncScheduler } from '../scheduler/dailySync.js';
import { getMarketCapSelectionService } from '../services/marketCapSelectionService.js';

async function runManualSync() {
  console.log('🔧 Starting manual sync...\n');

  const args = process.argv.slice(2);
  const command = args[0];

  try {
    const syncService = getDataSyncService();
    const marketCapService = getMarketCapSelectionService();

    switch (command) {
      case 'daily':
        console.log('🔄 Running daily sync...');
        const dailyResult = await syncService.performDailySync();
        console.log('Results:', dailyResult);
        break;

      case 'collections':
        console.log('📋 Syncing collections list...');
        const collectionsResult = await syncService.syncCollectionsList();
        console.log('Results:', collectionsResult);
        break;

      case 'collection':
        const collectionSlug = args[1];
        const daysBack = parseInt(args[2]) || 30;
        
        if (!collectionSlug) {
          console.error('❌ Please provide a collection slug');
          console.log('Usage: npm run sync:manual collection <slug> [days]');
          process.exit(1);
        }
        
        console.log(`🔄 Syncing ${daysBack} days for collection: ${collectionSlug}`);
        const collectionResult = await syncService.syncCollectionHistoricalData(collectionSlug, daysBack);
        console.log('Results:', collectionResult);
        break;

      case 'status':
        console.log('📊 Getting sync status...');
        const status = syncService.getSyncStatus();
        console.log('Status:', JSON.stringify(status, null, 2));
        break;

      case 'scheduler':
        const action = args[1]; // 'start', 'stop', 'status'
        const scheduler = getDailySyncScheduler();
        
        switch (action) {
          case 'start':
            console.log('▶️  Starting scheduler...');
            scheduler.start();
            break;
          case 'stop':
            console.log('⏹️  Stopping scheduler...');
            scheduler.stop();
            break;
          case 'status':
            console.log('📊 Scheduler status:');
            const schedulerStatus = scheduler.getStatus();
            console.log(JSON.stringify(schedulerStatus, null, 2));
            break;
          case 'run':
            console.log('🔧 Running manual daily sync via scheduler...');
            await scheduler.runManualSync();
            break;
          case 'cleanup':
            console.log('🧹 Running manual cleanup via scheduler...');
            await scheduler.runManualCleanup();
            break;
          default:
            console.log('Available scheduler actions: start, stop, status, run, cleanup');
        }
        break;

      case 'selection':
        const selectionAction = args[1]; // 'check', 'update', 'status', 'history'
        
        switch (selectionAction) {
          case 'check':
            console.log('🔍 Checking if quarterly selection update is needed...');
            const needsUpdate = marketCapService.needsNewSelection();
            console.log('Result:', needsUpdate);
            break;
          case 'update':
            console.log('🎯 Running quarterly market cap selection...');
            const updateResult = await marketCapService.performQuarterlySelection();
            console.log('Result:', updateResult);
            break;
          case 'status':
            console.log('📊 Getting active selection status...');
            const selectionInfo = marketCapService.getActiveSelectionInfo();
            console.log('Active Selection:', JSON.stringify(selectionInfo, null, 2));
            break;
          case 'history':
            console.log('📚 Getting selection history...');
            const history = marketCapService.getSelectionHistory();
            console.log('Selection History:', JSON.stringify(history, null, 2));
            break;
          case 'collections':
            console.log('🏆 Getting current top 250 collections...');
            const top250 = marketCapService.getCurrentTop250Collections();
            console.log(`Current Top 250: ${top250.length} collections`);
            top250.slice(0, 10).forEach((col, i) => {
              console.log(`  ${i + 1}. ${col.name}: $${(col.market_cap || 0).toLocaleString()} (Rank ${col.market_cap_rank})`);
            });
            if (top250.length > 10) {
              console.log(`  ... and ${top250.length - 10} more collections`);
            }
            break;
          default:
            console.log('Available selection actions: check, update, status, history, collections');
        }
        break;

      default:
        console.log('🔧 Manual Sync Commands:\n');
        console.log('Available commands:');
        console.log('  daily                    - Run full daily sync');
        console.log('  collections              - Sync collections list only');
        console.log('  collection <slug> [days] - Sync specific collection');
        console.log('  status                   - Show sync status');
        console.log('  selection <action>       - Manage quarterly market cap selections');
        console.log('  scheduler <action>       - Control scheduler (start/stop/status/run/cleanup)');
        console.log('\nSelection actions:');
        console.log('  check                    - Check if quarterly update needed');
        console.log('  update                   - Run quarterly selection update');
        console.log('  status                   - Show active selection period');
        console.log('  history                  - Show selection history');
        console.log('  collections              - List current top 250 collections');
        console.log('\nExamples:');
        console.log('  npm run sync:manual daily');
        console.log('  npm run sync:manual collection cryptopunks 30');
        console.log('  npm run sync:manual selection check');
        console.log('  npm run sync:manual selection update');
        console.log('  npm run sync:manual scheduler status');
        break;
    }

    console.log('\n✅ Manual sync command completed');

  } catch (error) {
    console.error('\n💥 Manual sync failed:', error.message);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runManualSync()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Manual sync failed:', error);
      process.exit(1);
    });
}

export default runManualSync;
