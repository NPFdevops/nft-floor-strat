/**
 * Production-Optimized Logging Service
 * Minimizes performance impact while maintaining debugging capabilities
 */

class ProductionLoggingService {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logBuffer = [];
    this.maxBufferSize = 100;
    this.flushInterval = 30000; // 30 seconds
    
    // Performance metrics
    this.metrics = {
      errors: 0,
      warnings: 0,
      api_calls: 0,
      cache_hits: 0,
      cache_misses: 0
    };
    
    if (this.isProduction) {
      // Only start buffer flushing in production
      this.startBufferFlushing();
    }
  }

  /**
   * Log error with context (always logged)
   */
  error(message, error = null, context = {}) {
    this.metrics.errors++;
    
    const logEntry = {
      level: 'ERROR',
      message,
      timestamp: new Date().toISOString(),
      error: error ? {
        message: error.message,
        stack: this.isProduction ? null : error.stack,
        name: error.name
      } : null,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent?.substring(0, 100) : null
    };

    // Always log errors
    console.error('🚨 ERROR:', message, error);
    
    if (this.isProduction) {
      this.addToBuffer(logEntry);
      // Send critical errors immediately
      this.sendToAnalytics('error', logEntry);
    }
  }

  /**
   * Log warning (production: buffered, dev: immediate)
   */
  warn(message, context = {}) {
    this.metrics.warnings++;
    
    const logEntry = {
      level: 'WARN',
      message,
      timestamp: new Date().toISOString(),
      context
    };

    if (this.isProduction) {
      this.addToBuffer(logEntry);
    } else {
      console.warn('⚠️ WARN:', message, context);
    }
  }

  /**
   * Log API performance metrics
   */
  apiCall(endpoint, duration, status, cached = false) {
    this.metrics.api_calls++;
    
    if (cached) {
      this.metrics.cache_hits++;
    } else {
      this.metrics.cache_misses++;
    }

    const logEntry = {
      level: 'API',
      endpoint,
      duration,
      status,
      cached,
      timestamp: new Date().toISOString()
    };

    if (this.isProduction) {
      // Only log slow API calls in production
      if (duration > 2000 || status >= 400) {
        this.addToBuffer(logEntry);
      }
    } else {
      console.log(`📡 API: ${endpoint} (${duration}ms) [${status}] ${cached ? '⚡' : ''}`, logEntry);
    }
  }

  /**
   * Log performance metrics
   */
  performance(metric, value, context = {}) {
    if (this.isProduction) {
      // Only log significant performance issues in production
      if ((metric === 'bundle_size' && value > 500000) || 
          (metric === 'render_time' && value > 1000) ||
          (metric === 'memory_usage' && value > 100000000)) {
        
        this.addToBuffer({
          level: 'PERFORMANCE',
          metric,
          value,
          context,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      console.log(`📊 PERFORMANCE: ${metric}=${value}`, context);
    }
  }

  /**
   * Development-only debug logging
   */
  debug(message, data = {}) {
    if (!this.isProduction) {
      console.log(`🐛 DEBUG: ${message}`, data);
    }
  }

  /**
   * Add log entry to buffer
   */
  addToBuffer(logEntry) {
    if (this.logBuffer.length >= this.maxBufferSize) {
      // Remove oldest entry
      this.logBuffer.shift();
    }
    
    this.logBuffer.push(logEntry);
  }

  /**
   * Start periodic buffer flushing
   */
  startBufferFlushing() {
    setInterval(() => {
      this.flushBuffer();
    }, this.flushInterval);
  }

  /**
   * Flush log buffer (in production, this could send to external service)
   */
  flushBuffer() {
    if (this.logBuffer.length === 0) return;

    // In production, you would send to external logging service
    // For now, we'll just clear the buffer
    console.log(`📤 Flushing ${this.logBuffer.length} log entries`);
    this.logBuffer = [];
  }

  /**
   * Send critical data to analytics service
   */
  sendToAnalytics(type, data) {
    // Integration point for external analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', type, {
        event_category: 'app_error',
        event_label: data.message,
        value: 1
      });
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    const total_requests = this.metrics.api_calls;
    const cache_hit_rate = total_requests > 0 
      ? ((this.metrics.cache_hits / total_requests) * 100).toFixed(2) 
      : 0;

    return {
      ...this.metrics,
      cache_hit_rate: `${cache_hit_rate}%`,
      buffer_size: this.logBuffer.length,
      max_buffer_size: this.maxBufferSize
    };
  }

  /**
   * Clear all metrics and buffer
   */
  clear() {
    this.metrics = {
      errors: 0,
      warnings: 0,
      api_calls: 0,
      cache_hits: 0,
      cache_misses: 0
    };
    this.logBuffer = [];
  }
}

// Export singleton instance
export const logger = new ProductionLoggingService();