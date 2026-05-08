// src/routes/subscriptionRoutes.js
import express from 'express';
import { authenticate, adminOnly } from '../middleware/auth.js';
import {
    // Plan management
    getAllPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    // User subscription
    subscribeToPlan,
    getMyActiveSubscription,
    getMySubscriptions,
    cancelSubscription,
    // Admin subscription
    getPendingSubscriptions,
    approveSubscription,
    rejectSubscription,
    getSubscriptionStats,
    // Cron jobs
    checkExpiringSubscriptions,
    expireSubscriptions
} from '../controllers/subscriptionController.js';

const router = express.Router();

// =============================
// PUBLIC ROUTES
// =============================
router.get('/plans', getAllPlans);
router.get('/plans/:id', getPlanById);

// =============================
// USER ROUTES (Authenticated)
// =============================
router.post('/subscribe', authenticate, subscribeToPlan);
router.get('/me/active', authenticate, getMyActiveSubscription);
router.get('/me/history', authenticate, getMySubscriptions);
router.delete('/cancel/:id', authenticate, cancelSubscription);

// =============================
// ADMIN ROUTES
// =============================
router.post('/admin/plans', authenticate, adminOnly, createPlan);
router.put('/admin/plans/:id', authenticate, adminOnly, updatePlan);
router.delete('/admin/plans/:id', authenticate, adminOnly, deletePlan);
router.get('/admin/pending', authenticate, adminOnly, getPendingSubscriptions);
router.post('/admin/approve/:id', authenticate, adminOnly, approveSubscription);
router.post('/admin/reject/:id', authenticate, adminOnly, rejectSubscription);
router.get('/admin/stats', authenticate, adminOnly, getSubscriptionStats);

// =============================
// CRON JOB ENDPOINTS (Admin only, can be called by scheduler)
// =============================
router.post('/admin/check-expiring', authenticate, adminOnly, checkExpiringSubscriptions);
router.post('/admin/expire', authenticate, adminOnly, expireSubscriptions);

export default router;