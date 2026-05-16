// src/services/analyticsService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const ANALYTICS_URL = `${API_BASE_URL}/analytics`;

export interface AnalyticsDashboard {
    total_products: number;
    total_markets: number;
    total_vendors: number;
    total_admins: number;
    total_users: number;
    total_price_submissions: number;
    approved_submissions: number;
    pending_approvals: number;
    flagged_submissions: number;
    price_updates_today: number;
    active_subscriptions: number;
    total_advertisements: number;
    active_advertisements: number;
    total_anomalies: number;
    new_anomalies: number;
    critical_anomalies: number;
}

export interface PopularProduct {
    id: number;
    name: string;
    submissions: number;
    markets: number;
    avg_price: number;
}

export interface ActiveMarket {
    id: string;
    name: string;
    province: string;
    district: string;
    submissions: number;
    unique_products: number;
    avg_price: number;
}

export interface WeeklyActivity {
    day_name: string;
    date: string;
    submissions: number;
    avg_price: number;
}

export interface CategoryDistribution {
    name: string;
    value: number;
}

export interface PriceAlert {
    product: string;
    market: string;
    current_price: number;
    previous_price: number;
    change: string;
    type: 'increase' | 'decrease';
    percentage: number;
    date: string;
}

export interface MonthlyTrend {
    month: string;
    submissions: number;
    avg_price: number;
    active_vendors: number;
}

export interface TopVendor {
    id: number;
    name: string;
    email: string;
    submissions: number;
    unique_products: number;
    avg_price: number;
    trust_score: number;
}

export interface PriceRangeDistribution {
    price_range: string;
    count: number;
}

export interface SummaryStats {
    total_approved_prices: number;
    last_7_days: number;
    last_30_days: number;
    avg_price: number;
    min_price: number;
    max_price: number;
    active_vendors: number;
    active_products: number;
    active_markets: number;
}

export interface AnomalyStats {
    total_anomalies: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    new: number;
    investigating: number;
    resolved: number;
    dismissed: number;
    avg_deviation: number;
}

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Get main analytics dashboard
export const getAnalyticsDashboard = async (): Promise<AnalyticsDashboard> => {
    const response = await axios.get(`${ANALYTICS_URL}/dashboard`);
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error('Failed to fetch analytics dashboard');
};

// Get popular products
export const getPopularProducts = async (limit: number = 5): Promise<PopularProduct[]> => {
    const response = await axios.get(`${ANALYTICS_URL}/popular-products`, { params: { limit } });
    if (response.data.success) {
        return response.data.data;
    }
    return [];
};

// Get active markets
export const getActiveMarkets = async (limit: number = 5): Promise<ActiveMarket[]> => {
    const response = await axios.get(`${ANALYTICS_URL}/active-markets`, { params: { limit } });
    if (response.data.success) {
        return response.data.data;
    }
    return [];
};

// Get weekly activity
export const getWeeklyActivity = async (): Promise<WeeklyActivity[]> => {
    const response = await axios.get(`${ANALYTICS_URL}/weekly-activity`);
    if (response.data.success) {
        return response.data.data;
    }
    return [];
};

// Get category distribution
export const getCategoryDistribution = async (): Promise<CategoryDistribution[]> => {
    const response = await axios.get(`${ANALYTICS_URL}/category-distribution`);
    if (response.data.success) {
        return response.data.data;
    }
    return [];
};

// Get price alerts
export const getPriceAlerts = async (limit: number = 5): Promise<PriceAlert[]> => {
    const response = await axios.get(`${ANALYTICS_URL}/price-alerts`, { params: { limit } });
    if (response.data.success) {
        return response.data.data;
    }
    return [];
};

// Get monthly trend
export const getMonthlyTrend = async (months: number = 6): Promise<MonthlyTrend[]> => {
    const response = await axios.get(`${ANALYTICS_URL}/monthly-trend`, { params: { months } });
    if (response.data.success) {
        return response.data.data;
    }
    return [];
};

// Get top vendors (admin only)
export const getTopVendors = async (limit: number = 5): Promise<TopVendor[]> => {
    const response = await axios.get(`${ANALYTICS_URL}/top-vendors`, {
        params: { limit },
        headers: getAuthHeaders()
    });
    if (response.data.success) {
        return response.data.data;
    }
    return [];
};

// Get price range distribution
export const getPriceRangeDistribution = async (): Promise<PriceRangeDistribution[]> => {
    const response = await axios.get(`${ANALYTICS_URL}/price-range-distribution`);
    if (response.data.success) {
        return response.data.data;
    }
    return [];
};

// Get summary stats
export const getSummaryStats = async (): Promise<SummaryStats> => {
    const response = await axios.get(`${ANALYTICS_URL}/summary-stats`);
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error('Failed to fetch summary stats');
};

// Get anomaly stats (admin only)
export const getAnomalyStatsForDashboard = async (): Promise<AnomalyStats> => {
    const response = await axios.get(`${ANALYTICS_URL}/anomaly-stats`, {
        headers: getAuthHeaders()
    });
    if (response.data.success) {
        return response.data.data;
    }
    throw new Error('Failed to fetch anomaly stats');
};

export default {
    getAnalyticsDashboard,
    getPopularProducts,
    getActiveMarkets,
    getWeeklyActivity,
    getCategoryDistribution,
    getPriceAlerts,
    getMonthlyTrend,
    getTopVendors,
    getPriceRangeDistribution,
    getSummaryStats,
    getAnomalyStatsForDashboard
};