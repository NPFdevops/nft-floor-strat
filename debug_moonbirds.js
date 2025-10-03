#!/usr/bin/env node

/**
 * Debug Moonbirds Collection Details
 */

import { strategyToSlugMappingService } from './src/services/strategyToSlugMapping.js';
import { fetchCollectionDetails } from './src/services/nftAPI.js';

async function debugMoonbirds() {
  console.log('🦅 Debug: Moonbirds Collection Details Fetching');
  console.log('=' .repeat(60));
  
  try {
    // Test the mapping
    const mappedSlug = strategyToSlugMappingService.getSlugFromStrategyName('Moonbirds');
    console.log(`🔍 Mapped slug: "${mappedSlug}"`);
    
    if (mappedSlug !== 'proof-moonbirds') {
      console.error('❌ Mapping issue detected!');
      return;
    }
    
    // Test the collection details API call
    console.log('\n📡 Fetching collection details...');
    const result = await fetchCollectionDetails(mappedSlug);
    
    console.log('\n📊 Result Summary:');
    console.log('Success:', result.success);
    console.log('Collection Name:', result.collectionName);
    console.log('Error (if any):', result.error);
    
    if (result.success && result.data) {
      console.log('\n💰 Financial Data:');
      console.log('Floor Price ETH:', result.data.floor_price_eth);
      console.log('Floor Price USD:', result.data.floor_price_usd);
      console.log('Market Cap USD:', result.data.market_cap_usd);
      console.log('Market Cap ETH:', result.data.market_cap_eth);
      console.log('24h Price Change:', result.data.price_change_24h);
      console.log('Holders Count:', result.data.holders_count);
      console.log('Total Supply:', result.data.total_supply);
      
      console.log('\n🔍 Data Structure Check:');
      console.log('floor_price_eth type:', typeof result.data.floor_price_eth);
      console.log('floor_price_eth value:', result.data.floor_price_eth);
      console.log('market_cap_usd type:', typeof result.data.market_cap_usd);
      console.log('market_cap_usd value:', result.data.market_cap_usd);
      console.log('holders_count type:', typeof result.data.holders_count);
      console.log('holders_count value:', result.data.holders_count);
      console.log('price_change_24h type:', typeof result.data.price_change_24h);
      console.log('price_change_24h value:', result.data.price_change_24h);
      
      // Check for null/undefined/empty values that would cause "N/A" display
      const issues = [];
      if (!result.data.floor_price_eth) issues.push('floor_price_eth is falsy');
      if (!result.data.market_cap_usd) issues.push('market_cap_usd is falsy');
      if (!result.data.holders_count) issues.push('holders_count is falsy');
      if (result.data.price_change_24h === null || result.data.price_change_24h === undefined) {
        issues.push('price_change_24h is null/undefined');
      }
      
      if (issues.length > 0) {
        console.log('\n⚠️ Data Issues Found:');
        issues.forEach(issue => console.log(`  - ${issue}`));
      } else {
        console.log('\n✅ All key data fields have values');
      }
      
      console.log('\n🔧 Raw API Data Structure (first level):');
      console.log('Available keys:', Object.keys(result.data));
      
      if (result.data._raw) {
        console.log('\n🔬 Raw API Response Structure:');
        console.log('stats keys:', result.data._raw.stats ? Object.keys(result.data._raw.stats) : 'No stats');
        
        if (result.data._raw.stats?.floorInfo) {
          console.log('floorInfo:', result.data._raw.stats.floorInfo);
        }
        
        if (result.data._raw.stats?.floorTemporalityUsd) {
          console.log('floorTemporalityUsd:', result.data._raw.stats.floorTemporalityUsd);
        }
      }
      
    } else {
      console.log('\n❌ Failed to fetch collection details or no data received');
      if (result.error) {
        console.log('Error details:', result.error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
  }
}

// Run the debug
if (import.meta.url === `file://${process.argv[1]}`) {
  debugMoonbirds()
    .then(() => {
      console.log('\n✨ Debug complete!');
    })
    .catch(error => {
      console.error('❌ Debug script failed:', error);
      process.exit(1);
    });
}

export { debugMoonbirds };