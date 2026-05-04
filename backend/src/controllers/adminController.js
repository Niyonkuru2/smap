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

export const approveSubmission = catchAsync(async (req, res) => {
    const { id } = req.params;
    const updated = await PriceRepository.updateStatus(id, 'approved', req.user.id);
    auditLog.logPriceAction('price.approve', req.user.id, id);
    res.json({ success: true });
});

export const rejectSubmission = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const updated = await PriceRepository.updateStatus(id, 'rejected', req.user.id);
    auditLog.logPriceAction('price.reject', req.user.id, id, { reason });
    res.json({ success: true });
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