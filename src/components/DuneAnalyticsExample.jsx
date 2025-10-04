import React, { useState, useEffect } from 'react';
import duneService from '../services/duneAnalyticsService.js';

/**
 * Example React component demonstrating Dune Analytics integration
 * 
 * This component shows how to:
 * - Fetch data from Dune Analytics
 * - Handle loading states
 * - Display blockchain metrics
 * - Handle errors gracefully
 */
const DuneAnalyticsExample = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [queryId, setQueryId] = useState('');

  // Example: Fetch account information on component mount
  useEffect(() => {
    fetchAccountInfo();
  }, []);

  const fetchAccountInfo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const accountInfo = await duneService.getAccountInfo();
      
      setData({
        type: 'account',
        info: accountInfo
      });
    } catch (err) {
      setError(`Failed to fetch account info: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeCustomQuery = async () => {
    if (!queryId) {
      setError('Please enter a query ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log(`Executing Dune query: ${queryId}`);
      
      // First, try to get latest results (faster)
      try {
        const latestResults = await duneService.getLatestResults(parseInt(queryId));
        setData({
          type: 'query_results',
          queryId: queryId,
          results: latestResults,
          method: 'latest'
        });
      } catch (latestError) {
        // If no latest results, execute the query fresh
        console.log('No latest results available, executing fresh query...');
        const results = await duneService.executeQueryAndWaitForResults(
          parseInt(queryId), 
          {}, 
          { 
            maxWaitTime: 120000, // 2 minutes
            cacheTimeframe: '30m'
          }
        );
        
        setData({
          type: 'query_results',
          queryId: queryId,
          results: results,
          method: 'fresh'
        });
      }
    } catch (err) {
      setError(`Failed to execute query: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchNFTMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Example NFT contract address (Bored Ape Yacht Club)
      const contractAddress = '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d';
      
      const metrics = await duneService.getNFTCollectionMetrics(contractAddress, '30d');
      
      setData({
        type: 'nft_metrics',
        contractAddress: contractAddress,
        results: metrics
      });
    } catch (err) {
      setError(`Failed to fetch NFT metrics: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchBlockchainStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const stats = await duneService.getBlockchainStats('ethereum', '7d');
      
      setData({
        type: 'blockchain_stats',
        blockchain: 'ethereum',
        results: stats
      });
    } catch (err) {
      setError(`Failed to fetch blockchain stats: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderData = () => {
    if (!data) return null;

    switch (data.type) {
      case 'account':
        return (
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Account Information</h3>
            <div className="text-sm text-green-700">
              <p><strong>Plan:</strong> {data.info.plan || 'Free'}</p>
              <p><strong>Credits Used:</strong> {data.info.credits_used || 0}</p>
              <p><strong>Credits Remaining:</strong> {data.info.credits_remaining || 'Unlimited'}</p>
            </div>
          </div>
        );

      case 'query_results':
        return (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">
              Query Results (ID: {data.queryId}) - {data.method}
            </h3>
            <div className="text-sm text-blue-700">
              <p><strong>Rows:</strong> {data.results.result?.rows?.length || 0}</p>
              <p><strong>Execution Time:</strong> {data.results.execution_time_millis || 'N/A'} ms</p>
              <p><strong>State:</strong> {data.results.state || 'Unknown'}</p>
              
              {data.results.result?.rows && data.results.result.rows.length > 0 && (
                <div className="mt-2">
                  <p><strong>Sample Data:</strong></p>
                  <pre className="mt-1 text-xs bg-blue-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify(data.results.result.rows[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        );

      case 'nft_metrics':
        return (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-800 mb-2">NFT Collection Metrics</h3>
            <div className="text-sm text-purple-700">
              <p><strong>Contract:</strong> {data.contractAddress}</p>
              <p><strong>Data Points:</strong> {data.results.result?.rows?.length || 0}</p>
              <p><strong>Note:</strong> This requires custom Dune queries to be created</p>
            </div>
          </div>
        );

      case 'blockchain_stats':
        return (
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-semibold text-indigo-800 mb-2">Blockchain Statistics</h3>
            <div className="text-sm text-indigo-700">
              <p><strong>Blockchain:</strong> {data.blockchain}</p>
              <p><strong>Data Points:</strong> {data.results.result?.rows?.length || 0}</p>
              <p><strong>Note:</strong> This requires custom Dune queries to be created</p>
            </div>
          </div>
        );

      default:
        return <p>Unknown data type</p>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            🔗 Dune Analytics Integration Example
          </h2>
          <p className="text-gray-600 mt-2">
            This component demonstrates how to integrate Dune Analytics API into your React application.
          </p>
        </div>

        <div className="p-6">
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <button
              onClick={fetchAccountInfo}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md transition-colors"
            >
              {loading ? 'Loading...' : 'Get Account Info'}
            </button>

            <button
              onClick={fetchNFTMetrics}
              disabled={loading}
              className="bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-md transition-colors"
            >
              {loading ? 'Loading...' : 'Fetch NFT Metrics (Example)'}
            </button>

            <button
              onClick={fetchBlockchainStats}
              disabled={loading}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-300 text-white px-4 py-2 rounded-md transition-colors"
            >
              {loading ? 'Loading...' : 'Get Blockchain Stats (Example)'}
            </button>

            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Enter Query ID"
                value={queryId}
                onChange={(e) => setQueryId(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={executeCustomQuery}
                disabled={loading || !queryId}
                className="bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-md transition-colors"
              >
                Execute
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading data from Dune Analytics...
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Data Display */}
          {data && !loading && (
            <div className="mb-6">
              {renderData()}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">📝 Setup Instructions:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
              <li>Make sure your <code className="bg-gray-200 px-1 rounded">DUNE_API_KEY</code> is set in your .env file</li>
              <li>Create custom queries in your Dune Analytics dashboard</li>
              <li>Replace the example query IDs in the service with your actual query IDs</li>
              <li>Test the integration by clicking the buttons above</li>
              <li>Integrate the data into your charts and visualizations</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DuneAnalyticsExample;