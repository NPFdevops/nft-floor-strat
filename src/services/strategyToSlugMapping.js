/**
 * Strategy to NFTPriceFloor Slug Mapping Service
 * Maps NFT strategy collection names to their corresponding NFTPriceFloor API slugs
 * 
 * This service handles the mapping between strategy collection names from nftstrategy.fun
 * and the slugs used by the NFTPriceFloor API for fetching price history data.
 */

class StrategyToSlugMappingService {
  constructor() {
    // Comprehensive mapping of strategy collection names to NFTPriceFloor API slugs
    this.strategyToSlugMap = {
      // CryptoPunks
      'CryptoPunks': 'cryptopunks',
      'cryptopunks': 'cryptopunks',
      
      // Moonbirds - Uses "proof-moonbirds" on NFTPriceFloor
      'Moonbirds': 'proof-moonbirds',
      'moonbirds': 'proof-moonbirds',
      'Proof Moonbirds': 'proof-moonbirds',
      
      // Chromie Squiggles - Uses specific Art Blocks slug
      'Chromie Squiggles': 'chromie-squiggle-art-blocks-curated',
      'chromie squiggles': 'chromie-squiggle-art-blocks-curated',
      'Chromie Squiggle by Snowfro': 'chromie-squiggle-art-blocks-curated',
      
      // CryptoDickbutts
      'CryptoDickbutts': 'cryptodickbutts-s3',
      'cryptodickbutts': 'cryptodickbutts-s3',
      
      // CrypToadz by GREMPLIN
      'CrypToadz by GREMPLIN': 'cryptoadz',
      'cryptoadz by gremplin': 'cryptoadz',
      'CrypToadz': 'cryptoadz',
      'cryptoadz': 'cryptoadz',
      
      // Bored Ape Yacht Club
      'Bored Ape Yacht Club': 'bored-ape-yacht-club',
      'bored ape yacht club': 'bored-ape-yacht-club',
      'BAYC': 'bored-ape-yacht-club',
      'bayc': 'bored-ape-yacht-club',
      
      // Pudgy Penguins
      'Pudgy Penguins': 'pudgy-penguins',
      'pudgy penguins': 'pudgy-penguins',
      'pudgypenguins': 'pudgy-penguins',
      
      // Meebits
      'Meebits': 'meebits',
      'meebits': 'meebits',
      
      // Azuki
      'Azuki': 'azuki',
      'azuki': 'azuki',
      
      // Mutant Ape Yacht Club
      'Mutant Ape Yacht Club': 'mutant-ape-yacht-club',
      'mutant ape yacht club': 'mutant-ape-yacht-club',
      'MAYC': 'mutant-ape-yacht-club',
      'mayc': 'mutant-ape-yacht-club',
      
      // Clone X - Takashi Murakami
      'CloneX': 'clonex',
      'clonex': 'clonex',
      'Clone X': 'clonex',
      'CLONE X - X TAKASHI MURAKAMI': 'clonex',
      
      // Doodles
      'Doodles': 'doodles-official',
      'doodles': 'doodles-official',
      
      // World of Women
      'World of Women': 'world-of-women-nft',
      'world of women': 'world-of-women-nft',
      'WoW': 'world-of-women-nft',
      'wow': 'world-of-women-nft',
      
      // VeeFriends
      'VeeFriends': 'veefriends',
      'veefriends': 'veefriends',
      'Vee Friends': 'veefriends',
      
      // Cool Cats
      'Cool Cats': 'coolcats',
      'cool cats': 'coolcats',
      'coolcats': 'coolcats',
      'Cool Cats NFT': 'coolcats',
      
      // Bored Ape Kennel Club
      'Bored Ape Kennel Club': 'bored-ape-kennel-club',
      'bored ape kennel club': 'bored-ape-kennel-club',
      'BAKC': 'bored-ape-kennel-club',
      'bakc': 'bored-ape-kennel-club',
      
      // The Sandbox
      'The Sandbox': 'the-sandbox',
      'the sandbox': 'the-sandbox',
      'Sandbox': 'the-sandbox',
      'sandbox': 'the-sandbox',
      
      // Decentraland
      'Decentraland': 'decentraland',
      'decentraland': 'decentraland',
      'MANA': 'decentraland',
      'mana': 'decentraland',
      
      // Lil Pudgys
      'Lil Pudgys': 'lil-pudgys',
      'lil pudgys': 'lil-pudgys',
      'lilpudgys': 'lil-pudgys',
      
      // Milady
      'Milady': 'milady',
      'milady': 'milady',
      'Milady Maker': 'milady',
      'milady maker': 'milady',
      
      // Otherdeeds for Otherside
      'Otherdeeds': 'otherdeed-for-otherside',
      'otherdeeds': 'otherdeed-for-otherside',
      'Otherdeeds for Otherside': 'otherdeed-for-otherside',
      'otherdeeds for otherside': 'otherdeed-for-otherside',
      
      // Art Blocks collections
      'Art Blocks Curated': 'art-blocks-curated',
      'art blocks curated': 'art-blocks-curated',
      'Art Blocks': 'art-blocks-curated',
      'artblocks': 'art-blocks-curated',
      
      // Fidenza
      'Fidenza': 'fidenza-art-blocks-curated',
      'fidenza': 'fidenza-art-blocks-curated',
      'Fidenza by Tyler Hobbs': 'fidenza-art-blocks-curated',
      
      // Ringers
      'Ringers': 'ringers-art-blocks-curated',
      'ringers': 'ringers-art-blocks-curated',
      'Ringers by Dmitri Cherniak': 'ringers-art-blocks-curated',
      
      // Hashmasks
      'Hashmasks': 'hashmasks',
      'hashmasks': 'hashmasks',
      
      // Autoglyphs
      'Autoglyphs': 'autoglyphs',
      'autoglyphs': 'autoglyphs',
      
      // Loot
      'Loot': 'loot-for-adventurers',
      'loot': 'loot-for-adventurers',
      'Loot (for Adventurers)': 'loot-for-adventurers',
      'loot (for adventurers)': 'loot-for-adventurers',
      
      // Nouns
      'Nouns': 'nouns',
      'nouns': 'nouns',
      
      // Invisible Friends
      'Invisible Friends': 'invisible-friends',
      'invisible friends': 'invisible-friends',
      
      // Goblintown
      'goblintown.wtf': 'goblintown-wtf',
      'goblintown': 'goblintown-wtf',
      'Goblintown': 'goblintown-wtf',
      
      // mfers
      'mfers': 'mfers',
      'Mfers': 'mfers',
      
      // 0N1 Force
      '0N1 Force': '0n1-force',
      '0n1 force': '0n1-force',
      '0N1Force': '0n1-force',
      
      // Deadfellaz
      'Deadfellaz': 'deadfellaz',
      'deadfellaz': 'deadfellaz',
      'Dead Fellaz': 'deadfellaz',
      
      // CyberKongz
      'CyberKongz': 'cyberkongz',
      'cyberkongz': 'cyberkongz',
      'Cyber Kongz': 'cyberkongz',
      
      // Mad Lads (Solana collection)
      'Mad Lads': 'mad-lads',
      'mad lads': 'mad-lads',
      'madlads': 'mad-lads',
      
      // DeGods (Solana collection)
      'DeGods': 'degods',
      'degods': 'degods',
      'De Gods': 'degods',
      
      // y00ts (Solana collection)
      'y00ts': 'y00ts',
      'Y00ts': 'y00ts',
      'yoots': 'y00ts',
      
      // Okay Bears (Solana collection)
      'Okay Bears': 'okay-bears',
      'okay bears': 'okay-bears',
      'okaybears': 'okay-bears',
      
      // CryptoKitties
      'CryptoKitties': 'cryptokitties',
      'cryptokitties': 'cryptokitties',
      'Crypto Kitties': 'cryptokitties',
      'crypto kitties': 'cryptokitties',
      
      // Additional mappings for common variations and new collections
      'Captainz': 'captainz',
      'captainz': 'captainz',
      'The Captainz': 'the-captainz',
      'the captainz': 'the-captainz',
      
      // Tensorians
      'Tensorians': 'tensorians',
      'tensorians': 'tensorians',
      
      // Women Unite
      'Women Unite': 'women-unite',
      'women unite': 'women-unite',
      
      // Lazy Lions
      'Lazy Lions': 'lazy-lions',
      'lazy lions': 'lazy-lions',
      
      // Robotos
      'Robotos Official': 'robotos-official',
      'robotos official': 'robotos-official',
      'Robotos': 'robotos-official',
      'robotos': 'robotos-official',
      
      // Sneaky Vampire Syndicate
      'Sneaky Vampire Syndicate': 'sneaky-vampire-syndicate',
      'sneaky vampire syndicate': 'sneaky-vampire-syndicate',
      
      // Pudgy Rods
      'Pudgy Rods': 'pudgy-rods',
      'pudgy rods': 'pudgy-rods',
      
      // ENS Domains
      'ENS Domains': 'ens-domains',
      'ens domains': 'ens-domains',
      'ENS': 'ens-domains',
      'ens': 'ens-domains',
      
      // Sup Ducks
      'Sup Ducks': 'sup-ducks',
      'sup ducks': 'sup-ducks',
      
      // Penguins
      'Penguins': 'penguins',
      'penguins': 'penguins',
      
      // Bears Deluxe
      'Bears Deluxe': 'bears-deluxe',
      'bears deluxe': 'bears-deluxe',
      
      // Art Blocks variations
      'Art Blocks Playground': 'art-blocks-playground',
      'art blocks playground': 'art-blocks-playground',
      
      // CryptoCoven
      'CryptoCoven': 'cryptocoven',
      'cryptocoven': 'cryptocoven',
      'Crypto Coven': 'cryptocoven',
      'crypto coven': 'cryptocoven',
      
      // Foundation
      'Foundation': 'foundation',
      'foundation': 'foundation',
      
      // SuperRare
      'SuperRare': 'superrare',
      'superrare': 'superrare',
      'Super Rare': 'superrare',
      'super rare': 'superrare',
      
      // Async Art
      'Async Art': 'async-art',
      'async art': 'async-art',
      
      // KnownOrigin
      'KnownOrigin': 'knownorigin',
      'knownorigin': 'knownorigin',
      'Known Origin': 'knownorigin',
      'known origin': 'knownorigin',
      
      // MakersPlace
      'MakersPlace': 'makersplace',
      'makersplace': 'makersplace',
      'Makers Place': 'makersplace',
      'makers place': 'makersplace',
      
      // Nifty Gateway
      'Nifty Gateway': 'nifty-gateway',
      'nifty gateway': 'nifty-gateway',
      
      // Rarible
      'Rarible': 'rarible',
      'rarible': 'rarible',
      
      // More Loot variations
      'Bloot': 'bloot',
      'bloot': 'bloot',
      'More Loot': 'more-loot',
      'more loot': 'more-loot',
      'Synthetic Loot': 'synthetic-loot',
      'synthetic loot': 'synthetic-loot',
      
      // Fame Lady Squad
      'Fame Lady Squad': 'fame-lady-squad',
      'fame lady squad': 'fame-lady-squad',
      
      // Gutter Cat Gang
      'Gutter Cat Gang': 'gutter-cat-gang',
      'gutter cat gang': 'gutter-cat-gang',
      
      // HAPEPRIME
      'HAPEPRIME': 'hapeprime',
      'hapeprime': 'hapeprime',
      'Hape Prime': 'hapeprime',
      'hape prime': 'hapeprime',
      
      // Gaming collections
      'Sorare': 'sorare',
      'sorare': 'sorare',
      'Gods Unchained Cards': 'gods-unchained-cards',
      'gods unchained cards': 'gods-unchained-cards',
      'Axie Infinity': 'axie-infinity',
      'axie infinity': 'axie-infinity',
      
      // The Sandbox Assets
      'The Sandbox Assets': 'the-sandbox-assets',
      'the sandbox assets': 'the-sandbox-assets',
      
      // Virtual worlds
      'Cryptovoxels': 'cryptovoxels',
      'cryptovoxels': 'cryptovoxels',
      'Somnium Space': 'somnium-space',
      'somnium space': 'somnium-space',
      
      // Sports collections
      'NBA Top Shot': 'nba-top-shot',
      'nba top shot': 'nba-top-shot',
      'UFC Strike': 'ufc-strike',
      'ufc strike': 'ufc-strike',
      'MLB Champions': 'mlb-champions',
      'mlb champions': 'mlb-champions',
      
      // Digital collectibles
      'VeVe Collectibles': 'veve-collectibles',
      'veve collectibles': 'veve-collectibles',
      'Ecomi Collectibles': 'ecomi-collectibles',
      'ecomi collectibles': 'ecomi-collectibles',
      'Terra Virtua Kolect': 'terra-virtua-kolect',
      'terra virtua kolect': 'terra-virtua-kolect'
    };

    // Additional mapping for OpenSea slugs to NFTPriceFloor slugs
    this.openSeaSlugMap = {
      'cryptopunks': 'cryptopunks',
      'boredapeyachtclub': 'bored-ape-yacht-club',
      'mutant-ape-yacht-club': 'mutant-ape-yacht-club',
      'pudgypenguins': 'pudgy-penguins',
      'moonbirds': 'proof-moonbirds',
      'azuki': 'azuki',
      'clonex': 'clonex',
      'doodles-official': 'doodles-official',
      'world-of-women-nft': 'world-of-women-nft',
      'veefriends': 'veefriends',
      'coolcats': 'coolcats',
      'meebits': 'meebits',
      'otherdeed-for-otherside': 'otherdeed-for-otherside',
      'lil-pudgys': 'lil-pudgys',
      'milady': 'milady',
      'bored-ape-kennel-club': 'bored-ape-kennel-club',
      'the-sandbox': 'the-sandbox',
      'decentraland': 'decentraland',
      'cryptoadz-by-gremplin': 'cryptoadz',
      'chromie-squiggle-by-snowfro': 'chromie-squiggle-art-blocks-curated',
      'cryptodickbutts-s3': 'cryptodickbutts-s3',
      'hashmasks': 'hashmasks',
      'autoglyphs': 'autoglyphs',
      'loot-for-adventurers': 'loot-for-adventurers',
      'nouns': 'nouns',
      'invisible-friends': 'invisible-friends',
      'goblintown-wtf': 'goblintown-wtf',
      'mfers': 'mfers',
      '0n1-force': '0n1-force',
      'deadfellaz': 'deadfellaz',
      'cyberkongz': 'cyberkongz'
    };
  }

