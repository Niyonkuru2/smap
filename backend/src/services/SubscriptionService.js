// src/services/SubscriptionService.js
import pool from '../config/database.js';
import UserRepository from '../repositories/UserRepository.js';
import { sendSubscriptionNotification } from './EmailService.js';

class SubscriptionService {
    constructor() {
        this.userRepo = UserRepository;
    }

    // =============================
    // PLAN MANAGEMENT (Admin)
    // =============================

    /**
     * Get all active subscription plans
     */
    async getAllPlans(includeInactive = false) {
        let query = `
            SELECT id, name, description, price, duration_days, 
                   max_products, max_price_submissions, priority_support,
                   featured_listing, analytics_access, is_active, created_at
            FROM subscription_plans
            WHERE 1=1
        `;
        
        if (!includeInactive) {
            query += ` AND is_active = true`;
        }
        
        query += ` ORDER BY price ASC`;
        
        const result = await pool.query(query);
        return result.rows;
    }

    /**
     * Get plan by ID
     */
    async getPlanById(planId) {
        const result = await pool.query(
            `SELECT id, name, description, price, duration_days, 
                    max_products, max_price_submissions, priority_support,
                    featured_listing, analytics_access, is_active
             FROM subscription_plans WHERE id = $1`,
            [planId]
        );
        return result.rows[0];
    }

