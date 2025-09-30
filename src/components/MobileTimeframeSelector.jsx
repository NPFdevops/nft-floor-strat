import React from 'react';

const MobileTimeframeSelector = ({ timeframe, onTimeframeChange }) => {
  const timeframes = [
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: '1Y', label: '1Y' },
    { value: 'YTD', label: 'YTD' }
  ];

  const handleClick = (value) => {
    // Add haptic feedback on iOS
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(1);
    }
    onTimeframeChange(value);
  };

  return (
    <div className="mobile-timeframe-selector">
      {/* Mobile-first design */}
      <div className="block sm:hidden">
        <div className="flex flex-col gap-2 mb-4">
          <label className="text-sm font-semibold text-gray-900 px-1">Timeframe</label>
          <div className="bg-gray-100 rounded-xl p-1">
            <div className="grid grid-cols-4 gap-1">
              {timeframes.map((tf) => (
                <button
                  key={tf.value}
                  type="button"
                  onClick={() => handleClick(tf.value)}
                  className={`
                    relative px-3 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ease-out
                    ${timeframe === tf.value 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 active:bg-gray-200'
                    }
                  `}
                  style={{
                    // Apple-style pressed state
                    transform: timeframe === tf.value ? 'scale(0.98)' : 'scale(1)',
                  }}
                >
                  <span className="relative z-10">{tf.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop version (unchanged) */}
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

export default MobileTimeframeSelector;