  /**
   * Map a strategy collection name to NFTPriceFloor API slug
   * @param {string} strategyCollectionName - The collection name from nftstrategy.fun
   * @returns {string|null} The corresponding NFTPriceFloor API slug or null if not found
   */
  getSlugFromStrategyName(strategyCollectionName) {
    if (!strategyCollectionName) {
      return null;
    }

    // Try direct lookup first
    const directMatch = this.strategyToSlugMap[strategyCollectionName];
    if (directMatch) {
      return directMatch;
    }

    // Try case-insensitive lookup
    const lowerCaseName = strategyCollectionName.toLowerCase();
    const caseInsensitiveMatch = this.strategyToSlugMap[lowerCaseName];
    if (caseInsensitiveMatch) {
      return caseInsensitiveMatch;
    }

    // Try fuzzy matching for partial matches
    const normalizedInput = lowerCaseName.trim();
    for (const [key, slug] of Object.entries(this.strategyToSlugMap)) {
      const normalizedKey = key.toLowerCase();
      if (normalizedInput.includes(normalizedKey) || normalizedKey.includes(normalizedInput)) {
        return slug;
      }
    }

    // If no match found, try to create a reasonable slug
    const generatedSlug = this.generateSlugFromName(strategyCollectionName);
    console.warn(`⚠️ No mapping found for strategy "${strategyCollectionName}". Generated slug: "${generatedSlug}"`);
    
    return generatedSlug;
  }

