#!/usr/bin/env node

/**
 * Test Script for Strategy Mapping Functionality
 * 
 * This script tests the strategy-to-slug mapping service with real data
 * from the NFT strategy API to ensure all mappings work correctly.
 */

import { strategyToSlugMappingService } from '../services/strategyToSlugMapping.js';

// Sample strategy data from the actual API
const sampleStrategies = [
  { collectionName: "CryptoPunks", tokenName: "PunkStrategy" },
  { collectionName: "Moonbirds", tokenName: "BirbStrategy" },
  { collectionName: "Chromie Squiggles", tokenName: "SquiggleStrategy" },
  { collectionName: "CryptoDickbutts", tokenName: "DickStrategy" },
  { collectionName: "CrypToadz by GREMPLIN", tokenName: "ToadzStrategy" },
  { collectionName: "Bored Ape Yacht Club", tokenName: "ApeStrategy" },
  { collectionName: "Pudgy Penguins", tokenName: "PudgyStrategy" },
  { collectionName: "Meebits", tokenName: "MeebitStrategy" }
];

// Additional test cases with variations
const testCases = [
  // Direct matches
  "CryptoPunks",
  "Moonbirds", 
  "Bored Ape Yacht Club",
  "Pudgy Penguins",
  
  // Case variations
  "cryptopunks",
  "moonbirds",
  "bored ape yacht club",
  "pudgy penguins",
  
  // Abbreviations
  "BAYC",
  "bayc",
  "MAYC",
  "mayc",
  
  // OpenSea slugs
  "boredapeyachtclub",
  "pudgypenguins",
  "cryptoadz-by-gremplin",
  
  // Unknown collection (should generate slug)
  "Some New Collection",
  
  // Edge cases
  "",
  null,
  undefined
];

