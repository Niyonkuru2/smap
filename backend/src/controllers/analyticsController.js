// src/controllers/analyticsController.js
import { catchAsync } from '../middleware/errorHandler.js';
import pool from '../config/database.js';

// Get main analytics dashboard data
export const getAnalyticsDashboard = catchAsync(async (req, res) => {
    const analytics = await pool.query(`
        SELECT 
            -- Product & Market Stats
            (SELECT COUNT(*) FROM products) as total_products,
            (SELECT COUNT(*) FROM markets) as total_markets,
            
            -- User Stats
            (SELECT COUNT(*) FROM users WHERE role = 'vendor' AND is_active = true) as total_vendors,
            (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
            (SELECT COUNT(*) FROM users) as total_users,
            
            -- Price Stats
            (SELECT COUNT(*) FROM prices) as total_price_submissions,
            (SELECT COUNT(*) FROM prices WHERE status = 'approved') as approved_submissions,
            (SELECT COUNT(*) FROM prices WHERE status = 'pending') as pending_approvals,
            (SELECT COUNT(*) FROM prices WHERE flagged = true) as flagged_submissions,
            (SELECT COUNT(*) FROM prices WHERE DATE(created_at) = CURRENT_DATE) as price_updates_today,
            
            -- Subscription Stats
            (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') as active_subscriptions,
            
            -- Advertisement Stats
            (SELECT COUNT(*) FROM vendor_advertisements) as total_advertisements,
            (SELECT COUNT(*) FROM vendor_advertisements WHERE status = 'active') as active_advertisements,
            
            -- Anomaly Stats
            (SELECT COUNT(*) FROM price_anomalies) as total_anomalies,
            (SELECT COUNT(*) FROM price_anomalies WHERE status = 'new') as new_anomalies,
            (SELECT COUNT(*) FROM price_anomalies WHERE severity = 'critical') as critical_anomalies
    `);
    
    res.json({
        success: true,
        data: analytics.rows[0]
    });
});

// Get popular products (most submitted prices)
export const getPopularProducts = catchAsync(async (req, res) => {
    const { limit = 5 } = req.query;
    
    const result = await pool.query(`
        SELECT 
            p.id,
            p.name,
            COUNT(pr.id) as submissions,
            COUNT(DISTINCT pr.market_id) as markets,
            AVG(pr.price) as avg_price
        FROM products p
        JOIN prices pr ON p.id = pr.product_id
        WHERE pr.status = 'approved'
        GROUP BY p.id, p.name
        ORDER BY submissions DESC
        LIMIT $1
    `, [parseInt(limit)]);
    
    res.json({
        success: true,
        data: result.rows
    });
});

// Get active markets (markets with most price submissions)
export const getActiveMarkets = catchAsync(async (req, res) => {
    const { limit = 5 } = req.query;
    
    const result = await pool.query(`
        SELECT 
            m.id,
            m.name,
            m.province,
            m.district,
            COUNT(p.id) as submissions,
            COUNT(DISTINCT p.product_id) as unique_products,
            AVG(p.price) as avg_price
        FROM markets m
        JOIN prices p ON m.id = p.market_id
        WHERE p.status = 'approved'
        GROUP BY m.id, m.name, m.province, m.district
        ORDER BY submissions DESC
        LIMIT $1
    `, [parseInt(limit)]);
    
    res.json({
        success: true,
        data: result.rows
    });
});

// Get weekly price submission activity
export const getWeeklyActivity = catchAsync(async (req, res) => {
    const result = await pool.query(`
        WITH dates AS (
            SELECT DATE_TRUNC('day', generate_series)::date as day
            FROM generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                '1 day'
            )
        )
        SELECT 
            TO_CHAR(d.day, 'Dy') as day_name,
            d.day as date,
            COALESCE(COUNT(p.id), 0) as submissions,
            COALESCE(AVG(p.price), 0) as avg_price
        FROM dates d
        LEFT JOIN prices p ON DATE(p.created_at) = d.day
        GROUP BY d.day
        ORDER BY d.day ASC
    `);
    
    res.json({
        success: true,
        data: result.rows
    });
});

// Get category distribution for products
export const getCategoryDistribution = catchAsync(async (req, res) => {
    const result = await pool.query(`
        SELECT 
            COALESCE(c.name, 'Uncategorized') as name,
            COUNT(p.id) as value
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        GROUP BY c.name
        ORDER BY value DESC
        LIMIT 10
    `);
    
    res.json({
        success: true,
        data: result.rows
    });
});

