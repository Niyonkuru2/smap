import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const MARKETS_URL = `${API_BASE_URL}/markets`;

export interface Market {
  id: string;
  name: string;
  province: string;
  district: string;
  latitude: string | null;
  longitude: string | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface MarketPrice {
  product_id: number;
  product_name: string;
  price: number;
  unit: string;
  market_id: string;
  market_name: string;
  last_updated: string;
}

export interface ProductPriceComparison {
  market_id: string;
  market_name: string;
  price: number;
  unit: string;
  difference_from_avg: number;
}

export interface CheapestMarket {
  market_id: string;
  market_name: string;
  price: number;
  unit: string;
  province: string;
  district: string;
}

export interface CreateMarketRequest {
  id: string;
  name: string;
  province: string;
  district: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateMarketRequest {
  name?: string;
  province?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
}

export interface MarketStats {
  total_markets: number;
  total_provinces: number;
  total_districts: number;
  provinces: string[];
  districts: string[];
  markets_by_province: Array<{
    province: string;
    markets: Array<{ id: string; name: string; district: string }>;
  }>;
}

export interface BulkCreateMarketRequest {
  markets: CreateMarketRequest[];
}

export interface BulkCreateMarketResponse {
  successful: Market[];
  failed: Array<{ market: CreateMarketRequest; error: string }>;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Map market from API response
 */
const mapMarket = (market: any): Market => {
  return {
    id: market.id,
    name: market.name,
    province: market.province,
    district: market.district,
    latitude: market.latitude,
    longitude: market.longitude,
    is_active: market.is_active !== undefined ? market.is_active : true,
    created_at: market.created_at,
    updated_at: market.updated_at,
  };
};


export const getMarkets = async (): Promise<Market[]> => {
  try {
    const response = await axios.get(MARKETS_URL);
    
    if (response.data && response.data.success) {
      if (Array.isArray(response.data.markets)) {
        return response.data.markets.map(mapMarket);
      } else if (Array.isArray(response.data.data)) {
        return response.data.data.map(mapMarket);
      }
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching markets:', error);
    throw error;
  }
};

/**
 * Get market by ID
 */
export const getMarketById = async (id: string): Promise<Market | null> => {
  try {
    const response = await axios.get(`${MARKETS_URL}/${id}`);
    
    if (response.data && response.data.success && response.data.market) {
      return mapMarket(response.data.market);
    }
    
    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching market:', error);
    throw error;
  }
};

/**
 * Get markets info (from price simulator)
 */
export const getMarketsInfo = async (): Promise<{
  name: string;
  province: string;
  price_factor: number;
  price_level: string;
}[]> => {
  try {
    const response = await axios.get(`${MARKETS_URL}/info`);
    
    if (response.data && response.data.success && Array.isArray(response.data.markets)) {
      return response.data.markets;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching markets info:', error);
    return [];
  }
};

/**
 * Search markets by name, district, or province
 */
export const searchMarkets = async (query: string): Promise<Market[]> => {
  try {
    const response = await axios.get(`${MARKETS_URL}/search`, {
      params: { q: query }
    });
    
    if (response.data && response.data.success && Array.isArray(response.data.results)) {
      return response.data.results.map(mapMarket);
    }
    
    return [];
  } catch (error) {
    console.error('Error searching markets:', error);
    return [];
  }
};

/**
 * Get markets by province
 */
export const getMarketsByProvince = async (province: string): Promise<Market[]> => {
  try {
    const response = await axios.get(`${MARKETS_URL}/province/${encodeURIComponent(province)}`);
    
    if (response.data && response.data.success && Array.isArray(response.data.markets)) {
      return response.data.markets.map(mapMarket);
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching markets by province:', error);
    return [];
  }
};

/**
 * Get market prices
 */
export const getMarketPrices = async (marketId: string): Promise<MarketPrice[]> => {
  try {
    const response = await axios.get(`${MARKETS_URL}/${marketId}/prices`);
    
    if (response.data && response.data.success && Array.isArray(response.data.prices)) {
      return response.data.prices;
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching market prices:', error);
    return [];
  }
};

/**
 * Compare product prices across markets
 */
export const compareProductPrices = async (productName: string): Promise<{
  comparison: ProductPriceComparison[];
  cheapest_markets: CheapestMarket[];
}> => {
  try {
    const response = await axios.get(`${MARKETS_URL}/compare/${encodeURIComponent(productName)}`);
    
    if (response.data && response.data.success) {
      return {
        comparison: response.data.comparison || [],
        cheapest_markets: response.data.cheapest_markets || []
      };
    }
    
    return { comparison: [], cheapest_markets: [] };
  } catch (error) {
    console.error('Error comparing product prices:', error);
    return { comparison: [], cheapest_markets: [] };
  }
};

/**
 * Get live prices (simulated)
 */
export const getLivePrices = async (): Promise<{
  prices: any[];
  source: string;
  updated: string;
}> => {
  try {
    const response = await axios.get(`${MARKETS_URL}/prices/live`);
    
    if (response.data && response.data.success) {
      return {
        prices: response.data.prices || [],
        source: response.data.source || 'Rwanda Market Price Network',
        updated: response.data.updated || new Date().toISOString()
      };
    }
    
    return { prices: [], source: '', updated: '' };
  } catch (error) {
    console.error('Error fetching live prices:', error);
    return { prices: [], source: '', updated: '' };
  }
};

// ============================================
// ADMIN ENDPOINTS (Require authentication + admin role)
// ============================================

/**
 * Create a new market (Admin only)
 */
export const createMarket = async (marketData: CreateMarketRequest): Promise<Market> => {
  try {
    const response = await axios.post(MARKETS_URL, marketData, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && response.data.data) {
      return mapMarket(response.data.data);
    }
    
    throw new Error(response.data?.message || 'Failed to create market');
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to create market');
  }
};

/**
 * Update a market (Admin only)
 */
export const updateMarket = async (id: string, marketData: UpdateMarketRequest): Promise<Market> => {
  try {
    const response = await axios.put(`${MARKETS_URL}/${id}`, marketData, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && response.data.data) {
      return mapMarket(response.data.data);
    }
    
    throw new Error(response.data?.message || 'Failed to update market');
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to update market');
  }
};

/**
 * Delete a market (Admin only)
 * @param permanent - If true, permanently delete; if false, soft delete
 */
export const deleteMarket = async (id: string, permanent: boolean = false): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.delete(`${MARKETS_URL}/${id}`, {
      params: { permanent },
      headers: getAuthHeaders()
    });
    
    return {
      success: response.data?.success || false,
      message: response.data?.message || 'Market deleted successfully'
    };
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to delete market');
  }
};

/**
 * Bulk create markets (Admin only)
 */
export const bulkCreateMarkets = async (markets: CreateMarketRequest[]): Promise<BulkCreateMarketResponse> => {
  try {
    const response = await axios.post(`${MARKETS_URL}/bulk`, { markets }, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && response.data.data) {
      return {
        successful: response.data.data.successful?.map(mapMarket) || [],
        failed: response.data.data.failed || []
      };
    }
    
    throw new Error(response.data?.message || 'Failed to bulk create markets');
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Failed to bulk create markets');
  }
};

/**
 * Get market statistics (Admin only)
 */
export const getMarketStats = async (): Promise<MarketStats> => {
  try {
    const response = await axios.get(`${MARKETS_URL}/stats`, {
      headers: getAuthHeaders()
    });
    
    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }
    
    return {
      total_markets: 0,
      total_provinces: 0,
      total_districts: 0,
      provinces: [],
      districts: [],
      markets_by_province: []
    };
  } catch (error: any) {
    console.error('Error fetching market stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch market stats');
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get unique provinces from markets
 */
export const getUniqueProvinces = (markets: Market[]): string[] => {
  return [...new Set(markets.map(m => m.province).filter(Boolean))];
};

/**
 * Get unique districts from markets
 */
export const getUniqueDistricts = (markets: Market[]): string[] => {
  return [...new Set(markets.map(m => m.district).filter(Boolean))];
};

/**
 * Get markets grouped by province
 */
export const getMarketsGroupedByProvince = (markets: Market[]): Record<string, Market[]> => {
  return markets.reduce((acc, market) => {
    if (!acc[market.province]) {
      acc[market.province] = [];
    }
    acc[market.province].push(market);
    return acc;
  }, {} as Record<string, Market[]>);
};

/**
 * Format market location string
 */
export const formatMarketLocation = (market: Market): string => {
  if (market.district && market.province) {
    return `${market.name} (${market.district}, ${market.province})`;
  }
  return market.name;
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  // Public
  getMarkets,
  getMarketById,
  getMarketsInfo,
  searchMarkets,
  getMarketsByProvince,
  getMarketPrices,
  compareProductPrices,
  getLivePrices,
  // Admin
  createMarket,
  updateMarket,
  deleteMarket,
  bulkCreateMarkets,
  getMarketStats,
  getUniqueProvinces,
  getUniqueDistricts,
  getMarketsGroupedByProvince,
  formatMarketLocation,
};