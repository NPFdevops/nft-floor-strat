import React from 'react';
import TradingViewChart from './TradingViewChart';
import './TradingViewChart.css';

const ChartDisplay = ({ collection, collection2, title, loading, error, timeframe, onRangeChange, isComparison, layout }) => {
  // Chart colors matching TradingViewChart
  const chartColors = [
    '#e91e63', // Pink
    '#9c27b0', // Purple  
    '#673ab7', // Deep purple
    '#3f51b5'  // Indigo
  ];
  const renderLoadingState = () => (
    <div className="flex flex-col items-center justify-center h-full w-full gap-4" style={{ minHeight: '350px' }}>
      <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      <p className="text-black text-lg font-medium text-center px-6">Loading collection data...</p>
    </div>
  );

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center h-full w-full gap-4" style={{ minHeight: '350px' }}>
      <div className="text-gray-400 text-6xl">
        <span className="material-symbols-outlined text-6xl">search</span>
      </div>
      <p className="text-gray-600 text-lg font-medium text-center px-6">Select a collection to view its floor price chart</p>
    </div>
  );

  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center h-full w-full gap-4" style={{ minHeight: '350px' }}>
      <div className="text-red-500 text-6xl">
        <span className="material-symbols-outlined text-6xl">error</span>
      </div>
      <p className="text-red-600 text-lg font-medium text-center px-6">Try again, please</p>
      {error && (
        <p className="text-red-500 text-sm text-center px-6 opacity-75">{error}</p>
      )}
    </div>
  );

  const getFloorPrice = (collectionData = collection) => {
    if (!collectionData?.data || collectionData.data.length === 0) return null;
    const latestData = collectionData.data[collectionData.data.length - 1];
    return latestData?.floorEth || 0;
  };

  const getPriceChange = (collectionData = collection) => {
    if (!collectionData?.data || collectionData.data.length < 2) return null;
    const latestPrice = collectionData.data[collectionData.data.length - 1]?.floorEth || 0;
    const previousPrice = collectionData.data[0]?.floorEth || 0;
    if (previousPrice === 0) return null;
    return ((latestPrice - previousPrice) / previousPrice * 100);
  };

  // Handle comparison view (stacked layout with both collections)
  if (isComparison || (layout === 'stacked' && collection && collection2)) {
    const collections = [collection, collection2].filter(Boolean);
    
  return (
    <div className="flex flex-col h-full rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000]">
      <div className="flex flex-col border-b-2 border-black px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-black text-lg font-bold leading-normal">Floor Price Comparison: </span>
            {collections.map((coll, index) => {
              if (!coll?.name) return null;
              const color = chartColors[index] || chartColors[0];
              return (
                <span key={coll.name} className="flex items-center gap-1">
                  <div 
                    className="px-3 py-1 rounded text-lg font-bold leading-normal text-white"
                    style={{ backgroundColor: color }}
                  >
                    {coll.name}
                  </div>
                  {index < collections.length - 1 && (
                    <span className="text-black text-lg font-bold leading-normal mx-1">vs</span>
                  )}
                </span>
              );
            })}
          </div>
          <div className="flex gap-4 text-right">
            {collections.map((coll, index) => {
              const price = getFloorPrice(coll);
              const change = getPriceChange(coll);
              if (!price || !coll?.name) return null;
              const color = chartColors[index] || chartColors[0];
              
              return (
                <div key={coll.name} className="text-right">
                  <p className="text-sm font-bold" style={{ color: color }}>{coll.name}</p>
                  <p className="text-black text-base font-bold eth-price">{parseFloat(price).toFixed(2)} ETH</p>
                  {change !== null && (
                    <p className={`text-xs font-medium ${
                      change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <div className="flex flex-1">
        {loading ? (
          <div className="flex flex-1">{renderLoadingState()}</div>
        ) : error ? (
          <div className="flex flex-1">{renderErrorState()}</div>
        ) : collections.length === 0 ? (
          <div className="flex flex-1">{renderEmptyState()}</div>
        ) : collections.some(c => !c || !c.data || c.data.length === 0) ? (
          <div className="flex flex-1">{renderLoadingState()}</div>
        ) : (
          <div className="chart-canvas-container flex-1">
            <TradingViewChart
              collections={collections}
              title={title}
              onRangeChange={onRangeChange}
              height={450}
            />
          </div>
        )}
      </div>
    </div>
  );
  }

  // Handle individual collection view (side-by-side layout)
  const floorPrice = getFloorPrice();
  const priceChange = getPriceChange();

  return (
    <div className="flex flex-col h-full rounded-none border-2 border-black bg-white shadow-[8px_8px_0px_#000000]">
      <div className="flex flex-col border-b-2 border-black px-6 py-4 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div 
            className="px-3 py-1 rounded text-lg font-bold leading-normal text-white"
            style={{ backgroundColor: collection?.name ? chartColors[0] : '#000000' }}
          >
            {collection?.name || title}
          </div>
          {floorPrice && (
            <div className="text-right">
              <p className="text-black text-lg font-bold eth-price">{parseFloat(floorPrice).toFixed(2)} ETH</p>
              {priceChange !== null && (
                <p className={`text-sm font-medium ${
                  priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% ({timeframe})
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-1">
        {loading ? (
          <div className="flex flex-1">{renderLoadingState()}</div>
        ) : error ? (
          <div className="flex flex-1">{renderErrorState()}</div>
        ) : !collection ? (
          <div className="flex flex-1">{renderEmptyState()}</div>
        ) : !collection.data || collection.data.length === 0 ? (
          <div className="flex flex-1">{renderLoadingState()}</div>
        ) : (
          <div className="chart-canvas-container flex-1">
            <TradingViewChart
              collections={[collection]}
              title={title}
              onRangeChange={onRangeChange}
              height={420}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartDisplay;
