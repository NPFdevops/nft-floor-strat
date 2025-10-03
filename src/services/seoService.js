/**
 * SEO Service for NFT Strategy Dashboard
 * 
 * Provides dynamic metadata generation for SEO and social media sharing
 */

export class SEOService {
  constructor() {
    this.siteConfig = {
      siteName: 'NFT Strategy Dashboard',
      siteUrl: 'https://nftstrategy.fun',
      defaultDescription: 'Comprehensive NFT strategy analysis and performance tracking with real-time data, interactive charts, and detailed metrics.',
      defaultImage: '/assets/og-default.jpg',
      twitterHandle: '@nftstrategy',
      locale: 'en_US',
      type: 'website'
    };
  }

  /**
   * Generate SEO metadata for the main dashboard
   */
  generateDashboardMeta() {
    return {
      title: 'NFT Strategy Dashboard - Comprehensive Strategy Analysis & Performance Tracking',
      description: 'Analyze NFT strategies with real-time data, interactive charts, and comprehensive performance metrics. Track floor prices, market trends, and strategy performance across top NFT collections.',
      keywords: 'NFT strategy, NFT analysis, floor price tracking, NFT performance, strategy dashboard, NFT metrics, cryptocurrency, blockchain analysis',
      canonical: this.siteConfig.siteUrl,
      openGraph: {
        title: 'NFT Strategy Dashboard - Real-Time Strategy Analysis',
        description: 'Comprehensive NFT strategy analysis with real-time data and performance tracking',
        url: this.siteConfig.siteUrl,
        type: 'website',
        image: `${this.siteConfig.siteUrl}/assets/og-dashboard.jpg`,
        siteName: this.siteConfig.siteName,
        locale: this.siteConfig.locale
      },
      twitter: {
        card: 'summary_large_image',
        site: this.siteConfig.twitterHandle,
        title: 'NFT Strategy Dashboard',
        description: 'Real-time NFT strategy analysis and performance tracking',
        image: `${this.siteConfig.siteUrl}/assets/twitter-dashboard.jpg`
      }
    };
  }

  /**
   * Generate SEO metadata for a specific strategy
   */
  generateStrategyMeta(strategy, performanceData = null) {
    if (!strategy) {
      return this.generateDashboardMeta();
    }

    const strategyName = strategy.collectionName || strategy.tokenName || 'Strategy';
    const collectionSlug = this.generateSlug(strategyName);
    
    // Generate performance summary for description
    const performanceSummary = this.generatePerformanceSummary(performanceData);
    
    const title = `${strategyName} Strategy - Performance Analysis & Metrics`;
    const description = `Detailed analysis of ${strategyName} NFT strategy. ${performanceSummary} Track real-time performance, floor prices, and market trends.`;
    
    const strategyUrl = `${this.siteConfig.siteUrl}/nftstrategies/${collectionSlug}`;
    const ogImageUrl = `${this.siteConfig.siteUrl}/api/og-image/${collectionSlug}`;
    
    return {
      title,
      description,
      keywords: `${strategyName}, NFT strategy, ${strategyName} analysis, ${strategyName} performance, NFT metrics, floor price, strategy tracking`,
      canonical: strategyUrl,
      openGraph: {
        title: `${strategyName} Strategy Analysis`,
        description,
        url: strategyUrl,
        type: 'article',
        image: ogImageUrl,
        siteName: this.siteConfig.siteName,
        locale: this.siteConfig.locale,
        article: {
          section: 'NFT Strategy',
          tag: [strategyName, 'NFT', 'Strategy Analysis', 'Performance Tracking']
        }
      },
      twitter: {
        card: 'summary_large_image',
        site: this.siteConfig.twitterHandle,
        title: `${strategyName} Strategy Analysis`,
        description,
        image: ogImageUrl
      },
      jsonLd: this.generateStrategyJsonLd(strategy, performanceData, strategyUrl)
    };
  }

