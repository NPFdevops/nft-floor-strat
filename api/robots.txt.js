/**
 * Generate robots.txt for the NFT Strategy Dashboard
 * Vercel-compatible version with inline robots.txt generation
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Site configuration
    const siteUrl = 'https://nftstrategy.fun';

    // Generate robots.txt content
    const robotsTxt = [
      'User-agent: *',
      'Allow: /',
      '',
      '# Crawl-delay for respectful crawling',
      'Crawl-delay: 1',
      '',
      '# Sitemap location',
      `Sitemap: ${siteUrl}/api/sitemap.xml`,
      '',
      '# Block unnecessary paths',
      'Disallow: /api/',
      'Disallow: /.vite/',
      'Disallow: /node_modules/',
      ''
    ].join('\n');

    // Set appropriate headers
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    res.status(200).send(robotsTxt);
  } catch (error) {
    console.error('Error generating robots.txt:', error);
    res.status(500).json({ error: 'Failed to generate robots.txt' });
  }
}
