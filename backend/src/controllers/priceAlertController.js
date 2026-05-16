import { catchAsync } from '../middleware/errorHandler.js';
import pool from '../config/database.js';

export const getUserPriceAlerts = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const result = await pool.query(`
        SELECT 
            pa.*,
            p.name as product_name,
            p.unit as product_unit,
            m.name as market_name,
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
        alerts: result.rows
    });
});

// Create price alert
export const createPriceAlert = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { productId, productName, marketId, marketName, alertType, threshold } = req.body;
    
    // If productId not provided, try to find product by name
    let finalProductId = productId;
    if (!finalProductId && productName) {
        const productResult = await pool.query(
            'SELECT id FROM products WHERE LOWER(name) = LOWER($1)',
            [productName]
        );
        if (productResult.rows.length > 0) {
            finalProductId = productResult.rows[0].id;
        }
    }
    
    // If marketId not provided, try to find market by name
    let finalMarketId = marketId;
    if (!finalMarketId && marketName) {
        const marketResult = await pool.query(
            'SELECT id FROM markets WHERE LOWER(name) = LOWER($1)',
            [marketName]
        );
        if (marketResult.rows.length > 0) {
            finalMarketId = marketResult.rows[0].id;
        }
    }
    
    const result = await pool.query(
        `INSERT INTO user_price_alerts (user_id, product_id, market_id, alert_type, threshold, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING *`,
        [userId, finalProductId, finalMarketId, alertType, threshold]
    );
    
    res.json({
        success: true,
        alert: result.rows[0],
        message: 'Price alert created successfully'
    });
});

// Update price alert
export const updatePriceAlert = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const { is_active, threshold, alertType } = req.body;
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (is_active !== undefined) {
        updates.push(`is_active = $${paramIndex++}`);
        values.push(is_active);
    }
    if (threshold !== undefined) {
        updates.push(`threshold = $${paramIndex++}`);
        values.push(threshold);
    }
    if (alertType !== undefined) {
        updates.push(`alert_type = $${paramIndex++}`);
        values.push(alertType);
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
        return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    
    res.json({
        success: true,
        alert: result.rows[0],
        message: 'Alert updated successfully'
    });
});

// Delete price alert
export const deletePriceAlert = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
        'DELETE FROM user_price_alerts WHERE id = $1 AND user_id = $2 RETURNING id',
        [id, userId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    
    res.json({
        success: true,
        message: 'Alert deleted successfully'
    });
});

// Toggle price alert (enable/disable)
export const togglePriceAlert = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
        `UPDATE user_price_alerts 
         SET is_active = NOT is_active, updated_at = NOW()
         WHERE id = $1 AND user_id = $2
         RETURNING *`,
        [id, userId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    
    res.json({
        success: true,
        alert: result.rows[0],
        message: `Alert ${result.rows[0].is_active ? 'enabled' : 'disabled'}`
    });
});