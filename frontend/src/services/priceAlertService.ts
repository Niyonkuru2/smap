// src/services/priceAlertService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const ALERTS_URL = `${API_BASE_URL}/price-alerts`;

export interface PriceAlert {
    id: number;
    user_id: number;
    product_id: number | null;
    product_name: string;
    market_id: string | null;
    market_name: string;
    alert_type: 'below' | 'above' | 'change';
    threshold: number;
    percentage_threshold?: number;
    is_active: boolean;
    last_triggered_at?: string;
    trigger_count?: number;
    created_at: string;
    updated_at: string;
}

export interface AlertStatistics {
    total_alerts: number;
    active_alerts: number;
    inactive_alerts: number;
    triggered_alerts: number;
    total_triggers: number;
    last_triggered?: string;
}

export interface AlertTypeCount {
    alert_type: string;
    count: number;
    active_count: number;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get all price alerts for the current user
 */
export const getUserPriceAlerts = async (): Promise<{ success: boolean; alerts: PriceAlert[]; count: number }> => {
    const response = await axios.get(ALERTS_URL, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Get a single price alert by ID
 */
export const getPriceAlertById = async (id: number): Promise<{ success: boolean; alert: PriceAlert }> => {
    const response = await axios.get(`${ALERTS_URL}/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Create a new price alert
 */
export const createPriceAlert = async (data: {
    productName?: string;
    productId?: number;
    marketName?: string;
    marketId?: string;
    alertType: string;
    threshold: number;
    percentageThreshold?: number;
}): Promise<{ success: boolean; alert: PriceAlert; message: string }> => {
    const response = await axios.post(ALERTS_URL, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Update a price alert
 */
export const updatePriceAlert = async (id: number, data: { 
    is_active?: boolean; 
    threshold?: number; 
    percentageThreshold?: number;
    alertType?: string 
}): Promise<{ success: boolean; alert: PriceAlert; message: string }> => {
    const response = await axios.put(`${ALERTS_URL}/${id}`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Delete a price alert
 */
export const deletePriceAlert = async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await axios.delete(`${ALERTS_URL}/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Toggle price alert (enable/disable)
 */
export const togglePriceAlert = async (id: number): Promise<{ success: boolean; alert: PriceAlert; message: string }> => {
    const response = await axios.patch(`${ALERTS_URL}/${id}/toggle`, {}, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Get alert statistics for the user
 */
export const getAlertStatistics = async (): Promise<{ success: boolean; stats: AlertStatistics; byType: AlertTypeCount[] }> => {
    const response = await axios.get(`${ALERTS_URL}/stats`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

// Export all functions as default object
export default {
    getUserPriceAlerts,
    getPriceAlertById,
    createPriceAlert,
    updatePriceAlert,
    deletePriceAlert,
    togglePriceAlert,
    getAlertStatistics
};