  /**
   * Generate performance summary text for descriptions
   */
  generatePerformanceSummary(performanceData) {
    if (!performanceData) {
      return 'View comprehensive performance metrics and market analysis.';
    }

    const parts = [];
    
    if (performanceData.totalReturn !== undefined) {
      const returnPercent = (performanceData.totalReturn * 100).toFixed(1);
      const returnText = performanceData.totalReturn >= 0 ? 'gain' : 'loss';
      parts.push(`${returnPercent}% total ${returnText}`);
    }
    
    if (performanceData.currentValue) {
      parts.push(`Current value: ${this.formatCurrency(performanceData.currentValue)}`);
    }
    
    if (performanceData.floorPrice) {
      parts.push(`Floor: ${this.formatEth(performanceData.floorPrice)} ETH`);
    }

    return parts.length > 0 ? parts.join(', ') + '. ' : '';
  }

  /**
   * Generate JSON-LD structured data for strategy pages
   */
  generateStrategyJsonLd(strategy, performanceData, url) {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FinancialProduct',
      name: `${strategy.collectionName || strategy.tokenName} Strategy`,
      description: `NFT investment strategy for ${strategy.collectionName} collection`,
      url: url,
      provider: {
        '@type': 'Organization',
        name: 'NFT Strategy Dashboard',
        url: this.siteConfig.siteUrl
      },
      category: 'NFT Investment Strategy',
      additionalType: 'https://schema.org/InvestmentOrSavingsProduct'
    };

    // Add performance data if available
    if (performanceData) {
      jsonLd.offers = {
        '@type': 'Offer',
        priceCurrency: 'USD',
        price: performanceData.currentValue || 0,
        availability: 'https://schema.org/InStock'
      };

      if (performanceData.totalReturn !== undefined) {
        jsonLd.yield = performanceData.totalReturn;
      }
    }

    // Add collection information if available
    if (strategy.collection) {
      jsonLd.isPartOf = {
        '@type': 'Collection',
        name: strategy.collectionName,
        identifier: strategy.collection
      };
    }

    return jsonLd;
  }

  /**
   * Generate dashboard JSON-LD structured data
   */
  generateDashboardJsonLd() {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: this.siteConfig.siteName,
      description: this.siteConfig.defaultDescription,
      url: this.siteConfig.siteUrl,
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web Browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD'
      },
      provider: {
        '@type': 'Organization',
        name: 'NFT Strategy Dashboard',
        url: this.siteConfig.siteUrl
      },
      featureList: [
        'Real-time NFT strategy analysis',
        'Performance tracking and metrics',
        'Interactive charts and visualizations',
        'Multi-collection strategy comparison',
        'Historical data analysis'
      ]
    };
  }

  /**
   * Generate Open Graph image metadata
   */
  generateOGImageMeta(strategy, performanceData = null) {
    const baseUrl = `${this.siteConfig.siteUrl}/api/og-image`;
    
    if (!strategy) {
      return {
        url: `${baseUrl}/dashboard`,
        width: 1200,
        height: 630,
        alt: 'NFT Strategy Dashboard'
      };
    }

    const params = new URLSearchParams({
      collection: strategy.collectionName || strategy.tokenName,
      ...(performanceData?.totalReturn !== undefined && { 
        return: (performanceData.totalReturn * 100).toFixed(1) 
      }),
      ...(performanceData?.currentValue && { 
        value: this.formatCurrency(performanceData.currentValue, false) 
      }),
      ...(performanceData?.floorPrice && { 
        floor: performanceData.floorPrice.toFixed(3) 
      })
    });

    return {
      url: `${baseUrl}/strategy?${params.toString()}`,
      width: 1200,
      height: 630,
      alt: `${strategy.collectionName || strategy.tokenName} Strategy Analysis`
    };
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

  formatCurrency(value, includeSymbol = true) {
    if (typeof value !== 'number') return 'N/A';
    
    const formatted = new Intl.NumberFormat('en-US', {
      style: includeSymbol ? 'currency' : 'decimal',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);

    return formatted;
  }

  formatEth(value) {
    if (typeof value !== 'number') return '0';
    return value.toFixed(3);
  }

  /**
   * Get site configuration
   */
  getSiteConfig() {
    return { ...this.siteConfig };
  }
}

// Export singleton instance
export const seoService = new SEOService();