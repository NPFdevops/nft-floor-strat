import React, { useState, useEffect } from 'react';
import { holdingsService } from '../services/holdingsService';

const Holdings = ({ strategyAddress, nftAddress, collectionName }) => {
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    const fetchHoldings = async () => {
      if (!strategyAddress || !nftAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const holdingsData = await holdingsService.fetchHoldings(strategyAddress, nftAddress);
        const summaryData = holdingsService.getHoldingsSummary(holdingsData);
        
        setHoldings(holdingsData);
        setSummary(summaryData);
        
      } catch (err) {
        console.error('❌ Failed to fetch holdings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, [strategyAddress, nftAddress]);

  const formatCurrency = (value, currency = 'USD') => {
    if (!value || value === '0') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(value));
  };

  const formatEth = (value) => {
    if (!value || value === '0') return '0 ETH';
    return `${parseFloat(value).toFixed(4)} ETH`;
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      <p className="text-black text-lg font-medium">Loading holdings...</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="text-red-500 text-6xl">⚠️</div>
      <p className="text-red-600 text-lg font-medium">Failed to load holdings</p>
      <p className="text-red-500 text-sm opacity-75">{error}</p>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="text-gray-400 text-6xl">📦</div>
      <p className="text-gray-600 text-lg font-medium">No NFT Holdings</p>
      <p className="text-gray-500 text-sm">This strategy currently holds no NFTs from {collectionName}</p>
    </div>
  );

  const renderNotAvailableState = () => (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="text-yellow-500 text-6xl">⚠️</div>
      <p className="text-gray-600 text-lg font-medium">Holdings Not Available</p>
      <p className="text-gray-500 text-sm text-center max-w-md">
        {!strategyAddress && !nftAddress 
          ? "Strategy and NFT contract addresses are required to display holdings."
          : !strategyAddress 
          ? "Strategy contract address is required to display holdings."
          : `NFT contract address not found for collection "${collectionName}". Please check the collection mapping.`
        }
      </p>
      {!nftAddress && collectionName && (
        <p className="text-gray-400 text-xs">
          Collection: {collectionName}
        </p>
      )}
    </div>
  );

  // Render logic
  if (loading) return renderLoadingState();
  if (error) return renderErrorState();
  if (!strategyAddress || !nftAddress) return renderNotAvailableState();
  if (!holdings || holdings.length === 0) return renderEmptyState();

  return (
    <div className="space-y-6">
      {/* Holdings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_#000000] p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total NFTs</h3>
          <p className="text-2xl font-bold text-black">{summary?.totalCount || 0}</p>
        </div>
        
        <div className="rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_#000000] p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Value (ETH)</h3>
          <p className="text-2xl font-bold text-black">{formatEth(summary?.totalValueEth)}</p>
        </div>
        
        <div className="rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_#000000] p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Total Value (USD)</h3>
          <p className="text-2xl font-bold text-black">{formatCurrency(summary?.totalValueUsd)}</p>
        </div>
        
        <div className="rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_#000000] p-4">
          <h3 className="text-sm font-medium text-gray-600 mb-1">Average Value</h3>
          <p className="text-2xl font-bold text-black">{formatCurrency(summary?.averageValueUsd)}</p>
        </div>
      </div>

      {/* Holdings Grid */}
      <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-black">Current NFT Holdings</h3>
          <span className="text-sm text-gray-600">{holdings.length} items</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {holdings.map((holding, index) => (
            <div 
              key={`${holding.tokenId}-${index}`}
              className="rounded-none border-2 border-black bg-gray-50 shadow-[4px_4px_0px_#000000] overflow-hidden hover:shadow-[6px_6px_0px_#000000] transition-all duration-200"
            >
              {/* NFT Image */}
              <div className="aspect-square bg-gray-200 border-b-2 border-black relative overflow-hidden">
                {holding.imageUrl ? (
                  <img
                    src={holding.imageUrl}
                    alt={`${collectionName} #${holding.tokenId}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                
                {/* Fallback for missing/broken images */}
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-gray-200"
                  style={{ display: holding.imageUrl ? 'none' : 'flex' }}
                >
                  <div className="text-center">
                    <div className="text-gray-400 text-3xl mb-2">🖼️</div>
                    <p className="text-gray-500 text-xs">No Image</p>
                  </div>
                </div>
                
                {/* Token ID Badge */}
                <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-xs font-bold rounded-none">
                  #{holding.tokenId}
                </div>
              </div>
              
              {/* NFT Details */}
              <div className="p-3">
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600 uppercase tracking-wide">Current Price</p>
                    <p className="text-sm font-bold text-black">{formatEth(holding.priceInEth)}</p>
                    <p className="text-xs text-gray-500">{formatCurrency(holding.priceInUsd)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Holdings;