/**
 * Daily Sync Scheduler
 * Automatically runs data synchronization every day at specified times
 */

import cron from 'node-cron';
import { getDataSyncService } from '../services/dataSyncService.js';
import { getDatabase } from '../services/databaseService.js';
import { getMarketCapSelectionService } from '../services/marketCapSelectionService.js';

class DailySyncScheduler {
  constructor() {
    this.syncService = getDataSyncService();
    this.db = getDatabase();
    this.marketCapService = getMarketCapSelectionService();
    this.config = {
      // Run at 2:00 AM daily (when traffic is typically lowest)
      dailySyncTime: '0 2 * * *',
      // Run cleanup weekly on Sundays at 3:00 AM
      weeklyCleanupTime: '0 3 * * 0',
      // Enable scheduling by default
      enabled: process.env.NODE_ENV !== 'development',
      // Timezone
      timezone: 'UTC'
    };

    this.jobs = new Map();
    this.isRunning = false;

    console.log('📅 Daily Sync Scheduler initialized');
    console.log('🕐 Daily sync scheduled for:', this.config.dailySyncTime);
    console.log('🧹 Weekly cleanup scheduled for:', this.config.weeklyCleanupTime);
  }

  /**
   * Start all scheduled jobs
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️ Scheduler is already running');
      return;
    }

    if (!this.config.enabled) {
      console.log('⏸️ Scheduler is disabled (development mode)');
      return;
    }

    try {
      // Schedule daily data sync
      const dailySyncJob = cron.schedule(this.config.dailySyncTime, async () => {
        await this.runDailySync();
      }, {
        scheduled: false,
        timezone: this.config.timezone
      });

      // Schedule weekly cleanup
      const weeklyCleanupJob = cron.schedule(this.config.weeklyCleanupTime, async () => {
        await this.runWeeklyCleanup();
      }, {
        scheduled: false,
        timezone: this.config.timezone
      });

      // Store job references
      this.jobs.set('dailySync', dailySyncJob);
      this.jobs.set('weeklyCleanup', weeklyCleanupJob);

      // Start all jobs
      this.jobs.forEach((job, name) => {
        job.start();
        console.log(`✅ Started ${name} job`);
      });

      this.isRunning = true;
      console.log('🚀 All scheduled jobs started successfully');

      // Run initial sync if no recent data
      this.checkAndRunInitialSync();

    } catch (error) {
      console.error('❌ Failed to start scheduler:', error);
      throw error;
    }
  }

  /**
   * Stop all scheduled jobs
   */
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Scheduler is not running');
      return;
    }

    try {
      this.jobs.forEach((job, name) => {
        job.stop();
        job.destroy();
        console.log(`🛑 Stopped ${name} job`);
      });

      this.jobs.clear();
      this.isRunning = false;
      console.log('✅ All scheduled jobs stopped');
    } catch (error) {
      console.error('❌ Error stopping scheduler:', error);
    }
  }

  /**
   * Execute daily sync job
   */
  async runDailySync() {
    const startTime = new Date();
    console.log(`🌅 Starting daily sync at ${startTime.toISOString()}`);

    try {
      // Check if another sync is already running
      const recentLogs = this.db.getRecentSyncLogs(5);
      const runningSyncs = recentLogs.filter(log => 
        log.status === 'started' && 
        log.sync_type === 'daily' &&
        Date.now() - new Date(log.started_at).getTime() < 60 * 60 * 1000 // Less than 1 hour ago
      );

      if (runningSyncs.length > 0) {
        console.log('⚠️ Daily sync already running, skipping...');
        return;
      }

      // Perform the sync
      const result = await this.syncService.performDailySync();

      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);

      if (result.success) {
        console.log(`✅ Daily sync completed successfully in ${duration}s:`, {
          processed: result.processed,
          inserted: result.inserted,
          errors: result.errors
        });

        // Send success notification if configured
        await this.sendNotification('success', {
          type: 'daily_sync',
          duration,
          ...result
        });
      } else {
        console.error(`❌ Daily sync failed after ${duration}s:`, result.error);
        
        // Send failure notification
        await this.sendNotification('failure', {
          type: 'daily_sync',
          duration,
          error: result.error
        });
      }

    } catch (error) {
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000);
      
      console.error(`💥 Daily sync crashed after ${duration}s:`, error);
      
      // Send crash notification
      await this.sendNotification('crash', {
        type: 'daily_sync',
        duration,
        error: error.message
      });
    }
  }

  /**
   * Execute weekly cleanup job
   */
  async runWeeklyCleanup() {
    console.log('🧹 Starting weekly cleanup...');
    
    try {
      // Clean old price data (keep 1 year as per methodology)
      const cleanedRecords = this.db.cleanOldData(365);
      
      // Clean old sync logs (keep 30 days)
      const cleanedLogs = this.syncService.cleanupSyncLogs(30);
      
      // Vacuum database
      this.db.vacuum();
      
      console.log(`✅ Weekly cleanup completed:`, {
        cleanedRecords,
        cleanedLogs,
        vacuumed: true
      });

      // Send cleanup notification
      await this.sendNotification('success', {
        type: 'weekly_cleanup',
        cleanedRecords,
        cleanedLogs
      });

    } catch (error) {
      console.error('❌ Weekly cleanup failed:', error);
      
      await this.sendNotification('failure', {
        type: 'weekly_cleanup',
        error: error.message
      });
    }
  }

  /**
   * Check if initial sync is needed and run it
   */
  async checkAndRunInitialSync() {
    try {
      const dbStats = this.db.getStats();
      
      // If database is empty or has very little data, run initial sync
      if (dbStats.totalPriceRecords < 100) {
        console.log('📊 Database appears empty or sparse, running initial sync...');
        
        // Wait 5 seconds to avoid immediate execution
        setTimeout(async () => {
          await this.runDailySync();
        }, 5000);
      } else {
        console.log('📈 Database has sufficient data, skipping initial sync');
      }
    } catch (error) {
      console.error('⚠️ Error checking for initial sync:', error);
    }
  }

  /**
   * Run sync manually (for testing or manual triggers)
   */
  async runManualSync() {
    console.log('🔧 Running manual sync...');
    await this.runDailySync();
  }

  /**
   * Run cleanup manually
   */
  async runManualCleanup() {
    console.log('🔧 Running manual cleanup...');
    await this.runWeeklyCleanup();
  }

  /**
   * Send notification (placeholder for webhook/email integration)
   */
  async sendNotification(type, data) {
    // This is where you could integrate with:
    // - Discord webhook
    // - Slack webhook  
    // - Email service
    // - SMS service
    // - Logging service
    
    const notification = {
      timestamp: new Date().toISOString(),
      type: type, // 'success', 'failure', 'crash'
      service: 'nft-floor-compare-sync',
      ...data
    };

    // For now, just log to console
    // In production, you might send this to a webhook or notification service
    console.log('📢 Notification:', notification);

    // Example webhook integration (uncomment and configure):
    /*
    if (process.env.DISCORD_WEBHOOK_URL) {
      try {
        await fetch(process.env.DISCORD_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🤖 NFT Floor Compare Sync ${type}: ${JSON.stringify(data, null, 2)}`
          })
        });
      } catch (error) {
        console.error('Failed to send Discord notification:', error);
      }
    }
    */
  }

  /**
   * Get scheduler status and next run times
   */
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      config: this.config,
      jobs: {},
      nextRuns: {}
    };

    this.jobs.forEach((job, name) => {
      status.jobs[name] = {
        running: job.running || false,
        lastDate: job.lastDate || null
      };
    });

    // Calculate next run times
    try {
      const dailySyncCron = cron.schedule(this.config.dailySyncTime, () => {}, { scheduled: false });
      const weeklyCleanupCron = cron.schedule(this.config.weeklyCleanupTime, () => {}, { scheduled: false });
      
      // Note: node-cron doesn't provide built-in next run time calculation
      // This is a simplified version - in production, you might use a library like cron-parser
      status.nextRuns.dailySync = 'Next day at 2:00 AM UTC';
      status.nextRuns.weeklyCleanup = 'Next Sunday at 3:00 AM UTC';
      
      dailySyncCron.destroy();
      weeklyCleanupCron.destroy();
    } catch (error) {
      console.error('Error calculating next run times:', error);
    }

    return status;
  }

  /**
   * Update scheduler configuration
   */
  updateConfig(newConfig) {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }

    this.config = { ...this.config, ...newConfig };
    
    if (wasRunning) {
      this.start();
    }

    console.log('🔧 Scheduler configuration updated:', this.config);
  }

  /**
   * Enable or disable scheduler
   */
  setEnabled(enabled) {
    this.config.enabled = enabled;
    
    if (enabled && !this.isRunning) {
      this.start();
    } else if (!enabled && this.isRunning) {
      this.stop();
    }
    
    console.log(`🔧 Scheduler ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create singleton instance
let schedulerInstance = null;

export const getDailySyncScheduler = () => {
  if (!schedulerInstance) {
    schedulerInstance = new DailySyncScheduler();
  }
  return schedulerInstance;
};

// Auto-start scheduler when module is imported (except in development)
if (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') {
  console.log('🚀 Auto-starting scheduler for production environment');
  setTimeout(() => {
    getDailySyncScheduler().start();
  }, 2000); // Small delay to ensure all services are initialized
}

export default DailySyncScheduler;
