# SEO and OpenGraph Setup Guide

This guide explains how to use and customize the comprehensive SEO and OpenGraph system implemented for the NFT Strategy Dashboard.

## Overview

The SEO system provides:
- ✅ Dynamic meta tags and OpenGraph data
- ✅ Strategy-specific social media previews
- ✅ JSON-LD structured data for rich snippets
- ✅ Dynamic page titles and descriptions
- ✅ Social media sharing functionality
- ✅ Automatic sitemap generation
- ✅ SEO-friendly URL structure

## Components

### 1. SEOService (`src/services/seoService.js`)

The core service that generates all SEO metadata:

```javascript
import { seoService } from '../services/seoService';

// Generate dashboard metadata
const dashboardMeta = seoService.generateDashboardMeta();

// Generate strategy-specific metadata
const strategyMeta = seoService.generateStrategyMeta(strategy, performanceData);
```

### 2. SEO Component (`src/components/SEO.jsx`)

React component that manages page metadata using React Helmet:

```jsx
import SEO from '../components/SEO';

// In your component
<SEO 
  strategy={selectedStrategy}
  pageType={selectedStrategy ? 'strategy' : 'dashboard'}
  customMeta={{
    title: 'Custom Title Override',
    description: 'Custom description'
  }}
/>
```

### 3. Social Share Component (`src/components/SocialShare.jsx`)

Provides social media sharing functionality:

```jsx
import SocialShare from '../components/SocialShare';

// Add to strategy pages
<SocialShare 
  strategy={strategy}
  performanceData={performanceData}
  className="mb-4"
/>
```

### 4. Dynamic OpenGraph Images (`api/og-image.js`)

API endpoint that generates dynamic OpenGraph images:

- **Dashboard**: `/api/og-image/dashboard`
- **Strategy**: `/api/og-image/strategy?collection=CryptoPunks&return=15.2&value=250000&floor=5.43`

## Configuration

### Site Configuration

Update the site configuration in `src/services/seoService.js`:

```javascript
this.siteConfig = {
  siteName: 'NFT Strategy Dashboard',
  siteUrl: 'https://nftstrategy.fun', // Update this!
  defaultDescription: 'Your description here',
  defaultImage: '/assets/og-default.jpg',
  twitterHandle: '@nftstrategy', // Update this!
  locale: 'en_US',
  type: 'website'
};
```

### Required Assets

Create these image assets in your `public/assets/` folder:

- `og-default.jpg` (1200x630px) - Default OpenGraph image
- `twitter-default.jpg` (1200x630px) - Default Twitter Card image
- `og-dashboard.jpg` (1200x630px) - Dashboard-specific OpenGraph image
- `twitter-dashboard.jpg` (1200x630px) - Dashboard Twitter Card image

## Features

### Dynamic Page Titles

Page titles are automatically generated based on the current route:

- **Dashboard**: "NFT Strategy Dashboard - Comprehensive Strategy Analysis & Performance Tracking"
- **Strategy Page**: "{Collection Name} Strategy - Performance Analysis & Metrics"

### OpenGraph Meta Tags

Automatically generates comprehensive OpenGraph tags:

```html
<meta property="og:title" content="CryptoPunks Strategy Analysis" />
<meta property="og:description" content="Detailed analysis of CryptoPunks NFT strategy..." />
<meta property="og:url" content="https://nftstrategy.fun/nftstrategies/cryptopunks" />
<meta property="og:type" content="article" />
<meta property="og:image" content="https://nftstrategy.fun/api/og-image/cryptopunks" />
```

### Twitter Cards

