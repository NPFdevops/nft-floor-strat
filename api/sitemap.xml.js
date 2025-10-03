import { sitemapGenerator } from '../src/utils/sitemapGenerator.js';

/**
 * Generate XML sitemap for the NFT Strategy Dashboard
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // In a real implementation, you would fetch strategies from your data source
    // For now, we'll use a mock list of strategies
    const mockStrategies = [
      { collectionName: 'CryptoPunks' },
      { collectionName: 'Moonbirds' },
      { collectionName: 'Chromie Squiggles' },
      { collectionName: 'Bored Ape Yacht Club' },
      { collectionName: 'Pudgy Penguins' },
      { collectionName: 'Azuki' },
      { collectionName: 'Mutant Ape Yacht Club' },
      { collectionName: 'CloneX' },
      { collectionName: 'Doodles' },
      { collectionName: 'World of Women' }
    ];

    // Generate sitemap XML
    const sitemap = sitemapGenerator.generateSitemap(mockStrategies);

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}