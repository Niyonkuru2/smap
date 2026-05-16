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

export interface NotificationEvent {
    type: 'notification' | 'unread_count';
    data: any;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class NotificationListener {
    private pollingInterval: NodeJS.Timeout | null = null;
    private listeners: Map<string, Function[]> = new Map();
    private userId: number | null = null;
    private token: string | null = null;
    private lastNotificationCount: number = 0;

    connect(userId: number, token: string) {
        if (this.pollingInterval) {
            this.disconnect();
        }

        this.userId = userId;
        this.token = token;
        
        // Initial fetch
        this.fetchNotifications();
        
        // Poll every 30 seconds
        this.pollingInterval = setInterval(() => {
            this.fetchNotifications();
        }, 30000);
    }

    private async fetchNotifications() {
        if (!this.token) return;

        try {
            const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            const data = await response.json();
            
            if (data.success && data.count !== this.lastNotificationCount) {
                this.lastNotificationCount = data.count;
                
                // Fetch actual notifications
                const notificationsResponse = await fetch(`${API_BASE_URL}/notifications?limit=10`, {
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
                
                const notificationsData = await notificationsResponse.json();
                
                if (notificationsData.success && notificationsData.notifications) {
                    this.emit('notification', {
                        type: 'new_notifications',
                        notifications: notificationsData.notifications,
                        unreadCount: data.count
                    });
                }
            }
        } catch (error) {
            console.error('Notification polling error:', error);
        }
    }

    reconnect(userId: number, token: string) {
        this.disconnect();
        setTimeout(() => this.connect(userId, token), 1000);
    }

    disconnect() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
        this.userId = null;
        this.token = null;
        this.lastNotificationCount = 0;
    }

    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event)!.push(callback);
    }

    off(event: string, callback: Function) {
        if (!this.listeners.has(event)) return;
        const callbacks = this.listeners.get(event)!;
        const index = callbacks.indexOf(callback);
        if (index !== -1) callbacks.splice(index, 1);
    }

    emit(event: string, data: unknown) {
        if (!this.listeners.has(event)) return;
        this.listeners.get(event)!.forEach(callback => callback(data));
    }
}

export const notificationListener = new NotificationListener();