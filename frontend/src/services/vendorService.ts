// src/services/vendorService.ts

import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
 * Convert backend vendor data
 * to frontend Vendor format
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

  return {
    id: vendor.id?.toString(),
    name: vendor.name,
    email: vendor.email,
    phone: vendor.phone || '',
    address: vendor.address || '',
    category: vendor.category || '',

    role: vendor.role,
    verified: vendor.verified,
    is_active: vendor.is_active,
    created_at: vendor.created_at,

    // frontend UI fields
    status: status,
    joinDate: vendor.created_at
      ? new Date(vendor.created_at).toISOString().split('T')[0]
      : '',
    rating: 0,
    totalProducts: 0,
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
export const getVendorById = async (id: string): Promise<Vendor> => {
  const response = await axios.get(`${VENDOR_URL}/${id}`);
  
  if (response.data && response.data.success && response.data.data) {
    return mapVendor(response.data.data);
  }
  
  return mapVendor(response.data);
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
  
  return mapVendor(response.data);
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
  
  return mapVendor(response.data);
};

/**
 * DELETE VENDOR (SOFT DELETE)
 */
export const deleteVendor = async (id: string) => {
  const response = await axios.delete(`${VENDOR_URL}/${id}`);
  return response.data;
};