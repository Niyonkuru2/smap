// src/services/adminPriceService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const ADMIN_PRICES_URL = `${API_BASE_URL}/adminprices`;

// ============================================
// TYPES - Matches backend ProductService
// ============================================

export interface ReferencePrice {
  id: number;
  product_id: number;
  market_id: number;
  price: number;
  unit?: string;
  effective_date: string;
  expiry_date: string | null;
  notes: string | null;
  is_current: boolean;
  admin_id: number;
  created_at: string;
  updated_at: string;
}

export interface ReferencePriceWithDetails extends ReferencePrice {
  product_name?: string;
  product_unit?: string;
  market_name?: string;
}

export interface PriceComparison {
  product_id: number;
  product_name: string;
  product_unit: string;
  market_id: number;
  market_name: string;
  reference_price: number;
  current_market_price?: number;
  price_difference?: number;
  price_difference_percentage?: number;
}

export interface BulkImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data?: any;
  }>;
}

export interface ProductWithReferencePrice {
  id: number;
  name: string;
  category_id: number;
  category_name?: string;
  unit: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  reference_prices: ReferencePrice[];
}

export interface CreateProductWithReferencePriceData {
  // Product data
  name: string;
  category_id: number;
  unit: string;
  description?: string;
  image_url?: string;
  // Reference price data
  market_id: number;
  price: number;
  effective_date?: Date | string;
  expiry_date?: Date | string | null;
  notes?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Map backend reference price data to frontend format
 */
const mapReferencePrice = (price: any): ReferencePrice => {
  return {
    id: price.id,
    product_id: price.product_id,
    market_id: price.market_id,
    price: price.price,
    unit: price.unit,
    effective_date: price.effective_date,
    expiry_date: price.expiry_date || null,
    notes: price.notes || null,
    is_current: price.is_current,
    admin_id: price.admin_id,
    created_at: price.created_at,
    updated_at: price.updated_at
  };
};

const mapReferencePriceWithDetails = (price: any): ReferencePriceWithDetails => {
  return {
    ...mapReferencePrice(price),
    product_name: price.product_name,
    product_unit: price.product_unit,
    market_name: price.market_name
  };
};

// ============================================
// REFERENCE PRICE API
// ============================================

/**
 * Set a new reference price
 * Matches: adminReferencePriceService.setReferencePrice()
 */
export const setReferencePrice = async (data: {
  product_id: number;
  market_id: number;
  price: number;
  unit: string;
  effective_date?: Date | string;
  expiry_date?: Date | string | null;
  notes?: string;
  admin_id?: number;
}): Promise<ReferencePrice> => {
  const response = await axios.post(
    `${ADMIN_PRICES_URL}/reference-prices`,
    {
      product_id: data.product_id,
      market_id: data.market_id,
      price: data.price,
      unit: data.unit,
      effective_date: data.effective_date || new Date(),
      expiry_date: data.expiry_date || null,
      notes: data.notes || 'Initial reference price'
    },
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.data) {
    return mapReferencePrice(response.data.data);
  }
  
  throw new Error(response.data?.message || 'Failed to set reference price');
};

/**
 * Update an existing reference price
 */
export const updateReferencePrice = async (
  id: number,
  data: {
    price?: number;
    effective_date?: Date | string;
    expiry_date?: Date | string | null;
    notes?: string;
    is_current?: boolean;
  }
): Promise<ReferencePrice> => {
  const response = await axios.put(
    `${ADMIN_PRICES_URL}/reference-prices/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.data) {
    return mapReferencePrice(response.data.data);
  }
  
  throw new Error(response.data?.message || 'Failed to update reference price');
};

/**
 * Delete a reference price
 */
export const deleteReferencePrice = async (id: number): Promise<void> => {
  const response = await axios.delete(
    `${ADMIN_PRICES_URL}/reference-prices/${id}`,
    { headers: getAuthHeaders() }
  );
  
  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to delete reference price');
  }
};

/**
 * Get all reference prices with optional filters
 * Matches: adminReferencePriceService.getAllReferencePrices()
 */
export const getAllReferencePrices = async (filters?: {
  product_id?: number;
  market_id?: number;
  is_current?: boolean;
}): Promise<ReferencePriceWithDetails[]> => {
  try {
    const params: any = {};
    if (filters?.product_id) params.product_id = filters.product_id;
    if (filters?.market_id) params.market_id = filters.market_id;
    if (filters?.is_current !== undefined) params.is_current = filters.is_current;
    
    const response = await axios.get(`${ADMIN_PRICES_URL}/reference-prices`, { params });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map(mapReferencePriceWithDetails);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching reference prices:', error);
    throw error;
  }
};

/**
 * Get current reference price for a product and market
 * Matches: adminReferencePriceService.getCurrentReferencePrice()
 */
export const getCurrentReferencePrice = async (
  productId: number,
  marketId: number
): Promise<ReferencePrice | null> => {
  try {
    const response = await axios.get(
      `${ADMIN_PRICES_URL}/reference-prices/current`,
      {
        params: { product_id: productId, market_id: marketId }
      }
    );
    
    if (response.data && response.data.success && response.data.data) {
      return mapReferencePrice(response.data.data);
    }
    
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching current reference price:', error);
    throw error;
  }
};

// ============================================
// PRICE COMPARISON API
// ============================================

/**
 * Get price comparison between reference price and market price
 */
export const getPriceComparison = async (
  productId: number,
  marketId: number
): Promise<PriceComparison | null> => {
  try {
    const response = await axios.get(
      `${ADMIN_PRICES_URL}/comparison/${productId}/${marketId}`
    );
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching price comparison:', error);
    throw error;
  }
};

// ============================================
// BULK OPERATIONS API
// ============================================

/**
 * Bulk import reference prices from CSV/Excel
 */
export const bulkImportReferencePrices = async (
  file: File,
  options?: {
    overwrite_existing?: boolean;
    validate_only?: boolean;
  }
): Promise<BulkImportResult> => {
  const formData = new FormData();
  formData.append('file', file);
  
  if (options?.overwrite_existing !== undefined) {
    formData.append('overwrite_existing', String(options.overwrite_existing));
  }
  if (options?.validate_only !== undefined) {
    formData.append('validate_only', String(options.validate_only));
  }
  
  const response = await axios.post(
    `${ADMIN_PRICES_URL}/reference-prices/bulk-import`,
    formData,
    {
      headers: {
        ...getAuthHeaders(),
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  
  if (response.data && response.data.success) {
    return response.data.data;
  }
  
  throw new Error(response.data?.message || 'Failed to import reference prices');
};

// ============================================
// PRODUCT WITH REFERENCE PRICES API
// ============================================

/**
 * Get product with all its reference prices
 * Matches: ProductService.getProductWithReferencePrices()
 */
export const getProductWithReferencePrices = async (
  productId: number,
  marketId?: number | null
): Promise<ProductWithReferencePrice | null> => {
  try {
    const params: any = {};
    if (marketId) params.marketId = marketId;
    
    const response = await axios.get(
      `${ADMIN_PRICES_URL}/products/${productId}/reference`,
      { params }
    );
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching product with reference prices:', error);
    throw error;
  }
};

/**
 * Create product and set reference price in one operation
 * Matches: ProductService.createProductWithReferencePrice()
 */
export const createProductWithReferencePrice = async (
  data: CreateProductWithReferencePriceData
): Promise<{ product: any; reference_price: ReferencePrice }> => {
  const response = await axios.post(
    `${ADMIN_PRICES_URL}/products/with-reference`,
    data,
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.data) {
    return {
      product: response.data.data.product,
      reference_price: mapReferencePrice(response.data.data.reference_price)
    };
  }
  
  throw new Error(response.data?.message || 'Failed to create product with reference price');
};

// ============================================
// PRODUCT API (Additional)
// ============================================

/**
 * Get all products
 * Matches: ProductService.getAllProducts()
 */
export const getAllProducts = async (): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products`);
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

/**
 * Get product by ID
 * Matches: ProductService.getProductById()
 */
export const getProductById = async (id: number): Promise<any | null> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/${id}`);
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching product:', error);
    throw error;
  }
};

/**
 * Create product
 * Matches: ProductService.createProduct()
 */
export const createProduct = async (productData: {
  name: string;
  category_id: number;
  unit: string;
  description?: string;
  image_url?: string;
}): Promise<any> => {
  const response = await axios.post(
    `${API_BASE_URL}/products`,
    productData,
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.data) {
    return response.data.data;
  }
  
  throw new Error(response.data?.message || 'Failed to create product');
};

/**
 * Update product
 * Matches: ProductService.updateProduct()
 */
export const updateProduct = async (
  id: number,
  productData: {
    name?: string;
    category_id?: number;
    unit?: string;
    description?: string | null;
    image_url?: string | null;
  }
): Promise<any> => {
  const response = await axios.put(
    `${API_BASE_URL}/products/${id}`,
    productData,
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.data) {
    return response.data.data;
  }
  
  throw new Error(response.data?.message || 'Failed to update product');
};

/**
 * Delete product
 * Matches: ProductService.deleteProduct()
 */
export const deleteProduct = async (id: number): Promise<void> => {
  const response = await axios.delete(`${API_BASE_URL}/products/${id}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to delete product');
  }
};

