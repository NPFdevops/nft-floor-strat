import { sitemapGenerator } from '../src/utils/sitemapGenerator.js';

/**
 * Generate robots.txt for the NFT Strategy Dashboard
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Generate robots.txt content
    const robotsTxt = sitemapGenerator.generateRobotsTxt();

    // Set appropriate headers
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    res.status(200).send(robotsTxt);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).json({ error: 'Failed to generate robots.txt' });
  }
}