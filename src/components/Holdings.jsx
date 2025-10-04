import React, { useState, useEffect, useMemo } from 'react';
import { holdingsService } from '../services/holdingsService';
import { useTheme } from '../contexts/ThemeContext';
import { strategyToSlugMappingService } from '../services/strategyToSlugMapping';

const Holdings = ({ strategyAddress, nftAddress, collectionName, holdingsData, strategy, floorPriceEth }) => {
  const { isDark } = useTheme();
  const [holdings, setHoldings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [sortBy, setSortBy] = useState('price'); // 'price' or 'tokenId'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' or 'desc'

  useEffect(() => {
    const fetchHoldings = async () => {
      // If holdingsData is passed as prop, use it directly
      if (holdingsData) {
        try {
          setLoading(true);
          setError(null);
          
          // Calculate USD prices for individual holdings
          const holdingsWithUsd = await holdingsService.calculateUsdPrices(holdingsData);
          
          // Get summary using floor price calculation
          const summaryData = await holdingsService.getHoldingsSummary(holdingsData, floorPriceEth);
          
          setHoldings(holdingsWithUsd);
          setSummary(summaryData);
          
        } catch (err) {
          console.error('❌ Failed to process holdings data:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
        return;
      }

      // Otherwise, fetch holdings if we have the required addresses
      if (!strategyAddress || !nftAddress) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const fetchedHoldingsData = await holdingsService.fetchHoldings(strategyAddress, nftAddress);
        
        // Calculate USD prices for individual holdings
        const holdingsWithUsd = await holdingsService.calculateUsdPrices(fetchedHoldingsData);
        
        // Get summary using floor price calculation
        const summaryData = await holdingsService.getHoldingsSummary(fetchedHoldingsData, floorPriceEth);
        
        setHoldings(holdingsWithUsd);
        setSummary(summaryData);
        
      } catch (err) {
        console.error('❌ Failed to fetch holdings:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, [strategyAddress, nftAddress, holdingsData, floorPriceEth]);

  const formatCurrency = (value, currency = 'USD') => {
    if (!value || value === '0' || value === null) return 'No data';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(value));
  };

  const formatEth = (value) => {
    if (!value || value === '0' || value === null) return 'No data';
    return `${parseFloat(value).toFixed(4)} ETH`;
  };

  const formatMNav = (marketCap, treasuryValue) => {
    if (!marketCap || !treasuryValue || marketCap <= 0 || treasuryValue <= 0) {
      return 'No data';
    }
    const mNav = marketCap / treasuryValue;
    return `${mNav.toFixed(2)}x`;
  };

  // Sort holdings based on current sort settings
  const sortedHoldings = useMemo(() => {
    if (!holdings || holdings.length === 0) return holdings;

    return [...holdings].sort((a, b) => {
      let aValue, bValue;

      if (sortBy === 'price') {
        aValue = parseFloat(a.priceInEth) || 0;
        bValue = parseFloat(b.priceInEth) || 0;
      } else { // tokenId
        aValue = parseInt(a.tokenId) || 0;
        bValue = parseInt(b.tokenId) || 0;
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }, [holdings, sortBy, sortOrder]);

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      // Toggle sort order if same sort type
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Change sort type and reset to default order
      setSortBy(newSortBy);
      setSortOrder(newSortBy === 'price' ? 'asc' : 'asc'); // Price defaults to asc (lowest first), tokenId defaults to asc
    }
  };

  // Handle NFT item click to open NFTPriceFloor page
  const handleNftClick = (holding) => {
    try {
      // Get the correct NFTPriceFloor slug for this collection
      let collectionSlug = '';
      
      if (strategy) {
        // First try to get from strategy data
        collectionSlug = strategy.collectionSlug || 
                        strategyToSlugMappingService.getSlugFromStrategyName(strategy.collectionName);
      }
      
      // Fallback: try to map from collection name
      if (!collectionSlug && collectionName) {
        collectionSlug = strategyToSlugMappingService.getSlugFromStrategyName(collectionName);
      }
      
      // Additional fallback: use collection name in lowercase with dashes
      if (!collectionSlug && collectionName) {
        collectionSlug = collectionName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      }
      
      if (collectionSlug && holding.tokenId) {
        const nftUrl = `https://nftpricefloor.com/${collectionSlug}/${holding.tokenId}`;
        console.log(`🔗 Opening NFT page: ${nftUrl}`);
        window.open(nftUrl, '_blank', 'noopener,noreferrer');
      } else {
        console.warn('⚠️ Unable to construct NFT URL:', { collectionSlug, tokenId: holding.tokenId });
      }
    } catch (error) {
      console.error('❌ Error opening NFT page:', error);
    }
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className={`w-10 h-10 border-4 ${isDark ? 'border-white border-t-transparent' : 'border-black border-t-transparent'} rounded-full animate-spin`}></div>
      <p className={`${isDark ? 'text-white' : 'text-black'} text-lg font-medium`}>Loading holdings...</p>
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
      <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-lg font-medium`}>No NFT Holdings</p>
      <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm`}>This strategy currently holds no NFTs from {collectionName}</p>
    </div>
  );

  const renderNotAvailableState = () => (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="text-yellow-500 text-6xl">⚠️</div>
      <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-lg font-medium`}>Holdings Not Available</p>
      <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-sm text-center max-w-md`}>
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
        <div className={`rounded-none ${isDark ? 'thick-border-dark bg-gray-800' : 'thick-border-light bg-white'} p-4`}>
          <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Total NFTs</h3>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{summary?.totalCount || 0}</p>
        </div>
        
        <div className={`rounded-none ${isDark ? 'thick-border-dark bg-gray-800' : 'thick-border-light bg-white'} p-4`}>
          <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Total Value (ETH)</h3>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{formatEth(summary?.totalValueEth)}</p>
          {floorPriceEth && (
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
              Based on floor price: {parseFloat(floorPriceEth).toFixed(4)} ETH
            </p>
          )}
        </div>
        
        <div className={`rounded-none ${isDark ? 'thick-border-dark bg-gray-800' : 'thick-border-light bg-white'} p-4`}>
          <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-1`}>Total Value (USD)</h3>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{formatCurrency(summary?.totalValueUsd)}</p>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            Live ETH/USD rate from Coinbase
          </p>
        </div>
        
        <div className={`rounded-none ${isDark ? 'thick-border-dark bg-gray-800' : 'thick-border-light bg-white'} p-4`}>
          <div className="flex items-center justify-between mb-1">
            <h3 className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>mNAV</h3>
            <div className="group relative">
              <span className="text-gray-400 cursor-help text-sm">ℹ️</span>
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Market Cap ÷ Treasury Value
              </div>
            </div>
          </div>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
            {formatMNav(strategy?.poolData?.market_cap_usd, summary?.totalValueUsd ? parseFloat(summary.totalValueUsd) : null)}
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>
            Market Cap ÷ Treasury
          </p>
        </div>
      </div>

      {/* Holdings Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Current NFT Holdings</h3>
          <div className="flex items-center gap-4">
            {/* Sort Controls */}
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Sort by:</span>
              <div className={`flex ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg p-1`}>
                <button
                  onClick={() => handleSortChange('price')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    sortBy === 'price'
                      ? isDark
                        ? 'bg-white text-black shadow-sm'
                        : 'bg-black text-white shadow-sm'
                      : isDark
                        ? 'text-gray-300 hover:text-white hover:bg-gray-600'
                        : 'text-gray-600 hover:text-black hover:bg-gray-200'
                  }`}
                >
                  Price {sortBy === 'price' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
                <button
                  onClick={() => handleSortChange('tokenId')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                    sortBy === 'tokenId'
                      ? isDark
                        ? 'bg-white text-black shadow-sm'
                        : 'bg-black text-white shadow-sm'
                      : isDark
                        ? 'text-gray-300 hover:text-white hover:bg-gray-600'
                        : 'text-gray-600 hover:text-black hover:bg-gray-200'
                  }`}
                >
                  Token ID {sortBy === 'tokenId' && (sortOrder === 'desc' ? '↓' : '↑')}
                </button>
              </div>
            </div>
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{holdings.length} items</span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {sortedHoldings.map((holding, index) => (
            <div 
              key={`${holding.tokenId}-${index}`}
              onClick={() => handleNftClick(holding)}
              className={`rounded-none ${isDark ? 'thick-border-dark bg-gray-700' : 'thick-border-light bg-gray-50'} overflow-hidden transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-[0.98]`}
            >
              {/* NFT Image */}
              <div className={`aspect-square ${isDark ? 'bg-gray-600 border-b-2 border-white' : 'bg-gray-200 border-b-2 border-black'} relative overflow-hidden`}>
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
                  className={`absolute inset-0 flex items-center justify-center ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}
                  style={{ display: holding.imageUrl ? 'none' : 'flex' }}
                >
                  <div className="text-center">
                    <div className="text-gray-400 text-3xl mb-2">🖼️</div>
                    <p className={`${isDark ? 'text-gray-300' : 'text-gray-500'} text-xs`}>No Image</p>
                  </div>
                </div>
                
                {/* Token ID Badge */}
                <div className={`absolute top-2 left-2 ${isDark ? 'bg-white text-black' : 'bg-black text-white'} px-2 py-1 text-xs font-bold rounded-none`}>
                  #{holding.tokenId}
                </div>
              </div>
              
              {/* NFT Details */}
              <div className="p-3">
                <div className="space-y-2">
                  <div>
                    <p className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'} uppercase tracking-wide`}>Current Price</p>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{formatEth(holding.priceInEth)}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatCurrency(holding.priceInUsd)}</p>
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