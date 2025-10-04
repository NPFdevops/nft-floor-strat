import React, { useState, useEffect } from 'react';
import { cacheService } from '../services/cacheService';
import { batchingService } from '../services/batchingService';
import { logger } from '../services/productionLoggingService';

/**
 * Performance Monitor Component
 * Displays real-time performance metrics and optimization effectiveness
 */
export const PerformanceMonitor = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState({
    cache: null,
    batching: null,
    logging: null,
    webVitals: null,
    bundle: null
  });
  
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics({
        cache: cacheService.getStats(),
        batching: batchingService.getStats(),
        logging: logger.getMetrics(),
        webVitals: getWebVitals(),
        bundle: getBundleStats()
      });
    };

    // Update metrics every 5 seconds
    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  const getWebVitals = () => {
    if (typeof window === 'undefined') return null;

    const navigation = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');

    return {
      domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart,
      loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart,
      firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
      firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
      memoryUsage: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null
    };
  };

  const getBundleStats = () => {
    // Estimate bundle efficiency based on loaded resources
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const cssResources = resources.filter(r => r.name.includes('.css'));

    return {
      totalJsSize: jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      totalCssSize: cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      totalRequests: resources.length,
      cachedResources: resources.filter(r => r.transferSize === 0).length
    };
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatMs = (ms) => {
    if (!ms) return 'N/A';
    return `${Math.round(ms)}ms`;
  };

  const getPerformanceGrade = () => {
    if (!metrics.cache || !metrics.webVitals) return 'N/A';
    
    const cacheHitRate = parseFloat(metrics.cache.hitRate);
    const fcp = metrics.webVitals.firstContentfulPaint;
    
    if (cacheHitRate > 80 && fcp < 1500) return { grade: 'A+', color: 'text-green-600' };
    if (cacheHitRate > 60 && fcp < 2500) return { grade: 'A', color: 'text-green-500' };
    if (cacheHitRate > 40 && fcp < 3500) return { grade: 'B', color: 'text-yellow-500' };
    return { grade: 'C', color: 'text-red-500' };
  };

  if (!isVisible && process.env.NODE_ENV === 'production') return null;

  const performanceGrade = getPerformanceGrade();

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-w-sm">
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 cursor-pointer bg-gray-50 rounded-t-lg"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">⚡</span>
          <span className="font-semibold text-gray-800">Performance</span>
          {performanceGrade.grade !== 'N/A' && (
            <span className={`text-sm font-bold ${performanceGrade.color}`}>
              {performanceGrade.grade}
            </span>
          )}
        </div>
        <span className="text-gray-500">
          {isCollapsed ? '▲' : '▼'}
        </span>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-3 space-y-3 max-h-96 overflow-y-auto">
          {/* Cache Performance */}
          {metrics.cache && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Cache Performance</h4>
              <div className="text-xs space-y-1 text-gray-600">
                <div>Hit Rate: <span className="font-mono text-green-600">{metrics.cache.hitRate}</span></div>
                <div>Stale Hits: <span className="font-mono">{metrics.cache.staleHits}</span></div>
                <div>Memory: <span className="font-mono">{metrics.cache.memoryCacheSize}/{metrics.cache.maxMemorySize}</span></div>
                <div>Background: <span className="font-mono">{metrics.cache.activeBackgroundRefreshes} active</span></div>
              </div>
            </div>
          )}

          {/* API Batching */}
          {metrics.batching && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Request Batching</h4>
              <div className="text-xs space-y-1 text-gray-600">
                <div>Active: <span className="font-mono">{metrics.batching.activeRequests}</span></div>
                <div>Concurrent: <span className="font-mono">{metrics.batching.concurrentCount}/{metrics.batching.maxConcurrent}</span></div>
                <div>Queued: <span className="font-mono">{metrics.batching.totalQueued}</span></div>
              </div>
            </div>
          )}

          {/* Web Vitals */}
          {metrics.webVitals && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Web Vitals</h4>
              <div className="text-xs space-y-1 text-gray-600">
                <div>FCP: <span className="font-mono">{formatMs(metrics.webVitals.firstContentfulPaint)}</span></div>
                <div>DCL: <span className="font-mono">{formatMs(metrics.webVitals.domContentLoaded)}</span></div>
                {metrics.webVitals.memoryUsage && (
                  <div>Memory: <span className="font-mono">{metrics.webVitals.memoryUsage.used}MB / {metrics.webVitals.memoryUsage.total}MB</span></div>
                )}
              </div>
            </div>
          )}

          {/* Bundle Stats */}
          {metrics.bundle && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">Bundle Performance</h4>
              <div className="text-xs space-y-1 text-gray-600">
                <div>JS Size: <span className="font-mono">{formatBytes(metrics.bundle.totalJsSize)}</span></div>
                <div>CSS Size: <span className="font-mono">{formatBytes(metrics.bundle.totalCssSize)}</span></div>
                <div>Cached: <span className="font-mono text-green-600">{metrics.bundle.cachedResources}/{metrics.bundle.totalRequests}</span></div>
              </div>
            </div>
          )}

          {/* Logging Stats */}
          {metrics.logging && (
            <div>
              <h4 className="font-medium text-gray-700 mb-1">System Health</h4>
              <div className="text-xs space-y-1 text-gray-600">
                <div>Errors: <span className="font-mono text-red-600">{metrics.logging.errors}</span></div>
                <div>API Hit Rate: <span className="font-mono text-green-600">{metrics.logging.cache_hit_rate}</span></div>
                <div>Buffer: <span className="font-mono">{metrics.logging.buffer_size}/{metrics.logging.max_buffer_size}</span></div>
              </div>
            </div>
          )}

          {/* Optimization Tips */}
          <div className="border-t pt-2">
            <h4 className="font-medium text-gray-700 mb-1">Optimization Status</h4>
            <div className="text-xs space-y-1">
              {metrics.cache && parseFloat(metrics.cache.hitRate) > 80 ? (
                <div className="text-green-600">✅ Cache performing excellently</div>
              ) : (
                <div className="text-yellow-600">⚠️ Cache could be improved</div>
              )}
              
              {metrics.webVitals && metrics.webVitals.firstContentfulPaint < 1500 ? (
                <div className="text-green-600">✅ Fast loading performance</div>
              ) : (
                <div className="text-yellow-600">⚠️ Loading could be faster</div>
              )}
              
              {metrics.bundle && metrics.bundle.cachedResources / metrics.bundle.totalRequests > 0.7 ? (
                <div className="text-green-600">✅ Good resource caching</div>
              ) : (
                <div className="text-yellow-600">⚠️ More resources could be cached</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;