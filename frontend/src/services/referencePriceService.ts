import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const REFERENCE_PRICE_URL = `${API_BASE_URL}/reference-prices`;
export interface ReferencePrice {
  id?: number;
  product_id: number;
  market_id: string;
  price: number;
  unit: string;
  effective_date: string;
  expiry_date?: string | null;
  notes?: string | null;
  is_current?: boolean;
  set_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ReferencePriceWithDetails extends ReferencePrice {
  product_name?: string;
  product_unit?: string;
  product_description?: string;
  market_name?: string;
  province?: string;
  district?: string;
  set_by_name?: string;
}

export interface ProductWithReferencePrice {
  product_id: number;
  product_name: string;
  product_unit: string;
  description?: string;
  image_url?: string;
  category_id?: number;
  category_name?: string;
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

export interface CreateProductWithPriceRequest {
  product_name: string;
  product_unit: string;
  product_description?: string;
  category_id?: number;
  product_image_url?: string;
  market_id: string;
  reference_price: number;
  price_unit?: string;
  effective_date?: string;
  expiry_date?: string;
  notes?: string;
}

export interface SetReferencePriceRequest {
  product_id: number;
  market_id: string;
  price: number;
  unit?: string;
  effective_date?: string;
  expiry_date?: string;
  notes?: string;
}

export interface BulkSetReferencePriceRequest {
  prices: {
    product_id: number;
    market_id: string;
    price: number;
    unit?: string;
    effective_date?: string;
    expiry_date?: string;
    notes?: string;
  }[];
}

export interface ReferencePriceFilters {
  product_id?: number;
  market_id?: string;
  is_current?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReferencePriceStatistics {
  summary: {
    total_products_with_prices: number;
    total_markets_with_prices: number;
    total_reference_prices: number;
    current_reference_prices: number;
    expired_prices: number;
    future_prices: number;
    average_price: number;
    min_price: number;
    max_price: number;
  };
  top_products: {
    product_name: string;
    price_count: number;
    market_count: number;
    avg_price: number;
  }[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get auth headers with token
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (date?: string | Date): string => {
  if (!date) return new Date().toISOString().split('T')[0];
  if (typeof date === 'string') return date.split('T')[0];
  return date.toISOString().split('T')[0];
};

/**
 * Map reference price from API response
 */
const mapReferencePrice = (price: any): ReferencePriceWithDetails => {
  return {
    id: price.id,
    product_id: price.product_id,
    product_name: price.product_name,
    product_unit: price.product_unit,
    product_description: price.product_description,
    market_id: price.market_id,
    market_name: price.market_name,
    province: price.province,
    district: price.district,
    price: parseFloat(price.price),
    unit: price.unit,
    effective_date: price.effective_date,
    expiry_date: price.expiry_date,
    notes: price.notes,
    is_current: price.is_current,
    set_by: price.set_by,
    set_by_name: price.set_by_name,
    created_at: price.created_at,
    updated_at: price.updated_at,
  };
};

/**
 * Map product with reference prices
 */
const mapProductWithPrices = (product: any): ProductWithReferencePrice => {
  return {
    product_id: product.id,
    product_name: product.name,
    product_unit: product.unit,
    description: product.description,
    image_url: product.image_url,
    category_id: product.category_id,
    category_name: product.category_name,
    reference_prices: (product.reference_prices || []).map((rp: any) => ({
      market_id: rp.market_id,
      market_name: rp.market_name,
      province: rp.province,
      district: rp.district,
      reference_price: parseFloat(rp.reference_price),
      reference_price_id: rp.reference_price_id,
      effective_date: rp.effective_date,
      expiry_date: rp.expiry_date,
      is_current: rp.is_current,
    })),
  };
};

// ============================================
// API FUNCTIONS
// ============================================

/**
 * CREATE PRODUCT WITH REFERENCE PRICE
 * Creates a new product and sets its reference price in one operation
 */
export const createProductWithReferencePrice = async (
  data: CreateProductWithPriceRequest
): Promise<ReferencePriceWithDetails> => {
  try {
    const response = await axios.post(
      `${REFERENCE_PRICE_URL}/products-with-price`,
      {
        ...data,
        effective_date: data.effective_date || formatDate(),
      },
      { headers: getAuthHeaders() }
    );

    if (response.data && response.data.success && response.data.data) {
      return mapReferencePrice(response.data.data);
    }

    throw new Error(response.data?.message || 'Failed to create product with reference price');
  } catch (error: any) {
    console.error('Error creating product with reference price:', error);
    throw error.response?.data || error;
  }
};

/**
 * SET REFERENCE PRICE FOR EXISTING PRODUCT
 */
export const setReferencePrice = async (
  data: SetReferencePriceRequest
): Promise<ReferencePriceWithDetails> => {
  try {
    const response = await axios.post(
      `${REFERENCE_PRICE_URL}/reference-prices`,
      {
        ...data,
        effective_date: data.effective_date || formatDate(),
      },
      { headers: getAuthHeaders() }
    );

    if (response.data && response.data.success && response.data.data) {
      return {
        id: response.data.data.id,
        product_id: response.data.data.product_id,
        product_name: response.data.data.product_name,
        market_id: response.data.data.market_id,
        market_name: response.data.data.market_name,
        price: parseFloat(response.data.data.price),
        unit: response.data.data.unit,
        effective_date: response.data.data.effective_date,
        expiry_date: response.data.data.expiry_date,
        set_by: response.data.data.set_by,
        created_at: response.data.data.created_at,
      };
    }

    throw new Error(response.data?.message || 'Failed to set reference price');
  } catch (error: any) {
    console.error('Error setting reference price:', error);
    throw error.response?.data || error;
  }
};

/**
 * GET REFERENCE PRICES (with filters and pagination)
 */
export const getReferencePrices = async (
  filters?: ReferencePriceFilters
): Promise<PaginatedResponse<ReferencePriceWithDetails>> => {
  try {
    const params = new URLSearchParams();
    
    if (filters?.product_id) params.append('product_id', filters.product_id.toString());
    if (filters?.market_id) params.append('market_id', filters.market_id);
    if (filters?.is_current !== undefined) params.append('is_current', filters.is_current.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = `${REFERENCE_PRICE_URL}/reference-prices${params.toString() ? `?${params}` : ''}`;
    const response = await axios.get(url, { headers: getAuthHeaders() });

    if (response.data && response.data.success) {
      return {
        success: true,
        data: (response.data.data || []).map(mapReferencePrice),
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
    console.error('Error fetching reference prices:', error);
    throw error.response?.data || error;
  }
};

/**
 * GET REFERENCE PRICE BY ID
 */
export const getReferencePriceById = async (id: number): Promise<ReferencePriceWithDetails> => {
  try {
    const response = await axios.get(`${REFERENCE_PRICE_URL}/reference-prices/${id}`, {
      headers: getAuthHeaders(),
    });

    if (response.data && response.data.success && response.data.data) {
      return mapReferencePrice(response.data.data);
    }

    throw new Error('Reference price not found');
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error('Reference price not found');
    }
    console.error('Error fetching reference price:', error);
    throw error.response?.data || error;
  }
};

/**
 * UPDATE REFERENCE PRICE
 */
export const updateReferencePrice = async (
  id: number,
  data: Partial<ReferencePrice>
): Promise<ReferencePriceWithDetails> => {
  try {
    const response = await axios.put(
      `${REFERENCE_PRICE_URL}/reference-prices/${id}`,
      data,
      { headers: getAuthHeaders() }
    );

    if (response.data && response.data.success && response.data.data) {
      return mapReferencePrice(response.data.data);
    }

    throw new Error(response.data?.message || 'Failed to update reference price');
  } catch (error: any) {
    console.error('Error updating reference price:', error);
    throw error.response?.data || error;
  }
};

/**
 * DELETE REFERENCE PRICE
 */
export const deleteReferencePrice = async (id: number): Promise<void> => {
  try {
    const response = await axios.delete(`${REFERENCE_PRICE_URL}/reference-prices/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Failed to delete reference price');
    }
  } catch (error: any) {
    console.error('Error deleting reference price:', error);
    throw error.response?.data || error;
  }
};

/**
 * BULK SET REFERENCE PRICES
 */
export const bulkSetReferencePrices = async (
  prices: BulkSetReferencePriceRequest['prices']
): Promise<{
  successful: { product_id: number; market_id: string; reference_price_id: number; status: string }[];
  errors: { item: any; error: string }[];
}> => {
  try {
    const response = await axios.post(
      `${REFERENCE_PRICE_URL}/reference-prices/bulk`,
      { prices },
      { headers: getAuthHeaders() }
    );

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data?.message || 'Failed to bulk set reference prices');
  } catch (error: any) {
    console.error('Error bulk setting reference prices:', error);
    throw error.response?.data || error;
  }
};

/**
 * GET PRODUCTS WITH THEIR REFERENCE PRICES
 */
export const getProductsWithPrices = async (filters?: {
  market_id?: string;
  category_id?: number;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<ProductWithReferencePrice>> => {
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
        data: (response.data.data || []).map(mapProductWithPrices),
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
    throw error.response?.data || error;
  }
};

/**
 * GET REFERENCE PRICE STATISTICS
 */
export const getReferencePriceStatistics = async (): Promise<ReferencePriceStatistics> => {
  try {
    const response = await axios.get(`${REFERENCE_PRICE_URL}/reference-prices/statistics/summary`, {
      headers: getAuthHeaders(),
    });

    if (response.data && response.data.success && response.data.data) {
      return {
        summary: {
          total_products_with_prices: response.data.data.summary.total_products_with_prices || 0,
          total_markets_with_prices: response.data.data.summary.total_markets_with_prices || 0,
          total_reference_prices: response.data.data.summary.total_reference_prices || 0,
          current_reference_prices: response.data.data.summary.current_reference_prices || 0,
          expired_prices: response.data.data.summary.expired_prices || 0,
          future_prices: response.data.data.summary.future_prices || 0,
          average_price: parseFloat(response.data.data.summary.average_price) || 0,
          min_price: parseFloat(response.data.data.summary.min_price) || 0,
          max_price: parseFloat(response.data.data.summary.max_price) || 0,
        },
        top_products: (response.data.data.top_products || []).map((tp: any) => ({
          product_name: tp.product_name,
          price_count: tp.price_count,
          market_count: tp.market_count,
          avg_price: parseFloat(tp.avg_price) || 0,
        })),
      };
    }

    return {
      summary: {
        total_products_with_prices: 0,
        total_markets_with_prices: 0,
        total_reference_prices: 0,
        current_reference_prices: 0,
        expired_prices: 0,
        future_prices: 0,
        average_price: 0,
        min_price: 0,
        max_price: 0,
      },
      top_products: [],
    };
  } catch (error: any) {
    console.error('Error fetching reference price statistics:', error);
    throw error.response?.data || error;
  }
};

// ============================================
// HOOKS FOR REACT COMPONENTS (Optional)
// ============================================

/**
 * React Query hooks example (if using react-query)
 */
export const referencePriceHooks = {
  useReferencePrices: (filters?: ReferencePriceFilters) => {
    // This would be implemented with react-query
    // Example: return useQuery(['reference-prices', filters], () => getReferencePrices(filters));
    return { data: null, isLoading: false, error: null };
  },
  
  useReferencePrice: (id: number) => {
    // Example: return useQuery(['reference-price', id], () => getReferencePriceById(id));
    return { data: null, isLoading: false, error: null };
  },
  
  useProductsWithPrices: (filters?: any) => {
    // Example: return useQuery(['products-with-prices', filters], () => getProductsWithPrices(filters));
    return { data: null, isLoading: false, error: null };
  },
};

// ============================================
// DEFAULT EXPORT (matching vendor service pattern)
// ============================================
export default {
  createProductWithReferencePrice,
  setReferencePrice,
  getReferencePrices,
  getReferencePriceById,
  updateReferencePrice,
  deleteReferencePrice,
  bulkSetReferencePrices,
  getProductsWithPrices,
  getReferencePriceStatistics,
};