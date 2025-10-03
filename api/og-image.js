import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

/**
 * Generate dynamic OpenGraph images for NFT strategies
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

    // Create canvas
    const canvas = createCanvas(OG_WIDTH, OG_HEIGHT);
    const ctx = canvas.getContext('2d');

    // Clear canvas with background
    ctx.fillStyle = BACKGROUND_COLOR;
    ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

    // Add brand gradient background
    const gradient = ctx.createLinearGradient(0, 0, OG_WIDTH, OG_HEIGHT);
    gradient.addColorStop(0, 'rgba(255, 170, 221, 0.1)');
    gradient.addColorStop(1, 'rgba(255, 170, 221, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

    // Add decorative elements
    drawDecorativeElements(ctx);

    if (type === 'dashboard') {
      drawDashboardContent(ctx);
    } else {
      drawStrategyContent(ctx, {
        collection,
        returnPercent,
        value,
        floor
      });
    }

    // Add footer branding
    drawFooter(ctx);

    // Convert to buffer and send
    const buffer = canvas.toBuffer('image/png');
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(buffer);

  } catch (error) {
    console.error('Error generating OG image:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
}

function drawDecorativeElements(ctx) {
  // Add subtle geometric patterns
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.strokeStyle = BRAND_COLOR;
  ctx.lineWidth = 2;

  // Draw decorative lines and shapes
  for (let i = 0; i < 3; i++) {
    const y = 150 + (i * 100);
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(150, y);
    ctx.stroke();
  }

  // Add circles
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(1050 + (i * 30), 100 + (i * 20), 8, 0, 2 * Math.PI);
    ctx.stroke();
  }

  ctx.restore();
}

function drawDashboardContent(ctx) {
  // Main title
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('NFT Strategy', 80, 180);
  
  ctx.font = 'bold 64px Arial, sans-serif';
  ctx.fillText('Dashboard', 80, 260);

  // Subtitle
  ctx.font = '32px Arial, sans-serif';
  ctx.fillStyle = '#666666';
  ctx.fillText('Comprehensive strategy analysis', 80, 320);
  ctx.fillText('& performance tracking', 80, 360);

  // Feature highlights
  const features = [
    '📊 Real-time Data',
    '📈 Performance Metrics', 
    '⚡ Interactive Charts',
    '🎯 Strategy Comparison'
  ];

  ctx.font = '24px Arial, sans-serif';
  ctx.fillStyle = TEXT_COLOR;
  
  features.forEach((feature, index) => {
    const x = 80 + (index % 2) * 300;
    const y = 450 + Math.floor(index / 2) * 40;
    ctx.fillText(feature, x, y);
  });

  // Add logo placeholder
  drawLogoPlaceholder(ctx, 850, 120);
}

function drawStrategyContent(ctx, { collection, returnPercent, value, floor }) {
  // Collection name (main title)
  ctx.fillStyle = TEXT_COLOR;
  ctx.font = 'bold 56px Arial, sans-serif';
  ctx.textAlign = 'left';
  
  // Truncate long collection names
  const maxLength = 20;
  const displayCollection = collection.length > maxLength 
    ? collection.substring(0, maxLength) + '...' 
    : collection;
  
  ctx.fillText(displayCollection, 80, 160);
  
  // Strategy subtitle
  ctx.font = '32px Arial, sans-serif';
  ctx.fillStyle = '#666666';
  ctx.fillText('NFT Strategy Analysis', 80, 210);

  // Performance metrics container
  if (returnPercent || value || floor) {
    drawMetricsContainer(ctx, { returnPercent, value, floor });
  }

  // Add trend visualization
  drawTrendChart(ctx, returnPercent);
  
  // Add logo
  drawLogoPlaceholder(ctx, 850, 80);
}

function drawMetricsContainer(ctx, { returnPercent, value, floor }) {
  // Container background
  ctx.fillStyle = 'rgba(255, 170, 221, 0.15)';
  ctx.fillRect(80, 280, 1040, 180);
  
  // Container border
  ctx.strokeStyle = BRAND_COLOR;
  ctx.lineWidth = 3;
  ctx.strokeRect(80, 280, 1040, 180);

  // Metrics
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

  // Draw metrics
  const metricsPerRow = Math.min(metrics.length, 3);
  const metricWidth = 1040 / metricsPerRow;
  
  metrics.forEach((metric, index) => {
    const x = 80 + (index * metricWidth) + (metricWidth / 2);
    const y = 330;
    
    // Label
    ctx.font = '20px Arial, sans-serif';
    ctx.fillStyle = '#666666';
    ctx.textAlign = 'center';
    ctx.fillText(metric.label, x, y);
    
    // Value
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.fillStyle = metric.color;
    ctx.fillText(metric.value, x, y + 50);
  });
}

function drawTrendChart(ctx, returnPercent) {
  if (!returnPercent) return;

  const isPositive = parseFloat(returnPercent) >= 0;
  const chartX = 650;
  const chartY = 120;
  const chartWidth = 160;
  const chartHeight = 60;

  // Simple trend line
  ctx.strokeStyle = isPositive ? '#22c55e' : '#ef4444';
  ctx.lineWidth = 4;
  ctx.beginPath();
  
  const points = 8;
  const trend = isPositive ? 1 : -1;
  
  for (let i = 0; i < points; i++) {
    const x = chartX + (i * (chartWidth / (points - 1)));
    const baseY = chartY + chartHeight / 2;
    const variation = (Math.random() - 0.5) * 20;
    const trendOffset = (i / points) * trend * 30;
    const y = baseY + variation + trendOffset;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
  
  ctx.stroke();
}

function drawLogoPlaceholder(ctx, x, y) {
  // Logo container
  const logoSize = 120;
  ctx.fillStyle = BRAND_COLOR;
  ctx.fillRect(x, y, logoSize, logoSize);
  
  // Logo text
  ctx.fillStyle = ACCENT_COLOR;
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NFT', x + logoSize/2, y + logoSize/2 - 10);
  ctx.fillText('STRAT', x + logoSize/2, y + logoSize/2 + 20);
}

function drawFooter(ctx) {
  // Footer background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
  ctx.fillRect(0, OG_HEIGHT - 80, OG_WIDTH, 80);
  
  // Footer text
  ctx.fillStyle = '#666666';
  ctx.font = '18px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('nftstrategy.fun • Real-time NFT Strategy Analysis', OG_WIDTH/2, OG_HEIGHT - 35);
  
  // Add timestamp
  const now = new Date();
  const timeString = now.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  ctx.font = '14px Arial, sans-serif';
  ctx.fillStyle = '#999999';
  ctx.fillText(`Updated ${timeString}`, OG_WIDTH/2, OG_HEIGHT - 10);
}