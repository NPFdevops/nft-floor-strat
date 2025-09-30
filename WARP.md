# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

NFT Floor Price Compare is a React-based web application that allows users to visually compare floor price charts of two NFT collections side-by-side. The app features a sophisticated database system with local SQLite storage and automated data synchronization, dramatically reducing API calls and improving user experience.

## Common Development Commands

### Development Server
```bash
npm run dev          # Start Vite development server on http://localhost:5173
```

### Build Commands
```bash
npm run build        # Build for production (outputs to dist/)
npm run preview      # Preview production build locally
```

### Database System Management
```bash
# Initial setup (choose timeframe based on needs)
npm run sync:initial    # Interactive setup: 7d/30d/90d/1y/skip options
npm run sync:full-year  # Full methodology: top 250 collections, 1 year data

# Database status and health
npm run db:status       # Check database status and health

# Manual sync operations
npm run sync:manual daily                    # Run full daily sync
npm run sync:manual collections              # Sync collections list only
npm run sync:manual collection cryptopunks  # Sync specific collection (30 days)
npm run sync:manual collection azuki 90     # Sync with custom timeframe
npm run sync:manual status                   # Check sync status
```

### Package Management
```bash
npm install          # Install all dependencies
npm install <package> # Add new dependency
```

### Environment Setup
```bash
cp .env.example .env # Copy environment template
# Edit .env to add your RapidAPI key:
# VITE_RAPIDAPI_KEY=your_rapidapi_key_here
# DATABASE_PATH=./data/nft_floor_data.db (optional)
# DISCORD_WEBHOOK_URL=your_webhook_url (optional)
```

## Architecture Overview

### Database-First Architecture
- **Local SQLite database** for primary data storage with automated sync
- **React 19** with Vite as the build tool
- **Component-based architecture** with clear separation of concerns
- **Multi-layered service architecture** (Database → Local API → External API)
- **State management** via React hooks (no external state library)
- **Background scheduler** for automated data synchronization

### Database System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Local API      │    │   SQLite DB     │
│   (React App)   │◄───│   Service        │◄───│   (Local Data)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                               │
                               │ (Fallback)
                               ▼
                      ┌──────────────────┐
                      │   External API   │
                      │   (Rate Limited) │
                      └──────────────────┘
                               ▲
                               │ (Daily Sync)
                      ┌──────────────────┐
                      │   Sync Service   │
                      │   (Scheduled)    │
                      └──────────────────┘
