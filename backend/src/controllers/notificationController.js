import { catchAsync } from '../middleware/errorHandler.js';
import pool from '../config/database.js';

// Get all notifications for a user
export const getUserNotifications = catchAsync(async (req, res) => {
    const { limit = 50, offset = 0, unreadOnly = false } = req.query;
    const userId = req.user.id;
    
    let query = `
        SELECT 
            n.id,
            n.title,
            n.message,
            n.type,
            n.notification_type,
            n.data,
            n.priority,
            n.is_read,
            n.read_at,
            n.action_url,
            n.created_at,
            CASE 
                WHEN n.priority = 'urgent' THEN 'critical'
                WHEN n.priority = 'high' THEN 'high'
                WHEN n.priority = 'normal' THEN 'medium'
                ELSE 'low'
            END as severity
        FROM notifications n
        WHERE n.user_id = $1 OR n.user_id IS NULL
    `;
    
    const params = [userId];
    let paramIndex = 2;
    
    if (unreadOnly === 'true') {
        query += ` AND n.is_read = false`;
    }
    
    query += ` ORDER BY n.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    
    const result = await pool.query(query, params);
    
    // Get unread count
    const countResult = await pool.query(
        `SELECT COUNT(*) FROM notifications 
         WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false`,
        [userId]
    );
    
    res.json({
        success: true,
        notifications: result.rows,
        unreadCount: parseInt(countResult.rows[0].count),
        pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset)
        }
    });
});

// Mark notification as read
export const markAsRead = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
        `UPDATE notifications 
         SET is_read = true, read_at = NOW()
         WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
         RETURNING *`,
        [id, userId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
        success: true,
        notification: result.rows[0],
        message: 'Marked as read'
    });
});

// Mark all notifications as read
export const markAllAsRead = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    await pool.query(
        `UPDATE notifications 
         SET is_read = true, read_at = NOW()
         WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false`,
        [userId]
    );
    
    res.json({
        success: true,
        message: 'All notifications marked as read'
    });
});

// Delete notification
export const deleteNotification = catchAsync(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await pool.query(
        `DELETE FROM notifications 
         WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
         RETURNING id`,
        [id, userId]
    );
    
    if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
        success: true,
        message: 'Notification deleted'
    });
});

// Send notification (Admin only)
export const sendNotification = catchAsync(async (req, res) => {
    const { title, message, notificationType, targetAudience, priority = 'normal', actionUrl } = req.body;
    const userId = req.user.id;
    
    // Get target users based on audience
    let userQuery = '';
    if (targetAudience === 'all') {
        userQuery = 'SELECT id FROM users WHERE is_active = true';
    } else if (targetAudience === 'consumers') {
        userQuery = "SELECT id FROM users WHERE role = 'consumer' AND is_active = true";
    } else if (targetAudience === 'vendors') {
        userQuery = "SELECT id FROM users WHERE role = 'vendor' AND is_active = true";
    } else if (targetAudience === 'business') {
        userQuery = "SELECT id FROM users WHERE role = 'business' AND is_active = true";
    } else {
        userQuery = `SELECT id FROM users WHERE id = ${parseInt(targetAudience)}`;
    }
    
    const users = await pool.query(userQuery);
    
    // Insert notifications for each user
    const notifications = [];
    for (const user of users.rows) {
        const result = await pool.query(
            `INSERT INTO notifications (user_id, title, message, notification_type, priority, action_url, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())
             RETURNING *`,
            [user.id, title, message, notificationType, priority, actionUrl]
        );
        notifications.push(result.rows[0]);
    }
    
    res.json({
        success: true,
        message: `Notification sent to ${users.rows.length} users`,
        count: users.rows.length
    });
});

// Get user notification preferences
export const getNotificationPreferences = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const result = await pool.query(
        `SELECT * FROM user_notification_preferences WHERE user_id = $1`,
        [userId]
    );
    
    // Default preferences if none exist
    const defaultPreferences = [
        { alert_type: 'price_below', is_enabled: true, notification_method: 'email' },
        { alert_type: 'price_above', is_enabled: true, notification_method: 'email' },
        { alert_type: 'price_change', is_enabled: true, notification_method: 'email' },
        { alert_type: 'price_approval', is_enabled: true, notification_method: 'email' },
        { alert_type: 'price_rejection', is_enabled: true, notification_method: 'email' },
        { alert_type: 'anomaly_alert', is_enabled: true, notification_method: 'email' },
        { alert_type: 'system_update', is_enabled: true, notification_method: 'email' }
    ];
    
    if (result.rows.length === 0) {
        return res.json({
            success: true,
            preferences: defaultPreferences
        });
    }
    
    res.json({
        success: true,
        preferences: result.rows
    });
});

// Update notification preferences
export const updateNotificationPreferences = catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { preferences } = req.body;
    
    await pool.query('BEGIN');
    
    try {
        // Delete existing preferences
        await pool.query('DELETE FROM user_notification_preferences WHERE user_id = $1', [userId]);
        
        // Insert new preferences
        for (const pref of preferences) {
            await pool.query(
                `INSERT INTO user_notification_preferences (user_id, alert_type, is_enabled, notification_method)
                 VALUES ($1, $2, $3, $4)`,
                [userId, pref.alert_type, pref.is_enabled, pref.notification_method]
            );
        }
        
        await pool.query('COMMIT');
        
        res.json({
            success: true,
            message: 'Preferences updated successfully'
        });
    } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
    }
});

// Get notification statistics (Admin only)
export const getNotificationStats = catchAsync(async (req, res) => {
    const result = await pool.query(`
        SELECT 
            COUNT(*) as total_sent,
            COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as sent_today,
            COUNT(*) FILTER (WHERE is_read = true) as read_count,
            ROUND(AVG(CASE WHEN is_read = true THEN 1 ELSE 0 END) * 100, 2) as open_rate,
            COUNT(DISTINCT user_id) as unique_recipients
        FROM notifications
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
    `);
    
    const weeklyResult = await pool.query(`
        SELECT 
            DATE_TRUNC('week', created_at) as week,
            COUNT(*) as sent,
            COUNT(*) FILTER (WHERE is_read = true) as read
        FROM notifications
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week DESC
    `);
    
    res.json({
        success: true,
        stats: result.rows[0],
        weekly: weeklyResult.rows
    });
});

export const getUnreadCount = catchAsync(async (req, res) => {
    const userId = req.user.id;
    
    const result = await pool.query(
        `SELECT COUNT(*) as count FROM notifications 
         WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false`,
        [userId]
    );
    
    res.json({
        success: true,
        count: parseInt(result.rows[0].count)
    });
});