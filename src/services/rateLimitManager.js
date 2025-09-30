/**
 * Rate Limit Manager for NFT Price Floor API
 * Implements intelligent rate limiting, retry logic, and request queuing
 */

class RateLimitManager {
  constructor() {
    // Rate limiting configuration based on actual API limits from response headers
    this.config = {
      // Conservative limits based on API response analysis
      maxRequestsPerWindow: 100,      // Conservative limit for live/historical data
      windowSizeMs: 60 * 1000,        // 1 minute window (much more reasonable)
      retryDelays: [500, 1000, 2000, 5000], // Reduced delays based on fast API response (110ms)
      maxRetries: 3,                  // Reduced from 4 to 3 retries
      timeoutMs: 100000,               // 100 second timeout - balanced for reliability
      queueSize: 50,                  // Increased queue size for better throughput
    };

    // Track different rate limit types from API headers
    this.rateLimits = {
      requests: { limit: 500000, remaining: 500000, reset: null },
      liveData: { limit: 10000, remaining: 10000, reset: null },
      historicalData: { limit: 10000, remaining: 10000, reset: null },
      sales: { limit: 5000, remaining: 5000, reset: null }
    };

    // Request tracking
    this.requestHistory = [];
    this.requestQueue = [];
    this.activeRequests = new Set();
    this.isProcessingQueue = false;

    // Rate limit state
    this.rateLimitReset = null;
    this.remainingRequests = this.config.maxRequestsPerWindow;

    console.log('🔧 Rate Limit Manager initialized:', {
      maxRequests: this.config.maxRequestsPerWindow,
      window: `${this.config.windowSizeMs / 1000 / 60}min`,
      timeout: `${this.config.timeoutMs / 1000}s`
    });
  }

  /**
   * Check if we can make a request now
   */
  canMakeRequest() {
    this.cleanOldRequests();
    
    const recentRequests = this.requestHistory.filter(
      time => Date.now() - time < this.config.windowSizeMs
    );

    // Check local rate limiting
    const localLimitOk = recentRequests.length < this.config.maxRequestsPerWindow;
    
    // Check API rate limits (use most restrictive)
    const apiLimitOk = this.rateLimits.liveData.remaining > 0 && 
                       this.rateLimits.historicalData.remaining > 0;
    
    return localLimitOk && apiLimitOk;
  }

  /**
   * Get time until next request is allowed
   */
  getTimeUntilNextRequest() {
    this.cleanOldRequests();
    
    if (this.canMakeRequest()) return 0;

    const oldestRequest = Math.min(...this.requestHistory);
    const nextAllowedTime = oldestRequest + this.config.windowSizeMs;
    
    return Math.max(0, nextAllowedTime - Date.now());
  }

  /**
   * Add request to history
   */
  recordRequest() {
    this.requestHistory.push(Date.now());
    this.cleanOldRequests();
  }

  /**
   * Clean old requests from history
   */
  cleanOldRequests() {
    const cutoff = Date.now() - this.config.windowSizeMs;
    this.requestHistory = this.requestHistory.filter(time => time > cutoff);
  }

  /**
   * Update rate limit info from API response headers
   */
  updateFromHeaders(headers) {
    // Parse all rate limit types from API response
    const rateLimitMappings = [
      { key: 'requests', limit: 'x-ratelimit-requests-limit', remaining: 'x-ratelimit-requests-remaining', reset: 'x-ratelimit-requests-reset' },
      { key: 'liveData', limit: 'x-ratelimit-live-data-limit', remaining: 'x-ratelimit-live-data-remaining', reset: 'x-ratelimit-live-data-reset' },
      { key: 'historicalData', limit: 'x-ratelimit-historical-data-limit', remaining: 'x-ratelimit-historical-data-remaining', reset: 'x-ratelimit-historical-data-reset' },
      { key: 'sales', limit: 'x-ratelimit-sales-limit', remaining: 'x-ratelimit-sales-remaining', reset: 'x-ratelimit-sales-reset' }
    ];

    let updated = false;
    rateLimitMappings.forEach(mapping => {
      const limit = parseInt(headers[mapping.limit]);
      const remaining = parseInt(headers[mapping.remaining]);
      const reset = parseInt(headers[mapping.reset]);

      if (!isNaN(limit)) {
        this.rateLimits[mapping.key].limit = limit;
        updated = true;
      }
      if (!isNaN(remaining)) {
        this.rateLimits[mapping.key].remaining = remaining;
        updated = true;
      }
      if (!isNaN(reset)) {
        this.rateLimits[mapping.key].reset = reset * 1000; // Convert to milliseconds
        updated = true;
      }
    });

    // Update legacy properties for backward compatibility
    this.remainingRequests = this.rateLimits.liveData.remaining;
    this.rateLimitReset = this.rateLimits.liveData.reset;

    if (updated) {
      console.log('📊 Rate limits updated:', {
        requests: `${this.rateLimits.requests.remaining}/${this.rateLimits.requests.limit}`,
        liveData: `${this.rateLimits.liveData.remaining}/${this.rateLimits.liveData.limit}`,
        historicalData: `${this.rateLimits.historicalData.remaining}/${this.rateLimits.historicalData.limit}`,
        sales: `${this.rateLimits.sales.remaining}/${this.rateLimits.sales.limit}`
      });
    }
  }