  /**
   * Map an OpenSea slug to NFTPriceFloor API slug
   * @param {string} openSeaSlug - The OpenSea collection slug
   * @returns {string|null} The corresponding NFTPriceFloor API slug or null if not found
   */
  getSlugFromOpenSeaSlug(openSeaSlug) {
    if (!openSeaSlug) {
      return null;
    }

    // Try direct lookup in OpenSea slug map
    const directMatch = this.openSeaSlugMap[openSeaSlug.toLowerCase()];
    if (directMatch) {
      return directMatch;
    }

    // Try using the OpenSea slug as-is (many are identical)
    return openSeaSlug.toLowerCase();
  }

  /**
   * Generate a slug from a collection name if no mapping exists
   * @param {string} collectionName - The collection name
   * @returns {string} A generated slug
   */
  generateSlugFromName(collectionName) {
    if (!collectionName) {
      return 'unknown-collection';
    }

    return collectionName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Add a new mapping to the service
   * @param {string} strategyName - The strategy collection name
   * @param {string} nftPriceFloorSlug - The NFTPriceFloor API slug
   */
  addMapping(strategyName, nftPriceFloorSlug) {
    if (!strategyName || !nftPriceFloorSlug) {
      console.warn('⚠️ Cannot add mapping: both strategyName and nftPriceFloorSlug are required');
      return;
    }

    this.strategyToSlugMap[strategyName] = nftPriceFloorSlug;
    console.log(`✅ Added new mapping: "${strategyName}" -> "${nftPriceFloorSlug}"`);
  }

  /**
   * Get all available mappings
   * @returns {Object} All strategy to slug mappings
   */
  getAllMappings() {
    return { ...this.strategyToSlugMap };
  }

  /**
   * Check if a strategy has a known mapping
   * @param {string} strategyName - The strategy collection name
   * @returns {boolean} True if mapping exists
   */
  hasMapping(strategyName) {
    return this.getSlugFromStrategyName(strategyName) !== null;
  }

  /**
   * Get mapping statistics
   * @returns {Object} Mapping statistics
   */
  getStats() {
    return {
      totalMappings: Object.keys(this.strategyToSlugMap).length,
      totalOpenSeaMappings: Object.keys(this.openSeaSlugMap).length,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Bulk map multiple strategy collection names
   * @param {Array<string>} strategyNames - Array of strategy collection names
   * @returns {Array<Object>} Array of mapping results
   */
  bulkMap(strategyNames) {
    if (!Array.isArray(strategyNames)) {
      return [];
    }

    return strategyNames.map(name => ({
      input: name,
      slug: this.getSlugFromStrategyName(name),
      hasMapping: this.hasMapping(name)
    }));
  }
}

// Create and export a singleton instance
export const strategyToSlugMappingService = new StrategyToSlugMappingService();
export default strategyToSlugMappingService;