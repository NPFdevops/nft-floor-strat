import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const InfoCards = ({ strategies = [] }) => {
  const { isDark } = useTheme();
  
  // Calculate total market cap from all strategies
  const totalMarketCap = strategies.reduce((sum, strategy) => {
    const marketCap = parseFloat(strategy.poolData?.market_cap_usd) || 0;
    return sum + (isNaN(marketCap) ? 0 : marketCap);
  }, 0);

  // Count live strategies
  const liveStrategiesCount = strategies.length;

  // Calculate Punkstrategy dominance
  const punkstrategies = strategies.filter(strategy => 
    strategy.collectionName?.toLowerCase().includes('punk') ||
    strategy.name?.toLowerCase().includes('punk')
  );
  
  const punkMarketCap = punkstrategies.reduce((sum, strategy) => {
    const marketCap = parseFloat(strategy.poolData?.market_cap_usd) || 0;
    return sum + (isNaN(marketCap) ? 0 : marketCap);
  }, 0);

  const punkDominancePercentage = totalMarketCap > 0 ? (punkMarketCap / totalMarketCap) * 100 : 0;

  // Format currency values
  const formatCurrency = (value) => {
    const numValue = parseFloat(value);
    if (!numValue || numValue === 0 || isNaN(numValue)) return '$0';
    
    if (numValue >= 1e9) {
      return `$${(numValue / 1e9).toFixed(2)}B`;
    } else if (numValue >= 1e6) {
      return `$${(numValue / 1e6).toFixed(2)}M`;
    } else if (numValue >= 1e3) {
      return `$${(numValue / 1e3).toFixed(2)}K`;
    } else {
      return `$${numValue.toFixed(2)}`;
    }
  };

  // Format percentage values
  const formatPercentage = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0.0%';
    return `${numValue.toFixed(1)}%`;
  };

  const cards = [
    {
      id: 'market-cap',
      title: 'Total Market Cap',
      value: formatCurrency(totalMarketCap),
      subtitle: 'Combined value',
      bgColor: isDark ? 'bg-black' : 'bg-gradient-to-br from-pink-50 to-rose-50',
      borderColor: isDark ? 'border-white border-2' : 'border-black border-2',
      textColor: isDark ? 'text-pink-400' : 'text-pink-600',
      valueColor: isDark ? 'text-pink-300' : 'text-pink-700'
    },
    {
      id: 'live-strategies',
      title: 'Live Strategies',
      value: liveStrategiesCount.toString(),
      subtitle: 'Active strategies',
      bgColor: isDark ? 'bg-black' : 'bg-gradient-to-br from-pink-50 to-pink-100',
      borderColor: isDark ? 'border-white border-2' : 'border-black border-2',
      textColor: isDark ? 'text-pink-400' : 'text-pink-700',
      valueColor: isDark ? 'text-pink-300' : 'text-pink-800'
    },
    {
      id: 'punk-dominance',
      title: 'Punk Dominance',
      value: formatPercentage(punkDominancePercentage),
      subtitle: punkstrategies.length > 0 ? `${punkstrategies.length} strategies` : 'No punk strategies',
      bgColor: isDark ? 'bg-black' : 'bg-gradient-to-br from-rose-50 to-pink-50',
      borderColor: isDark ? 'border-white border-2' : 'border-black border-2',
      textColor: isDark ? 'text-rose-400' : 'text-rose-600',
      valueColor: isDark ? 'text-rose-300' : 'text-rose-700'
    }
  ];

  return (
    <div className="mb-6">
      {/* Desktop and Tablet: Grid Layout */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`${card.bgColor} ${card.borderColor} rounded-lg p-3 lg:p-4 transition-all duration-200 hover:shadow-md hover:scale-[1.02]`}
          >
            <div className="text-center">
              <h3 className={`text-xs lg:text-sm font-semibold ${card.textColor} mb-1 uppercase tracking-wide`}>
                {card.title}
              </h3>
              <p className={`text-lg lg:text-xl font-bold ${card.valueColor} mb-1`}>
                {card.value}
              </p>
              {/* <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {card.subtitle}
              </p> */}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: Horizontal Scrolling Layout */}
      <div className="sm:hidden">
        <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`${card.bgColor} ${card.borderColor} rounded-lg p-3 flex-shrink-0 w-36 transition-all duration-200 active:scale-95`}
              style={{ minWidth: '144px' }} // Ensure consistent width
            >
              <div className="text-center">
                <h3 className={`text-xs font-semibold ${card.textColor} mb-1 uppercase tracking-wide`}>
                  {card.title}
                </h3>
                <p className={`text-base font-bold ${card.valueColor} mb-1`}>
                  {card.value}
                </p>
                {/* <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} leading-tight`}>
                  {card.subtitle}
                </p> */}
              </div>
            </div>
          ))}
        </div>
        
        {/* Scroll indicator dots for mobile */}
        <div className="flex justify-center mt-2 gap-1">
          {cards.map((_, index) => (
            <div
              key={index}
              className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-pink-200'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InfoCards;