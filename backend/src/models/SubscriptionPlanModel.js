class SubscriptionPlanModel {
    constructor(data = {}) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.price = data.price;
        this.duration_days = data.duration_days;
        this.max_products = data.max_products;
        this.max_price_submissions = data.max_price_submissions;
        this.priority_support = data.priority_support || false;
        this.featured_listing = data.featured_listing || false;
        this.analytics_access = data.analytics_access || false;
        this.is_active = data.is_active !== undefined ? data.is_active : true;
        this.created_at = data.created_at;
    }
}

export default SubscriptionPlanModel;