    /**
     * Create new subscription plan (Admin only)
     */
    async createPlan(planData) {
        const { name, description, price, duration_days, max_products, 
                max_price_submissions, priority_support, featured_listing, 
                analytics_access } = planData;

        const result = await pool.query(
            `INSERT INTO subscription_plans 
             (name, description, price, duration_days, max_products, 
              max_price_submissions, priority_support, featured_listing, analytics_access)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [name, description, price, duration_days, max_products || null, 
             max_price_submissions || null, priority_support || false, 
             featured_listing || false, analytics_access || false]
        );
        
        return result.rows[0];
    }

    /**
     * Update subscription plan (Admin only)
     */
    async updatePlan(planId, planData) {
        const updates = [];
        const values = [];
        let index = 1;

        const allowedFields = ['name', 'description', 'price', 'duration_days', 
                               'max_products', 'max_price_submissions', 'priority_support',
                               'featured_listing', 'analytics_access', 'is_active'];

        for (const field of allowedFields) {
            if (planData[field] !== undefined) {
                updates.push(`${field} = $${index}`);
                values.push(planData[field]);
                index++;
            }
        }

        if (updates.length === 0) return null;

        values.push(planId);
        
        const result = await pool.query(
            `UPDATE subscription_plans 
             SET ${updates.join(', ')}, updated_at = NOW()
             WHERE id = $${index}
             RETURNING *`,
            values
        );
        
        return result.rows[0];
    }

    /**
     * Delete (deactivate) subscription plan (Admin only)
     */
    async deletePlan(planId) {
        // Soft delete - just deactivate
        const result = await pool.query(
            `UPDATE subscription_plans SET is_active = false WHERE id = $1 RETURNING *`,
            [planId]
        );
        
        return result.rows[0];
    }

    // =============================
    // USER SUBSCRIPTION MANAGEMENT
    // =============================

    /**
     * Subscribe user to a plan
     */
    async subscribeUser(userId, planId, paymentMethod = 'bank_transfer', paymentReference = null) {
        // Check if user already has active subscription
        const activeSubscription = await this.getActiveSubscription(userId);
        
        if (activeSubscription) {
            return {
                success: false,
                message: 'You already have an active subscription. Please cancel it first.',
                subscription: activeSubscription
            };
        }

        // Get plan details
        const plan = await this.getPlanById(planId);
        
        if (!plan) {
            return {
                success: false,
                message: 'Invalid subscription plan'
            };
        }

        if (!plan.is_active) {
            return {
                success: false,
                message: 'This plan is currently not available'
            };
        }

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + plan.duration_days);

        // Create subscription
        const result = await pool.query(
            `INSERT INTO user_subscriptions 
             (user_id, plan_id, status, payment_method, amount_paid, start_date, end_date, auto_renew)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [userId, planId, 'pending', paymentMethod, parseFloat(plan.price), startDate, endDate, false]
        );

        const subscription = result.rows[0];

        // Create payment record
        await pool.query(
            `INSERT INTO subscription_payments 
             (subscription_id, user_id, amount, payment_method, transaction_id, payment_status)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [subscription.id, userId, plan.price, paymentMethod, paymentReference, 'pending']
        );

        // Send notification to admin and user
        await this.sendSubscriptionNotifications(subscription.id, 'created');

        return {
            success: true,
            message: 'Subscription request created. Awaiting admin approval.',
            subscription
        };
    }

    /**
     * Get user's current active subscription
     */
    async getActiveSubscription(userId) {
        const result = await pool.query(
            `SELECT us.*, sp.name as plan_name, sp.description, sp.price, sp.duration_days,
                    sp.max_products, sp.max_price_submissions, sp.priority_support,
                    sp.featured_listing, sp.analytics_access
             FROM user_subscriptions us
             JOIN subscription_plans sp ON us.plan_id = sp.id
             WHERE us.user_id = $1 
               AND us.status IN ('active', 'pending')
               AND (us.end_date IS NULL OR us.end_date > NOW())
             ORDER BY us.created_at DESC
             LIMIT 1`,
            [userId]
        );
        
        return result.rows[0];
    }

    /**
     * Get user's subscription history
     */
    async getUserSubscriptions(userId, limit = 10) {
        const result = await pool.query(
            `SELECT us.*, sp.name as plan_name, sp.price as plan_price, sp.duration_days,
                    sp.priority_support, sp.featured_listing, sp.analytics_access
             FROM user_subscriptions us
             JOIN subscription_plans sp ON us.plan_id = sp.id
             WHERE us.user_id = $1
             ORDER BY us.created_at DESC
             LIMIT $2`,
            [userId, limit]
        );
        
        return result.rows;
    }

    /**
     * Get all pending subscriptions (Admin)
     */
    async getPendingSubscriptions() {
        const result = await pool.query(
            `SELECT us.*, sp.name as plan_name, sp.price, sp.duration_days,
                    u.name as user_name, u.email as user_email, u.phone as user_phone
             FROM user_subscriptions us
             JOIN subscription_plans sp ON us.plan_id = sp.id
             JOIN users u ON us.user_id = u.id
             WHERE us.status = 'pending'
             ORDER BY us.created_at ASC`
        );
        
        return result.rows;
    }

    /**
     * Approve subscription (Admin)
     */
    async approveSubscription(subscriptionId, adminId) {
        // Get subscription
        const subscriptionResult = await pool.query(
            `SELECT us.*, sp.duration_days, sp.name as plan_name, u.email, u.name as user_name
             FROM user_subscriptions us
             JOIN subscription_plans sp ON us.plan_id = sp.id
             JOIN users u ON us.user_id = u.id
             WHERE us.id = $1`,
            [subscriptionId]
        );
        
        const subscription = subscriptionResult.rows[0];
        
        if (!subscription) {
            return {
                success: false,
                message: 'Subscription not found'
            };
        }
        
        if (subscription.status !== 'pending') {
            return {
                success: false,
                message: `Subscription is already ${subscription.status}`
            };
        }

        // Calculate dates
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + subscription.duration_days);

        // Update subscription
        const result = await pool.query(
            `UPDATE user_subscriptions 
             SET status = 'active', 
                 activated_by = $1, 
                 activated_at = NOW(),
                 start_date = $2,
                 end_date = $3
             WHERE id = $4
             RETURNING *`,
            [adminId, startDate, endDate, subscriptionId]
        );

        // Update payment status
        await pool.query(
            `UPDATE subscription_payments 
             SET payment_status = 'completed', payment_date = NOW()
             WHERE subscription_id = $1`,
            [subscriptionId]
        );

        // Send approval notification to user
        await this.sendSubscriptionNotifications(subscriptionId, 'approved');
        
        return {
            success: true,
            message: 'Subscription approved successfully',
            subscription: result.rows[0]
        };
    }

    /**
     * Reject subscription (Admin)
     */
    async rejectSubscription(subscriptionId, adminId, reason) {
        const subscriptionResult = await pool.query(
            `SELECT us.*, u.email, u.name as user_name
             FROM user_subscriptions us
             JOIN users u ON us.user_id = u.id
             WHERE us.id = $1`,
            [subscriptionId]
        );
        
        const subscription = subscriptionResult.rows[0];
        
        if (!subscription) {
            return {
                success: false,
                message: 'Subscription not found'
            };
        }
        
        if (subscription.status !== 'pending') {
            return {
                success: false,
                message: `Subscription is already ${subscription.status}`
            };
        }

        // Update subscription
        const result = await pool.query(
            `UPDATE user_subscriptions 
             SET status = 'cancelled',
                 cancelled_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [subscriptionId]
        );

        // Update payment status
        await pool.query(
            `UPDATE subscription_payments 
             SET payment_status = 'failed'
             WHERE subscription_id = $1`,
            [subscriptionId]
        );

        // Send rejection notification to user
        await this.sendSubscriptionNotifications(subscriptionId, 'rejected', reason);
        
        return {
            success: true,
            message: 'Subscription rejected',
            subscription: result.rows[0]
        };
    }

