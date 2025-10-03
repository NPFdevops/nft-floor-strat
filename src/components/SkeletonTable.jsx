import React from 'react';
import './SkeletonTable.css';

const SkeletonRow = () => (
  <tr className="skeleton-row" role="row" aria-label="Loading table row">
    {/* NFT Collection Cell */}
    <td className="skeleton-cell collection-cell" role="gridcell">
      <div className="skeleton-collection-info">
        <div className="skeleton-image" aria-label="Loading collection image"></div>
        <div className="collection-merged-content">
          <div className="skeleton-text skeleton-collection-name" aria-label="Loading collection name"></div>
          <div className="skeleton-text strategy-name-mobile" style={{width: '80px', height: '12px', marginTop: '2px'}} aria-label="Loading strategy name"></div>
        </div>
      </div>
    </td>
    
    {/* Strategy Cell */}
    <td className="skeleton-cell strategy-cell" role="gridcell">
      <div className="skeleton-badge" aria-label="Loading strategy type"></div>
    </td>
    
    {/* Holdings Cell */}
    <td className="skeleton-cell holdings-cell" role="gridcell">
      <div className="skeleton-text skeleton-holdings" aria-label="Loading holdings count"></div>
    </td>
    
    {/* Price Cell */}
    <td className="skeleton-cell price-cell" role="gridcell">
      <div className="skeleton-text skeleton-price" aria-label="Loading price"></div>
    </td>
    
    {/* 24h Change Cell */}
    <td className="skeleton-cell change-cell" role="gridcell">
      <div className="skeleton-text skeleton-change" aria-label="Loading 24 hour change"></div>
    </td>
    
    {/* Burn Percentage Cell */}
    <td className="skeleton-cell burn-cell" role="gridcell">
      <div className="skeleton-text skeleton-burn" aria-label="Loading burn percentage"></div>
    </td>
    
    {/* Market Cap Ratio Cell */}
    <td className="skeleton-cell market-cap-cell" role="gridcell">
      <div className="skeleton-text skeleton-market-cap-ratio" aria-label="Loading market cap ratio"></div>
    </td>
    
    {/* Market Cap Cell */}
    <td className="skeleton-cell market-cap-value-cell" role="gridcell">
      <div className="skeleton-text skeleton-market-cap" aria-label="Loading market cap"></div>
    </td>
  </tr>
);

const SkeletonTable = ({ rows = 10 }) => {
  return (
    <div className="strategies-table-container skeleton-container">
      {/* Screen reader announcement */}
      <div 
        aria-live="polite" 
        aria-atomic={true} 
        className="sr-only"
        role="status"
      >
        Loading NFT strategies data, please wait...
      </div>
      {/* Table Header - matches original structure */}
      <div className="table-header">
        <h2 id="strategies-table-title">NFT Strategies</h2>
        <div className="table-controls">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search strategies..."
              className="search-input"
              aria-label="Search NFT strategies"
              disabled
            />
          </div>
          <div className="items-per-page">
            <label htmlFor="items-per-page-select">Items per page:</label>
            <select
              id="items-per-page-select"
              className="items-per-page-select"
              aria-label="Number of items to display per page"
              disabled
            >
              <option value={10}>10</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Wrapper */}
      <div className="table-wrapper">
        <table 
          className="strategies-table skeleton-table"
          role="table"
          aria-labelledby="strategies-table-title"
          aria-describedby="skeleton-table-description"
          aria-busy={true}
        >
          <caption id="skeleton-table-description" className="sr-only">
            Loading NFT strategies data. Please wait while the table content is being fetched.
          </caption>
          
          {/* Table Header - matches original structure */}
          <thead>
            <tr role="row">
              <th role="columnheader" aria-label="NFT Collection">
                NFT Collection
              </th>
              <th role="columnheader" aria-label="Strategy">
                Strategy
              </th>
              <th role="columnheader" aria-label="Holdings">
                Holdings
              </th>
              <th role="columnheader" aria-label="Price">
                Price
              </th>
              <th role="columnheader" aria-label="24 hour change">
                24h Change
              </th>
              <th role="columnheader" aria-label="Burn percentage">
                % Burn
              </th>
              <th role="columnheader" aria-label="Market cap ratio">
                Market Cap Ratio
              </th>
              <th role="columnheader" aria-label="Market cap">
                Market Cap
              </th>
            </tr>
          </thead>
          
          {/* Skeleton Rows */}
          <tbody>
            {Array.from({ length: rows }, (_, index) => (
              <SkeletonRow key={`skeleton-row-${index}`} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Skeleton Pagination */}
      <div className="pagination skeleton-pagination" role="navigation" aria-label="Table pagination">
        <div className="pagination-info">
          <div className="skeleton-text skeleton-pagination-text" aria-label="Loading pagination info"></div>
        </div>
        <div className="pagination-controls">
          <div className="skeleton-button skeleton-pagination-button" aria-label="Loading first page button"></div>
          <div className="skeleton-button skeleton-pagination-button" aria-label="Loading previous page button"></div>
          <div className="skeleton-button skeleton-pagination-button skeleton-page-number" aria-label="Loading page number"></div>
          <div className="skeleton-button skeleton-pagination-button skeleton-page-number" aria-label="Loading page number"></div>
          <div className="skeleton-button skeleton-pagination-button skeleton-page-number" aria-label="Loading page number"></div>
          <div className="skeleton-button skeleton-pagination-button" aria-label="Loading next page button"></div>
          <div className="skeleton-button skeleton-pagination-button" aria-label="Loading last page button"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonTable;