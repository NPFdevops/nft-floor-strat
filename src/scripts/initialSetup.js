#!/usr/bin/env node

/**
 * Initial Database Setup Script
 * Sets up the database and performs initial data sync
 */

import { getDatabase } from '../services/databaseService.js';
import { getDataSyncService } from '../services/dataSyncService.js';
import { getDailySyncScheduler } from '../scheduler/dailySync.js';

async function runInitialSetup() {
  console.log('🚀 Starting initial database setup...\n');

  try {
    // Step 1: Initialize database
    console.log('📁 Step 1: Initializing database...');
    const db = getDatabase();
    const dbStats = db.getStats();
    console.log('✅ Database initialized:', dbStats);
    console.log();

    // Step 2: Check if we already have data
    if (dbStats.totalPriceRecords > 0) {
      console.log('⚠️  Database already contains data:');
      console.log(`   - Collections: ${dbStats.totalCollections}`);
      console.log(`   - Price records: ${dbStats.totalPriceRecords}`);
      console.log(`   - Date range: ${dbStats.earliestDate} to ${dbStats.latestDate}`);
      
      const proceed = await askUser('\n   Continue with setup anyway? (y/N): ');
      if (!proceed.toLowerCase().startsWith('y')) {
        console.log('🛑 Setup cancelled by user');
        process.exit(0);
      }
    }

    // Step 3: Sync collections list
    console.log('📋 Step 2: Syncing collections list...');
    const syncService = getDataSyncService();
    const collectionsResult = await syncService.syncCollectionsList();
    
    if (collectionsResult.success) {
      console.log(`✅ Synced ${collectionsResult.inserted} collections`);
    } else {
      console.error('❌ Failed to sync collections list');
      process.exit(1);
    }
    console.log();

    // Step 4: Ask user about historical data sync
    console.log('📊 Step 3: Historical data sync options (Top 250 Collections):');
    console.log('   1. Quick start (last 7 days) - ~10-15 minutes');
    console.log('   2. Standard sync (last 30 days) - ~30-45 minutes');
    console.log('   3. Extended sync (last 90 days) - ~60-90 minutes');
    console.log('   4. Full methodology (1 year of data) - ~2-4 hours');
    console.log('   5. Skip historical sync (only run daily sync going forward)');
    
    const choice = await askUser('\n   Choose an option (1-5): ');
    
    let daysBack, maxCollections = 250; // Always use top 250 collections
    switch (choice) {
      case '1':
        daysBack = 7;
        break;
      case '2':
        daysBack = 30;
        break;
      case '3':
        daysBack = 90;
        break;
      case '4':
        daysBack = 365;
        console.log('🎯 Full 1-year sync selected - this will take several hours but gives you complete historical data');
        break;
      case '5':
        console.log('⏭️  Skipping historical sync');
        daysBack = 0;
        break;
      default:
        console.log('📋 Using default: Standard sync (30 days, 250 collections)');
        daysBack = 30;
    }

    // Step 5: Perform historical sync if requested
    if (daysBack > 0) {
      console.log(`\n🔄 Step 4: Syncing ${daysBack} days of historical data for top ${maxCollections} collections...`);
      console.log('⏳ This may take a while. Please be patient...\n');

      const collections = db.getAllCollections().slice(0, maxCollections);
      let completed = 0;
      let errors = 0;

      for (const collection of collections) {
        try {
          process.stdout.write(`\r📊 Progress: ${completed + 1}/${collections.length} - ${collection.name || collection.slug}`);
          
          const result = await syncService.syncCollectionPriceHistory(collection.slug, daysBack);
          
          if (result.success) {
            completed++;
          } else {
            errors++;
          }
          
          // Small delay to respect rate limits
          await sleep(1000);
        } catch (error) {
          errors++;
        }
      }

      console.log(`\n✅ Historical sync completed: ${completed} successful, ${errors} errors\n`);
    }

    // Step 6: Set up scheduler
    console.log('⏰ Step 5: Setting up daily sync scheduler...');
    const scheduler = getDailySyncScheduler();
    
    if (process.env.NODE_ENV === 'production') {
      scheduler.setEnabled(true);
      console.log('✅ Daily sync scheduler enabled for production');
      console.log('   - Daily sync: Every day at 2:00 AM UTC');
      console.log('   - Weekly cleanup: Every Sunday at 3:00 AM UTC');
    } else {
      console.log('ℹ️  Scheduler disabled for development environment');
      console.log('   - Use `npm run sync:manual` to run manual syncs');
    }
    console.log();

    // Step 7: Final summary
    console.log('🎉 Initial setup completed successfully!\n');
    
    const finalStats = db.getStats();
    console.log('📊 Final database statistics:');
    console.log(`   - Collections: ${finalStats.totalCollections}`);
    console.log(`   - Price records: ${finalStats.totalPriceRecords}`);
    console.log(`   - Database size: ${finalStats.databaseSize} MB`);
    if (finalStats.earliestDate && finalStats.latestDate) {
      console.log(`   - Date range: ${finalStats.earliestDate} to ${finalStats.latestDate}`);
    }
    console.log();

    console.log('🔧 Next steps:');
    console.log('   1. Your app will now use local database for chart data');
    console.log('   2. Daily sync will run automatically in production');
    console.log('   3. Use `npm run db:status` to check database health');
    console.log('   4. Use `npm run sync:manual` to run manual syncs');
    console.log();

    console.log('✅ Setup complete! Your NFT Floor Compare app is ready to use.');

  } catch (error) {
    console.error('\n💥 Setup failed:', error.message);
    console.error('\nPlease check the error above and try again.');
    process.exit(1);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function askUser(question) {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question(question, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runInitialSetup()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

export default runInitialSetup;
