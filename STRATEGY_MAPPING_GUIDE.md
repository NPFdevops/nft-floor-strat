# Strategy to NFTPriceFloor Mapping Guide

This guide explains how to use the strategy mapping service to convert NFT strategy collection names to their corresponding NFTPriceFloor API slugs.

## Problem

The NFT strategies from `nftstrategy.fun` use different naming conventions than the NFTPriceFloor API. For example:

- Strategy: `"Moonbirds"` → NFTPriceFloor: `"proof-moonbirds"`
- Strategy: `"Chromie Squiggles"` → NFTPriceFloor: `"chromie-squiggle-art-blocks-curated"`
- Strategy: `"Bored Ape Yacht Club"` → NFTPriceFloor: `"bored-ape-yacht-club"`

## Solution

We've created a comprehensive mapping service that handles:
- ✅ Direct collection name mapping
- ✅ Case-insensitive lookups
- ✅ Abbreviations (BAYC → bored-ape-yacht-club)
- ✅ Fuzzy matching for partial matches
- ✅ OpenSea slug conversion
- ✅ Automatic slug generation for unknown collections

## Quick Usage

### Import the Service

```javascript
import { strategyToSlugMappingService } from './src/services/strategyToSlugMapping.js';
```

### Basic Mapping

```javascript
// Map strategy collection name to NFTPriceFloor slug
const strategy = { collectionName: "Moonbirds" };
const nftpfSlug = strategyToSlugMappingService.getSlugFromStrategyName(strategy.collectionName);
// Result: "proof-moonbirds"

// Use the slug to fetch price data
const apiUrl = `https://nftpf-api-v0.p.rapidapi.com/projects/${nftpfSlug}/history/pricefloor/1d`;
```

### Integration Example

Here's how to integrate the mapping service into your existing code:

```javascript
// Before: Using collection name directly (might fail)
const oldApproach = async (strategy) => {
  const slug = strategy.collectionName.toLowerCase().replace(/\s+/g, '-');
  const response = await fetch(`https://nftpf-api-v0.p.rapidapi.com/projects/${slug}`);
  // This might fail for collections like "Moonbirds" → "moonbirds" (should be "proof-moonbirds")
};

// After: Using mapping service (more reliable)
const newApproach = async (strategy) => {
  const nftpfSlug = strategyToSlugMappingService.getSlugFromStrategyName(strategy.collectionName);
  const response = await fetch(`https://nftpf-api-v0.p.rapidapi.com/projects/${nftpfSlug}`);
  // This correctly maps "Moonbirds" → "proof-moonbirds"
};
```

## Supported Collections

The service currently supports 121 direct mappings and 31 OpenSea slug mappings, including:

### Major Collections
- CryptoPunks
- Bored Ape Yacht Club
- Moonbirds
- Pudgy Penguins
- Azuki
- Mutant Ape Yacht Club
- CloneX
- Doodles

### Art Blocks Collections
- Chromie Squiggles
- Fidenza
- Ringers
- Art Blocks Curated

### Gaming/Metaverse
- The Sandbox
- Decentraland
- Otherdeeds for Otherside

### And many more...

## API Reference

### Core Methods

#### `getSlugFromStrategyName(strategyCollectionName)`
Maps a strategy collection name to NFTPriceFloor API slug.

```javascript
strategyToSlugMappingService.getSlugFromStrategyName("Moonbirds");
// Returns: "proof-moonbirds"
```

#### `hasMapping(strategyName)`
Check if a strategy has a known mapping.

```javascript
strategyToSlugMappingService.hasMapping("CryptoPunks");
// Returns: true
```

#### `bulkMap(strategyNames)`
Map multiple strategy names at once.

```javascript
const strategies = ["CryptoPunks", "Moonbirds", "Azuki"];
const results = strategyToSlugMappingService.bulkMap(strategies);
// Returns: [
//   { input: "CryptoPunks", slug: "cryptopunks", hasMapping: true },
//   { input: "Moonbirds", slug: "proof-moonbirds", hasMapping: true },
//   { input: "Azuki", slug: "azuki", hasMapping: true }
// ]
```

#### `addMapping(strategyName, nftPriceFloorSlug)`
Add a new mapping for future use.

```javascript
strategyToSlugMappingService.addMapping("New Collection", "new-collection-slug");
```

### OpenSea Integration

#### `getSlugFromOpenSeaSlug(openSeaSlug)`
Convert OpenSea slugs to NFTPriceFloor slugs.

```javascript
strategyToSlugMappingService.getSlugFromOpenSeaSlug("boredapeyachtclub");
// Returns: "bored-ape-yacht-club"
```

## Case Sensitivity

The service handles various case formats:

```javascript
// All of these work:
strategyToSlugMappingService.getSlugFromStrategyName("CryptoPunks");     // "cryptopunks"
strategyToSlugMappingService.getSlugFromStrategyName("cryptopunks");     // "cryptopunks"
strategyToSlugMappingService.getSlugFromStrategyName("CRYPTOPUNKS");     // "cryptopunks"

