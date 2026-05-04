import pg from 'pg';
import dotenv from 'dotenv';

// Only load .env in development
const shouldLoadEnv = !process.env.PORT || process.env.NODE_ENV !== 'production';
if (shouldLoadEnv) {
    dotenv.config();
}

console.log('DATABASE CONFIG:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('  DB_HOST:', process.env.DB_HOST);

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';

// Initialize PostgreSQL connection pool
const poolConfig = {
    connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER || 'smpmps_db_user'}:${process.env.DB_PASSWORD || ''}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'smpmps_db'}`,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,  // Increased from 2s to 10s for Render cold starts
    ssl: isProduction
        ? { rejectUnauthorized: false }
        : false
};

const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
});

// Test database connection
export async function testConnection() {
    try {
        const result = await pool.query('SELECT 1');
        console.log('✅ PostgreSQL database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        return false;
    }
}

// Initialize database tables
export async function initializeDatabase() {
    try {
        await pool.query(`
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

        console.log('✅ PostgreSQL database tables initialized');
        return true;
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        throw error;
    }
}

// Seed test users if database is empty (for development/demo)
export async function seedTestUsers() {
    try {
        const bcrypt = await import('bcryptjs');
        
        // Check if users already exist
        const result = await pool.query('SELECT COUNT(*) as count FROM users');
        if (result.rows[0].count > 0) {
            console.log('✅ Database already has users, skipping seed');
            return;
        }

        console.log('🌱 Seeding test users...');
        
        const testUsers = [
            { email: 'admin@example.com', password: 'Pass@1234', name: 'Admin User', role: 'admin' },
            { email: 'vendor@example.com', password: 'Pass@1234', name: 'Vendor User', role: 'vendor' },
            { email: 'consumer@example.com', password: 'Pass@1234', name: 'Consumer User', role: 'consumer' },
            { email: 'business@example.com', password: 'Pass@1234', name: 'Business User', role: 'business' }
        ];

        for (const user of testUsers) {
            const hashedPassword = await bcrypt.default.hash(user.password, 10);
            await pool.query(
                'INSERT INTO users (email, password_hash, name, role, verified) VALUES ($1, $2, $3, $4, $5)',
                [user.email, hashedPassword, user.name, user.role, true]
            );
            console.log(`  ✅ Created: ${user.name} (${user.role})`);
        }
        
        console.log('✅ Test users seeded successfully');
    } catch (error) {
        console.error('⚠️ Failed to seed test users:', error.message);
        // Don't throw - this is optional
    }
}

