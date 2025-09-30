/**
 * Collection Mapping Service
 * Maps collection names to their NFT contract addresses for holdings API calls
 */

class CollectionMappingService {
  constructor() {
    // Known NFT collection contract addresses
    this.collectionAddresses = {
      // CryptoPunks
      'cryptopunks': '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
      'crypto punks': '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
      'CryptoPunks': '0xb47e3cd837dDF8e4c57F05d70Ab865de6e193BBB',
      
      // Bored Ape Yacht Club
      'bored ape yacht club': '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      'bayc': '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      
      // Mutant Ape Yacht Club
      'mutant ape yacht club': '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
      'mayc': '0x60E4d786628Fea6478F785A6d7e704777c86a7c6',
      
      // Azuki
      'azuki': '0xED5AF388653567Af2F388E6224dC7C4b3241C544',
      
      // CloneX
      'clonex': '0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B',
      'clone x': '0x49cF6f5d44E70224e2E23fDcdd2C053F30aDA28B',
      
      // Doodles
      'doodles': '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e',
      
      // World of Women
      'world of women': '0xe785E82358879F061BC3dcAC6f0444462D4b5330',
      'wow': '0xe785E82358879F061BC3dcAC6f0444462D4b5330',
      
      // Moonbirds
      'moonbirds': '0x23581767a106ae21c074b2276D25e5C3e136a68b',
      
      // Otherdeeds
      'otherdeeds': '0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258',
      'otherdeeds for otherside': '0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258',
      
      // Art Blocks Curated
      'art blocks curated': '0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5bD270',
      'artblocks': '0xa7d8d9ef8D8Ce8992Df33D8b8CF4Aebabd5BD270',
      
      // Pudgy Penguins
      'pudgy penguins': '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8',
      'pudgypenguins': '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8',
      
      // Cool Cats
      'cool cats': '0x1A92f7381B9F03921564a437210bB9396471050C',
      'coolcats': '0x1A92f7381B9F03921564a437210bB9396471050C',
      
      // Veefriends
      'veefriends': '0xa3AEe8BcE55BEeA1951EF834b99f3Ac60d1ABeeB',
      'vee friends': '0xa3AEe8BcE55BEeA1951EF834b99f3Ac60d1ABeeB',
      
      // The Sandbox
      'the sandbox': '0x50f5474724e0Ee42D9a4e711ccFB275809Fd6d4a',
      'sandbox': '0x50f5474724e0Ee42D9a4e711ccFB275809Fd6d4a',
      
      // Decentraland
      'decentraland': '0xF87E31492Faf9A91B02Ee0dEAAd50d51d56D5d4d',
      
      // Meebits
      'meebits': '0x7Bd29408f11D2bFC23c34f18275bBf23bB716Bc7',
      
      // Loot
      'loot': '0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7',
      'loot (for adventurers)': '0xFF9C1b15B16263C61d017ee9F65C50e4AE0113D7',
      
      // Hashmasks
      'hashmasks': '0xC2C747E0F7004F9E8817Db2ca4997657a7746928',
      
      // Chromie Squiggle
      'chromie squiggle': '0x059EDD72Cd353dF5106D2B9cC5ab83a52287aC3a',
      'squiggle': '0x059EDD72Cd353dF5106D2B9cC5ab83a52287aC3a'
    };
  }

  /**
   * Get NFT contract address for a collection name
   * @param {string} collectionName - Collection name to lookup
   * @returns {string|null} Contract address or null if not found
   */
  getCollectionAddress(collectionName) {
    if (!collectionName) {
      return null;
    }

    const normalizedName = collectionName.toLowerCase().trim();
    
    // Direct match first
    if (this.collectionAddresses[normalizedName]) {
      return this.collectionAddresses[normalizedName];
    }

    // Try partial matches for common variations
    for (const [key, address] of Object.entries(this.collectionAddresses)) {
      if (normalizedName.includes(key) || key.includes(normalizedName)) {
        return address;
      }
    }

    return null;
  }

  /**
   * Add a new collection mapping
   * @param {string} collectionName - Collection name
   * @param {string} contractAddress - Contract address
   */
  addCollectionMapping(collectionName, contractAddress) {
    if (!collectionName || !contractAddress) return;
    
    const normalizedName = collectionName.toLowerCase().trim();
    this.collectionAddresses[normalizedName] = contractAddress;
    console.log(`✅ Added collection mapping: "${collectionName}" -> ${contractAddress}`);
  }

  /**
   * Get all available collection mappings
   * @returns {Object} All collection mappings
   */
  getAllMappings() {
    return { ...this.collectionAddresses };
  }

  /**
   * Check if a collection has a known address
   * @param {string} collectionName - Collection name to check
   * @returns {boolean} True if collection has a known address
   */
  hasCollectionAddress(collectionName) {
    return this.getCollectionAddress(collectionName) !== null;
  }

  /**
   * Get collection name from contract address
   * @param {string} contractAddress - Contract address to lookup
   * @returns {string|null} Collection name or null if not found
   */
  getCollectionName(contractAddress) {
    if (!contractAddress) return null;
    
    const normalizedAddress = contractAddress.toLowerCase();
    
    for (const [name, address] of Object.entries(this.collectionAddresses)) {
      if (address.toLowerCase() === normalizedAddress) {
        return name;
      }
    }
    
    return null;
  }
}

export const collectionMappingService = new CollectionMappingService();
export default collectionMappingService;