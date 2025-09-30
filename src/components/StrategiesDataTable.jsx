import React, { useState, useEffect, useMemo } from 'react';
import './StrategiesDataTable.css';
import { nftStrategyService } from '../services/nftStrategyService.js';
import SkeletonTable from './SkeletonTable.jsx';

const StrategiesDataTable = ({ onStrategySelect, onStrategiesUpdate }) => {
  const [strategies, setStrategies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'floorMarketCap', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch data from API
  useEffect(() => {
    const fetchStrategies = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/strategies');
        if (!response.ok) {
          throw new Error(`Failed to fetch strategies (${response.status})`);
        }
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          throw new Error('Invalid data format received from API');
        }
        
        // Enhance data with additional API calls for burn percentage and holders
        const enhancedData = await nftStrategyService.enhanceStrategiesData(data);
        
        // Add market cap coefficient calculation
        const finalData = await Promise.all(enhancedData.map(async (strategy) => {
          try {
            // Get market cap from NFTpricefloor API
            let nftPriceFloorMarketCap = null;
            try {
              const response = await fetch(`https://${import.meta.env.VITE_RAPIDAPI_HOST}/projects?search=${encodeURIComponent(strategy.name)}`, {
                headers: {
                  'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY,
                  'X-RapidAPI-Host': import.meta.env.VITE_RAPIDAPI_HOST,
                }
              });
              if (response.ok) {
                const data = await response.json();
                const project = data.find(p => 
                  p.name.toLowerCase().includes(strategy.collectionName.toLowerCase()) ||
                  strategy.collectionName.toLowerCase().includes(p.name.toLowerCase())
                );
                if (project && project.stats && project.stats.floorCapUsd) {
                  nftPriceFloorMarketCap = project.stats.floorCapUsd;
                }
              }
            } catch (err) {
              console.warn('Failed to fetch NFTpricefloor market cap:', err);
            }
            
            // Calculate Floor Market Cap as NFTpricefloor Market Cap / nftstrategy Market Cap
            const nftStrategyMarketCap = strategy.poolData?.market_cap_usd;
            console.log(`📊 Market Cap calculation for ${strategy.name}:`);
            console.log(`  - NFTpricefloor Market Cap: ${nftPriceFloorMarketCap}`);
            console.log(`  - nftstrategy Market Cap: ${nftStrategyMarketCap}`);
            
            const floorMarketCap = (nftPriceFloorMarketCap && nftStrategyMarketCap && nftStrategyMarketCap > 0) ? 
              nftPriceFloorMarketCap / nftStrategyMarketCap : null;
            console.log(`  - Floor Market Cap ratio: ${floorMarketCap}`);
            
            return {
              ...strategy,
              nftPriceFloorMarketCap,
              nftStrategyMarketCap,
              floorMarketCap
            };
          } catch (err) {
            console.warn('Failed to add market cap coefficient:', err);
            return strategy;
          }
        }));
        
        setStrategies(finalData);
        
        // Notify parent component about strategies update
        if (onStrategiesUpdate) {
          onStrategiesUpdate(finalData);
        }
      } catch (err) {
        console.error('Failed to fetch strategies:', err.message);
        setError(`Failed to load strategies: ${err.message}`);
        setStrategies([]);
        
        // Notify parent component about empty strategies
        if (onStrategiesUpdate) {
          onStrategiesUpdate([]);
        }
      } finally {
        setLoading(false);
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
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
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
    return (
      <div className="strategies-table-container">
        <div className="error-message">
          <h3>Error loading strategies</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
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
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
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
            NFT strategies data table showing collection information, strategy details, pricing, and performance metrics. Use arrow keys to navigate and Enter to sort columns.
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
                onClick={() => handleSort('floorMarketCap')}
                onKeyDown={(e) => e.key === 'Enter' && handleSort('floorMarketCap')}
                tabIndex="0"
                role="columnheader"
                aria-sort={
                  sortConfig.key === 'floorMarketCap' 
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
                aria-label="Sort by market cap ratio"
              >
                MarketCap Ratio
                {getSortIcon('floorMarketCap')}
              </th>
              <th role="columnheader" aria-label="Actions">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStrategies.map((strategy, index) => (
              <tr 
                key={strategy.id} 
                role="row"
                aria-rowindex={startIndex + index + 1}
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
                  {strategy.floorMarketCap ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{((1 / strategy.floorMarketCap) * 100).toFixed(2)}%</span>
                      <div className="custom-tooltip">
                        <span className="tooltip-icon">?</span>
                        <div className="tooltip-content">
                          <span className="tooltip-line">
                            <span className="tooltip-label">NFT Collection Floor Cap:</span>
                            <span className="tooltip-value">{formatMillions(strategy.nftPriceFloorMarketCap)}</span>
                          </span>
                          <span className="tooltip-line">
                            <span className="tooltip-label">{strategy.tokenName || strategy.name} Market Cap:</span>
                            <span className="tooltip-value">{formatMillions(strategy.nftStrategyMarketCap)}</span>
                          </span>
                          <span className="tooltip-line">
                            <span className="tooltip-label">Ratio:</span>
                            <span className="tooltip-ratio">{((1 / strategy.floorMarketCap) * 100).toFixed(2)}%</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : 'N/A'}
                </td>
                <td className="action-cell" role="gridcell">
                  <button 
                    className="view-button"
                    onClick={() => {
                      console.log('View strategy:', strategy);
                      if (onStrategySelect) {
                        onStrategySelect(strategy);
                      }
                    }}
                    aria-label={`View details for ${strategy.collectionName} ${strategy.tokenName} strategy`}
                  >
                    View
                  </button>
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