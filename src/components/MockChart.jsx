import React, { useState, useEffect } from 'react';

const MockChart = ({ 
  strategy, 
  tokenAddress,
  tokenName = 'Token',
  height = 400, 
  width = "100%",
  theme = "light"
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

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

  // Generate mock chart data
  useEffect(() => {
    const generateMockData = () => {
      const data = [];
      const basePrice = Math.random() * 100 + 50; // Random base price between 50-150
      let currentPrice = basePrice;
      
      // Generate 50 data points for the last 24 hours
      for (let i = 0; i < 50; i++) {
        const timestamp = Date.now() - (49 - i) * 30 * 60 * 1000; // 30-minute intervals
        const volatility = 0.05; // 5% volatility
        const change = (Math.random() - 0.5) * 2 * volatility;
        currentPrice = Math.max(currentPrice * (1 + change), 0.01);
        
        data.push({
          timestamp,
          price: currentPrice,
          volume: Math.random() * 1000000
        });
      }
      
      return data;
    };

    // Simulate loading time
    setTimeout(() => {
      setChartData(generateMockData());
      setIsLoading(false);
    }, 1500);
  }, [contractAddress]);

  const renderMockChart = () => {
    if (chartData.length === 0) return null;

    const maxPrice = Math.max(...chartData.map(d => d.price));
    const minPrice = Math.min(...chartData.map(d => d.price));
    const priceRange = maxPrice - minPrice;
    const currentPrice = chartData[chartData.length - 1]?.price || 0;
    const previousPrice = chartData[chartData.length - 2]?.price || currentPrice;
    const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;

    // Generate SVG path for the price line
    const chartWidth = 100; // percentage
    const chartHeight = 80; // percentage of container
    const pathData = chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * chartWidth;
      const y = chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    return (
      <div className="relative w-full h-full bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Price Info Overlay */}
        <div className="absolute top-4 left-4 z-10 bg-white bg-opacity-90 rounded-lg p-3 shadow-sm">
          <div className="text-2xl font-bold text-gray-900">
            ${currentPrice.toFixed(4)}
          </div>
          <div className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
          </div>
        </div>

        {/* Chart SVG */}
        <svg 
          className="w-full h-full" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Price area fill */}
          <path
            d={`${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
            fill="url(#priceGradient)"
            opacity="0.3"
          />
          
          {/* Price line */}
          <path
            d={pathData}
            fill="none"
            stroke={priceChange >= 0 ? "#10b981" : "#ef4444"}
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={priceChange >= 0 ? "#10b981" : "#ef4444"} stopOpacity="0.4"/>
              <stop offset="100%" stopColor={priceChange >= 0 ? "#10b981" : "#ef4444"} stopOpacity="0.1"/>
            </linearGradient>
          </defs>
        </svg>

        {/* Volume bars at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-16 flex items-end justify-between px-2">
          {chartData.slice(-20).map((point, index) => {
            const maxVolume = Math.max(...chartData.map(d => d.volume));
            const barHeight = (point.volume / maxVolume) * 60; // Max 60px height
            return (
              <div
                key={index}
                className="bg-blue-400 opacity-60 rounded-t"
                style={{
                  height: `${barHeight}px`,
                  width: '3px',
                  minHeight: '2px'
                }}
              />
            );
          })}
        </div>

        {/* Chart indicators */}
        <div className="absolute bottom-4 right-4 flex space-x-4 text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span>Price</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-400 rounded-full mr-1"></div>
            <span>Volume</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mock-chart-container">
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
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Mock Data
              </span>
              <div className="text-gray-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Content */}
        <div className="relative" style={{ height: `${height}px` }}>
          {/* Loading State */}
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading chart...</p>
                <p className="text-xs text-gray-400 mt-2">Generating mock data</p>
              </div>
            </div>
          ) : (
            renderMockChart()
          )}
        </div>

        {/* Chart Footer */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Mock Trading Data</span>
            <div className="flex items-center space-x-1">
              <span className="text-blue-600">Demo Chart</span>
              <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockChart;