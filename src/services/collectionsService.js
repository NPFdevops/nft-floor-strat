import { fetchTopCollections } from './nftAPI';
import { TOP_COLLECTIONS } from '../data/collections';

class CollectionsService {
  constructor() {
    this.collections = [];
    this.isLoading = false;
    this.lastFetched = null;
    this.error = null;
    this.subscribers = new Set();
  }

  /**
   * Subscribe to collection updates
   * @param {Function} callback - Callback function to call when collections update
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify all subscribers of changes
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback({
          collections: this.collections,
          isLoading: this.isLoading,
          error: this.error,
          lastFetched: this.lastFetched
        });
      } catch (error) {
        console.error('Error in collections subscriber:', error);
      }
    });
  }

  /**
   * Get current collections (returns cached if available, otherwise fetches)
   * @returns {Array} Current collections array
   */
  getCollections() {
    if (this.collections.length === 0 && !this.isLoading) {
      this.fetchCollections();
      // Return fallback data while fetching
      return TOP_COLLECTIONS;
    }
    return this.collections.length > 0 ? this.collections : TOP_COLLECTIONS;
  }

  /**
   * Fetch top collections from API
   * @param {boolean} forceRefresh - Force refresh even if recently fetched
   */
  async fetchCollections(forceRefresh = false) {
    // Don't fetch if already loading or recently fetched (unless forced)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    if (!forceRefresh && (this.isLoading || (this.lastFetched && this.lastFetched > oneHourAgo))) {
      console.log('📋 Skipping collections fetch - recently fetched or already loading');
      return;
    }

    console.log('📋 Fetching collections from API...');
    this.isLoading = true;
    this.error = null;
    this.notifySubscribers();

    try {
      const result = await fetchTopCollections(500);
      
      if (result.success && result.collections.length > 0) {
        this.collections = result.collections;
        this.lastFetched = Date.now();
        this.error = null;
        console.log(`✅ Successfully loaded ${this.collections.length} collections`);
      } else {
        console.warn('⚠️ Failed to fetch collections, using fallback data');
        this.collections = TOP_COLLECTIONS;
        this.error = result.error || 'Failed to fetch collections';
      }
    } catch (error) {
      console.error('❌ Error fetching collections:', error);
      this.collections = TOP_COLLECTIONS; // Fallback to hardcoded collections
      this.error = error.message || 'Failed to fetch collections';
    } finally {
      this.isLoading = false;
      this.notifySubscribers();
    }
  }

  /**
   * Search collections by name or slug
   * @param {string} query - Search query
   * @param {number} limit - Maximum number of results
   * @returns {Array} Filtered collections
   */
  searchCollections(query, limit = 20) {
    const collections = this.getCollections();
    
    if (!query.trim()) {
      return collections.slice(0, limit);
    }
    
    const searchTerm = query.toLowerCase();
    const filtered = collections.filter(collection => 
      collection.name.toLowerCase().includes(searchTerm) ||
      collection.slug.toLowerCase().includes(searchTerm)
    );
    
    return filtered.slice(0, limit);
  }

  /**
   * Find collection by slug
   * @param {string} slug - Collection slug
   * @returns {Object|null} Collection object or null
   */
  findBySlug(slug) {
    const collections = this.getCollections();
    return collections.find(collection => collection.slug === slug) || null;
  }

  /**
   * Get loading state
   * @returns {boolean} Is currently loading
   */
  getLoadingState() {
    return this.isLoading;
  }

  /**
   * Get error state
   * @returns {string|null} Current error or null
   */
  getError() {
    return this.error;
  }

  /**
   * Clear error
   */
  clearError() {
    this.error = null;
    this.notifySubscribers();
  }
}

// Create and export a singleton instance
export const collectionsService = new CollectionsService();

// Auto-fetch collections on service initialization (with delay to not block startup)
setTimeout(() => {
  collectionsService.fetchCollections();
}, 1000); // 1 second delay

export default collectionsService;
