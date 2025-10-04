-- NFT Floor Price Database Schema
-- SQLite compatible schema for local deployment

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    ranking INTEGER,
    image TEXT,
    total_supply INTEGER,
    owners INTEGER,
    market_cap REAL,
    market_cap_rank INTEGER,
    is_active BOOLEAN DEFAULT 1,
    is_top_250 BOOLEAN DEFAULT 0,
    selection_period TEXT, -- Format: YYYY-Q1, YYYY-Q2, etc.
    selected_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price history table with daily granularity
CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    collection_slug TEXT NOT NULL,
    date DATE NOT NULL,
    timestamp INTEGER NOT NULL,
    floor_eth REAL,
    floor_usd REAL,
    volume_eth REAL,
    volume_usd REAL,
    sales_count INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (collection_slug) REFERENCES collections(slug) ON DELETE CASCADE,
    UNIQUE(collection_slug, date)
);

-- Sync log table to track data fetching
CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT NOT NULL, -- 'daily', 'full', 'collection'
    collection_slug TEXT, -- NULL for full syncs
    status TEXT NOT NULL, -- 'started', 'completed', 'failed'
    records_processed INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds INTEGER
);

-- Collection selection periods tracking
CREATE TABLE IF NOT EXISTS collection_selection_periods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    period TEXT UNIQUE NOT NULL, -- Format: YYYY-Q1, YYYY-Q2, etc.
    selection_date DATE NOT NULL,
    total_collections_selected INTEGER,
    selection_criteria TEXT, -- 'market_cap_usd'
    min_market_cap REAL,
    max_market_cap REAL,
    avg_market_cap REAL,
    status TEXT DEFAULT 'active', -- 'active', 'expired'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API rate limit tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    requests_made INTEGER DEFAULT 0,
    last_request_at TIMESTAMP,
    rate_limit_reset TIMESTAMP,
    remaining_requests INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optimized indexes for better performance
CREATE INDEX IF NOT EXISTS idx_price_history_collection_date ON price_history(collection_slug, date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_date ON price_history(date DESC);
CREATE INDEX IF NOT EXISTS idx_price_history_timestamp ON price_history(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_collections_slug ON collections(slug);
CREATE INDEX IF NOT EXISTS idx_collections_ranking ON collections(ranking);
CREATE INDEX IF NOT EXISTS idx_collections_market_cap ON collections(market_cap DESC);
CREATE INDEX IF NOT EXISTS idx_collections_top_250 ON collections(is_top_250, selection_period);
CREATE INDEX IF NOT EXISTS idx_collections_active ON collections(is_active, market_cap DESC);
CREATE INDEX IF NOT EXISTS idx_collection_periods ON collection_selection_periods(period, status);
CREATE INDEX IF NOT EXISTS idx_sync_log_date ON sync_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status, sync_type);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON api_usage(endpoint, last_request_at DESC);

-- Covering indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_collections_cover ON collections(slug, name, market_cap, ranking, is_top_250) WHERE is_active = 1;
CREATE INDEX IF NOT EXISTS idx_price_history_cover ON price_history(collection_slug, date, floor_eth, floor_usd, volume_usd);

-- Views for common queries
CREATE VIEW IF NOT EXISTS latest_prices AS
SELECT 
    c.slug,
    c.name,
    c.ranking,
    c.market_cap,
    c.market_cap_rank,
    c.selection_period,
    ph.floor_eth,
    ph.floor_usd,
    ph.volume_usd,
    ph.date as last_updated
FROM collections c
LEFT JOIN price_history ph ON c.slug = ph.collection_slug
    AND ph.date = (
        SELECT MAX(date) 
        FROM price_history ph2 
        WHERE ph2.collection_slug = c.slug
    )
WHERE c.is_top_250 = 1
ORDER BY c.market_cap_rank ASC;

-- View for current top 250 collections by market cap
CREATE VIEW IF NOT EXISTS current_top_250 AS
SELECT 
    c.*,
    csp.period,
    csp.selection_date
FROM collections c
JOIN collection_selection_periods csp ON c.selection_period = csp.period
WHERE c.is_top_250 = 1 
    AND csp.status = 'active'
ORDER BY c.market_cap_rank ASC;

-- View for collection statistics
CREATE VIEW IF NOT EXISTS collection_stats AS
SELECT 
    c.slug,
    c.name,
    COUNT(ph.date) as days_tracked,
    MIN(ph.date) as first_data_date,
    MAX(ph.date) as last_data_date,
    AVG(ph.floor_eth) as avg_floor_eth,
    MAX(ph.floor_eth) as max_floor_eth,
    MIN(ph.floor_eth) as min_floor_eth
FROM collections c
LEFT JOIN price_history ph ON c.slug = ph.collection_slug
GROUP BY c.slug, c.name;
