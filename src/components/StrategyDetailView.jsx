import React, { useState, useEffect } from 'react';
import TradingViewChart from './TradingViewChart';
import DextoolsChart from './DextoolsChart';
import { nftStrategyService } from '../services/nftStrategyService';
import { fetchFloorPriceHistory } from '../services/nftAPI';
import { getDefaultDateRange, dateToTimestamp, getOptimalGranularity } from '../utils/dateUtils';

const StrategyDetailView = ({ strategy, onBack }) => {
  const [nftPriceData, setNftPriceData] = useState(null);
  const [tokenPriceData, setTokenPriceData] = useState(null);
  const [holdingsData, setHoldingsData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchDetailedData = async () => {
      try {
        console.log('🔍 StrategyDetailView: Starting to fetch detailed data for strategy:', strategy);
        setLoading(true);
        setError(null);

        // Fetch NFT floor price history with enhanced configuration
        const defaultRange = getDefaultDateRange();
        const startTimestamp = dateToTimestamp(defaultRange.startDate);
        const endTimestamp = dateToTimestamp(defaultRange.endDate);
        const granularity = getOptimalGranularity(defaultRange.startDate, defaultRange.endDate);

        // Use collection slug or derive from collection name
        const collectionSlug = strategy.collectionSlug || 
          strategy.collectionName?.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');

        console.log(`📊 Fetching NFT floor price data for: ${collectionSlug}`);

        const nftResult = await fetchFloorPriceHistory(
          collectionSlug,
          granularity,
          startTimestamp,
          endTimestamp,
          '30d'
        );

        console.log('📈 NFT API Result:', nftResult);

        if (nftResult.success && nftResult.data) {
          // Transform the API data to match TradingViewChart format
          const transformedData = nftResult.data.map(point => ({
            x: new Date(point.timestamp * 1000), // Convert timestamp to Date
            y: parseFloat(point.floorEth || point.price || 0) // Use floorEth or fallback to price
          })).filter(point => point.y > 0); // Filter out invalid data points

          setNftPriceData(transformedData);
          console.log(`✅ Transformed ${transformedData.length} NFT price data points`);
        } else {
          console.warn('⚠️ No NFT price data available or API call failed:', nftResult.error);
          setNftPriceData([]);
        }

        // Fetch token price data (mock for now - would need actual API)
        const tokenPriceResult = await nftStrategyService.getTokenPriceHistory(strategy.tokenAddress);
        setTokenPriceData(tokenPriceResult);

        // Fetch current holdings breakdown
        const holdingsResult = await nftStrategyService.getHoldingsBreakdown(strategy.tokenAddress);
        setHoldingsData(holdingsResult);

        // Fetch historical sales data
        const salesResult = await nftStrategyService.getHistoricalSales(strategy.collectionSlug || strategy.collectionName);
        setSalesData(salesResult);

        console.log('✅ StrategyDetailView: Successfully fetched all detailed data');

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

  const formatNumber = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US').format(value);
  };

  const formatPercentage = (value) => {
    if (value === null || value === undefined) return 'N/A';
    
    // Convert to number if it's a string
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    // Check if it's a valid number
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

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Strategy Overview and Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Strategy Overview Card */}
        <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] p-6">
          <h3 className="text-xl font-bold text-black mb-4">Strategy Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Collection:</span>
              <span className="font-medium">{strategy.collectionName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Token:</span>
              <span className="font-medium">{strategy.tokenName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Token Price:</span>
              <span className="font-medium">{formatCurrency(strategy.poolData?.price_usd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Market Cap:</span>
              <span className="font-medium">{formatCurrency(strategy.poolData?.market_cap_usd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">24h Volume:</span>
              <span className="font-medium">{formatCurrency(strategy.poolData?.volume_24h_usd)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">24h Change:</span>
              <span className={`font-medium ${strategy.poolData?.price_change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(strategy.poolData?.price_change_24h)}
              </span>
            </div>
          </div>
        </div>

        {/* Key Metrics Card */}
        <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] p-6">
          <h3 className="text-xl font-bold text-black mb-4">Key Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Floor Market Cap Ratio:</span>
              <span className="font-medium">{strategy.floorMarketCap && typeof strategy.floorMarketCap === 'number' ? strategy.floorMarketCap.toFixed(2) : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Burn Percentage:</span>
              <span className="font-medium">{strategy.burnPercentage && typeof strategy.burnPercentage === 'number' ? `${strategy.burnPercentage.toFixed(2)}%` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Holders:</span>
              <span className="font-medium">{formatNumber(strategy.totalHolders)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">NFT Floor Price:</span>
              <span className="font-medium">{strategy.nftPriceFloorMarketCap ? formatCurrency(strategy.nftPriceFloorMarketCap) : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Strategy Market Cap:</span>
              <span className="font-medium">{formatCurrency(strategy.nftStrategyMarketCap)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-black">Price Charts</h2>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* NFT Floor Price Chart */}
          <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] min-h-[400px]">
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
            <div className="p-6">
              {nftPriceData && nftPriceData.length > 0 ? (
                <TradingViewChart
                  collections={[{
                    name: strategy.collectionName || 'NFT Collection',
                    data: nftPriceData // Data is already in the correct format from the API transformation
                  }]}
                  title={`${strategy.collectionName} Floor Price`}
                  height={320}
                />
              ) : (
                <div className="flex items-center justify-center h-80">
                  <div className="text-center">
                    <div className="text-gray-400 text-5xl mb-3">📊</div>
                    <p className="text-gray-600 font-medium text-lg">NFT Floor Price Data</p>
                    <p className="text-gray-400 text-sm mt-1">Loading chart data...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Token Price Chart - Dextools Integration */}
          <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] min-h-[400px]">
            <div className="border-b-2 border-black px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-black">Token Price</h3>
                  <p className="text-sm text-gray-600">{strategy.tokenName}</p>
                  {strategy.tokenAddress && (
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {strategy.tokenAddress.slice(0, 8)}...{strategy.tokenAddress.slice(-6)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Powered by</div>
                  <div className="text-sm font-medium text-black">Dextools</div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <DextoolsChart
                tokenAddress={strategy.tokenAddress}
                tokenName={strategy.tokenName || 'Token'}
                height={320}
                theme="light"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );



  const renderHoldingsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Current Holdings */}
      <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] p-6">
        <h3 className="text-xl font-bold text-black mb-4">Current NFT Holdings</h3>
        {holdingsData && holdingsData.length > 0 ? (
          <div className="space-y-3">
            {holdingsData.map((holding, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{holding.tokenId}</p>
                  <p className="text-sm text-gray-600">{holding.rarity || 'Common'}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(holding.estimatedValue)}</p>
                  <p className="text-sm text-gray-600">{holding.acquisitionDate}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No holdings data available</p>
        )}
      </div>

      {/* Holdings Summary */}
      <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] p-6">
        <h3 className="text-xl font-bold text-black mb-4">Holdings Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Total NFTs Held:</span>
            <span className="font-medium">{holdingsData ? holdingsData.length : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Value:</span>
            <span className="font-medium">
              {holdingsData ? formatCurrency(holdingsData.reduce((sum, h) => sum + (h.estimatedValue || 0), 0)) : 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Average Value:</span>
            <span className="font-medium">
              {holdingsData && holdingsData.length > 0 ? 
                formatCurrency(holdingsData.reduce((sum, h) => sum + (h.estimatedValue || 0), 0) / holdingsData.length) : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSalesTab = () => (
    <div className="rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000] p-6">
      <h3 className="text-xl font-bold text-black mb-4">Historical NFT Sales</h3>
      {salesData && salesData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-3 px-4 font-bold">Token ID</th>
                <th className="text-left py-3 px-4 font-bold">Sale Price</th>
                <th className="text-left py-3 px-4 font-bold">Date</th>
                <th className="text-left py-3 px-4 font-bold">Buyer</th>
                <th className="text-left py-3 px-4 font-bold">Marketplace</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((sale, index) => (
                <tr key={index} className="border-b border-gray-200">
                  <td className="py-3 px-4">{sale.tokenId}</td>
                  <td className="py-3 px-4 font-medium">{formatCurrency(sale.price)}</td>
                  <td className="py-3 px-4">{new Date(sale.date).toLocaleDateString()}</td>
                  <td className="py-3 px-4 font-mono text-sm">{sale.buyer?.slice(0, 8)}...</td>
                  <td className="py-3 px-4">{sale.marketplace}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No sales data available</p>
      )}
    </div>
  );

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
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 py-8">

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'holdings', label: 'Holdings' },
          { id: 'sales', label: 'Sales History' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
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