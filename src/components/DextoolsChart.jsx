import React, { useState, useEffect, useRef } from 'react';

const DextoolsChart = ({ 
  strategy, 
  tokenAddress,
  tokenName = 'Token',
  height = 400, 
  width = "100%",
  theme = "light",
  chartType = "2",
  chartResolution = "30",
  chainId = "ether"
}) => {
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const iframeRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Use strategy's token address first, then fallback to provided tokenAddress
  const contractAddress = strategy?.tokenAddress || tokenAddress;
  
  // Only proceed if we have a valid contract address
  if (!contractAddress) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50">
        <div className="text-center p-6">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">No Token Address</h4>
          <p className="text-sm text-gray-600">
            Token address is required to display the trading chart.
          </p>
        </div>
      </div>
    );
  }

  // Use the official DEXTools widget URL format from the documentation
  const dextoolsUrl = `https://www.dextools.io/widget-chart/en/${chainId}/pe-light/${contractAddress}?theme=${theme}&chartType=${chartType}&chartResolution=${chartResolution}&drawingToolbars=false`;

  // Generate external Dextools URL for viewing
  const externalDextoolsUrl = `https://www.dextools.io/app/en/${chainId}/pair-explorer/${contractAddress}`;

  const handleIframeError = () => {
    setIframeError(true);
    setIsLoading(false);
    setIsBlocked(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleIframeLoad = () => {
    setIsLoading(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Check if iframe is actually blocked by trying to access its content
    try {
      const iframe = iframeRef.current;
      if (iframe && iframe.contentWindow) {
        // If we can access contentWindow, it might be working
        // But we still need to check for actual content
        setTimeout(() => {
          try {
            // This will throw an error if blocked by CORS
            iframe.contentWindow.location.href;
          } catch (e) {
            // This is expected for cross-origin iframes that are working
            // If we get here without the iframe showing content, it might be blocked
          }
        }, 1000);
      }
    } catch (error) {
      // If we can't access the iframe at all, it might be blocked
      console.log('Iframe access restricted, but this is normal for cross-origin content');
    }
  };

  useEffect(() => {
    // Reset states when contract address changes
    setIframeError(false);
    setIsLoading(true);
    setIsBlocked(false);
    
    // Set a timeout to detect if iframe is blocked
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setIsBlocked(true);
        setIframeError(true);
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [contractAddress]);

  const renderFallbackContent = () => (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center p-8 max-w-md">
        <div className="text-6xl mb-6">📈</div>
        <h4 className="text-xl font-bold text-gray-900 mb-3">View Trading Chart</h4>
        <p className="text-sm text-gray-600 mb-6">
          {isBlocked 
            ? "DEXTools prevents embedding for security reasons. Click below to view the live trading chart in a new tab."
            : "The trading chart cannot be loaded. This may be due to network restrictions or the token not being available on DEXTools."
          }
        </p>
        <div className="space-y-3">
          <a 
            href={externalDextoolsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Chart on DEXTools
          </a>
          <div className="text-xs text-gray-500">
            Live price data • Real-time trading • Full chart features
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="dextools-chart-container">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Chart Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Trading Chart
              </h3>
              {strategy && (
                <p className="text-sm text-gray-600">
                  {strategy.collectionName} - {strategy.tokenName || strategy.tokenSymbol || tokenName}
                </p>
              )}
              <p className="text-xs text-gray-500 font-mono mt-1">
                {contractAddress.slice(0, 8)}...{contractAddress.slice(-6)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Live Data
              </span>
              <a 
                href={externalDextoolsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 transition-colors text-sm"
                title="Open in DEXTools"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Chart Content */}
        <div className="relative" style={{ height: `${height}px` }}>
          {/* Loading State */}
          {isLoading && !iframeError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading chart...</p>
                <p className="text-xs text-gray-400 mt-2">This may take a moment</p>
              </div>
            </div>
          )}

          {iframeError || isBlocked ? (
            renderFallbackContent()
          ) : (
            <>
              <iframe 
                ref={iframeRef}
                id="dextools-widget"
                title="DEXTools Trading Chart"
                width={width}
                height={height}
                src={dextoolsUrl}
                style={{
                  border: 'none',
                  width: '100%',
                  height: '100%'
                }}
                loading="lazy"
                allowFullScreen
                onError={handleIframeError}
                onLoad={handleIframeLoad}
              />
              {/* Fallback overlay that appears if iframe doesn't load properly */}
              {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-pulse text-gray-400 text-4xl mb-4">📊</div>
                    <p className="text-gray-600">Connecting to DEXTools...</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Chart Footer */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Data from DEXTools</span>
            <a 
              href={externalDextoolsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              View on DEXTools ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DextoolsChart;