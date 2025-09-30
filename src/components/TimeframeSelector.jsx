import React from 'react';
import './TradingViewChart.css';

const TimeframeSelector = ({ timeframe, onTimeframeChange }) => {
  const timeframes = [
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: '1Y', label: '1Y' },
    { value: 'YTD', label: 'YTD' }
  ];

  const handleClick = (value) => {
    // Add haptic feedback on mobile
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(1);
    }
    console.log('TimeframeSelector: Selected', value);
    onTimeframeChange(value);
  };

  return (
    <div className="mobile-timeframe-selector">
      {/* Mobile-first design - matching brutalist UI style */}
      <div className="block sm:hidden">
        <div className="flex flex-col gap-2 mb-4">
          <p className="text-sm font-bold text-black">Timeframe:</p>
          <div className="flex h-12 items-center rounded-none border-2 border-black p-0.5 bg-white shadow-[4px_4px_0px_#000000]">
            <div className="grid grid-cols-4 gap-0 w-full h-full">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  onClick={() => handleClick(tf.value)}
                  className={timeframe === tf.value 
                    ? 'flex h-full items-center justify-center overflow-hidden px-2 text-sm font-bold leading-normal transition-all duration-200 bg-[var(--accent-color)] text-black shadow-inner scale-95' 
                    : 'flex h-full items-center justify-center overflow-hidden px-2 text-sm font-bold leading-normal transition-all duration-200 bg-white text-black hover:bg-gray-100 hover:scale-105'
                  }
                >
                  <span className="truncate">{tf.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop version */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <p className="text-sm font-bold text-black whitespace-nowrap">Timeframe:</p>
        <div className="flex h-10 items-center rounded-none border-2 border-black p-0.5">
          {timeframes.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => handleClick(tf.value)}
              className={timeframe === tf.value 
                ? 'flex h-full items-center justify-center overflow-hidden px-2 sm:px-4 text-xs sm:text-sm font-bold leading-normal transition-all duration-200 bg-[var(--accent-color)] text-black shadow-inner scale-95' 
                : 'flex h-full items-center justify-center overflow-hidden px-2 sm:px-4 text-xs sm:text-sm font-bold leading-normal transition-all duration-200 bg-white text-black hover:bg-gray-100 hover:scale-105'
              }
            >
              <span className="truncate">{tf.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeframeSelector;
