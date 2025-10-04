import React, { useState, useEffect, useRef } from 'react';

const DexScreenerChart = ({ 
  strategy, 
  tokenAddress, 
  tokenName = 'Token', 
  theme = 'light',
  chainId = 'ethereum'
}) => {
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef(null);
  const timeoutRef = useRef(null);
  
  // Mobile detection effect
  useEffect(() => {
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const mobileBreakpoint = window.innerWidth <= 768;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      setIsMobile(mobileBreakpoint || isMobileDevice);
    };
    
    // Check on mount
    checkIsMobile();
    
    // Check on window resize
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);
  
  // Use strategy's token address first, then fallback to provided tokenAddress
  // Default to the PUDGYSTR token address from the provided URL if no address is available
  const contractAddress = strategy?.tokenAddress || tokenAddress || '0x4d40c47b13be30724b89019be0549ead71e363e50cef119a56bd64ead4e35016';
  
  // Build the DexScreener embed URL with optimized parameters matching the provided format
  // Add chartDefaultOnMobile=1 parameter for mobile devices
  const mobileParam = isMobile ? '&chartDefaultOnMobile=1' : '';
  const dexScreenerUrl = `https://dexscreener.com/${chainId}/${contractAddress}?embed=1&loadChartSettings=0&trades=0&tabs=0&info=0&chartLeftToolbar=0&chartTimeframesToolbar=0${mobileParam}&chartTheme=${theme}&theme=${theme}&chartStyle=1&chartType=usd&interval=120`;

  // Generate external DexScreener URL for viewing
  const externalDexScreenerUrl = `https://dexscreener.com/${chainId}/${contractAddress}`;

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
  };

  // Debug: Log URL changes when mobile state changes (development only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🎯 DexScreener - Mobile detection:', {
        isMobile,
        windowWidth: window.innerWidth,
        userAgent: navigator.userAgent.substring(0, 100),
        url: dexScreenerUrl
      });
    }
  }, [isMobile, dexScreenerUrl]);
  
  useEffect(() => {
    // Set a timeout to detect if the iframe fails to load
    timeoutRef.current = setTimeout(() => {
      if (isLoading) {
        setIsBlocked(true);
        setIsLoading(false);
      }
    }, 10000); // 10 second timeout

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading]);

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

  if (iframeError || isBlocked) {
    return (
      <div className="flex items-center justify-center h-80">
        <div className="text-center">
          <div className="text-gray-400 text-5xl mb-3">📊</div>
          <p className="text-gray-600 font-medium text-lg">Chart Unavailable</p>
          <p className="text-gray-400 text-sm mt-1 mb-4">
            DexScreener chart could not be loaded
          </p>
          <a
            href={externalDexScreenerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-none border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700 transition-colors font-medium"
          >
            <span>View on DexScreener</span>
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Loading State - Matching existing design */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading DexScreener chart...</p>
          </div>
        </div>
      )}

      {/* DexScreener Embed Styles - Responsive design matching container height */}
      <style jsx>{`
        #dexscreener-embed {
          position: relative;
          width: 100%;
          height: 400px;
          min-height: 300px;
        }
        
        @media(min-width: 768px) {
          #dexscreener-embed {
            height: 450px;
          }
        }
        
        @media(min-width: 1024px) {
          #dexscreener-embed {
            height: 500px;
          }
        }
        
        @media(min-width: 1280px) {
          #dexscreener-embed {
            height: 550px;
          }
        }
        
        #dexscreener-embed iframe {
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          border: 0;
        }
      `}</style>

      {/* DexScreener Embed Container */}
      <div id="dexscreener-embed">
        <iframe
          key={`dexscreener-${isMobile ? 'mobile' : 'desktop'}`}
          ref={iframeRef}
          src={dexScreenerUrl}
          title={`${tokenName} Trading Chart`}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
          allow="clipboard-write"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>

      {/* External Link Button - Styled to match design system */}
      <div className="absolute top-3 right-3 z-20">
        <a
          href={externalDexScreenerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-2 py-1 bg-black text-white text-xs border border-black hover:bg-gray-800 transition-colors font-medium"
          title="Open in DexScreener"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default DexScreenerChart;