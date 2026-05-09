-- =============================================
-- COMPLETE DATABASE SCHEMA FOR SMPMPS
-- Smart Market Price Monitoring and Prediction System
-- =============================================

-- =============================================
-- 1. CATEGORIES SYSTEM (Create FIRST - before any table that references it)
-- =============================================

DROP TABLE IF EXISTS subscription_expiry_notifications CASCADE;
DROP TABLE IF EXISTS ad_statistics CASCADE;
DROP TABLE IF EXISTS vendor_advertisements CASCADE;
DROP TABLE IF EXISTS subscription_payments CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;
DROP TABLE IF EXISTS user_price_alerts CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS price_change_history CASCADE;
DROP TABLE IF EXISTS price_history CASCADE;
DROP TABLE IF EXISTS prices CASCADE;
DROP TABLE IF EXISTS business_markets CASCADE;
DROP TABLE IF EXISTS business_users CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS markets CASCADE;
DROP TABLE IF EXISTS pending_approvals CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS vendor_metrics CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS verification_codes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

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
        'price_alert', 'system', 'price_submitted', 'payment_received'
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
-- 12. INITIAL DATA SEEDING (SIMPLIFIED - NO type column reference)
-- =============================================

-- Insert categories (without type column since it doesn't exist in your categories table)
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
-- 13. TRIGGERS FOR UPDATED_AT
-- =============================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

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

-- =============================================
-- SUCCESS MESSAGE
-- =============================================
SELECT 'Database setup complete! All tables created successfully.' as message;