import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import SEO from './components/SEO';
import { EnhancedLoadingState } from './components/EnhancedLoadingState';

// Lazy load heavy components
const StrategiesDataTable = lazy(() => import('./components/StrategiesDataTable'));
const StrategyDetailView = lazy(() => import('./components/StrategyDetailView'));
const InfoCards = lazy(() => import('./components/InfoCards'));
const SettingsModal = lazy(() => import('./components/SettingsModal'));
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { createStrategyUrl, createStrategiesUrl, findStrategyByEncodedName } from './utils/urlUtils';
import { posthogService } from './services/posthogService';
import logoLightImage from './assets/NFTPriceFloor_logo_light.png'; // Dark text for light mode
import logoDarkImage from './assets/NFTPriceFloor_logo_dark.png'; // Light text for dark mode
import mobileLogoImage from './assets/nftpf_logo_mobile.png';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  // Extract strategy name from URL path
  const pathParts = location.pathname.split('/');
  const strategyName = pathParts[1]; // /strategy-name
  
  const [selectedStrategy, setSelectedStrategy] = useState(null); // Track selected strategy for detail view
  const [strategies, setStrategies] = useState([]); // Store strategies for URL-based lookup
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // Settings modal state

  // Test PostHog tracking on app load
  useEffect(() => {
    console.log('App: Component mounted');
    
    // Test PostHog tracking on app load
    posthogService.trackEngagementEvent('app_loaded', {
      interactionsCount: 1
    }, {
      timestamp: new Date().toISOString(),
      test_event: true
    });
  }, []);

  // Strategy URL initialization effect - handle strategy routing from URL
  useEffect(() => {
    console.log('🔗 Route changed - strategyName:', strategyName, 'strategies loaded:', strategies.length > 0);
    
    // Clear selected strategy if no strategy in URL
    if (!strategyName) {
      console.log('🔗 No strategy in URL, clearing selected strategy');
      setSelectedStrategy(null);
      return;
    }
    
    // Wait for strategies to load
    if (strategies.length === 0) {
      console.log('🔗 Waiting for strategies to load...');
      return;
    }
    
    console.log('🔗 Initializing strategy from route:', strategyName);
    
    // Find strategy by encoded name
    const strategy = findStrategyByEncodedName(strategies, strategyName);
    if (strategy) {
      console.log('🔗 Found strategy from route:', strategy);
      setSelectedStrategy(strategy);
    } else {
      console.warn('🔗 Strategy not found for route param:', strategyName);
      // If strategy not found, redirect to main root
      setSelectedStrategy(null);
      navigate('/', { replace: true });
    }
  }, [strategyName, strategies, navigate]);

  // Handle strategy selection for detailed view
  const handleStrategySelect = (strategy) => {
    console.log('📊 Strategy selected for detailed view:', strategy);
    
    // Update state first to avoid race conditions
    setSelectedStrategy(strategy);
    
    // Navigate to strategy detail URL
    const strategyUrl = createStrategyUrl(strategy);
    navigate(strategyUrl);
    
    // Track strategy selection analytics
    posthogService.trackStrategyEvent('selected', strategy, {
      source: 'strategy_table',
      navigation_method: 'click'
    });
  };

  // Handle back navigation from strategy detail view
  const handleBackToStrategies = () => {
    console.log('⬅️ Navigating back to main root URL');
    
    // Track back navigation analytics before clearing state
    posthogService.trackStrategyEvent('detail_back', selectedStrategy, {
      source: 'strategy_detail',
      navigation_method: 'back_button'
    });
    
    // Update state first to avoid race conditions
    setSelectedStrategy(null);
    
    // Navigate back to main root URL instead of strategies URL
    navigate('/');
  };

  // Handle strategies data update from StrategiesDataTable
  const handleStrategiesUpdate = (strategiesData) => {
    console.log('📊 Strategies data updated:', strategiesData.length, 'strategies');
    setStrategies(strategiesData);
  };

  return (
    <div className={`relative flex size-full min-h-screen flex-col overflow-x-hidden transition-colors duration-200`} style={{fontFamily: '"Space Grotesk", sans-serif', backgroundColor: isDark ? '#000000' : '#FFF6FB'}}>
      {/* SEO Meta Tags */}
      <SEO 
        strategy={selectedStrategy}
        pageType={selectedStrategy ? 'strategy' : 'dashboard'}
      />
      
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className={`${isDark ? 'bg-black border-gray-800' : 'bg-white'} md:fixed md:top-0 md:left-0 md:right-0 md:z-50 md:shadow-sm md:backdrop-blur-sm w-full overflow-hidden ${isDark ? 'border-b border-gray-800' : ''}`}>
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
            {/* Main header row */}
            <div className="flex items-center justify-between py-4 min-w-0">
              {/* Logo */}
              <div className={`flex items-center ${isDark ? 'text-white' : 'text-black'} flex-shrink-0 mr-2`}>
                <a href="https://nftpricefloor.com" className="inline-block hover:opacity-80 transition-opacity">
                  <img 
                    src={isDark ? logoDarkImage : logoLightImage} 
                    alt="NFT Price Floor Logo" 
                    className="h-8 sm:h-10 lg:h-12"
                  />
                </a>
              </div>
              
              {/* Desktop navigation - Centered */}
              <nav className="hidden md:flex items-center gap-3 lg:gap-6 text-sm font-medium flex-1 justify-center">
                <a href="https://nftpricefloor.com" target="_blank" rel="noopener noreferrer" className={`${isDark ? 'text-gray-400' : 'text-gray-600'} hover:text-[#DD5994] transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-2`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 20h6v-6H2v6zm8-10h6v10h-6V10zm8 4h6v6h-6v-6z"/>
                    <path d="M2 19h6v1H2v-1zm8 1h6v-1h-6v1zm8-3h6v1h-6v-1z"/>
                  </svg>
                  Rankings
                </a>
                <a href="https://nftpricefloor.com/nft-drops" target="_blank" rel="noopener noreferrer" className={`${isDark ? 'text-gray-400' : 'text-gray-600'} hover:text-[#DD5994] transition-colors whitespace-nowrap flex-shrink-0 flex items-center gap-2`}>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L8.5 8.5L2 12l6.5 3.5L12 22l3.5-6.5L22 12l-6.5-3.5L12 2zm0 3.83L14.17 12L12 18.17L9.83 12L12 5.83z"/>
                  </svg>
                  Drops
                </a>
                <button 
                  onClick={() => navigate('/')} 
                  className={`${location.pathname === '/' ? 'text-[#DD5994]' : isDark ? 'text-gray-400' : 'text-gray-600'} hover:text-[#DD5994] font-medium transition-colors cursor-pointer whitespace-nowrap flex-shrink-0`}
                >
                  Strategies™
                </button>
                <div className="relative flex items-center flex-shrink-0 hidden lg:flex">
                  <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'} cursor-not-allowed whitespace-nowrap`}>
                    Compare
                  </span>
                  <span className={`ml-1 text-[10px] ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'} px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap`}>
                    Coming Soon
                  </span>
                </div>
              </nav>
              
              {/* Right side actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Settings Button */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className={`w-9 h-9 flex items-center justify-center rounded ${isDark ? 'bg-gray-800 hover:bg-gray-700 active:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'} transition-all duration-200 hover:scale-105 active:scale-95`}
                  aria-label="Settings"
                >
                  <svg className={`w-4 h-4 ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'} transition-colors`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex flex-1 flex-col py-4 sm:py-8 pb-20 md:pb-8 md:pt-20 w-full overflow-x-hidden">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex flex-col flex-1 min-w-0">
            {/* Breadcrumb Navigation (hidden on mobile) */}
            <nav className={`hidden md:flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-6 mt-4`}>
              <a href="https://nftpricefloor.com" target="_blank" rel="noopener noreferrer" className={`hover:text-[#DD5994] transition-colors`}>
                Home
              </a>
              <span>→</span>
              {selectedStrategy ? (
                <>
                  <button
                    onClick={handleBackToStrategies}
                    className={`hover:text-[#DD5994] transition-colors`}
                  >
                    NFT Strategies
                  </button>
                  <span>→</span>
                  <span className={`${isDark ? 'text-white' : 'text-black'} font-medium`}>
                    {selectedStrategy.collectionName} - {selectedStrategy.tokenName}
                  </span>
                </>
              ) : (
                <span className={`${isDark ? 'text-white' : 'text-black'} font-medium`}>
                  NFT Strategies
                </span>
              )}
            </nav>
            
            {/* Back to Strategies Button (mobile only) */}
            {selectedStrategy && (
              <div className="mb-4 md:hidden">
                <button
                  onClick={handleBackToStrategies}
                  className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'} hover:text-[#DD5994] transition-colors`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Strategies
                </button>
              </div>
            )}
            
            {/* Main Content */}
            <div className="flex flex-1 w-full min-w-0">
              {/* View Header */}
              <div className="w-full min-w-0">
                <div className="mb-3">
                  {selectedStrategy ? (
                    <div>
                      <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'} mb-2 break-words`}>
                        {selectedStrategy.collectionName} - {selectedStrategy.tokenName}
                      </h1>
                    </div>
                  ) : (
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>NFT Strategies</h1>
                  )}
                </div>
                
                {/* Strategies Content */}
                <div className="flex flex-1 flex-col w-full min-w-0">
                  <Suspense fallback={<EnhancedLoadingState />}>
                    {selectedStrategy ? (
                      <StrategyDetailView 
                        strategy={selectedStrategy}
                        onBack={handleBackToStrategies}
                      />
                    ) : (
                      <>
                        {/* Info Cards */}
                        <InfoCards strategies={strategies} />
                        
                        {/* Strategies Table */}
                        <StrategiesDataTable 
                          onStrategySelect={handleStrategySelect}
                          onStrategiesUpdate={handleStrategiesUpdate}
                        />
                      </>
                    )}
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 ${isDark ? 'bg-black border-gray-800' : 'bg-white border-black'} border-t-2 border-solid px-4 py-3 z-[1000000]`} style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center justify-around gap-2">
          <a href="https://nftpricefloor.com" target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'} hover:text-[#DD5994] transition-colors min-w-0`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 20h6v-6H2v6zm8-10h6v10h-6V10zm8 4h6v6h-6v-6z"/>
              <path d="M2 19h6v1H2v-1zm8 1h6v-1h-6v1zm8-3h6v1h-6v-1z"/>
            </svg>
            <span className="text-xs font-medium truncate">Rankings</span>
          </a>
          <a href="https://nftpricefloor.com/nft-drops" target="_blank" rel="noopener noreferrer" className={`flex flex-col items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-600'} hover:text-[#DD5994] transition-colors min-w-0`}>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L8.5 8.5L2 12l6.5 3.5L12 22l3.5-6.5L22 12l-6.5-3.5L12 2zm0 3.83L14.17 12L12 18.17L9.83 12L12 5.83z"/>
            </svg>
            <span className="text-xs font-medium truncate">Drops</span>
          </a>
          <button 
            onClick={() => navigate('/')} 
            className={`flex flex-col items-center gap-1 ${location.pathname === '/' ? 'text-[#DD5994]' : isDark ? 'text-gray-400' : 'text-gray-600'} hover:text-[#DD5994] font-medium transition-colors min-w-0 cursor-pointer`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-medium truncate">Strategies</span>
          </button>
          <div className="flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500 cursor-not-allowed min-w-0 relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium truncate">Compare</span>
              <span className="text-[8px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1 py-0.5 rounded-full font-medium whitespace-nowrap">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Settings Modal */}
      <Suspense fallback={null}>
        <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      </Suspense>
      {/* Footer */}
      <footer className={`${isDark ? 'bg-black border-gray-800' : 'bg-white border-gray-200'} border-t mt-auto w-full overflow-x-hidden`}>
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Company Info */}
            <div className="col-span-1">
              <a href="https://nftpricefloor.com" className="inline-block hover:opacity-80 transition-opacity">
                <img 
                  src={isDark ? logoDarkImage : logoLightImage} 
                  alt="NFT Price Floor Logo" 
                  className="h-8 mb-4"
                />
              </a>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                Track and compare NFT floor prices across all major collections. Get real-time data and historical insights.
              </p>
              <div className="flex space-x-4">
                <a href="https://twitter.com/nftpricefloor" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://discord.gg/nftpricefloor" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </a>
                <a href="https://t.me/nftpricefloor" target="_blank" rel="noopener noreferrer" className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.787L22.952 5.25c.309-1.239-.473-1.8-1.287-1.533z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="col-span-1">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'} text-sm uppercase tracking-wide mb-4`}>Explore</h3>
              <ul className="space-y-3">
                <li><a href="https://nftpricefloor.com" className="text-gray-600 dark:text-gray-400 hover:text-[#DD5994] text-sm transition-colors">Rankings</a></li>
                <li><a href="https://nftpricefloor.com/nft-drops" className="text-gray-600 dark:text-gray-400 hover:text-[#DD5994] text-sm transition-colors">NFT Drops</a></li>
                <li><a href="https://nftpricefloor.com/nft-news" className="text-gray-600 dark:text-gray-400 hover:text-[#DD5994] text-sm transition-colors">Live News</a></li>
                <li><a href="https://nftpricefloor.com/wallet-tracker" className="text-gray-600 dark:text-gray-400 hover:text-[#DD5994] text-sm transition-colors">Wallet Tracker</a></li>
              </ul>
            </div>
            
            {/* Tools */}
            <div className="col-span-1">
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'} text-sm uppercase tracking-wide mb-4`}>More</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#DD5994] text-sm transition-colors">Price Comparison</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#DD5994] text-sm transition-colors">Brokerage</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#DD5994] text-sm transition-colors">API</a></li>
                <li><a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#DD5994] text-sm transition-colors">Ads</a></li>
              </ul>
            </div>
            
          </div>
          
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-gray-600 dark:text-gray-400 text-sm">© 2025 NFTPriceFloor. All rights reserved.</p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#DD5994] text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#DD5994] text-sm transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#DD5994] text-sm transition-colors">Contact</a>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-gray-500 dark:text-gray-400 text-xs">Made with ❤️ for the NFT OGs</p>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Cache Statistics - Development Only */}
      {/* <CacheStats /> */}
    </div>
  );
}

// Main App component wrapped with ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
