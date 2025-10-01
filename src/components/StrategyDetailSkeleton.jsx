import React from 'react';

const SkeletonLine = ({ width = '100%', height = '1rem' }) => (
  <div 
    className="bg-gray-200 rounded animate-pulse" 
    style={{ width, height }}
  />
);

const SkeletonBox = ({ className = '', children }) => (
  <div className={`rounded-none border-2 border-gray-200 bg-gray-50 shadow-[4px_4px_0px_#e5e7eb] ${className}`}>
    {children}
  </div>
);

const ComparisonTableSkeleton = () => (
  <SkeletonBox className="overflow-visible">
    <div className="border-b-2 border-gray-200 px-6 py-4 bg-gray-100">
      <SkeletonLine width="300px" height="1.5rem" />
      <div className="mt-2">
        <SkeletonLine width="400px" height="0.875rem" />
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b-2 border-gray-200 bg-gray-100">
            <th className="text-left py-4 px-6">
              <SkeletonLine width="60px" height="1rem" />
            </th>
            <th className="text-left py-4 px-6">
              <SkeletonLine width="120px" height="1rem" />
            </th>
            <th className="text-left py-4 px-6">
              <SkeletonLine width="120px" height="1rem" />
            </th>
          </tr>
        </thead>
        <tbody>
          {[1, 2, 3, 4].map((row) => (
            <tr key={row} className="border-b border-gray-100">
              <td className="py-4 px-6">
                <SkeletonLine width="100px" height="1rem" />
              </td>
              <td className="py-4 px-6">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300 mr-2"></div>
                  <SkeletonLine width="80px" height="1rem" />
                </div>
              </td>
              <td className="py-4 px-6">
                <SkeletonLine width="90px" height="1rem" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </SkeletonBox>
);

const MetricCardSkeleton = ({ title }) => (
  <SkeletonBox className="p-4 lg:p-6">
    <div className="flex items-center justify-between mb-2">
      <SkeletonLine width="160px" height="1.125rem" />
      <div className="flex-shrink-0 ml-2">
        <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
    <div className="mb-2">
      <SkeletonLine width="80px" height="2rem" />
    </div>
    <SkeletonLine width="140px" height="0.875rem" />
    {title === 'Holdings by Strategy' && (
      <div className="mt-3">
        <div className="w-full px-3 lg:px-4 py-2 bg-gray-200 rounded animate-pulse min-h-[44px]"></div>
      </div>
    )}
  </SkeletonBox>
);

const ChartSkeleton = ({ title, subtitle }) => (
  <SkeletonBox className="min-h-[320px] sm:min-h-[400px]">
    <div className="border-b-2 border-gray-200 px-6 py-4 bg-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <SkeletonLine width="150px" height="1.125rem" />
          <div className="mt-1">
            <SkeletonLine width="120px" height="0.875rem" />
          </div>
        </div>
        <div className="text-right">
          <div className="mb-1">
            <SkeletonLine width="80px" height="0.75rem" />
          </div>
          <SkeletonLine width="100px" height="0.875rem" />
        </div>
      </div>
    </div>
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-center h-72 sm:h-80">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400 mx-auto mb-4"></div>
          <SkeletonLine width="160px" height="1rem" className="mx-auto" />
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="w-full px-4 py-3 bg-gray-200 rounded animate-pulse min-h-[44px]"></div>
      </div>
    </div>
  </SkeletonBox>
);

const StrategyDetailSkeleton = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 py-8 pb-24" style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Tab Navigation */}
      <div className="flex items-center gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
        {['Overview', 'Holdings', 'Sales'].map((tab, index) => (
          <div
            key={tab}
            className={`px-4 py-3 rounded-md text-sm font-medium transition-all inline-flex min-h-[44px] items-center ${
              index === 0 ? 'bg-white text-black shadow-sm' : 'text-gray-400'
            }`}
          >
            <SkeletonLine width="60px" height="1rem" />
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Comparative Table */}
        <ComparisonTableSkeleton />

        {/* Key Metrics Display */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          <MetricCardSkeleton title="Floor Market Cap Ratio" />
          <MetricCardSkeleton title="Burn Percentage" />
          <MetricCardSkeleton title="Holdings by Strategy" />
        </div>

        {/* Charts Section */}
        <div className="space-y-6">
          <div>
            <SkeletonLine width="120px" height="2rem" />
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* NFT Floor Price Chart */}
            <ChartSkeleton title="NFT Floor Price" subtitle="Collection Name" />
            
            {/* Token Price Chart */}
            <ChartSkeleton title="Token Price" subtitle="Token Name" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyDetailSkeleton;