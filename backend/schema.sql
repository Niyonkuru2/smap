-- =============================================
-- COMPLETE DATABASE SCHEMA FOR SMPMPS
-- Smart Market Price Monitoring and Prediction System
-- WITH ANOMALY DETECTION
-- =============================================

-- =============================================
-- 1. CATEGORIES SYSTEM (Create FIRST - before any table that references it)
-- =============================================

-- Categories table (for products, vendors, and businesses)
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    type VARCHAR(50) DEFAULT 'product' CHECK (type IN ('product', 'vendor', 'business', 'all')),
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 2. USERS & AUTHENTICATION
-- =============================================

-- Users table (Enhanced)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'consumer' CHECK (role IN ('consumer', 'vendor', 'business', 'admin')),
    phone VARCHAR(50),
    market_id VARCHAR(100),
    province VARCHAR(100),
    district VARCHAR(100),
    address TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_completed BOOLEAN DEFAULT FALSE
);

-- Verification codes table
CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. PRODUCTS & MARKETS
-- =============================================

-- Products table (with category relationship)
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 4. BUSINESS USERS (Separate table for business info)
-- =============================================

-- Business users table (extends users table)
CREATE TABLE IF NOT EXISTS business_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    registration_number VARCHAR(100) UNIQUE,
    tax_id VARCHAR(100) UNIQUE,
    tier VARCHAR(50) DEFAULT 'basic' CHECK (tier IN ('basic', 'premium', 'enterprise')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    total_purchases INTEGER DEFAULT 0,
    total_spent DECIMAL(15, 2) DEFAULT 0,
    rating DECIMAL(3, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Business markets (many-to-many relationship)
CREATE TABLE IF NOT EXISTS business_markets (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES business_users(id) ON DELETE CASCADE,
    market_id VARCHAR(100) REFERENCES markets(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, market_id)
);

-- =============================================
-- 5. PRICE MANAGEMENT
-- =============================================

-- Prices table with enhanced tracking
CREATE TABLE IF NOT EXISTS prices (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id),
    market_id VARCHAR(100) REFERENCES markets(id),
    vendor_id INTEGER REFERENCES users(id),
    price DECIMAL(10, 2) NOT NULL,
    previous_price DECIMAL(10, 2),
    unit VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    admin_notes TEXT,
    vendor_notes TEXT,
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    rejected_by INTEGER REFERENCES users(id),
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    price_id INTEGER REFERENCES prices(id),
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    changed_by INTEGER REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Price change history (for detailed tracking)
CREATE TABLE IF NOT EXISTS price_change_history (
    id SERIAL PRIMARY KEY,
    price_id INTEGER REFERENCES prices(id),
    product_id INTEGER REFERENCES products(id),
    market_id VARCHAR(100) REFERENCES markets(id),
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    percentage_change DECIMAL(5, 2),
    change_type VARCHAR(20) CHECK (change_type IN ('increase', 'decrease', 'new')),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 5.1 ANOMALY DETECTION TABLES (NEW)
-- =============================================

-- Reference prices table (Admin's real/benchmark prices)
CREATE TABLE IF NOT EXISTS reference_prices (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    market_id VARCHAR(100) REFERENCES markets(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    notes TEXT,
    set_by INTEGER REFERENCES users(id),
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, market_id, effective_date)
);

-- Price anomalies table for detecting and tracking suspicious price submissions
CREATE TABLE IF NOT EXISTS price_anomalies (
    id SERIAL PRIMARY KEY,
    price_id INTEGER REFERENCES prices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id),
    market_id VARCHAR(100) REFERENCES markets(id),
    vendor_id INTEGER REFERENCES users(id),
    reference_price_id INTEGER REFERENCES reference_prices(id),
    
    -- Price comparison data
    reference_price DECIMAL(10, 2) NOT NULL,
    vendor_price DECIMAL(10, 2) NOT NULL,
    price_difference DECIMAL(10, 2),
    deviation_percentage DECIMAL(5, 2) NOT NULL,
    
    -- Anomaly classification
    anomaly_type VARCHAR(50) CHECK (anomaly_type IN (
        'price_spike',      -- Price too high (vendor > reference)
        'price_drop',       -- Price too low (vendor < reference)
        'unusual_pattern',  -- Pattern doesn't match historical
        'suspicious_vendor', -- Vendor has history of anomalies
        'data_inconsistency' -- Data quality issue
    )),
    
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'dismissed', 'auto_approved')),
    
    -- Additional context
    details TEXT,
    suggested_action TEXT,
    
    -- Assignment and resolution
    assigned_to INTEGER REFERENCES users(id),
    assigned_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    
    -- Auto-flagging
    auto_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Anomaly resolution history
CREATE TABLE IF NOT EXISTS anomaly_resolution_history (
    id SERIAL PRIMARY KEY,
    anomaly_id INTEGER REFERENCES price_anomalies(id) ON DELETE CASCADE,
    action VARCHAR(50) CHECK (action IN ('created', 'assigned', 'investigated', 'resolved', 'dismissed', 'escalated')),
    notes TEXT,
    performed_by INTEGER REFERENCES users(id),
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor anomaly score tracking
CREATE TABLE IF NOT EXISTS vendor_anomaly_scores (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_anomalies INTEGER DEFAULT 0,
    critical_anomalies INTEGER DEFAULT 0,
    high_anomalies INTEGER DEFAULT 0,
    medium_anomalies INTEGER DEFAULT 0,
    low_anomalies INTEGER DEFAULT 0,
    resolved_anomalies INTEGER DEFAULT 0,
    dismissed_anomalies INTEGER DEFAULT 0,
    trust_score DECIMAL(5, 2) DEFAULT 100.00,
    last_anomaly_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 6. USER FAVORITES & ALERTS
-- =============================================

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    market_id VARCHAR(100) REFERENCES markets(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, market_id)
);

-- User price alerts with advanced settings
CREATE TABLE IF NOT EXISTS user_price_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    market_id VARCHAR(100) REFERENCES markets(id),
    target_price DECIMAL(10, 2) NOT NULL,
    alert_type VARCHAR(50) DEFAULT 'below' CHECK (alert_type IN ('below', 'above')),
    alert_condition VARCHAR(20) CHECK (alert_condition IN ('below', 'above', 'equals', 'percentage_change')),
    percentage_threshold DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT TRUE,
    notification_method VARCHAR(50) DEFAULT 'email' CHECK (notification_method IN ('email', 'push', 'sms', 'all')),
    triggered_at TIMESTAMP,
    last_triggered_at TIMESTAMP,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 7. SUBSCRIPTION SYSTEM
-- =============================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    duration_days INTEGER NOT NULL,
    max_products INTEGER,
    max_price_submissions INTEGER,
    priority_support BOOLEAN DEFAULT FALSE,
    featured_listing BOOLEAN DEFAULT FALSE,
    analytics_access BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(id),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    payment_id VARCHAR(255),
    payment_method VARCHAR(50),
    amount_paid DECIMAL(10, 2),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    auto_renew BOOLEAN DEFAULT FALSE,
    activated_by INTEGER REFERENCES users(id),
    activated_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subscription payments history
CREATE TABLE IF NOT EXISTS subscription_payments (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES user_subscriptions(id),
    user_id INTEGER REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255) UNIQUE,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receipt_url TEXT
);

-- Subscription expiry notifications tracking
CREATE TABLE IF NOT EXISTS subscription_expiry_notifications (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscription_id)
);

-- =============================================
-- 8. ADVERTISEMENT SYSTEM
-- =============================================

-- Vendor advertisements
CREATE TABLE IF NOT EXISTS vendor_advertisements (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    target_url TEXT,
    advertisement_type VARCHAR(50) DEFAULT 'banner' CHECK (advertisement_type IN ('banner', 'sponsored', 'featured', 'popup')),
    placement VARCHAR(100),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    budget DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'active', 'expired')),
    approved_by INTEGER REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    clicks_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Advertisement statistics
