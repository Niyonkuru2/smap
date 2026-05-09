// src/services/businessService.ts

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const BUSINESS_URL = `${API_BASE_URL}/businesses`;

// ============================================
// TYPES
// ============================================

export interface BusinessUser {
  id: string;
  businessId: number;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
  businessType: string;
  category: string;
  registrationNumber: string;
  taxId: string;
  tier: 'basic' | 'premium' | 'enterprise';
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  totalPurchases: number;
  totalSpent: number;
  rating: number;
  joinDate: string;
  is_active: boolean;
}

export interface BusinessStats {
  total_businesses: number;
  active_count: number;
  pending_count: number;
  inactive_count: number;
  suspended_count: number;
  premium_count: number;
  enterprise_count: number;
  total_revenue: number;
}

export interface BusinessMarket {
  id: string;
  name: string;
  province: string;
  district: string;
}

export interface CreateBusinessRequest {
  businessName: string;
  ownerName: string;
  email: string;
  phone?: string;
  address?: string;
  businessType?: string;
  registrationNumber?: string;
  taxId?: string;
  tier?: 'basic' | 'premium' | 'enterprise';
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  category?: string;
}

export interface UpdateBusinessRequest {
  businessName?: string;
  ownerName?: string;
  phone?: string;
  address?: string;
  businessType?: string;
  registrationNumber?: string;
  taxId?: string;
  tier?: 'basic' | 'premium' | 'enterprise';
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  category?: string;
  is_active?: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Map backend business data to frontend BusinessUser format
 */
const mapBusiness = (business: any): BusinessUser => {
  return {
    id: business.id?.toString(),
    businessId: business.businessId,
    businessName: business.businessName,
    ownerName: business.ownerName,
    email: business.email,
    phone: business.phone || '',
    address: business.address || '',
    businessType: business.businessType || '',
    category: business.category || '',
    registrationNumber: business.registrationNumber || '',
    taxId: business.taxId || '',
    tier: business.tier || 'basic',
    status: business.status || 'pending',
    totalPurchases: business.totalPurchases || 0,
    totalSpent: business.totalSpent || 0,
    rating: business.rating || 0,
    joinDate: business.joinDate || '',
    is_active: business.is_active
  };
};

// ============================================
// BUSINESS API
// ============================================

/**
 * Create a new business user (Admin only)
 */
export const createBusiness = async (data: CreateBusinessRequest): Promise<BusinessUser> => {
  const response = await axios.post(
    BUSINESS_URL,
    data,
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.data) {
    return mapBusiness(response.data.data);
  }
  
  throw new Error(response.data?.message || 'Failed to create business user');
};

/**
 * Get all business users (Admin only)
 */
export const getAllBusinesses = async (): Promise<BusinessUser[]> => {
  try {
    const response = await axios.get(BUSINESS_URL, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map(mapBusiness);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching businesses:', error);
    throw error;
  }
};

/**
 * Get business by ID (Admin only)
 */
export const getBusinessById = async (id: string): Promise<BusinessUser | null> => {
  try {
    const response = await axios.get(`${BUSINESS_URL}/${id}`, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && response.data.data) {
      return mapBusiness(response.data.data);
    }
    
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching business:', error);
    throw error;
  }
};

/**
 * Update business user (Admin only)
 */
export const updateBusiness = async (id: string, data: UpdateBusinessRequest): Promise<BusinessUser> => {
  const response = await axios.put(
    `${BUSINESS_URL}/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.data) {
    return mapBusiness(response.data.data);
  }
  
  throw new Error(response.data?.message || 'Failed to update business user');
};

/**
 * Delete business user (soft delete - Admin only)
 */
export const deleteBusiness = async (id: string): Promise<void> => {
  const response = await axios.delete(`${BUSINESS_URL}/${id}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to delete business user');
  }
};

/**
 * Get business statistics (Admin only)
 */
export const getBusinessStats = async (): Promise<BusinessStats> => {
  const response = await axios.get(`${BUSINESS_URL}/stats`, {
    headers: getAuthHeaders()
  });
  
  if (response.data && response.data.success && response.data.data) {
    return response.data.data;
  }
  
  return {
    total_businesses: 0,
    active_count: 0,
    pending_count: 0,
    inactive_count: 0,
    suspended_count: 0,
    premium_count: 0,
    enterprise_count: 0,
    total_revenue: 0
  };
};

/**
 * Get business markets (Admin only)
 */
export const getBusinessMarkets = async (id: string): Promise<BusinessMarket[]> => {
  try {
    const response = await axios.get(`${BUSINESS_URL}/${id}/markets`, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching business markets:', error);
    throw error;
  }
};

/**
 * Add market to business (Admin only)
 */
export const addBusinessMarket = async (id: string, marketId: string): Promise<any> => {
  const response = await axios.post(
    `${BUSINESS_URL}/${id}/markets/${marketId}`,
    {},
    { headers: getAuthHeaders() }
  );
  
  return response.data;
};

/**
 * Remove market from business (Admin only)
 */
export const removeBusinessMarket = async (id: string, marketId: string): Promise<any> => {
  const response = await axios.delete(`${BUSINESS_URL}/${id}/markets/${marketId}`, {
    headers: getAuthHeaders()
  });
  
  return response.data;
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('rw-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Get status badge color for business
 */
export const getBusinessStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'inactive':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    case 'suspended':
      return 'bg-red-500/20 text-red-400 border-red-500/30';
    default:
      return 'bg-primary/20 text-primary border-primary/30';
  }
};

/**
 * Get tier badge color
 */
export const getTierColor = (tier: string): string => {
  switch (tier) {
    case 'basic':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    case 'premium':
      return 'bg-primary/20 text-primary border-primary/30';
    case 'enterprise':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default:
      return 'bg-primary/20 text-primary border-primary/30';
  }
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  createBusiness,
  getAllBusinesses,
  getBusinessById,
  updateBusiness,
  deleteBusiness,
  getBusinessStats,
  getBusinessMarkets,
  addBusinessMarket,
  removeBusinessMarket,
  formatCurrency,
  getBusinessStatusColor,
  getTierColor
};