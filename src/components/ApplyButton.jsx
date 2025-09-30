import React from 'react';

const ApplyButton = ({ onApply, disabled = false, loading = false, timeframe = null, hasPendingChanges = false }) => {
  const handleClick = () => {
    // Add haptic feedback on mobile
    if (window.navigator && window.navigator.vibrate && !disabled && !loading) {
      window.navigator.vibrate(25);
    }
    onApply();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={`flex items-center justify-center px-4 sm:px-6 h-10 sm:h-10 text-xs sm:text-sm font-bold leading-normal border-2 border-black rounded-none transition-all duration-200 shadow-[4px_4px_0px_#000000] ${
        disabled || loading
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-[2px_2px_0px_#666666]'
          : hasPendingChanges
          ? 'bg-[var(--accent-color)] text-black hover:bg-opacity-80 hover:scale-105 active:scale-95'
          : 'bg-gray-300 text-gray-700 hover:bg-gray-400 hover:scale-105'
      }`}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        hasPendingChanges 
          ? (timeframe ? `Apply ${timeframe}` : 'Apply')
          : (timeframe ? `${timeframe} Applied` : 'Applied')
      )}
    </button>
  );
};

export default ApplyButton;
