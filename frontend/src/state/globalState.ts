import type { UserRole } from '../types';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    timestamp: Date;
    read: boolean;
    userId: string;
    userRole: UserRole;
    relatedId?: string;
}

// Global notifications state
export const globalNotifications: Notification[] = [];

// Global price submissions state
export const globalPriceSubmissions: any[] = [];
