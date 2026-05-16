// src/routes/notificationRoutes.js
import express from 'express';
import { authenticateToken, authorize } from '../middleware/auth.js';
import {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    sendNotification,
    getNotificationPreferences,
    updateNotificationPreferences,
    getNotificationStats,
    getUnreadCount
} from '../controllers/notificationController.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', getUserNotifications);
router.get('/unread-count', getUnreadCount);  
router.put('/mark-all-read', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// Preferences
router.get('/preferences', getNotificationPreferences);
router.put('/preferences', updateNotificationPreferences);

// Admin only routes
router.post('/send', authorize('admin'), sendNotification);
router.get('/stats', authorize('admin'), getNotificationStats);

export default router;