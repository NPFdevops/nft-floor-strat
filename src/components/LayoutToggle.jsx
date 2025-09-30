import React from 'react';

const LayoutToggle = ({ layout, onLayoutChange }) => {
  const handleLayoutChange = (newLayout) => {
    // Add haptic feedback on mobile
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(1);
    }
    onLayoutChange(newLayout);
  };

  return (
    <div className="layout-toggle-container">
      {/* Mobile-first design */}
      <div className="block sm:hidden">
        <div className="flex flex-col gap-2 mb-4">
          <p className="text-sm font-bold text-black">Layout:</p>
          <div className="flex h-12 items-center rounded-none border-2 border-black p-0.5 bg-white shadow-[4px_4px_0px_#000000]">
            <label className={`flex cursor-pointer h-full flex-1 items-center justify-center overflow-hidden px-2 text-sm font-bold leading-normal transition-all duration-200 ${
              layout === 'horizontal' 
                ? 'bg-[var(--accent-color)] text-black shadow-inner scale-95' 
                : 'bg-white text-black hover:bg-gray-100 hover:scale-105'
            }`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">view_column</span>
                <span className="truncate">Side by side</span>
              </div>
              <input 
                className="invisible w-0" 
                name="layout-mobile" 
                type="radio" 
                value="horizontal"
                checked={layout === 'horizontal'}
                onChange={() => handleLayoutChange('horizontal')}
              />
            </label>
            <label className={`flex cursor-pointer h-full flex-1 items-center justify-center overflow-hidden px-2 text-sm font-bold leading-normal transition-all duration-200 ${
              layout === 'vertical' 
                ? 'bg-[var(--accent-color)] text-black shadow-inner scale-95' 
                : 'bg-white text-black hover:bg-gray-100 hover:scale-105'
            }`}>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">view_agenda</span>
                <span className="truncate">Stacked</span>
              </div>
              <input 
                className="invisible w-0" 
                name="layout-mobile" 
                type="radio" 
                value="vertical"
                checked={layout === 'vertical'}
                onChange={() => handleLayoutChange('vertical')}
              />
            </label>
          </div>
        </div>
      </div>

      {/* Desktop version */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <p className="text-sm font-bold text-black whitespace-nowrap">Layout:</p>
        <div className="flex h-10 items-center rounded-none border-2 border-black p-0.5 bg-white shadow-[4px_4px_0px_#000000]">
          <label className={`flex cursor-pointer h-full w-28 items-center justify-center overflow-hidden px-2 text-xs sm:text-sm font-bold leading-normal transition-all duration-200 ${
            layout === 'horizontal' 
              ? 'bg-[var(--accent-color)] text-black shadow-inner scale-95' 
              : 'bg-white text-black hover:bg-gray-100 hover:scale-105'
          }`}>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">view_column</span>
              <span className="truncate hidden sm:inline">Side by side</span>
            </div>
            <input 
              className="invisible w-0" 
              name="layout-desktop" 
              type="radio" 
              value="horizontal"
              checked={layout === 'horizontal'}
              onChange={() => handleLayoutChange('horizontal')}
            />
          </label>
          <label className={`flex cursor-pointer h-full w-28 items-center justify-center overflow-hidden px-2 text-xs sm:text-sm font-bold leading-normal transition-all duration-200 ${
            layout === 'vertical' 
              ? 'bg-[var(--accent-color)] text-black shadow-inner scale-95' 
              : 'bg-white text-black hover:bg-gray-100 hover:scale-105'
          }`}>
            <div className="flex items-center gap-1">
              <span className="material-symbols-outlined text-base">view_agenda</span>
              <span className="truncate hidden sm:inline">Stacked</span>
            </div>
            <input 
              className="invisible w-0" 
              name="layout-desktop" 
              type="radio" 
              value="vertical"
              checked={layout === 'vertical'}
              onChange={() => handleLayoutChange('vertical')}
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default LayoutToggle;
