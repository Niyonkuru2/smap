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
            await this.pool.query(`
                -- Users table
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
                    verified BOOLEAN DEFAULT false,
                    avatar_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Products table
                CREATE TABLE IF NOT EXISTS products (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(100) NOT NULL,
                    unit VARCHAR(50) NOT NULL,
                    description TEXT,
                    image_url TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Markets table
                CREATE TABLE IF NOT EXISTS markets (
                    id VARCHAR(255) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    province VARCHAR(100) NOT NULL,
                    district VARCHAR(100) NOT NULL,
                    latitude NUMERIC,
                    longitude NUMERIC,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Prices table
                CREATE TABLE IF NOT EXISTS prices (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER REFERENCES products(id),
                    market_id VARCHAR(255) REFERENCES markets(id),
                    vendor_id INTEGER REFERENCES users(id),
                    price NUMERIC NOT NULL,
                    unit VARCHAR(50) NOT NULL,
                    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                    notes TEXT,
                    flagged BOOLEAN DEFAULT false,
                    flag_reason TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Favorites table
                CREATE TABLE IF NOT EXISTS favorites (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                    market_id VARCHAR(255) REFERENCES markets(id),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id, product_id, market_id)
                );

                -- Price alerts table
                CREATE TABLE IF NOT EXISTS price_alerts (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
                    market_id VARCHAR(255) REFERENCES markets(id),
                    target_price NUMERIC NOT NULL,
                    alert_type VARCHAR(50) DEFAULT 'below' CHECK (alert_type IN ('below', 'above')),
                    is_active BOOLEAN DEFAULT true,
                    triggered_at TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Notifications table
                CREATE TABLE IF NOT EXISTS notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    message TEXT NOT NULL,
                    type VARCHAR(50) DEFAULT 'info',
                    is_read BOOLEAN DEFAULT false,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Audit logs table
                CREATE TABLE IF NOT EXISTS audit_logs (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id),
                    action VARCHAR(255),
                    details TEXT,
                    ip_address VARCHAR(45),
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );

                -- Create indexes
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);
                CREATE INDEX IF NOT EXISTS idx_prices_market ON prices(market_id);
                CREATE INDEX IF NOT EXISTS idx_prices_vendor ON prices(vendor_id);
                CREATE INDEX IF NOT EXISTS idx_prices_status ON prices(status);
                CREATE INDEX IF NOT EXISTS idx_prices_created ON prices(created_at);
                CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
            `);

            console.log('PostgreSQL database tables initialized');
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