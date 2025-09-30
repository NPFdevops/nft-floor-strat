import React, { useState } from 'react';
import SkeletonTable from './SkeletonTable.jsx';
import StrategiesDataTable from './StrategiesDataTable.jsx';

const SkeletonDemo = () => {
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [forceLoading, setForceLoading] = useState(false);

  const toggleSkeleton = () => {
    setShowSkeleton(!showSkeleton);
  };

  const toggleForceLoading = () => {
    setForceLoading(!forceLoading);
  };

  // Create a modified StrategiesDataTable that can be forced into loading state
  const TestStrategiesDataTable = (props) => {
    const [originalLoading, setOriginalLoading] = useState(true);
    
    // Override the loading state if forceLoading is true
    React.useEffect(() => {
      if (!forceLoading) {
        // Allow normal loading behavior
        const timer = setTimeout(() => setOriginalLoading(false), 100);
        return () => clearTimeout(timer);
      } else {
        setOriginalLoading(true);
      }
    }, [forceLoading]);

    return <StrategiesDataTable {...props} />;
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Space Grotesk, sans-serif' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={toggleSkeleton}
          style={{
            padding: '10px 20px',
            backgroundColor: showSkeleton ? '#dc2626' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          {showSkeleton ? 'Hide Skeleton' : 'Show Skeleton'}
        </button>
        
        <button 
          onClick={toggleForceLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: forceLoading ? '#dc2626' : '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}
        >
          {forceLoading ? 'Stop Force Loading' : 'Force Loading State'}
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>
          {showSkeleton ? 'Skeleton Loading State' : 'Normal Table State'}
        </h3>
        <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
          {showSkeleton 
            ? 'This demonstrates the skeleton loading state with animated placeholders.'
            : forceLoading 
              ? 'The table is forced into loading state to show the skeleton.'
              : 'This shows the normal table with real data (if available).'
          }
        </p>
      </div>

      {showSkeleton ? (
        <SkeletonTable rows={10} />
      ) : (
        <TestStrategiesDataTable />
      )}
    </div>
  );
};

export default SkeletonDemo;