/**
 * Market Cap Selection Service
 * Manages quarterly selection of top 250 collections by market cap USD
 * Runs every 3 months to refresh the tracked collection list
 */

import { getDatabase } from './databaseService.js';
import { fetchTopCollections } from './nftAPI.js';

class MarketCapSelectionService {
  constructor() {
    this.db = getDatabase();
    this.config = {
      selectionCount: 250,           // Top 250 collections
      selectionIntervalMonths: 3,    // Every 3 months (quarterly)
      criteria: 'market_cap_usd',    // Selection based on market cap USD
    };

    console.log('📊 Market Cap Selection Service initialized');
  }

  /**
   * Generate current selection period identifier (YYYY-Q1, YYYY-Q2, etc.)
   */
  getCurrentSelectionPeriod(date = new Date()) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript months are 0-based
    
    const quarter = Math.ceil(month / 3);
    return `${year}-Q${quarter}`;
  }

  /**
   * Get the next selection period
   */
  getNextSelectionPeriod(currentPeriod) {
    const [year, quarter] = currentPeriod.split('-Q');
    const currentYear = parseInt(year);
    const currentQuarter = parseInt(quarter);
    
    if (currentQuarter === 4) {
      return `${currentYear + 1}-Q1`;
    } else {
      return `${currentYear}-Q${currentQuarter + 1}`;
    }
  }

  /**
   * Check if it's time for a new selection period
   */
  needsNewSelection() {
    const currentPeriod = this.getCurrentSelectionPeriod();
    
    // Check if we have an active selection period
    const activeSelection = this.db.query(`
      SELECT * FROM collection_selection_periods 
      WHERE status = 'active' 
      ORDER BY created_at DESC 
      LIMIT 1
    `)[0];

    if (!activeSelection) {
      return { needed: true, reason: 'No active selection period found' };
    }

    if (activeSelection.period !== currentPeriod) {
      return { 
        needed: true, 
        reason: `Current period ${currentPeriod} differs from active period ${activeSelection.period}`,
        activePeriod: activeSelection.period,
        currentPeriod: currentPeriod
      };
    }

    return { needed: false, activePeriod: activeSelection.period };
  }

  /**
   * Perform new quarterly selection of top 250 collections by market cap
   */
  async performQuarterlySelection() {
    const currentPeriod = this.getCurrentSelectionPeriod();
    console.log(`🎯 Starting quarterly selection for period: ${currentPeriod}`);

    const logId = this.db.startSyncLog('quarterly_selection', null);
    
    try {
      // Step 1: Fetch all collections with market cap data
      console.log('📋 Fetching collections with market cap data...');
      const allCollectionsResult = await fetchTopCollections(1000); // Fetch more to get better market cap data
      
      if (!allCollectionsResult.success || !allCollectionsResult.collections) {
        throw new Error('Failed to fetch collections data');
      }

      const collections = allCollectionsResult.collections;
      console.log(`📊 Received ${collections.length} collections from API`);

      // Step 2: Filter and sort by market cap USD
      const collectionsWithMarketCap = collections
        .filter(col => col.marketCap && col.marketCap > 0)
        .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));

      console.log(`💰 Found ${collectionsWithMarketCap.length} collections with market cap data`);

      if (collectionsWithMarketCap.length < this.config.selectionCount) {
        console.warn(`⚠️ Only ${collectionsWithMarketCap.length} collections have market cap data, selecting all available`);
      }

      // Step 3: Select top 250 by market cap
      const selectedCollections = collectionsWithMarketCap.slice(0, this.config.selectionCount);
      
      console.log(`🎯 Selected top ${selectedCollections.length} collections by market cap`);
      console.log(`💎 Market cap range: $${(selectedCollections[selectedCollections.length-1].marketCap || 0).toLocaleString()} - $${(selectedCollections[0].marketCap || 0).toLocaleString()}`);

      // Step 4: Mark previous selections as expired
      this.db.query(`
        UPDATE collection_selection_periods 
        SET status = 'expired' 
        WHERE status = 'active'
      `);

      this.db.query(`
        UPDATE collections 
        SET is_top_250 = 0 
        WHERE is_top_250 = 1
      `);

      // Step 5: Create new selection period record
      const selectionStats = {
        min_market_cap: selectedCollections[selectedCollections.length - 1]?.marketCap || 0,
        max_market_cap: selectedCollections[0]?.marketCap || 0,
        avg_market_cap: selectedCollections.reduce((sum, col) => sum + (col.marketCap || 0), 0) / selectedCollections.length
      };

      this.db.query(`
        INSERT INTO collection_selection_periods (
          period, selection_date, total_collections_selected, 
          selection_criteria, min_market_cap, max_market_cap, avg_market_cap, status
        ) VALUES (?, date('now'), ?, ?, ?, ?, ?, 'active')
      `, [
        currentPeriod, 
        selectedCollections.length, 
        this.config.criteria,
        selectionStats.min_market_cap,
        selectionStats.max_market_cap,
        selectionStats.avg_market_cap
      ]);

      // Step 6: Update collections table with new selection
      console.log('💾 Updating collections database...');
      let updatedCount = 0;
      let insertedCount = 0;

      selectedCollections.forEach((collection, index) => {
        const marketCapRank = index + 1;
        
        // Try to update existing collection
        const updateResult = this.db.query(`
          UPDATE collections SET
            name = ?, ranking = ?, image = ?, total_supply = ?, owners = ?,
            market_cap = ?, market_cap_rank = ?, is_top_250 = 1,
            selection_period = ?, selected_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE slug = ?
        `, [
          collection.name,
          collection.ranking,
          collection.image,
          collection.totalSupply,
          collection.owners,
          collection.marketCap,
          marketCapRank,
          currentPeriod,
          collection.slug
        ]);

        if (updateResult.changes > 0) {
          updatedCount++;
        } else {
          // Insert new collection
          this.db.query(`
            INSERT INTO collections (
              slug, name, ranking, image, total_supply, owners,
              market_cap, market_cap_rank, is_top_250, selection_period,
              selected_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            collection.slug,
            collection.name,
            collection.ranking,
            collection.image,
            collection.totalSupply,
            collection.owners,
            collection.marketCap,
            marketCapRank,
            currentPeriod
          ]);
          insertedCount++;
        }
      });

      // Step 7: Log results
      const results = {
        period: currentPeriod,
        selected: selectedCollections.length,
        updated: updatedCount,
        inserted: insertedCount,
        marketCapRange: selectionStats,
        topCollections: selectedCollections.slice(0, 5).map(c => ({
          name: c.name,
          slug: c.slug,
          marketCap: c.marketCap
        }))
      };

      console.log('✅ Quarterly selection completed:');
      console.log(`   Period: ${currentPeriod}`);
      console.log(`   Collections selected: ${selectedCollections.length}`);
      console.log(`   Updated: ${updatedCount}, Inserted: ${insertedCount}`);
      console.log(`   Market cap range: $${selectionStats.min_market_cap.toLocaleString()} - $${selectionStats.max_market_cap.toLocaleString()}`);
      console.log('   Top 5 by market cap:');
      results.topCollections.forEach((col, i) => {
        console.log(`     ${i + 1}. ${col.name}: $${(col.marketCap || 0).toLocaleString()}`);
      });

      // Complete sync log
      this.db.completeSyncLog(logId, 'completed', {
        processed: collections.length,
        inserted: insertedCount,
        updated: updatedCount
      });

      return {
        success: true,
        ...results
      };

    } catch (error) {
      console.error('❌ Quarterly selection failed:', error);
      
      this.db.completeSyncLog(logId, 'failed', {
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get current top 250 collections (active selection)
   */
  getCurrentTop250Collections() {
    return this.db.query(`
      SELECT * FROM collections 
      WHERE is_top_250 = 1 
      ORDER BY market_cap_rank ASC
    `);
  }

  /**
   * Get selection history
   */
  getSelectionHistory() {
    return this.db.query(`
      SELECT * FROM collection_selection_periods 
      ORDER BY selection_date DESC 
      LIMIT 10
    `);
  }

  /**
   * Get active selection period info
   */
  getActiveSelectionInfo() {
    const activeSelection = this.db.query(`
      SELECT csp.*, 
             COUNT(c.slug) as active_collections_count
      FROM collection_selection_periods csp
      LEFT JOIN collections c ON c.selection_period = csp.period AND c.is_top_250 = 1
      WHERE csp.status = 'active'
      GROUP BY csp.id
      ORDER BY csp.created_at DESC 
      LIMIT 1
    `)[0];

    if (!activeSelection) {
      return null;
    }

    // Calculate days until next selection
    const currentPeriod = this.getCurrentSelectionPeriod();
    const isCurrentPeriod = activeSelection.period === currentPeriod;
    
    // Estimate next selection date (approximate - start of next quarter)
    const nextPeriod = this.getNextSelectionPeriod(activeSelection.period);
    const [nextYear, nextQuarter] = nextPeriod.split('-Q');
    const nextSelectionMonth = (parseInt(nextQuarter) - 1) * 3 + 1; // First month of quarter
    const nextSelectionDate = new Date(parseInt(nextYear), nextSelectionMonth - 1, 1);
    const daysUntilNext = Math.ceil((nextSelectionDate - new Date()) / (1000 * 60 * 60 * 24));

    return {
      ...activeSelection,
      isCurrentPeriod,
      nextPeriod,
      nextSelectionDate: nextSelectionDate.toISOString().split('T')[0],
      daysUntilNext: Math.max(0, daysUntilNext)
    };
  }

  /**
   * Check if a collection is in current top 250
   */
  isInCurrentTop250(slug) {
    const result = this.db.query(`
      SELECT slug FROM collections 
      WHERE slug = ? AND is_top_250 = 1
    `, [slug]);
    
    return result.length > 0;
  }

  /**
   * Force selection update (for testing or manual triggers)
   */
  async forceSelectionUpdate() {
    console.log('🔧 Forcing quarterly selection update...');
    return await this.performQuarterlySelection();
  }
}

// Create singleton instance
let selectionInstance = null;

export const getMarketCapSelectionService = () => {
  if (!selectionInstance) {
    selectionInstance = new MarketCapSelectionService();
  }
  return selectionInstance;
};

export default MarketCapSelectionService;
