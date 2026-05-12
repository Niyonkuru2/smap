import pool from '../config/database.js';
import SubscriptionService from './SubscriptionService.js';

class AdvertisementService {
    constructor() {
        this.subscriptionService = SubscriptionService;
    }

    /**
     * Submit a new advertisement (Vendor)
     */
    async submitAdvertisement(vendorId, adData) {
        // Check if vendor has active subscription
        const activeSubscription = await this.subscriptionService.getActiveSubscription(vendorId);
        
        if (!activeSubscription || activeSubscription.status !== 'active') {
            return {
                success: false,
                message: 'You need an active subscription to submit advertisements. Please subscribe to a plan first.',
                requiresSubscription: true
            };
        }

        // Check if vendor has reached their ad limit based on plan
        const adCount = await this.getVendorAdCount(vendorId);
        const maxAds = this.getMaxAdsPerPlan(activeSubscription.plan_name);
        
        if (adCount >= maxAds) {
            return {
                success: false,
                message: `You have reached the maximum number of active ads (${maxAds}) for your ${activeSubscription.plan_name} plan. Please upgrade or remove existing ads.`
            };
        }

        const { title, description, image_url, target_url, advertisement_type, placement, budget, start_date, end_date } = adData;

        // Validate required fields
        if (!title || !title.trim()) {
            return { success: false, message: 'Title is required' };
        }

        if (!budget || budget <= 0) {
            return { success: false, message: 'Valid budget is required' };
        }

        const result = await pool.query(
            `INSERT INTO vendor_advertisements 
             (vendor_id, title, description, image_url, target_url, advertisement_type, 
              placement, budget, start_date, end_date, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW(), NOW())
             RETURNING *`,
            [
                vendorId,
                title.trim(),
                description || null,
                image_url || null,
                target_url || null,
                advertisement_type || 'banner',
                placement || null,
                budget,
                start_date || null,
                end_date || null
            ]
        );

        // Create notification for admin
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, notification_type, priority, data, created_at)
             VALUES (NULL, 'New Advertisement Submitted', $1, 'info', 'ad_approval', 'normal', $2, NOW())`,
            [
                `Vendor has submitted a new advertisement: ${title}`,
                JSON.stringify({ ad_id: result.rows[0].id, vendor_id: vendorId })
            ]
        );

        return {
            success: true,
            message: 'Advertisement submitted successfully. Awaiting admin approval.',
            advertisement: result.rows[0]
        };
    }

    /**
     * Get vendor's advertisements
     */
    async getVendorAdvertisements(vendorId, status = null) {
        let query = `
            SELECT va.*, 
                   COUNT(ast.id) as views_count,
                   COUNT(CASE WHEN ast.event_type = 'click' THEN 1 END) as clicks_count
            FROM vendor_advertisements va
            LEFT JOIN ad_statistics ast ON va.id = ast.ad_id
            WHERE va.vendor_id = $1
        `;
        const params = [vendorId];
        let paramIndex = 2;

        if (status) {
            query += ` AND va.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        query += ` GROUP BY va.id ORDER BY va.created_at DESC`;
        
        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Get advertisement by ID (with ownership check)
     */
    async getAdvertisementById(adId, vendorId = null) {
        let query = `
            SELECT va.*, 
                   COUNT(ast.id) as views_count,
                   COUNT(CASE WHEN ast.event_type = 'click' THEN 1 END) as clicks_count
            FROM vendor_advertisements va
            LEFT JOIN ad_statistics ast ON va.id = ast.ad_id
            WHERE va.id = $1
        `;
        const params = [adId];

        if (vendorId) {
            query += ` AND va.vendor_id = $2`;
            params.push(vendorId);
        }

        query += ` GROUP BY va.id`;
        
        const result = await pool.query(query, params);
        return result.rows[0];
    }

    /**
     * Update advertisement (Vendor - only pending ads)
     */
    async updateAdvertisement(adId, vendorId, adData) {
        // Check ownership and status
        const existing = await this.getAdvertisementById(adId, vendorId);
        
        if (!existing) {
            return { success: false, message: 'Advertisement not found' };
        }
        
        if (existing.status !== 'pending') {
            return { success: false, message: 'Cannot update advertisement that is already approved or rejected' };
        }

        const { title, description, image_url, target_url, budget, start_date, end_date } = adData;
        
        const result = await pool.query(
            `UPDATE vendor_advertisements 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 image_url = COALESCE($3, image_url),
                 target_url = COALESCE($4, target_url),
                 budget = COALESCE($5, budget),
                 start_date = COALESCE($6, start_date),
                 end_date = COALESCE($7, end_date),
                 updated_at = NOW()
             WHERE id = $8 AND vendor_id = $9
             RETURNING *`,
            [title, description, image_url, target_url, budget, start_date, end_date, adId, vendorId]
        );
        
        return {
            success: true,
            message: 'Advertisement updated successfully',
            advertisement: result.rows[0]
        };
    }

