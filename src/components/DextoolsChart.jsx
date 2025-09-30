import React, { useState } from 'react';

const DextoolsChart = ({ 
  strategy, 
  tokenAddress,
  tokenName = 'Token',
  height = 400, 
  width = "100%",
  theme = "light",
  chartType = "2",
  chartResolution = "30"
}) => {
  const [iframeError, setIframeError] = useState(false);
  
  // Use the provided contract address as default, or tokenAddress if provided
  const contractAddress = tokenAddress || "0xbdb0f9c31367485f85e691f638345f3de673a78effaff71ce34bc7ff1d54fddc";
  
  // Use the official Dextools embed URL format
  const dextoolsUrl = `https://www.dextools.io/widgets/en/ether/pe-light/${contractAddress}?theme=${theme}&chartType=${chartType}&chartResolution=${chartResolution}&drawingToolbars=false`;

  // Generate external Dextools URL for viewing
  const externalDextoolsUrl = `https://www.dextools.io/app/en/ether/pair-explorer/${contractAddress}`;

  const handleIframeError = () => {
    setIframeError(true);
  };

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
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Live Data
              </span>
            </div>
          </div>
        </div>

        {/* Chart Content */}
        <div className="relative" style={{ height: `${height}px` }}>
          {iframeError ? (
            // Fallback content when iframe fails to load
            <div className="flex flex-col items-center justify-center h-full bg-gray-50">
              <div className="text-center p-6">
                <div className="text-gray-400 text-4xl mb-4">📊</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Chart Unavailable</h4>
                <p className="text-sm text-gray-600 mb-4">
                  The trading chart cannot be embedded due to security restrictions.
                </p>
                <a 
                  href={externalDextoolsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Chart on DEXTools
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          ) : (
            <iframe 
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
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              onError={handleIframeError}
              onLoad={(e) => {
                // Check if iframe loaded successfully
                try {
                  if (e.target.contentDocument === null) {
                    handleIframeError();
                  }
                } catch (error) {
                  // Cross-origin restrictions prevent access, but iframe might still work
                  console.log('Iframe loaded with cross-origin restrictions');
                }
              }}
            />
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