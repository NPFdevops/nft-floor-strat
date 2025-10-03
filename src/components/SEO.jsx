import React from 'react';
import { Helmet } from 'react-helmet-async';
import { seoService } from '../services/seoService';

/**
 * SEO Component for managing page metadata, OpenGraph tags, and structured data
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

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta name="keywords" content={meta.keywords} />
      <meta name="author" content="NFT Strategy Dashboard" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={meta.canonical} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={meta.openGraph.title} />
      <meta property="og:description" content={meta.openGraph.description} />
      <meta property="og:url" content={meta.openGraph.url} />
      <meta property="og:type" content={meta.openGraph.type} />
      <meta property="og:image" content={meta.openGraph.image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={meta.openGraph.title} />
      <meta property="og:site_name" content={meta.openGraph.siteName} />
      <meta property="og:locale" content={meta.openGraph.locale} />
      
      {/* Article specific OG tags for strategy pages */}
      {meta.openGraph.article && (
        <>
          <meta property="article:section" content={meta.openGraph.article.section} />
          {meta.openGraph.article.tag.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={meta.twitter.card} />
      <meta name="twitter:site" content={meta.twitter.site} />
      <meta name="twitter:title" content={meta.twitter.title} />
      <meta name="twitter:description" content={meta.twitter.description} />
      <meta name="twitter:image" content={meta.twitter.image} />
      <meta name="twitter:image:alt" content={meta.twitter.title} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      
      {/* Theme Colors */}
      <meta name="theme-color" content="#FFAADD" />
      <meta name="msapplication-TileColor" content="#FFAADD" />
      
      {/* Structured Data (JSON-LD) */}
      {meta.jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(meta.jsonLd)}
        </script>
      )}
      
      {/* Dashboard JSON-LD for homepage */}
      {pageType === 'dashboard' && (
        <script type="application/ld+json">
          {JSON.stringify(seoService.generateDashboardJsonLd())}
        </script>
      )}
      
      {/* Preconnect to external domains for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="preconnect" href="https://nftpf-api-v0.p.rapidapi.com" />
      
      {/* DNS Prefetch for additional domains */}
      <link rel="dns-prefetch" href="//nftpricefloor.com" />
      <link rel="dns-prefetch" href="//opensea.io" />
      
      {/* Favicon and Icons */}
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="manifest" href="/site.webmanifest" />
      
      {/* Additional Security and Performance Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />
      
      {/* Language and Content */}
      <html lang="en" />
    </Helmet>
  );
}

export default SEO;