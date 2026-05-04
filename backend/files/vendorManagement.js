/**
 * Enhanced Vendor Management Module - Backend
 * Vendor profiles, inventory management, sales analytics
 */

import { db } from './database.js';

// Initialize vendor-specific tables
export async function initializeVendorTables() {
    await db.query(`
        -- Vendor profiles with additional business info
        CREATE TABLE IF NOT EXISTS vendor_profiles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
            business_name VARCHAR(255),
            business_type VARCHAR(100),
            license_number VARCHAR(100),
            tax_id VARCHAR(100),
            phone_business VARCHAR(50),
            bio TEXT,
            logo_url TEXT,
            banner_url TEXT,
            rating DECIMAL(3,2) DEFAULT 0,
            total_reviews INTEGER DEFAULT 0,
            total_sales INTEGER DEFAULT 0,
            is_verified BOOLEAN DEFAULT FALSE,
            verified_at TIMESTAMP,
            operating_hours JSONB,
            payment_methods TEXT[],
            delivery_available BOOLEAN DEFAULT FALSE,
            delivery_radius_km DECIMAL(5,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Vendor inventory
        CREATE TABLE IF NOT EXISTS vendor_inventory (
            id SERIAL PRIMARY KEY,
            vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            quantity DECIMAL(10,2),
            unit VARCHAR(50),
            price DECIMAL(10,2) NOT NULL,
            min_order_quantity DECIMAL(10,2) DEFAULT 1,
            is_available BOOLEAN DEFAULT TRUE,
            restock_date DATE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(vendor_id, product_id)
        );

        -- Vendor sales records
        CREATE TABLE IF NOT EXISTS vendor_sales (
            id SERIAL PRIMARY KEY,
            vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            customer_id INTEGER REFERENCES users(id),
            product_id INTEGER REFERENCES products(id),
            quantity DECIMAL(10,2) NOT NULL,
            unit_price DECIMAL(10,2) NOT NULL,
            total_price DECIMAL(10,2) NOT NULL,
            payment_method VARCHAR(50),
            sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            notes TEXT
        );

        -- Vendor analytics cache
        CREATE TABLE IF NOT EXISTS vendor_analytics (
            id SERIAL PRIMARY KEY,
            vendor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            total_sales DECIMAL(12,2) DEFAULT 0,
            total_orders INTEGER DEFAULT 0,
            total_views INTEGER DEFAULT 0,
            top_products JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(vendor_id, date)
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_vendor_inventory_vendor ON vendor_inventory(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_vendor_sales_vendor ON vendor_sales(vendor_id);
        CREATE INDEX IF NOT EXISTS idx_vendor_sales_date ON vendor_sales(sale_date);
    `);
}

// ============ Vendor Profile ============

