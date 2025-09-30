/**
 * Database Service for NFT Floor Price Data
 * Uses SQLite for local data storage and querying
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

class DatabaseService {
  constructor() {
    this.dbPath = process.env.DATABASE_PATH || './data/nft_floor_data.db';
    this.schemaPath = './database/schema.sql';
    this.db = null;
    
    this.initDatabase();
  }

  /**
   * Initialize database connection and create tables
   */
  initDatabase() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Initialize SQLite database
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL'); // Better performance
      this.db.pragma('foreign_keys = ON');   // Enable foreign keys

      // Create tables from schema
      this.createTables();

      console.log('✅ Database initialized successfully:', this.dbPath);
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create database tables from schema file
   */
  createTables() {
    try {
      const schemaSQL = fs.readFileSync(this.schemaPath, 'utf8');
      const statements = schemaSQL.split(';').filter(stmt => stmt.trim());
      
      statements.forEach(statement => {
        if (statement.trim()) {
          this.db.exec(statement);
        }
      });

      console.log('✅ Database tables created/verified');
    } catch (error) {
      console.error('❌ Failed to create tables:', error);
      throw error;
    }
  }

  // ===================
  // COLLECTION METHODS
  // ===================

  /**
   * Insert or update collection
   */
  upsertCollection(collectionData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO collections (
        slug, name, ranking, image, total_supply, owners, market_cap, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    return stmt.run(
      collectionData.slug,
      collectionData.name,
      collectionData.ranking,
      collectionData.image,
      collectionData.totalSupply,
      collectionData.owners,
      collectionData.marketCap
    );
  }

  /**
   * Get all active collections
   */
  getAllCollections() {
    const stmt = this.db.prepare(`
      SELECT * FROM collections 
      WHERE is_active = 1 
      ORDER BY ranking ASC
    `);
    return stmt.all();
  }

  /**
   * Get current top 250 collections (by market cap)
   */
  getCurrentTop250Collections() {
    const stmt = this.db.prepare(`
      SELECT * FROM collections 
      WHERE is_top_250 = 1 
      ORDER BY market_cap_rank ASC
    `);
    return stmt.all();
  }

  /**
   * Update collection with market cap data
   */
  upsertCollectionWithMarketCap(collectionData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO collections (
        slug, name, ranking, image, total_supply, owners, market_cap, 
        market_cap_rank, is_top_250, selection_period, selected_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    return stmt.run(
      collectionData.slug,
      collectionData.name,
      collectionData.ranking,
      collectionData.image,
      collectionData.totalSupply,
      collectionData.owners,
      collectionData.marketCap,
      collectionData.marketCapRank,
      collectionData.isTop250 ? 1 : 0,
      collectionData.selectionPeriod,
      collectionData.selectedAt
    );
  }

  /**
   * Get collection by slug
   */
  getCollection(slug) {
    const stmt = this.db.prepare('SELECT * FROM collections WHERE slug = ?');
    return stmt.get(slug);
  }

  /**
   * Bulk insert collections
   */
  bulkInsertCollections(collections) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO collections (
        slug, name, ranking, image, total_supply, owners, market_cap, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const insertMany = this.db.transaction((collections) => {
      let inserted = 0;
      collections.forEach(collection => {
        try {
          stmt.run(
            collection.slug,
            collection.name,
            collection.ranking,
            collection.image,
            collection.totalSupply,
            collection.owners,
            collection.marketCap
          );
          inserted++;
        } catch (error) {
          console.error(`Failed to insert collection ${collection.slug}:`, error);
        }
      });
      return inserted;
    });

    return insertMany(collections);
  }

  // ===================
  // PRICE HISTORY METHODS
  // ===================

  /**
   * Insert price history data
   */
  insertPriceHistory(priceData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO price_history (
        collection_slug, date, timestamp, floor_eth, floor_usd, 
        volume_eth, volume_usd, sales_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(
      priceData.collectionSlug,
      priceData.date,
      priceData.timestamp,
      priceData.floorEth,
      priceData.floorUsd,
      priceData.volumeEth,
      priceData.volumeUsd,
      priceData.salesCount
    );
  }

  /**
   * Bulk insert price history data
   */
  bulkInsertPriceHistory(priceHistoryArray) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO price_history (
        collection_slug, date, timestamp, floor_eth, floor_usd, 
        volume_eth, volume_usd, sales_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((priceData) => {
      let inserted = 0;
      priceData.forEach(data => {
        try {
          stmt.run(
            data.collectionSlug,
            data.date,
            data.timestamp,
            data.floorEth,
            data.floorUsd,
            data.volumeEth,
            data.volumeUsd,
            data.salesCount
          );
          inserted++;
        } catch (error) {
          console.error(`Failed to insert price data for ${data.collectionSlug}:`, error);
        }
      });
      return inserted;
    });

    return insertMany(priceHistoryArray);
  }

  /**
   * Get price history for collection within date range
   */
  getPriceHistory(collectionSlug, startDate, endDate, limit = 1000) {
    const stmt = this.db.prepare(`
      SELECT * FROM price_history 
      WHERE collection_slug = ? 
        AND date >= ? 
        AND date <= ?
      ORDER BY date ASC
      LIMIT ?
    `);

    return stmt.all(collectionSlug, startDate, endDate, limit);
  }

  /**
   * Get latest price for collection
   */
  getLatestPrice(collectionSlug) {
    const stmt = this.db.prepare(`
      SELECT * FROM price_history 
      WHERE collection_slug = ? 
      ORDER BY date DESC 
      LIMIT 1
    `);

    return stmt.get(collectionSlug);
  }

  /**
   * Get price history for multiple collections (for comparison)
   */
  getMultipleCollectionHistory(collectionSlugs, startDate, endDate) {
    const placeholders = collectionSlugs.map(() => '?').join(',');
    const stmt = this.db.prepare(`
      SELECT * FROM price_history 
      WHERE collection_slug IN (${placeholders})
        AND date >= ? 
        AND date <= ?
      ORDER BY collection_slug, date ASC
    `);

    const params = [...collectionSlugs, startDate, endDate];
    return stmt.all(...params);
  }

  // ===================
  // SYNC LOG METHODS
  // ===================

  /**
   * Start sync log entry
   */
  startSyncLog(syncType, collectionSlug = null) {
    const stmt = this.db.prepare(`
      INSERT INTO sync_log (sync_type, collection_slug, status)
      VALUES (?, ?, 'started')
    `);

    const result = stmt.run(syncType, collectionSlug);
    return result.lastInsertRowid;
  }

  /**
   * Complete sync log entry
   */
  completeSyncLog(logId, status, stats = {}) {
    const stmt = this.db.prepare(`
      UPDATE sync_log SET 
        status = ?,
        records_processed = ?,
        records_inserted = ?,
        records_updated = ?,
        error_message = ?,
        completed_at = CURRENT_TIMESTAMP,
        duration_seconds = (
          (julianday(CURRENT_TIMESTAMP) - julianday(started_at)) * 86400
        )
      WHERE id = ?
    `);

    return stmt.run(
      status,
      stats.processed || 0,
      stats.inserted || 0,
      stats.updated || 0,
      stats.error || null,
      logId
    );
  }

  /**
   * Get recent sync logs
   */
  getRecentSyncLogs(limit = 50) {
    const stmt = this.db.prepare(`
      SELECT * FROM sync_log 
      ORDER BY started_at DESC 
      LIMIT ?
    `);

    return stmt.all(limit);
  }

  // ===================
  // UTILITY METHODS
  // ===================

  /**
   * Get database statistics
   */
  getStats() {
    const stats = {};
    
    // Collection count
    stats.totalCollections = this.db.prepare('SELECT COUNT(*) as count FROM collections').get().count;
    stats.activeCollections = this.db.prepare('SELECT COUNT(*) as count FROM collections WHERE is_active = 1').get().count;
    
    // Price history stats
    stats.totalPriceRecords = this.db.prepare('SELECT COUNT(*) as count FROM price_history').get().count;
    
    // Date range
    const dateRange = this.db.prepare(`
      SELECT 
        MIN(date) as earliest_date,
        MAX(date) as latest_date
      FROM price_history
    `).get();
    
    stats.earliestDate = dateRange.earliest_date;
    stats.latestDate = dateRange.latest_date;
    
    // Database size
    const dbSize = fs.statSync(this.dbPath).size;
    stats.databaseSize = Math.round(dbSize / 1024 / 1024 * 100) / 100; // MB
    
    return stats;
  }

  /**
   * Clean old data (older than specified days)
   */
  cleanOldData(daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const stmt = this.db.prepare('DELETE FROM price_history WHERE date < ?');
    const result = stmt.run(cutoffDateStr);

    console.log(`🧹 Cleaned ${result.changes} old price records (older than ${daysToKeep} days)`);
    return result.changes;
  }

  /**
   * Vacuum database (optimize storage)
   */
  vacuum() {
    this.db.exec('VACUUM');
    console.log('🗜️ Database vacuumed');
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      console.log('✅ Database connection closed');
    }
  }

  /**
   * Execute raw SQL query (for advanced operations)
   */
  query(sql, params = []) {
    try {
      const stmt = this.db.prepare(sql);
      if (sql.toLowerCase().startsWith('select')) {
        return stmt.all(...params);
      } else {
        return stmt.run(...params);
      }
    } catch (error) {
      console.error('❌ Query failed:', error);
      throw error;
    }
  }
}

// Create singleton instance
let dbInstance = null;

export const getDatabase = () => {
  if (!dbInstance) {
    dbInstance = new DatabaseService();
  }
  return dbInstance;
};

export default DatabaseService;