  /**
   * Add request to queue if rate limited
   */
  async queueRequest(requestFn, priority = 'normal') {
    return new Promise((resolve, reject) => {
      if (this.requestQueue.length >= this.config.queueSize) {
        reject(new Error('Request queue is full. Please try again later.'));
        return;
      }

      const queueItem = {
        requestFn,
        resolve,
        reject,
        priority,
        timestamp: Date.now(),
        retryCount: 0
      };

      // Insert based on priority
      if (priority === 'high') {
        this.requestQueue.unshift(queueItem);
      } else {
        this.requestQueue.push(queueItem);
      }

      console.log(`📥 Request queued (${priority}). Queue size: ${this.requestQueue.length}`);
      
      this.processQueue();
    });
  }

  /**
   * Process the request queue
   */
  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      if (!this.canMakeRequest()) {
        const waitTime = this.getTimeUntilNextRequest();
        console.log(`⏳ Rate limited. Waiting ${Math.ceil(waitTime / 1000)}s before next request`);
        await this.sleep(waitTime + 1000); // Add 1s buffer
        continue;
      }

      const queueItem = this.requestQueue.shift();
      
      try {
        this.recordRequest();
        const result = await this.executeWithRetry(queueItem.requestFn, queueItem.retryCount);
        queueItem.resolve(result);
      } catch (error) {
        queueItem.reject(error);
      }

      // Small delay between requests to be respectful
      await this.sleep(500);
    }

    this.isProcessingQueue = false;
  }

  /**
   * Execute request with retry logic
   */
  async executeWithRetry(requestFn, startRetryCount = 0) {
    for (let attempt = startRetryCount; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await requestFn();
        
        // Update rate limit info from response headers if available
        if (result.headers) {
          this.updateFromHeaders(result.headers);
        }

        return result;
      } catch (error) {
        console.log(`❌ Request attempt ${attempt + 1} failed:`, error.message);

        // Don't retry on certain errors
        if (error.response?.status === 404 || error.response?.status === 403) {
          throw error;
        }

        // Handle rate limiting
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'];
          const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this.config.retryDelays[attempt] || 30000;
          
          console.log(`🚦 Rate limited (429). Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${this.config.maxRetries}`);
          
          if (attempt < this.config.maxRetries) {
            await this.sleep(waitTime);
            continue;
          }
        }

        // Handle timeouts and network errors
        if (error.code === 'ECONNABORTED' || error.code === 'ENOTFOUND') {
          const waitTime = this.config.retryDelays[attempt] || 10000;
          
          console.log(`🌐 Network error. Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${this.config.maxRetries}`);
          
          if (attempt < this.config.maxRetries) {
            await this.sleep(waitTime);
            continue;
          }
        }

        // Final attempt failed
        if (attempt === this.config.maxRetries) {
          throw error;
        }

        // Progressive backoff for other errors
        const waitTime = this.config.retryDelays[attempt] || 5000;
        await this.sleep(waitTime);
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
   * Get queue and rate limit statistics
   */
  getStats() {
    return {
      queueSize: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      recentRequests: this.requestHistory.length,
      canMakeRequest: this.canMakeRequest(),
      timeUntilNextRequest: this.getTimeUntilNextRequest(),
      remainingRequests: this.remainingRequests,
      rateLimitReset: this.rateLimitReset ? new Date(this.rateLimitReset) : null
    };
  }

  /**
   * Clear queue (for emergency situations)
   */
  clearQueue() {
    this.requestQueue.forEach(item => {
      item.reject(new Error('Request queue cleared'));
    });
    this.requestQueue = [];
    console.log('🧹 Request queue cleared');
  }
}

// Export singleton instance
export const rateLimitManager = new RateLimitManager();