    /**
     * Delete advertisement (Vendor - only pending ads)
     */
    async deleteAdvertisement(adId, vendorId) {
        const existing = await this.getAdvertisementById(adId, vendorId);
        
        if (!existing) {
            return { success: false, message: 'Advertisement not found' };
        }
        
        if (existing.status !== 'pending') {
            return { success: false, message: 'Cannot delete advertisement that is already approved or rejected' };
        }

        await pool.query(
            `DELETE FROM vendor_advertisements WHERE id = $1 AND vendor_id = $2`,
            [adId, vendorId]
        );
        
        return { success: true, message: 'Advertisement deleted successfully' };
    }

    /**
     * Get all pending advertisements (Admin)
     */
    async getPendingAdvertisements() {
        const result = await pool.query(
            `SELECT va.*, u.name as vendor_name, u.email as vendor_email
             FROM vendor_advertisements va
             JOIN users u ON va.vendor_id = u.id
             WHERE va.status = 'pending'
             ORDER BY va.created_at ASC`
        );
        return result.rows;
    }

    /**
     * Get all advertisements (Admin with filters)
     */
    async getAllAdvertisements(filters = {}) {
        let query = `
            SELECT va.*, u.name as vendor_name, u.email as vendor_email,
                   COUNT(ast.id) as views_count,
                   COUNT(CASE WHEN ast.event_type = 'click' THEN 1 END) as clicks_count
            FROM vendor_advertisements va
            JOIN users u ON va.vendor_id = u.id
            LEFT JOIN ad_statistics ast ON va.id = ast.ad_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (filters.status) {
            query += ` AND va.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        if (filters.vendor_id) {
            query += ` AND va.vendor_id = $${paramIndex}`;
            params.push(filters.vendor_id);
            paramIndex++;
        }

        query += ` GROUP BY va.id, u.name, u.email ORDER BY va.created_at DESC`;
        
        const result = await pool.query(query, params);
        return result.rows;
    }

    /**
     * Approve advertisement (Admin)
     */
    async approveAdvertisement(adId, adminId) {
        const existing = await pool.query(
            `SELECT * FROM vendor_advertisements WHERE id = $1`,
            [adId]
        );
        
        if (existing.rows.length === 0) {
            return { success: false, message: 'Advertisement not found' };
        }
        
        if (existing.rows[0].status !== 'pending') {
            return { success: false, message: `Advertisement is already ${existing.rows[0].status}` };
        }

        const result = await pool.query(
            `UPDATE vendor_advertisements 
             SET status = 'active', 
                 approved_by = $1, 
                 approved_at = NOW(),
                 updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [adminId, adId]
        );

        // Notify vendor
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, notification_type, created_at)
             VALUES ($1, 'Advertisement Approved', $2, 'success', 'ad_approval', NOW())`,
            [existing.rows[0].vendor_id, `Your advertisement "${existing.rows[0].title}" has been approved and is now live.`]
        );

        return {
            success: true,
            message: 'Advertisement approved successfully',
            advertisement: result.rows[0]
        };
    }

    /**
     * Reject advertisement (Admin)
     */
    async rejectAdvertisement(adId, adminId, reason) {
        const existing = await pool.query(
            `SELECT * FROM vendor_advertisements WHERE id = $1`,
            [adId]
        );
        
        if (existing.rows.length === 0) {
            return { success: false, message: 'Advertisement not found' };
        }
        
        if (existing.rows[0].status !== 'pending') {
            return { success: false, message: `Advertisement is already ${existing.rows[0].status}` };
        }

        const result = await pool.query(
            `UPDATE vendor_advertisements 
             SET status = 'rejected', 
                 rejection_reason = $1,
                 updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
            [reason, adId]
        );

        // Notify vendor
        await pool.query(
            `INSERT INTO notifications (user_id, title, message, type, notification_type, data, created_at)
             VALUES ($1, 'Advertisement Rejected', $2, 'error', 'ad_rejection', $3, NOW())`,
            [existing.rows[0].vendor_id, `Your advertisement "${existing.rows[0].title}" was rejected. Reason: ${reason}`, JSON.stringify({ reason })]
        );

        return {
            success: true,
            message: 'Advertisement rejected',
            advertisement: result.rows[0]
        };
    }

    /**
     * Track ad view/click
     */
    async trackAdEvent(adId, eventType, userId = null, ipAddress = null, userAgent = null) {
        await pool.query(
            `INSERT INTO ad_statistics (ad_id, event_type, user_id, ip_address, user_agent, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW())`,
            [adId, eventType, userId, ipAddress, userAgent]
        );

        // Update click/views count on advertisement
        if (eventType === 'click') {
            await pool.query(
                `UPDATE vendor_advertisements SET clicks_count = clicks_count + 1 WHERE id = $1`,
                [adId]
            );
        } else if (eventType === 'view') {
            await pool.query(
                `UPDATE vendor_advertisements SET views_count = views_count + 1 WHERE id = $1`,
                [adId]
            );
        }

        return { success: true };
    }

    /**
     * Get vendor ad statistics
     */
    async getVendorAdStats(vendorId) {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total_ads,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_ads,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_ads,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_ads,
                COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_ads,
                COALESCE(SUM(views_count), 0) as total_views,
                COALESCE(SUM(clicks_count), 0) as total_clicks
             FROM vendor_advertisements
             WHERE vendor_id = $1`,
            [vendorId]
        );
        
        return result.rows[0];
    }

