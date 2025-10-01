/**
 * Advanced Logging Service
 * Provides structured logging, error reporting, and performance monitoring
 */

import { isProduction, isDevelopment, analyticsConfig, loggingConfig } from '../config/environment.js';

class LoggingService {
  constructor() {
    this.config = {
      level: loggingConfig?.level || 'info',
      enableConsole: loggingConfig?.enableConsole !== false,
      enableRemote: loggingConfig?.enableRemote === true,
      enableErrorReporting: loggingConfig?.enableErrorReporting === true,
      maxLogSize: 1000,
      batchSize: 10,
      flushInterval: 30000, // 30 seconds
      retryAttempts: 3
    };

    // Log levels with priorities
    this.levels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4
    };

    // In-memory log buffer for batching
    this.logBuffer = [];
    this.performanceBuffer = [];
    
    // Error reporting queue
    this.errorQueue = [];
    
    // Initialize performance observer
    this.initPerformanceObserver();
    
    // Setup periodic flush
    this.setupPeriodicFlush();
    
    // Setup global error handlers
    this.setupGlobalErrorHandlers();
  }

  /**
   * Initialize performance observer for Core Web Vitals
   */
  initPerformanceObserver() {
    if (typeof PerformanceObserver === 'undefined') return;

    try {
      // Observe navigation and paint timings
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.logPerformance('navigation', {
            name: entry.name,
            duration: entry.duration,
            startTime: entry.startTime,
            type: entry.entryType,
            ...entry.toJSON()
          });
        }
      });
      
      navObserver.observe({ entryTypes: ['navigation', 'paint'] });

      // Observe resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Only log slow resources
          if (entry.duration > 1000) {
            this.logPerformance('resource', {
              name: entry.name,
              duration: entry.duration,
              size: entry.transferSize,
              type: entry.initiatorType
            });
          }
        }
      });
      
      resourceObserver.observe({ entryTypes: ['resource'] });

      // Observe layout shifts (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.value > 0.1) { // Only log significant shifts
            this.logPerformance('layout-shift', {
              value: entry.value,
              sources: entry.sources?.map(s => s.node?.tagName).join(', ') || 'unknown'
            });
          }
        }
      });
      
      clsObserver.observe({ entryTypes: ['layout-shift'] });

    } catch (error) {
      console.warn('Performance observer setup failed:', error);
    }
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise.toString(),
        stack: event.reason?.stack || 'No stack trace'
      });
    });

    // Global errors
    window.addEventListener('error', (event) => {
      this.error('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.toString() || 'Unknown error',
        stack: event.error?.stack || 'No stack trace'
      });
    });

    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.warn('Resource Loading Error', {
          tagName: event.target.tagName,
          source: event.target.src || event.target.href,
          message: event.message || 'Resource failed to load'
        });
      }
    }, true);
  }

  /**
   * Setup periodic log flushing
   */
  setupPeriodicFlush() {
    setInterval(() => {
      this.flush();
    }, this.config.flushInterval);

    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }

  /**
   * Check if log level should be processed
   */
  shouldLog(level) {
    return this.levels[level] >= this.levels[this.config.level];
  }

  /**
   * Create structured log entry
   */
  createLogEntry(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      session: this.getSessionId(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: this.getConnectionInfo()
    };

    // Add performance timing if available
    if (performance && performance.now) {
      entry.performanceNow = performance.now();
    }

    // Add memory usage if available
    if (performance.memory) {
      entry.memory = {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      };
    }

    return entry;
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('nft_session_id');
    if (!sessionId) {
      sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('nft_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Get connection information
   */
  getConnectionInfo() {
    if (navigator.connection) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    return null;
  }

  /**
   * Log debug message
   */
  debug(message, data = {}) {
    if (!this.shouldLog('debug')) return;

    const entry = this.createLogEntry('debug', message, data);
    
    if (this.config.enableConsole && isDevelopment()) {
      console.debug(`[DEBUG] ${message}`, data);
    }

    this.addToBuffer(entry);
  }

  /**
   * Log info message
   */
  info(message, data = {}) {
    if (!this.shouldLog('info')) return;

    const entry = this.createLogEntry('info', message, data);
    
    if (this.config.enableConsole) {
      console.info(`[INFO] ${message}`, data);
    }

    this.addToBuffer(entry);
  }

  /**
   * Log warning message
   */
  warn(message, data = {}) {
    if (!this.shouldLog('warn')) return;

    const entry = this.createLogEntry('warn', message, data);
    
    if (this.config.enableConsole) {
      console.warn(`[WARN] ${message}`, data);
    }

    this.addToBuffer(entry);
  }

  /**
   * Log error message
   */
  error(message, data = {}) {
    if (!this.shouldLog('error')) return;

    const entry = this.createLogEntry('error', message, data);
    
    if (this.config.enableConsole) {
      console.error(`[ERROR] ${message}`, data);
    }

    this.addToBuffer(entry);
    
    // Add to error reporting queue
    if (this.config.enableErrorReporting) {
      this.errorQueue.push(entry);
    }
  }

  /**
   * Log fatal error message
   */
  fatal(message, data = {}) {
    const entry = this.createLogEntry('fatal', message, data);
    
    console.error(`[FATAL] ${message}`, data);
    
    this.addToBuffer(entry);
    
    // Immediately flush fatal errors
    if (this.config.enableRemote) {
      this.sendToRemote([entry]);
    }
    
    // Add to error reporting queue
    if (this.config.enableErrorReporting) {
      this.errorQueue.push(entry);
      this.reportErrors();
    }
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      metric,
      data,
      session: this.getSessionId(),
      url: window.location.href
    };

    this.performanceBuffer.push(entry);
    
    if (isDevelopment()) {
      console.debug(`[PERF] ${metric}:`, data);
    }

    // Limit buffer size
    if (this.performanceBuffer.length > this.config.maxLogSize) {
      this.performanceBuffer = this.performanceBuffer.slice(-this.config.maxLogSize);
    }
  }

  /**
   * Log user interaction
   */
  logInteraction(action, data = {}) {
    this.info(`User Interaction: ${action}`, {
      interaction: true,
      action,
      ...data
    });
  }

  /**
   * Log API call
   */
  logAPICall(method, endpoint, duration, status, data = {}) {
    const logLevel = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    
    this[logLevel](`API ${method} ${endpoint}`, {
      api: true,
      method,
      endpoint,
      duration,
      status,
      ...data
    });
  }

  /**
   * Add entry to log buffer
   */
  addToBuffer(entry) {
    this.logBuffer.push(entry);

    // Limit buffer size
    if (this.logBuffer.length > this.config.maxLogSize) {
      this.logBuffer = this.logBuffer.slice(-this.config.maxLogSize);
    }

    // Auto-flush if buffer is full
    if (this.logBuffer.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush logs to remote service
   */
  async flush() {
    if (!this.config.enableRemote || this.logBuffer.length === 0) {
      return;
    }

    const logsToSend = [...this.logBuffer];
    this.logBuffer = [];

    await this.sendToRemote(logsToSend);
  }

  /**
   * Send logs to remote logging service
   */
  async sendToRemote(logs) {
    if (!isProduction()) return;

    try {
      // In a real implementation, this would send to your logging service
      // Example: Logtail, LogRocket, Datadog, etc.
      
      const payload = {
        logs,
        performance: this.performanceBuffer.splice(0),
        metadata: {
          appVersion: process.env.npm_package_version || '1.0.0',
          environment: process.env.NODE_ENV || 'production',
          timestamp: new Date().toISOString()
        }
      };

      // Placeholder for actual implementation
      console.debug('Would send logs to remote service:', payload);
      
      // Example implementation:
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(payload)
      // });

    } catch (error) {
      console.error('Failed to send logs to remote service:', error);
      
      // Re-add failed logs to buffer for retry
      this.logBuffer.unshift(...logs);
    }
  }

  /**
   * Report errors to error tracking service
   */
  async reportErrors() {
    if (!this.config.enableErrorReporting || this.errorQueue.length === 0) {
      return;
    }

    const errorsToReport = [...this.errorQueue];
    this.errorQueue = [];

    try {
      // In a real implementation, integrate with Sentry, Bugsnag, etc.
      for (const error of errorsToReport) {
        if (window.reportError) {
          window.reportError(error);
        }
      }
    } catch (reportingError) {
      console.error('Failed to report errors:', reportingError);
      
      // Re-add failed errors to queue for retry
      this.errorQueue.unshift(...errorsToReport);
    }
  }

  /**
   * Get current log buffer (for debugging)
   */
  getLogs(level = null) {
    if (level) {
      return this.logBuffer.filter(log => log.level === level);
    }
    return [...this.logBuffer];
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return [...this.performanceBuffer];
  }

  /**
   * Clear all logs
   */
  clear() {
    this.logBuffer = [];
    this.performanceBuffer = [];
    this.errorQueue = [];
  }

  /**
   * Create a child logger with additional context
   */
  child(context = {}) {
    const childLogger = {
      debug: (message, data = {}) => this.debug(message, { ...context, ...data }),
      info: (message, data = {}) => this.info(message, { ...context, ...data }),
      warn: (message, data = {}) => this.warn(message, { ...context, ...data }),
      error: (message, data = {}) => this.error(message, { ...context, ...data }),
      fatal: (message, data = {}) => this.fatal(message, { ...context, ...data })
    };
    
    return childLogger;
  }
}

// Create singleton instance
const loggingService = new LoggingService();

// Export convenience methods
export const logger = {
  debug: (message, data) => loggingService.debug(message, data),
  info: (message, data) => loggingService.info(message, data),
  warn: (message, data) => loggingService.warn(message, data),
  error: (message, data) => loggingService.error(message, data),
  fatal: (message, data) => loggingService.fatal(message, data),
  logPerformance: (metric, data) => loggingService.logPerformance(metric, data),
  logInteraction: (action, data) => loggingService.logInteraction(action, data),
  logAPICall: (method, endpoint, duration, status, data) => 
    loggingService.logAPICall(method, endpoint, duration, status, data),
  child: (context) => loggingService.child(context),
  getLogs: (level) => loggingService.getLogs(level),
  getPerformanceMetrics: () => loggingService.getPerformanceMetrics(),
  clear: () => loggingService.clear()
};

export default loggingService;