// src/services/vendorService.ts

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const VENDOR_URL = `${API_BASE_URL}/vendor`;

export interface Vendor {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  category?: string;

  // Backend fields
  role?: 'vendor' | 'admin';
  verified?: boolean;
  is_active?: boolean;
  created_at?: string;

  // Frontend-only fields
  status?: 'active' | 'inactive' | 'pending';
  rating?: number;
  joinDate?: string;
  totalProducts?: number;
}

/**
 * Convert backend vendor data to frontend Vendor format
 */
const mapVendor = (vendor: any): Vendor => {
  // Determine status based on is_active and verified
  let status: 'active' | 'inactive' | 'pending' = 'pending';
  if (vendor.is_active === true && vendor.verified === true) {
    status = 'active';
  } else if (vendor.is_active === false) {
    status = 'inactive';
  } else if (vendor.is_active === true && vendor.verified === false) {
    status = 'pending';
  }

  // Get category from either category_name (from join) or category field
  const category = vendor.category_name || vendor.category || '';

  return {
    id: vendor.id?.toString(),
    name: vendor.name,
    email: vendor.email,
    phone: vendor.phone || '',
    address: vendor.address || '',
    category: category,

    role: vendor.role,
    verified: vendor.verified,
    is_active: vendor.is_active,
    created_at: vendor.created_at,

    // frontend UI fields
    status: status,
    joinDate: vendor.created_at
      ? new Date(vendor.created_at).toISOString().split('T')[0]
      : '',
    rating: vendor.rating || 0,
    totalProducts: vendor.totalProducts || 0,
  };
};

/**
 * GET ALL VENDORS
 */
export const getVendors = async (): Promise<Vendor[]> => {
  try {
    const response = await axios.get(VENDOR_URL);
    
    // Check if response has the expected structure
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map(mapVendor);
    } else if (Array.isArray(response.data)) {
      // Fallback for direct array response
      return response.data.map(mapVendor);
    } else {
      console.error('Unexpected API response structure:', response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching vendors:', error);
    throw error;
  }
};

/**
 * GET VENDOR BY ID
 */
export const getVendorById = async (id: string): Promise<Vendor | null> => {
  try {
    const response = await axios.get(`${VENDOR_URL}/${id}`);
    
    if (response.data && response.data.success && response.data.data) {
      return mapVendor(response.data.data);
    }
    
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching vendor:', error);
    throw error;
  }
};

/**
 * CREATE VENDOR
 */
export const createVendor = async (vendor: Vendor): Promise<Vendor> => {
  const payload = {
    name: vendor.name,
    email: vendor.email,
    phone: vendor.phone,
    address: vendor.address,
    category: vendor.category,
  };

  const response = await axios.post(VENDOR_URL, payload);
  
  if (response.data && response.data.success && response.data.data) {
    return mapVendor(response.data.data);
  }
  
  throw new Error(response.data?.message || 'Failed to create vendor');
};

/**
 * UPDATE VENDOR
 */
export const updateVendor = async (id: string, vendor: Partial<Vendor>): Promise<Vendor> => {
  const payload: any = {
    name: vendor.name,
    phone: vendor.phone,
    address: vendor.address,
    category: vendor.category,
  };

  // Map status to backend fields
  if (vendor.status === 'active') {
    payload.verified = true;
    payload.is_active = true;
  } else if (vendor.status === 'inactive') {
    payload.is_active = false;
    payload.verified = false;
  } else if (vendor.status === 'pending') {
    payload.verified = false;
    payload.is_active = true;
  }

  const response = await axios.put(`${VENDOR_URL}/${id}`, payload);
  
  if (response.data && response.data.success && response.data.data) {
    return mapVendor(response.data.data);
  }
  
  throw new Error(response.data?.message || 'Failed to update vendor');
};

/**
 * DELETE VENDOR (SOFT DELETE)
 */
export const deleteVendor = async (id: string): Promise<void> => {
  const response = await axios.delete(`${VENDOR_URL}/${id}`);
  
  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to delete vendor');
  }
};

/**
 * GET VENDOR STATS (Admin only)
 */
export const getVendorStats = async (): Promise<{
  total_vendors: number;
  active_vendors: number;
  pending_vendors: number;
  inactive_vendors: number;
  total_submissions: number;
  total_approved: number;
}> => {
  const response = await axios.get(`${VENDOR_URL}/stats`, {
    headers: getAuthHeaders()
  });
  
  if (response.data && response.data.success && response.data.data) {
    return response.data.data;
  }
  
  return {
    total_vendors: 0,
    active_vendors: 0,
    pending_vendors: 0,
    inactive_vendors: 0,
    total_submissions: 0,
    total_approved: 0
  };
};

/**
 * Helper to get auth headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  getVendors,
  getVendorById,
  createVendor,
  updateVendor,
  deleteVendor,
  getVendorStats,
};