import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StrategiesDataTable from './components/StrategiesDataTable';
import StrategyDetailView from './components/StrategyDetailView';
import InfoCards from './components/InfoCards';
import { createStrategyUrl, createStrategiesUrl, findStrategyByEncodedName } from './utils/urlUtils';
import { posthogService } from './services/posthogService';
import logoImage from './assets/NFTPriceFloor_logo.png';
import mobileLogoImage from './assets/nftpf_logo_mobile.png';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Extract strategy name from URL path
  const pathParts = location.pathname.split('/');
  const strategyName = pathParts[2]; // /nftstrategies/strategy-name
  
  const [selectedStrategy, setSelectedStrategy] = useState(null); // Track selected strategy for detail view
  const [strategies, setStrategies] = useState([]); // Store strategies for URL-based lookup

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
      // If strategy not found, redirect to strategies list
      setSelectedStrategy(null);
      navigate('/nftstrategies', { replace: true });
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
    console.log('⬅️ Navigating back to strategies list');
    
    // Track back navigation analytics before clearing state
    posthogService.trackStrategyEvent('detail_back', selectedStrategy, {
      source: 'strategy_detail',
      navigation_method: 'back_button'
    });
    
    // Update state first to avoid race conditions
    setSelectedStrategy(null);
    
    // Navigate back to strategies list URL
    const strategiesUrl = createStrategiesUrl();
    navigate(strategiesUrl);
  };

  // Handle strategies data update from StrategiesDataTable
  const handleStrategiesUpdate = (strategiesData) => {
    console.log('📊 Strategies data updated:', strategiesData.length, 'strategies');
    setStrategies(strategiesData);
  };

  return (
    <div className="relative flex size-full min-h-screen flex-col" style={{fontFamily: '"Space Grotesk", sans-serif', backgroundColor: '#FFF6FB'}}>
      <div className="layout-container flex h-full grow flex-col">
        {/* Header */}
        <header className="flex items-center justify-center whitespace-nowrap py-4 relative bg-white">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 flex items-center justify-between">
            {/* Logo positioned on the left */}
            <div className="flex items-center gap-2 sm:gap-3 text-black">
              <img 
                src={logoImage} 
                alt="NFT Price Floor Logo" 
                className="h-8 sm:h-10 lg:h-12" 
              />
            </div>
            {/* Centered navigation for desktop */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium absolute left-1/2 transform -translate-x-1/2">
              <a href="https://nftpricefloor.com" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors">
                Rankings
              </a>
              <a href="https://nftpricefloor.com/nft-drops" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-black transition-colors">
                Drops
              </a>
              <button 
                onClick={() => navigate('/nftstrategies')} 
                className="text-black font-medium transition-colors cursor-pointer"
              >
                Strategies™
              </button>
              <div className="relative flex items-center">
                <span className="text-gray-400 cursor-not-allowed">
                  Compare
                </span>
                <span className="ml-1 text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">
                  Coming Soon
                </span>
              </div>
            </nav>
          </div>
        </header>
        
        {/* Main Content */}
        <div className="flex flex-1 flex-col py-4 sm:py-8 pb-20 md:pb-8">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 flex flex-col flex-1">
            {/* Breadcrumb Navigation (hidden on mobile) */}
            <nav className="hidden md:flex items-center gap-2 text-sm text-gray-600 mb-6">
              <a href="https://nftpricefloor.com" target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">
                Home
              </a>
              <span>-</span>
              {selectedStrategy ? (
                <>
                  <button
                    onClick={handleBackToStrategies}
                    className="hover:text-black transition-colors"
                  >
                    NFT Strategies
                  </button>
                  <span>-</span>
                  <span className="text-black font-medium">
                    {selectedStrategy.collectionName}
                  </span>
                </>
              ) : (
                <span className="text-black font-medium">
                  NFT Strategies
                </span>
              )}
            </nav>
            
            {/* Back to Strategies Button */}
            {selectedStrategy && (
              <div className="mb-4">
                <button
                  onClick={handleBackToStrategies}
                  className="flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Strategies
                </button>
              </div>
            )}
            
            {/* Main Content */}
            <div className="flex flex-1">
              {/* View Header */}
              <div className="w-full">
                <div className="mb-6">
                  {selectedStrategy ? (
                    <div>
                      <h1 className="text-2xl font-bold text-black mb-2">
                        {selectedStrategy.collectionName}
                      </h1>
                    </div>
                  ) : (
                    <h1 className="text-2xl font-bold text-black">NFT Strategies</h1>
                  )}
                </div>
                
                {/* Strategies Content */}
                <div className="flex flex-1 flex-col">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-solid border-black px-4 py-3 z-[1000000]" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex items-center justify-around gap-2">
          <a href="https://nftpricefloor.com" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-gray-600 hover:text-black transition-colors min-w-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium truncate">Rankings</span>
          </a>
          <a href="https://nftpricefloor.com/nft-drops" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 text-gray-600 hover:text-black transition-colors min-w-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <span className="text-xs font-medium truncate">Drops</span>
          </a>
          <button 
            onClick={() => navigate('/nftstrategies')} 
            className="flex flex-col items-center gap-1 text-black font-medium transition-colors min-w-0 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span className="text-xs font-medium truncate">Strategies</span>
          </button>
          <div className="flex flex-col items-center gap-1 text-gray-400 cursor-not-allowed min-w-0 relative">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium truncate">Compare</span>
              <span className="text-[8px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded-full font-medium whitespace-nowrap">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-10 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="col-span-1">
              <img 
                src={logoImage} 
                alt="NFT Price Floor Logo" 
                className="h-8 mb-4" 
              />
              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                Track and compare NFT floor prices across all major collections. Get real-time data and historical insights.
              </p>
              <div className="flex space-x-4">
                <a href="https://twitter.com/nftpricefloor" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://discord.gg/nftpricefloor" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </a>
                <a href="https://t.me/nftpricefloor" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.787L22.952 5.25c.309-1.239-.473-1.8-1.287-1.533z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="col-span-1">
              <h3 className="font-semibold text-black text-sm uppercase tracking-wide mb-4">Explore</h3>
              <ul className="space-y-3">
                <li><a href="https://nftpricefloor.com" className="text-gray-600 hover:text-black text-sm transition-colors">Rankings</a></li>
                <li><a href="https://nftpricefloor.com/nft-drops" className="text-gray-600 hover:text-black text-sm transition-colors">NFT Drops</a></li>
                <li><a href="https://nftpricefloor.com/nft-news" className="text-gray-600 hover:text-black text-sm transition-colors">Live News</a></li>
                <li><a href="https://nftpricefloor.com/wallet-tracker" className="text-gray-600 hover:text-black text-sm transition-colors">Wallet Tracker</a></li>
              </ul>
            </div>
            
            {/* Tools */}
            <div className="col-span-1">
              <h3 className="font-semibold text-black text-sm uppercase tracking-wide mb-4">More</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-600 hover:text-black text-sm transition-colors">Price Comparison</a></li>
                <li><a href="#" className="text-gray-600 hover:text-black text-sm transition-colors">Brokerage</a></li>
                <li><a href="#" className="text-gray-600 hover:text-black text-sm transition-colors">API</a></li>
                <li><a href="#" className="text-gray-600 hover:text-black text-sm transition-colors">Ads</a></li>
              </ul>
            </div>
            
            {/* Newsletter */}
            <div className="col-span-1">
              <h3 className="font-semibold text-black text-sm uppercase tracking-wide mb-4">Stay Updated</h3>
              <p className="text-gray-600 text-sm mb-4">Get the latest NFT market insights delivered to your inbox.</p>
              <div className="flex flex-col space-y-2">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="px-3 py-2 border border-gray-300 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <button className="bg-black text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 transition-colors">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
              <p className="text-gray-600 text-sm">© 2025 NFTPriceFloor. All rights reserved.</p>
              <div className="flex space-x-6">
                <a href="#" className="text-gray-600 hover:text-black text-sm transition-colors">Privacy Policy</a>
                <a href="#" className="text-gray-600 hover:text-black text-sm transition-colors">Terms of Service</a>
                <a href="#" className="text-gray-600 hover:text-black text-sm transition-colors">Contact</a>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <p className="text-gray-500 text-xs">Made with ❤️ for the NFT OGs</p>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Cache Statistics - Development Only */}
      {/* <CacheStats /> */}
    </div>
  );
}

export default App;
