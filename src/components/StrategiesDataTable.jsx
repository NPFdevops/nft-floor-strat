import React, { useState, useEffect, useMemo } from 'react';
import './StrategiesDataTable.css';
import { nftStrategyService } from '../services/nftStrategyService.js';
import { fetchTopCollections } from '../services/nftAPI.js';
import { holdingsService } from '../services/holdingsService.js';
import SkeletonTable from './SkeletonTable.jsx';
import { posthogService } from '../services/posthogService';

const StrategiesDataTable = ({ onStrategySelect, onStrategiesUpdate }) => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'nftStrategyMarketCap', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from API with retry mechanism
  useEffect(() => {
    const fetchStrategies = async (retryCount = 0) => {
      const maxRetries = 3;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log(`🔄 Fetching strategies from API... (attempt ${retryCount + 1}/${maxRetries + 1})`);
        
        // Use the nftStrategyService which handles environment-specific URLs
        const data = await nftStrategyService.fetchStrategies();
        console.log('✅ Successfully fetched strategies data:', data.length, 'strategies');
        
        // Enhance data with additional API calls for burn percentage and holders
        const enhancedData = await nftStrategyService.enhanceStrategiesData(data);
        
        // Add market cap coefficient calculation
        // OPTIMIZATION: Fetch all collections once instead of making individual API calls for each strategy
        let allCollections = [];
        try {
          console.log('🔄 Fetching all collections data once for market cap calculations...');
          const collectionsData = await fetchTopCollections();
          allCollections = collectionsData.collections || [];
          console.log(`✅ Fetched ${allCollections.length} collections for market cap matching`);
        } catch (err) {
          console.warn('Failed to fetch collections data for market cap calculations:', err);
        }

        // Enhance data with holdings count for each strategy
        const finalData = await Promise.all(enhancedData.map(async (strategy) => {
          try {
            // Get market cap from NFTpricefloor API using the pre-fetched collections data
            let nftPriceFloorMarketCap = null;
            
            if (allCollections.length > 0) {
              const project = allCollections.find(p => 
                p.name.toLowerCase().includes(strategy.collectionName.toLowerCase()) ||
                strategy.collectionName.toLowerCase().includes(p.name.toLowerCase())
              );
              if (project && project.marketCap) {
                nftPriceFloorMarketCap = project.marketCap;
              }
            }
            
            // Calculate Floor Market Cap Ratio as (Strategy Market Cap / NFT Market Cap) * 100
            // This matches the logic in StrategyDetailView.jsx
            const nftStrategyMarketCap = strategy.poolData?.market_cap_usd;
            console.log(`📊 Market Cap calculation for ${strategy.name}:`);
            console.log(`  - NFTpricefloor Market Cap: ${nftPriceFloorMarketCap}`);
            console.log(`  - nftstrategy Market Cap: ${nftStrategyMarketCap}`);
            
            const floorMarketCapRatio = (nftStrategyMarketCap && nftPriceFloorMarketCap && nftPriceFloorMarketCap > 0) ? 
              (nftStrategyMarketCap / nftPriceFloorMarketCap) * 100 : null;
            

            
            // Fetch holdings count for this strategy
            let holdingsCount = 0;
            try {
              console.log(`🔄 Fetching holdings for strategy: ${strategy.name}`);
              const strategyAddress = strategy.tokenAddress;
              const nftAddress = strategy.collection || strategy.contractAddress;
              
              if (strategyAddress && nftAddress) {
                const holdings = await holdingsService.fetchHoldings(strategyAddress, nftAddress);
                holdingsCount = holdings?.length || 0;
                console.log(`✅ Holdings count for ${strategy.name}: ${holdingsCount}`);
              } else {
                console.warn(`Missing required addresses for strategy ${strategy.name}:`, { strategyAddress, nftAddress });
                holdingsCount = 0;
              }
            } catch (holdingsErr) {
              console.warn(`Failed to fetch holdings for strategy ${strategy.name}:`, holdingsErr);
              holdingsCount = 0;
            }
            
            return {
              ...strategy,
              nftPriceFloorMarketCap,
              nftStrategyMarketCap,
              floorMarketCapRatio,
              holdingsCount
            };
          } catch (err) {
            console.warn('Failed to add market cap coefficient:', err);
            return {
              ...strategy,
              floorMarketCapRatio: null,
              holdingsCount: 0
            };
          }
        }));
        
        setStrategies(finalData);
        
        // Notify parent component about strategies update
        if (onStrategiesUpdate) {
          onStrategiesUpdate(finalData);
        }
        
        // Success - stop loading
        setLoading(false);
        
      } catch (err) {
        console.error(`Failed to fetch strategies (attempt ${retryCount + 1}):`, err.message);
        
        // Retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          console.log(`⏳ Retrying in ${(retryCount + 1) * 1000}ms...`);
          setTimeout(() => {
            fetchStrategies(retryCount + 1);
          }, (retryCount + 1) * 1000); // Exponential backoff
          return;
        }
        
        // If all retries failed, set error state
        setError(`Failed to load strategies after ${maxRetries + 1} attempts: ${err.message}`);
        setStrategies([]);
        setLoading(false);
        
        // Notify parent component about empty strategies
        if (onStrategiesUpdate) {
          onStrategiesUpdate([]);
        }
      }
    };

    fetchStrategies();
  }, []);

  // Filter strategies based on search term
  const filteredStrategies = useMemo(() => {
    if (!searchTerm) return strategies;
    return strategies.filter(strategy =>
      strategy.collectionName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      strategy.tokenName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      strategy.tokenSymbol?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [strategies, searchTerm]);

  // Debounced search tracking
  useEffect(() => {
    if (searchTerm) {
      const timeoutId = setTimeout(() => {
        posthogService.trackSearchEvent('search', {
          term: searchTerm,
          filterType: 'table_search',
          resultsCount: filteredStrategies.length
        }, {
          search_length: searchTerm.length,
          total_strategies: strategies.length,
          has_results: filteredStrategies.length > 0
        });
      }, 1000); // Track after 1 second of no typing

      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, filteredStrategies.length, strategies.length]);

  // Sort strategies
  const sortedStrategies = useMemo(() => {
    if (!sortConfig.key) return filteredStrategies;

    return [...filteredStrategies].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle nested properties (e.g., poolData.price_usd)
      if (sortConfig.key.includes('.')) {
        const keys = sortConfig.key.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      // Convert to numbers if they're numeric strings
      if (typeof aValue === 'string' && !isNaN(aValue)) {
        aValue = parseFloat(aValue);
      }
      if (typeof bValue === 'string' && !isNaN(bValue)) {
        bValue = parseFloat(bValue);
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredStrategies, sortConfig]);

  // Paginate strategies
  const paginatedStrategies = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedStrategies.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedStrategies, currentPage, itemsPerPage]);

  // Calculate pagination values
  const totalPages = Math.ceil(filteredStrategies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Handle sorting
  const handleSort = (key) => {
    const newDirection = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    
    setSortConfig({
      key,
      direction: newDirection
    });

    // Track sorting event
    posthogService.trackSearchEvent('sort', {
      term: searchTerm,
      filterType: 'table_sort',
      resultsCount: filteredStrategies.length
    }, {
      sort_column: key,
      sort_direction: newDirection,
      total_strategies: strategies.length
    });
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);

    // Track pagination event
    posthogService.trackEngagementEvent('pagination', {
      pageViews: page,
      interactionsCount: 1
    }, {
      current_page: page,
      total_pages: totalPages,
      items_per_page: itemsPerPage,
      total_items: filteredStrategies.length
    });
  };

  // Format currency
  const formatCurrency = (value) => {
    if (!value || value === 0) return '$0.0000';
    
    const num = parseFloat(value);
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`;
    } else if (num >= 1) {
      return `$${num.toFixed(2)}`;
    } else {
      // For small amounts, show 4 decimal places
      return `$${num.toFixed(4)}`;
    }
  };

  // Format percentage
  const formatPercentage = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    const num = parseFloat(value);
    return `${num >= 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  const formatMillions = (value) => {
    if (value === null || value === undefined || isNaN(value)) return 'N/A';
    const num = parseFloat(value);
    if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(1)}K`;
    } else {
      return `$${num.toFixed(0)}`;
    }
  };

  // Format number with commas
  const formatNumber = (value) => {
    if (!value) return '0';
    return parseInt(value).toLocaleString();
  };

  // Get sort icon
  const getSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <span className="sort-icon sort-icon-neutral">
          <span className="sort-arrow sort-arrow-up"></span>
          <span className="sort-arrow sort-arrow-down"></span>
        </span>
      );
    }
    return (
      <span className={`sort-icon ${sortConfig.direction === 'asc' ? 'sort-icon-asc' : 'sort-icon-desc'}`}>
        <span className="sort-arrow sort-arrow-up"></span>
        <span className="sort-arrow sort-arrow-down"></span>
      </span>
    );
  };

  // Tooltip component
  const Tooltip = ({ children, text }) => (
    <div className="tooltip-container">
      {children}
      <div className="tooltip-text">{text}</div>
    </div>
  );

  if (loading) {
    return <SkeletonTable rows={itemsPerPage} />;
  }

  if (error) {
    // Determine error type for better user guidance
    const isJSONError = error.includes('Unexpected token') || error.includes('not valid JSON');
    const isNetworkError = error.includes('fetch') || error.includes('network') || error.includes('ENOTFOUND');
    const isTimeoutError = error.includes('timeout') || error.includes('ECONNABORTED');
    const isRateLimitError = error.includes('429') || error.includes('rate limit');
    
    return (
      <div className="strategies-table-container">
        <div className="error-message">
          <h3>🚫 Unable to Load Strategies</h3>
          <p className="error-details">{error}</p>
          <div className="error-suggestions">
            <p><strong>This might be due to:</strong></p>
            <ul>
              {isJSONError && (
                <li>API configuration issue (receiving HTML instead of JSON data)</li>
              )}
              {isNetworkError && (
                <li>Network connectivity issues or API server unavailable</li>
              )}
              {isTimeoutError && (
                <li>API server taking too long to respond</li>
              )}
              {isRateLimitError && (
                <li>API rate limit exceeded - too many requests</li>
              )}
              {!isJSONError && !isNetworkError && !isTimeoutError && !isRateLimitError && (
                <>
                  <li>Temporary network connectivity issues</li>
                  <li>API server maintenance</li>
                  <li>Browser cache issues</li>
                </>
              )}
            </ul>
            <p><strong>Try:</strong></p>
            <ul>
              {isRateLimitError ? (
                <li>Waiting a few minutes before trying again</li>
              ) : (
                <>
                  <li>Refreshing the page</li>
                  <li>Checking your internet connection</li>
                  <li>Waiting a few minutes and trying again</li>
                </>
              )}
              {isJSONError && (
                <li>If this persists, please contact support - there may be a deployment issue</li>
              )}
            </ul>
          </div>
          <div className="error-actions">
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button primary"
            >
              🔄 Refresh Page
            </button>
            <button 
              onClick={() => {
                setError(null);
                setLoading(true);
                // Trigger a re-fetch by updating a dependency
                window.location.hash = Date.now();
                window.location.hash = '';
              }}
              className="retry-button secondary"
            >
              🔁 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="strategies-table-container">
      <div className="table-header">
        <h2 id="strategies-table-title">NFT Strategies</h2>
        <div className="table-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search strategies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              aria-label="Search NFT strategies"
              aria-describedby="search-help"
            />
            <span id="search-help" className="sr-only">
              Search by collection name or strategy type
            </span>
          </div>
          <div className="items-per-page">
            <label htmlFor="items-per-page-select">Items per page:</label>
            <select
              id="items-per-page-select"
              value={itemsPerPage}
              onChange={(e) => {
                const newItemsPerPage = Number(e.target.value);
                setItemsPerPage(newItemsPerPage);
                setCurrentPage(1); // Reset to first page
                
                // Track items per page change
                posthogService.trackEngagementEvent('items_per_page_change', {
                  interactionsCount: 1
                }, {
                  new_items_per_page: newItemsPerPage,
                  total_items: filteredStrategies.length,
                  new_total_pages: Math.ceil(filteredStrategies.length / newItemsPerPage)
                });
              }}
              aria-label="Number of items to display per page"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      <div className="table-wrapper">
        <table 
          className="strategies-table"
          role="table"
          aria-labelledby="strategies-table-title"
          aria-describedby="table-description"
        >
          <caption id="table-description" className="sr-only">
            NFT strategies data table showing collection information, strategy details, pricing, and performance metrics. Use arrow keys to navigate and Enter to sort columns. Click on any row to view strategy details.
          </caption>
          <thead>
            <tr role="row">
              <th 
                className="sortable" 
                onClick={() => handleSort('collectionName')}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('collectionName')}
                tabIndex="0"
                role="columnheader"
                aria-sort={
                  sortConfig.key === 'collectionName' 
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
                aria-label="Sort by NFT Collection name"
              >
                NFT Collection {getSortIcon('collectionName')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('tokenName')}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('tokenName')}
                tabIndex="0"
                role="columnheader"
                aria-sort={
                  sortConfig.key === 'tokenName' 
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
                aria-label="Sort by strategy type"
              >
                Strategy {getSortIcon('tokenName')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('holdingsCount')}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('holdingsCount')}
                tabIndex="0"
                role="columnheader"
                aria-sort={
                  sortConfig.key === 'holdingsCount' 
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
                aria-label="Sort by number of NFT holdings"
              >
                Holdings {getSortIcon('holdingsCount')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('poolData.price_usd')}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('poolData.price_usd')}
                tabIndex="0"
                role="columnheader"
                aria-sort={
                  sortConfig.key === 'poolData.price_usd' 
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
                aria-label="Sort by price"
              >
                Price {getSortIcon('poolData.price_usd')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('poolData.price_change_24h')}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('poolData.price_change_24h')}
                tabIndex="0"
                role="columnheader"
                aria-sort={
                  sortConfig.key === 'poolData.price_change_24h' 
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
                aria-label="Sort by 24 hour price change"
              >
                24h Change {getSortIcon('poolData.price_change_24h')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('burnPercentage')}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('burnPercentage')}
                tabIndex="0"
                role="columnheader"
                aria-sort={
                  sortConfig.key === 'burnPercentage' 
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
                aria-label="Sort by burn percentage"
              >
                % Burn {getSortIcon('burnPercentage')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('floorMarketCapRatio')}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('floorMarketCapRatio')}
                tabIndex="0"
                role="columnheader"
                aria-sort={
                  sortConfig.key === 'floorMarketCapRatio' 
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
                aria-label="Sort by market cap ratio"
              >
                Market Cap Ratio {getSortIcon('floorMarketCapRatio')}
              </th>
              <th 
                className="sortable" 
                onClick={() => handleSort('nftStrategyMarketCap')}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('nftStrategyMarketCap')}
                tabIndex="0"
                role="columnheader"
                aria-sort={
                  sortConfig.key === 'nftStrategyMarketCap' 
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
                aria-label="Sort by market cap"
              >
                Market Cap {getSortIcon('nftStrategyMarketCap')}
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedStrategies.map((strategy, index) => (
              <tr 
                key={strategy.id} 
                role="row"
                aria-rowindex={startIndex + index + 1}
                className="clickable-row"
                onClick={() => {
                  // Track click event
                  posthogService.trackEngagementEvent('view_strategy_details', {
                    interactionsCount: 1
                  }, {
                    strategy_id: strategy.id,
                    strategy_name: strategy.tokenName,
                    collection_name: strategy.collectionName
                  });
                  
                  // Call the onStrategySelect callback
                  if (onStrategySelect) {
                    onStrategySelect(strategy);
                  }
                }}
                tabIndex="0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (onStrategySelect) {
                      onStrategySelect(strategy);
                    }
                  }
                }}
                aria-label={`View details for ${strategy.collectionName} ${strategy.tokenName} strategy`}
              >
                <td className="collection-cell" role="gridcell">
                  <div className="collection-info">
                    {strategy.collectionImage && (
                      <img 
                        src={strategy.collectionImage} 
                        alt={`${strategy.collectionName} collection avatar`}
                        className="collection-image"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    )}
                    <span className="collection-name">{strategy.collectionName || 'Unknown'}</span>
                  </div>
                </td>
                <td className="strategy-cell" role="gridcell">
                  <span className="strategy-badge" aria-label={`Strategy type: ${strategy.tokenName}`}>
                    {strategy.tokenName || 'N/A'}
                  </span>
                </td>
                <td className="holdings-cell" role="gridcell">
                  <span aria-label={`Holdings count: ${strategy.holdingsCount || 0}`}>
                    {strategy.holdingsCount || 0}
                  </span>
                </td>
                <td className="price-cell" role="gridcell">
                  <span aria-label={`Price: ${formatCurrency(strategy.poolData?.price_usd)}`}>
                    {formatCurrency(strategy.poolData?.price_usd)}
                  </span>
                </td>
                <td className={`change-cell ${parseFloat(strategy.poolData?.price_change_24h) >= 0 ? 'positive' : 'negative'}`} role="gridcell">
                  <span aria-label={`24 hour change: ${parseFloat(strategy.poolData?.price_change_24h) >= 0 ? 'positive' : 'negative'} ${formatPercentage(strategy.poolData?.price_change_24h)}`}>
                    {formatPercentage(strategy.poolData?.price_change_24h)}
                  </span>
                </td>
                <td className="burn-cell" role="gridcell">
                  <span aria-label={`Burn percentage: ${formatPercentage(strategy.burnPercentage)}`}>
                    {strategy.burnPercentage ? formatPercentage(strategy.burnPercentage) : 'N/A'}
                  </span>
                </td>
                <td className="market-cap-cell" role="gridcell">
                  {strategy.floorMarketCapRatio !== null && strategy.floorMarketCapRatio !== undefined ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{strategy.floorMarketCapRatio.toFixed(2)}%</span>
                      <div className="custom-tooltip" role="tooltip">
                        <span 
                          className="tooltip-icon"
                          aria-label="Información detallada del ratio de capitalización de mercado"
                          aria-describedby={`tooltip-${strategy.id}`}
                          tabIndex="0"
                          role="button"
                        >?</span>
                        <div 
                          className="tooltip-content"
                          id={`tooltip-${strategy.id}`}
                          role="tooltip"
                          aria-hidden={true}
                          aria-live="polite"
                        >
                          <div className="tooltip-row" role="group" aria-label="Capitalización del piso NFT">
                             <span className="tooltip-label">NFT Floor Cap:</span>
                             <span className="tooltip-value" aria-label={`${formatMillions(strategy.nftPriceFloorMarketCap)} millones`}>
                               {formatMillions(strategy.nftPriceFloorMarketCap)}
                             </span>
                           </div>
                           <div className="tooltip-row" role="group" aria-label="Capitalización de mercado del token">
                             <span className="tooltip-label">Token Market Cap:</span>
                             <span className="tooltip-value" aria-label={`${formatMillions(strategy.nftStrategyMarketCap)} millones`}>
                               {formatMillions(strategy.nftStrategyMarketCap)}
                             </span>
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : 'N/A'}
                </td>
                <td className="market-cap-value-cell" role="gridcell">
                  <span aria-label={`Market cap: ${formatCurrency(strategy.nftStrategyMarketCap)}`}>
                    {formatCurrency(strategy.nftStrategyMarketCap)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="pagination" role="navigation" aria-label="Table pagination">
        <div className="pagination-info">
          <span aria-live="polite">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredStrategies.length)} of {filteredStrategies.length} strategies
          </span>
        </div>
        <div className="pagination-controls">
          <button 
            className="pagination-button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            aria-label="Go to first page"
          >
            First
          </button>
          <button 
            className="pagination-button"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Go to previous page"
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNumber = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
            return pageNumber <= totalPages ? (
              <button
                key={pageNumber}
                className={`pagination-button ${currentPage === pageNumber ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNumber)}
                aria-label={`Go to page ${pageNumber}`}
                aria-current={currentPage === pageNumber ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            ) : null;
          })}
          
          <button 
            className="pagination-button"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Go to next page"
          >
            Next
          </button>
          <button 
            className="pagination-button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            aria-label="Go to last page"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
};

export default StrategiesDataTable;