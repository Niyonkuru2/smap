// src/controllers/priceAlertController.js
import { catchAsync } from '../middleware/errorHandler.js';
import pool from '../config/database.js';
import { createNotification } from '../utils/notificationHelper.js';

/**
 * Get all price alerts for the authenticated user
 */
export const getUserPriceAlerts = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const result = await pool.query(`
        SELECT 
            pa.id,
            pa.user_id,
            pa.product_id,
            pa.market_id,
            pa.alert_type,
            pa.target_price as threshold,
            pa.percentage_threshold,
            pa.is_active,
            pa.last_triggered_at,
            pa.trigger_count,
            pa.created_at,
            pa.updated_at,
            COALESCE(p.name, 'All Products') as product_name,
            p.unit as product_unit,
            COALESCE(m.name, 'All Markets') as market_name,
            m.province,
            m.district
        FROM user_price_alerts pa
        LEFT JOIN products p ON pa.product_id = p.id
        LEFT JOIN markets m ON pa.market_id = m.id
        WHERE pa.user_id = $1
        ORDER BY pa.created_at DESC
    `, [userId]);
    
    res.json({
        success: true,
        alerts: result.rows,
        count: result.rows.length
    });
});

/**
 * Get a single price alert by ID
 */
export const getPriceAlertById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(`
        SELECT 
            pa.*,
            pa.target_price as threshold,
            COALESCE(p.name, 'All Products') as product_name,
            COALESCE(m.name, 'All Markets') as market_name
        FROM user_price_alerts pa
        LEFT JOIN products p ON pa.product_id = p.id
        LEFT JOIN markets m ON pa.market_id = m.id
        WHERE pa.id = $1 AND pa.user_id = $2
    `, [id, userId]);
    
    if (result.rows.length === 0) {
        return res.status(404).json({ 
            success: false, 
            message: 'Price alert not found' 
        });
    }
    
    res.json({
        success: true,
        alert: result.rows[0]
    });
});

/**
 * Create a new price alert
 */
export const createPriceAlert = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { productId, productName, marketId, marketName, alertType, threshold, percentageThreshold } = req.body;
    
    // Validate required fields
    if (!alertType || !threshold) {
        return res.status(400).json({ 
            success: false, 
            message: 'Alert type and threshold are required' 
        });
    }
    
    // Validate alert type
    const validAlertTypes = ['below', 'above', 'change'];
    if (!validAlertTypes.includes(alertType)) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid alert type. Must be below, above, or change' 
        });
    }
    
    // Find product ID by name if not provided
    let finalProductId = productId;
    if (!finalProductId && productName && productName !== 'All Products') {
        const productResult = await pool.query(
            'SELECT id FROM products WHERE LOWER(name) = LOWER($1)',
            [productName]
        );
        if (productResult.rows.length > 0) {
            finalProductId = productResult.rows[0].id;
        } else {
            return res.status(404).json({ 
                success: false, 
                message: `Product "${productName}" not found` 
            });
        }
    }
    
    // Find market ID by name if not provided
    let finalMarketId = marketId;
    if (!finalMarketId && marketName && marketName !== 'All Markets') {
        const marketResult = await pool.query(
            'SELECT id FROM markets WHERE LOWER(name) = LOWER($1)',
            [marketName]
        );
        if (marketResult.rows.length > 0) {
            finalMarketId = marketResult.rows[0].id;
        } else {
            return res.status(404).json({ 
                success: false, 
                message: `Market "${marketName}" not found` 
            });
        }
    }
    
    // Check if similar alert already exists
    const existingAlert = await pool.query(
        `SELECT id FROM user_price_alerts 
         WHERE user_id = $1 
            AND (product_id = $2 OR ($2 IS NULL AND product_id IS NULL))
            AND (market_id = $3 OR ($3 IS NULL AND market_id IS NULL))
            AND alert_type = $4
            AND is_active = true`,
        [userId, finalProductId, finalMarketId, alertType]
    );
    
    if (existingAlert.rows.length > 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'You already have an active alert for this product/market combination' 
        });
    }
    
    // Create the alert - using target_price instead of threshold
    const result = await pool.query(
        `INSERT INTO user_price_alerts (
            user_id, 
            product_id, 
            market_id, 
            alert_type, 
            target_price, 
            percentage_threshold,
            is_active,
            created_at,
            updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
         RETURNING *`,
        [userId, finalProductId, finalMarketId, alertType, threshold, percentageThreshold || null]
    );
    
    const newAlert = result.rows[0];
    
    // Get product and market names for response
    const productNameResult = finalProductId 
        ? await pool.query('SELECT name FROM products WHERE id = $1', [finalProductId])
        : null;
    const marketNameResult = finalMarketId 
        ? await pool.query('SELECT name FROM markets WHERE id = $1', [finalMarketId])
        : null;
    
    res.status(201).json({
        success: true,
        alert: {
            ...newAlert,
            threshold: newAlert.target_price,
            product_name: productNameResult?.rows[0]?.name || 'All Products',
            market_name: marketNameResult?.rows[0]?.name || 'All Markets'
        },
        message: 'Price alert created successfully'
    });
});

