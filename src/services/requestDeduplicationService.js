/**
 * Advanced Request Deduplication Service
 * Prevents duplicate API calls and implements request coalescing
 */

class RequestDeduplicationService {
  constructor() {
    this.pendingRequests = new Map(); // URL -> Promise
    this.config = {
      dedupeWindow: 30000, // 30 seconds
      maxConcurrentRequests: 3,
      retryAttempts: 2,
      retryDelay: 1000
    };
    
    this.metrics = {
      totalRequests: 0,
      deduplicatedRequests: 0,
      failedRequests: 0
    };
    
    console.log('🔄 Request Deduplication Service initialized');
  }

  /**
   * Execute request with deduplication
   */
  async executeRequest(url, options = {}) {
    const requestKey = this.generateRequestKey(url, options);
    this.metrics.totalRequests++;

    // Check if identical request is already pending
    if (this.pendingRequests.has(requestKey)) {
      this.metrics.deduplicatedRequests++;
      console.log('🔄 Reusing pending request:', requestKey);
      return this.pendingRequests.get(requestKey);
    }

    // Create new request promise
    const requestPromise = this.makeRequest(url, options)
      .finally(() => {
        // Clean up after request completes
        setTimeout(() => {
          this.pendingRequests.delete(requestKey);
        }, this.config.dedupeWindow);
      });

    this.pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  /**
   * Make the actual HTTP request with retry logic
   */
  async makeRequest(url, options = {}) {
    let lastError;
    
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`🚀 Making request (attempt ${attempt + 1}/${this.config.retryAttempts + 1}):`, url);
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'max-age=300', // 5 minute cache
            ...options.headers
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('✅ Request successful:', url);
        return data;
        
      } catch (error) {
        lastError = error;
        console.warn(`❌ Request failed (attempt ${attempt + 1}):`, error.message);
        
        // Don't retry on 4xx errors (client errors)
        if (error.message.includes('HTTP 4')) {
          break;
        }
        
        // Wait before retrying
        if (attempt < this.config.retryAttempts) {
          await this.sleep(this.config.retryDelay * Math.pow(2, attempt));
        }
      }
    }

    this.metrics.failedRequests++;
    throw lastError;
  }

  /**
   * Generate unique key for request deduplication
   */
  generateRequestKey(url, options) {
    const method = options.method || 'GET';
    const headers = JSON.stringify(options.headers || {});
    const body = options.body || '';
    
    return `${method}:${url}:${headers}:${body}`;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service metrics
   */
  getMetrics() {
    const deduplicationRate = this.metrics.totalRequests > 0 
      ? ((this.metrics.deduplicatedRequests / this.metrics.totalRequests) * 100).toFixed(2)
      : 0;
    
    const successRate = this.metrics.totalRequests > 0
      ? (((this.metrics.totalRequests - this.metrics.failedRequests) / this.metrics.totalRequests) * 100).toFixed(2)
      : 0;

    return {
      ...this.metrics,
      pendingRequests: this.pendingRequests.size,
      deduplicationRate: `${deduplicationRate}%`,
      successRate: `${successRate}%`
    };
  }

  /**
   * Clear all pending requests
   */
  clearPendingRequests() {
    this.pendingRequests.clear();
    console.log('🧹 Cleared all pending requests');
  }
}

// Export singleton instance
export const requestDeduplicationService = new RequestDeduplicationService();