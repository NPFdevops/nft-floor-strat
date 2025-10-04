# NFT Table Styles Integration Guide

This guide will help you extract and use the NFT table CSS from your v0_front_nftpf-main project in another project.

## 📁 Files Created for You

1. **`nft-table-styles-extracted.css`** - Complete CSS file with all table styles
2. **`nft-table-integration-guide.md`** - This integration guide (you're reading it now)

## 🚀 Quick Start Integration

### Step 1: Copy the CSS File

```bash
# Copy the extracted CSS file to your new project
cp /Users/david/nft-table-styles-extracted.css /path/to/your/new/project/src/styles/
```

### Step 2: Install Dependencies

Your new project will need these dependencies:

```bash
# Core dependencies
npm install tailwindcss
npm install @fontsource/dm-sans

# If you want to use the React components as well
npm install lucide-react
npm install class-variance-authority
npm install clsx
npm install tailwind-merge
```

### Step 3: Import Styles

Add to your main CSS file or component:

```css
/* In your main CSS file (e.g., globals.css or index.css) */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
@import './nft-table-styles-extracted.css';
```

Or import the font via npm:

```javascript
// In your main component or layout
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import './path/to/nft-table-styles-extracted.css';
```

## 🎨 Using the Styles

### Basic HTML Table Structure

```html
<div class="overflow-x-auto">
  <table class="nftpf-table">
    <thead>
      <tr>
        <th class="nft-sticky-left">#</th>
        <th>Collection</th>
        <th>Floor Price</th>
        <th>24h %</th>
        <th>Volume</th>
        <th>Sales</th>
      </tr>
    </thead>
    <tbody>
      <tr class="nftpf-row-hover">
        <td class="nft-sticky-left">1</td>
        <td>
          <div class="flex items-center gap-3">
            <div class="nft-image-container">
              <img src="collection-image.jpg" alt="Collection" class="nft-image" />
            </div>
            <a href="#" class="nft-collection-link">Collection Name</a>
          </div>
        </td>
        <td>
          <div class="nft-weight-medium">5.2 ETH</div>
          <div class="nft-text-small text-muted-foreground">$12,450</div>
        </td>
        <td class="nft-price-positive">+2.5%</td>
        <td class="nft-weight-medium">125 ETH</td>
        <td>42</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Card-Based Table (Alternative Style)

```html
<!-- Header -->
<div class="nft-header-card">
  <table class="w-full">
    <thead>
      <tr class="h-10">
        <th class="nft-spacing-normal">#</th>
        <th class="nft-spacing-normal">Collection</th>
        <th class="nft-spacing-normal">Floor</th>
        <!-- Add more headers as needed -->
      </tr>
    </thead>
  </table>
</div>

<!-- Row Cards -->
<div class="space-y-2">
  <div class="nft-row-card">
    <table class="w-full nft-collection-table">
      <tbody>
        <tr>
          <td class="w-20 nft-sticky-left nft-spacing-normal text-center">1</td>
          <td class="w-32 nft-spacing-tight">Collection Name</td>
          <td class="w-24 nft-spacing-tight text-right">5.2 ETH</td>
          <!-- Add more cells as needed -->
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

## 🎯 Key CSS Classes Reference

### Table Structure
- `.nftpf-table` - Main table container
- `.nftpf-row-hover` - Row with hover effects
- `.nft-sticky-left` - Sticky left column
- `.nft-collection-table` - Collection-specific table styling

### Card-Based Design
- `.nft-row-card` - Individual row card
- `.nft-header-card` - Header card styling

### Typography & Colors
- `.nft-collection-link` - Pink collection name links
- `.nft-price-positive` - Green price changes (+)
- `.nft-price-negative` - Red price changes (-)
- `.nft-price-neutral` - Gray neutral prices
- `.nftpf-gradient-text` - Pink-to-purple gradient text

### Components
- `.nft-image-container` - NFT image wrapper
- `.nft-image` - NFT image styling
- `.nft-blockchain-badge` - Blockchain badge
- `.nft-star-button` - Favorite star button
- `.nft-action-button` - Buy/sell action buttons

### Utilities
- `.hide-scrollbar` - Hide scrollbars while keeping scroll
- `.nft-text-small/base/large` - Font sizes
- `.nft-weight-normal/medium/bold` - Font weights
- `.nft-spacing-tight/normal/loose` - Padding utilities

## 🔧 Tailwind CSS Configuration

If you're using Tailwind, add this to your `tailwind.config.js`:

```javascript
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    // ... your other paths
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "hsl(339 100% 55%)",
          foreground: "hsl(0 0% 98%)",
        },
        background: "hsl(331 100% 96%)",
        foreground: "hsl(0 0% 3.9%)",
        muted: {
          DEFAULT: "hsl(210 40% 96%)",
          foreground: "hsl(215.4 16.3% 46.9%)",
        },
        border: "hsl(0 0% 0%)",
      },
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

## ⚛️ React Component Example

Here's how to create a React component using these styles:

```jsx
import React from 'react';
import './nft-table-styles-extracted.css';

const NFTTable = ({ collections = [] }) => {
  return (
    <div className="overflow-x-auto">
      <table className="nftpf-table">
        <thead>
          <tr>
            <th className="nft-sticky-left">#</th>
            <th>Collection</th>
            <th>Floor Price</th>
            <th>24h %</th>
            <th>Volume</th>
          </tr>
        </thead>
        <tbody>
          {collections.map((collection, index) => (
            <tr key={collection.id} className="nftpf-row-hover">
              <td className="nft-sticky-left">{index + 1}</td>
              <td>
                <div className="flex items-center gap-3">
                  <div className="nft-image-container">
                    <img 
                      src={collection.image} 
                      alt={collection.name}
                      className="nft-image" 
                    />
                  </div>
                  <a href={`/collection/${collection.id}`} className="nft-collection-link">
                    {collection.name}
                  </a>
                </div>
              </td>
              <td>
                <div className="nft-weight-medium">{collection.floorPrice}</div>
                <div className="nft-text-small text-muted-foreground">
                  {collection.floorPriceUsd}
                </div>
              </td>
              <td className={collection.change24h.startsWith('-') ? 'nft-price-negative' : 'nft-price-positive'}>
                {collection.change24h}
              </td>
              <td className="nft-weight-medium">{collection.volume24h}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NFTTable;
```

## 🎨 Customization Options

### Color Scheme Customization

To change the pink theme to another color, modify these CSS variables:

```css
:root {
  /* Change primary color (pink to blue example) */
  --primary: 217 91% 60%;  /* Blue instead of pink */
  --ring: 217 91% 60%;
  
  /* Change background tint */
  --background: 217 100% 96%;  /* Light blue background */
}
```

### Font Family Change

```css
body {
  font-family: 'Inter', sans-serif; /* Instead of DM Sans */
}

.nft-collection-table {
  font-family: 'Inter', sans-serif;
}
```

### Remove Card Shadow Effects

```css
.nft-row-card,
.nft-header-card {
  box-shadow: none;
  border: 1px solid #e5e7eb;
}
```

## 📱 Mobile Responsiveness

The styles include responsive breakpoints:

- **Mobile (< 640px)**: Smaller padding, compact text
- **Tablet (640px - 768px)**: Medium spacing
- **Desktop (> 768px)**: Full spacing and features

Key responsive classes are automatically applied, but you can override them:

```css
@media (max-width: 640px) {
  .nftpf-table th,
  .nftpf-table td {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
  }
}
```

## ♿ Accessibility Features

The extracted styles include:

- Screen reader support with `.sr-only` class
- Focus indicators for keyboard navigation
- High contrast mode support
- Reduced motion preferences
- Proper ARIA label styling
- Color contrast compliance

## 🚀 Advanced Integration

### With a CSS-in-JS Solution (styled-components example)

```jsx
import styled from 'styled-components';

const StyledTable = styled.table`
  width: 100%;
  caption-side: bottom;
  font-size: 0.875rem;
  border-spacing: 0;
  border-collapse: separate;
  
  thead {
    position: sticky;
    top: 0;
    z-index: 20;
    background-color: #ffffff;
    border-bottom: 1px solid #e5e7eb;
  }
  
  /* Include other styles from the extracted CSS */
`;
```

### With CSS Modules

```css
/* styles.module.css */
.table {
  composes: nftpf-table from './nft-table-styles-extracted.css';
}

.rowHover {
  composes: nftpf-row-hover from './nft-table-styles-extracted.css';
}
```

## 🔍 Testing Your Integration

1. **Visual Check**: Compare your new implementation with the original
2. **Responsive Test**: Test on different screen sizes
3. **Accessibility Test**: Use screen readers and keyboard navigation
4. **Performance Check**: Ensure styles don't cause layout shifts

## 📞 Troubleshooting

### Common Issues:

1. **Fonts not loading**: Make sure DM Sans is properly imported
2. **Colors not showing**: Check CSS custom properties are defined
3. **Responsive issues**: Verify Tailwind CSS is properly configured
4. **Hover effects not working**: Ensure JavaScript event handlers are attached

### Debug Steps:

1. Check browser console for CSS errors
2. Verify all CSS files are properly imported
3. Inspect elements to see if classes are applied
4. Test in different browsers

## 🎯 Next Steps

1. **Copy the CSS file** to your new project
2. **Set up the font imports** (DM Sans)
3. **Configure Tailwind** (if using)
4. **Test with sample data** 
5. **Customize colors/spacing** as needed
6. **Add your own data binding**

The extracted styles give you everything you need to recreate the beautiful NFT table design in your new project! 🚀