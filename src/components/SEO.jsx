import React, { useEffect } from 'react';
import { seoService } from '../services/seoService';

/**
 * SEO Component for managing page metadata, OpenGraph tags, and structured data
 * React 19 compatible version using direct DOM manipulation
 * 
 * @param {Object} props - Component props
 * @param {Object} props.strategy - Strategy data for dynamic SEO generation
 * @param {Object} props.performanceData - Performance metrics for enhanced descriptions
 * @param {string} props.pageType - Type of page (dashboard, strategy)
 * @param {Object} props.customMeta - Custom meta overrides
 */
export function SEO({ 
  strategy = null, 
  performanceData = null, 
  pageType = 'dashboard',
  customMeta = {}
}) {
  useEffect(() => {
    // Generate appropriate metadata based on page type
    const getMeta = () => {
      let baseMeta;
      
      if (pageType === 'strategy' && strategy) {
        baseMeta = seoService.generateStrategyMeta(strategy, performanceData);
      } else {
        baseMeta = seoService.generateDashboardMeta();
      }

      // Merge with custom overrides
      return {
        ...baseMeta,
        ...customMeta,
        openGraph: {
          ...baseMeta.openGraph,
          ...customMeta.openGraph
        },
        twitter: {
          ...baseMeta.twitter,
          ...customMeta.twitter
        }
      };
    };

    const meta = getMeta();
    const siteConfig = seoService.getSiteConfig();

    // Function to update or create meta tag
    const updateMetaTag = (name, content, property = false) => {
      if (!content) return;
      
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let metaTag = document.querySelector(selector);
      
      if (!metaTag) {
        metaTag = document.createElement('meta');
        if (property) {
          metaTag.setAttribute('property', name);
        } else {
          metaTag.setAttribute('name', name);
        }
        document.head.appendChild(metaTag);
      }
      
      metaTag.setAttribute('content', content);
    };

    // Function to update link tag
    const updateLinkTag = (rel, href) => {
      if (!href) return;
      
      let linkTag = document.querySelector(`link[rel="${rel}"]`);
      
      if (!linkTag) {
        linkTag = document.createElement('link');
        linkTag.setAttribute('rel', rel);
        document.head.appendChild(linkTag);
      }
      
      linkTag.setAttribute('href', href);
    };

    // Function to update or create script tag
    const updateScriptTag = (id, content) => {
      if (!content) return;
      
      let scriptTag = document.querySelector(`script[data-seo-id="${id}"]`);
      
      if (!scriptTag) {
        scriptTag = document.createElement('script');
        scriptTag.setAttribute('type', 'application/ld+json');
        scriptTag.setAttribute('data-seo-id', id);
        document.head.appendChild(scriptTag);
      }
      
      scriptTag.textContent = JSON.stringify(content);
    };

    // Update page title
    document.title = meta.title;

    // Update basic meta tags
    updateMetaTag('description', meta.description);
    updateMetaTag('keywords', meta.keywords);
    updateMetaTag('author', 'NFT Strategy Dashboard');
    updateMetaTag('robots', 'index, follow, max-image-preview:large');
    updateMetaTag('googlebot', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    
    // Update theme colors
    updateMetaTag('theme-color', '#FFAADD');
    updateMetaTag('msapplication-TileColor', '#FFAADD');
    
    // Update canonical URL
    updateLinkTag('canonical', meta.canonical);
    
    // Update Open Graph meta tags
    updateMetaTag('og:title', meta.openGraph.title, true);
    updateMetaTag('og:description', meta.openGraph.description, true);
    updateMetaTag('og:url', meta.openGraph.url, true);
    updateMetaTag('og:type', meta.openGraph.type, true);
    updateMetaTag('og:image', meta.openGraph.image, true);
    updateMetaTag('og:image:width', '1200', true);
    updateMetaTag('og:image:height', '630', true);
    updateMetaTag('og:image:alt', meta.openGraph.title, true);
    updateMetaTag('og:site_name', meta.openGraph.siteName, true);
    updateMetaTag('og:locale', meta.openGraph.locale, true);
    
    // Update article-specific OG tags for strategy pages
    if (meta.openGraph.article) {
      updateMetaTag('article:section', meta.openGraph.article.section, true);
      
      // Remove existing article:tag meta tags
      document.querySelectorAll('meta[property="article:tag"]').forEach(tag => tag.remove());
      
      // Add new article:tag meta tags
      meta.openGraph.article.tag.forEach(tag => {
        const metaTag = document.createElement('meta');
        metaTag.setAttribute('property', 'article:tag');
        metaTag.setAttribute('content', tag);
        document.head.appendChild(metaTag);
      });
    }
    
    // Update Twitter Card meta tags
    updateMetaTag('twitter:card', meta.twitter.card);
    updateMetaTag('twitter:site', meta.twitter.site);
    updateMetaTag('twitter:title', meta.twitter.title);
    updateMetaTag('twitter:description', meta.twitter.description);
    updateMetaTag('twitter:image', meta.twitter.image);
    updateMetaTag('twitter:image:alt', meta.twitter.title);
    
    // Update structured data
    if (meta.jsonLd) {
      updateScriptTag('strategy', meta.jsonLd);
    }
    
    // Update dashboard JSON-LD for homepage
    if (pageType === 'dashboard') {
      updateScriptTag('dashboard', seoService.generateDashboardJsonLd());
    }

    // Add preconnect links if they don't exist
    const preconnectLinks = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://nftpf-api-v0.p.rapidapi.com'
    ];

    preconnectLinks.forEach(href => {
      if (!document.querySelector(`link[rel="preconnect"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'preconnect');
        link.setAttribute('href', href);
        if (href.includes('gstatic.com')) {
          link.setAttribute('crossorigin', '');
        }
        document.head.appendChild(link);
      }
    });

    // Add DNS prefetch links if they don't exist
    const dnsPrefetchLinks = [
      '//nftpricefloor.com',
      '//opensea.io'
    ];

    dnsPrefetchLinks.forEach(href => {
      if (!document.querySelector(`link[rel="dns-prefetch"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'dns-prefetch');
        link.setAttribute('href', href);
        document.head.appendChild(link);
      }
    });

  }, [strategy, performanceData, pageType, customMeta]);

  // This component only manages head tags, so it renders nothing
  return null;
}

export default SEO;