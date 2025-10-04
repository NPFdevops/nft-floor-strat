/**
 * URL parameter utilities for sharing collection comparisons
 */

/**
 * Encode a collection slug for URL parameter
 * @param {string} slug - Collection slug
 * @returns {string} - URL-safe encoded slug
 */
export const encodeCollectionSlug = (slug) => {
  if (!slug) return '';
  return encodeURIComponent(slug);
};

/**
 * Decode a collection slug from URL parameter
 * @param {string} encodedSlug - URL-encoded slug
 * @returns {string} - Decoded slug
 */
export const decodeCollectionSlug = (encodedSlug) => {
  if (!encodedSlug) return '';
  try {
    return decodeURIComponent(encodedSlug);
  } catch (e) {
    console.warn('Failed to decode collection slug:', encodedSlug, e);
    return encodedSlug; // Return as-is if decoding fails
  }
};

/**
 * Encode a strategy name for URL parameter
 * @param {string} strategyName - Strategy name
 * @returns {string} - URL-safe encoded strategy name
 */
export const encodeStrategyName = (strategyName) => {
  if (!strategyName) return '';
  // Create a URL-friendly slug from strategy name
  return encodeURIComponent(strategyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
};

/**
 * Create URL search parameters from current app state
 * @param {object} options - Current state options
 * @param {object} options.collection1 - First collection object
 * @param {object} options.collection2 - Second collection object
 * @param {string} options.timeframe - Current timeframe
 * @param {string} options.layout - Current layout
 * @param {string} options.view - Current view
 * @param {string} options.strategyName - Strategy name for detail view
 * @returns {URLSearchParams} - URL search parameters
 */
export const createUrlParams = ({ collection1, collection2, timeframe, layout, view, strategyName }) => {
  const params = new URLSearchParams();
  
  if (collection1?.slug) {
    params.set('c1', encodeCollectionSlug(collection1.slug));
  }
  
  if (collection2?.slug) {
    params.set('c2', encodeCollectionSlug(collection2.slug));
  }
  
  if (timeframe && timeframe !== '30d') { // Don't include default timeframe
    params.set('t', timeframe);
  }
  
  if (layout && layout !== 'horizontal') { // Don't include default layout
    params.set('layout', layout);
  }
  
  if (view && view !== 'charts') { // Don't include default view
    params.set('view', view);
  }
  
  if (strategyName) {
    params.set('strategy', encodeStrategyName(strategyName));
  }
  
  return params;
};

/**
 * Parse URL search parameters into app state
 * @param {URLSearchParams} searchParams - URL search parameters
 * @returns {object} - Parsed state object
 */
export const parseUrlParams = (searchParams) => {
  const state = {
    collection1Slug: null,
    collection2Slug: null,
    timeframe: '30d',
    layout: 'horizontal',
    view: 'strategies', // Default to strategies view
    strategyName: null
  };
  
  // Parse collection slugs
  const c1 = searchParams.get('c1');
  if (c1) {
    state.collection1Slug = decodeCollectionSlug(c1);
  }
  
  const c2 = searchParams.get('c2');
  if (c2) {
    state.collection2Slug = decodeCollectionSlug(c2);
  }
  
  // Parse timeframe
  const timeframe = searchParams.get('t');
  if (timeframe) {
    // Validate timeframe is one of the allowed values
    const validTimeframes = ['30d', '90d', '1Y', 'YTD'];
    if (validTimeframes.includes(timeframe)) {
      state.timeframe = timeframe;
    }
  }
  
  // Parse layout
  const layout = searchParams.get('layout');
  if (layout) {
    // Validate layout is one of the allowed values
    const validLayouts = ['horizontal', 'vertical'];
    if (validLayouts.includes(layout)) {
      state.layout = layout;
    }
  }
  
  // Parse view
  const view = searchParams.get('view');
  if (view) {
    // Validate view is one of the allowed values
    const validViews = ['charts', 'strategies'];
    if (validViews.includes(view)) {
      state.view = view;
    }
  }
  
  // Parse strategy name
  const strategy = searchParams.get('strategy');
  if (strategy) {
    try {
      state.strategyName = decodeURIComponent(strategy);
    } catch (e) {
      console.warn('Failed to decode strategy name:', strategy, e);
      state.strategyName = strategy;
    }
  }
  
  return state;
};

/**
 * Create a shareable URL with current state
 * @param {object} options - Current state options
 * @param {object} options.collection1 - First collection object
 * @param {object} options.collection2 - Second collection object
 * @param {string} options.timeframe - Current timeframe
 * @param {string} options.layout - Current layout
 * @returns {string} - Complete shareable URL
 */
export const createShareableUrl = ({ collection1, collection2, timeframe, layout }) => {
  const params = createUrlParams({ collection1, collection2, timeframe, layout });
  const url = new URL(window.location.origin + window.location.pathname);
  
  // Only add search params if there are any
  if (params.toString()) {
    url.search = params.toString();
  }
  
  return url.toString();
};

/**
 * Create base NFT strategies URL
 * @returns {string} - Base strategies URL
 */
export const createStrategiesUrl = () => {
  return '/';
};

/**
 * Create strategy detail URL
 * @param {object} strategy - Strategy object
 * @returns {string} - Strategy detail URL
 */
export const createStrategyUrl = (strategy) => {
  if (!strategy) return '/';
  
  const strategySlug = encodeStrategyName(strategy.collectionName + ' ' + strategy.tokenName);
  return `/${strategySlug}`;
};

/**
 * Find strategy by encoded name from a list of strategies
 * @param {Array} strategies - Array of strategy objects
 * @param {string} encodedName - Encoded strategy name from URL
 * @returns {object|null} - Found strategy or null
 */
export const findStrategyByEncodedName = (strategies, encodedName) => {
  if (!strategies || !encodedName) return null;
  
  return strategies.find(strategy => {
    const strategySlug = encodeStrategyName(strategy.collectionName + ' ' + strategy.tokenName);
    return strategySlug === encodedName;
  });
};

/**
 * Generate a human-readable title from collections and timeframe for sharing
 * @param {object} options - Current state options
 * @param {object} options.collection1 - First collection object
 * @param {object} options.collection2 - Second collection object
 * @param {string} options.timeframe - Current timeframe
 * @returns {string} - Human-readable title
 */
export const generateShareTitle = ({ collection1, collection2, timeframe }) => {
  const collections = [];
  if (collection1?.name) collections.push(collection1.name);
  if (collection2?.name) collections.push(collection2.name);
  
  if (collections.length === 0) {
    return 'NFT Floor Price Comparison';
  }
  
  const timeframeMap = {
    '30d': '30 Days',
    '90d': '90 Days',
    '1Y': '1 Year',
    'YTD': 'Year to Date'
  };
  
  const timeframeText = timeframeMap[timeframe] || '30 Days';
  const collectionsText = collections.join(' vs ');
  
  return `${collectionsText} - ${timeframeText} Floor Price Comparison`;
};