// Abbreviations work too:
strategyToSlugMappingService.getSlugFromStrategyName("BAYC");            // "bored-ape-yacht-club"
strategyToSlugMappingService.getSlugFromStrategyName("MAYC");            // "mutant-ape-yacht-club"
```

## Fallback Behavior

For unknown collections, the service generates a reasonable slug:

```javascript
strategyToSlugMappingService.getSlugFromStrategyName("My New NFT Collection");
// Returns: "my-new-nft-collection"
// Also logs a warning about the missing mapping
```

## Configuration

The mappings are stored in two places:

1. **Code**: `src/services/strategyToSlugMapping.js` - The main service
2. **Config**: `src/config/strategyMappings.json` - JSON configuration file

To add new mappings, you can either:
- Update the JSON config file (recommended for maintenance)
- Use the `addMapping()` method at runtime
- Modify the service code directly

## Testing

Run the comprehensive test suite:

```bash
node src/scripts/testStrategyMapping.js
```

The tests verify:
- ✅ All known strategy mappings work correctly
- ✅ Case-insensitive lookups
- ✅ Abbreviation support
- ✅ OpenSea slug conversion
- ✅ Bulk mapping functionality
- ✅ Error handling for edge cases

## Common Integration Patterns

### Pattern 1: Strategy Detail View

```javascript
// In StrategyDetailView component
const fetchNFTPriceData = async (strategy) => {
  const nftpfSlug = strategyToSlugMappingService.getSlugFromStrategyName(strategy.collectionName);
  
  const response = await fetch(`https://nftpf-api-v0.p.rapidapi.com/projects/${nftpfSlug}/charts/1d`, {
    headers: {
      'X-RapidAPI-Key': process.env.VITE_RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'nftpf-api-v0.p.rapidapi.com'
    }
  });
  
  return response.json();
};
```

### Pattern 2: Collection Search

```javascript
// For search/autocomplete functionality
const searchCollections = (searchTerm) => {
  const allMappings = strategyToSlugMappingService.getAllMappings();
  
  return Object.keys(allMappings).filter(name => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );
};
```

### Pattern 3: Batch Processing

```javascript
// Process multiple strategies at once
const processStrategies = async (strategies) => {
  const mappingResults = strategyToSlugMappingService.bulkMap(
    strategies.map(s => s.collectionName)
  );
  
  const validStrategies = mappingResults.filter(result => result.hasMapping);
  
  // Process only strategies with valid mappings
  return Promise.all(validStrategies.map(result => 
    fetchNFTPriceData(result.slug)
  ));
};
```

## Maintenance

### Adding New Collections

When new NFT strategies are added:

1. Get the strategy collection name from the API
2. Find the corresponding NFTPriceFloor slug
3. Add the mapping using one of these methods:

**Method 1: Update JSON config**
```json
{
  "mappings": {
    "New Collection Name": "new-collection-nftpf-slug"
  }
}
```

**Method 2: Use addMapping() method**
```javascript
strategyToSlugMappingService.addMapping("New Collection Name", "new-collection-nftpf-slug");
```

### Testing New Mappings

Always test new mappings:

```javascript
// Verify the mapping works
const slug = strategyToSlugMappingService.getSlugFromStrategyName("New Collection Name");
console.log(`Mapped to: ${slug}`);

// Test the actual API endpoint
const testUrl = `https://nftpf-api-v0.p.rapidapi.com/projects/${slug}`;
// Make a test API call to verify the slug is valid
```

## Performance

The mapping service is highly optimized:
- ⚡ O(1) lookup for direct matches
- 🔍 Fuzzy matching fallback for partial matches
- 💾 In-memory storage for fast access
- 📦 Supports bulk operations

## Error Handling

The service gracefully handles edge cases:

```javascript
// Null/undefined inputs
strategyToSlugMappingService.getSlugFromStrategyName(null);      // Returns null
strategyToSlugMappingService.getSlugFromStrategyName("");        // Returns null

// Unknown collections
strategyToSlugMappingService.getSlugFromStrategyName("Unknown"); 
// Returns generated slug + warning
```

## Statistics

Get mapping statistics:

```javascript
const stats = strategyToSlugMappingService.getStats();
console.log(`Total mappings: ${stats.totalMappings}`);
console.log(`Total OpenSea mappings: ${stats.totalOpenSeaMappings}`);
console.log(`Last updated: ${stats.lastUpdated}`);
```

---

Need help? The mapping service includes comprehensive logging and error messages to help diagnose issues. Check the console for warnings about missing mappings.