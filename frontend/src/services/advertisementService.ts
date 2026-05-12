// src/services/advertisementService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const ADS_URL = `${API_BASE_URL}/advertisements`;

// ============================================
// TYPES
// ============================================

export interface Advertisement {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  target_url: string | null;
  advertisement_type: 'banner' | 'sponsored' | 'featured' | 'popup';
  placement: string | null;
  budget: number;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'expired';
  start_date: string | null;
  end_date: string | null;
  views_count: number;
  clicks_count: number;
  rejection_reason: string | null;
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  vendor_name?: string;
  vendor_email?: string;
}

export interface AdStats {
  total_ads: number;
  active_ads: number;
  pending_ads: number;
  rejected_ads: number;
  expired_ads: number;
  total_views: number;
  total_clicks: number;
}

export interface AdPerformance {
  id: number;
  title: string;
  status: string;
  budget: number;
  views_count: number;
  clicks_count: number;
  ctr: number;
  cost_per_click: number;
  created_at: string;
  approved_at: string | null;
}

export interface SubmitAdRequest {
  title: string;
  description?: string;
  image_url?: string;
  target_url?: string;
  advertisement_type?: 'banner' | 'sponsored' | 'featured' | 'popup';
  placement?: string;
  budget: number;
  start_date?: string;
  end_date?: string;
}

export interface UpdateAdRequest {
  title?: string;
  description?: string;
  image_url?: string;
  target_url?: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
}

