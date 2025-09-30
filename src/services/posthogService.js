import posthog from 'posthog-js';

class PostHogService {
  constructor() {
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    const posthogKey = import.meta.env.VITE_POSTHOG_KEY;
    const posthogHost = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!posthogKey) {
      console.warn('PostHog key not found. Analytics will be disabled.');
      return;
    }

    try {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        loaded: (posthog) => {
          if (import.meta.env.DEV) {
            console.log('PostHog loaded successfully');
          }
        }
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
    }
  }

  // Track custom events with enhanced properties and tags
  track(eventName, properties = {}) {
    if (!this.isInitialized) {
      console.warn(`PostHog not initialized. Event "${eventName}" not tracked.`);
      return;
    }
    
    try {
      // Add default properties and tags
      const enhancedProperties = {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        pathname: window.location.pathname,
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        viewport_size: `${window.innerWidth}x${window.innerHeight}`,
        // Add app-specific tags
        app_name: 'nft-floor-strategy',
        app_version: '1.0.0',
        environment: import.meta.env.MODE || 'production'
      };

      posthog.capture(eventName, enhancedProperties);
      
      if (import.meta.env.DEV) {
        console.log(`📊 PostHog Event: ${eventName}`, enhancedProperties);
      }
    } catch (error) {
      console.error('Failed to track event:', error);
    }
  }

  // Track page views manually if needed
  trackPageView(pageName, properties = {}) {
    if (!this.isInitialized) return;
    
    try {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        page_name: pageName,
        ...properties
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }

  // Identify users (for when you have user authentication)
  identify(userId, properties = {}) {
    if (!this.isInitialized) return;
    
    try {
      posthog.identify(userId, properties);
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  // Set user properties
  setPersonProperties(properties) {
    if (!this.isInitialized) return;
    
    try {
      posthog.setPersonProperties(properties);
    } catch (error) {
      console.error('Failed to set person properties:', error);
    }
  }

  // Reset user (for logout)
  reset() {
    if (!this.isInitialized) return;
    
    try {
      posthog.reset();
    } catch (error) {
      console.error('Failed to reset PostHog:', error);
    }
  }

  // Specialized tracking methods for NFT Strategy App
  
  // Track strategy interactions
  trackStrategyEvent(action, strategy, additionalProperties = {}) {
    this.track(`strategy_${action}`, {
      strategy_name: strategy?.collectionName,
      token_name: strategy?.tokenName,
      market_cap: strategy?.poolData?.market_cap_usd,
      volume_24h: strategy?.poolData?.volume_24h_usd,
      price_change_24h: strategy?.poolData?.price_change_24h,
      category: 'strategy_interaction',
      ...additionalProperties
    });
  }

  // Track chart interactions
  trackChartEvent(action, chartData, additionalProperties = {}) {
    this.track(`chart_${action}`, {
      chart_type: chartData?.type,
      timeframe: chartData?.timeframe,
      collection_count: chartData?.collections?.length,
      category: 'chart_interaction',
      ...additionalProperties
    });
  }

  // Track search and filter events
  trackSearchEvent(action, searchData, additionalProperties = {}) {
    this.track(`search_${action}`, {
      search_term: searchData?.term,
      filter_type: searchData?.filterType,
      results_count: searchData?.resultsCount,
      category: 'search_interaction',
      ...additionalProperties
    });
  }

  // Track screenshot and sharing events
  trackShareEvent(action, shareData, additionalProperties = {}) {
    this.track(`share_${action}`, {
      share_type: shareData?.type,
      target_element: shareData?.targetElement,
      collections: shareData?.collections,
      timeframe: shareData?.timeframe,
      layout: shareData?.layout,
      category: 'sharing',
      ...additionalProperties
    });
  }

  // Track performance and errors
  trackPerformanceEvent(action, performanceData, additionalProperties = {}) {
    this.track(`performance_${action}`, {
      load_time: performanceData?.loadTime,
      data_size: performanceData?.dataSize,
      error_message: performanceData?.errorMessage,
      category: 'performance',
      ...additionalProperties
    });
  }

  // Track user engagement
  trackEngagementEvent(action, engagementData, additionalProperties = {}) {
    this.track(`engagement_${action}`, {
      session_duration: engagementData?.sessionDuration,
      page_views: engagementData?.pageViews,
      interactions_count: engagementData?.interactionsCount,
      category: 'engagement',
      ...additionalProperties
    });
  }

  // Get the PostHog instance for advanced usage
  getInstance() {
    return this.isInitialized ? posthog : null;
  }
}

// Export a singleton instance
export const posthogService = new PostHogService();

// Export the class for testing or multiple instances if needed
export default PostHogService;