export async function createVendorProfile(userId, profileData) {
    const {
        businessName = '',
        businessType = '',
        licenseNumber = '',
        taxId = '',
        phoneB = null,
        bio = '',
        operatingHours = null,
        paymentMethods = [],
        deliveryAvailable = false,
        deliveryRadiusKm = null
    } = profileData;

    const result = await db.query(
        `INSERT INTO vendor_profiles 
         (user_id, business_name, business_type, license_number, tax_id, 
          phone_business, bio, operating_hours, payment_methods, 
          delivery_available, delivery_radius_km)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (user_id) DO UPDATE SET
             business_name = EXCLUDED.business_name,
             business_type = EXCLUDED.business_type,
             license_number = EXCLUDED.license_number,
             tax_id = EXCLUDED.tax_id,
             phone_business = EXCLUDED.phone_business,
             bio = EXCLUDED.bio,
             operating_hours = EXCLUDED.operating_hours,
             payment_methods = EXCLUDED.payment_methods,
             delivery_available = EXCLUDED.delivery_available,
             delivery_radius_km = EXCLUDED.delivery_radius_km,
             updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, businessName, businessType, licenseNumber, taxId, 
         phoneB, bio, JSON.stringify(operatingHours), paymentMethods,
         deliveryAvailable, deliveryRadiusKm]
    );

    return result.rows[0];
}

export async function getVendorProfile(userId) {
    const result = await db.query(
        `SELECT vp.*, u.name, u.email, m.name as market_name, m.id as market_id
         FROM vendor_profiles vp
         JOIN users u ON vp.user_id = u.id
         LEFT JOIN markets m ON u.market_id = m.id
         WHERE vp.user_id = $1`,
        [userId]
    );
    return result.rows[0];
}

export async function getPublicVendorProfile(vendorId) {
    const result = await db.query(
        `SELECT u.id, u.name, vp.business_name, vp.business_type, vp.bio,
                vp.logo_url, vp.banner_url, vp.rating, vp.total_reviews,
                vp.is_verified, vp.operating_hours, vp.payment_methods,
                vp.delivery_available, vp.delivery_radius_km,
                m.name as market_name, m.province, m.district
         FROM users u
         LEFT JOIN vendor_profiles vp ON u.id = vp.user_id
         LEFT JOIN markets m ON u.market_id = m.id
         WHERE u.id = $1 AND u.role = 'vendor'`,
        [vendorId]
    );
    return result.rows[0];
}

// ============ Inventory Management ============

export async function addToInventory(vendorId, productId, inventoryData) {
    const { quantity, unit, price, minOrderQuantity = 1, isAvailable = true, restockDate, notes } = inventoryData;

    const result = await db.query(
        `INSERT INTO vendor_inventory 
         (vendor_id, product_id, quantity, unit, price, min_order_quantity, is_available, restock_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (vendor_id, product_id) DO UPDATE SET
             quantity = EXCLUDED.quantity,
             unit = EXCLUDED.unit,
             price = EXCLUDED.price,
             min_order_quantity = EXCLUDED.min_order_quantity,
             is_available = EXCLUDED.is_available,
             restock_date = EXCLUDED.restock_date,
             notes = EXCLUDED.notes,
             updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [vendorId, productId, quantity, unit, price, minOrderQuantity, isAvailable, restockDate, notes]
    );

    return result.rows[0];
}

export async function getInventory(vendorId, options = {}) {
    const { category, available = null, lowStock = false, search } = options;
    
    let query = `
        SELECT vi.*, p.name as product_name, p.category, p.image_url
        FROM vendor_inventory vi
        JOIN products p ON vi.product_id = p.id
        WHERE vi.vendor_id = $1
    `;
    const params = [vendorId];
    let paramCount = 1;

    if (category) {
        paramCount++;
        query += ` AND p.category = $${paramCount}`;
        params.push(category);
    }

    if (available !== null) {
        paramCount++;
        query += ` AND vi.is_available = $${paramCount}`;
        params.push(available);
    }

    if (lowStock) {
        query += ` AND vi.quantity < 10`;
    }

    if (search) {
        paramCount++;
        query += ` AND p.name ILIKE $${paramCount}`;
        params.push(`%${search}%`);
    }

    query += ' ORDER BY p.category, p.name';

    const result = await db.query(query, params);
    return result.rows;
}

export async function updateInventoryItem(vendorId, inventoryId, updates) {
    const allowedFields = ['quantity', 'price', 'is_available', 'min_order_quantity', 'restock_date', 'notes'];
    const setClause = [];
    const params = [vendorId, inventoryId];
    let paramCount = 2;

    for (const [key, value] of Object.entries(updates)) {
        const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // camelCase to snake_case
        if (allowedFields.includes(dbKey)) {
            paramCount++;
            setClause.push(`${dbKey} = $${paramCount}`);
            params.push(value);
        }
    }

    if (setClause.length === 0) {
        return null;
    }

    setClause.push('updated_at = CURRENT_TIMESTAMP');

    const result = await db.query(
        `UPDATE vendor_inventory SET ${setClause.join(', ')} 
         WHERE vendor_id = $1 AND id = $2 RETURNING *`,
        params
    );

    return result.rows[0];
}

export async function removeFromInventory(vendorId, inventoryId) {
    const result = await db.query(
        'DELETE FROM vendor_inventory WHERE vendor_id = $1 AND id = $2 RETURNING *',
        [vendorId, inventoryId]
    );
    return result.rows[0];
}

// ============ Sales Tracking ============

export async function recordSale(vendorId, saleData) {
    const { customerId, productId, quantity, unitPrice, paymentMethod, notes } = saleData;
    const totalPrice = quantity * unitPrice;

    const result = await db.query(
        `INSERT INTO vendor_sales 
         (vendor_id, customer_id, product_id, quantity, unit_price, total_price, payment_method, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [vendorId, customerId, productId, quantity, unitPrice, totalPrice, paymentMethod, notes]
    );

    // Update inventory quantity
    await db.query(
        `UPDATE vendor_inventory SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP 
         WHERE vendor_id = $2 AND product_id = $3`,
        [quantity, vendorId, productId]
    );

    // Update vendor total sales
    await db.query(
        `UPDATE vendor_profiles SET total_sales = total_sales + 1 WHERE user_id = $1`,
        [vendorId]
    );

    return result.rows[0];
}

export async function getSales(vendorId, options = {}) {
    const { startDate, endDate, productId, limit = 50 } = options;
    
    let query = `
        SELECT vs.*, p.name as product_name, u.name as customer_name
        FROM vendor_sales vs
        JOIN products p ON vs.product_id = p.id
        LEFT JOIN users u ON vs.customer_id = u.id
        WHERE vs.vendor_id = $1
    `;
    const params = [vendorId];
    let paramCount = 1;

    if (startDate) {
        paramCount++;
        query += ` AND vs.sale_date >= $${paramCount}`;
        params.push(startDate);
    }

    if (endDate) {
        paramCount++;
        query += ` AND vs.sale_date <= $${paramCount}`;
        params.push(endDate);
    }

    if (productId) {
        paramCount++;
        query += ` AND vs.product_id = $${paramCount}`;
        params.push(productId);
    }

    query += ` ORDER BY vs.sale_date DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows;
}

// ============ Vendor Analytics ============

export async function getVendorAnalytics(vendorId, period = '30d') {
    const intervals = {
        '7d': '7 days',
        '30d': '30 days',
        '90d': '90 days',
        '1y': '1 year'
    };
    const interval = intervals[period] || '30 days';

    // Sales summary
    const salesSummary = await db.query(
        `SELECT 
            COUNT(*) as total_orders,
            SUM(total_price) as total_revenue,
            AVG(total_price) as avg_order_value,
            SUM(quantity) as total_units_sold
         FROM vendor_sales
         WHERE vendor_id = $1 AND sale_date >= NOW() - INTERVAL '${interval}'`,
        [vendorId]
    );

    // Top products
    const topProducts = await db.query(
        `SELECT p.name, p.id, SUM(vs.quantity) as total_sold, SUM(vs.total_price) as revenue
         FROM vendor_sales vs
         JOIN products p ON vs.product_id = p.id
         WHERE vs.vendor_id = $1 AND vs.sale_date >= NOW() - INTERVAL '${interval}'
         GROUP BY p.id, p.name
         ORDER BY revenue DESC
         LIMIT 5`,
        [vendorId]
    );

    // Daily trends
    const dailyTrends = await db.query(
        `SELECT DATE(sale_date) as date, COUNT(*) as orders, SUM(total_price) as revenue
         FROM vendor_sales
         WHERE vendor_id = $1 AND sale_date >= NOW() - INTERVAL '${interval}'
         GROUP BY DATE(sale_date)
         ORDER BY date`,
        [vendorId]
    );

    // Inventory stats
    const inventoryStats = await db.query(
        `SELECT 
            COUNT(*) as total_products,
            SUM(CASE WHEN is_available THEN 1 ELSE 0 END) as available_products,
            SUM(CASE WHEN quantity < 10 THEN 1 ELSE 0 END) as low_stock_count,
            SUM(quantity * price) as inventory_value
         FROM vendor_inventory
         WHERE vendor_id = $1`,
        [vendorId]
    );

    return {
        success: true,
        period,
        sales: {
            totalOrders: parseInt(salesSummary.rows[0]?.total_orders || 0),
            totalRevenue: Math.round(parseFloat(salesSummary.rows[0]?.total_revenue || 0)),
            avgOrderValue: Math.round(parseFloat(salesSummary.rows[0]?.avg_order_value || 0)),
            totalUnitsSold: parseInt(salesSummary.rows[0]?.total_units_sold || 0)
        },
        topProducts: topProducts.rows.map(p => ({
            id: p.id,
            name: p.name,
            totalSold: parseInt(p.total_sold),
            revenue: Math.round(parseFloat(p.revenue))
        })),
        dailyTrends: dailyTrends.rows.map(d => ({
            date: d.date,
            orders: parseInt(d.orders),
            revenue: Math.round(parseFloat(d.revenue))
        })),
        inventory: {
            totalProducts: parseInt(inventoryStats.rows[0]?.total_products || 0),
            availableProducts: parseInt(inventoryStats.rows[0]?.available_products || 0),
            lowStockCount: parseInt(inventoryStats.rows[0]?.low_stock_count || 0),
            inventoryValue: Math.round(parseFloat(inventoryStats.rows[0]?.inventory_value || 0))
        }
    };
}

// ============ API Routes ============

export function setupVendorRoutes(app, authMiddleware) {
    // Get vendor profile
    app.get('/api/vendor/profile', authMiddleware, async (req, res) => {
        try {
            if (req.user.role !== 'vendor') {
                return res.status(403).json({ error: 'Vendor access required' });
            }
            const profile = await getVendorProfile(req.user.id);
            res.json({ success: true, profile });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Update vendor profile
    app.put('/api/vendor/profile', authMiddleware, async (req, res) => {
        try {
            if (req.user.role !== 'vendor') {
                return res.status(403).json({ error: 'Vendor access required' });
            }
            const profile = await createVendorProfile(req.user.id, req.body);
            res.json({ success: true, profile });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Get public vendor profile
    app.get('/api/vendor/:vendorId/public', async (req, res) => {
        try {
            const profile = await getPublicVendorProfile(req.params.vendorId);
            if (!profile) {
                return res.status(404).json({ error: 'Vendor not found' });
            }
            res.json({ success: true, profile });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Inventory management
    app.get('/api/vendor/inventory', authMiddleware, async (req, res) => {
        try {
            const inventory = await getInventory(req.user.id, req.query);
            res.json({ success: true, inventory });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.post('/api/vendor/inventory', authMiddleware, async (req, res) => {
        try {
            const { productId, ...data } = req.body;
            const item = await addToInventory(req.user.id, productId, data);
            res.json({ success: true, item });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.put('/api/vendor/inventory/:id', authMiddleware, async (req, res) => {
        try {
            const item = await updateInventoryItem(req.user.id, req.params.id, req.body);
            res.json({ success: true, item });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.delete('/api/vendor/inventory/:id', authMiddleware, async (req, res) => {
        try {
            await removeFromInventory(req.user.id, req.params.id);
            res.json({ success: true });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Sales
    app.post('/api/vendor/sales', authMiddleware, async (req, res) => {
        try {
            const sale = await recordSale(req.user.id, req.body);
            res.json({ success: true, sale });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    app.get('/api/vendor/sales', authMiddleware, async (req, res) => {
        try {
            const sales = await getSales(req.user.id, req.query);
            res.json({ success: true, sales });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });

    // Analytics
    app.get('/api/vendor/analytics', authMiddleware, async (req, res) => {
        try {
            const analytics = await getVendorAnalytics(req.user.id, req.query.period);
            res.json(analytics);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
}

export default {
    initializeVendorTables,
    createVendorProfile,
    getVendorProfile,
    getPublicVendorProfile,
    addToInventory,
    getInventory,
    updateInventoryItem,
    removeFromInventory,
    recordSale,
    getSales,
    getVendorAnalytics,
    setupVendorRoutes
};
