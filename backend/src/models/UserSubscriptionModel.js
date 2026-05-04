class UserSubscriptionModel {
    constructor(data = {}) {
        this.id = data.id;
        this.user_id = data.user_id;
        this.plan_id = data.plan_id;
        this.status = data.status || 'pending';
        this.payment_id = data.payment_id;
        this.payment_method = data.payment_method;
        this.amount_paid = data.amount_paid;
        this.start_date = data.start_date;
        this.end_date = data.end_date;
        this.auto_renew = data.auto_renew || false;
        this.activated_by = data.activated_by;
        this.activated_at = data.activated_at;
        this.cancelled_at = data.cancelled_at;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    isActive() {
        return this.status === 'active' && new Date() <= new Date(this.end_date);
    }

    daysRemaining() {
        if (!this.end_date) return 0;
        const diff = new Date(this.end_date) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
}

export default UserSubscriptionModel;