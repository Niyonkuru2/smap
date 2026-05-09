import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const CATEGORY_URL = `${API_BASE_URL}/categories`;

// ============================================
// TYPES
// ============================================

export interface Category {
  id: number;
  name: string;
  description: string | null;
  type: 'product' | 'vendor' | 'business' | 'all';
  parent_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}

export interface Product {
  id: number;
  name: string;
  unit: string;
  description: string | null;
  image_url: string | null;
  created_at: string;
}

export interface BusinessCategory {
  id: number;
  business_name: string;
  owner_name: string;
  registration_number: string;
  tier: string;
  status: string;
  rating: number;
  email: string;
  phone: string;
}

export interface CategoryProductsResponse {
  success: boolean;
  message: string;
  category: {
    id: number;
    name: string;
  };
  data: Product[];
}

export interface CategoryBusinessesResponse {
  success: boolean;
  message: string;
  category: {
    id: number;
    name: string;
  };
  data: BusinessCategory[];
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Map backend category data to frontend format
 */
const mapCategory = (category: any): Category => {
  return {
    id: category.id,
    name: category.name,
    description: category.description || null,
    type: category.type,
    parent_id: category.parent_id,
    is_active: category.is_active,
    created_at: category.created_at,
    updated_at: category.updated_at
  };
};

// ============================================
// CATEGORY API
// ============================================

/**
 * Get all categories
 * @param type - Filter by category type ('product', 'business', 'vendor', 'all')
 */
export const getAllCategories = async (type?: string): Promise<Category[]> => {
  try {
    const params: any = {};
    if (type && ['product', 'business', 'vendor', 'all'].includes(type)) {
      params.type = type;
    }
    
    const response = await axios.get(CATEGORY_URL, { params });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data.map(mapCategory);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Get category by ID
 */
export const getCategoryById = async (id: number): Promise<Category | null> => {
  try {
    const response = await axios.get(`${CATEGORY_URL}/${id}`);
    
    if (response.data && response.data.success && response.data.data) {
      return mapCategory(response.data.data);
    }
    
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching category:', error);
    throw error;
  }
};

/**
 * Get category tree (hierarchical structure)
 * @param type - Filter by category type ('product', 'business', 'vendor', 'all')
 */
export const getCategoryTree = async (type?: string): Promise<CategoryWithChildren[]> => {
  try {
    const params: any = {};
    if (type && ['product', 'business', 'vendor', 'all'].includes(type)) {
      params.type = type;
    }
    
    const response = await axios.get(`${CATEGORY_URL}/tree`, { params });
    
    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching category tree:', error);
    throw error;
  }
};

/**
 * Get products under a category
 */
export const getProductsByCategory = async (categoryId: number): Promise<CategoryProductsResponse | null> => {
  try {
    const response = await axios.get(`${CATEGORY_URL}/${categoryId}/products`);
    
    if (response.data && response.data.success) {
      return response.data;
    }
    
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching products by category:', error);
    throw error;
  }
};

/**
 * Get businesses under a category
 */
export const getBusinessesByCategory = async (categoryId: number): Promise<CategoryBusinessesResponse | null> => {
  try {
    const response = await axios.get(`${CATEGORY_URL}/${categoryId}/businesses`);
    
    if (response.data && response.data.success) {
      return response.data;
    }
    
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching businesses by category:', error);
    throw error;
  }
};

// ============================================
// ADMIN CATEGORY API (requires authentication)
// ============================================

/**
 * Create new category (Admin only)
 */
export const createCategory = async (data: {
  name: string;
  description?: string;
  type?: 'product' | 'vendor' | 'business' | 'all';
  parent_id?: number | null;
}): Promise<Category> => {
  const response = await axios.post(
    CATEGORY_URL,
    {
      name: data.name,
      description: data.description || null,
      type: data.type || 'product',
      parent_id: data.parent_id || null
    },
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.data) {
    return mapCategory(response.data.data);
  }
  
  throw new Error(response.data?.message || 'Failed to create category');
};

/**
 * Update category (Admin only)
 */
export const updateCategory = async (
  id: number,
  data: {
    name?: string;
    description?: string | null;
    type?: 'product' | 'vendor' | 'business' | 'all';
    parent_id?: number | null;
    is_active?: boolean;
  }
): Promise<Category> => {
  const response = await axios.put(
    `${CATEGORY_URL}/${id}`,
    data,
    { headers: getAuthHeaders() }
  );
  
  if (response.data && response.data.success && response.data.data) {
    return mapCategory(response.data.data);
  }
  
  throw new Error(response.data?.message || 'Failed to update category');
};

/**
 * Delete category (soft delete - Admin only)
 */
export const deleteCategory = async (id: number): Promise<void> => {
  const response = await axios.delete(`${CATEGORY_URL}/${id}`, {
    headers: getAuthHeaders()
  });
  
  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Failed to delete category');
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get categories by type
 */
export const getCategoriesByType = async (type: 'product' | 'business' | 'vendor'): Promise<Category[]> => {
  return getAllCategories(type);
};

/**
 * Get product categories
 */
export const getProductCategories = async (): Promise<Category[]> => {
  return getAllCategories('product');
};

/**
 * Get business categories
 */
export const getBusinessCategories = async (): Promise<Category[]> => {
  return getAllCategories('business');
};

/**
 * Format category name for display
 */
export const formatCategoryName = (name: string): string => {
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/**
 * Get category color based on type
 */
export const getCategoryColor = (type: string): string => {
  switch (type) {
    case 'product':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'business':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'vendor':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

/**
 * Get category icon name
 */
export const getCategoryIcon = (type: string): string => {
  switch (type) {
    case 'product':
      return 'Package';
    case 'business':
      return 'Building2';
    case 'vendor':
      return 'Store';
    default:
      return 'Tag';
  }
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  // Public
  getAllCategories,
  getCategoryById,
  getCategoryTree,
  getProductsByCategory,
  getBusinessesByCategory,
  // Admin
  createCategory,
  updateCategory,
  deleteCategory,
  // Utilities
  getCategoriesByType,
  getProductCategories,
  getBusinessCategories,
  formatCategoryName,
  getCategoryColor,
  getCategoryIcon
};