Optimized Twitter Card meta tags:

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@nftstrategy" />
<meta name="twitter:title" content="CryptoPunks Strategy Analysis" />
<meta name="twitter:description" content="..." />
<meta name="twitter:image" content="..." />
```

### JSON-LD Structured Data

Automatic Schema.org structured data for:

- **WebApplication** (Dashboard)
- **FinancialProduct** (Individual Strategies)
- **ItemList** (Strategy Collections)

Example:

```json
{
  "@context": "https://schema.org",
  "@type": "FinancialProduct",
  "name": "CryptoPunks Strategy",
  "description": "NFT investment strategy for CryptoPunks collection",
  "url": "https://nftstrategy.fun/nftstrategies/cryptopunks",
  "provider": {
    "@type": "Organization",
    "name": "NFT Strategy Dashboard",
    "url": "https://nftstrategy.fun"
  }
}
```

## API Endpoints

### Sitemap Generation

- **URL**: `/api/sitemap.xml`
- **Method**: GET
- **Purpose**: Generates XML sitemap for search engines
- **Cache**: 1 hour

### Robots.txt

- **URL**: `/api/robots.txt`
- **Method**: GET
- **Purpose**: Provides crawling instructions to search engines
- **Cache**: 24 hours

### Dynamic OpenGraph Images

- **URL**: `/api/og-image/{type}`
- **Method**: GET
- **Types**: `dashboard`, `strategy`
- **Parameters**: `collection`, `return`, `value`, `floor`
- **Cache**: 1 hour

## Social Media Sharing

The `SocialShare` component supports:

- **Native sharing** (mobile devices)
- **Twitter** sharing
- **Facebook** sharing
- **LinkedIn** sharing
- **Telegram** sharing
- **Copy link** functionality

### Usage Example

```jsx
// Add to strategy detail pages
<SocialShare 
  strategy={strategy}
  performanceData={{
    totalReturn: 0.152,
    currentValue: 250000,
    floorPrice: 5.43
  }}
  className="mb-6"
/>
```

## Performance Optimization

### Caching

- OpenGraph images: 1 hour cache
- Sitemap: 1 hour cache
- Robots.txt: 24 hour cache

### Preconnects

The SEO component automatically adds preconnect headers for:

- Google Fonts
- NFTPriceFloor API
- OpenSea (DNS prefetch)

### Image Optimization

- OpenGraph images are generated at optimal 1200x630px
- Twitter Cards use `summary_large_image` for better visibility
- Dynamic generation includes performance metrics in images

## Best Practices

### 1. Strategy Performance Data

Always pass performance data when available:

```jsx
<SEO 
  strategy={strategy}
  performanceData={{
    totalReturn: strategy.totalReturn,
    currentValue: strategy.currentValue,
    floorPrice: strategy.floorPrice
  }}
  pageType="strategy"
/>
```

### 2. Custom Meta Overrides

Use custom meta for special cases:

```jsx
<SEO 
  strategy={strategy}
  customMeta={{
    description: "Special promotion - Limited time analysis",
    keywords: "NFT, special offer, limited time"
  }}
/>
```

### 3. URL Structure

Ensure URLs are SEO-friendly:
- Use hyphens, not underscores
- Keep URLs short and descriptive
- Include relevant keywords

## Testing

### OpenGraph Validation

Test your OpenGraph tags using:

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

### Structured Data Testing

Validate JSON-LD with:
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org Validator](https://validator.schema.org/)

### SEO Analysis

Use tools like:
- Google Search Console
- Google PageSpeed Insights
- Lighthouse SEO audit

## Deployment Notes

1. **Update site URL**: Change `siteUrl` in `seoService.js` to your production domain
2. **Add social media assets**: Upload OpenGraph images to `/public/assets/`
3. **Configure Twitter handle**: Update `twitterHandle` in the configuration
4. **Set up canonical URLs**: Ensure proper canonical URL configuration
5. **Submit sitemap**: Add `/sitemap.xml` to Google Search Console

## Troubleshooting

### Common Issues

1. **Images not showing in social previews**:
   - Check image paths in `seoService.js`
   - Ensure images are 1200x630px
   - Verify images are accessible publicly

2. **Meta tags not updating**:
   - Clear React Helmet cache
   - Check for conflicting meta tags in index.html
   - Ensure SEO component is rendered

3. **Sitemap not accessible**:
   - Verify API route configuration
   - Check build process includes API routes
   - Ensure proper import paths

This SEO system provides comprehensive coverage for search engine optimization and social media sharing. Regular monitoring and updates based on performance analytics will help maintain optimal SEO performance.