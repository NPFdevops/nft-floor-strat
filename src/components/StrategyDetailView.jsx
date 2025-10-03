import React, { useState, useEffect } from 'react';
import './StrategyDetailView.css';
import TradingViewChart from './TradingViewChart';
import MockChart from './MockChart';
import DexScreenerChart from './DexScreenerChart';
import Holdings from './Holdings';
import StrategyDetailSkeleton from './StrategyDetailSkeleton';
import { nftStrategyService } from '../services/nftStrategyService';
import { holdingsService } from '../services/holdingsService';
import { fetchFloorPriceHistory, fetchCollectionDetails } from '../services/nftAPI';
import { collectionMappingService } from '../services/collectionMappingService';
import { strategyToSlugMappingService } from '../services/strategyToSlugMapping';
import { getDefaultDateRange, dateToTimestamp, getOptimalGranularity } from '../utils/dateUtils';
import { useTheme } from '../contexts/ThemeContext';

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
  const { isDark } = useTheme();
  const [nftPriceData, setNftPriceData] = useState(null);
  const [tokenPriceData, setTokenPriceData] = useState(null);
  const [holdingsData, setHoldingsData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [collectionDetails, setCollectionDetails] = useState(null);
  const [loading, setLoading] = useState(true); // Only for initial page load
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
        // Don't block the initial render with setLoading(true) - show skeleton instead
        setError(null);
        
        // Reset loading states
        setLoadingStates({
          nftPrice: true,
          tokenPrice: true,
          holdings: true,
          sales: true,
          collection: true
        });

        // Set main loading to false immediately to show page with skeleton
        setLoading(false);

        // Use strategy-to-slug mapping service for accurate NFTPriceFloor API slug
        const mappedSlug = strategyToSlugMappingService.getSlugFromStrategyName(strategy.collectionName);
        const collectionSlug = strategy.collectionSlug || mappedSlug;
        
        console.log(`🔄 Strategy mapping: "${strategy.collectionName}" -> "${mappedSlug}"`);
        console.log(`📊 Using NFTPriceFloor slug: ${collectionSlug}`);
        
        // Also check if we have an OpenSea slug and map that too
        const openSeaSlug = strategy.collectionOsSlug;
        if (openSeaSlug && !mappedSlug) {
          const osToNftpfSlug = strategyToSlugMappingService.getSlugFromOpenSeaSlug(openSeaSlug);
          console.log(`🌊 OpenSea slug mapping: "${openSeaSlug}" -> "${osToNftpfSlug}"`);
        }

        // Fetch all data in parallel for better performance
        const dataPromises = [];

        // 1. Fetch NFT floor price history using RapidAPI endpoint with mapped slug
        console.log(`🔗 Fetching NFT price history from: https://nftpf-api-v0.p.rapidapi.com/projects/${collectionSlug}/charts/1d`);
        dataPromises.push(
          fetch(`https://nftpf-api-v0.p.rapidapi.com/projects/${collectionSlug}/charts/1d`, {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY || '8365737378msh545ccf17407a091p1adbfcjsn47252db2d5db',
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
              console.log('🔍 API Response structure check:', {
                hasTimestamps: !!result?.timestamps,
                timestampsLength: result?.timestamps?.length,
                hasFloorNative: !!result?.floorNative,
                floorNativeLength: result?.floorNative?.length,
                sampleData: {
                  timestamp: result?.timestamps?.[0],
                  price: result?.floorNative?.[0]
                }
              });
              
              // Check if result has the expected structure (timestamps and floorNative arrays)
              if (result && Array.isArray(result.timestamps) && Array.isArray(result.floorNative) && 
                  result.timestamps.length > 0 && result.floorNative.length > 0) {
                console.log(`✅ Found ${result.timestamps.length} timestamps and ${result.floorNative.length} floor prices`);
                
                // Transform the data to match the expected format for the chart
                // Combine timestamps with floor prices
                const transformedData = result.timestamps.map((timestamp, index) => {
                  const price = result.floorNative[index];
                  
                  // Skip invalid data points
                  if (!timestamp || !price || price <= 0) {
                    return null;
                  }
                  
                  const dataPoint = {
                    x: new Date(timestamp), // Timestamp is already in milliseconds
                    y: parseFloat(price)
                  };
                  
                  // Log first few data points for debugging
                  if (index < 3) {
                    console.log(`📊 Data point ${index}:`, {
                      originalTimestamp: timestamp,
                      dateObject: dataPoint.x,
                      dateString: dataPoint.x.toISOString(),
                      price: dataPoint.y
                    });
                  }
                  
                  return dataPoint;
                }).filter(point => point !== null && point.y > 0);
                
                console.log(`🔄 Transformed ${transformedData.length} data points (showing first 3):`, 
                  transformedData.slice(0, 3).map(p => ({ 
                    date: p.x.toISOString().split('T')[0], 
                    price: p.y 
                  })));
                
                if (transformedData.length > 0) {
                   console.log('📈 Setting NFT price data...');
                   setNftPriceData(transformedData);
                   console.log(`✅ Successfully loaded ${transformedData.length} NFT price data points from RapidAPI`);
                   
                   // Additional validation
                   console.log('🔍 Data validation:', {
                     allHaveValidDates: transformedData.every(p => p.x instanceof Date && !isNaN(p.x.getTime())),
                     allHaveValidPrices: transformedData.every(p => typeof p.y === 'number' && p.y > 0),
                     dateRange: {
                       first: transformedData[0]?.x?.toISOString?.()?.split('T')[0],
                       last: transformedData[transformedData.length - 1]?.x?.toISOString?.()?.split('T')[0]
                     },
                     priceRange: {
                       min: Math.min(...transformedData.map(p => p.y)),
                       max: Math.max(...transformedData.map(p => p.y))
                     }
                   });
                 } else {
                   console.warn('⚠️ No valid price data points after transformation');
                   setNftPriceData([]);
                 }
               } else {
                 console.warn('⚠️ Invalid API response structure:', {
                   hasTimestamps: result?.timestamps ? `Array(${result.timestamps.length})` : 'Missing',
                   hasFloorNative: result?.floorNative ? `Array(${result.floorNative.length})` : 'Missing',
                   error: result?.error || result?.message
                 });
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

        // 2. Fetch collection details using mapped slug with enhanced error handling
        console.log(`🏛️ Fetching collection details for slug: ${collectionSlug}`);
        dataPromises.push(
          (async () => {
            try {
              // Use the direct NFTPriceFloor API approach as fallback
              const directApiUrl = `https://nftpf-api-v0.p.rapidapi.com/projects/${collectionSlug}`;
              console.log(`🔄 Direct API call to: ${directApiUrl}`);
              
              const response = await fetch(directApiUrl, {
                method: 'GET',
                headers: {
                  'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY || '8365737378msh545ccf17407a091p1adbfcjsn47252db2d5db',
                  'X-RapidAPI-Host': 'nftpf-api-v0.p.rapidapi.com'
                },
                timeout: 30000
              });
              
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              
              const apiData = await response.json();
              console.log('🏛️ Direct Collection API Response:', apiData);
              
              // Transform the direct API response to match expected format
              const transformedData = {
                slug: apiData.slug || collectionSlug,
                name: apiData.name || strategy.collectionName,
                
                // Floor price data
                floor_price_eth: apiData.stats?.floorInfo?.currentFloorNative || 
                               apiData.stats?.currentFloorNative || 
                               apiData.floorPrice || 
                               apiData.floor_price_eth,
                               
                floor_price_usd: apiData.stats?.floorInfo?.currentFloorUsd || 
                               apiData.stats?.currentFloorUsd || 
                               apiData.floorPriceUsd || 
                               apiData.floor_price_usd,
                
                // Market cap data
                market_cap_usd: apiData.stats?.floorCapUsd || 
                              apiData.stats?.marketCapUsd || 
                              apiData.marketCap || 
                              apiData.market_cap_usd,
                              
                market_cap_eth: apiData.stats?.floorCapEth || 
                              apiData.stats?.marketCapEth || 
                              apiData.marketCapEth || 
                              apiData.market_cap_eth,
                
                // Holder data
                holders_count: apiData.stats?.totalOwners || 
                             apiData.stats?.holders || 
                             apiData.totalOwners || 
                             apiData.holders_count,
                
                // 24h price change with multiple fallbacks
                price_change_24h: apiData.stats?.floorTemporalityUsd?.diff24h ||
                                apiData.stats?.floortemporalityusd?.diff24h ||
                                apiData.stats?.floorInfo?.floorChange24h ||
                                apiData.floorTemporalityUsd?.diff24h ||
                                apiData.price_change_24h ||
                                apiData.priceChange24h,
                
                // Include the full floorTemporalityUsd object
                floorTemporalityUsd: apiData.stats?.floorTemporalityUsd || 
                                   apiData.stats?.floortemporalityusd || 
                                   apiData.floorTemporalityUsd,
                
                // Other useful data
                total_supply: apiData.stats?.totalSupply || apiData.totalSupply,
                listed_count: apiData.stats?.totalListed || apiData.totalListed,
                volume_24h_usd: apiData.stats?.salesTemporalityUsd?.volume?.val24h,
                
                // Debug data
                _debug: {
                  hasStats: !!apiData.stats,
                  statsKeys: apiData.stats ? Object.keys(apiData.stats) : [],
                  floorInfoKeys: apiData.stats?.floorInfo ? Object.keys(apiData.stats.floorInfo) : [],
                  rawFloorPrice: {
                    currentFloorNative: apiData.stats?.floorInfo?.currentFloorNative,
                    currentFloorUsd: apiData.stats?.floorInfo?.currentFloorUsd,
                    floorCapUsd: apiData.stats?.floorCapUsd
                  }
                }
              };
              
              console.log('🎯 Transformed collection data:', {
                name: transformedData.name,
                floor_price_eth: transformedData.floor_price_eth,
                floor_price_usd: transformedData.floor_price_usd,
                market_cap_usd: transformedData.market_cap_usd,
                holders_count: transformedData.holders_count,
                price_change_24h: transformedData.price_change_24h,
                hasValidFloorPrice: !!transformedData.floor_price_eth,
                hasValidMarketCap: !!transformedData.market_cap_usd,
                hasValidHolders: !!transformedData.holders_count
              });
              
              // Set the collection details
              setCollectionDetails(transformedData);
              console.log(`✅ Direct API: Collection details loaded for ${transformedData.name}`);
              
              setLoadingStates(prev => ({ ...prev, collection: false }));
              setErrorStates(prev => ({ ...prev, collection: null }));
              
            } catch (directApiError) {
              console.warn('⚠️ Direct API failed, trying service fallback:', directApiError.message);
              
              try {
                // Fallback to the original service method
                const result = await fetchCollectionDetails(collectionSlug);
                console.log('🏛️ Service Collection Details Result:', result);
                
                if (result.success && result.data) {
                  setCollectionDetails(result.data);
                  console.log(`✅ Service: Collection details loaded for ${result.collectionName}`);
                } else {
                  console.warn('⚠️ Service: No collection details available:', result.error);
                  setCollectionDetails(null);
                }
                
                setLoadingStates(prev => ({ ...prev, collection: false }));
                setErrorStates(prev => ({ ...prev, collection: result.success ? null : result.error }));
                
              } catch (serviceError) {
                console.error('❌ Both direct API and service failed:', serviceError);
                setCollectionDetails(null);
                setLoadingStates(prev => ({ ...prev, collection: false }));
                setErrorStates(prev => ({ ...prev, collection: 'Failed to load collection details. Some metrics may be unavailable.' }));
              }
            }
          })()
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
        // Use OpenSea slug if available, otherwise use the mapped slug
        const salesApiSlug = strategy.collectionOsSlug || collectionSlug;
        console.log(`📊 Fetching sales data with slug: ${salesApiSlug}`);
        dataPromises.push(
          fetch(`https://www.nftstrategy.fun/api/opensea/floor-price?collectionOsSlug=${salesApiSlug}&contractAddress=${strategy.collection || strategy.contractAddress}`)
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
        // Don't set loading to false here as it's already false
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
    // Get properly mapped collection slug for NFTPricefloor URL
    const mappedSlug = strategyToSlugMappingService.getSlugFromStrategyName(strategy.collectionName);
    const collectionSlug = strategy.collectionSlug || mappedSlug;

    return (
      <div className="space-y-6">
        {/* Strategy vs Collection Comparison Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Strategy vs Collection Comparison</h2>
          <p className="text-gray-600 dark:text-gray-400">Side-by-side comparison of NFT collection and strategy metrics</p>
          
          {errorStates.collection && (
            <div className="error-container">
              <div className="error-header">
                <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule={"evenodd"} />
                </svg>
                <div className="error-content">
                  <p className="error-message">{errorStates.collection}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="comparison-table-container">
            <div className="w-full">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>NFT Collection</th>
                  <th>Strategy Token</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="metric-label">Price</td>
                  <td>
                    {loadingStates.collection ? (
                      <div className="chart-loading" style={{padding: '8px 0'}}>
                        <div className="chart-loading-spinner" style={{width: '16px', height: '16px', marginBottom: '0', marginRight: '8px'}}></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <span className="font-medium">
                        {collectionDetails?.floor_price_eth ? 
                          `${parseFloat(collectionDetails.floor_price_eth).toFixed(2)} ETH` : 
                          <span className={isDark ? 'text-gray-400' : 'text-gray-400'}>N/A</span>
                        }
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="font-medium">{formatCurrencyWithDecimals(strategy.poolData?.price_usd, 4)}</span>
                  </td>
                </tr>
                <tr>
                  <td className="metric-label">24h Change</td>
                  <td>
                    {loadingStates.collection ? (
                      <div className="chart-loading" style={{padding: '8px 0'}}>
                        <div className="chart-loading-spinner" style={{width: '16px', height: '16px', marginBottom: '0', marginRight: '8px'}}></div>
                        <span>Loading...</span>
                      </div>
                    ) : (() => {
                      // Get 24h change data from floorTemporalityUsd.diff24h as requested
                      const diff24h = collectionDetails?.floorTemporalityUsd?.diff24h;
                      const priceChange24h = collectionDetails?.price_change_24h;
                      const finalValue = diff24h !== undefined && diff24h !== null ? diff24h : priceChange24h;
                      
                      return (
                        <span className={`font-medium ${
                          finalValue >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(finalValue)}
                        </span>
                      );
                    })()}
                  </td>
                  <td>
                    <span className={`font-medium ${
                      strategy.poolData?.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercentage(strategy.poolData?.price_change_24h)}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="metric-label">Market Cap</td>
                  <td>
                    {loadingStates.collection ? (
                      <div className="chart-loading" style={{padding: '8px 0'}}>
                        <div className="chart-loading-spinner" style={{width: '16px', height: '16px', marginBottom: '0', marginRight: '8px'}}></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <span className="font-medium">
                        {collectionDetails?.market_cap_usd ? 
                          formatMarketCap(collectionDetails.market_cap_usd) : 
                          <span className={isDark ? 'text-gray-400' : 'text-gray-400'}>N/A</span>
                        }
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="font-medium">{formatMarketCap(strategy.poolData?.market_cap_usd)}</span>
                  </td>
                </tr>
                <tr>
                  <td className="metric-label">Holders</td>
                  <td>
                    {loadingStates.collection ? (
                      <div className="chart-loading" style={{padding: '8px 0'}}>
                        <div className="chart-loading-spinner" style={{width: '16px', height: '16px', marginBottom: '0', marginRight: '8px'}}></div>
                        <span>Loading...</span>
                      </div>
                    ) : (
                      <span className="font-medium">
                        {collectionDetails?.holders_count ? 
                          formatNumber(collectionDetails.holders_count) : 
                          <span className={isDark ? 'text-gray-400' : 'text-gray-400'}>N/A</span>
                        }
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="font-medium">{formatNumber(strategy.totalHolders)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Key Metrics Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Floor Market Cap Ratio */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm lg:text-lg font-bold truncate">Floor Market Cap Ratio</h4>
              <div className="group relative flex-shrink-0 ml-2">
                <span className="text-gray-400 cursor-help">ℹ️</span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Ratio of strategy token market cap to NFT collection market cap
                </div>
              </div>
            </div>
            <div className="text-xl lg:text-3xl font-bold">
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
            <p className="text-xs lg:text-sm mt-1">Strategy vs NFT valuation</p>
          </div>

          {/* Burn Percentage */}
          <div className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm lg:text-lg font-bold truncate">Burn Percentage</h4>
              <div className="group relative flex-shrink-0 ml-2">
                <span className="text-gray-400 cursor-help">ℹ️</span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Percentage of tokens burned from total supply
                </div>
              </div>
            </div>
            <div className="text-xl lg:text-3xl font-bold">
              {strategy.burnPercentage && typeof strategy.burnPercentage === 'number' ? 
                `${strategy.burnPercentage.toFixed(2)}%` : 'N/A'
              }
            </div>
            <p className="text-xs lg:text-sm mt-1">Tokens removed from circulation</p>
          </div>

          {/* Holdings by Strategy */}
          <div className="metric-card sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm lg:text-lg font-bold truncate">Holdings by Strategy</h4>
              <div className="group relative flex-shrink-0 ml-2">
                <span className="text-gray-400 cursor-help">ℹ️</span>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                  Total number of NFT items held by this strategy
                </div>
              </div>
            </div>
            <div className="text-xl lg:text-3xl font-bold">
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
            <p className="text-xs lg:text-sm mt-1">Number of NFT items owned</p>
            <div className="mt-3">
              <button
                onClick={() => setActiveTab('holdings')}
                className="action-button"
              >
                View Holdings Details →
              </button>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Price Charts</h2>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* NFT Floor Price Chart */}
            <div className="chart-container min-h-[320px] sm:min-h-[400px]">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">NFT Floor Price</h3>
                  <p className="chart-subtitle">{strategy.collectionName}</p>
                </div>
                <div className="chart-powered-by">
                  <div className="chart-powered-label">Powered by</div>
                  <div className="chart-powered-source">NFTPriceFloor API</div>
                </div>
              </div>
              <div className="chart-body">
                {errorStates.nftPrice && (
                  <div className="error-container">
                    <div className="error-header">
                      <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="error-content">
                        <p className="error-message">{errorStates.nftPrice}</p>
                      </div>
                    </div>
                  </div>
                )}
                {loadingStates.nftPrice ? (
                  <div className="chart-loading">
                    <div className="chart-loading-spinner"></div>
                    <p>Loading NFT price data...</p>
                  </div>
                ) : nftPriceData && nftPriceData.length > 0 ? (() => {
                  console.log('🎨 Rendering TradingViewChart with data:', {
                    collectionName: strategy.collectionName,
                    dataLength: nftPriceData.length,
                    sampleData: nftPriceData.slice(0, 3),
                    firstPoint: nftPriceData[0],
                    lastPoint: nftPriceData[nftPriceData.length - 1]
                  });
                  
                  return (
                    <TradingViewChart
                      collections={[{
                        name: strategy.collectionName || 'NFT Collection',
                        data: nftPriceData
                      }]}
                      title={`${strategy.collectionName} Floor Price`}
                      height={320}
                    />
                  );
                })() : (
                  <div className="chart-empty">
                    <div className="chart-empty-icon">📊</div>
                    <h3 className="chart-empty-title">NFT Floor Price Data</h3>
                    <p className="chart-empty-subtitle">No chart data available</p>
                  </div>
                )}
                {/* NFTPricefloor Redirect Button */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => window.open(`https://nftpricefloor.com/${collectionSlug}`, '_blank')}
                    className="nft-pricefloor-button"
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
            <div className="chart-container min-h-[320px] sm:min-h-[400px]">
              <div className="chart-header">
                <div>
                  <h3 className="chart-title">Token Price</h3>
                  <p className="chart-subtitle">{strategy.tokenName}</p>
                </div>
                <div className="chart-powered-by">
                  <div className="chart-powered-label">Powered by</div>
                  <div className="chart-powered-source">DexScreener</div>
                </div>
              </div>
              <div className="chart-body">
                {errorStates.tokenPrice && (
                  <div className="error-container">
                    <div className="error-header">
                      <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <div className="error-content">
                        <p className="error-message">{errorStates.tokenPrice}</p>
                      </div>
                    </div>
                  </div>
                )}
                {loadingStates.tokenPrice ? (
                  <div className="chart-loading">
                    <div className="chart-loading-spinner"></div>
                    <p>Loading token price data...</p>
                  </div>
                ) : (
                  <DexScreenerChart
                    strategy={strategy}
                    tokenAddress={strategy.tokenAddress}
                    tokenName={strategy.tokenName}
                    theme={isDark ? "dark" : "light"}
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
      <div className="content-section">
        {errorStates.holdings && (
          <div className="error-container">
            <div className="error-header">
              <svg className="error-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="error-content">
                <h3 className="error-title">Holdings Data Error</h3>
                <p className="error-message">{errorStates.holdings}</p>
              </div>
            </div>
          </div>
        )}
        {loadingStates.holdings ? (
          <div className="card">
            <div className="card-body">
              <div className="chart-loading">
                <div className="chart-loading-spinner" style={{width: '48px', height: '48px'}}></div>
                <p style={{fontSize: '18px'}}>Loading holdings data...</p>
                <p style={{fontSize: '14px', color: '#9ca3af'}}>This may take a few moments</p>
              </div>
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
        <div className="chart-loading" style={{padding: '48px 0'}}>
          <div className="chart-loading-spinner"></div>
          <span>Loading sales data...</span>
        </div>
      );
    }

    if (errorStates.sales) {
      return (
        <div className="chart-empty" style={{padding: '48px 0'}}>
          <svg className="chart-empty-icon" style={{color: '#ef4444', width: '48px', height: '48px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="chart-empty-title">Error Loading Sales Data</h3>
          <p className="chart-empty-subtitle">{errorStates.sales}</p>
        </div>
      );
    }

    if (!salesData || salesData.length === 0) {
      return (
        <div className="chart-empty" style={{padding: '48px 0'}}>
          <svg className="chart-empty-icon" style={{color: '#9ca3af', width: '48px', height: '48px'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap={"round"} strokeLinejoin={"round"} strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="chart-empty-title">No Sales Data Available</h3>
          <p className="chart-empty-subtitle">No recent sales found for this collection.</p>
        </div>
      );
    }

    // Calculate summary data
    const totalSales = salesData.length;
    const floorPrice = salesData[0]?.priceEth || salesData[0]?.price || 0;
    const averagePrice = salesData.reduce((sum, item) => sum + (item.priceEth || item.price || 0), 0) / totalSales;

    return (
      <div className="content-section">
        {/* Sales Summary */}
        <div className="sales-summary-grid">
          <div className="metric-card">
            <p className="metric-description" style={{marginBottom: '4px'}}>Total Sales</p>
            <p className="metric-value">{totalSales}</p>
          </div>
          
          <div className="metric-card">
            <p className="metric-description" style={{marginBottom: '4px'}}>Floor Price</p>
            <p className="metric-value">{formatEth(floorPrice)}</p>
          </div>
          
          <div className="metric-card">
            <p className="metric-description" style={{marginBottom: '4px'}}>Average Price</p>
            <p className="metric-value">{formatEth(averagePrice)}</p>
          </div>
          
          <div className="metric-card">
            <p className="metric-description" style={{marginBottom: '4px'}}>Marketplace</p>
            <p className="metric-value">{salesData[0]?.marketplace || 'OpenSea'}</p>
          </div>
        </div>

        {/* Sales Grid */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Floor Price Data</h3>
            <span className="card-subtitle">{salesData.length} items</span>
          </div>
          <div className="card-body">
            <div className="sales-grid">
              {salesData.map((nft, index) => (
                <div 
                  key={`${nft.tokenId}-${index}`}
                  className="sales-item"
                >
                  {/* NFT Image */}
                  <div className="sales-item-image">
                    {nft.imageUrl ? (
                      <img
                        src={nft.imageUrl}
                        alt={nft.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    
                    {/* Fallback for missing/broken images */}
                    <div 
                      className="sales-item-fallback"
                      style={{ display: nft.imageUrl ? 'none' : 'flex' }}
                    >
                      <div className="sales-item-fallback-icon">🖼️</div>
                      <p className="sales-item-fallback-text">No Image</p>
                    </div>
                    
                    {/* Token ID Badge */}
                    <div className="sales-item-badge">
                      #{nft.tokenId}
                    </div>
                  </div>
                  
                  {/* NFT Details */}
                  <div className="sales-item-details">
                    <p className="sales-item-price-label">Current Price</p>
                    <p className="sales-item-price-value">{formatEth(nft.priceEth || nft.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Show skeleton during initial loading or when essential data is missing
  const showSkeleton = loading || (!strategy && !error);
  
  if (showSkeleton) return <StrategyDetailSkeleton />;
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
    <div className={`strategy-detail-container w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 pb-24 min-w-0 overflow-x-hidden ${isDark ? 'dark' : ''}`} style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))', backgroundColor: isDark ? '#000000' : '#FFF6FB' }}>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'holdings', label: 'Holdings' },
          { id: 'sales', label: 'Sales' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${
              activeTab === tab.id ? 'active' : ''
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