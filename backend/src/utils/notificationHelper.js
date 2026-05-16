import pool from '../config/database.js';

/**
 * Create a notification for a user
 * @param {number} userId - The ID of the user to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} notificationType - Type of notification (price_alert, price_approval, etc.)
 * @param {string} priority - Priority level (low, normal, high, urgent)
 * @param {object} data - Additional data to store with notification
 * @returns {Promise<object>} - The created notification
 */
export async function createNotification(userId, title, message, notificationType, priority = 'normal', data = null) {
    try {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, title, message, notification_type, priority, data, created_at, is_read)
             VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)
             RETURNING *`,
            [userId, title, message, notificationType, priority, data ? JSON.stringify(data) : null]
        );
        
        // Emit real-time notification via WebSocket if available
        if (global.io) {
            global.io.to(`user_${userId}`).emit('new_notification', result.rows[0]);
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
}

/**
 * Create notifications for multiple users
 * @param {number[]} userIds - Array of user IDs to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} notificationType - Type of notification
 * @param {string} priority - Priority level
 * @param {object} data - Additional data
 * @returns {Promise<object[]>} - Array of created notifications
 */
export async function createBulkNotifications(userIds, title, message, notificationType, priority = 'normal', data = null) {
    const notifications = [];
    for (const userId of userIds) {
        const notification = await createNotification(userId, title, message, notificationType, priority, data);
        if (notification) notifications.push(notification);
    }
    return notifications;
}

/**
 * Notify all admins
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} notificationType - Type of notification
 * @param {string} priority - Priority level
 * @param {object} data - Additional data
 * @returns {Promise<object[]>} - Array of created notifications
 */
export async function notifyAdmins(title, message, notificationType, priority = 'normal', data = null) {
    try {
        const admins = await pool.query(
            "SELECT id FROM users WHERE role = 'admin' AND is_active = true"
        );
        
        return await createBulkNotifications(
            admins.rows.map(a => a.id),
            title,
            message,
            notificationType,
            priority,
            data
        );
    } catch (error) {
        console.error('Error notifying admins:', error);
        return [];
    }
}

/**
 * Mark a notification as read
 * @param {number} notificationId - The ID of the notification
 * @param {number} userId - The ID of the user (for verification)
 * @returns {Promise<boolean>} - Success status
 */
export async function markNotificationAsRead(notificationId, userId) {
    try {
        const result = await pool.query(
            `UPDATE notifications 
             SET is_read = true, read_at = NOW()
             WHERE id = $1 AND user_id = $2
             RETURNING id`,
            [notificationId, userId]
        );
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

/**
 * Get unread notification count for a user
 * @param {number} userId - The ID of the user
 * @returns {Promise<number>} - Unread count
 */
export async function getUnreadNotificationCount(userId) {
    try {
        const result = await pool.query(
            `SELECT COUNT(*) as count FROM notifications 
             WHERE user_id = $1 AND is_read = false`,
            [userId]
        );
        return parseInt(result.rows[0].count);
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}

/**
 * Get recent notifications for a user
 * @param {number} userId - The ID of the user
 * @param {number} limit - Maximum number of notifications to return
 * @returns {Promise<object[]>} - Array of notifications
 */
export async function getRecentNotifications(userId, limit = 10) {
    try {
        const result = await pool.query(
            `SELECT 
                id, title, message, notification_type, priority, 
                is_read, created_at, data
             FROM notifications 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    } catch (error) {
        console.error('Error getting recent notifications:', error);
        return [];
    }
}

/**
 * Delete old notifications (cleanup)
 * @param {number} daysOld - Delete notifications older than this many days
 * @returns {Promise<number>} - Number of deleted notifications
 */
export async function cleanupOldNotifications(daysOld = 90) {
    try {
        const result = await pool.query(
            `DELETE FROM notifications 
             WHERE created_at < NOW() - INTERVAL '${daysOld} days'
             AND is_read = true
             RETURNING id`
        );
        return result.rows.length;
    } catch (error) {
        console.error('Error cleaning up old notifications:', error);
        return 0;
    }
}

export default {
    createNotification,
    createBulkNotifications,
    notifyAdmins,
    markNotificationAsRead,
    getUnreadNotificationCount,
    getRecentNotifications,
    cleanupOldNotifications
};