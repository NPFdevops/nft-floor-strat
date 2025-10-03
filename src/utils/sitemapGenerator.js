/**
 * Sitemap Generator for NFT Strategy Dashboard
 * 
 * Generates XML sitemaps for better search engine indexing
 */

import { seoService } from '../services/seoService.js';

export class SitemapGenerator {
  constructor() {
    this.siteConfig = seoService.getSiteConfig();
  }

  /**
   * Generate XML sitemap for all pages
   */
  generateSitemap(strategies = []) {
    const urls = [];
    const currentDate = new Date().toISOString();

    // Add main pages
    urls.push(this.createUrl('/', currentDate, 'daily', '1.0'));
    urls.push(this.createUrl('/nftstrategies', currentDate, 'hourly', '0.9'));

    // Add strategy pages
    strategies.forEach(strategy => {
      if (strategy && strategy.collectionName) {
        const strategySlug = this.generateSlug(strategy.collectionName);
        const strategyUrl = `/nftstrategies/${strategySlug}`;
        urls.push(this.createUrl(strategyUrl, currentDate, 'hourly', '0.8'));
      }
    });

    return this.generateXML(urls);
  }

  /**
   * Create URL entry for sitemap
   */
  createUrl(path, lastmod, changefreq = 'weekly', priority = '0.7') {
    const fullUrl = `${this.siteConfig.siteUrl}${path}`;
    return {
      loc: fullUrl,
      lastmod: lastmod,
      changefreq: changefreq,
      priority: priority
    };
  }

  /**
   * Generate XML string from URLs
   */
  generateXML(urls) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    urls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXML(url.loc)}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += '  </url>\n';
    });

    xml += '</urlset>';
    return xml;
  }

  /**
   * Generate robots.txt content
   */
  generateRobotsTxt() {
    const robotsTxt = [
      'User-agent: *',
      'Allow: /',
      '',
      '# Crawl-delay for respectful crawling',
      'Crawl-delay: 1',
      '',
      '# Sitemap location',
      `Sitemap: ${this.siteConfig.siteUrl}/sitemap.xml`,
      '',
      '# Block unnecessary paths',
      'Disallow: /api/',
      'Disallow: /.vite/',
      'Disallow: /node_modules/',
      ''
    ].join('\n');

    return robotsTxt;
  }

  /**
   * Generate strategy-specific structured data
   */
  generateStructuredData(strategies = []) {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'NFT Trading Strategies',
      description: 'Comprehensive list of NFT trading strategies and performance analysis',
      numberOfItems: strategies.length,
      itemListElement: strategies.map((strategy, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'FinancialProduct',
          name: `${strategy.collectionName} Strategy`,
          description: `NFT trading strategy for ${strategy.collectionName}`,
          url: `${this.siteConfig.siteUrl}/nftstrategies/${this.generateSlug(strategy.collectionName)}`,
          provider: {
            '@type': 'Organization',
            name: this.siteConfig.siteName,
            url: this.siteConfig.siteUrl
          }
        }
      }))
    };

    return JSON.stringify(structuredData, null, 2);
  }

  /**
   * Utility functions
   */
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  escapeXML(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}

// Export singleton instance
export const sitemapGenerator = new SitemapGenerator();