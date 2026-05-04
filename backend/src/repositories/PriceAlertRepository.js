import DatabaseService from '../services/DatabaseService.js';
import UserPriceAlertModel from '../models/UserPriceAlertModel.js';

class PriceAlertRepository {
    constructor() {
        this.dbService = DatabaseService;
    }

    async getAllActiveAlerts() {
        const result = await this.dbService.query(
            `SELECT apa.*, p.price as current_price, p.previous_price
             FROM user_price_alerts apa
             JOIN products pr ON apa.product_id = pr.id
             LEFT JOIN (
                 SELECT DISTINCT ON (product_id, market_id) *
                 FROM prices 
                 WHERE status = 'approved'
                 ORDER BY product_id, market_id, created_at DESC
             ) p ON apa.product_id = p.product_id AND apa.market_id = p.market_id
             WHERE apa.is_active = true`
        );
        return result.rows.map(row => new UserPriceAlertModel(row));
    }

    async checkAndTriggerAlerts(productId, marketId, newPrice) {
        const alerts = await this.dbService.query(
            `SELECT apa.*, p.price as previous_price
             FROM user_price_alerts apa
             LEFT JOIN price_change_history pch ON pch.product_id = apa.product_id AND pch.market_id = apa.market_id
             LEFT JOIN prices p ON p.id = pch.price_id
             WHERE apa.product_id = $1 
               AND apa.market_id = $2 
               AND apa.is_active = true`,
            [productId, marketId]
        );
        
        const triggeredAlerts = [];
        for (const alert of alerts.rows) {
            const alertModel = new UserPriceAlertModel(alert);
            const shouldTrigger = alertModel.shouldTrigger(newPrice, alert.previous_price);
            
            if (shouldTrigger && (!alert.last_triggered_at || 
                (new Date() - new Date(alert.last_triggered_at)) > 24 * 60 * 60 * 1000)) {
                
                // Trigger notification
                await this.dbService.query(
                    `INSERT INTO notifications (user_id, notification_type, title, message, data, action_url)
                     VALUES ($1, 'price_alert', 'Price Alert Triggered', 
                             'Price for product has ${alert.alert_condition === 'below' ? 'dropped below' : 'risen above'} KES ${alert.target_price}',
                             $2, $3)`,
                    [alert.user_id, 
                     JSON.stringify({ product_id: productId, market_id: marketId, new_price: newPrice }),
                     `/products/${productId}?market=${marketId}`]
                );
                
                // Update alert
                await this.dbService.query(
                    `UPDATE user_price_alerts 
                     SET last_triggered_at = CURRENT_TIMESTAMP, trigger_count = trigger_count + 1
                     WHERE id = $1`,
                    [alert.id]
                );
                
                triggeredAlerts.push(alert);
            }
        }
        
        return triggeredAlerts;
    }
}

export default new PriceAlertRepository();