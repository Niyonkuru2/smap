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
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getUserPriceAlerts = async () => {
    const response = await axios.get(ALERTS_URL, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const createPriceAlert = async (data: {
    productName?: string;
    productId?: number;
    marketName?: string;
    marketId?: string;
    alertType: string;
    threshold: number;
}) => {
    const response = await axios.post(ALERTS_URL, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const updatePriceAlert = async (id: number, data: { is_active?: boolean; threshold?: number; alertType?: string }) => {
    const response = await axios.put(`${ALERTS_URL}/${id}`, data, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const deletePriceAlert = async (id: number) => {
    const response = await axios.delete(`${ALERTS_URL}/${id}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

export const togglePriceAlert = async (id: number) => {
    const response = await axios.patch(`${ALERTS_URL}/${id}/toggle`, {}, {
        headers: getAuthHeaders()
    });
    return response.data;
};