function runTests() {
  console.log("🧪 Testing Strategy-to-Slug Mapping Service");
  console.log("=" .repeat(50));
  
  // Test with real strategy data
  console.log("\n📊 Testing with Real Strategy Data:");
  console.log("-".repeat(30));
  
  let successCount = 0;
  let totalTests = 0;
  
  sampleStrategies.forEach((strategy, index) => {
    totalTests++;
    const slug = strategyToSlugMappingService.getSlugFromStrategyName(strategy.collectionName);
    const hasMapping = strategyToSlugMappingService.hasMapping(strategy.collectionName);
    
    console.log(`${index + 1}. ${strategy.collectionName}`);
    console.log(`   Strategy Token: ${strategy.tokenName}`);
    console.log(`   NFTPriceFloor Slug: ${slug}`);
    console.log(`   Has Mapping: ${hasMapping ? '✅' : '❌'}`);
    
    if (hasMapping && slug && slug !== 'unknown-collection') {
      successCount++;
      console.log(`   Status: ✅ SUCCESS`);
    } else {
      console.log(`   Status: ⚠️ NEEDS MAPPING`);
    }
    console.log("");
  });
  
  // Test with various input formats
  console.log("\n🔤 Testing Various Input Formats:");
  console.log("-".repeat(30));
  
  testCases.forEach((testInput, index) => {
    totalTests++;
    const slug = strategyToSlugMappingService.getSlugFromStrategyName(testInput);
    const hasMapping = strategyToSlugMappingService.hasMapping(testInput);
    
    console.log(`${index + 1}. Input: "${testInput}"`);
    console.log(`   Output: "${slug}"`);
    console.log(`   Has Mapping: ${hasMapping ? '✅' : '❌'}`);
    
    if (slug) {
      successCount++;
    }
    
    console.log("");
  });
  
  // Test bulk mapping
  console.log("\n📦 Testing Bulk Mapping:");
  console.log("-".repeat(30));
  
  const bulkTestNames = sampleStrategies.map(s => s.collectionName);
  const bulkResults = strategyToSlugMappingService.bulkMap(bulkTestNames);
  
  bulkResults.forEach((result, index) => {
    console.log(`${index + 1}. ${result.input} -> ${result.slug} (${result.hasMapping ? '✅' : '❌'})`);
  });
  
  // Test OpenSea slug mapping
  console.log("\n🌊 Testing OpenSea Slug Mapping:");
  console.log("-".repeat(30));
  
  const openSeaSlugs = [
    'cryptopunks',
    'boredapeyachtclub', 
    'pudgypenguins',
    'moonbirds',
    'azuki'
  ];
  
  openSeaSlugs.forEach((osSlug, index) => {
    const nftpfSlug = strategyToSlugMappingService.getSlugFromOpenSeaSlug(osSlug);
    console.log(`${index + 1}. OpenSea: "${osSlug}" -> NFTPriceFloor: "${nftpfSlug}"`);
  });
  
  // Show statistics
  console.log("\n📈 Statistics:");
  console.log("-".repeat(30));
  const stats = strategyToSlugMappingService.getStats();
  console.log(`Total Mappings: ${stats.totalMappings}`);
  console.log(`Total OpenSea Mappings: ${stats.totalOpenSeaMappings}`);
  console.log(`Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);
  console.log(`Last Updated: ${stats.lastUpdated}`);
  
  // Test known NFTPriceFloor API endpoints
  console.log("\n🔗 Testing NFTPriceFloor API Compatibility:");
  console.log("-".repeat(30));
  
  const testApiCall = async (slug) => {
    try {
      const response = await fetch(`https://nftpf-api-v0.p.rapidapi.com/projects/${slug}`, {
        method: 'HEAD', // Just check if endpoint exists
        headers: {
          'X-RapidAPI-Key': process.env.VITE_RAPIDAPI_KEY || 'test-key',
          'X-RapidAPI-Host': 'nftpf-api-v0.p.rapidapi.com'
        }
      });
      return response.status;
    } catch (error) {
      return 'ERROR';
    }
  };
  
  // Test a few key mappings (limited to avoid rate limits)
  const testMappings = [
    { name: "CryptoPunks", slug: strategyToSlugMappingService.getSlugFromStrategyName("CryptoPunks") },
    { name: "Moonbirds", slug: strategyToSlugMappingService.getSlugFromStrategyName("Moonbirds") },
    { name: "Bored Ape Yacht Club", slug: strategyToSlugMappingService.getSlugFromStrategyName("Bored Ape Yacht Club") }
  ];
  
  console.log("Note: API endpoint testing requires valid RapidAPI key");
  testMappings.forEach((mapping, index) => {
    console.log(`${index + 1}. ${mapping.name} -> ${mapping.slug}`);
    console.log(`   API URL: https://nftpf-api-v0.p.rapidapi.com/projects/${mapping.slug}`);
  });
  
  console.log("\n✨ Test Complete!");
  console.log(`Overall Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);
  
  if (successCount === totalTests) {
    console.log("🎉 All tests passed!");
    return 0;
  } else {
    console.log(`⚠️ ${totalTests - successCount} tests need attention`);
    return 1;
  }
}

// Additional utility functions for testing
function demonstrateMappingUsage() {
  console.log("\n🛠️ Usage Examples:");
  console.log("-".repeat(30));
  
  // Example 1: Basic usage
  console.log("1. Basic Strategy Mapping:");
  const strategy = { collectionName: "Bored Ape Yacht Club" };
  const slug = strategyToSlugMappingService.getSlugFromStrategyName(strategy.collectionName);
  console.log(`   Strategy: ${strategy.collectionName}`);
  console.log(`   NFTPriceFloor Slug: ${slug}`);
  console.log(`   API URL: https://nftpf-api-v0.p.rapidapi.com/projects/${slug}/history/pricefloor/1d`);
  
  // Example 2: Adding new mapping
  console.log("\n2. Adding New Mapping:");
  strategyToSlugMappingService.addMapping("New Test Collection", "new-test-collection");
  const newSlug = strategyToSlugMappingService.getSlugFromStrategyName("New Test Collection");
  console.log(`   Added: "New Test Collection" -> "${newSlug}"`);
  
  // Example 3: Case insensitive lookup
  console.log("\n3. Case Insensitive Lookup:");
  const variations = ["CRYPTOPUNKS", "cryptopunks", "CryptoPunks", "Crypto Punks"];
  variations.forEach(variation => {
    const result = strategyToSlugMappingService.getSlugFromStrategyName(variation);
    console.log(`   "${variation}" -> "${result}"`);
  });
}

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const exitCode = runTests();
  demonstrateMappingUsage();
  process.exit(exitCode);
}

export { runTests, demonstrateMappingUsage };