// Export database wrapper
export const db = {
    query: async (text, params) => {
        try {
            return await pool.query(text, params);
        } catch (error) {
            console.error('Database query error:', error.message, 'SQL:', text);
            throw error;
        }
    },

    users: {
        findByEmail: async (email) => {
            const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
            return result.rows[0];
        },
        findById: async (id) => {
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            return result.rows[0];
        },
        create: async (userData) => {
            const { email, password_hash, name, role, phone, market_id, province, district } = userData;
            const result = await pool.query(
                `INSERT INTO users (email, password_hash, name, role, phone, market_id, province, district, verified)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
                 RETURNING *`,
                [email.toLowerCase(), password_hash, name, role || 'consumer', phone, market_id, province, district]
            );
            return result.rows[0];
        },
        update: async (id, updates) => {
            const keys = Object.keys(updates);
            const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
            const values = [...Object.values(updates), id];
            const result = await pool.query(
                `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $${keys.length + 1} RETURNING *`,
                values
            );
            return result.rows[0];
        },
        getAll: async () => {
            const result = await pool.query(
                'SELECT id, email, name, role, phone, market_id, province, district, verified, created_at FROM users ORDER BY created_at DESC'
            );
            return result.rows;
        }
    },

    products: {
        getAll: async () => {
            const result = await pool.query('SELECT * FROM products ORDER BY category, name');
            return result.rows;
        },
        findById: async (id) => {
            const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
            return result.rows[0];
        }
    },

    markets: {
        getAll: async () => {
            const result = await pool.query('SELECT * FROM markets ORDER BY province, name');
            return result.rows;
        },
        findById: async (id) => {
            const result = await pool.query('SELECT * FROM markets WHERE id = $1', [id]);
            return result.rows[0];
        }
    },

    prices: {
        getAll: async (filters = {}) => {
            let query = `
                SELECT p.*, 
                       pr.name as product_name, pr.category, pr.unit as product_unit,
                       m.name as market_name, m.province, m.district,
                       u.name as vendor_name, u.email as vendor_email
                FROM prices p
                LEFT JOIN products pr ON p.product_id = pr.id
                LEFT JOIN markets m ON p.market_id = m.id
                LEFT JOIN users u ON p.vendor_id = u.id
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            if (filters.status) {
                query += ` AND p.status = $${paramCount++}`;
                params.push(filters.status);
            }
            if (filters.vendor_id) {
                query += ` AND p.vendor_id = $${paramCount++}`;
                params.push(filters.vendor_id);
            }
            if (filters.market_id) {
                query += ` AND p.market_id = $${paramCount++}`;
                params.push(filters.market_id);
            }

            query += ' ORDER BY p.created_at DESC';

            const result = await pool.query(query, params);
            return result.rows;
        },
        create: async (priceData) => {
            const { product_id, market_id, vendor_id, price, unit, notes, status, flagged, flag_reason } = priceData;
            const result = await pool.query(
                `INSERT INTO prices (product_id, market_id, vendor_id, price, unit, notes, status, flagged, flag_reason)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING *`,
                [product_id, market_id, vendor_id, price, unit || 'kg', notes, status || 'pending', flagged || false, flag_reason]
            );
            return result.rows[0];
        },
        updateStatus: async (id, status, adminId) => {
            const result = await pool.query(
                `UPDATE prices SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
                [status, id]
            );
            return result.rows[0];
        }
    },

    favorites: {
        getByUser: async (userId) => {
            const result = await pool.query(
                `SELECT f.*, pr.name as product_name, m.name as market_name
                 FROM favorites f
                 LEFT JOIN products pr ON f.product_id = pr.id
                 LEFT JOIN markets m ON f.market_id = m.id
                 WHERE f.user_id = $1`,
                [userId]
            );
            return result.rows;
        },
        add: async (userId, productId, marketId) => {
            const result = await pool.query(
                `INSERT INTO favorites (user_id, product_id, market_id) VALUES ($1, $2, $3) RETURNING *`,
                [userId, productId, marketId]
            );
            return result.rows[0];
        },
        remove: async (userId, productId, marketId) => {
            await pool.query(
                `DELETE FROM favorites WHERE user_id = $1 AND product_id = $2 AND market_id = $3`,
                [userId, productId, marketId]
            );
            return { success: true };
        }
    },

    priceAlerts: {
        getByUser: async (userId) => {
            const result = await pool.query(
                `SELECT * FROM price_alerts WHERE user_id = $1 AND is_active = true`,
                [userId]
            );
            return result.rows;
        },
        create: async (alertData) => {
            const { user_id, product_id, market_id, target_price, alert_type } = alertData;
            const result = await pool.query(
                `INSERT INTO price_alerts (user_id, product_id, market_id, target_price, alert_type)
                 VALUES ($1, $2, $3, $4, $5)
                 RETURNING *`,
                [user_id, product_id, market_id, target_price, alert_type]
            );
            return result.rows[0];
        },
        delete: async (alertId, userId) => {
            await pool.query(
                `UPDATE price_alerts SET is_active = false WHERE id = $1 AND user_id = $2`,
                [alertId, userId]
            );
            return { success: true };
        }
    },

    notifications: {
        getByUser: async (userId) => {
            const result = await pool.query(
                `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
                [userId]
            );
            return result.rows;
        },
        markAsRead: async (notificationId) => {
            await pool.query(
                `UPDATE notifications SET is_read = true WHERE id = $1`,
                [notificationId]
            );
            return { success: true };
        }
    },

    pool
};

export default db;