/**
 * Update a price alert
 */
export const updatePriceAlert = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { is_active, threshold, percentageThreshold, alertType } = req.body;
    
    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(is_active);
    }
    if (threshold !== undefined) {
        updates.push(`target_price = $${paramIndex++}`);
        values.push(threshold);
    }
    if (percentageThreshold !== undefined) {
        updates.push(`percentage_threshold = $${paramIndex++}`);
        values.push(percentageThreshold);
    }
    if (alertType !== undefined) {
        updates.push(`alert_type = $${paramIndex++}`);
        values.push(alertType);
    }
    
    if (updates.length === 0) {
        return res.status(400).json({ 
            success: false, 
            message: 'No fields to update' 
        });
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(id, userId);
    
    const result = await pool.query(
        `UPDATE user_price_alerts 
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
         RETURNING *`,
        [...values, id, userId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ 
            success: false, 
            message: 'Alert not found' 
        });
    }
    
    res.json({
        success: true,
        alert: {
            ...result.rows[0],
            threshold: result.rows[0].target_price
        },
        message: 'Alert updated successfully'
    });
});

/**
 * Delete a price alert
 */
export const deletePriceAlert = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
        'DELETE FROM user_price_alerts WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ 
            success: false, 
            message: 'Alert not found' 
        });
    }
    
    res.json({
        success: true,
        message: 'Alert deleted successfully'
    });
});

/**
 * Toggle price alert (enable/disable)
 */
export const togglePriceAlert = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
        `UPDATE user_price_alerts 
         SET is_active = NOT is_active, 
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, userId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ 
            success: false, 
            message: 'Alert not found' 
        });
    }
    
    res.json({
        success: true,
        alert: {
            ...result.rows[0],
            threshold: result.rows[0].target_price
        },
        message: `Alert ${result.rows[0].is_active ? 'enabled' : 'disabled'}`
    });
});

/**
 * Get alert statistics for the user
 */
export const getAlertStatistics = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const result = await pool.query(`
        SELECT 
            COUNT(*) as total_alerts,
            COUNT(*) FILTER (WHERE is_active = true) as active_alerts,
            COUNT(*) FILTER (WHERE is_active = false) as inactive_alerts,
            COUNT(*) FILTER (WHERE trigger_count > 0) as triggered_alerts,
            COALESCE(SUM(trigger_count), 0) as total_triggers,
            MAX(last_triggered_at) as last_triggered
        FROM user_price_alerts
        WHERE user_id = $1
    `, [userId]);
    
    // Get alerts by type
    const byType = await pool.query(`
        SELECT 
            alert_type,
            COUNT(*) as count,
            COUNT(*) FILTER (WHERE is_active = true) as active_count
        FROM user_price_alerts
        WHERE user_id = $1
        GROUP BY alert_type
    `, [userId]);
    
    res.json({
        success: true,
        stats: result.rows[0],
        byType: byType.rows
    });
});

/**
 * Manually trigger alert check for a specific product (admin only)
 */
export const manualAlertCheck = catchAsync(async (req, res) => {
    const { productId } = req.params;
    
    // Get all active alerts for this product
    const alerts = await pool.query(`
        SELECT 
            pa.*,
            pa.target_price as threshold,
            p.name as product_name,
            m.name as market_name,
            u.email as user_email,
            u.name as user_name
        FROM user_price_alerts pa
        LEFT JOIN products p ON pa.product_id = p.id
        LEFT JOIN markets m ON pa.market_id = m.id
        LEFT JOIN users u ON pa.user_id = u.id
        WHERE pa.is_active = true
            AND (pa.product_id = $1 OR pa.product_id IS NULL)
    `, [productId]);
    
    let triggered = 0;
    for (const alert of alerts.rows) {
        // Get current price
        const priceResult = await pool.query(`
            SELECT price FROM prices 
            WHERE product_id = $1 
                AND status = 'approved'
                AND flagged = false
            ORDER BY created_at DESC LIMIT 1
        `, [alert.product_id || productId]);
        
        if (priceResult.rows.length > 0) {
            const currentPrice = parseFloat(priceResult.rows[0].price);
            const threshold = parseFloat(alert.threshold);
            
            let shouldTrigger = false;
            
            if (alert.alert_type === 'below' && currentPrice <= threshold) {
                shouldTrigger = true;
            } else if (alert.alert_type === 'above' && currentPrice >= threshold) {
                shouldTrigger = true;
            }
            
            if (shouldTrigger) {
                await createNotification(
                    alert.user_id,
                    alert.alert_type === 'below' ? '📉 Price Drop Alert' : '📈 Price Spike Alert',
                    `${alert.product_name} price is now ${currentPrice.toLocaleString()} RWF (Alert: ${alert.alert_type} ${threshold.toLocaleString()} RWF)`,
                    'price_alert',
                    'high',
                    {
                        alert_id: alert.id,
                        product_name: alert.product_name,
                        current_price: currentPrice,
                        threshold: threshold
                    }
                );
                triggered++;
            }
        }
    }
    
    res.json({
        success: true,
        message: `Manual alert check completed. ${triggered} alerts triggered.`,
        triggered
    });
});