// Get recent price changes (alerts)
export const getPriceAlerts = catchAsync(async (req, res) => {
    const { limit = 5 } = req.query;
    
    const result = await pool.query(`
        SELECT 
            p.name as product,
            m.name as market,
            pr.price as current_price,
            pr.previous_price,
            CASE 
                WHEN pr.previous_price IS NOT NULL THEN 
                    ((pr.price - pr.previous_price) / pr.previous_price) * 100
                ELSE 0
            END as percentage_change,
            pr.created_at as changed_at,
            pr.vendor_notes
        FROM prices pr
        JOIN products p ON pr.product_id = p.id
        JOIN markets m ON pr.market_id = m.id
        WHERE pr.previous_price IS NOT NULL 
            AND pr.price != pr.previous_price
            AND pr.status = 'approved'
        ORDER BY pr.created_at DESC
        LIMIT $1
    `, [parseInt(limit)]);
    
    const formattedAlerts = result.rows.map(row => ({
        product: row.product,
        market: row.market,
        current_price: parseFloat(row.current_price),
        previous_price: parseFloat(row.previous_price),
        change: `${row.percentage_change > 0 ? '+' : ''}${row.percentage_change.toFixed(1)}%`,
        type: row.percentage_change > 0 ? 'increase' : 'decrease',
        percentage: parseFloat(row.percentage_change),
        date: row.changed_at
    }));
    
    res.json({
        success: true,
        data: formattedAlerts
    });
});

// Get monthly trend data
export const getMonthlyTrend = catchAsync(async (req, res) => {
    const { months = 6 } = req.query;
    
    const result = await pool.query(`
        SELECT 
            TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
            COUNT(*) as submissions,
            AVG(price) as avg_price,
            COUNT(DISTINCT vendor_id) as active_vendors
        FROM prices
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '${parseInt(months)} months')
            AND status = 'approved'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY DATE_TRUNC('month', created_at) ASC
    `);
    
    res.json({
        success: true,
        data: result.rows
    });
});

// Get top vendors by submissions
export const getTopVendors = catchAsync(async (req, res) => {
    const { limit = 5 } = req.query;
    
    const result = await pool.query(`
        SELECT 
            u.id,
            u.name,
            u.email,
            COUNT(p.id) as submissions,
            COUNT(DISTINCT p.product_id) as unique_products,
            AVG(p.price) as avg_price,
            COALESCE(vas.trust_score, 100) as trust_score
        FROM users u
        JOIN prices p ON u.id = p.vendor_id
        LEFT JOIN vendor_anomaly_scores vas ON u.id = vas.vendor_id
        WHERE u.role = 'vendor'
            AND p.status = 'approved'
        GROUP BY u.id, u.name, u.email, vas.trust_score
        ORDER BY submissions DESC
        LIMIT $1
    `, [parseInt(limit)]);
    
    res.json({
        success: true,
        data: result.rows
    });
});

// Get price range distribution
export const getPriceRangeDistribution = catchAsync(async (req, res) => {
    const result = await pool.query(`
        SELECT 
            CASE 
                WHEN price < 500 THEN '< 500 RWF'
                WHEN price BETWEEN 500 AND 1000 THEN '500 - 1000 RWF'
                WHEN price BETWEEN 1001 AND 2000 THEN '1001 - 2000 RWF'
                WHEN price BETWEEN 2001 AND 5000 THEN '2001 - 5000 RWF'
                ELSE '> 5000 RWF'
            END as price_range,
            COUNT(*) as count
        FROM prices
        WHERE status = 'approved'
        GROUP BY price_range
        ORDER BY MIN(price)
    `);
    
    res.json({
        success: true,
        data: result.rows
    });
});

// Get summary statistics for dashboard cards
export const getSummaryStats = catchAsync(async (req, res) => {
    const result = await pool.query(`
        SELECT 
            -- Growth metrics
            COUNT(*) as total_approved_prices,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as last_30_days,
            
            -- Average price metrics
            AVG(price) as avg_price,
            MIN(price) as min_price,
            MAX(price) as max_price,
            
            -- Vendor metrics
            COUNT(DISTINCT vendor_id) as active_vendors,
            COUNT(DISTINCT product_id) as active_products,
            COUNT(DISTINCT market_id) as active_markets
        FROM prices
        WHERE status = 'approved'
    `);
    
    res.json({
        success: true,
        data: result.rows[0]
    });
});

// Get anomaly statistics for dashboard
export const getAnomalyStatsForDashboard = catchAsync(async (req, res) => {
    const result = await pool.query(`
        SELECT 
            COUNT(*) as total_anomalies,
            COUNT(*) FILTER (WHERE severity = 'critical') as critical,
            COUNT(*) FILTER (WHERE severity = 'high') as high,
            COUNT(*) FILTER (WHERE severity = 'medium') as medium,
            COUNT(*) FILTER (WHERE severity = 'low') as low,
            COUNT(*) FILTER (WHERE status = 'new') as new,
            COUNT(*) FILTER (WHERE status = 'investigating') as investigating,
            COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
            COUNT(*) FILTER (WHERE status = 'dismissed') as dismissed,
            ROUND(AVG(deviation_percentage), 2) as avg_deviation
        FROM price_anomalies
    `);
    
    res.json({
        success: true,
        data: result.rows[0]
    });
});