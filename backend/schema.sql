-- =============================================
-- RECREATE ALL TABLES (with IF NOT EXISTS)
-- =============================================

-- =============================================
-- DROP FUNCTIONS AND TRIGGERS FIRST (IF THEY EXIST)
-- =============================================

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS detect_price_anomaly_trigger ON prices;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
DROP TRIGGER IF EXISTS update_markets_updated_at ON markets;
DROP TRIGGER IF EXISTS update_prices_updated_at ON prices;
DROP TRIGGER IF EXISTS update_reference_prices_updated_at ON reference_prices;
DROP TRIGGER IF EXISTS update_price_anomalies_updated_at ON price_anomalies;
DROP TRIGGER IF EXISTS update_vendor_anomaly_scores_updated_at ON vendor_anomaly_scores;
DROP TRIGGER IF EXISTS update_user_notification_preferences_updated_at ON user_notification_preferences;
DROP TRIGGER IF EXISTS update_user_price_alerts_updated_at ON user_price_alerts;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_current_reference_price(INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS calculate_anomaly_severity(DECIMAL) CASCADE;
DROP FUNCTION IF EXISTS detect_price_anomaly() CASCADE;

-- =============================================
-- RECREATE ALL TABLES (with IF NOT EXISTS)
-- =============================================

-- 1. CATEGORIES SYSTEM
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

-- 2. USERS & AUTHENTICATION
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

CREATE TABLE IF NOT EXISTS verification_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. PRODUCTS & MARKETS
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

-- 4. BUSINESS USERS
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

CREATE TABLE IF NOT EXISTS business_markets (
    id SERIAL PRIMARY KEY,
    business_id INTEGER REFERENCES business_users(id) ON DELETE CASCADE,
    market_id VARCHAR(100) REFERENCES markets(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, market_id)
);

-- 5. PRICE MANAGEMENT
CREATE TABLE IF NOT EXISTS prices (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    market_id VARCHAR(100) REFERENCES markets(id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    previous_price DECIMAL(10, 2),
    unit VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'flagged')),
    admin_notes TEXT,
    vendor_notes TEXT,
    flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    rejected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_history (
    id SERIAL PRIMARY KEY,
    price_id INTEGER REFERENCES prices(id) ON DELETE CASCADE,
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_change_history (
    id SERIAL PRIMARY KEY,
    price_id INTEGER REFERENCES prices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    market_id VARCHAR(100) REFERENCES markets(id) ON DELETE CASCADE,
    old_price DECIMAL(10, 2),
    new_price DECIMAL(10, 2),
    percentage_change DECIMAL(5, 2),
    change_type VARCHAR(20) CHECK (change_type IN ('increase', 'decrease', 'new')),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5.1 ANOMALY DETECTION TABLES
CREATE TABLE IF NOT EXISTS reference_prices (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    market_id VARCHAR(100) REFERENCES markets(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    notes TEXT,
    set_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_current BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, market_id, effective_date)
);

CREATE TABLE IF NOT EXISTS price_anomalies (
    id SERIAL PRIMARY KEY,
    price_id INTEGER REFERENCES prices(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    market_id VARCHAR(100) REFERENCES markets(id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    reference_price_id INTEGER REFERENCES reference_prices(id) ON DELETE SET NULL,
    reference_price DECIMAL(10, 2) NOT NULL,
    vendor_price DECIMAL(10, 2) NOT NULL,
    price_difference DECIMAL(10, 2),
    deviation_percentage DECIMAL(5, 2) NOT NULL,
    anomaly_type VARCHAR(50) CHECK (anomaly_type IN (
        'price_spike', 'price_drop', 'unusual_pattern', 
        'suspicious_vendor', 'data_inconsistency'
    )),
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'dismissed', 'auto_approved')),
    details TEXT,
    suggested_action TEXT,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    auto_flagged BOOLEAN DEFAULT FALSE,
    flag_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anomaly_resolution_history (
    id SERIAL PRIMARY KEY,
    anomaly_id INTEGER REFERENCES price_anomalies(id) ON DELETE CASCADE,
    action VARCHAR(50) CHECK (action IN ('created', 'assigned', 'investigated', 'resolved', 'dismissed', 'escalated')),
    notes TEXT,
    performed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    previous_status VARCHAR(20),
    new_status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vendor_anomaly_scores (
    id SERIAL PRIMARY KEY,
    vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
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

-- 6. USER FAVORITES & ALERTS
CREATE TABLE IF NOT EXISTS favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    market_id VARCHAR(100) REFERENCES markets(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, market_id)
);

CREATE TABLE IF NOT EXISTS user_price_alerts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    market_id VARCHAR(100) REFERENCES markets(id) ON DELETE CASCADE,
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

-- 7. SUBSCRIPTION SYSTEM
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

CREATE TABLE IF NOT EXISTS user_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_id INTEGER REFERENCES subscription_plans(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    payment_id VARCHAR(255),
    payment_method VARCHAR(50),
    amount_paid DECIMAL(10, 2),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    auto_renew BOOLEAN DEFAULT FALSE,
    activated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    activated_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_payments (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255) UNIQUE,
    payment_status VARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    receipt_url TEXT
);

CREATE TABLE IF NOT EXISTS subscription_expiry_notifications (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscription_id)
);

-- 8. ADVERTISEMENT SYSTEM
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
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    clicks_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ad_statistics (
    id SERIAL PRIMARY KEY,
    ad_id INTEGER REFERENCES vendor_advertisements(id) ON DELETE CASCADE,
    event_type VARCHAR(50) CHECK (event_type IN ('view', 'click', 'conversion')),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. NOTIFICATION SYSTEM
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

CREATE TABLE IF NOT EXISTS notification_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) CHECK (alert_type IN ('price_below', 'price_above', 'price_change', 'price_approval', 'price_rejection', 'anomaly_alert', 'system_update')),
    is_enabled BOOLEAN DEFAULT TRUE,
    notification_method VARCHAR(20) DEFAULT 'email' CHECK (notification_method IN ('email', 'push', 'both')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, alert_type)
);

-- Price alerts table (for user-created alerts)
CREATE TABLE IF NOT EXISTS user_price_alerts_new (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    market_id VARCHAR(100) REFERENCES markets(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) CHECK (alert_type IN ('below', 'above', 'change')),
    threshold DECIMAL(10, 2) NOT NULL,
    percentage_threshold DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered_at TIMESTAMP,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pending_approvals (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) CHECK (entity_type IN ('price', 'advertisement', 'vendor_registration', 'business_registration')),
    entity_id INTEGER NOT NULL,
    vendor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'normal',
    status VARCHAR(20) DEFAULT 'pending',
    admin_notes TEXT,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP
);

-- 10. REPORTING & ANALYTICS
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(100) CHECK (report_type IN (
        'price_trends', 'vendor_performance', 'subscription_revenue',
        'ad_performance', 'market_analysis', 'user_activity',
        'anomaly_report'
    )),
    generated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255),
    description TEXT,
    parameters JSONB,
    file_url TEXT,
    file_format VARCHAR(20),
    schedule VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
-- RECREATE ALL FUNCTIONS AND TRIGGERS
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

-- Main anomaly detection function
CREATE OR REPLACE FUNCTION detect_price_anomaly()
RETURNS TRIGGER AS $$
DECLARE
    ref_price_record RECORD;
    deviation_pct DECIMAL(5, 2);
    anomaly_severity VARCHAR(20);
    anomaly_type_val VARCHAR(50);
    anomaly_id_val INTEGER;
BEGIN
    IF NEW.status = 'pending' AND NEW.vendor_id IS NOT NULL THEN
        
        SELECT * INTO ref_price_record
        FROM get_current_reference_price(NEW.product_id, NEW.market_id);
        
        IF ref_price_record.reference_price IS NOT NULL THEN
            
            deviation_pct := ABS(((NEW.price - ref_price_record.reference_price) / ref_price_record.reference_price) * 100);
            anomaly_severity := calculate_anomaly_severity(deviation_pct);
            
            IF deviation_pct > 5 THEN
                
                IF NEW.price > ref_price_record.reference_price THEN
                    anomaly_type_val := 'price_spike';
                ELSIF NEW.price < ref_price_record.reference_price THEN
                    anomaly_type_val := 'price_drop';
                ELSE
                    anomaly_type_val := 'data_inconsistency';
                END IF;
                
                INSERT INTO price_anomalies (
                    price_id, product_id, market_id, vendor_id, reference_price_id,
                    reference_price, vendor_price, price_difference, deviation_percentage,
                    anomaly_type, severity, status, details, auto_flagged, flag_reason
                ) VALUES (
                    NEW.id, NEW.product_id, NEW.market_id, NEW.vendor_id, ref_price_record.reference_price_id,
                    ref_price_record.reference_price, NEW.price, NEW.price - ref_price_record.reference_price,
                    deviation_pct, anomaly_type_val, anomaly_severity, 'new',
                    CASE WHEN NEW.price > ref_price_record.reference_price THEN
                        'Price is ' || ROUND(deviation_pct, 1) || '% above reference price of ' || 
                        ref_price_record.reference_price || ' RWF'
                    ELSE
                        'Price is ' || ROUND(deviation_pct, 1) || '% below reference price of ' || 
                        ref_price_record.reference_price || ' RWF'
                    END,
                    CASE WHEN anomaly_severity IN ('critical', 'high') THEN TRUE ELSE FALSE END,
                    CASE 
                        WHEN anomaly_severity = 'critical' THEN 'Critical anomaly: Price deviation exceeds 50%'
                        WHEN anomaly_severity = 'high' THEN 'High anomaly: Price deviation exceeds 30%'
                        WHEN anomaly_severity = 'medium' THEN 'Medium anomaly: Price deviation exceeds 15%'
                        ELSE 'Low anomaly: Price deviation exceeds 5%'
                    END
                );
                
                IF anomaly_severity IN ('critical', 'high') THEN
                    UPDATE prices SET flagged = TRUE, flag_reason = 'Auto-flagged: ' || UPPER(anomaly_severity) || ' anomaly detected', status = 'flagged'
                    WHERE id = NEW.id;
                ELSIF anomaly_severity = 'medium' THEN
                    UPDATE prices SET flagged = TRUE, flag_reason = 'Flagged for review: Medium anomaly'
                    WHERE id = NEW.id;
                END IF;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger as AFTER INSERT
DROP TRIGGER IF EXISTS detect_price_anomaly_trigger ON prices;
CREATE TRIGGER detect_price_anomaly_trigger
    AFTER INSERT ON prices
    FOR EACH ROW
    EXECUTE FUNCTION detect_price_anomaly();

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_market ON prices(market_id);
CREATE INDEX IF NOT EXISTS idx_prices_vendor ON prices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_prices_status ON prices(status);
CREATE INDEX IF NOT EXISTS idx_price_anomalies_status ON price_anomalies(status, severity);
CREATE INDEX IF NOT EXISTS idx_price_anomalies_vendor ON price_anomalies(vendor_id);
CREATE INDEX IF NOT EXISTS idx_price_anomalies_price ON price_anomalies(price_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_reference_prices_current ON reference_prices(product_id, market_id, is_current);
CREATE INDEX IF NOT EXISTS idx_user_price_alerts_user ON user_price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_price_alerts_product ON user_price_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_user_price_alerts_active ON user_price_alerts(is_active);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_markets_updated_at BEFORE UPDATE ON markets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_prices_updated_at BEFORE UPDATE ON prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_reference_prices_updated_at BEFORE UPDATE ON reference_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_price_anomalies_updated_at BEFORE UPDATE ON price_anomalies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_vendor_anomaly_scores_updated_at BEFORE UPDATE ON vendor_anomaly_scores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_user_notification_preferences_updated_at BEFORE UPDATE ON user_notification_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_user_price_alerts_updated_at BEFORE UPDATE ON user_price_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

SELECT 'Database setup complete! All tables created or already exist. Triggers configured.' as message;