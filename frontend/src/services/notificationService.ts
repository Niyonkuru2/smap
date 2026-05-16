// src/services/notificationService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const NOTIFICATIONS_URL = `${API_BASE_URL}/notifications`;

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    notification_type: string;
    priority: string;
    is_read: boolean;
    read_at: string | null;
    action_url: string | null;
    created_at: string;
    severity: string;
}

export interface NotificationPreferences {
    alert_type: string;
    is_enabled: boolean;
    notification_method: string;
}

export interface NotificationStats {
    total_sent: number;
    sent_today: number;
    open_rate: number;
    unique_recipients: number;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get user notifications
export const getUserNotifications = async (options?: { limit?: number; unreadOnly?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.unreadOnly) params.append('unreadOnly', 'true');
    
    const response = await axios.get(`${NOTIFICATIONS_URL}?${params.toString()}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Mark a single notification as read
export const markAsRead = async (id: number) => {
    const response = await axios.put(`${NOTIFICATIONS_URL}/${id}/read`, {}, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Mark all notifications as read
export const markAllAsRead = async () => {
    const response = await axios.put(`${NOTIFICATIONS_URL}/mark-all-read`, {}, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Delete a notification
export const deleteNotification = async (id: number) => {
    const response = await axios.delete(`${NOTIFICATIONS_URL}/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Get user notification preferences
export const getNotificationPreferences = async () => {
    const response = await axios.get(`${NOTIFICATIONS_URL}/preferences`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Update notification preferences
export const updateNotificationPreferences = async (preferences: NotificationPreferences[]) => {
    const response = await axios.put(`${NOTIFICATIONS_URL}/preferences`, { preferences }, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Send notification (Admin only)
export const sendNotification = async (data: {
    title: string;
    message: string;
    notificationType: string;
    targetAudience: string;
    priority?: string;
    actionUrl?: string;
}) => {
    const response = await axios.post(`${NOTIFICATIONS_URL}/send`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Get notification statistics (Admin only)
export const getNotificationStats = async (): Promise<{ success: boolean; stats: NotificationStats; weekly: any[] }> => {
    const response = await axios.get(`${NOTIFICATIONS_URL}/stats`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Get unread count only
export const getUnreadCount = async (): Promise<{ success: boolean; count: number }> => {
    const response = await axios.get(`${NOTIFICATIONS_URL}/unread-count`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Create system notification (for internal use)
export const createSystemNotification = async (data: {
    userId?: number;
    title: string;
    message: string;
    notificationType: string;
    priority?: string;
    actionUrl?: string;
}) => {
    const response = await axios.post(`${NOTIFICATIONS_URL}/system`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export default {
    getUserNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getNotificationPreferences,
    updateNotificationPreferences,
    sendNotification,
    getNotificationStats,
    getUnreadCount,
    createSystemNotification
};