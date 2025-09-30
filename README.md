# NFT Strategies Dashboard 📊

A React-based web application that provides comprehensive NFT strategy analysis and performance tracking. The app features detailed strategy insights, performance metrics, and interactive charts to help users make informed NFT investment decisions.

![NFT Strategies App](https://img.shields.io/badge/React-19-blue) ![Vite](https://img.shields.io/badge/Vite-5.0-green) ![Chart.js](https://img.shields.io/badge/Chart.js-4.0-red)

## ✨ Features

- **📈 Strategy Performance Tracking**: Comprehensive analysis of NFT investment strategies
- **📱 Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **🎯 Smart Navigation**: Intuitive interface with strategy-focused navigation
- **📊 Interactive Charts**: Detailed TradingView-style charts for strategy visualization
- **📋 Strategy Data Table**: Sortable and searchable strategy performance metrics
- **🔍 Strategy Search**: Find and analyze specific NFT strategies
- **💾 Smart Caching**: Optimized API calls with intelligent caching
- **⚡ Real-time Data**: Live strategy performance data and analytics

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 5.x
- **Charts**: Chart.js with react-chartjs-2
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Hooks
- **Routing**: React Router DOM
- **Build Tool**: Vite
- **Deployment**: Vercel

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- RapidAPI account with NFT Price Floor API access

### 1. Clone the Repository

```bash
git clone https://github.com/NPFdevops/nft-floor-compare.git
cd nft-floor-compare
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit .env and add your RapidAPI credentials
VITE_RAPIDAPI_KEY=your_rapidapi_key_here
VITE_RAPIDAPI_HOST=nftpf-api-v0.p.rapidapi.com
```

**Getting RapidAPI Credentials:**
1. Sign up at [RapidAPI](https://rapidapi.com)
2. Subscribe to [NFT Price Floor API](https://rapidapi.com/nftpf-api-v0.p.rapidapi.com)
3. Get your API key from the dashboard

### 4. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173) to view the app.

### 5. Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

#### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard or via CLI
vercel env add VITE_RAPIDAPI_KEY
vercel env add VITE_RAPIDAPI_HOST
```

#### Method 2: Vercel Dashboard
1. Connect your GitHub repository to Vercel
2. Import the project
3. **⚠️ CRITICAL**: Add environment variables in Vercel dashboard:
   - `VITE_RAPIDAPI_KEY`: Your RapidAPI key
   - `VITE_RAPIDAPI_HOST`: `nftpf-api-v0.p.rapidapi.com`
4. Deploy

**Environment Variables Setup in Vercel:**
1. Go to your project dashboard
2. Navigate to Settings → Environment Variables
3. Add both variables for all environments (Production, Preview, Development)

### Other Deployment Platforms

#### Netlify
```bash
# Build command
npm run build

# Publish directory
dist

# Environment variables (in Netlify dashboard)
VITE_RAPIDAPI_KEY=your_key
VITE_RAPIDAPI_HOST=nftpf-api-v0.p.rapidapi.com
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_RAPIDAPI_KEY` | Your RapidAPI key for NFT Price Floor API | ✅ Yes | - |
| `VITE_RAPIDAPI_HOST` | RapidAPI host domain | ✅ Yes | `nftpf-api-v0.p.rapidapi.com` |

### API Configuration

The app uses the NFT Price Floor API through RapidAPI:
- **Endpoint Pattern**: `/projects/{slug}/history/pricefloor/{granularity}`
- **Supported Granularities**: `1d`, `1h`, `30m`
- **Date Range**: Configurable start/end timestamps
- **Response Format**: Arrays of timestamps, floorEth, floorUsd, volume data

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── SearchBar.jsx    # Collection search with autocomplete
│   ├── ChartDisplay.jsx # Chart rendering with Chart.js
│   ├── LayoutToggle.jsx # Horizontal/vertical layout switcher
│   ├── TimeframeSelector.jsx # Date range selection
│   ├── ApplyButton.jsx  # Apply changes button
│   └── ScreenshotShare.jsx # Screenshot and sharing
├── services/            # API and caching services
│   ├── nftAPI.js       # Main API service
│   └── cacheService.js # Smart caching layer
├── utils/              # Utility functions
│   ├── dateUtils.js    # Date manipulation helpers
│   └── urlUtils.js     # URL parameter handling
├── data/               # Static data
│   └── collections.js  # Top NFT collections list
└── assets/             # Images and static files
    ├── NFTPriceFloor_logo.png
    └── nftpf_logo_mobile.png
```

## 🐛 Troubleshooting

### Common Issues

#### "Network Error" in Production

**Symptoms**: API calls fail with network errors on deployment

**Solutions**:
1. **Check Environment Variables**: Ensure `VITE_RAPIDAPI_KEY` and `VITE_RAPIDAPI_HOST` are set in your deployment platform
2. **Verify API Key**: Test your RapidAPI key in Postman or curl
3. **Check API Subscription**: Ensure your RapidAPI subscription is active
4. **Review Browser Console**: Check for CORS or authentication errors

```bash
# Test API key locally
curl -H "X-RapidAPI-Key: YOUR_KEY" \
     -H "X-RapidAPI-Host: nftpf-api-v0.p.rapidapi.com" \
     "https://nftpf-api-v0.p.rapidapi.com/projects/azuki/history/pricefloor/1d"
```

#### Environment Variables Not Loading

**Vercel**:
- Variables must be prefixed with `VITE_`
- Add to all environments (Production, Preview, Development)
- Redeploy after adding variables

**Local Development**:
- Ensure `.env` file is in project root
- Restart development server after changes
- Check `.env` is not in `.gitignore`

#### Chart Not Rendering

**Check**:
- API response format in browser console
- Date/timestamp formatting
- Chart.js version compatibility

### Debug Mode

Enable detailed logging by opening browser console. The app logs:
- API requests and responses
- Cache hits/misses
- Environment variable validation
- Error details with suggestions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NFT Price Floor API](https://rapidapi.com/nftpf-api-v0.p.rapidapi.com) for providing NFT data
- [Chart.js](https://www.chartjs.org/) for excellent charting capabilities
- [React](https://reactjs.org/) and [Vite](https://vitejs.dev/) for the development experience

## 📞 Support

If you encounter any issues:

1. Check the [Troubleshooting](#-troubleshooting) section
2. Review browser console for error messages
3. Verify environment variables are correctly set
4. Open an issue on GitHub with:
   - Error description
   - Browser console logs
   - Deployment platform
   - Steps to reproduce

---

**Made with ❤️ for the NFT community**
