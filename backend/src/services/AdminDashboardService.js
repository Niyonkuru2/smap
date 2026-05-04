import DatabaseService from '../services/DatabaseService.js';

class AdminDashboardService {
    constructor() {
        this.dbService = DatabaseService;
    }

    async getDashboardStats() {
        const stats = await this.dbService.query(`
            SELECT 
                -- Pending approvals
                (SELECT COUNT(*) FROM pending_approvals WHERE status = 'pending') as pending_approvals,
                (SELECT COUNT(*) FROM pending_approvals WHERE entity_type = 'price' AND status = 'pending') as pending_prices,
                (SELECT COUNT(*) FROM pending_approvals WHERE entity_type = 'advertisement' AND status = 'pending') as pending_ads,
                
                -- Subscription stats
                (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'active') as active_subscriptions,
                (SELECT COUNT(*) FROM user_subscriptions WHERE status = 'expired' AND end_date < NOW()) as expired_subscriptions,
                (SELECT SUM(amount_paid) FROM subscription_payments WHERE payment_status = 'completed' AND payment_date >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_revenue,
                
                -- Price stats
                (SELECT COUNT(*) FROM prices WHERE status = 'approved' AND created_at >= DATE_TRUNC('day', CURRENT_DATE)) as today_price_submissions,
                (SELECT COUNT(*) FROM prices WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE)) as weekly_price_submissions,
                
                -- User stats
                (SELECT COUNT(*) FROM users WHERE role = 'vendor' AND verified = true) as total_vendors,
                (SELECT COUNT(*) FROM users WHERE role = 'consumer' AND created_at >= DATE_TRUNC('month', CURRENT_DATE)) as new_consumers_this_month,
                (SELECT COUNT(*) FROM users WHERE last_login >= NOW() - INTERVAL '7 days') as active_users_last_week,
                
                -- Ad stats
                (SELECT SUM(clicks_count) FROM vendor_advertisements WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_ad_clicks,
                (SELECT SUM(views_count) FROM vendor_advertisements WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as monthly_ad_views
        `);
        
        // Get recent activities
        const recentActivities = await this.dbService.query(`
            (SELECT 'price_submission' as type, 
                    p.id as entity_id,
                    u.name as vendor_name,
                    p.created_at as timestamp,
                    'Price submission from ' || u.name as description
             FROM prices p
             JOIN users u ON p.vendor_id = u.id
             WHERE p.status = 'pending'
             ORDER BY p.created_at DESC
             LIMIT 5)
            UNION ALL
            (SELECT 'ad_submission' as type,
                    a.id as entity_id,
                    u.name as vendor_name,
                    a.created_at as timestamp,
                    'Ad submission: ' || a.title as description
             FROM vendor_advertisements a
             JOIN users u ON a.vendor_id = u.id
             WHERE a.status = 'pending'
             ORDER BY a.created_at DESC
             LIMIT 5)
            UNION ALL
            (SELECT 'subscription_activation' as type,
                    us.id as entity_id,
                    u.name as vendor_name,
                    us.activated_at as timestamp,
                    'Subscription activated for ' || u.name as description
             FROM user_subscriptions us
             JOIN users u ON us.user_id = u.id
             WHERE us.activated_at IS NOT NULL
             ORDER BY us.activated_at DESC
             LIMIT 5)
            ORDER BY timestamp DESC
            LIMIT 10
        `);
        
        return {
            stats: stats.rows[0],
            recent_activities: recentActivities.rows,
            timestamp: new Date()
        };
    }

    async getPendingApprovals() {
        const pending = await this.dbService.query(`
            SELECT 
                pa.id,
                pa.entity_type,
                pa.entity_id,
                pa.vendor_id,
                u.name as vendor_name,
                u.email as vendor_email,
                pa.submitted_at,
                pa.priority,
                CASE 
                    WHEN pa.entity_type = 'price' THEN 
                        (SELECT jsonb_build_object('price', p.price, 'product', pr.name, 'market', m.name)
                         FROM prices p
                         JOIN products pr ON p.product_id = pr.id
                         JOIN markets m ON p.market_id = m.id
                         WHERE p.id = pa.entity_id)
                    WHEN pa.entity_type = 'advertisement' THEN
                        (SELECT jsonb_build_object('title', a.title, 'budget', a.budget, 'type', a.advertisement_type)
                         FROM vendor_advertisements a
                         WHERE a.id = pa.entity_id)
                    ELSE NULL
                END as details
            FROM pending_approvals pa
            JOIN users u ON pa.vendor_id = u.id
            WHERE pa.status = 'pending'
            ORDER BY 
                CASE pa.priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'normal' THEN 3
                    ELSE 4
                END,
                pa.submitted_at ASC
        `);
        
        return pending.rows;
    }
}

export default new AdminDashboardService();