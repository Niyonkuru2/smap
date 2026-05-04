import DatabaseService from '../services/DatabaseService.js';
import UserSubscriptionModel from '../models/UserSubscriptionModel.js';
import SubscriptionPlanModel from '../models/SubscriptionPlanModel.js';

class SubscriptionRepository {
    constructor() {
        this.dbService = DatabaseService;
    }

    async getPlans() {
        const result = await this.dbService.query(
            'SELECT * FROM subscription_plans WHERE is_active = true ORDER BY price'
        );
        return result.rows.map(row => new SubscriptionPlanModel(row));
    }

    async createSubscription(subscriptionData) {
        const { user_id, plan_id, payment_id, payment_method, amount_paid, duration_days } = subscriptionData;
        const start_date = new Date();
        const end_date = new Date();
        end_date.setDate(end_date.getDate() + duration_days);

        const result = await this.dbService.query(
            `INSERT INTO user_subscriptions (user_id, plan_id, payment_id, payment_method, amount_paid, start_date, end_date, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
             RETURNING *`,
            [user_id, plan_id, payment_id, payment_method, amount_paid, start_date, end_date]
        );
        return new UserSubscriptionModel(result.rows[0]);
    }

    async activateSubscription(subscriptionId, adminId) {
        const result = await this.dbService.query(
            `UPDATE user_subscriptions 
             SET status = 'active', activated_by = $1, activated_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 
             RETURNING *`,
            [adminId, subscriptionId]
        );
        
        // Update vendor metrics
        if (result.rows[0]) {
            await this.dbService.query(
                `INSERT INTO vendor_metrics (vendor_id, subscription_tier, month_year)
                 VALUES ($1, (SELECT name FROM subscription_plans WHERE id = $2), DATE_TRUNC('month', CURRENT_DATE))
                 ON CONFLICT (vendor_id, month_year) 
                 DO UPDATE SET subscription_tier = EXCLUDED.subscription_tier`,
                [result.rows[0].user_id, result.rows[0].plan_id]
            );
        }
        
        return result.rows[0] ? new UserSubscriptionModel(result.rows[0]) : null;
    }

    async getUserActiveSubscription(userId) {
        const result = await this.dbService.query(
            `SELECT us.*, sp.name as plan_name, sp.price
             FROM user_subscriptions us
             JOIN subscription_plans sp ON us.plan_id = sp.id
             WHERE us.user_id = $1 AND us.status = 'active' AND us.end_date > NOW()
             ORDER BY us.end_date DESC
             LIMIT 1`,
            [userId]
        );
        return result.rows[0] ? new UserSubscriptionModel(result.rows[0]) : null;
    }

    async checkVendorCanSubmitPrice(vendorId) {
        const subscription = await this.getUserActiveSubscription(vendorId);
        if (!subscription) return { allowed: false, reason: 'No active subscription' };
        
        // Check if vendor has exceeded submission limits
        const currentMonth = new Date();
        const result = await this.dbService.query(
            `SELECT COUNT(*) as submissions
             FROM prices
             WHERE vendor_id = $1 
             AND created_at >= DATE_TRUNC('month', CURRENT_DATE)`,
            [vendorId]
        );
        
        const plan = await this.dbService.query(
            'SELECT max_price_submissions FROM subscription_plans WHERE id = $1',
            [subscription.plan_id]
        );
        
        const maxSubmissions = plan.rows[0]?.max_price_submissions;
        if (maxSubmissions && result.rows[0].submissions >= maxSubmissions) {
            return { allowed: false, reason: 'Monthly submission limit reached' };
        }
        
        return { allowed: true, subscription };
    }
}

export default new SubscriptionRepository();