    /**
     * Cancel subscription (User)
     */
    async cancelSubscription(userId, subscriptionId) {
        // Verify ownership
        const subscriptionResult = await pool.query(
            `SELECT * FROM user_subscriptions 
             WHERE id = $1 AND user_id = $2`,
            [subscriptionId, userId]
        );
        
        const subscription = subscriptionResult.rows[0];
        
        if (!subscription) {
            return {
                success: false,
                message: 'Subscription not found'
            };
        }
        
        if (subscription.status !== 'active') {
            return {
                success: false,
                message: `Cannot cancel subscription with status: ${subscription.status}`
            };
        }

        const result = await pool.query(
            `UPDATE user_subscriptions 
             SET status = 'cancelled', auto_renew = false, cancelled_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [subscriptionId]
        );

        // Send cancellation notification
        await this.sendSubscriptionNotifications(subscriptionId, 'cancelled');
        
        return {
            success: true,
            message: 'Subscription cancelled successfully. You will have access until the end date.',
            subscription: result.rows[0]
        };
    }

    /**
     * Check for expiring subscriptions (Run via cron job daily)
     */
    async checkExpiringSubscriptions() {
        const daysThreshold = process.env.SUBSCRIPTION_WARNING_DAYS || 3;
        
        const result = await pool.query(
            `SELECT us.*, sp.name as plan_name, u.email, u.name as user_name
             FROM user_subscriptions us
             JOIN subscription_plans sp ON us.plan_id = sp.id
             JOIN users u ON us.user_id = u.id
             WHERE us.status = 'active'
               AND us.end_date > NOW()
               AND us.end_date <= NOW() + INTERVAL '${daysThreshold} days'
               AND us.id NOT IN (
                   SELECT subscription_id FROM subscription_expiry_notifications 
                   WHERE notified_at > NOW() - INTERVAL '1 day'
               )`,
            []
        );
        
        for (const subscription of result.rows) {
            await this.sendExpiryNotification(subscription);
        }
        
        return {
            success: true,
            expiringCount: result.rows.length,
            subscriptions: result.rows
        };
    }

    /**
     * Auto-expire expired subscriptions (Run via cron job daily)
     */
    async expireSubscriptions() {
        const result = await pool.query(
            `UPDATE user_subscriptions 
             SET status = 'expired'
             WHERE status = 'active' 
               AND end_date <= NOW()
             RETURNING *`,
            []
        );
        
        for (const subscription of result.rows) {
            await this.sendExpiryNotification(subscription, true);
        }
        
        return {
            success: true,
            expiredCount: result.rows.length,
            subscriptions: result.rows
        };
    }

    // =============================
    // NOTIFICATION METHODS
    // =============================

    /**
     * Send subscription notifications
     */
    async sendSubscriptionNotifications(subscriptionId, action, reason = null) {
        const subscriptionResult = await pool.query(
            `SELECT us.*, sp.name as plan_name, sp.price, u.email, u.name as user_name
             FROM user_subscriptions us
             JOIN subscription_plans sp ON us.plan_id = sp.id
             JOIN users u ON us.user_id = u.id
             WHERE us.id = $1`,
            [subscriptionId]
        );
        
        const subscription = subscriptionResult.rows[0];
        
        if (!subscription) return;
        
        // In-app notification (store in notifications table)
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, read, created_at)
             VALUES ($1, $2, $3, $4, false, NOW())`,
            [
                subscription.user_id,
                this.getNotificationTitle(action),
                this.getNotificationMessage(subscription, action, reason),
                action === 'approved' ? 'success' : action === 'rejected' ? 'error' : 'info'
            ]
        );
        
        // Email notification
        try {
            await sendSubscriptionNotification(
                subscription.user_email,
                subscription.user_name,
                subscription.plan_name,
                action,
                subscription.end_date,
                reason
            );
        } catch (error) {
            console.error('Failed to send subscription email:', error);
        }
    }

