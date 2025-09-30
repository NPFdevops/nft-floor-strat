import React, { useState, useEffect } from 'react';

/**
 * Enhanced Loading State Component with Progress Tracking and User Feedback
 */
export const EnhancedLoadingState = ({ 
  isLoading, 
  progress = 0, 
  stage = 'loading', 
  collection = '',
  error = null,
  retryCount = 0,
  maxRetries = 4,
  estimatedTime = null,
  queuePosition = null,
  onRetry = null,
  onCancel = null 
}) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setTimeElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading]);

  const getStageInfo = (stage) => {
    const stages = {
      loading: { icon: '🔄', text: 'Loading data...', color: 'text-blue-500' },
      queued: { icon: '⏳', text: 'Request queued...', color: 'text-yellow-500' },
      rate_limited: { icon: '🚦', text: 'Rate limited, waiting...', color: 'text-orange-500' },
      retrying: { icon: '🔄', text: `Retrying (${retryCount}/${maxRetries})...`, color: 'text-orange-500' },
      parsing: { icon: '📊', text: 'Processing data...', color: 'text-blue-500' },
      caching: { icon: '💾', text: 'Caching results...', color: 'text-green-500' }
    };

    return stages[stage] || stages.loading;
  };

  const stageInfo = getStageInfo(stage);
  const progressPercentage = Math.max(10, Math.min(progress, 100));

  if (!isLoading && !error) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Main Loading Content */}
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <div className="animate-spin text-2xl">
            {stageInfo.icon}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900">
              {collection ? `Loading ${collection}` : 'Loading collection data'}
            </h3>
            <span className="text-sm text-gray-500">
              {timeElapsed > 0 && `${timeElapsed}s`}
            </span>
          </div>

          <p className={`text-sm ${stageInfo.color} mb-3`}>
            {stageInfo.text}
            {queuePosition && ` (Position ${queuePosition} in queue)`}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Estimated Time */}
          {estimatedTime && (
            <p className="text-xs text-gray-500 mb-2">
              Estimated time remaining: {estimatedTime}
            </p>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <div className="flex items-start space-x-2">
                <span className="text-red-500 text-sm">⚠️</span>
                <div className="flex-1">
                  <p className="text-red-700 text-sm font-medium mb-1">
                    Request Failed
                  </p>
                  <p className="text-red-600 text-xs">
                    {error}
                  </p>
                  {retryCount > 0 && (
                    <p className="text-red-500 text-xs mt-1">
                      Attempted {retryCount} of {maxRetries} retries
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              {showDetails ? 'Hide details' : 'Show details'}
            </button>

            <div className="flex space-x-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              )}
              
              {error && onRetry && retryCount < maxRetries && (
                <button
                  onClick={onRetry}
                  className="px-3 py-1 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded-md"
                >
                  Retry Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-600 space-y-1">
            <div>Stage: <span className="font-mono">{stage}</span></div>
            <div>Progress: <span className="font-mono">{progress}%</span></div>
            <div>Time elapsed: <span className="font-mono">{timeElapsed}s</span></div>
            {retryCount > 0 && (
              <div>Retries: <span className="font-mono">{retryCount}/{maxRetries}</span></div>
            )}
            {queuePosition && (
              <div>Queue position: <span className="font-mono">{queuePosition}</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Rate Limit Status Component
 */
export const RateLimitStatus = ({ rateLimitInfo }) => {
  if (!rateLimitInfo) return null;

  const { remaining, resetTime, queueSize, timeUntilNextRequest } = rateLimitInfo;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-yellow-600">🚦</span>
        <h4 className="text-sm font-medium text-yellow-800">Rate Limit Status</h4>
      </div>
      
      <div className="text-xs text-yellow-700 space-y-1">
        <div>Requests remaining: <span className="font-mono">{remaining || 'Unknown'}</span></div>
        {resetTime && (
          <div>Rate limit resets: <span className="font-mono">{resetTime.toLocaleTimeString()}</span></div>
        )}
        {queueSize > 0 && (
          <div>Requests queued: <span className="font-mono">{queueSize}</span></div>
        )}
        {timeUntilNextRequest > 0 && (
          <div>Next request in: <span className="font-mono">{Math.ceil(timeUntilNextRequest / 1000)}s</span></div>
        )}
      </div>
    </div>
  );
};

/**
 * Error Recovery Suggestions Component
 */
export const ErrorRecoverySuggestions = ({ error, onRetry, onClearCache }) => {
  const getSuggestions = (error) => {
    if (error.includes('rate limit')) {
      return [
        '⏳ Wait a few minutes before trying again',
        '🔄 The system will automatically retry with delays',
        '🚀 Try a different collection while waiting'
      ];
    }
    
    if (error.includes('timeout') || error.includes('network')) {
      return [
        '📶 Check your internet connection',
        '🔄 Retry the request - it might work now',
        '⏳ The API might be temporarily slow'
      ];
    }
    
    if (error.includes('not found')) {
      return [
        '🔍 Check the collection name spelling',
        '📝 Try using the collection slug instead',
        '🎯 Search for similar collection names'
      ];
    }

    return [
      '🔄 Retry the request',
      '💾 Clear cache and try again',
      '📞 Contact support if the problem persists'
    ];
  };

  const suggestions = getSuggestions(error || '');

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Suggestions:</h4>
      <ul className="text-xs text-blue-700 space-y-1 mb-3">
        {suggestions.map((suggestion, index) => (
          <li key={index}>• {suggestion}</li>
        ))}
      </ul>
      
      <div className="flex space-x-2">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 text-xs text-white bg-blue-500 hover:bg-blue-600 rounded-md"
          >
            🔄 Retry
          </button>
        )}
        {onClearCache && (
          <button
            onClick={onClearCache}
            className="px-3 py-1 text-xs text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md"
          >
            💾 Clear Cache
          </button>
        )}
      </div>
    </div>
  );
};
