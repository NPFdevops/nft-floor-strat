#!/usr/bin/env node

/**
 * Database Status Script
 * Shows database health, statistics, and recent activity
 */

import { getDatabase } from '../services/databaseService.js';
import { getDataSyncService } from '../services/dataSyncService.js';
import { getLocalAPI } from '../services/localAPI.js';

async function showDatabaseStatus() {
  console.log('📊 Database Status Report\n');
  console.log('=' .repeat(50));

  try {
    const db = getDatabase();
    const syncService = getDataSyncService();
    const localAPI = getLocalAPI();

    // Basic database statistics
    console.log('\n📈 Database Statistics:');
    const stats = db.getStats();
    console.log(`   Total Collections: ${stats.totalCollections}`);
    console.log(`   Active Collections: ${stats.activeCollections}`);
    console.log(`   Price Records: ${stats.totalPriceRecords.toLocaleString()}`);
    console.log(`   Database Size: ${stats.databaseSize} MB`);
    
    if (stats.earliestDate && stats.latestDate) {
      const daysCovered = Math.floor((new Date(stats.latestDate) - new Date(stats.earliestDate)) / (1000 * 60 * 60 * 24));
      console.log(`   Date Range: ${stats.earliestDate} to ${stats.latestDate} (${daysCovered} days)`);
    }

    // Data freshness
    console.log('\n🔄 Data Freshness:');
    const recentData = db.query(`
      SELECT 
        COUNT(DISTINCT collection_slug) as recent_collections,
        COUNT(*) as recent_records,
        MAX(date) as most_recent_date,
        MIN(date) as oldest_recent_date
      FROM price_history 
      WHERE date >= date('now', '-7 days')
    `)[0] || {};

    console.log(`   Collections with data in last 7 days: ${recentData.recent_collections || 0}`);
    console.log(`   Records added in last 7 days: ${(recentData.recent_records || 0).toLocaleString()}`);
    if (recentData.most_recent_date) {
      const daysAgo = Math.floor((Date.now() - new Date(recentData.most_recent_date + 'T00:00:00Z').getTime()) / (1000 * 60 * 60 * 24));
      console.log(`   Most recent data: ${recentData.most_recent_date} (${daysAgo} days ago)`);
    }

    // Top collections by data volume
    console.log('\n🏆 Top Collections by Data Volume:');
    const topCollections = db.query(`
      SELECT 
        c.name,
        c.slug,
        COUNT(ph.id) as record_count,
        MAX(ph.date) as latest_date,
        AVG(ph.floor_eth) as avg_floor_eth
      FROM collections c
      LEFT JOIN price_history ph ON c.slug = ph.collection_slug
      WHERE c.is_active = 1
      GROUP BY c.slug, c.name
      ORDER BY record_count DESC
      LIMIT 10
    `);

    topCollections.forEach((col, index) => {
      const avgFloor = col.avg_floor_eth ? parseFloat(col.avg_floor_eth).toFixed(3) : 'N/A';
      console.log(`   ${index + 1}. ${col.name || col.slug}: ${col.record_count} records, avg: ${avgFloor} ETH`);
    });

    // Recent sync activity
    console.log('\n📝 Recent Sync Activity:');
    const syncStatus = syncService.getSyncStatus();
    
    if (syncStatus.lastSync) {
      const lastSync = syncStatus.lastSync;
      console.log(`   Last Sync: ${lastSync.type} - ${lastSync.status}`);
      console.log(`   Started: ${lastSync.startedAt}`);
      if (lastSync.completedAt) {
        console.log(`   Completed: ${lastSync.completedAt} (${lastSync.duration}s)`);
        console.log(`   Processed: ${lastSync.processed}, Inserted: ${lastSync.inserted}`);
      }
      if (lastSync.error) {
        console.log(`   Error: ${lastSync.error}`);
      }
    } else {
      console.log('   No sync history found');
    }

    if (syncStatus.lastSuccessfulSync) {
      const lastSuccess = syncStatus.lastSuccessfulSync;
      const hoursAgo = Math.floor((Date.now() - new Date(lastSuccess.completedAt).getTime()) / (1000 * 60 * 60));
      console.log(`   Last Successful Sync: ${hoursAgo} hours ago`);
    }

    // Local API health
    console.log('\n🏠 Local API Health:');
    const apiHealth = localAPI.getDatabaseHealth();
    if (apiHealth.success) {
      console.log(`   Status: ${apiHealth.health.status}`);
      console.log(`   Data Freshness: ${apiHealth.health.dataFreshness}`);
      console.log(`   Collections with Recent Data: ${apiHealth.recentActivity.collectionsWithRecentData}`);
    } else {
      console.log(`   Status: Error - ${apiHealth.error}`);
    }

    // Sample recent records
    console.log('\n📋 Sample Recent Records:');
    const sampleRecords = db.query(`
      SELECT 
        ph.collection_slug,
        c.name,
        ph.date,
        ph.floor_eth,
        ph.floor_usd
      FROM price_history ph
      LEFT JOIN collections c ON ph.collection_slug = c.slug
      ORDER BY ph.date DESC, ph.collection_slug
      LIMIT 5
    `);

    sampleRecords.forEach(record => {
      const name = record.name || record.collection_slug;
      const floorEth = record.floor_eth ? parseFloat(record.floor_eth).toFixed(3) : 'N/A';
      const floorUsd = record.floor_usd ? `$${parseFloat(record.floor_usd).toLocaleString()}` : 'N/A';
      console.log(`   ${record.date}: ${name} - ${floorEth} ETH (${floorUsd})`);
    });

    // Health assessment
    console.log('\n🏥 Health Assessment:');
    let healthScore = 100;
    const issues = [];

    if (stats.totalPriceRecords === 0) {
      issues.push('No price data available');
      healthScore -= 50;
    } else if (stats.totalPriceRecords < 1000) {
      issues.push('Very little historical data');
      healthScore -= 20;
    }

    if (!recentData.most_recent_date) {
      issues.push('No recent data found');
      healthScore -= 30;
    } else {
      const daysOld = Math.floor((Date.now() - new Date(recentData.most_recent_date + 'T00:00:00Z').getTime()) / (1000 * 60 * 60 * 24));
      if (daysOld > 3) {
        issues.push(`Data is ${daysOld} days old`);
        healthScore -= (daysOld * 5);
      }
    }

    if ((recentData.recent_collections || 0) < 10) {
      issues.push('Few collections have recent data');
      healthScore -= 15;
    }

    healthScore = Math.max(0, Math.min(100, healthScore));

    if (issues.length === 0) {
      console.log('   ✅ Database is healthy');
    } else {
      console.log('   ⚠️  Issues found:');
      issues.forEach(issue => console.log(`      - ${issue}`));
    }
    console.log(`   Overall Health Score: ${healthScore}/100`);

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (stats.totalPriceRecords === 0) {
      console.log('   - Run initial setup: npm run sync:initial');
    } else if (healthScore < 70) {
      console.log('   - Run manual sync: npm run sync:manual daily');
      if (!syncStatus.lastSuccessfulSync || Date.now() - new Date(syncStatus.lastSuccessfulSync.completedAt).getTime() > 24 * 60 * 60 * 1000) {
        console.log('   - Check sync scheduler status');
      }
    } else {
      console.log('   - Database looks good! Regular maintenance is recommended');
      console.log('   - Monitor daily sync logs for any issues');
    }

    console.log('\n' + '=' .repeat(50));
    console.log('📊 Status report complete');

  } catch (error) {
    console.error('\n💥 Error generating status report:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Show additional details if requested
async function showDetailedStatus() {
  await showDatabaseStatus();

  console.log('\n🔍 Additional Details:\n');
  
  try {
    const db = getDatabase();

    // Collections without recent data
    console.log('📉 Collections Missing Recent Data (last 7 days):');
    const staleCollections = db.query(`
      SELECT 
        c.slug,
        c.name,
        c.ranking,
        MAX(ph.date) as last_data_date
      FROM collections c
      LEFT JOIN price_history ph ON c.slug = ph.collection_slug
      WHERE c.is_active = 1
        AND (ph.date IS NULL OR ph.date < date('now', '-7 days'))
      GROUP BY c.slug, c.name, c.ranking
      ORDER BY c.ranking ASC
      LIMIT 20
    `);

    if (staleCollections.length > 0) {
      staleCollections.forEach(col => {
        const lastDate = col.last_data_date || 'Never';
        console.log(`   ${col.ranking}. ${col.name || col.slug}: ${lastDate}`);
      });
    } else {
      console.log('   ✅ All active collections have recent data');
    }

    // Storage breakdown
    console.log('\n💾 Storage Breakdown:');
    const tableStats = db.query(`
      SELECT name, COUNT(*) as row_count
      FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);

    tableStats.forEach(table => {
      if (table.name === 'collections') {
        const count = db.query('SELECT COUNT(*) as count FROM collections')[0].count;
        console.log(`   Collections: ${count} records`);
      } else if (table.name === 'price_history') {
        const count = db.query('SELECT COUNT(*) as count FROM price_history')[0].count;
        console.log(`   Price History: ${count.toLocaleString()} records`);
      } else if (table.name === 'sync_log') {
        const count = db.query('SELECT COUNT(*) as count FROM sync_log')[0].count;
        console.log(`   Sync Logs: ${count} records`);
      }
    });

  } catch (error) {
    console.error('Error generating detailed status:', error);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
const detailed = args.includes('--detailed') || args.includes('-d');

// Run if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const statusFunction = detailed ? showDetailedStatus : showDatabaseStatus;
  
  statusFunction()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Status check failed:', error);
      process.exit(1);
    });
}

export { showDatabaseStatus, showDetailedStatus };
