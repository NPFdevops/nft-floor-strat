import React, { useState } from 'react';

const DextoolsChart = ({ 
  tokenAddress, 
  tokenName = 'Token',
  height = 300,
  theme = 'light'
}) => {
  const [showFallback, setShowFallback] = useState(false);

  // Validate token address
  const isValidTokenAddress = (address) => {
    return address && /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  // Generate Dextools URL for external viewing
  const getDextoolsUrl = () => {
    if (!tokenAddress || !isValidTokenAddress(tokenAddress)) {
      return null;
    }

    return `https://www.dextools.io/app/en/ether/pair-explorer/${tokenAddress}`;
  };

  const dextoolsUrl = getDextoolsUrl();

  if (!tokenAddress) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center">
          <div className="text-gray-400 text-4xl mb-2">🔗</div>
          <p className="text-gray-500 font-medium">Token Price Chart</p>
          <p className="text-gray-400 text-sm">Token address required</p>
        </div>
      </div>
    );
  }

  if (!isValidTokenAddress(tokenAddress)) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-2">⚠️</div>
          <p className="text-red-500 font-medium">Invalid Token Address</p>
          <p className="text-gray-400 text-sm">Please provide a valid Ethereum address</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4" style={{ height: `${height}px` }}>
      <div className="text-center">
        <div className="text-blue-500 text-5xl mb-3">📈</div>
        <h3 className="text-lg font-bold text-black mb-2">{tokenName} Price Chart</h3>
        <p className="text-gray-600 text-sm mb-4">
          View real-time price data and trading information on Dextools
        </p>
        
        {dextoolsUrl && (
          <a
            href={dextoolsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <span className="mr-2">📊</span>
            View on Dextools
            <span className="ml-2">↗</span>
          </a>
        )}
        
        <div className="mt-4 text-xs text-gray-500">
          <p>Token: {tokenAddress.slice(0, 8)}...{tokenAddress.slice(-6)}</p>
        </div>
      </div>
    </div>
  );
};

export default DextoolsChart;