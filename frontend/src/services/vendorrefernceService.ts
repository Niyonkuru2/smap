// services/vendorReferencePriceService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const REFERENCE_PRICE_URL = `${API_BASE_URL}/vendor-prices`;

export interface ProductWithReferencePrice {
  id: number;
  name: string;
  unit: string;
  description: string | null;
  image_url: string | null;
  category_id: number | null;
  category_name: string | null;
  reference_prices: {
    market_id: string;
    market_name: string;
    province: string;
    district: string;
    reference_price: number;
    reference_price_id: number;
    effective_date: string;
    expiry_date: string | null;
    is_current: boolean;
  }[];
}

export interface ProductsResponse {
  success: boolean;
  data: ProductWithReferencePrice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get auth headers with token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * GET PRODUCTS WITH THEIR REFERENCE PRICES (Vendor accessible)
 */
export const getProductsWithPrices = async (filters?: {
  market_id?: string;
  category_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ProductsResponse> => {
  try {
    const params = new URLSearchParams();
    
    if (filters?.market_id) params.append('market_id', filters.market_id);
    if (filters?.category_id) params.append('category_id', filters.category_id.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = `${REFERENCE_PRICE_URL}/products-with-prices${params.toString() ? `?${params}` : ''}`;
    const response = await axios.get(url, { headers: getAuthHeaders() });

    if (response.data && response.data.success) {
      return {
        success: true,
        data: response.data.data || [],
        pagination: response.data.pagination || {
          page: filters?.page || 1,
          limit: filters?.limit || 20,
          total: 0,
          totalPages: 0,
        },
      };
    }

    return {
      success: false,
      data: [],
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        total: 0,
        totalPages: 0,
      },
    };
  } catch (error: any) {
    console.error('Error fetching products with prices:', error);
    return {
      success: false,
      data: [],
      pagination: {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        total: 0,
        totalPages: 0,
      },
    };
  }
};

export default {
  getProductsWithPrices,
};