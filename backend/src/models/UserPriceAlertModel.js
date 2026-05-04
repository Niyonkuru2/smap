/**
 * User Price Alert Model
 * Represents a price alert set by a user for a specific product at a market
 */
class UserPriceAlertModel {
    constructor(data = {}) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.product_id = data.product_id;
        this.market_id = data.market_id;
        this.target_price = data.target_price;
        this.alert_condition = data.alert_condition || 'below';
        this.percentage_threshold = data.percentage_threshold;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.notification_method = data.notification_method || 'email';
        this.last_triggered_at = data.last_triggered_at;
        this.trigger_count = data.trigger_count || 0;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
        
        // Joined fields
        this.product_name = data.product_name;
        this.market_name = data.market_name;
        this.current_price = data.current_price;
        this.previous_price = data.previous_price;
    }

    /**
     * Check if alert should trigger based on current price
     * @param {number} currentPrice - Current market price
     * @param {number} previousPrice - Previous price (for percentage change)
     * @returns {boolean} - Whether alert should trigger
     */
    shouldTrigger(currentPrice, previousPrice = null) {
        switch(this.alert_condition) {
            case 'below':
                return currentPrice <= this.target_price;
            case 'above':
                return currentPrice >= this.target_price;
            case 'equals':
                return currentPrice === this.target_price;
            case 'percentage_change':
                if (!previousPrice || previousPrice === 0) return false;
                const change = ((currentPrice - previousPrice) / previousPrice) * 100;
                return Math.abs(change) >= this.percentage_threshold;
            default:
                return false;
        }
    }

    /**
     * Calculate percentage difference from target
     * @param {number} currentPrice - Current market price
     * @returns {number} - Percentage difference
     */
    getPercentageFromTarget(currentPrice) {
        if (this.target_price === 0) return 0;
        return ((currentPrice - this.target_price) / this.target_price) * 100;
    }

    /**
     * Check if alert can be triggered again
     * (prevents spam - only trigger once per 24 hours)
     * @returns {boolean} - Whether alert can be triggered
     */
    canTriggerAgain() {
        if (!this.last_triggered_at) return true;
        
        const lastTriggered = new Date(this.last_triggered_at);
        const now = new Date();
        const hoursSinceLastTrigger = (now - lastTriggered) / (1000 * 60 * 60);
        
        return hoursSinceLastTrigger >= 24;
    }

    /**
     * Get alert status message
     * @param {number} currentPrice - Current market price
     * @returns {Object} - Status object
     */
    getStatus(currentPrice) {
        const willTrigger = this.shouldTrigger(currentPrice);
        const canTrigger = this.canTriggerAgain();
        
        return {
            is_active: this.is_active,
            will_trigger: willTrigger && canTrigger && this.is_active,
            condition: this.alert_condition,
            target_price: this.target_price,
            current_price: currentPrice,
            difference: currentPrice - this.target_price,
            percentage_diff: this.getPercentageFromTarget(currentPrice),
            needs_cooldown: !canTrigger && this.last_triggered_at
        };
    }

    /**
     * Convert to JSON for API response
     * @returns {Object} JSON representation
     */
    toJSON() {
        return {
            id: this.id,
            user_id: this.user_id,
            product_id: this.product_id,
            market_id: this.market_id,
            product_name: this.product_name,
            market_name: this.market_name,
            target_price: this.target_price,
            alert_condition: this.alert_condition,
            percentage_threshold: this.percentage_threshold,
            is_active: this.is_active,
            notification_method: this.notification_method,
            last_triggered_at: this.last_triggered_at,
            trigger_count: this.trigger_count,
            current_price: this.current_price,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }

    /**
     * Create from database row
     * @param {Object} row - Database row
     * @returns {UserPriceAlertModel} - Model instance
     */
    static fromDatabase(row) {
        return new UserPriceAlertModel(row);
    }

    /**
     * Create multiple from database rows
     * @param {Array} rows - Database rows
     * @returns {Array} - Array of model instances
     */
    static fromDatabaseArray(rows) {
        return rows.map(row => new UserPriceAlertModel(row));
    }

    /**
     * Create alert data for database insertion
     * @returns {Object} - Data for database
     */
    toDatabase() {
        return {
            user_id: this.user_id,
            product_id: this.product_id,
            market_id: this.market_id,
            target_price: this.target_price,
            alert_condition: this.alert_condition,
            percentage_threshold: this.percentage_threshold,
            is_active: this.is_active,
            notification_method: this.notification_method
        };
    }
}

export default UserPriceAlertModel;