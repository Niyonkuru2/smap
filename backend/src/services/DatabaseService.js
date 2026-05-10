import pool, { getPool } from '../config/database.js';

class DatabaseService {
    constructor() {
        this.pool = pool;
    }

    async query(text, params) {
        try {
            return await this.pool.query(text, params);
        } catch (error) {
            console.error('Database query error:', error.message, 'SQL:', text);
            throw error;
        }
    }

    async testConnection() {
        try {
            const result = await this.pool.query('SELECT 1');
            console.log('PostgreSQL database connected successfully');
            return true;
        } catch (error) {
            console.error('PostgreSQL connection failed:', error.message);
            return false;
        }
    }

    async initializeDatabase() {
        try {
            // ============================================
            // 1. CATEGORIES TABLE (Must be created first)
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS categories (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) UNIQUE NOT NULL,
                    description TEXT,
                    type VARCHAR(50) DEFAULT 'product' CHECK (type IN ('product', 'vendor', 'business', 'all')),
                    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Categories table created');

            // ============================================
            // 2. USERS TABLE (Using category_id, not category)
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    name VARCHAR(255) NOT NULL,
                    role VARCHAR(50) DEFAULT 'consumer' CHECK (role IN ('consumer', 'vendor', 'business', 'admin')),
                    phone VARCHAR(20),
                    market_id VARCHAR(255),
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
                )
            `);
            console.log('✅ Users table created');

            // ============================================
            // 3. VERIFICATION CODES TABLE
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS verification_codes (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) NOT NULL,
                    code VARCHAR(10) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Verification codes table created');

            // ============================================
            // 4. SESSIONS TABLE
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS sessions (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    token_hash VARCHAR(255) NOT NULL,
                    expires_at TIMESTAMP NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Sessions table created');

            // ============================================
            // 5. PRODUCTS TABLE (Using category_id)
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) UNIQUE NOT NULL,
                    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
                    unit VARCHAR(50) NOT NULL,
                    description TEXT,
                    image_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Products table created');

            // ============================================
            // 6. MARKETS TABLE
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS markets (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    province VARCHAR(100) NOT NULL,
                    district VARCHAR(100) NOT NULL,
                    latitude DECIMAL(10, 8),
                    longitude DECIMAL(11, 8),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Markets table created');

            // ============================================
            // 7. BUSINESS USERS TABLE
            // ============================================
            await this.pool.query(`
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
                )
            `);
            console.log('Business users table created');

            // ============================================
            // 8. BUSINESS MARKETS TABLE
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS business_markets (
                    id SERIAL PRIMARY KEY,
                    business_id INTEGER REFERENCES business_users(id) ON DELETE CASCADE,
                    market_id VARCHAR(255) REFERENCES markets(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(business_id, market_id)
                )
            `);
            console.log('Business markets table created');

            // ============================================
            // 9. PRICES TABLE
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS prices (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER REFERENCES products(id),
                    market_id VARCHAR(255) REFERENCES markets(id),
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
                )
            `);
            console.log('Prices table created');

            // ============================================
            // 10. PRICE HISTORY TABLE
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS price_history (
                    id SERIAL PRIMARY KEY,
                    price_id INTEGER REFERENCES prices(id),
                    old_price DECIMAL(10, 2),
                    new_price DECIMAL(10, 2),
                    changed_by INTEGER REFERENCES users(id),
                    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Price history table created');

            // ============================================
            // 11. PRICE CHANGE HISTORY TABLE
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS price_change_history (
                    id SERIAL PRIMARY KEY,
                    price_id INTEGER REFERENCES prices(id),
                    product_id INTEGER REFERENCES products(id),
                    market_id VARCHAR(255) REFERENCES markets(id),
                    old_price DECIMAL(10, 2),
                    new_price DECIMAL(10, 2),
                    percentage_change DECIMAL(5, 2),
                    change_type VARCHAR(20) CHECK (change_type IN ('increase', 'decrease', 'new')),
                    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Price change history table created');

            // ============================================
            // 12. FAVORITES TABLE
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS favorites (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                    market_id VARCHAR(255) REFERENCES markets(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, product_id, market_id)
                )
            `);
            console.log('Favorites table created');

            // ============================================
            // 13. USER PRICE ALERTS TABLE
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS user_price_alerts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                    market_id VARCHAR(255) REFERENCES markets(id),
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
                )
            `);
            console.log('User price alerts table created');

            // ============================================
            // 14. SUBSCRIPTION PLANS TABLE
            // ============================================
            await this.pool.query(`
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
                )
            `);
            console.log('✅ Subscription plans table created');

            // ============================================
            // 15. USER SUBSCRIPTIONS TABLE
            // ============================================
            await this.pool.query(`
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
                )
            `);
            console.log('✅ User subscriptions table created');

            // ============================================
            // 16. SUBSCRIPTION PAYMENTS TABLE
            // ============================================
            await this.pool.query(`
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
                )
            `);
            console.log('✅ Subscription payments table created');

            // ============================================
            // 17. NOTIFICATIONS TABLE
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    type VARCHAR(50) DEFAULT 'info',
                    notification_type VARCHAR(50),
                    data JSONB,
                    priority VARCHAR(20) DEFAULT 'normal',
                    is_read BOOLEAN DEFAULT FALSE,
                    read_at TIMESTAMP,
                    action_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Notifications table created');

            // ============================================
            // 18. VENDOR METRICS TABLE
            // ============================================
            await this.pool.query(`
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
                )
            `);
            console.log('✅ Vendor metrics table created');

            // ============================================
            // 19. AUDIT LOGS TABLE
            // ============================================
            await this.pool.query(`
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    action VARCHAR(255),
                    details TEXT,
                    ip_address VARCHAR(45),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Audit logs table created');

            // ============================================
            // CREATE INDEXES
            // ============================================
            await this.pool.query(`
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
                CREATE INDEX IF NOT EXISTS idx_users_category ON users(category_id);
                CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
                CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);
                CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
                CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);
                CREATE INDEX IF NOT EXISTS idx_prices_market ON prices(market_id);
                CREATE INDEX IF NOT EXISTS idx_prices_vendor ON prices(vendor_id);
                CREATE INDEX IF NOT EXISTS idx_prices_status ON prices(status);
                CREATE INDEX IF NOT EXISTS idx_prices_created ON prices(created_at);
                CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
                CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
                CREATE INDEX IF NOT EXISTS idx_business_users_user ON business_users(user_id);
                CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorites(user_id);
                CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON user_price_alerts(user_id);
            `);
            console.log('✅ Indexes created');

            // ============================================
            // INSERT DEFAULT DATA
            // ============================================
            
            // Insert default categories
            await this.pool.query(`
                INSERT INTO categories (name, description, type) VALUES
                ('Grains', 'Cereal grains and grain products', 'product'),
                ('Legumes', 'Beans, lentils, and pulses', 'product'),
                ('Vegetables', 'Fresh and processed vegetables', 'product'),
                ('Fruits', 'Fresh and dried fruits', 'product'),
                ('Proteins', 'Meat, fish, eggs, and dairy', 'product'),
                ('Cooking Essentials', 'Oil, salt, sugar, and spices', 'product'),
                ('Agriculture', 'Farming and agricultural products', 'business'),
                ('Retail', 'Retail stores and supermarkets', 'business'),
                ('Wholesale', 'Wholesale distributors', 'business'),
                ('Hospitality', 'Hotels, restaurants, and catering', 'business'),
                ('General Vendor', 'Default category for vendors', 'vendor')
                ON CONFLICT (name) DO NOTHING
            `);
            console.log('✅ Default categories inserted');

            // Insert default subscription plans
            await this.pool.query(`
                INSERT INTO subscription_plans (name, description, price, duration_days, max_products, max_price_submissions, priority_support, featured_listing, analytics_access) VALUES
                ('Basic', 'For small vendors starting out', 0, 30, 50, 100, false, false, false),
                ('Premium', 'For established vendors', 25000, 30, 200, 500, true, true, false),
                ('Enterprise', 'For large businesses', 75000, 30, NULL, NULL, true, true, true)
                ON CONFLICT (name) DO NOTHING
            `);
            console.log('✅ Default subscription plans inserted');

            // Insert default markets
            await this.pool.query(`
                INSERT INTO markets (id, name, province, district, latitude, longitude) VALUES
                ('nyarugenge', 'Nyarugenge Market', 'Kigali City', 'Nyarugenge', -1.9536, 30.0606),
                ('kimironko', 'Kimironko Market', 'Kigali City', 'Gasabo', -1.9394, 30.1027),
                ('kicukiro', 'Kicukiro Market', 'Kigali City', 'Kicukiro', -1.9867, 30.0644),
                ('musanze', 'Musanze Modern Market', 'Northern', 'Musanze', -1.4994, 29.6350),
                ('rubavu', 'Gisenyi Market', 'Western', 'Rubavu', -1.6778, 29.2561),
                ('huye', 'Huye Central Market', 'Southern', 'Huye', -2.5964, 29.7394),
                ('rwamagana', 'Rwamagana Market', 'Eastern', 'Rwamagana', -1.9494, 30.4344)
                ON CONFLICT (id) DO NOTHING
            `);
            console.log('✅ Default markets inserted');

            console.log('PostgreSQL database tables initialized successfully');
            return true;
        } catch (error) {
            console.error('Database initialization error:', error.message);
            throw error;
        }
    }

    getPool() {
        return getPool();
    }
}

export default new DatabaseService();