#!/usr/bin/env node

/**
 * Test script for Dune Analytics API integration
 * 
 * This script demonstrates how to use the Dune Analytics service
 * to fetch blockchain data and metrics.
 * 
 * Usage:
 * node src/scripts/testDuneAnalytics.js
 */

import duneService from '../services/duneAnalyticsService.js';

async function testDuneAnalyticsIntegration() {
  console.log('🚀 Testing Dune Analytics API Integration\n');

  try {
    // Test 1: Get account information
    console.log('📊 Test 1: Getting account information...');
    try {
      const accountInfo = await duneService.getAccountInfo();
      console.log('✅ Account info retrieved successfully');
      console.log('   - Account type:', accountInfo.team || 'Personal');
      console.log('   - Credits remaining:', accountInfo.credits_remaining || 'Unknown');
    } catch (error) {
      console.log('⚠️  Account info test failed:', error.message);
    }
    console.log();

    // Test 2: Execute a sample query (you'll need to replace with actual query ID)
    console.log('📊 Test 2: Executing sample query...');
    try {
      // Example: Get latest results from a public query
      // Note: Replace with an actual query ID that you have access to
      const SAMPLE_QUERY_ID = 1; // This is just an example
      
      console.log(`   Attempting to get latest results for query ${SAMPLE_QUERY_ID}...`);
      const latestResults = await duneService.getLatestResults(SAMPLE_QUERY_ID);
      console.log('✅ Query results retrieved successfully');
      console.log('   - Result count:', latestResults.result?.rows?.length || 0);
      console.log('   - Execution time:', latestResults.execution_time_millis || 'Unknown', 'ms');
    } catch (error) {
      console.log('⚠️  Query execution test failed:', error.message);
      console.log('   This is expected if you don\'t have access to the sample query');
    }
    console.log();

    // Test 3: Test environment variable loading
    console.log('📊 Test 3: Testing environment configuration...');
    const apiKey = process.env.DUNE_API_KEY;
    if (apiKey) {
      console.log('✅ DUNE_API_KEY is properly configured');
      console.log('   - Key preview:', `${apiKey.substring(0, 8)}...`);
    } else {
      console.log('❌ DUNE_API_KEY is not set in environment');
      console.log('   Please check your .env file');
    }
    console.log();

    // Test 4: Demonstrate error handling
    console.log('📊 Test 4: Testing error handling...');
    try {
      // Try to execute a non-existent query to test error handling
      await duneService.executeQuery(999999999);
    } catch (error) {
      console.log('✅ Error handling working correctly');
      console.log('   - Error type:', error.constructor.name);
      console.log('   - Error message preview:', error.message.substring(0, 100) + '...');
    }
    console.log();

    console.log('🎉 Dune Analytics integration test completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Create custom queries in your Dune Analytics dashboard');
    console.log('2. Replace sample query IDs with your actual query IDs');
    console.log('3. Use the service methods in your React components');
    console.log('4. Implement data visualization with the returned data');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Example usage functions that you can use in your React components
export const exampleUsageFunctions = {
  
  /**
   * Example: Fetch NFT collection data
   */
  async fetchNFTCollectionAnalytics(contractAddress) {
    try {
      console.log(`📈 Fetching NFT analytics for ${contractAddress}`);
      const data = await duneService.getNFTCollectionMetrics(contractAddress, '30d');
      return data.result?.rows || [];
    } catch (error) {
      console.error('Error fetching NFT analytics:', error);
      return [];
    }
  },

  /**
   * Example: Fetch DeFi protocol metrics
   */
  async fetchDeFiMetrics(protocol) {
    try {
      console.log(`💰 Fetching DeFi metrics for ${protocol}`);
      const data = await duneService.getDeFiProtocolMetrics(protocol, 'tvl', '7d');
      return data.result?.rows || [];
    } catch (error) {
      console.error('Error fetching DeFi metrics:', error);
      return [];
    }
  },

  /**
   * Example: Fetch blockchain statistics
   */
  async fetchBlockchainStats(blockchain = 'ethereum') {
    try {
      console.log(`⛓️  Fetching blockchain stats for ${blockchain}`);
      const data = await duneService.getBlockchainStats(blockchain, '24h');
      return data.result?.rows || [];
    } catch (error) {
      console.error('Error fetching blockchain stats:', error);
      return [];
    }
  }
};

// Run the test if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDuneAnalyticsIntegration();
}