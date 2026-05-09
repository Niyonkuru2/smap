-- =============================================
-- COMPLETE DATABASE SCHEMA FOR SMPMPS
-- Smart Market Price Monitoring and Prediction System
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
    category VARCHAR(100),

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
-- 2. PRODUCTS & MARKETS
-- =============================================

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    province VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- 3. PRICE MANAGEMENT
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
-- 4. USER FAVORITES & ALERTS
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
-- 5. SUBSCRIPTION SYSTEM
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- =============================================
-- 6. ADVERTISEMENT SYSTEM
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
-- 7. NOTIFICATION SYSTEM
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
        'price_alert', 'system', 'price_submitted', 'payment_received'
    )),
    data JSONB,
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    action_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscription_expiry_notifications (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER REFERENCES user_subscriptions(id) ON DELETE CASCADE,
    notified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subscription_id)
);
-- Pending approvals tracking
CREATE TABLE IF NOT EXISTS pending_approvals (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) CHECK (entity_type IN ('price', 'advertisement', 'vendor_registration')),
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
-- 8. REPORTING & ANALYTICS
-- =============================================

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    report_type VARCHAR(100) CHECK (report_type IN (
        'price_trends', 'vendor_performance', 'subscription_revenue',
        'ad_performance', 'market_analysis', 'user_activity'
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
-- 9. PERFORMANCE INDEXES
-- =============================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_market ON users(market_id);

-- Price indexes
CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_market ON prices(market_id);
CREATE INDEX IF NOT EXISTS idx_prices_vendor ON prices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_prices_status ON prices(status);
CREATE INDEX IF NOT EXISTS idx_prices_created ON prices(created_at);
CREATE INDEX IF NOT EXISTS idx_prices_approval ON prices(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prices_vendor_status ON prices(vendor_id, status);

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
-- 10. INITIAL DATA SEEDING
-- =============================================

-- Insert subscription plans (using DO block to handle conflicts)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM subscription_plans WHERE name = 'Basic') THEN
        INSERT INTO subscription_plans (name, description, price, duration_days, max_products, max_price_submissions, priority_support, featured_listing, analytics_access) VALUES
        ('Basic', 'For small vendors starting out', 29.99, 30, 50, 100, false, false, false),
        ('Premium', 'For established vendors', 99.99, 30, 200, 500, true, true, false),
        ('Enterprise', 'For large businesses', 299.99, 30, NULL, NULL, true, true, true);
    END IF;
END $$;

-- Insert default products (using DO block to handle conflicts)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Maize/Corn') THEN
        INSERT INTO products (name, category, unit) VALUES
        ('Maize/Corn', 'Grains', 'kg'),
        ('Maize Flour', 'Grains', 'kg'),
        ('Rice (White)', 'Grains', 'kg'),
        ('Rice (Brown)', 'Grains', 'kg'),
        ('Wheat Flour', 'Grains', 'kg'),
        ('Beans', 'Legumes', 'kg'),
        ('Lentils', 'Legumes', 'kg'),
        ('Tomatoes', 'Vegetables', 'kg'),
        ('Onions', 'Vegetables', 'kg'),
        ('Potatoes', 'Vegetables', 'kg'),
        ('Cabbage', 'Vegetables', 'piece'),
        ('Carrots', 'Vegetables', 'kg'),
        ('Spinach', 'Vegetables', 'bunch'),
        ('Eggs', 'Proteins', 'tray'),
        ('Chicken', 'Proteins', 'kg'),
        ('Fish', 'Proteins', 'kg'),
        ('Milk', 'Proteins', 'liter'),
        ('Bananas', 'Fruits', 'bunch'),
        ('Oranges', 'Fruits', 'kg'),
        ('Mangoes', 'Fruits', 'kg'),
        ('Avocado', 'Fruits', 'piece'),
        ('Cooking Oil', 'Cooking Essentials', 'liter'),
        ('Salt', 'Cooking Essentials', 'kg'),
        ('Sugar', 'Cooking Essentials', 'kg'),
        ('Garlic', 'Cooking Essentials', 'kg'),
        ('Ginger', 'Cooking Essentials', 'kg');
    END IF;
END $$;

-- Insert default markets (using DO block to handle conflicts)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM markets WHERE id = 'nyarugenge') THEN
        INSERT INTO markets (id, name, province, district, latitude, longitude) VALUES
        ('nyarugenge', 'Nyarugenge Market', 'Kigali City', 'Nyarugenge', -1.9536, 30.0606),
        ('kimironko', 'Kimironko Market', 'Kigali City', 'Gasabo', -1.9394, 30.1027),
        ('kicukiro', 'Kicukiro Market', 'Kigali City', 'Kicukiro', -1.9867, 30.0644),
        ('musanze', 'Musanze Modern Market', 'Northern', 'Musanze', -1.4994, 29.6350),
        ('rubavu', 'Gisenyi Market', 'Western', 'Rubavu', -1.6778, 29.2561),
        ('huye', 'Huye Central Market', 'Southern', 'Huye', -2.5964, 29.7394),
        ('rwamagana', 'Rwamagana Market', 'Eastern', 'Rwamagana', -1.9494, 30.4344);
    END IF;
END $$;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 'Database setup complete! All tables created successfully.' as message;