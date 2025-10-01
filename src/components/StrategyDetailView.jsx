import React, { useState, useEffect } from 'react';
import TradingViewChart from './TradingViewChart';
import MockChart from './MockChart';
import DexScreenerChart from './DexScreenerChart';
import Holdings from './Holdings';
import { nftStrategyService } from '../services/nftStrategyService';
import { holdingsService } from '../services/holdingsService';
import { fetchFloorPriceHistory, fetchCollectionDetails } from '../services/nftAPI';
import { collectionMappingService } from '../services/collectionMappingService';
import { getDefaultDateRange, dateToTimestamp, getOptimalGranularity } from '../utils/dateUtils';

// Helper function to generate mock price data for testing
const generateMockPriceData = (days = 30, basePrice = 1.5) => {
  const data = [];
  const now = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate a random price fluctuation (±15%)
    const randomFactor = 0.85 + (Math.random() * 0.3);
    const price = basePrice * randomFactor;
    
    data.push({
      x: date,
      y: parseFloat(price.toFixed(4))
    });
  }
  
  return data;
};

const StrategyDetailView = ({ strategy, onBack }) => {
  const [nftPriceData, setNftPriceData] = useState(null);
  const [tokenPriceData, setTokenPriceData] = useState(null);
  const [holdingsData, setHoldingsData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [collectionDetails, setCollectionDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loadingStates, setLoadingStates] = useState({
    nftPrice: true,
    tokenPrice: true,
    holdings: true,
    sales: true,
    collection: true
  });
  const [errorStates, setErrorStates] = useState({
    nftPrice: null,
    tokenPrice: null,
    holdings: null,
    sales: null,
    collection: null
  });

  useEffect(() => {
    const fetchDetailedData = async () => {
      try {
        console.log('🔍 StrategyDetailView: Starting to fetch detailed data for strategy:', strategy);
        setLoading(true);
        setError(null);
        
        // Reset loading states
        setLoadingStates({
          nftPrice: true,
          tokenPrice: true,
          holdings: true,
          sales: true,
          collection: true
        });

        // Use collection slug or derive from collection name
        const collectionSlug = strategy.collectionSlug || 
          strategy.collectionName?.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        console.log(`📊 Fetching data for collection: ${collectionSlug}`);

        // Fetch all data in parallel for better performance
        const dataPromises = [];

        // 1. Fetch NFT floor price history using RapidAPI endpoint
        dataPromises.push(
          // Use a hardcoded API key for testing purposes
          fetch(`https://nftpf-api-v0.p.rapidapi.com/projects/${collectionSlug}/charts/1d`, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY || '3b8dd0c4c2mshb5c7f1ffac6f8f7p1f2402jsn8d8a046005a9',
              'X-RapidAPI-Host': 'nftpf-api-v0.p.rapidapi.com'
            }
          })
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            })
            .then(result => {
              console.log('📈 NFT Price History Result from RapidAPI:', result);
              
              // Check if result has the expected structure
              if (result && Array.isArray(result.data) && result.data.length > 0) {
                console.log('Sample data point:', result.data[0]);
                
                // Transform the data to match the expected format for the chart
                // Adjust the property names based on the actual API response structure
                const transformedData = result.data.map(point => {
                  // Try different possible property names for the price
                  const price = point.floor_price || point.floorPrice || point.price || 0;
                  const timestamp = point.timestamp || point.date || Date.now()/1000;
                  
                  return {
                    x: new Date(timestamp * 1000), // Convert timestamp to Date object
                    y: parseFloat(price)
                  };
                }).filter(point => point.y > 0);
                
                console.log('Transformed data:', transformedData);
                
                if (transformedData.length > 0) {
                   setNftPriceData(transformedData);
                   console.log(`✅ Transformed ${transformedData.length} NFT price data points from RapidAPI`);
                 } else {
                   console.warn('⚠️ No valid price data points after transformation');
                   // Set empty array when no valid data is available
                   setNftPriceData([]);
                 }
               } else {
                 console.warn('⚠️ No NFT price data available from RapidAPI:', result?.error || 'Unknown error');
                 // Set empty array when API response is invalid
                 setNftPriceData([]);
              }
              setLoadingStates(prev => ({ ...prev, nftPrice: false }));
              setErrorStates(prev => ({ ...prev, nftPrice: null }));
            })
            .catch(err => {
              console.error('❌ Error fetching NFT price data from RapidAPI:', err);
              setNftPriceData([]);
              setLoadingStates(prev => ({ ...prev, nftPrice: false }));
              setErrorStates(prev => ({ ...prev, nftPrice: 'Failed to load NFT price data. Please try again.' }));
            })
        );

        // 2. Fetch collection details
        dataPromises.push(
          fetchCollectionDetails(collectionSlug)
            .then(result => {
              console.log('🏛️ Collection Details Result:', result);
              if (result.success) {
                setCollectionDetails(result.data);
                console.log(`✅ Collection details loaded for ${result.collectionName}`);
                console.log(`📊 24h Price Change: ${result.data.price_change_24h}%`);
                if (result.data.price_change_24h === null || result.data.price_change_24h === undefined) {
                  console.warn('⚠️ 24h Price Change is null/undefined:', {
                    price_change_24h: result.data.price_change_24h,
                    floorTemporalityUsd: result.data.floorTemporalityUsd
                  });
                }
              } else {
                console.warn('⚠️ No collection details available:', result.error);
                setCollectionDetails(null);
              }
              setLoadingStates(prev => ({ ...prev, collection: false }));
              setErrorStates(prev => ({ ...prev, collection: null }));
            })
            .catch(err => {
              console.error('❌ Error fetching collection details:', err);
              setCollectionDetails(null);
              setLoadingStates(prev => ({ ...prev, collection: false }));
              setErrorStates(prev => ({ ...prev, collection: 'Failed to load collection details. Some metrics may be unavailable.' }));
            })
        );

        // 3. Fetch token price data
        dataPromises.push(
          nftStrategyService.getTokenPriceHistory(strategy.tokenAddress)
            .then(result => {
              setTokenPriceData(result);
              setLoadingStates(prev => ({ ...prev, tokenPrice: false }));
              setErrorStates(prev => ({ ...prev, tokenPrice: null }));
            })
            .catch(err => {
              console.error('❌ Error fetching token price data:', err);
              setTokenPriceData(null);
              setLoadingStates(prev => ({ ...prev, tokenPrice: false }));
              setErrorStates(prev => ({ ...prev, tokenPrice: 'Failed to load token price data. Chart may not display.' }));
            })
        );

        // 4. Fetch holdings breakdown using the same service as Holdings tab
        dataPromises.push(
          holdingsService.fetchHoldings(strategy.tokenAddress, strategy.collection || strategy.contractAddress)
            .then(result => {
              setHoldingsData(result);
              setLoadingStates(prev => ({ ...prev, holdings: false }));
              setErrorStates(prev => ({ ...prev, holdings: null }));
            })
            .catch(err => {
              console.error('❌ Error fetching holdings data:', err);
              setHoldingsData(null);
              setLoadingStates(prev => ({ ...prev, holdings: false }));
              setErrorStates(prev => ({ ...prev, holdings: 'Failed to load holdings data. Holdings tab may be unavailable.' }));
            })
        );

        // 5. Fetch historical sales data from NFT Strategy API
        dataPromises.push(
          fetch(`https://www.nftstrategy.fun/api/opensea/floor-price?collectionOsSlug=${collectionSlug}&contractAddress=${strategy.collection || strategy.contractAddress}`)
            .then(response => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            })
            .then(result => {
              console.log('📊 Sales Data Result:', result);
              // Transform the API response to match expected format
              let transformedData = [];
              
              if (result && typeof result === 'object') {
                // If result is a single object, wrap it in an array
                if (!Array.isArray(result)) {
                  transformedData = [{
                    id: 1,
                    tokenId: result.tokenId || result.token_id || 'N/A',
                    name: result.name || `${strategy.collectionName} #${result.tokenId || result.token_id || ''}` || 'NFT',
                    imageUrl: result.image || result.imageUrl || result.image_url || '',
                    price: result.floorPrice || result.floor_price || result.price || 0,
                    priceEth: result.floorPriceEth || result.floor_price_eth || result.price_eth || 0,
                    marketplace: result.marketplace || 'OpenSea',
                    buyer: result.owner || result.current_owner || 'Unknown',
                    date: result.lastUpdated || result.last_updated || new Date().toISOString(),
                    contractAddress: strategy.collection || strategy.contractAddress
                  }];
                } else {
                  // If result is already an array, transform each item
                  transformedData = result.map((item, index) => ({
                    id: index + 1,
                    tokenId: item.tokenId || item.token_id || 'N/A',
                    name: item.name || `${strategy.collectionName} #${item.tokenId || item.token_id || ''}` || 'NFT',
                    imageUrl: item.image || item.imageUrl || item.image_url || '',
                    price: item.floorPrice || item.floor_price || item.price || 0,
                    priceEth: item.floorPriceEth || item.floor_price_eth || item.price_eth || 0,
                    marketplace: item.marketplace || 'OpenSea',
                    buyer: item.owner || item.current_owner || 'Unknown',
                    date: item.lastUpdated || item.last_updated || new Date().toISOString(),
                    contractAddress: strategy.collection || strategy.contractAddress
                  }));
                }
              }
              
              console.log('Transformed sales data:', transformedData);
              setSalesData(transformedData);
              setLoadingStates(prev => ({ ...prev, sales: false }));
              setErrorStates(prev => ({ ...prev, sales: null }));
            })
            .catch(err => {
              console.error('❌ Error fetching sales data:', err);
              setSalesData([]);
              setLoadingStates(prev => ({ ...prev, sales: false }));
              setErrorStates(prev => ({ ...prev, sales: 'Failed to load sales data. Sales history may be unavailable.' }));
            })
        );

        // Wait for all promises to complete
        await Promise.allSettled(dataPromises);
        
        console.log('✅ StrategyDetailView: All data fetching completed');

      } catch (err) {
        console.error('❌ StrategyDetailView: Failed to fetch detailed strategy data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (strategy) {
      console.log('🚀 StrategyDetailView: Strategy prop received, fetching data...');
      fetchDetailedData();
    } else {
      console.log('⚠️ StrategyDetailView: No strategy prop provided');
    }
  }, [strategy]);

  const formatCurrency = (value, currency = 'USD') => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatCurrencyWithDecimals = (value, decimals = 2, currency = 'USD') => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const formatMarketCap = (value, currency = 'USD') => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if it's a valid number (including 0)
    if (isNaN(numValue) || typeof numValue !== 'number') return 'N/A';
    
    return `${numValue >= 0 ? '+' : ''}${numValue.toFixed(2)}%`;
  };

  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      <p className="text-black text-lg font-medium">Loading strategy details...</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center h-96 gap-4">
      <div className="text-red-500 text-6xl">⚠️</div>
      <p className="text-red-600 text-lg font-medium">Failed to load strategy details</p>
      <p className="text-red-500 text-sm opacity-75">{error}</p>
    </div>
  );

  const renderOverviewTab = () => {
    // Get collection slug for NFTPricefloor URL
    const collectionSlug = strategy.collectionSlug || 
      strategy.collectionName?.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

    return (
      <div className="space-y-6">
        {/* Comparative Table */}
        <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] overflow-visible">
          <div className="border-b-2 border-black px-6 py-4 bg-gray-50">
            <h3 className="text-xl font-bold text-black">Strategy vs Collection Comparison</h3>
            <p className="text-sm text-gray-600 mt-1">Side-by-side comparison of NFT collection and strategy metrics</p>
            {errorStates.collection && (
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule={"evenodd"} />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">{errorStates.collection}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-black bg-gray-50">
                  <th className="text-left py-4 px-6 font-bold text-black">Metric</th>
                  <th className="text-left py-4 px-6 font-bold text-black">NFT Collection</th>
                  <th className="text-left py-4 px-6 font-bold text-black">Strategy Token</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-700">Price (Current)</td>
                  <td className="py-4 px-6">
                    {loadingStates.collection ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    ) : (
                      <span className="font-medium">
                        {collectionDetails?.floor_price_eth ? 
                          `${parseFloat(collectionDetails.floor_price_eth).toFixed(2)} ETH` : 
                          <span className="text-gray-400">N/A</span>
                        }
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium">{formatCurrencyWithDecimals(strategy.poolData?.price_usd, 4)}</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-700">Market Cap</td>
                  <td className="py-4 px-6">
                    {loadingStates.collection ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    ) : (
                      <span className="font-medium">
                        {collectionDetails?.market_cap_usd ? 
                          formatMarketCap(collectionDetails.market_cap_usd) : 
                          <span className="text-gray-400">N/A</span>
                        }
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium">{formatMarketCap(strategy.poolData?.market_cap_usd)}</span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-700">24h % Change</td>
                  <td className="py-4 px-6">
                    {loadingStates.collection ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    ) : (
                      <span className={`font-medium ${
                        collectionDetails?.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(collectionDetails?.price_change_24h)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`font-medium ${
                      strategy.poolData?.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(strategy.poolData?.price_change_24h)}
                    </span>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-700">Number of Holders</td>
                  <td className="py-4 px-6">
                    {loadingStates.collection ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-gray-500">Loading...</span>
                      </div>
                    ) : (
                      <span className="font-medium">
                        {collectionDetails?.holders_count ? 
                          formatNumber(collectionDetails.holders_count) : 
                          <span className="text-gray-400">N/A</span>
                        }
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-medium">{formatNumber(strategy.totalHolders)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Key Metrics Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Floor Market Cap Ratio */}
          <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm lg:text-lg font-bold text-black truncate">Floor Market Cap Ratio</h4>
              <div className="group relative flex-shrink-0 ml-2">
                <span className="text-gray-400 cursor-help">ℹ️</span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Ratio of strategy token market cap to NFT collection market cap
                </div>
              </div>
            </div>
            <div className="text-xl lg:text-3xl font-bold text-black">
              {(() => {
                const strategyMarketCap = strategy.poolData?.market_cap_usd;
                const nftMarketCap = collectionDetails?.market_cap_usd;
                
                if (strategyMarketCap && nftMarketCap && nftMarketCap > 0) {
                  const ratio = (strategyMarketCap / nftMarketCap) * 100;
                  return `${ratio.toFixed(2)}%`;
                }
                return 'N/A';
              })()}
            </div>
            <p className="text-xs lg:text-sm text-gray-600 mt-1">Strategy vs NFT valuation</p>
          </div>

          {/* Burn Percentage */}
          <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] p-4 lg:p-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm lg:text-lg font-bold text-black truncate">Burn Percentage</h4>
              <div className="group relative flex-shrink-0 ml-2">
                <span className="text-gray-400 cursor-help">ℹ️</span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Percentage of tokens burned from total supply
                </div>
              </div>
            </div>
            <div className="text-xl lg:text-3xl font-bold text-black">
              {strategy.burnPercentage && typeof strategy.burnPercentage === 'number' ? 
                `${strategy.burnPercentage.toFixed(2)}%` : 'N/A'
              }
            </div>
            <p className="text-xs lg:text-sm text-gray-600 mt-1">Tokens removed from circulation</p>
          </div>

          {/* Holdings by Strategy */}
          <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] p-4 lg:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm lg:text-lg font-bold text-black truncate">Holdings by Strategy</h4>
              <div className="group relative flex-shrink-0 ml-2">
                <span className="text-gray-400 cursor-help">ℹ️</span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Total number of NFT items held by this strategy
                </div>
              </div>
            </div>
            <div className="text-xl lg:text-3xl font-bold text-black">
              {loadingStates.holdings ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-gray-500 text-lg">Loading...</span>
                </div>
              ) : (
                holdingsData && Array.isArray(holdingsData) ? 
                  formatNumber(holdingsData.length) : 
                  (holdingsData?.totalCount ? formatNumber(holdingsData.totalCount) : 'N/A')
              )}
            </div>
            <p className="text-xs lg:text-sm text-gray-600 mt-1">Number of NFT items owned</p>
            <div className="mt-3">
              <button
                onClick={() => setActiveTab('holdings')}
                className="w-full px-3 lg:px-4 py-2 bg-black text-white rounded-none border-2 border-black hover:bg-gray-800 transition-colors font-medium text-sm lg:text-base"
              >
                View Holdings Details →
              </button>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-black">Price Charts</h2>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* NFT Floor Price Chart */}
            <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] min-h-[320px] sm:min-h-[400px]">
              <div className="border-b-2 border-black px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-black">NFT Floor Price</h3>
                    <p className="text-sm text-gray-600">{strategy.collectionName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Powered by</div>
                    <div className="text-sm font-medium text-black">NFTPriceFloor API</div>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {errorStates.nftPrice && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{errorStates.nftPrice}</p>
                      </div>
                    </div>
                  </div>
                )}
                {loadingStates.nftPrice ? (
                  <div className="flex items-center justify-center h-72 sm:h-80">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading NFT price data...</p>
                    </div>
                  </div>
                ) : nftPriceData && nftPriceData.length > 0 ? (
                  <TradingViewChart
                    collections={[{
                      name: strategy.collectionName || 'NFT Collection',
                      data: nftPriceData
                    }]}
                    title={`${strategy.collectionName} Floor Price`}
                    height={320}
                  />
                ) : (
                  <div className="flex items-center justify-center h-72 sm:h-80">
                    <div className="text-center">
                      <div className="text-gray-400 text-5xl mb-3">📊</div>
                      <p className="text-gray-600 font-medium text-lg">NFT Floor Price Data</p>
                      <p className="text-gray-400 text-sm mt-1">No chart data available</p>
                    </div>
                  </div>
                )}
                {/* NFTPricefloor Redirect Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => window.open(`https://nftpricefloor.com/${collectionSlug}`, '_blank')}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-none border-2 border-blue-600 hover:bg-blue-700 hover:border-blue-700 transition-colors font-medium flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <span>View on NFTPricefloor</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Token Price Chart */}
            <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] min-h-[320px] sm:min-h-[400px]">
              <div className="border-b-2 border-black px-6 py-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-black">Token Price</h3>
                    <p className="text-sm text-gray-600">{strategy.tokenName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Powered by</div>
                    <div className="text-sm font-medium text-black">DexScreener</div>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6">
                {errorStates.tokenPrice && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-700">{errorStates.tokenPrice}</p>
                      </div>
                    </div>
                  </div>
                )}
                {loadingStates.tokenPrice ? (
                  <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading token price data...</p>
                    </div>
                  </div>
                ) : (
                  <DexScreenerChart
                    strategy={strategy}
                    tokenAddress={strategy.tokenAddress}
                    tokenName={strategy.tokenName}
                    theme="light"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };



  const renderHoldingsTab = () => {
    return (
      <div className="space-y-6">
        {errorStates.holdings && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule={"evenodd"} />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Holdings Data Error</h3>
                <p className="text-sm text-red-700 mt-1">{errorStates.holdings}</p>
              </div>
            </div>
          </div>
        )}
        {loadingStates.holdings ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500 text-lg">Loading holdings data...</p>
              <p className="text-gray-400 text-sm mt-2">This may take a few moments</p>
            </div>
          </div>
        ) : (
          <Holdings 
            strategyAddress={strategy.id}
            nftAddress={strategy.collection}
            collectionName={strategy.collectionName}
            holdingsData={holdingsData}
          />
        )}
      </div>
    );
  };

  const renderSalesTab = () => {
    // Helper functions for formatting (matching Holdings component)
    const formatEth = (value) => {
      if (!value || value === 0) return '0 ETH';
      return `${parseFloat(value).toFixed(4)} ETH`;
    };

    const formatCurrency = (value) => {
      if (!value || value === 0) return '$0';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    };

    if (loadingStates.sales) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          <span className="ml-3 text-gray-600">Loading sales data...</span>
        </div>
      );
    }

    if (errorStates.sales) {
      return (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Sales Data</h3>
          <p className="text-gray-600">{errorStates.sales}</p>
        </div>
      );
    }

    if (!salesData || salesData.length === 0) {
      return (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Data Available</h3>
          <p className="text-gray-600">No recent sales found for this collection.</p>
        </div>
      );
    }

    // Calculate summary data
    const totalSales = salesData.length;
    const floorPrice = salesData[0]?.priceEth || salesData[0]?.price || 0;
    const averagePrice = salesData.reduce((sum, item) => sum + (item.priceEth || item.price || 0), 0) / totalSales;

    return (
      <div className="space-y-6">
        {/* Sales Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_#000000] p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Total Sales</h3>
            <p className="text-2xl font-bold text-black">{totalSales}</p>
          </div>
          
          <div className="rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_#000000] p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Floor Price</h3>
            <p className="text-2xl font-bold text-black">{formatEth(floorPrice)}</p>
          </div>
          
          <div className="rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_#000000] p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Average Price</h3>
            <p className="text-2xl font-bold text-black">{formatEth(averagePrice)}</p>
          </div>
          
          <div className="rounded-none border-2 border-black bg-white shadow-[4px_4px_0px_#000000] p-4">
            <h3 className="text-sm font-medium text-gray-600 mb-1">Marketplace</h3>
            <p className="text-2xl font-bold text-black">{salesData[0]?.marketplace || 'OpenSea'}</p>
          </div>
        </div>

        {/* Sales Grid */}
        <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-black">Floor Price Data</h3>
            <span className="text-sm text-gray-600">{salesData.length} items</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {salesData.map((nft, index) => (
              <div 
                key={`${nft.tokenId}-${index}`}
                className="rounded-none border-2 border-black bg-gray-50 shadow-[4px_4px_0px_#000000] overflow-hidden hover:shadow-[6px_6px_0px_#000000] transition-all duration-200"
              >
                {/* NFT Image */}
                <div className="aspect-square bg-gray-200 border-b-2 border-black relative overflow-hidden">
                  {nft.imageUrl ? (
                    <img
                      src={nft.imageUrl}
                      alt={nft.name}
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
                    style={{ display: nft.imageUrl ? 'none' : 'flex' }}
                  >
                    <div className="text-center">
                      <div className="text-gray-400 text-3xl mb-2">🖼️</div>
                      <p className="text-gray-500 text-xs">No Image</p>
                    </div>
                  </div>
                  
                  {/* Token ID Badge */}
                  <div className="absolute top-2 left-2 bg-black text-white px-2 py-1 text-xs font-bold rounded-none">
                    #{nft.tokenId}
                  </div>
                </div>
                
                {/* NFT Details */}
                <div className="p-3">
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-600 uppercase tracking-wide">Current Price</p>
                      <p className="text-sm font-bold text-black">{formatEth(nft.priceEth || nft.price)}</p>
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

  if (loading) return renderLoadingState();
  if (error) return renderErrorState();
  if (!strategy) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-yellow-500 text-6xl">⚠️</div>
        <p className="text-gray-600 text-lg font-medium">No strategy selected</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors"
        >
          Back to Strategies
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 py-8 pb-24" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-full overflow-x-auto whitespace-nowrap scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'holdings', label: 'Holdings' },
          { id: 'sales', label: 'Sales' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 rounded-md text-sm font-medium transition-all inline-flex min-h-[44px] ${
              activeTab === tab.id
                ? 'bg-white text-black shadow-sm'
                : 'text-gray-600 hover:text-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mb-8">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'holdings' && renderHoldingsTab()}
        {activeTab === 'sales' && renderSalesTab()}
      </div>
    </div>
  );
};

export default StrategyDetailView;