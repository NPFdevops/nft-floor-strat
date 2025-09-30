import React, { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries } from 'lightweight-charts';
import './TradingViewChart.css';
import logoImage from '../assets/NFTPriceFloor_logo.png';

const TradingViewChart = ({ 
  collections = [], 
  title = 'Floor Price Chart',
  onRangeChange,
  height = 400 
}) => {
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRefs = useRef([]);
  const [selectedRange, setSelectedRange] = useState('30D');

  const ranges = [
    { label: '7D', days: 7 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
    { label: '1Y', days: 365 }
  ];

  const colors = [
    { line: '#e91e63', top: '#e91e6320', bottom: '#e91e6308' }, // Pink gradient
    { line: '#9c27b0', top: '#9c27b020', bottom: '#9c27b008' }, // Purple gradient
    { line: '#673ab7', top: '#673ab720', bottom: '#673ab708' }, // Deep purple gradient
    { line: '#3f51b5', top: '#3f51b520', bottom: '#3f51b508' }  // Indigo gradient
  ];

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      try {
        chartRef.current.remove();
      } catch (e) {
        // Chart already disposed, ignore
      }
      chartRef.current = null;
    }

    // Use setTimeout to ensure DOM is fully ready
    const timer = setTimeout(() => {
      if (!chartContainerRef.current) return;
      
      // Ensure container has proper dimensions
      const containerWidth = chartContainerRef.current.clientWidth || 600;
      const containerHeight = height || 400;
      
      // Create chart following latest documentation
      const chart = createChart(chartContainerRef.current, {
        layout: {
          background: { type: 'solid', color: 'white' },
          textColor: '#666666',
        },
        width: containerWidth,
        height: containerHeight,
        grid: {
          vertLines: {
            visible: false,
          },
          horzLines: {
            color: '#f0f0f0',
            style: 1,
          },
        },
        rightPriceScale: {
          borderVisible: false,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          // Format price scale to show ETH suffix
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        },
        timeScale: {
          borderVisible: false,
          timeVisible: true,
          secondsVisible: false,
          // Disable interaction to keep chart static
          rightBarStaysOnScroll: true,
          lockVisibleTimeRangeOnResize: true,
        },
        // Disable interactions to make chart static
        handleScroll: {
          mouseWheel: false,
          pressedMouseMove: false,
          horzTouchDrag: false,
          vertTouchDrag: false,
        },
        handleScale: {
          mouseWheel: false,
          pinch: false,
          axisPressedMouseMove: false,
          axisDoubleClickReset: false,
        },
        watermark: {
          visible: false, // Disable text watermark since we'll use image overlay
        },
      });


    chartRef.current = chart;
    seriesRefs.current = [];

    // Add line series for each collection
    collections.forEach((collection, index) => {
      if (collection && collection.data && Array.isArray(collection.data) && collection.data.length > 0) {
        try {
          // Use v5.0 API with AreaSeries type for gradient fill
          const colorConfig = colors[index] || colors[0];
          const areaSeries = chart.addSeries(AreaSeries, {
            lineColor: colorConfig.line,
            topColor: colorConfig.top,
            bottomColor: colorConfig.bottom,
            lineWidth: 2,
            priceLineVisible: false, // Hide price line for cleaner look
          });

        // Convert data format for TradingView Lightweight Charts
        // Data format: [{ time: '2018-12-22', value: 32.51 }, ...]
        const chartData = collection.data
          .filter(point => {
            return point && 
                   point.x && 
                   point.y !== undefined && 
                   point.y !== null && 
                   !isNaN(point.y) && 
                   point.y > 0;
          })
          .map(point => {
            try {
              // Convert to YYYY-MM-DD format as required by TradingView
              const date = point.x instanceof Date ? point.x : new Date(point.x);
              if (isNaN(date.getTime())) {
                console.warn('Invalid date:', point.x);
                return null;
              }
              const time = date.toISOString().split('T')[0]; // YYYY-MM-DD format
              const value = parseFloat(point.y);
              return { time, value };
            } catch (error) {
              console.warn('Error processing data point:', point, error);
              return null;
            }
          })
          .filter(point => point !== null && point.value > 0)
          .sort((a, b) => new Date(a.time) - new Date(b.time));

        if (chartData.length > 0) {
          areaSeries.setData(chartData);
          seriesRefs.current[index] = areaSeries;
          
          // Add custom tooltip formatting
          areaSeries.applyOptions({
            priceFormat: {
              type: 'custom',
              formatter: (price) => {
                return `${parseFloat(price).toFixed(2)} ETH`;
              },
            },
          });
        }
        } catch (error) {
          console.error('Error creating line series:', error);
        }
      }
    });

    // Fit content to show all data
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize);
        if (chartRef.current) {
          try {
            chartRef.current.remove();
          } catch (e) {
            // Chart already disposed, ignore
          }
          chartRef.current = null;
        }
        seriesRefs.current = [];
      };
    }, 100); // 100ms delay to ensure DOM is ready

    // Cleanup timeout on unmount
    return () => {
      clearTimeout(timer);
    };
  }, [collections, height]);

  const handleRangeClick = (range) => {
    setSelectedRange(range.label);
    if (onRangeChange) {
      onRangeChange(range.days);
    }
  };

  // Show placeholder if no valid data
  if (!collections || collections.length === 0 || !collections.some(c => c && c.data && c.data.length > 0)) {
    return (
      <div className="trading-view-chart-container">
        <div className="chart-placeholder" style={{ height: `${height}px` }}>
          <div className="placeholder-content">
            <p>No data to display</p>
            <span>Select collections to see their floor price charts</span>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="trading-view-chart-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div 
        ref={chartContainerRef} 
        className="chart-container"
        style={{ 
          width: '100%', 
          height: `${height}px`,
          minHeight: `${height}px`
        }}
      />
      {/* Logo Watermark Overlay */}
      <div 
        className="chart-logo-watermark"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: 0.5,
          pointerEvents: 'none',
          zIndex: 1,
          userSelect: 'none'
        }}
      >
        <img 
          src={logoImage} 
          alt="NFT Price Floor" 
          style={{
            height: '60px',
            width: 'auto',
            opacity: 0.5
          }}
        />
      </div>
    </div>
  );
};

export default TradingViewChart;
