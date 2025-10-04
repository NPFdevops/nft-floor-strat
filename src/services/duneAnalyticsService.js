import axios from 'axios';
import { cacheService } from './cacheService.js';

// Request deduplication to prevent multiple identical API calls
const pendingRequests = new Map();

// Environment variables validation
const DUNE_API_KEY = import.meta.env.VITE_DUNE_API_KEY;

// Validate required environment variables
const validateEnvironmentVariables = () => {
  const missing = [];
  
  if (!DUNE_API_KEY) missing.push('VITE_DUNE_API_KEY');
  
  if (missing.length > 0) {
    const error = `Missing required environment variables: ${missing.join(', ')}`;
    console.error('🔴 Dune Analytics Environment Variables Error:', error);
    console.error('💡 Make sure to set VITE_DUNE_API_KEY in your .env file');
    throw new Error(error);
  }
  
  console.log('✅ Dune Analytics environment variables validated successfully');
  console.log('🔑 Dune API Key:', DUNE_API_KEY ? `${DUNE_API_KEY.substring(0, 8)}...` : 'Not set');
};

// Validate on module load
try {
  validateEnvironmentVariables();
} catch (error) {
  console.error('❌ Dune Analytics service initialization failed:', error.message);
  console.error('📄 Environment debug:', {
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
    VITE_DUNE_API_KEY: import.meta.env.VITE_DUNE_API_KEY ? 'Set' : 'Not set',
    allEnvVars: Object.keys(import.meta.env).filter(key => key.includes('DUNE'))
  });
}

const DUNE_API_BASE_URL = 'https://api.dune.com/api/v1';

// Create axios instance with Dune API headers
const duneClient = axios.create({
  baseURL: DUNE_API_BASE_URL,
  headers: {
    'X-Dune-API-Key': DUNE_API_KEY,
    'Content-Type': 'application/json',
  },
  timeout: 60000 // 60 seconds for complex queries
});

/**
 * Execute a Dune query and return the execution ID
 * @param {number} queryId - The Dune query ID to execute
 * @param {Object} parameters - Query parameters (optional)
 * @returns {Promise<string>} Execution ID
 */
export const executeQuery = async (queryId, parameters = {}) => {
  try {
    const cacheKey = `dune_execute_${queryId}_${JSON.stringify(parameters)}`;
    
    // Check for pending execution
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for pending Dune query execution: ${queryId}`);
      return await pendingRequests.get(cacheKey);
    }

    const requestPromise = (async () => {
      try {
        console.log(`🚀 Executing Dune query: ${queryId}`);
        
        const payload = {
          query_parameters: parameters
        };

        const response = await duneClient.post(`/query/${queryId}/execute`, payload);
        
        console.log('✅ Dune query execution started:', response.data);
        return response.data.execution_id;
      } finally {
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, requestPromise);
    return await requestPromise;
  } catch (error) {
    console.error('❌ Error executing Dune query:', error);
    throw new Error(`Failed to execute Dune query ${queryId}: ${error.message}`);
  }
};

/**
 * Get the status of a query execution
 * @param {string} executionId - The execution ID returned from executeQuery
 * @returns {Promise<Object>} Execution status object
 */
export const getExecutionStatus = async (executionId) => {
  try {
    const response = await duneClient.get(`/execution/${executionId}/status`);
    return response.data;
  } catch (error) {
    console.error('❌ Error getting Dune execution status:', error);
    throw new Error(`Failed to get execution status: ${error.message}`);
  }
};

/**
 * Get the results of a completed query execution
 * @param {string} executionId - The execution ID
 * @param {Object} options - Additional options (limit, offset, etc.)
 * @returns {Promise<Object>} Query results
 */
export const getExecutionResults = async (executionId, options = {}) => {
  try {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.offset) params.append('offset', options.offset);
    
    const response = await duneClient.get(`/execution/${executionId}/results?${params}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error getting Dune execution results:', error);
    throw new Error(`Failed to get execution results: ${error.message}`);
  }
};

/**
 * Execute a query and wait for results (convenience method)
 * @param {number} queryId - The Dune query ID to execute
 * @param {Object} parameters - Query parameters (optional)
 * @param {Object} options - Options for polling and results
 * @returns {Promise<Object>} Query results
 */