    /**
     * Send expiry notification
     */
    async sendExpiryNotification(subscription, isExpired = false) {
        const daysLeft = Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24));
        
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, read, created_at)
             VALUES ($1, $2, $3, $4, false, NOW())`,
            [
                subscription.user_id,
                isExpired ? 'Subscription Expired' : 'Subscription Expiring Soon',
                isExpired 
                    ? `Your ${subscription.plan_name} subscription has expired. Please renew to continue enjoying benefits.`
                    : `Your ${subscription.plan_name} subscription will expire in ${daysLeft} days. Renew now to avoid interruption.`,
                'warning'
            ]
        );
        
        // Record notification to avoid duplicate
        await pool.query(
            `INSERT INTO subscription_expiry_notifications (subscription_id, notified_at)
             VALUES ($1, NOW())
             ON CONFLICT (subscription_id) DO UPDATE SET notified_at = NOW()`,
            [subscription.id]
        );
    }

    getNotificationTitle(action) {
        const titles = {
            'created': 'Subscription Request Received',
            'approved': 'Subscription Approved!',
            'rejected': 'Subscription Request Update',
            'cancelled': 'Subscription Cancelled',
            'expired': 'Subscription Expired'
        };
        return titles[action] || 'Subscription Update';
    }

    getNotificationMessage(subscription, action, reason = null) {
        const messages = {
            'created': `Your request for ${subscription.plan_name} plan has been submitted. We'll notify you once approved.`,
            'approved': `Great news! Your ${subscription.plan_name} subscription is now active. You'll have access until ${new Date(subscription.end_date).toLocaleDateString()}.`,
            'rejected': `Your ${subscription.plan_name} subscription request was not approved. ${reason ? `Reason: ${reason}` : 'Please contact support for more information.'}`,
            'cancelled': `Your ${subscription.plan_name} subscription has been cancelled. You'll have access until ${new Date(subscription.end_date).toLocaleDateString()}.`
        };
        return messages[action] || `Update on your ${subscription.plan_name} subscription.`;
    }

    /**
     * Get subscription usage statistics
     */
    async getSubscriptionStats() {
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_subscriptions,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
                COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count,
                COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
                SUM(CASE WHEN status = 'active' THEN amount_paid ELSE 0 END) as total_revenue
            FROM user_subscriptions
        `);
        
        return result.rows[0];
    }
}

export default new SubscriptionService();