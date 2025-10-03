/**
 * Environment Configuration Management
 * Handles different environments (development, staging, production)
 * with secure API key management and feature flags
 */

// Environment detection
const getEnvironment = () => {
  if (typeof window !== 'undefined') {
    // Client-side environment detection
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'development'
      : window.location.hostname.includes('staging') || window.location.hostname.includes('preview')
      ? 'staging'
      : 'production';
  }
  
  // Server-side environment detection
  return process.env.NODE_ENV || 'development';
};

const environment = getEnvironment();

// Base configuration
const baseConfig = {
  app: {
    name: 'NFT Strategy Dashboard',
    version: process.env.npm_package_version || '1.0.0',
    buildTime: __BUILD_TIME__ || new Date().toISOString(),
    environment
  },
  
  // API Configuration
  api: {
    timeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 1000,
    rateLimit: {
      maxRequests: 100,
      windowMs: 60000 // 1 minute
    }
  },
  
  // Cache Configuration
  cache: {
    defaultTTL: 30 * 60 * 1000, // 30 minutes
    maxSize: 200,
    localStoragePrefix: 'nft_cache_v2_',
    enableCompression: true,
    compressionThreshold: 5120 // 5KB
  },
  
  // Security Configuration
  security: {
    enableCSP: true,
    enableCORS: true,
    allowedOrigins: [],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    rateLimitEnabled: true
  },
  
  // Performance Configuration  
  performance: {
    enableServiceWorker: false, // Disabled by default for NFT apps
    enablePrefetch: true,
    lazyLoadImages: true,
    chunkSize: 1000, // KB
    enableGzip: true
  },
  
  // Analytics Configuration
  analytics: {
    enabled: true,
    trackingId: null,
    enableErrorTracking: true,
    enablePerformanceTracking: true,
    sampleRate: 1.0
  },
  
  // Feature Flags
  features: {
    enableRealTimeUpdates: true,
    enableOfflineMode: false,
    enableDarkMode: true,
    enableExport: true,
    enableNotifications: false,
    enableBetaFeatures: false
  },
  
  // Database Configuration
  database: {
    maxConnections: 10,
    connectionTimeout: 5000,
    idleTimeout: 30000,
    enableWAL: true // SQLite WAL mode
  }
};

// Environment-specific configurations
const environments = {
  development: {
    api: {
      baseURL: 'http://localhost:3000',
      timeout: 60000, // Longer timeout for dev
      debug: true,
      endpoints: {
        strategies: 'https://www.nftstrategy.fun/api/strategies',
        holdings: 'https://www.nftstrategy.fun/api/holdings',
        nftPriceFloor: 'https://api.nftpricefloor.com'
      }
    },
    
    security: {
      allowedOrigins: ['http://localhost:3000', 'http://127.0.0.1:3000'],
      enableCSRF: false // Disabled in development
    },
    
    analytics: {
      enabled: false, // Disabled in development
      trackingId: null
    },
    
    features: {
      enableBetaFeatures: true,
      enableRealTimeUpdates: true,
      enableOfflineMode: false
    },
    
    logging: {
      level: 'debug',
      enableConsole: true,
      enableRemote: false
    },
    
    cache: {
      defaultTTL: 5 * 60 * 1000, // 5 minutes in dev for faster updates
      maxSize: 50 // Smaller cache in development
    }
  },
  
  staging: {
    api: {
      baseURL: 'https://staging.nftstrategy.fun',
      timeout: 30000,
      debug: true,
      endpoints: {
        strategies: 'https://www.nftstrategy.fun/api/strategies',
        holdings: 'https://www.nftstrategy.fun/api/holdings',
        nftPriceFloor: 'https://api.nftpricefloor.com'
      }
    },
    
    security: {
      allowedOrigins: [
        'https://staging.nftstrategy.fun',
        'https://preview-*.nftstrategy.fun'
      ],
      enableCSRF: true
    },
    
    analytics: {
      enabled: true,
      trackingId: import.meta.env.VITE_POSTHOG_KEY_STAGING,
      sampleRate: 0.5 // 50% sampling in staging
    },
    
    features: {
      enableBetaFeatures: true,
      enableRealTimeUpdates: true,
      enableOfflineMode: true
    },
    
    logging: {
      level: 'info',
      enableConsole: true,
      enableRemote: true
    },
    
    cache: {
      defaultTTL: 15 * 60 * 1000, // 15 minutes in staging
      maxSize: 100
    }
  },
  
  production: {
    api: {
      baseURL: 'https://www.nftstrategy.fun',
      timeout: 30000,
      debug: false,
      endpoints: {
        strategies: 'https://www.nftstrategy.fun/api/strategies',
        holdings: 'https://www.nftstrategy.fun/api/holdings',
        nftPriceFloor: 'https://api.nftpricefloor.com'
      }
    },
    
    security: {
      allowedOrigins: [
        'https://www.nftstrategy.fun',
        'https://nftstrategy.fun'
      ],
      enableCSRF: true,
      enableCSP: true
    },
    
    analytics: {
      enabled: true,
      trackingId: import.meta.env.VITE_POSTHOG_KEY,
      enableErrorTracking: true,
      enablePerformanceTracking: true,
      sampleRate: 1.0 // 100% sampling in production
    },
    
    features: {
      enableBetaFeatures: false,
      enableRealTimeUpdates: true,
      enableOfflineMode: true,
      enableNotifications: true
    },
    
    logging: {
      level: 'error', // Only errors in production logs
      enableConsole: false,
      enableRemote: true,
      enableErrorReporting: true
    },
    
    performance: {
      enableServiceWorker: false, // Keep disabled for NFT data freshness
      enablePrefetch: true,
      enableGzip: true,
      lazyLoadImages: true
    },
    
    cache: {
      defaultTTL: 30 * 60 * 1000, // 30 minutes in production
      maxSize: 200,
      enableCompression: true
    }
  }
};

