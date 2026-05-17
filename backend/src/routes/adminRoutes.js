// src/routes/adminRoutes.js
import express from 'express';
import * as adminController from '../controllers/adminController.js';
import { authenticateToken, adminOnly } from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken, adminOnly);

// User management
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', adminController.updateUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Submission management
router.get('/submissions', adminController.getAllSubmissions);
router.get('/submissions/pending', adminController.getPendingSubmissions);
router.put('/submissions/:id/approve', adminController.approveSubmission);
router.put('/submissions/:id/reject', adminController.rejectSubmission);

// Stats & monitoring
router.get('/stats', adminController.getAdminStats);
router.get('/audit-logs', adminController.getAuditLogs);
router.get('/errors', adminController.getErrors);
router.get('/performance', adminController.getPerformanceMetrics);
router.post('/cache/clear', adminController.clearCache);

export default router;