import pool from '../config/database.js';
import UserPriceAlertModel from '../models/UserPriceAlertModel.js';

class PriceAlertRepository {
    constructor() {
        this.pool = pool;
    }

    /**
     * Get all active alerts for a user
     * @param {number} userId - User ID
     * @returns {Promise<Array>} - Array of alert models
     */
    async getByUser(userId) {
        const result = await this.pool.query(
            `SELECT pa.*, 
                    p.name as product_name, 
                    m.name as market_name
             FROM price_alerts pa
             LEFT JOIN products p ON pa.product_id = p.id
             LEFT JOIN markets m ON pa.market_id = m.id
             WHERE pa.user_id = $1 AND pa.is_active = true
             ORDER BY pa.created_at DESC`,
            [userId]
        );
        return UserPriceAlertModel.fromDatabaseArray(result.rows);
    }

    /**
     * Get all active alerts (for price change monitoring)
     * @returns {Promise<Array>} - Array of alert models with current prices
     */
    async getAllActiveAlerts() {
        const result = await this.pool.query(`
            SELECT pa.*, 
                   p.name as product_name,
                   m.name as market_name,
                   pr.price as current_price,
                   pr.previous_price
            FROM price_alerts pa
            JOIN products p ON pa.product_id = p.id
            JOIN markets m ON pa.market_id = m.id
            LEFT JOIN LATERAL (
                SELECT price, previous_price 
                FROM prices 
                WHERE product_id = pa.product_id 
                  AND market_id = pa.market_id 
                  AND status = 'approved'
                ORDER BY created_at DESC 
                LIMIT 1
            ) pr ON true
            WHERE pa.is_active = true
        `);
        return UserPriceAlertModel.fromDatabaseArray(result.rows);
    }

    /**
     * Create a new price alert
     * @param {Object} alertData - Alert data
     * @returns {Promise<UserPriceAlertModel>} - Created alert
     */
    async create(alertData) {
        const { user_id, product_id, market_id, target_price, alert_type, percentage_threshold, notification_method } = alertData;
        
        const result = await this.pool.query(
            `INSERT INTO price_alerts 
             (user_id, product_id, market_id, target_price, alert_condition, percentage_threshold, notification_method)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [user_id, product_id, market_id, target_price, alert_type || 'below', percentage_threshold || null, notification_method || 'email']
        );
        
        return new UserPriceAlertModel(result.rows[0]);
    }

    /**
     * Update an existing alert
     * @param {number} alertId - Alert ID
     * @param {number} userId - User ID (for ownership check)
     * @param {Object} updates - Updates to apply
     * @returns {Promise<UserPriceAlertModel|null>} - Updated alert or null
     */
    async update(alertId, userId, updates) {
        const allowedFields = ['target_price', 'alert_condition', 'percentage_threshold', 'notification_method', 'is_active'];
        const setClause = [];
        const values = [alertId, userId];
        let paramCount = 2;
        
        for (const [key, value] of Object.entries(updates)) {
            if (allowedFields.includes(key)) {
                paramCount++;
                setClause.push(`${key} = $${paramCount}`);
                values.push(value);
            }
        }
        
        if (setClause.length === 0) {
            return null;
        }
        
        setClause.push('updated_at = CURRENT_TIMESTAMP');
        
        const result = await this.pool.query(
            `UPDATE price_alerts 
             SET ${setClause.join(', ')}
             WHERE id = $1 AND user_id = $2
             RETURNING *`,
            values
        );
        
        return result.rows[0] ? new UserPriceAlertModel(result.rows[0]) : null;
    }

    /**
     * Delete (deactivate) a price alert
     * @param {number} alertId - Alert ID
     * @param {number} userId - User ID (for ownership check)
     * @returns {Promise<Object>} - Success status
     */
    async delete(alertId, userId) {
        const result = await this.pool.query(
            `UPDATE price_alerts 
             SET is_active = false, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [alertId, userId]
        );
        
        return { success: result.rows.length > 0 };
    }

    /**
     * Hard delete a price alert (admin only)
     * @param {number} alertId - Alert ID
     * @returns {Promise<Object>} - Success status
     */
    async hardDelete(alertId) {
        const result = await this.pool.query(
            `DELETE FROM price_alerts WHERE id = $1 RETURNING id`,
            [alertId]
        );
        
        return { success: result.rows.length > 0 };
    }

    /**
     * Mark alert as triggered
     * @param {number} alertId - Alert ID
     * @returns {Promise<void>}
     */
    async markAsTriggered(alertId) {
        await this.pool.query(
            `UPDATE price_alerts 
             SET last_triggered_at = CURRENT_TIMESTAMP, 
                 trigger_count = trigger_count + 1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [alertId]
        );
    }

    /**
     * Get alert by ID
     * @param {number} alertId - Alert ID
     * @returns {Promise<UserPriceAlertModel|null>} - Alert model or null
     */
    async findById(alertId) {
        const result = await this.pool.query(
            `SELECT * FROM price_alerts WHERE id = $1`,
            [alertId]
        );
        return result.rows[0] ? new UserPriceAlertModel(result.rows[0]) : null;
    }

    /**
     * Get alerts for a specific product
     * @param {number} productId - Product ID
     * @param {number} marketId - Market ID
     * @returns {Promise<Array>} - Array of alert models
     */
    async getByProductAndMarket(productId, marketId) {
        const result = await this.pool.query(
            `SELECT * FROM price_alerts 
             WHERE product_id = $1 AND market_id = $2 AND is_active = true`,
            [productId, marketId]
        );
        return UserPriceAlertModel.fromDatabaseArray(result.rows);
    }

    /**
     * Get alert statistics
     * @returns {Promise<Object>} - Statistics
     */
    async getStats() {
        const result = await this.pool.query(`
            SELECT 
                COUNT(*) as total_alerts,
                SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_alerts,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT product_id) as unique_products
            FROM price_alerts
        `);
        
        return {
            total_alerts: parseInt(result.rows[0].total_alerts || 0),
            active_alerts: parseInt(result.rows[0].active_alerts || 0),
            unique_users: parseInt(result.rows[0].unique_users || 0),
            unique_products: parseInt(result.rows[0].unique_products || 0)
        };
    }

    /**
     * Clean up old inactive alerts
     * @param {number} daysToKeep - Days to keep inactive alerts
     * @returns {Promise<number>} - Number of alerts deleted
     */
    async cleanupOldAlerts(daysToKeep = 90) {
        const result = await this.pool.query(
            `DELETE FROM price_alerts 
             WHERE is_active = false 
               AND updated_at < NOW() - INTERVAL '${daysToKeep} days'
             RETURNING id`
        );
        
        return result.rows.length;
    }
}

export default new PriceAlertRepository();