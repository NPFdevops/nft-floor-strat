/**
 * Batching Service for NFT API Requests
 * Implements request deduplication, batching, and concurrent request management
 */

class BatchingService {
  constructor() {
    this.config = {
      batchWindow: 500,      // Wait 500ms to batch similar requests
      maxConcurrent: 2,      // Max 2 concurrent API requests
      dedupeWindow: 30000,   // Dedupe identical requests within 30s
    };

    // Request tracking
    this.activeRequests = new Map();     // Request key -> Promise
    this.batchQueues = new Map();        // Batch type -> [requests]
    this.pendingBatches = new Map();     // Batch type -> timeout
    this.concurrentCount = 0;

    console.log('📦 Batching Service initialized:', this.config);
  }

  /**
   * Generate unique key for request deduplication
   */
  generateRequestKey(type, params) {
    const sortedParams = JSON.stringify(params, Object.keys(params).sort());
    return `${type}:${sortedParams}`;
  }

  /**
   * Execute request with deduplication
   */
  async executeWithDeduplication(requestKey, requestFn) {
    // Check if identical request is already in progress
    if (this.activeRequests.has(requestKey)) {
      console.log('🔄 Reusing in-progress request:', requestKey);
      return this.activeRequests.get(requestKey);
    }

    // Execute request and store promise
    const requestPromise = this.executeRequest(requestFn);
    this.activeRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up after request completes
      setTimeout(() => {
        this.activeRequests.delete(requestKey);
      }, this.config.dedupeWindow);
    }
  }

  /**
   * Execute request with concurrency control
   */
  async executeRequest(requestFn) {
    // Wait if we're at max concurrency
    while (this.concurrentCount >= this.config.maxConcurrent) {
      console.log(`⏳ Waiting for request slot (${this.concurrentCount}/${this.config.maxConcurrent})`);
      await this.sleep(100);
    }

    this.concurrentCount++;
    console.log(`🚀 Starting request (${this.concurrentCount}/${this.config.maxConcurrent})`);

    try {
      return await requestFn();
    } finally {
      this.concurrentCount--;
      console.log(`✅ Request completed (${this.concurrentCount}/${this.config.maxConcurrent})`);
    }
  }

  /**
   * Add request to batch queue
   */
  async batchRequest(batchType, requestParams, requestFn) {
    return new Promise((resolve, reject) => {
      // Initialize batch queue if needed
      if (!this.batchQueues.has(batchType)) {
        this.batchQueues.set(batchType, []);
      }

      // Add to batch
      this.batchQueues.get(batchType).push({
        params: requestParams,
        requestFn,
        resolve,
        reject,
        timestamp: Date.now()
      });

      console.log(`📦 Added to batch queue (${batchType}): ${this.batchQueues.get(batchType).length} items`);

      // Schedule batch processing
      this.scheduleBatchProcessing(batchType);
    });
  }

  /**
   * Schedule batch processing with debouncing
   */
  scheduleBatchProcessing(batchType) {
    // Clear existing timeout
    if (this.pendingBatches.has(batchType)) {
      clearTimeout(this.pendingBatches.get(batchType));
    }

    // Schedule new batch processing
    const timeout = setTimeout(() => {
      this.processBatch(batchType);
    }, this.config.batchWindow);

    this.pendingBatches.set(batchType, timeout);
  }

  /**
   * Process a batch of requests
   */
  async processBatch(batchType) {
    const queue = this.batchQueues.get(batchType);
    if (!queue || queue.length === 0) return;

    console.log(`🔄 Processing batch (${batchType}): ${queue.length} requests`);

    // Clear the queue and timeout
    this.batchQueues.set(batchType, []);
    this.pendingBatches.delete(batchType);

    // Group similar requests for optimization
    const grouped = this.groupSimilarRequests(queue);

    // Process each group
    for (const group of grouped) {
      try {
        await this.processRequestGroup(group);
      } catch (error) {
        console.error(`❌ Batch processing error for group:`, error);
        // Reject all requests in failed group
        group.forEach(request => request.reject(error));
      }
    }
  }

  /**
   * Group similar requests that can be optimized together
   */
  groupSimilarRequests(requests) {
    const groups = new Map();

    requests.forEach(request => {
      // Group by collection slug for potential optimization
      const collectionSlug = request.params.collectionSlug || 'unknown';
      
      if (!groups.has(collectionSlug)) {
        groups.set(collectionSlug, []);
      }
      
      groups.get(collectionSlug).push(request);
    });

    return Array.from(groups.values());
  }

  /**
   * Process a group of similar requests
   */
  async processRequestGroup(requestGroup) {
    // For now, process requests sequentially with small delays
    // In the future, this could be optimized for specific batch APIs
    
    for (let i = 0; i < requestGroup.length; i++) {
      const request = requestGroup[i];
      
      try {
        const result = await this.executeWithDeduplication(
          this.generateRequestKey('api', request.params),
          request.requestFn
        );
        
        request.resolve(result);
      } catch (error) {
        request.reject(error);
      }

      // Small delay between requests in the same group
      if (i < requestGroup.length - 1) {
        await this.sleep(200);
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
   * Get batching statistics
   */
  getStats() {
    const totalQueued = Array.from(this.batchQueues.values())
      .reduce((sum, queue) => sum + queue.length, 0);

    return {
      activeRequests: this.activeRequests.size,
      concurrentCount: this.concurrentCount,
      maxConcurrent: this.config.maxConcurrent,
      queuedBatches: this.batchQueues.size,
      totalQueued,
      pendingBatches: this.pendingBatches.size
    };
  }

  /**
   * Clear all batches and active requests
   */
  clearAll() {
    // Clear timeouts
    this.pendingBatches.forEach(timeout => clearTimeout(timeout));
    this.pendingBatches.clear();

    // Reject all queued requests
    this.batchQueues.forEach(queue => {
      queue.forEach(request => {
        request.reject(new Error('Batch queue cleared'));
      });
    });
    this.batchQueues.clear();

    // Clear active requests
    this.activeRequests.clear();

    console.log('🧹 All batches and requests cleared');
  }
}

// Export singleton instance
export const batchingService = new BatchingService();