CREATE TABLE IF NOT EXISTS ad_statistics (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER REFERENCES vendor_advertisements(id) ON DELETE CASCADE,
    event_type VARCHAR(50) CHECK (event_type IN ('view', 'click', 'conversion')),
    user_id INTEGER REFERENCES users(id),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 9. NOTIFICATION SYSTEM
-- =============================================

-- Notifications table (Enhanced)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    notification_type VARCHAR(50) CHECK (notification_type IN (
        'price_approval', 'price_rejection', 'subscription_activation', 
        'subscription_expiry', 'ad_approval', 'ad_rejection', 
        'price_alert', 'system', 'price_submitted', 'payment_received',
        'anomaly_detected', 'anomaly_resolved'
    )),
    data JSONB,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pending approvals tracking
CREATE TABLE IF NOT EXISTS pending_approvals (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) CHECK (entity_type IN ('price', 'advertisement', 'vendor_registration', 'business_registration')),
    entity_id INTEGER NOT NULL,
    vendor_id INTEGER REFERENCES users(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    resolved_by INTEGER REFERENCES users(id),
    resolved_at TIMESTAMP
);

-- =============================================
-- 10. REPORTING & ANALYTICS
-- =============================================

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(100) CHECK (report_type IN (
        'price_trends', 'vendor_performance', 'subscription_revenue',
        'ad_performance', 'market_analysis', 'user_activity',
        'anomaly_report'
    )),
    generated_by INTEGER REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    parameters JSONB,
    file_url TEXT,
    file_format VARCHAR(20),
    schedule VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor performance metrics
CREATE TABLE IF NOT EXISTS vendor_metrics (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_price_submissions INTEGER DEFAULT 0,
    approved_submissions INTEGER DEFAULT 0,
    rejected_submissions INTEGER DEFAULT 0,
    average_response_time DECIMAL(10, 2),
    total_ads_placed INTEGER DEFAULT 0,
    ad_clicks INTEGER DEFAULT 0,
    ad_views INTEGER DEFAULT 0,
    subscription_tier VARCHAR(50),
    rating DECIMAL(3, 2),
    month_year DATE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 11. PERFORMANCE INDEXES
-- =============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_market ON users(market_id);
CREATE INDEX IF NOT EXISTS idx_users_category ON users(category_id);

-- Category indexes
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);

-- Business users indexes
CREATE INDEX IF NOT EXISTS idx_business_users_user ON business_users(user_id);
CREATE INDEX IF NOT EXISTS idx_business_users_status ON business_users(status);
CREATE INDEX IF NOT EXISTS idx_business_users_tier ON business_users(tier);
CREATE INDEX IF NOT EXISTS idx_business_users_registration ON business_users(registration_number);

-- Business markets indexes
CREATE INDEX IF NOT EXISTS idx_business_markets_business ON business_markets(business_id);
CREATE INDEX IF NOT EXISTS idx_business_markets_market ON business_markets(market_id);

-- Product indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);