    /**
     * Get admin ad analytics
     */
    async getAdminAdAnalytics() {
        const result = await pool.query(
            `SELECT 
                COUNT(*) as total_ads,
                COUNT(CASE WHEN status = 'active' THEN 1 END) as active_ads,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_ads,
                COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_ads,
                COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_ads,
                COALESCE(SUM(views_count), 0) as total_views,
                COALESCE(SUM(clicks_count), 0) as total_clicks,
                COALESCE(SUM(budget), 0) as total_budget,
                COALESCE(AVG(views_count), 0) as avg_views_per_ad,
                COALESCE(AVG(clicks_count), 0) as avg_clicks_per_ad
             FROM vendor_advertisements`
        );
        
        // Get top performing ads
        const topAds = await pool.query(
            `SELECT va.id, va.title, va.vendor_id, u.name as vendor_name,
                    va.views_count, va.clicks_count,
                    CASE WHEN va.views_count > 0 
                         THEN ROUND((va.clicks_count::DECIMAL / va.views_count) * 100, 2)
                         ELSE 0 END as ctr
             FROM vendor_advertisements va
             JOIN users u ON va.vendor_id = u.id
             WHERE va.status = 'active'
             ORDER BY va.clicks_count DESC
             LIMIT 10`
        );
        
        return {
            summary: result.rows[0],
            top_ads: topAds.rows
        };
    }

    /**
     * Get vendor ad performance metrics
     */
    async getVendorAdPerformance(vendorId) {
        const result = await pool.query(
            `SELECT 
                va.id,
                va.title,
                va.status,
                va.budget,
                va.created_at,
                va.approved_at,
                va.views_count,
                va.clicks_count,
                CASE WHEN va.views_count > 0 
                     THEN ROUND((va.clicks_count::DECIMAL / va.views_count) * 100, 2)
                     ELSE 0 END as ctr,
                CASE WHEN va.budget > 0 AND va.clicks_count > 0
                     THEN ROUND(va.budget / va.clicks_count, 2)
                     ELSE 0 END as cost_per_click
             FROM vendor_advertisements va
             WHERE va.vendor_id = $1
             ORDER BY va.created_at DESC`,
            [vendorId]
        );
        
        return result.rows;
    }

    /**
     * Get vendor's ad count
     */
    async getVendorAdCount(vendorId) {
        const result = await pool.query(
            `SELECT COUNT(*) as count 
             FROM vendor_advertisements 
             WHERE vendor_id = $1 AND status IN ('active', 'pending')`,
            [vendorId]
        );
        return parseInt(result.rows[0].count);
    }

    /**
     * Get max ads per plan
     */
    getMaxAdsPerPlan(planName) {
        const planLimits = {
            'Basic': 1,
            'Premium': 3,
            'Enterprise': 10
        };
        return planLimits[planName] || 1;
    }

    /**
     * Auto-expire advertisements
     */
    async expireAdvertisements() {
        const result = await pool.query(
            `UPDATE vendor_advertisements 
             SET status = 'expired', updated_at = NOW()
             WHERE status = 'active' 
               AND end_date IS NOT NULL 
               AND end_date <= NOW()
             RETURNING *`
        );
        
        for (const ad of result.rows) {
            await pool.query(
                `INSERT INTO notifications (user_id, title, message, type, created_at)
                 VALUES ($1, 'Advertisement Expired', $2, 'warning', NOW())`,
                [ad.vendor_id, `Your advertisement "${ad.title}" has expired.`]
            );
        }
        
        return {
            success: true,
            expiredCount: result.rows.length,
            advertisements: result.rows
        };
    }
}

export default new AdvertisementService();