/**
 * Get products by category
 * Matches: ProductService.getProductsByCategory()
 */
export const getProductsByCategory = async (categoryId: number): Promise<any[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/category/${categoryId}`);
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

/**
 * Search products
 * Matches: ProductService.searchProducts()
 */
export const searchProducts = async (
  searchTerm: string,
  categoryId?: number | null,
  limit: number = 20
): Promise<any[]> => {
  try {
    const params: any = { search: searchTerm, limit };
    if (categoryId) params.category_id = categoryId;
    
    const response = await axios.get(`${API_BASE_URL}/products/search`, { params });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

/**
 * Get product statistics
 * Matches: ProductService.getProductStats()
 */
export const getProductStats = async (): Promise<{
  total_products: number;
  total_categories: number;
  total_reference_prices: number;
}> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/products/stats`);
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return {
      total_products: 0,
      total_categories: 0,
      total_reference_prices: 0
    };
  } catch (error) {
    console.error('Error fetching product stats:', error);
    throw error;
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format price for display
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Check if reference price is currently valid (not expired)
 */
export const isReferencePriceValid = (price: ReferencePrice): boolean => {
  if (!price.is_current) return false;
  
  const now = new Date();
  const effectiveDate = new Date(price.effective_date);
  
  if (effectiveDate > now) return false;
  
  if (price.expiry_date) {
    const expiryDate = new Date(price.expiry_date);
    if (expiryDate < now) return false;
  }
  
  return true;
};

/**
 * Validate reference price data before submission
 */
export const validateReferencePrice = (data: {
  product_id?: number;
  market_id?: number;
  price?: number;
  unit?: string;
  effective_date?: string;
  expiry_date?: string | null;
}): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.product_id || data.product_id <= 0) {
    errors.push('Product is required');
  }
  
  if (!data.market_id || data.market_id <= 0) {
    errors.push('Market is required');
  }
  
  if (!data.price || data.price <= 0) {
    errors.push('Price must be greater than 0');
  }
  
  if (!data.unit) {
    errors.push('Unit is required');
  }
  
  if (data.effective_date) {
    const fromDate = new Date(data.effective_date);
    if (isNaN(fromDate.getTime())) {
      errors.push('Invalid effective date');
    }
  }
  
  if (data.expiry_date) {
    const toDate = new Date(data.expiry_date);
    if (isNaN(toDate.getTime())) {
      errors.push('Invalid expiry date');
    }
    
    if (data.effective_date && toDate <= new Date(data.effective_date)) {
      errors.push('Expiry date must be after effective date');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  // Reference price management
  setReferencePrice,
  updateReferencePrice,
  deleteReferencePrice,
  getAllReferencePrices,
  getCurrentReferencePrice,
  
  // Price comparison
  getPriceComparison,
  
  // Bulk operations
  bulkImportReferencePrices,
  
  // Product with reference prices
  getProductWithReferencePrices,
  createProductWithReferencePrice,
  
  // Product management
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts,
  getProductStats,
  
  // Utilities
  formatPrice,
  isReferencePriceValid,
  validateReferencePrice,
};