export const executeQueryAndWaitForResults = async (queryId, parameters = {}, options = {}) => {
  try {
    const {
      maxWaitTime = 300000, // 5 minutes max
      pollInterval = 5000,   // Poll every 5 seconds
      cacheTimeframe = '1h'  // Cache results for 1 hour by default
    } = options;

    // Check cache first
    const cacheKey = `dune_results_${queryId}_${JSON.stringify(parameters)}`;
    const cachedResults = await cacheService.get(cacheKey, cacheTimeframe);
    if (cachedResults) {
      console.log(`✅ Using cached Dune results for query ${queryId}`);
      return cachedResults;
    }

    console.log(`🔄 Starting Dune query execution and waiting for results: ${queryId}`);
    
    // Execute the query
    const executionId = await executeQuery(queryId, parameters);
    
    // Poll for completion
    let elapsedTime = 0;
    let status;
    
    while (elapsedTime < maxWaitTime) {
      status = await getExecutionStatus(executionId);
      
      console.log(`📊 Dune query ${queryId} status: ${status.state} (${elapsedTime/1000}s elapsed)`);
      
      if (status.state === 'QUERY_STATE_COMPLETED') {
        const results = await getExecutionResults(executionId, options);
        
        // Cache the results
        await cacheService.set(cacheKey, results, cacheTimeframe);
        
        console.log(`✅ Dune query ${queryId} completed successfully`);
        return results;
      } else if (status.state === 'QUERY_STATE_FAILED') {
        throw new Error(`Dune query failed: ${status.error || 'Unknown error'}`);
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsedTime += pollInterval;
    }
    
    throw new Error(`Dune query execution timed out after ${maxWaitTime/1000} seconds`);
  } catch (error) {
    console.error('❌ Error in executeQueryAndWaitForResults:', error);
    throw error;
  }
};

/**
 * Get the latest results from a query (without executing it again if recent results exist)
 * @param {number} queryId - The Dune query ID
 * @param {Object} parameters - Query parameters (optional)
 * @returns {Promise<Object>} Latest query results
 */
export const getLatestResults = async (queryId, parameters = {}) => {
  try {
    const response = await duneClient.get(`/query/${queryId}/results/latest`, {
      params: parameters
    });
    return response.data;
  } catch (error) {
    console.error('❌ Error getting latest Dune results:', error);
    throw new Error(`Failed to get latest results for query ${queryId}: ${error.message}`);
  }
};

/**
 * Get NFT collection metrics from Dune Analytics
 * @param {string} contractAddress - The NFT collection contract address
 * @param {string} timeframe - Time period ('7d', '30d', '90d')
 * @returns {Promise<Object>} NFT collection analytics data
 */
export const getNFTCollectionMetrics = async (contractAddress, timeframe = '30d') => {
  try {
    // This would be a custom query ID for NFT collection metrics
    // You would need to create this query in Dune Analytics dashboard first
    const NFT_METRICS_QUERY_ID = 3581394; // Example query ID - replace with actual
    
    const parameters = {
      contract_address: contractAddress,
      timeframe: timeframe
    };
    
    console.log(`📈 Fetching NFT metrics for ${contractAddress} (${timeframe})`);
    
    return await executeQueryAndWaitForResults(NFT_METRICS_QUERY_ID, parameters, {
      cacheTimeframe: timeframe === '7d' ? '1h' : '4h' // Cache shorter timeframes for less time
    });
  } catch (error) {
    console.error('❌ Error fetching NFT collection metrics:', error);
    throw error;
  }
};

/**
 * Get DeFi protocol metrics from Dune Analytics
 * @param {string} protocol - The protocol name or contract address
 * @param {string} metric - The metric type ('tvl', 'volume', 'users')
 * @param {string} timeframe - Time period ('7d', '30d', '90d')
 * @returns {Promise<Object>} DeFi protocol analytics data
 */
export const getDeFiProtocolMetrics = async (protocol, metric = 'tvl', timeframe = '30d') => {
  try {
    // Example query ID for DeFi metrics - replace with actual
    const DEFI_METRICS_QUERY_ID = 3581395;
    
    const parameters = {
      protocol: protocol,
      metric_type: metric,
      timeframe: timeframe
    };
    
    console.log(`💰 Fetching DeFi metrics for ${protocol} - ${metric} (${timeframe})`);
    
    return await executeQueryAndWaitForResults(DEFI_METRICS_QUERY_ID, parameters, {
      cacheTimeframe: timeframe === '7d' ? '30m' : '2h'
    });
  } catch (error) {
    console.error('❌ Error fetching DeFi protocol metrics:', error);
    throw error;
  }
};

/**
 * Get blockchain network statistics
 * @param {string} blockchain - The blockchain name ('ethereum', 'polygon', 'arbitrum')
 * @param {string} timeframe - Time period ('24h', '7d', '30d')
 * @returns {Promise<Object>} Blockchain network statistics
 */
export const getBlockchainStats = async (blockchain = 'ethereum', timeframe = '24h') => {
  try {
    // Example query ID for blockchain stats - replace with actual
    const BLOCKCHAIN_STATS_QUERY_ID = 3581396;
    
    const parameters = {
      blockchain: blockchain,
      timeframe: timeframe
    };
    
    console.log(`⛓️  Fetching blockchain stats for ${blockchain} (${timeframe})`);
    
    return await executeQueryAndWaitForResults(BLOCKCHAIN_STATS_QUERY_ID, parameters, {
      cacheTimeframe: timeframe === '24h' ? '15m' : '1h'
    });
  } catch (error) {
    console.error('❌ Error fetching blockchain stats:', error);
    throw error;
  }
};

/**
 * Cancel a running query execution
 * @param {string} executionId - The execution ID to cancel
 * @returns {Promise<Object>} Cancellation response
 */
export const cancelExecution = async (executionId) => {
  try {
    const response = await duneClient.post(`/execution/${executionId}/cancel`);
    console.log(`🛑 Cancelled Dune execution: ${executionId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Error cancelling Dune execution:', error);
    throw new Error(`Failed to cancel execution: ${error.message}`);
  }
};

/**
 * Get token holders by strategy from Dune Analytics
 * @param {string} strategyTokenAddress - The strategy token contract address (optional)
 * @returns {Promise<Object>} Token holders data by strategy
 */
export const getTokenHoldersByStrategy = async (strategyTokenAddress = null) => {
  try {
    const STRATEGY_TOKEN_HOLDERS_QUERY_ID = 5814457; // Your specific query ID
    
    const parameters = {};
    if (strategyTokenAddress) {
      parameters.strategy_token_address = strategyTokenAddress;
    }
    
    console.log(`👥 Fetching token holders by strategy:`, {
      strategyTokenAddress,
      parameters,
      queryId: STRATEGY_TOKEN_HOLDERS_QUERY_ID,
      apiKey: DUNE_API_KEY ? `${DUNE_API_KEY.substring(0, 8)}...` : 'Not set'
    });
    
    const result = await getLatestResults(STRATEGY_TOKEN_HOLDERS_QUERY_ID, parameters);
    
    console.log(`👥 Dune API call completed:`, {
      success: !!result,
      hasResult: !!result?.result,
      hasRows: !!result?.result?.rows,
      rowCount: result?.result?.rows?.length || 0
    });
    
    return result;
  } catch (error) {
    console.error('❌ Error fetching token holders by strategy:', {
      error: error.message,
      stack: error.stack,
      strategyTokenAddress
    });
    throw error;
  }
};

/**
 * Get account credit information
 * @returns {Promise<Object>} Account credit details
 */
export const getAccountInfo = async () => {
  try {
    const response = await duneClient.get('/account');
    return response.data;
  } catch (error) {
    console.error('❌ Error getting Dune account info:', error);
    throw new Error(`Failed to get account info: ${error.message}`);
  }
};

// Export the duneClient for advanced usage
export { duneClient };

// Export a default object with all functions
export default {
  executeQuery,
  getExecutionStatus,
  getExecutionResults,
  executeQueryAndWaitForResults,
  getLatestResults,
  getNFTCollectionMetrics,
  getDeFiProtocolMetrics,
  getBlockchainStats,
  getTokenHoldersByStrategy,
  cancelExecution,
  getAccountInfo
};
