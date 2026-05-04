import DatabaseService from './DatabaseService.js';
import PriceRepository from '../repositories/PriceRepository.js';
import SubscriptionRepository from '../repositories/SubscriptionRepository.js';
import NotificationRepository from '../repositories/NotificationRepository.js';
import PriceAlertRepository from '../repositories/PriceAlertRepository.js';
import PriceChangeHistoryRepository from '../repositories/PriceChangeHistoryRepository.js';

class PriceSubmissionService {
    constructor() {
        this.dbService = DatabaseService;
        this.priceRepo = PriceRepository;
        this.subscriptionRepo = SubscriptionRepository;
        this.notificationRepo = NotificationRepository;
        this.alertRepo = PriceAlertRepository;
        this.historyRepo = PriceChangeHistoryRepository;
    }

    async submitPrice(vendorId, priceData) {
        // Check if vendor has active subscription
        const canSubmit = await this.subscriptionRepo.checkVendorCanSubmitPrice(vendorId);
        if (!canSubmit.allowed) {
            throw new Error(canSubmit.reason);
        }

        // Check for duplicate recent submissions
        const recentSubmissions = await this.dbService.query(
            `SELECT * FROM prices 
             WHERE vendor_id = $1 
               AND product_id = $2 
               AND market_id = $3 
               AND created_at > NOW() - INTERVAL '1 hour'`,
            [vendorId, priceData.product_id, priceData.market_id]
        );
        
        if (recentSubmissions.rows.length > 0) {
            throw new Error('You have already submitted a price for this product/market in the last hour');
        }

        // Get current price for change tracking
        const currentPrice = await this.dbService.query(
            `SELECT price FROM prices 
             WHERE product_id = $1 AND market_id = $2 AND status = 'approved'
             ORDER BY created_at DESC LIMIT 1`,
            [priceData.product_id, priceData.market_id]
        );

        const submission = await this.priceRepo.create({
            ...priceData,
            vendor_id: vendorId,
            previous_price: currentPrice.rows[0]?.price || null
        });

        // Create notification for admin
        await this.dbService.query(
            `INSERT INTO pending_approvals (entity_type, entity_id, vendor_id, priority)
             VALUES ('price', $1, $2, 'normal')`,
            [submission.id, vendorId]
        );

        // Notify all admins
        await this.dbService.query(
            `INSERT INTO notifications (user_id, notification_type, title, message, data, priority)
             SELECT id, 'price_submitted', 'New Price Submission', 
                    'Vendor ${vendorId} has submitted a new price for approval',
                    $1, 'high'
             FROM users WHERE role = 'admin'`,
            [JSON.stringify({ price_id: submission.id, vendor_id: vendorId })]
        );

        return submission;
    }

    async approvePrice(priceId, adminId, adminNotes = null) {
        // Get the price submission
        const price = await this.priceRepo.findById(priceId);
        if (!price) throw new Error('Price submission not found');

        // Get current price for change tracking
        const currentPrice = await this.dbService.query(
            `SELECT price FROM prices 
             WHERE product_id = $1 AND market_id = $2 AND status = 'approved'
             ORDER BY created_at DESC LIMIT 1`,
            [price.product_id, price.market_id]
        );

        // Approve the price
        const approved = await this.priceRepo.updateStatus(priceId, 'approved', adminId);
        
        // Track price change
        if (currentPrice.rows[0]) {
            const change = ((price.price - currentPrice.rows[0].price) / currentPrice.rows[0].price) * 100;
            await this.historyRepo.create({
                price_id: priceId,
                product_id: price.product_id,
                market_id: price.market_id,
                old_price: currentPrice.rows[0].price,
                new_price: price.price,
                percentage_change: change,
                change_type: change > 0 ? 'increase' : change < 0 ? 'decrease' : 'new'
            });
        }

        // Update pending approval
        await this.dbService.query(
            `UPDATE pending_approvals 
             SET status = 'resolved', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP, admin_notes = $2
             WHERE entity_type = 'price' AND entity_id = $3`,
            [adminId, adminNotes, priceId]
        );

        // Notify vendor
        await this.dbService.query(
            `INSERT INTO notifications (user_id, notification_type, title, message, data)
             VALUES ($1, 'price_approval', 'Price Approved', 
                     'Your submitted price of KES ${price.price} has been approved.',
                     $2)`,
            [price.vendor_id, JSON.stringify({ price_id: priceId, status: 'approved' })]
        );

        // Check and trigger price alerts for consumers
        await this.alertRepo.checkAndTriggerAlerts(price.product_id, price.market_id, price.price);

        // Update vendor metrics
        await this.dbService.query(
            `INSERT INTO vendor_metrics (vendor_id, approved_submissions, month_year)
             VALUES ($1, 1, DATE_TRUNC('month', CURRENT_DATE))
             ON CONFLICT (vendor_id, month_year) 
             DO UPDATE SET approved_submissions = vendor_metrics.approved_submissions + 1`,
            [price.vendor_id]
        );

        return approved;
    }

    async rejectPrice(priceId, adminId, rejectionReason) {
        const price = await this.priceRepo.findById(priceId);
        if (!price) throw new Error('Price submission not found');

        const rejected = await this.priceRepo.updateStatus(priceId, 'rejected', adminId, rejectionReason);

        // Update pending approval
        await this.dbService.query(
            `UPDATE pending_approvals 
             SET status = 'resolved', resolved_by = $1, resolved_at = CURRENT_TIMESTAMP, admin_notes = $2
             WHERE entity_type = 'price' AND entity_id = $3`,
            [adminId, rejectionReason, priceId]
        );

        // Notify vendor
        await this.dbService.query(
            `INSERT INTO notifications (user_id, notification_type, title, message, data)
             VALUES ($1, 'price_rejection', 'Price Rejected', 
                     'Your submitted price of KES ${price.price} has been rejected. Reason: ${rejectionReason}',
                     $2)`,
            [price.vendor_id, JSON.stringify({ price_id: priceId, status: 'rejected', reason: rejectionReason })]
        );

        // Update vendor metrics
        await this.dbService.query(
            `INSERT INTO vendor_metrics (vendor_id, rejected_submissions, month_year)
             VALUES ($1, 1, DATE_TRUNC('month', CURRENT_DATE))
             ON CONFLICT (vendor_id, month_year) 
             DO UPDATE SET rejected_submissions = vendor_metrics.rejected_submissions + 1`,
            [price.vendor_id]
        );

        return rejected;
    }

    async getPendingPriceSubmissions() {
        const result = await this.dbService.query(
            `SELECT p.*, 
                    pr.name as product_name,
                    m.name as market_name,
                    u.name as vendor_name,
                    u.email as vendor_email,
                    pa.submitted_at as pending_since
             FROM prices p
             JOIN products pr ON p.product_id = pr.id
             JOIN markets m ON p.market_id = m.id
             JOIN users u ON p.vendor_id = u.id
             JOIN pending_approvals pa ON pa.entity_id = p.id AND pa.entity_type = 'price'
             WHERE p.status = 'pending'
             ORDER BY p.created_at ASC`
        );
        return result.rows;
    }
}

export default new PriceSubmissionService();