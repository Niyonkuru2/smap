import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, adminOnly);

// User management
router.get('/users', adminController.getUsers);
router.post('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Submission management
router.get('/submissions', adminController.getPendingSubmissions);
router.post('/submissions/:id/approve', adminController.approveSubmission);
router.post('/submissions/:id/reject', adminController.rejectSubmission);

// Stats & monitoring
router.get('/stats', adminController.getAdminStats);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/errors', adminController.getErrors);
router.get('/performance', adminController.getPerformanceMetrics);
router.post('/cache/clear', adminController.clearCache);

export default router;