// Merge configurations
const config = {
  ...baseConfig,
  ...environments[environment]
};

// Environment-specific API key management
const getApiKey = (service) => {
  const prefix = environment === 'production' ? 'VITE_' : `VITE_${environment.toUpperCase()}_`;
  
  switch (service) {
    case 'nftPriceFloor':
      return import.meta.env[`${prefix}NFT_PRICE_FLOOR_API_KEY`] || import.meta.env.VITE_NFT_PRICE_FLOOR_API_KEY;
    case 'posthog':
      return import.meta.env[`${prefix}POSTHOG_KEY`] || import.meta.env.VITE_POSTHOG_KEY;
    default:
      console.warn(`Unknown API service: ${service}`);
      return null;
  }
};

// Utility functions
const isDevelopment = () => environment === 'development';
const isStaging = () => environment === 'staging';
const isProduction = () => environment === 'production';
const isClient = () => typeof window !== 'undefined';
const isServer = () => typeof window === 'undefined';

// Feature flag checker
const isFeatureEnabled = (feature) => {
  return config.features[feature] === true;
};

// Debug logger that respects environment
const logger = {
  debug: (...args) => {
    if (config.logging?.level === 'debug' && config.logging?.enableConsole) {
      console.debug('[DEBUG]', ...args);
    }
  },
  info: (...args) => {
    if (['debug', 'info'].includes(config.logging?.level) && config.logging?.enableConsole) {
      console.info('[INFO]', ...args);
    }
  },
  warn: (...args) => {
    if (['debug', 'info', 'warn'].includes(config.logging?.level) && config.logging?.enableConsole) {
      console.warn('[WARN]', ...args);
    }
  },
  error: (...args) => {
    if (config.logging?.enableConsole) {
      console.error('[ERROR]', ...args);
    }
    
    // Send to remote logging in production
    if (config.logging?.enableRemote && isProduction()) {
      // Integrate with error reporting service here
      // Example: Sentry, LogRocket, etc.
    }
  }
};

// Configuration validation
const validateConfig = () => {
  const errors = [];
  
  if (!config.api?.endpoints?.nftPriceFloor) {
    errors.push('Missing NFT Price Floor API endpoint');
  }
  
  if (isProduction() && !getApiKey('nftPriceFloor')) {
    errors.push('Missing NFT Price Floor API key in production');
  }
  
  if (config.analytics?.enabled && !config.analytics?.trackingId) {
    errors.push('Analytics enabled but no tracking ID provided');
  }
  
  if (errors.length > 0) {
    logger.error('Configuration validation failed:', errors);
    if (isProduction()) {
      throw new Error(`Configuration errors: ${errors.join(', ')}`);
    }
  }
  
  return errors.length === 0;
};

// Initialize configuration
if (isClient()) {
  validateConfig();
  logger.info('Environment configuration loaded:', {
    environment,
    version: config.app.version,
    features: Object.keys(config.features).filter(f => config.features[f])
  });
}

// Export configuration and utilities
export default config;

export {
  environment,
  getApiKey,
  isDevelopment,
  isStaging,
  isProduction,
  isClient,
  isServer,
  isFeatureEnabled,
  logger,
  validateConfig
};

// Export individual config sections for easier imports
export const {
  app: appConfig,
  api: apiConfig,
  cache: cacheConfig,
  security: securityConfig,
  performance: performanceConfig,
  analytics: analyticsConfig,
  features: featureFlags,
  database: databaseConfig,
  logging: loggingConfig
} = config;