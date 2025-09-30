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

  // Track custom events
  track(eventName, properties = {}) {
    if (!this.isInitialized) return;
    
    try {
      posthog.capture(eventName, properties);
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

  // Get the PostHog instance for advanced usage
  getInstance() {
    return this.isInitialized ? posthog : null;
  }
}

// Export a singleton instance
export const posthogService = new PostHogService();

// Export the class for testing or multiple instances if needed
export default PostHogService;