export interface AdAnalytics {
  summary: {
    total_ads: number;
    active_ads: number;
    pending_ads: number;
    rejected_ads: number;
    expired_ads: number;
    total_views: number;
    total_clicks: number;
    total_budget: number;
    avg_views_per_ad: number;
    avg_clicks_per_ad: number;
  };
  top_ads: Array<{
    id: number;
    title: string;
    vendor_id: number;
    vendor_name: string;
    views_count: number;
    clicks_count: number;
    ctr: number;
  }>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Map advertisement from API response
 */
const mapAdvertisement = (ad: any): Advertisement => {
  return {
    id: ad.id,
    title: ad.title,
    description: ad.description || '',
    image_url: ad.image_url,
    target_url: ad.target_url,
    advertisement_type: ad.advertisement_type,
    placement: ad.placement,
    budget: parseFloat(ad.budget),
    status: ad.status,
    start_date: ad.start_date,
    end_date: ad.end_date,
    views_count: parseInt(ad.views_count) || 0,
    clicks_count: parseInt(ad.clicks_count) || 0,
    rejection_reason: ad.rejection_reason,
    approved_by: ad.approved_by,
    approved_at: ad.approved_at,
    created_at: ad.created_at,
    updated_at: ad.updated_at,
    vendor_name: ad.vendor_name,
    vendor_email: ad.vendor_email
  };
};

// ============================================
// PUBLIC ENDPOINTS (No auth required)
// ============================================

/**
 * Get active advertisements (for display on consumer side)
 */
export const getActiveAdvertisements = async (params?: {
  placement?: string;
  limit?: number;
}): Promise<Advertisement[]> => {
  try {
    const response = await axios.get(`${ADS_URL}/active`, { params });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map(mapAdvertisement);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching active ads:', error);
    return [];
  }
};

/**
 * Track ad view (public)
 */
export const trackAdView = async (adId: number): Promise<void> => {
  try {
    await axios.post(`${ADS_URL}/${adId}/view`);
  } catch (error) {
    console.error('Error tracking ad view:', error);
  }
};

/**
 * Track ad click (public)
 */
export const trackAdClick = async (adId: number): Promise<string | null> => {
  try {
    const response = await axios.get(`${ADS_URL}/${adId}/click`);
    if (response.data && response.data.success) {
      return response.data.redirect_url;
    }
    return null;
  } catch (error) {
    console.error('Error tracking ad click:', error);
    return null;
  }
};

// ============================================
// VENDOR ENDPOINTS (Authentication required)
// ============================================

/**
 * Submit a new advertisement (Vendor)
 */
export const submitAdvertisement = async (data: SubmitAdRequest): Promise<{
  success: boolean;
  message: string;
  advertisement?: Advertisement;
  requiresSubscription?: boolean;
}> => {
  try {
    const response = await axios.post(`${ADS_URL}/submit`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data) {
      return error.response.data;
    }
    throw new Error(error.response?.data?.message || 'Failed to submit advertisement');
  }
};

/**
 * Get my advertisements (Vendor)
 */
export const getMyAdvertisements = async (status?: string): Promise<Advertisement[]> => {
  try {
    const params = status ? { status } : {};
    const response = await axios.get(`${ADS_URL}/my-ads`, {
      params,
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map(mapAdvertisement);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching my ads:', error);
    return [];
  }
};

/**
 * Get my ad statistics (Vendor)
 */
export const getMyAdStats = async (): Promise<{
  stats: AdStats;
  performance: AdPerformance[];
}> => {
  try {
    const response = await axios.get(`${ADS_URL}/my-stats`, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && response.data.data) {
      return {
        stats: response.data.data.stats,
        performance: response.data.data.performance
      };
    }
    
    return {
      stats: {
        total_ads: 0,
        active_ads: 0,
        pending_ads: 0,
        rejected_ads: 0,
        expired_ads: 0,
        total_views: 0,
        total_clicks: 0
      },
      performance: []
    };
  } catch (error) {
    console.error('Error fetching ad stats:', error);
    return {
      stats: {
        total_ads: 0,
        active_ads: 0,
        pending_ads: 0,
        rejected_ads: 0,
        expired_ads: 0,
        total_views: 0,
        total_clicks: 0
      },
      performance: []
    };
  }
};

/**
 * Get advertisement by ID (Vendor - only own ads)
 */
export const getAdvertisementById = async (adId: number): Promise<Advertisement | null> => {
  try {
    const response = await axios.get(`${ADS_URL}/my-ads/${adId}`, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && response.data.data) {
      return mapAdvertisement(response.data.data);
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching ad:', error);
    return null;
  }
};

/**
 * Update advertisement (Vendor - only pending ads)
 */
export const updateAdvertisement = async (adId: number, data: UpdateAdRequest): Promise<{
  success: boolean;
  message: string;
  advertisement?: Advertisement;
}> => {
  try {
    const response = await axios.put(`${ADS_URL}/my-ads/${adId}`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update advertisement');
  }
};

/**
 * Delete advertisement (Vendor - only pending ads)
 */
export const deleteAdvertisement = async (adId: number): Promise<{
  success: boolean;
  message: string;
}> => {
  try {
    const response = await axios.delete(`${ADS_URL}/my-ads/${adId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete advertisement');
  }
};

// ============================================
// ADMIN ENDPOINTS
// ============================================

/**
 * Get pending advertisements (Admin)
 */
export const getPendingAdvertisements = async (): Promise<Advertisement[]> => {
  try {
    const response = await axios.get(`${ADS_URL}/pending`, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map(mapAdvertisement);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching pending ads:', error);
    return [];
  }
};

/**
 * Get all advertisements with filters (Admin)
 */
export const getAllAdvertisements = async (filters?: {
  status?: string;
  vendor_id?: number;
}): Promise<Advertisement[]> => {
  try {
    const response = await axios.get(`${ADS_URL}/all`, {
      params: filters,
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map(mapAdvertisement);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching all ads:', error);
    return [];
  }
};

/**
 * Approve advertisement (Admin)
 */
export const approveAdvertisement = async (adId: number): Promise<{
  success: boolean;
  message: string;
  advertisement?: Advertisement;
}> => {
  try {
    const response = await axios.put(`${ADS_URL}/${adId}/approve`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to approve advertisement');
  }
};

/**
 * Reject advertisement (Admin)
 */
export const rejectAdvertisement = async (adId: number, reason: string): Promise<{
  success: boolean;
  message: string;
  advertisement?: Advertisement;
}> => {
  try {
    const response = await axios.put(`${ADS_URL}/${adId}/reject`, { reason }, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to reject advertisement');
  }
};

/**
 * Get ad analytics (Admin)
 */
export const getAdAnalytics = async (): Promise<AdAnalytics> => {
  try {
    const response = await axios.get(`${ADS_URL}/analytics`, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return {
      summary: {
        total_ads: 0,
        active_ads: 0,
        pending_ads: 0,
        rejected_ads: 0,
        expired_ads: 0,
        total_views: 0,
        total_clicks: 0,
        total_budget: 0,
        avg_views_per_ad: 0,
        avg_clicks_per_ad: 0
      },
      top_ads: []
    };
  } catch (error) {
    console.error('Error fetching ad analytics:', error);
    return {
      summary: {
        total_ads: 0,
        active_ads: 0,
        pending_ads: 0,
        rejected_ads: 0,
        expired_ads: 0,
        total_views: 0,
        total_clicks: 0,
        total_budget: 0,
        avg_views_per_ad: 0,
        avg_clicks_per_ad: 0
      },
      top_ads: []
    };
  }
};

/**
 * Expire advertisements (Admin - cron job)
 */
export const expireAdvertisements = async (): Promise<{
  success: boolean;
  expiredCount: number;
}> => {
  try {
    const response = await axios.post(`${ADS_URL}/expire`, {}, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to expire advertisements');
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format ad type for display
 */
export const formatAdType = (type: string): string => {
  const types: Record<string, string> = {
    'banner': 'Banner Ad',
    'sponsored': 'Sponsored',
    'featured': 'Featured Listing',
    'popup': 'Popup Ad'
  };
  return types[type] || type;
};

/**
 * Format status for display
 */
export const formatAdStatus = (status: string): { label: string; color: string } => {
  const statuses: Record<string, { label: string; color: string }> = {
    'active': { label: 'Active', color: 'emerald' },
    'pending': { label: 'Pending', color: 'yellow' },
    'rejected': { label: 'Rejected', color: 'red' },
    'expired': { label: 'Expired', color: 'gray' },
    'approved': { label: 'Approved', color: 'blue' }
  };
  return statuses[status] || { label: status, color: 'gray' };
};

/**
 * Calculate CTR (Click Through Rate)
 */
export const calculateCTR = (views: number, clicks: number): number => {
  if (views === 0) return 0;
  return (clicks / views) * 100;
};

/**
 * Format budget
 */
export const formatBudget = (budget: number): string => {
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(budget);
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  // Public
  getActiveAdvertisements,
  trackAdView,
  trackAdClick,
  // Vendor
  submitAdvertisement,
  getMyAdvertisements,
  getMyAdStats,
  getAdvertisementById,
  updateAdvertisement,
  deleteAdvertisement,
  // Admin
  getPendingAdvertisements,
  getAllAdvertisements,
  approveAdvertisement,
  rejectAdvertisement,
  getAdAnalytics,
  expireAdvertisements,
  formatAdType,
  formatAdStatus,
  calculateCTR,
  formatBudget,
};