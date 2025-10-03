/**
 * Generate dynamic OpenGraph images for NFT strategies
 * Vercel-compatible version using SVG generation
 * 
 * Usage:
 * - GET /api/og-image/dashboard - Dashboard overview image
 * - GET /api/og-image/strategy?collection=CryptoPunks&return=15.2&value=250000&floor=5.43
 */

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const BRAND_COLOR = '#FFAADD';
const ACCENT_COLOR = '#000000';
const BACKGROUND_COLOR = '#FFFFFF';
const TEXT_COLOR = '#000000';

export default async function handler(req, res) {
  try {
    const { method, query } = req;
    
    if (method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Extract parameters
    const {
      collection = 'NFT Strategy',
      return: returnPercent = null,
      value = null,
      floor = null,
      type = 'strategy'
    } = query;

    let svg;
    
    if (type === 'dashboard') {
      svg = generateDashboardSVG();
    } else {
      svg = generateStrategySVG({
        collection,
        returnPercent,
        value,
        floor
      });
    }

    // Set appropriate headers for SVG
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    res.status(200).send(svg);

  } catch (error) {
    console.error('Error generating OG image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
}

function generateDashboardSVG() {
  const svg = `
    <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(255,170,221,0.1);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(255,170,221,0.05);stop-opacity:1" />
        </linearGradient>
        <style>
          .title { font: bold 64px Arial, sans-serif; fill: ${TEXT_COLOR}; }
          .subtitle { font: 32px Arial, sans-serif; fill: #666666; }
          .feature { font: 24px Arial, sans-serif; fill: ${TEXT_COLOR}; }
          .footer { font: 18px Arial, sans-serif; fill: #666666; text-anchor: middle; }
          .footer-small { font: 14px Arial, sans-serif; fill: #999999; text-anchor: middle; }
        </style>
      </defs>
      
      <!-- Background -->
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${BACKGROUND_COLOR}"/>
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bgGradient)"/>
      
      <!-- Decorative elements -->
      <g stroke="${BRAND_COLOR}" stroke-width="2" opacity="0.1">
        <line x1="50" y1="150" x2="150" y2="150"/>
        <line x1="50" y1="250" x2="150" y2="250"/>
        <line x1="50" y1="350" x2="150" y2="350"/>
        <circle cx="1050" cy="100" r="8" fill="none"/>
        <circle cx="1080" cy="120" r="8" fill="none"/>
        <circle cx="1110" cy="140" r="8" fill="none"/>
        <circle cx="1140" cy="160" r="8" fill="none"/>
      </g>
      
      <!-- Main title -->
      <text x="80" y="180" class="title">NFT Strategy</text>
      <text x="80" y="260" class="title">Dashboard</text>
      
      <!-- Subtitle -->
      <text x="80" y="320" class="subtitle">Comprehensive strategy analysis</text>
      <text x="80" y="360" class="subtitle">&amp; performance tracking</text>
      
      <!-- Features -->
      <text x="80" y="450" class="feature">📊 Real-time Data</text>
      <text x="380" y="450" class="feature">📈 Performance Metrics</text>
      <text x="80" y="490" class="feature">⚡ Interactive Charts</text>
      <text x="380" y="490" class="feature">🎯 Strategy Comparison</text>
      
      <!-- Logo -->
      <rect x="850" y="120" width="120" height="120" fill="${BRAND_COLOR}"/>
      <text x="910" y="170" font="bold 24px Arial" text-anchor="middle" fill="${ACCENT_COLOR}">NFT</text>
      <text x="910" y="200" font="bold 24px Arial" text-anchor="middle" fill="${ACCENT_COLOR}">STRAT</text>
      
      <!-- Footer -->
      <rect x="0" y="${OG_HEIGHT - 80}" width="${OG_WIDTH}" height="80" fill="rgba(0,0,0,0.05)"/>
      <text x="${OG_WIDTH/2}" y="${OG_HEIGHT - 35}" class="footer">nftstrategy.fun • Real-time NFT Strategy Analysis</text>
      <text x="${OG_WIDTH/2}" y="${OG_HEIGHT - 10}" class="footer-small">Updated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</text>
    </svg>
  `;
  
  return svg;
}

function generateStrategySVG({ collection, returnPercent, value, floor }) {
  // Truncate long collection names
  const maxLength = 20;
  const displayCollection = collection.length > maxLength 
    ? collection.substring(0, maxLength) + '...' 
    : collection;
    
  // Build metrics if available
  const metrics = [];
  
  if (returnPercent !== null) {
    const isPositive = parseFloat(returnPercent) >= 0;
    metrics.push({
      label: 'Total Return',
      value: `${returnPercent}%`,
      color: isPositive ? '#22c55e' : '#ef4444'
    });
  }
  
  if (value !== null) {
    metrics.push({
      label: 'Current Value',
      value: `$${parseInt(value).toLocaleString()}`,
      color: TEXT_COLOR
    });
  }
  
  if (floor !== null) {
    metrics.push({
      label: 'Floor Price',
      value: `${parseFloat(floor).toFixed(2)} ETH`,
      color: TEXT_COLOR
    });
  }

  // Generate metrics SVG elements
  let metricsElements = '';
  if (metrics.length > 0) {
    const metricsPerRow = Math.min(metrics.length, 3);
    const metricWidth = 1040 / metricsPerRow;
    
    metricsElements = `
      <!-- Metrics container -->
      <rect x="80" y="280" width="1040" height="180" fill="rgba(255,170,221,0.15)" stroke="${BRAND_COLOR}" stroke-width="3"/>
    `;
    
    metrics.forEach((metric, index) => {
      const x = 80 + (index * metricWidth) + (metricWidth / 2);
      metricsElements += `
        <text x="${x}" y="330" font="20px Arial" text-anchor="middle" fill="#666666">${metric.label}</text>
        <text x="${x}" y="380" font="bold 36px Arial" text-anchor="middle" fill="${metric.color}">${metric.value}</text>
      `;
    });
  }
  
  // Generate trend chart if return percent is available
  let trendChart = '';
  if (returnPercent !== null) {
    const isPositive = parseFloat(returnPercent) >= 0;
    const color = isPositive ? '#22c55e' : '#ef4444';
    const trend = isPositive ? 1 : -1;
    
    let pathData = '';
    for (let i = 0; i < 8; i++) {
      const x = 650 + (i * 20);
      const baseY = 150;
      const trendOffset = (i / 8) * trend * 30;
      const y = baseY + trendOffset;
      
      if (i === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        pathData += ` L ${x} ${y}`;
      }
    }
    
    trendChart = `<path d="${pathData}" stroke="${color}" stroke-width="4" fill="none"/>`;
  }

  const svg = `
    <svg width="${OG_WIDTH}" height="${OG_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:rgba(255,170,221,0.1);stop-opacity:1" />
          <stop offset="100%" style="stop-color:rgba(255,170,221,0.05);stop-opacity:1" />
        </linearGradient>
        <style>
          .main-title { font: bold 56px Arial, sans-serif; fill: ${TEXT_COLOR}; }
          .subtitle { font: 32px Arial, sans-serif; fill: #666666; }
          .footer { font: 18px Arial, sans-serif; fill: #666666; text-anchor: middle; }
          .footer-small { font: 14px Arial, sans-serif; fill: #999999; text-anchor: middle; }
        </style>
      </defs>
      
      <!-- Background -->
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="${BACKGROUND_COLOR}"/>
      <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="url(#bgGradient)"/>
      
      <!-- Decorative elements -->
      <g stroke="${BRAND_COLOR}" stroke-width="2" opacity="0.1">
        <line x1="50" y1="150" x2="150" y2="150"/>
        <line x1="50" y1="250" x2="150" y2="250"/>
        <line x1="50" y1="350" x2="150" y2="350"/>
        <circle cx="1050" cy="100" r="8" fill="none"/>
        <circle cx="1080" cy="120" r="8" fill="none"/>
        <circle cx="1110" cy="140" r="8" fill="none"/>
        <circle cx="1140" cy="160" r="8" fill="none"/>
      </g>
      
      <!-- Collection title -->
      <text x="80" y="160" class="main-title">${displayCollection}</text>
      <text x="80" y="210" class="subtitle">NFT Strategy Analysis</text>
      
      <!-- Trend chart -->
      ${trendChart}
      
      <!-- Metrics -->
      ${metricsElements}
      
      <!-- Logo -->
      <rect x="850" y="80" width="120" height="120" fill="${BRAND_COLOR}"/>
      <text x="910" y="130" font="bold 24px Arial" text-anchor="middle" fill="${ACCENT_COLOR}">NFT</text>
      <text x="910" y="160" font="bold 24px Arial" text-anchor="middle" fill="${ACCENT_COLOR}">STRAT</text>
      
      <!-- Footer -->
      <rect x="0" y="${OG_HEIGHT - 80}" width="${OG_WIDTH}" height="80" fill="rgba(0,0,0,0.05)"/>
      <text x="${OG_WIDTH/2}" y="${OG_HEIGHT - 35}" class="footer">nftstrategy.fun • Real-time NFT Strategy Analysis</text>
      <text x="${OG_WIDTH/2}" y="${OG_HEIGHT - 10}" class="footer-small">Updated ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</text>
    </svg>
  `;
  
  return svg;
}