-- Price indexes
CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_market ON prices(market_id);
CREATE INDEX IF NOT EXISTS idx_prices_vendor ON prices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_prices_status ON prices(status);
CREATE INDEX IF NOT EXISTS idx_prices_created ON prices(created_at);
CREATE INDEX IF NOT EXISTS idx_prices_approval ON prices(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prices_vendor_status ON prices(vendor_id, status);

-- Reference price indexes
CREATE INDEX IF NOT EXISTS idx_ref_prices_product_market ON reference_prices(product_id, market_id, is_current);
CREATE INDEX IF NOT EXISTS idx_ref_prices_effective ON reference_prices(effective_date);

-- Anomaly indexes
CREATE INDEX IF NOT EXISTS idx_price_anomalies_status ON price_anomalies(status, severity);
CREATE INDEX IF NOT EXISTS idx_price_anomalies_product ON price_anomalies(product_id, market_id);
CREATE INDEX IF NOT EXISTS idx_price_anomalies_vendor ON price_anomalies(vendor_id);
CREATE INDEX IF NOT EXISTS idx_price_anomalies_created ON price_anomalies(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_anomalies_severity ON price_anomalies(severity, status);

-- Vendor anomaly score indexes
CREATE INDEX IF NOT EXISTS idx_vendor_anomaly_scores_vendor ON vendor_anomaly_scores(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_anomaly_scores_trust ON vendor_anomaly_scores(trust_score);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Favorites and alerts indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON user_price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_price_alerts_active ON user_price_alerts(user_id, is_active);

-- Subscription indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_end_date ON user_subscriptions(end_date);

-- Pending approvals indexes
CREATE INDEX IF NOT EXISTS idx_pending_approvals_status ON pending_approvals(status, entity_type);
CREATE INDEX IF NOT EXISTS idx_pending_approvals_created ON pending_approvals(submitted_at);

-- Price change history indexes
CREATE INDEX IF NOT EXISTS idx_price_change_history_product ON price_change_history(product_id, market_id);

-- Advertisements indexes
CREATE INDEX IF NOT EXISTS idx_vendor_advertisements_vendor ON vendor_advertisements(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_vendor_advertisements_dates ON vendor_advertisements(start_date, end_date);

-- Vendor metrics indexes
CREATE INDEX IF NOT EXISTS idx_vendor_metrics_vendor ON vendor_metrics(vendor_id, month_year);

-- =============================================
-- 12. ANOMALY DETECTION FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to get current reference price for product-market
CREATE OR REPLACE FUNCTION get_current_reference_price(
    p_product_id INTEGER,
    p_market_id VARCHAR
)
RETURNS TABLE (
    reference_price_id INTEGER,
    reference_price DECIMAL(10, 2),
    reference_unit VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.id,
        rp.price,
        rp.unit
    FROM reference_prices rp
    WHERE rp.product_id = p_product_id
        AND rp.market_id = p_market_id
        AND rp.is_current = TRUE
        AND (rp.expiry_date IS NULL OR rp.expiry_date >= CURRENT_DATE)
    ORDER BY rp.effective_date DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate anomaly severity based on deviation
CREATE OR REPLACE FUNCTION calculate_anomaly_severity(deviation_percentage DECIMAL)
RETURNS VARCHAR AS $$
BEGIN
    IF deviation_percentage > 50 THEN
        RETURN 'critical';
    ELSIF deviation_percentage > 30 THEN
        RETURN 'high';
    ELSIF deviation_percentage > 15 THEN
        RETURN 'medium';
    ELSIF deviation_percentage > 5 THEN
        RETURN 'low';
    ELSE
        RETURN 'none';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to determine anomaly type
CREATE OR REPLACE FUNCTION determine_anomaly_type(
    vendor_price DECIMAL,
    reference_price DECIMAL,
    vendor_id INTEGER
)
RETURNS VARCHAR AS $$
DECLARE
    vendor_trust_score DECIMAL;
BEGIN
    -- Get vendor's trust score
    SELECT trust_score INTO vendor_trust_score
    FROM vendor_anomaly_scores
    WHERE vendor_id = determine_anomaly_type.vendor_id;
    
    IF vendor_trust_score IS NULL THEN
        vendor_trust_score := 100;
    END IF;
    
    -- Determine based on price comparison
    IF vendor_price > reference_price THEN
        IF vendor_trust_score < 50 THEN
            RETURN 'suspicious_vendor';
        ELSE
            RETURN 'price_spike';
        END IF;
    ELSIF vendor_price < reference_price THEN
        IF vendor_trust_score < 50 THEN
            RETURN 'suspicious_vendor';
        ELSE
            RETURN 'price_drop';
        END IF;
    ELSE
        RETURN 'data_inconsistency';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Main anomaly detection function
CREATE OR REPLACE FUNCTION detect_price_anomaly()
RETURNS TRIGGER AS $$
DECLARE
    ref_price_record RECORD;
    deviation_pct DECIMAL(5, 2);
    anomaly_severity VARCHAR(20);
    anomaly_type_val VARCHAR(50);
    anomaly_id_val INTEGER;
    vendor_trust_val DECIMAL;
    is_critical BOOLEAN;
BEGIN
    -- Only check pending vendor prices (not reference prices)
    IF NEW.status = 'pending' AND NEW.vendor_id IS NOT NULL THEN
        
        -- Get current reference price for this product and market
        SELECT * INTO ref_price_record
        FROM get_current_reference_price(NEW.product_id, NEW.market_id);
        
        -- If reference price exists, check for anomaly
        IF ref_price_record.reference_price IS NOT NULL THEN
            
            -- Calculate deviation percentage
            deviation_pct := ABS(((NEW.price - ref_price_record.reference_price) / ref_price_record.reference_price) * 100);
            
            -- Calculate severity
            anomaly_severity := calculate_anomaly_severity(deviation_pct);
            
            -- Only create anomaly if deviation > 5%
            IF deviation_pct > 5 THEN
                
                -- Determine anomaly type
                anomaly_type_val := determine_anomaly_type(NEW.price, ref_price_record.reference_price, NEW.vendor_id);
                
                -- Create anomaly record
                INSERT INTO price_anomalies (
                    price_id,
                    product_id,
                    market_id,
                    vendor_id,
                    reference_price_id,
                    reference_price,
                    vendor_price,
                    price_difference,
                    deviation_percentage,
                    anomaly_type,
                    severity,
                    status,
                    details,
                    auto_flagged,
                    flag_reason,
                    assigned_at
                ) VALUES (
                    NEW.id,
                    NEW.product_id,
                    NEW.market_id,
                    NEW.vendor_id,
                    ref_price_record.reference_price_id,
                    ref_price_record.reference_price,
                    NEW.price,
                    NEW.price - ref_price_record.reference_price,
                    deviation_pct,
                    anomaly_type_val,
                    anomaly_severity,
                    CASE 
                        WHEN anomaly_severity IN ('critical', 'high') THEN 'new'
                        ELSE 'new'
                    END,
                    CASE
                        WHEN NEW.price > ref_price_record.reference_price THEN
                            'Price is ' || ROUND(deviation_pct, 1) || '% above reference price of ' || 
                            ref_price_record.reference_price || ' RWF'
                        ELSE
                            'Price is ' || ROUND(deviation_pct, 1) || '% below reference price of ' || 
                            ref_price_record.reference_price || ' RWF'
                    END,
                    CASE WHEN anomaly_severity IN ('critical', 'high') THEN TRUE ELSE FALSE END,
                    CASE 
                        WHEN anomaly_severity = 'critical' THEN 
                            'Critical anomaly: Price deviation exceeds 50% from reference price'
                        WHEN anomaly_severity = 'high' THEN 
                            'High anomaly: Price deviation exceeds 30% from reference price'
                        WHEN anomaly_severity = 'medium' THEN 
                            'Medium anomaly: Price deviation exceeds 15% from reference price'
                        ELSE
                            'Low anomaly: Price deviation exceeds 5% from reference price'
                    END,
                    NOW()
                )
                RETURNING id INTO anomaly_id_val;
                
                -- Record in anomaly resolution history
                INSERT INTO anomaly_resolution_history (
                    anomaly_id,
                    action,
                    notes,
                    previous_status,
                    new_status
                ) VALUES (
                    anomaly_id_val,
                    'created',
                    'Anomaly automatically detected by system',
                    NULL,
                    'new'
                );
                
                -- Update vendor anomaly score
                INSERT INTO vendor_anomaly_scores (vendor_id, last_anomaly_date)
                VALUES (NEW.vendor_id, NOW())
                ON CONFLICT (vendor_id) DO UPDATE
                SET 
                    total_anomalies = vendor_anomaly_scores.total_anomalies + 1,
                    last_anomaly_date = NOW(),
                    updated_at = NOW();
                
                -- Update specific severity count
                IF anomaly_severity = 'critical' THEN
                    UPDATE vendor_anomaly_scores 
                    SET critical_anomalies = critical_anomalies + 1
                    WHERE vendor_id = NEW.vendor_id;
                ELSIF anomaly_severity = 'high' THEN
                    UPDATE vendor_anomaly_scores 
                    SET high_anomalies = high_anomalies + 1
                    WHERE vendor_id = NEW.vendor_id;
                ELSIF anomaly_severity = 'medium' THEN
                    UPDATE vendor_anomaly_scores 
                    SET medium_anomalies = medium_anomalies + 1
                    WHERE vendor_id = NEW.vendor_id;
                ELSE
                    UPDATE vendor_anomaly_scores 
                    SET low_anomalies = low_anomalies + 1
                    WHERE vendor_id = NEW.vendor_id;
                END IF;
                
                -- Update trust score based on anomalies
                UPDATE vendor_anomaly_scores
                SET trust_score = GREATEST(0, 100 - (
                    (critical_anomalies * 10) + 
                    (high_anomalies * 5) + 
                    (medium_anomalies * 2) + 
                    (low_anomalies * 1)
                ))
                WHERE vendor_id = NEW.vendor_id;
                
                -- Auto-flag critical and high anomalies in prices table
                IF anomaly_severity IN ('critical', 'high') THEN
                    NEW.flagged := TRUE;
                    NEW.flag_reason := 'Auto-flagged: ' || UPPER(anomaly_severity) || ' anomaly detected - Deviation of ' || 
                                      ROUND(deviation_pct, 1) || '% from reference price';
                    NEW.status := 'flagged';
                    
                    -- Create notification for admin
                    INSERT INTO notifications (
                        user_id,
                        title,
                        message,
                        type,
                        notification_type,
                        priority,
                        data,
                        action_url
                    ) VALUES (
                        NULL, -- Will be sent to admins
                        'Critical Price Anomaly Detected',
                        'Vendor price submitted for ' || (SELECT name FROM products WHERE id = NEW.product_id) || 
                        ' shows ' || ROUND(deviation_pct, 1) || '% deviation from reference price',
                        'warning',
                        'anomaly_detected',
                        'urgent',
                        jsonb_build_object(
                            'anomaly_id', anomaly_id_val,
                            'price_id', NEW.id,
                            'product_id', NEW.product_id,
                            'market_id', NEW.market_id,
                            'vendor_id', NEW.vendor_id,
                            'deviation', deviation_pct
                        ),
                        '/admin/anomalies/' || anomaly_id_val
                    );
                END IF;
                
                -- For medium anomalies, flag for review
                IF anomaly_severity = 'medium' THEN
                    NEW.flagged := TRUE;
                    NEW.flag_reason := 'Flagged for review: Medium anomaly - ' || ROUND(deviation_pct, 1) || '% deviation';
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for anomaly detection on price insert
DROP TRIGGER IF EXISTS detect_price_anomaly_trigger ON prices;
CREATE TRIGGER detect_price_anomaly_trigger
    BEFORE INSERT ON prices
    FOR EACH ROW
    EXECUTE FUNCTION detect_price_anomaly();

-- Function to update vendor trust score after anomaly resolution
CREATE OR REPLACE FUNCTION update_trust_score_on_resolution()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('resolved', 'dismissed') AND OLD.status != NEW.status THEN
        -- Recalculate trust score
        UPDATE vendor_anomaly_scores
        SET 
            resolved_anomalies = CASE WHEN NEW.status = 'resolved' 
                THEN resolved_anomalies + 1 
                ELSE resolved_anomalies 
            END,
            dismissed_anomalies = CASE WHEN NEW.status = 'dismissed' 
                THEN dismissed_anomalies + 1 
                ELSE dismissed_anomalies 
            END,
            trust_score = LEAST(100, trust_score + 
                CASE 
                    WHEN NEW.status = 'resolved' AND NEW.severity = 'critical' THEN 5
                    WHEN NEW.status = 'resolved' AND NEW.severity = 'high' THEN 3
                    WHEN NEW.status = 'resolved' AND NEW.severity = 'medium' THEN 2
                    WHEN NEW.status = 'resolved' AND NEW.severity = 'low' THEN 1
                    WHEN NEW.status = 'dismissed' AND NEW.severity = 'critical' THEN -2
                    WHEN NEW.status = 'dismissed' AND NEW.severity = 'high' THEN -1
                    ELSE 0
                END
            ),
            updated_at = NOW()
        WHERE vendor_id = NEW.vendor_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for trust score update
DROP TRIGGER IF EXISTS update_trust_score_trigger ON price_anomalies;
CREATE TRIGGER update_trust_score_trigger
    AFTER UPDATE OF status ON price_anomalies
    FOR EACH ROW
    EXECUTE FUNCTION update_trust_score_on_resolution();

-- Function to automatically approve prices with no anomalies
CREATE OR REPLACE FUNCTION auto_approve_price()
RETURNS TRIGGER AS $$
DECLARE
    has_anomaly BOOLEAN;
BEGIN
    -- Check if this price has any anomalies
    SELECT EXISTS(
        SELECT 1 FROM price_anomalies 
        WHERE price_id = NEW.id AND severity IN ('critical', 'high')
    ) INTO has_anomaly;
    
    -- Auto-approve if no critical/high anomalies
    IF NOT has_anomaly AND NEW.status = 'pending' THEN
        NEW.status := 'approved';
        NEW.approved_at := NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-approval
DROP TRIGGER IF EXISTS auto_approve_price_trigger ON prices;
CREATE TRIGGER auto_approve_price_trigger
    AFTER INSERT ON prices
    FOR EACH ROW
    EXECUTE FUNCTION auto_approve_price();

-- =============================================
-- 13. INITIAL DATA SEEDING
-- =============================================

-- Insert categories
INSERT INTO categories (name, description) VALUES
('Grains', 'Cereal grains and grain products'),
('Legumes', 'Beans, lentils, and pulses'),
('Vegetables', 'Fresh and processed vegetables'),
('Fruits', 'Fresh and dried fruits'),
('Proteins', 'Meat, fish, eggs, and dairy'),
('Cooking Essentials', 'Oil, salt, sugar, and spices'),
('Agriculture', 'Farming and agricultural products'),
('Retail', 'Retail stores and supermarkets'),
('Wholesale', 'Wholesale distributors'),
('Hospitality', 'Hotels, restaurants, and catering'),
('Manufacturing', 'Food processing and manufacturing'),
('Services', 'Business and professional services')
ON CONFLICT (name) DO NOTHING;

-- Insert subscription plans
INSERT INTO subscription_plans (name, description, price, duration_days, max_products, max_price_submissions, priority_support, featured_listing, analytics_access) VALUES
('Basic', 'For small vendors starting out', 0, 30, 50, 100, false, false, false),
('Premium', 'For established vendors', 25000, 30, 200, 500, true, true, false),
('Enterprise', 'For large businesses', 75000, 30, NULL, NULL, true, true, true)
ON CONFLICT (name) DO NOTHING;

-- Insert default products
INSERT INTO products (name, unit) VALUES
('Maize/Corn', 'kg'),
('Maize Flour', 'kg'),
('Rice (White)', 'kg'),
('Rice (Brown)', 'kg'),
('Wheat Flour', 'kg'),
('Beans', 'kg'),
('Lentils', 'kg'),
('Tomatoes', 'kg'),
('Onions', 'kg'),
('Potatoes', 'kg'),
('Cabbage', 'piece'),
('Carrots', 'kg'),
('Spinach', 'bunch'),
('Eggs', 'tray'),
('Chicken', 'kg'),
('Fish', 'kg'),
('Milk', 'liter'),
('Bananas', 'bunch'),
('Oranges', 'kg'),
('Mangoes', 'kg'),
('Avocado', 'piece'),
('Cooking Oil', 'liter'),
('Salt', 'kg'),
('Sugar', 'kg'),
('Garlic', 'kg'),
('Ginger', 'kg')
ON CONFLICT (name) DO NOTHING;

-- Insert default markets
INSERT INTO markets (id, name, province, district, latitude, longitude) VALUES
('nyarugenge', 'Nyarugenge Market', 'Kigali City', 'Nyarugenge', -1.9536, 30.0606),
('kimironko', 'Kimironko Market', 'Kigali City', 'Gasabo', -1.9394, 30.1027),
('kicukiro', 'Kicukiro Market', 'Kigali City', 'Kicukiro', -1.9867, 30.0644),
('musanze', 'Musanze Modern Market', 'Northern', 'Musanze', -1.4994, 29.6350),
('rubavu', 'Gisenyi Market', 'Western', 'Rubavu', -1.6778, 29.2561),
('huye', 'Huye Central Market', 'Southern', 'Huye', -2.5964, 29.7394),
('rwamagana', 'Rwamagana Market', 'Eastern', 'Rwamagana', -1.9494, 30.4344)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 14. STORED PROCEDURES FOR ANOMALY MANAGEMENT
-- =============================================

-- Procedure to get anomaly statistics
CREATE OR REPLACE FUNCTION get_anomaly_statistics(
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_anomalies BIGINT,
    critical_count BIGINT,
    high_count BIGINT,
    medium_count BIGINT,
    low_count BIGINT,
    resolved_count BIGINT,
    investigating_count BIGINT,
    new_count BIGINT,
    avg_resolution_time_hours NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COUNT(*) FILTER (WHERE severity = 'critical')::BIGINT,
        COUNT(*) FILTER (WHERE severity = 'high')::BIGINT,
        COUNT(*) FILTER (WHERE severity = 'medium')::BIGINT,
        COUNT(*) FILTER (WHERE severity = 'low')::BIGINT,
        COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT,
        COUNT(*) FILTER (WHERE status = 'investigating')::BIGINT,
        COUNT(*) FILTER (WHERE status = 'new')::BIGINT,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600)::NUMERIC(10,2)
    FROM price_anomalies pa
    WHERE (p_start_date IS NULL OR DATE(pa.created_at) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(pa.created_at) <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- Procedure to get vendor anomaly summary
CREATE OR REPLACE FUNCTION get_vendor_anomaly_summary(p_vendor_id INTEGER)
RETURNS TABLE (
    vendor_name VARCHAR,
    total_anomalies BIGINT,
    trust_score DECIMAL,
    recent_anomalies JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.name,
        COALESCE(vas.total_anomalies, 0)::BIGINT,
        COALESCE(vas.trust_score, 100)::DECIMAL,
        COALESCE((
            SELECT json_agg(
                json_build_object(
                    'date', pa.created_at,
                    'severity', pa.severity,
                    'deviation', pa.deviation_percentage,
                    'product', p.name,
                    'status', pa.status
                )
            )
            FROM price_anomalies pa
            JOIN products p ON p.id = pa.product_id
            WHERE pa.vendor_id = p_vendor_id
            ORDER BY pa.created_at DESC
            LIMIT 10
        ), '[]'::json)::JSON
    FROM users u
    LEFT JOIN vendor_anomaly_scores vas ON vas.vendor_id = u.id
    WHERE u.id = p_vendor_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 15. TRIGGERS FOR UPDATED_AT (Existing tables)
-- =============================================

-- Create triggers for tables with updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_markets_updated_at ON markets;
CREATE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prices_updated_at ON prices;
CREATE TRIGGER update_prices_updated_at BEFORE UPDATE ON prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_price_alerts_updated_at ON user_price_alerts;
CREATE TRIGGER update_user_price_alerts_updated_at BEFORE UPDATE ON user_price_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscription_plans_updated_at ON subscription_plans;
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_business_users_updated_at ON business_users;
CREATE TRIGGER update_business_users_updated_at BEFORE UPDATE ON business_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_advertisements_updated_at ON vendor_advertisements;
CREATE TRIGGER update_vendor_advertisements_updated_at BEFORE UPDATE ON vendor_advertisements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for new anomaly tables
DROP TRIGGER IF EXISTS update_reference_prices_updated_at ON reference_prices;
CREATE TRIGGER update_reference_prices_updated_at BEFORE UPDATE ON reference_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_price_anomalies_updated_at ON price_anomalies;
CREATE TRIGGER update_price_anomalies_updated_at BEFORE UPDATE ON price_anomalies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_anomaly_scores_updated_at ON vendor_anomaly_scores;
CREATE TRIGGER update_vendor_anomaly_scores_updated_at BEFORE UPDATE ON vendor_anomaly_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 'Database setup complete with anomaly detection! All tables created successfully.' as message;