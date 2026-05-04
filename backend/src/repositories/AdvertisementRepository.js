import DatabaseService from '../services/DatabaseService.js';
import VendorAdvertisementModel from '../models/VendorAdvertisementModel.js';

class AdvertisementRepository {
    constructor() {
        this.dbService = DatabaseService;
    }

    async createAdvertisement(adData) {
        const { vendor_id, title, description, image_url, target_url, 
                advertisement_type, placement, start_date, end_date, budget } = adData;
        
        const result = await this.dbService.query(
            `INSERT INTO vendor_advertisements 
             (vendor_id, title, description, image_url, target_url, advertisement_type, placement, start_date, end_date, budget, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
             RETURNING *`,
            [vendor_id, title, description, image_url, target_url, advertisement_type, placement, start_date, end_date, budget]
        );
        
        // Create notification for admin
        await this.dbService.query(
            `INSERT INTO pending_approvals (entity_type, entity_id, vendor_id, priority)
             VALUES ('advertisement', $1, $2, 'normal')`,
            [result.rows[0].id, vendor_id]
        );
        
        return new VendorAdvertisementModel(result.rows[0]);
    }

    async approveAdvertisement(adId, adminId) {
        const result = await this.dbService.query(
            `UPDATE vendor_advertisements 
             SET status = 'approved', approved_by = $1, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 
             RETURNING *`,
            [adminId, adId]
        );
        
        if (result.rows[0]) {
            // Update pending approval
            await this.dbService.query(
                `UPDATE pending_approvals 
                 SET status = 'resolved', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP
                 WHERE entity_type = 'advertisement' AND entity_id = $2`,
                [adminId, adId]
            );
            
            // Notify vendor
            await this.dbService.query(
                `INSERT INTO notifications (user_id, notification_type, title, message, action_url)
                 VALUES ($1, 'ad_approval', 'Advertisement Approved', 
                         'Your advertisement "${result.rows[0].title}" has been approved and is now live.',
                         '/vendor/ads/${adId}')`,
                [result.rows[0].vendor_id]
            );
        }
        
        return result.rows[0] ? new VendorAdvertisementModel(result.rows[0]) : null;
    }

    async getPendingAdvertisements() {
        const result = await this.dbService.query(
            `SELECT va.*, u.name as vendor_name, u.email as vendor_email
             FROM vendor_advertisements va
             JOIN users u ON va.vendor_id = u.id
             WHERE va.status = 'pending'
             ORDER BY va.created_at ASC`
        );
        return result.rows.map(row => new VendorAdvertisementModel(row));
    }

    async trackAdEvent(adId, eventType, userId = null, ipAddress = null, userAgent = null) {
        await this.dbService.query(
            `INSERT INTO ad_statistics (ad_id, event_type, user_id, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5)`,
            [adId, eventType, userId, ipAddress, userAgent]
        );
        
        // Update counters
        if (eventType === 'view') {
            await this.dbService.query(
                `UPDATE vendor_advertisements SET views_count = views_count + 1 WHERE id = $1`,
                [adId]
            );
        } else if (eventType === 'click') {
            await this.dbService.query(
                `UPDATE vendor_advertisements SET clicks_count = clicks_count + 1 WHERE id = $1`,
                [adId]
            );
        }
    }
}

export default new AdvertisementRepository();