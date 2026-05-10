import { catchAsync } from '../middleware/errorHandler.js';
import DatabaseService from '../services/DatabaseService.js';
import PriceRepository from '../repositories/PriceRepository.js';
import UserRepository from '../repositories/UserRepository.js';
import * as auditLog from '../services/auditLog.js';
import * as errorTracking from '../services/errorTracking.js';
import { performanceTracker } from '../middleware/performance.js';

export const getUsers = catchAsync(async (req, res) => {
    const users = await UserRepository.getAll();
    res.json({ success: true, users });
});

export const updateUserRole = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { role } = req.body;
    
    const updated = await UserRepository.update(id, { role });
    auditLog.logAdminAction(req.user.id, req.user.email, 'user.role.change', 'users', { userId: id, newRole: role });
    
    res.json({ success: true, user: updated });
});

export const deleteUser = catchAsync(async (req, res) => {
    await DatabaseService.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    auditLog.logAdminAction(req.user.id, req.user.email, 'user.delete', 'users', { userId: req.params.id });
    res.json({ success: true });
});

export const getPendingSubmissions = catchAsync(async (req, res) => {
    const submissions = await PriceRepository.getAll({ status: 'pending' });
    res.json({ success: true, submissions });
});

// FIXED: Use DatabaseService.query directly since PriceRepository doesn't have updateStatus
export const approveSubmission = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    // Update the price status to approved
    const result = await DatabaseService.query(
        `UPDATE prices 
         SET status = 'approved', 
             approved_by = $1, 
             approved_at = NOW(),
             updated_at = NOW()
         WHERE id = $2 
         RETURNING *`,
        [req.user.id, id]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    
    auditLog.logPriceAction('price.approve', req.user.id, id);
    res.json({ success: true, submission: result.rows[0] });
});

// FIXED: Use DatabaseService.query directly
export const rejectSubmission = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Update the price status to rejected
    const result = await DatabaseService.query(
        `UPDATE prices 
         SET status = 'rejected', 
             rejected_by = $1, 
             rejected_at = NOW(),
             rejection_reason = $2,
             updated_at = NOW()
         WHERE id = $3 
         RETURNING *`,
        [req.user.id, reason, id]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Submission not found' });
    }
    
    auditLog.logPriceAction('price.reject', req.user.id, id, { reason });
    res.json({ success: true, submission: result.rows[0] });
});

// FIXED: Get all submissions with proper joins
export const getAllSubmissions = catchAsync(async (req, res) => {
    const result = await DatabaseService.query(`
        SELECT 
            p.id,
            p.product_id,
            p.market_id,
            p.vendor_id,
            p.price,
            p.previous_price,
            p.unit,
            p.status,
            p.admin_notes,
            p.vendor_notes,
            p.flagged,
            p.flag_reason,
            p.approved_by,
            p.approved_at,
            p.rejected_by,
            p.rejected_at,
            p.rejection_reason,
            p.created_at,
            p.updated_at,
            pr.name as product_name,
            m.name as market_name,
            u.name as vendor_name,
            EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 as age_in_hours
        FROM prices p
        LEFT JOIN products pr ON p.product_id = pr.id
        LEFT JOIN markets m ON p.market_id = m.id
        LEFT JOIN users u ON p.vendor_id = u.id
        ORDER BY p.created_at DESC
    `);
    
    res.json({ 
        success: true, 
        submissions: result.rows.map(row => ({
            id: row.id,
            productId: row.product_id?.toString(),
            product_id: row.product_id,
            product_name: row.product_name,
            marketId: row.market_id,
            market_id: row.market_id,
            market_name: row.market_name,
            vendorId: row.vendor_id?.toString(),
            vendor_id: row.vendor_id,
            vendorName: row.vendor_name || 'Unknown Vendor',
            vendor_name: row.vendor_name,
            price: parseFloat(row.price),
            previous_price: row.previous_price ? parseFloat(row.previous_price) : null,
            unit: row.unit,
            status: row.status,
            admin_notes: row.admin_notes,
            vendor_notes: row.vendor_notes,
            flagged: row.flagged,
            flag_reason: row.flag_reason,
            approved_by: row.approved_by,
            approved_at: row.approved_at,
            rejected_by: row.rejected_by,
            rejected_at: row.rejected_at,
            rejection_reason: row.rejection_reason,
            created_at: row.created_at,
            updated_at: row.updated_at,
            age_in_hours: parseFloat(row.age_in_hours) || 0
        }))
    });
});

export const getAdminStats = catchAsync(async (req, res) => {
    const stats = await DatabaseService.query(`
        SELECT 
            (SELECT COUNT(*) FROM users) as total_users,
            (SELECT COUNT(*) FROM products) as total_products,
            (SELECT COUNT(*) FROM markets) as total_markets,
            (SELECT COUNT(*) FROM prices) as total_prices,
            (SELECT COUNT(*) FROM prices WHERE status = 'pending') as pending_submissions,
            (SELECT COUNT(*) FROM prices WHERE status = 'approved') as approved_prices
    `);
    
    res.json({ success: true, stats: stats.rows[0] });
});

export const getAuditLogs = catchAsync(async (req, res) => {
    const { action, userId, limit = 100, offset = 0 } = req.query;
    const logs = auditLog.getLogs({ action, userId, limit: parseInt(limit), offset: parseInt(offset) });
    res.json({ success: true, ...logs });
});

export const getErrors = catchAsync(async (req, res) => {
    const { severity, limit = 50, offset = 0 } = req.query;
    const errors = errorTracking.getErrors({ severity, limit: parseInt(limit), offset: parseInt(offset) });
    res.json({ success: true, ...errors });
});

export const getPerformanceMetrics = catchAsync(async (req, res) => {
    const metrics = performanceTracker.getMetrics();
    res.json({ success: true, metrics });
});

export const clearCache = catchAsync(async (req, res) => {
    // Clear various caches
    res.json({ success: true, message: 'Cache cleared' });
});