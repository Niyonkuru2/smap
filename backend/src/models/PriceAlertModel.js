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
    }

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
}

export default UserPriceAlertModel;