```

### Key Components
- **App.jsx**: Main application component managing global state (selected collections, layout, loading states)
- **SearchBar.jsx**: Handles collection search with autocomplete functionality and debounced API calls
- **ChartDisplay.jsx**: Renders Chart.js charts for price comparison
- **LayoutToggle.jsx**: Controls horizontal/vertical layout switching
- **ScreenshotShare.jsx**: Provides screenshot capture using html2canvas and URL sharing functionality

### Service Layer Architecture

#### Database Services
- **databaseService.js**: Core SQLite operations (schema, CRUD operations)
- **dataSyncService.js**: Automated data synchronization with external API
- **localAPI.js**: Primary API service that serves from database with external fallback
- **rateLimitManager.js**: Rate limiting and retry logic (respects 16-minute rule)
- **batchingService.js**: Request batching and deduplication
- **collectionsService.js**: Collection management and market cap selection
- **marketCapSelectionService.js**: Advanced collection ranking and selection

#### Frontend API Integration
- **nftAPI.js**: Centralized API client with enhanced functions:
  - `fetchFloorPriceHistory()`: Gets historical price data (database-first)
  - `searchCollections()`: Provides autocomplete suggestions from database
  - `getCurrentFloorPrice()`: Fetches current floor price data
- **cacheService.js**: Enhanced caching layer for API responses

### Data Flow (Database-First)

#### Frontend Data Flow
1. User searches for collections via SearchBar components
2. **localAPI** checks SQLite database first for existing data
3. If data is fresh (< 7 days), serves from database instantly
4. If data is stale/missing, falls back to external API via **nftAPI**
5. App.jsx manages the response data and error states
6. ChartDisplay receives collection data and renders visualizations
7. Layout and sharing controls operate on the rendered chart container

#### Background Sync Flow
1. **Daily scheduler** runs at 2:00 AM UTC
2. **dataSyncService** fetches top 250 collections rankings
3. **rateLimitManager** enforces 16-minute intervals between API calls
4. **batchingService** optimizes requests and handles deduplication
5. New price data is stored in **SQLite database**
6. Old data (> 1 year) is automatically cleaned up

### State Management Pattern
The app uses a centralized state pattern where App.jsx maintains:
- `collection1` and `collection2`: Selected collection data objects
- `layout`: Current display layout ('horizontal' or 'vertical')
- `loading`: Loading states for each collection API call
- `error`: Error states for failed API requests

### API Integration Notes
- **RapidAPI Integration**: Uses `nftpf-api-v0.p.rapidapi.com` via RapidAPI
- **Authentication**: Requires `VITE_RAPIDAPI_KEY` environment variable
- **Endpoint Pattern**: `/projects/{slug}/history/pricefloor/{granularity}?start={timestamp}&end={timestamp}`
- **Response Format**: Returns arrays of timestamps, floorEth, floorUsd, volumeEth, volumeUsd, salesCount
- **Search Functionality**: Uses predefined list of common NFT collections for autocomplete
- **Current Price**: Derived from latest historical data point
- All API functions return consistent response objects with `success` boolean and error handling
- Default history fetch is 30 days with '1d' granularity, but can be customized

### Dependencies

#### Core Application
- **React 19** with **Vite 6.x** for build system
- **Chart visualization**: lightweight-charts (TradingView charts)
- **HTTP client**: axios for API requests
- **Date handling**: date-fns for date manipulation and formatting
- **Screenshot functionality**: html2canvas for image capture
- **URL routing**: react-router-dom for shareable URL parameters

#### Database System
- **Database**: better-sqlite3 for local SQLite operations
- **Scheduling**: node-cron for automated daily sync (2:00 AM UTC)
- **Data processing**: Enhanced services for batching, rate limiting, and sync management

## Development Patterns

### Database-First Development
Always prioritize local database over external API calls. The system is designed to serve 90%+ of requests from local SQLite database, reducing API calls and improving performance.

### Rate Limiting Adherence
The system strictly adheres to the **16-minute interval rule** between API calls to the NFTPriceFloor API. This is implemented in `rateLimitManager.js` with progressive backoff (1s → 2s → 5s → 10s → 30s).

### Error Handling
All API calls follow a consistent error handling pattern returning objects with `success`, `error`, and `data` properties. Database operations include transaction rollback and retry logic. UI components display errors inline near related inputs.

### Data Synchronization
- **Daily automated sync** at 2:00 AM UTC for top 250 collections
- **Rolling 1-year window** with automatic cleanup of old data
- **Resumable sync operations** with progress tracking and batching
- **Health monitoring** with comprehensive status reporting

### Loading States
Loading states are managed per collection to allow independent loading indicators. Enhanced loading states show database vs API data source. The UI shows spinners and disables inputs during API calls.

### Responsive Design
The application uses CSS Grid and Flexbox with a toggle between horizontal (side-by-side) and vertical (stacked) chart layouts. All components are mobile-responsive with Apple HIG compliance.

### Search UX
Search bars implement debounced autocomplete with suggestion dropdowns served from local database, direct slug input fallback, and clear/remove functionality.

### URL Sharing
The application implements URL-based state sharing for enhanced user experience:
- **URL Parameters**: Collections and timeframe are encoded in URL query parameters (`c1`, `c2`, `t`, `layout`)
- **Shareable Links**: Users can share URLs that automatically load specific collection comparisons
- **URL Synchronization**: App state changes are reflected in the URL in real-time for browser history support
- **Deep Linking**: Direct links to specific comparisons work on page load
- **Share Functionality**: Multiple sharing options including URL copying, native share API, and screenshot sharing

🎯 Consistent Brutalist Design System
All components now follow the same design pattern:
•  Black borders (border-2 border-black)
•  Sharp corners (rounded-none)
•  Drop shadows (shadow-[4px_4px_0px_#000000])
•  Accent color backgrounds for selected states (bg-[var(--accent-color)])
•  Hover animations (hover:scale-105)

📱 Mobile-First Improvements

TimeframeSelector
•  Responsive Design: Mobile gets larger touch targets (h-12) and full-width grid
•  Brutalist Style: Now matches the app's black borders and shadow system
•  Haptic Feedback: Subtle vibrations on mobile interactions
•  Better Typography: Consistent font weights and sizing

LayoutToggle 
•  Enhanced Mobile: Larger buttons with icons (view_column/view_agenda)
•  Visual Hierarchy: Clear labels and better spacing
•  Icon Integration: Material symbols for better usability
•  Touch Targets: 44px minimum touch targets following Apple HIG

ScreenshotShare
•  Action Sheet Pattern: Native iOS-style bottom sheet for mobile
•  Native Sharing: Uses Web Share API when available
•  Toast Notifications: Non-intrusive feedback instead of alerts  
•  Device Pixel Ratio: High-quality screenshots on retina displays
•  Haptic Feedback: Success/error vibrations

ApplyButton
•  Consistent Height: Now h-10 to match other buttons
•  Shadow System: Proper drop shadows including disabled state
•  Mobile Feedback: Haptic response for successful interactions

🍎 Apple Human Interface Guidelines Compliance

•  44px minimum touch targets for all interactive elements
•  Haptic feedback for user interactions
•  Native sharing patterns with Web Share API
•  Smooth animations with easing functions
•  Action sheets for mobile-appropriate interactions
•  Toast notifications instead of disruptive alerts
•  Safe area support for notched devices
•  Dark mode considerations in CSS
•  Reduced motion support for accessibility

🎨 Visual Enhancements

•  Unified Design Language: All components now share the same visual DNA
•  Better Mobile Spacing: Optimized for thumb navigation
•  Enhanced Icons: Material symbols for better recognition
•  Consistent Animations: Unified hover and press states
•  Improved Typography: Better contrast and readability

The mobile experience now feels native and professional while maintaining the distinctive brutalist aesthetic of your desktop interface! 📱✨

## Important Development Rules

### Database and API Management
- **NEVER create mock data under any circumstances** - The user has handled the subscription problem and prefers to keep the prior API configuration for historical data
- **Respect the 16-minute interval rule** for NFTPriceFloor API calls to handle Tweepy client rate limits and tweeting frequency
- **Database-first approach** - Always check local SQLite database before making external API calls
- **No Chart.js dependency** - The project has migrated to lightweight-charts (TradingView charts)

### File Structure Overview
```
src/
├── services/              # Database and API services (9 files)
│   ├── databaseService.js      # Core SQLite operations
│   ├── dataSyncService.js      # Daily sync service
│   ├── localAPI.js             # Database-first API service
│   ├── rateLimitManager.js     # 16-minute rule enforcement
│   ├── batchingService.js      # Request optimization
│   ├── collectionsService.js   # Collection management
│   ├── marketCapSelectionService.js  # Advanced selection
│   ├── nftAPI.js              # External API client
│   └── cacheService.js        # Enhanced caching
├── scheduler/
│   └── dailySync.js           # Automated 2AM UTC sync
├── scripts/                   # Database management utilities
│   ├── initialSetup.js        # Interactive setup wizard
│   ├── manualSync.js          # Manual sync operations
│   ├── fullYearSync.js        # Complete 1-year data setup
│   └── dbStatus.js           # Health monitoring
├── components/               # React components (14+ files)
└── utils/                    # Date and URL utilities

database/
└── schema.sql               # SQLite database schema

data/
└── nft_floor_data.db        # SQLite database (auto-generated)
```

### Database Troubleshooting

#### Quick Diagnostics
```bash
npm run db:status           # Check overall database health
npm run sync:manual status  # Check sync service status
npm run sync:manual daily   # Force a complete sync
```

#### Common Issues
- **Charts not loading**: Check database with `npm run db:status`
- **API rate limits**: Verify 16-minute intervals in rate limit manager
- **Stale data**: Run `npm run sync:manual collection <slug>` for specific collections
- **Database corruption**: Delete `data/nft_floor_data.db` and run `npm run sync:initial`

#### Performance Monitoring
- **Database size**: Maintained automatically at ~1GB for 250 collections × 1 year
- **API call reduction**: Should achieve 90%+ local database serving
- **Sync performance**: Daily sync should complete within 2-4 hours
- **Memory usage**: SQLite operations are optimized with prepared statements
