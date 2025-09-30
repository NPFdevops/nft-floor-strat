import React, { useState, useEffect } from 'react';
import { cacheService } from '../services/cacheService';
import ApiHealthCheck from './ApiHealthCheck';

const CacheStats = () => {
  const [stats, setStats] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showHealthCheck, setShowHealthCheck] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const updateStats = () => {
        setStats(cacheService.getStats());
      };

      updateStats();
      const interval = setInterval(updateStats, 2000); // Update every 2 seconds

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white px-3 py-1 text-xs rounded-lg opacity-50 hover:opacity-100 transition-opacity"
        title="Show cache statistics"
      >
        📊 Cache
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg shadow-lg text-xs max-w-sm border border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">Cache Statistics</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
      
      {stats && (
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Hit Rate:</span>
            <span className="font-mono text-green-400">{stats.hitRate}</span>
          </div>
          <div className="flex justify-between">
            <span>Hits:</span>
            <span className="font-mono text-blue-400">{stats.hits}</span>
          </div>
          <div className="flex justify-between">
            <span>Misses:</span>
            <span className="font-mono text-red-400">{stats.misses}</span>
          </div>
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className="font-mono text-yellow-400">{stats.memoryCacheSize}/{stats.maxMemorySize}</span>
          </div>
          <div className="flex justify-between">
            <span>Storage:</span>
            <span className="font-mono text-purple-400">{stats.localStorageSize}/{stats.maxLocalStorageSize}</span>
          </div>
          <div className="flex justify-between">
            <span>Evictions:</span>
            <span className="font-mono text-orange-400">{stats.evictions}</span>
          </div>
        </div>
      )}
      
      <div className="mt-3 pt-2 border-t border-gray-700 flex gap-2">
        <button
          onClick={() => {
            cacheService.clear();
            setStats(cacheService.getStats());
          }}
          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors"
        >
          Clear Cache
        </button>
        <button
          onClick={() => setShowHealthCheck(true)}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
          title="Check API connectivity"
        >
          🩺 API Health
        </button>
      </div>
      
      {showHealthCheck && (
        <ApiHealthCheck onClose={() => setShowHealthCheck(false)} />
      )}
    </div>
  );
};

export default CacheStats;
