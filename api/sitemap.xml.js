/**
 * Generate XML sitemap for the NFT Strategy Dashboard
 * Vercel-compatible version with inline sitemap generation
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Site configuration
    const siteUrl = 'https://nftstrategy.fun';
    const currentDate = new Date().toISOString();

    // Strategy list - in production, fetch from your data source
    const strategies = [
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

    // Generate slug from collection name
    const generateSlug = (text) => {
      return text
        .toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    };

    // Escape XML characters
    const escapeXML = (text) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Build sitemap XML
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add main pages
    const urls = [
      { loc: siteUrl, priority: '1.0', changefreq: 'daily' },
      { loc: `${siteUrl}/nftstrategies`, priority: '0.9', changefreq: 'hourly' }
    ];

    // Add strategy pages
    strategies.forEach(strategy => {
      if (strategy && strategy.collectionName) {
        const strategySlug = generateSlug(strategy.collectionName);
        urls.push({
          loc: `${siteUrl}/nftstrategies/${strategySlug}`,
          priority: '0.8',
          changefreq: 'hourly'
        });
      }
    });

    // Generate XML for each URL
    urls.forEach(url => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${escapeXML(url.loc)}</loc>\n`;
      sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
      sitemap += `    <changefreq>${url.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${url.priority}</priority>\n`;
      sitemap += '  </url>\n';
    });

    sitemap += '</urlset>';

    // Set appropriate headers
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    res.status(200).send(sitemap);
  } catch (error) {
    console.error('Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
