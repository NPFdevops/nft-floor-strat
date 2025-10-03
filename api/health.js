/**
 * Health Check API Endpoint
 * Provides comprehensive system health monitoring
 * for production deployment monitoring and alerting
 */

// Import database service (assuming it exists)
// import { databaseService } from '../src/services/databaseService.js';

const HEALTH_CHECK_VERSION = '1.0.0';
const START_TIME = Date.now();

/**
 * Check external API connectivity
 */
async function checkExternalAPIs() {
  const apis = [
    {
      name: 'NFT Strategy API',
      url: 'https://www.nftstrategy.fun/api/strategies',
      timeout: 5000
    },
    {
      name: 'NFT Price Floor API', 
      url: 'https://api.nftpricefloor.com/health',
      timeout: 5000,
      optional: true // Mark as optional since we might not have access
    }
  ];

  const results = await Promise.allSettled(
    apis.map(async (api) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), api.timeout);
      
      try {
        const startTime = Date.now();
        const response = await fetch(api.url, {
          method: 'GET',
          headers: {
            'User-Agent': 'NFT-Floor-Strat-Health-Check/1.0',
            'Accept': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        
        return {
          name: api.name,
          status: response.ok ? 'healthy' : 'unhealthy',
          responseTime,
          httpStatus: response.status,
          optional: api.optional || false
        };
      } catch (error) {
        clearTimeout(timeoutId);
        return {
          name: api.name,
          status: 'unhealthy',
          error: error.name === 'AbortError' ? 'timeout' : error.message,
          optional: api.optional || false
        };
      }
    })
  );

  return results.map((result, index) => 
    result.status === 'fulfilled' ? result.value : {
      name: apis[index].name,
      status: 'error',
      error: result.reason?.message || 'Unknown error',
      optional: apis[index].optional || false
    }
  );
}

/**
 * Check database connectivity (placeholder)
 */
async function checkDatabase() {
  try {
    // In a real implementation, this would check database connectivity
    // For now, we'll simulate a database health check
    
    const startTime = Date.now();
    
    // Simulate database ping
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime,
      connections: {
        active: 1,
        idle: 0,
        total: 1
      },
      lastBackup: null // Would be actual timestamp in real implementation
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

/**
 * Check system resources
 */
function checkSystemResources() {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      external: Math.round(memoryUsage.external / 1024 / 1024), // MB
      arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024) // MB
    },
    uptime: {
      process: Math.round(uptime),
      application: Math.round((Date.now() - START_TIME) / 1000)
    },
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch
  };
}

/**
 * Get deployment information
 */
function getDeploymentInfo() {
  return {
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    buildTime: process.env.BUILD_TIME || null,
    commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT || null,
    commitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE || null,
    branch: process.env.VERCEL_GIT_COMMIT_REF || process.env.GIT_BRANCH || null,
    deploymentUrl: process.env.VERCEL_URL || null,
    region: process.env.VERCEL_REGION || null
  };
}

/**
 * Calculate overall health status
 */
function calculateOverallHealth(checks) {
  const { apis, database } = checks;
  
  // Check critical services
  const criticalAPIs = apis.filter(api => !api.optional);
  const unhealthyCritical = criticalAPIs.filter(api => api.status !== 'healthy');
  
  if (unhealthyCritical.length > 0) {
    return { status: 'unhealthy', reason: 'Critical API services unavailable' };
  }
  
  if (database.status !== 'healthy') {
    return { status: 'unhealthy', reason: 'Database connectivity issues' };
  }
  
  // Check if any optional services are down
  const optionalAPIs = apis.filter(api => api.optional);
  const unhealthyOptional = optionalAPIs.filter(api => api.status !== 'healthy');
  
  if (unhealthyOptional.length > 0) {
    return { status: 'degraded', reason: 'Some optional services unavailable' };
  }
  
  return { status: 'healthy', reason: 'All systems operational' };
}

export default async function handler(req, res) {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substr(2, 9);
  
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    console.log(`[${requestId}] Health check started`);
    
    // Perform all health checks in parallel
    const [apis, database] = await Promise.all([
      checkExternalAPIs(),
      checkDatabase()
    ]);
    
    const systemResources = checkSystemResources();
    const deployment = getDeploymentInfo();
    const overallHealth = calculateOverallHealth({ apis, database });
    
    const responseTime = Date.now() - startTime;
    
    const healthReport = {
      status: overallHealth.status,
      reason: overallHealth.reason,
      timestamp: new Date().toISOString(),
      version: HEALTH_CHECK_VERSION,
      responseTime,
      requestId,
      checks: {
        apis: apis.reduce((acc, api) => {
          acc[api.name] = {
            status: api.status,
            responseTime: api.responseTime || null,
            httpStatus: api.httpStatus || null,
            error: api.error || null,
            optional: api.optional
          };
          return acc;
        }, {}),
        database,
        system: systemResources
      },
      deployment
    };
    
    // Set appropriate HTTP status code based on health
    let httpStatus = 200;
    if (overallHealth.status === 'unhealthy') {
      httpStatus = 503; // Service Unavailable
    } else if (overallHealth.status === 'degraded') {
      httpStatus = 200; // OK but with warnings
    }
    
    console.log(`[${requestId}] Health check completed: ${overallHealth.status} (${responseTime}ms)`);
    
    res.setHeader('Content-Type', 'application/json');
    return res.status(httpStatus).json(healthReport);
    
  } catch (error) {
    console.error(`[${requestId}] Health check failed:`, error);
    
    const errorResponse = {
      status: 'error',
      reason: 'Health check system failure',
      timestamp: new Date().toISOString(),
      version: HEALTH_CHECK_VERSION,
      responseTime: Date.now() - startTime,
      requestId,
      error: {
        message: error.message,
        type: error.name
      },
      deployment: getDeploymentInfo()
    };
    
    // Include stack trace in development
    if (process.env.NODE_ENV !== 'production') {
      errorResponse.error.stack = error.stack;
    }
    
    return res.status(500).json(errorResponse);
  }
}