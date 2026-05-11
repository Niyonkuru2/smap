// src/services/priceSubmissionService.ts

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const PRICES_URL = `${API_BASE_URL}/prices`;

export interface PriceSubmissionRequest {
  productId: string;
  marketId: string;
  price: number;
  unit: string;
  notes?: string;
  quantity?: number;
}

export interface PriceSubmission {
  id: string;
  product_id: string;
  market_id: string;
  vendor_id: string;
  price: number;
  unit: string;
  quantity?: number;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  flagged: boolean;
  flag_reason?: string;
  created_at: string;
  updated_at?: string;
  
  // Joined fields (from API responses)
  product_name?: string;
  market_name?: string;
  vendor_name?: string;
}

export interface AnomalyCheck {
  isAnomaly: boolean;
  reason: string;
  referencePrice?: number;
  percentageDiff?: number;
}

export interface PriceSubmissionResponse {
  success: boolean;
  submission: PriceSubmission;
  anomalyCheck?: AnomalyCheck;
  message: string;
}

export interface PriceHistoryEntry {
  id: string;
  product_id: string;
  market_id: string;
  price: number;
  unit: string;
  recorded_at: string;
  vendor_id?: string;
  vendor_name?: string;
}

export interface PriceTrend {
  product_id: string;
  market_id: string;
  current_price: number;
  average_price: number;
  min_price: number;
  max_price: number;
  trend: 'up' | 'down' | 'stable';
  percentage_change: number;
}

export interface MarketComparison {
  market_id: string;
  market_name: string;
  location: string;
  price: number;
  unit: string;
  is_best: boolean;
  difference_from_avg: number;
}

export interface Recommendation {
  product_id: string;
  product_name: string;
  unit: string;
  best_market_id: string;
  best_market_name: string;
  best_price: number;
  savings: number;
  reason: string;
}

/**
 * Helper to get auth headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Map backend price submission data to frontend PriceSubmission format
 */
const mapPriceSubmission = (submission: any): PriceSubmission => {
  return {
     id: submission.id?.toString(),
    product_id: submission.product_id?.toString(),
    market_id: submission.market_id?.toString(),
    vendor_id: submission.vendor_id?.toString(),
    price: submission.price,
    unit: submission.unit || 'kg',
    quantity: submission.quantity,
    notes: submission.vendor_notes || submission.notes,
    status: submission.status || 'pending',
    flagged: submission.flagged || false,
    flag_reason: submission.flag_reason,
    created_at: submission.created_at,
    updated_at: submission.updated_at,
    product_name: submission.product_name,
    market_name: submission.market_name,
    vendor_name: submission.vendor_name,
  };
};

/**
 * Map anomaly check data
 */
const mapAnomalyCheck = (anomaly: any): AnomalyCheck | undefined => {
  if (!anomaly) return undefined;
  return {
    isAnomaly: anomaly.isAnomaly,
    reason: anomaly.reason,
    referencePrice: anomaly.referencePrice,
    percentageDiff: anomaly.percentageDiff,
  };
};

/**
 * SUBMIT A NEW PRICE (Vendor)
 */
export const submitVendorPrice = async (
  data: PriceSubmissionRequest
): Promise<PriceSubmissionResponse> => {
  try {
    const payload = {
      productId: data.productId,
      marketId: data.marketId,
      price: data.price,
      unit: data.unit,
      notes: data.notes,
      quantity: data.quantity,
    };

    const response = await axios.post(`${PRICES_URL}/submit`, payload, {
      headers: getAuthHeaders(),
    });

    if (response.data && response.data.success) {
      return {
        success: true,
        submission: mapPriceSubmission(response.data.submission),
        anomalyCheck: mapAnomalyCheck(response.data.anomalyCheck),
        message: response.data.message,
      };
    }

    throw new Error(response.data?.message || 'Failed to submit price');
  } catch (error: any) {
    console.error('Error submitting price:', error);
    throw new Error(error.response?.data?.message || 'Failed to submit price');
  }
};

/**
 * GET MY PRICE SUBMISSIONS (Current vendor)
 */
export const getMySubmissions = async (): Promise<{
  success: boolean;
  submissions: PriceSubmission[];
}> => {
  try {
    const response = await axios.get(`${PRICES_URL}/my-submissions`, {
      headers: getAuthHeaders(),
    });

    if (response.data && response.data.success) {
      // Handle different response structures
      let submissionsData = [];
      if (response.data.submissions) {
        submissionsData = response.data.submissions;
      } else if (response.data.data) {
        submissionsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        submissionsData = response.data;
      }
      
      const submissions = submissionsData.map(mapPriceSubmission);
      
      return {
        success: true,
        submissions,
      };
    }

    return {
      success: false,
      submissions: [],
    };
  } catch (error: any) {
    console.error('Error fetching submissions:', error);
    // Don't throw, return empty array instead
    return {
      success: false,
      submissions: [],
    };
  }
};

/**
 * GET PRICE RECOMMENDATIONS (Shopping recommendations for consumers)
 */
export const getPriceRecommendations = async (): Promise<{
  success: boolean;
  recommendations: Recommendation[];
}> => {
  try {
    const response = await axios.get(`${PRICES_URL}/recommendations`, {
      headers: getAuthHeaders(),
    });

    if (response.data && response.data.success) {
      const recommendations = Array.isArray(response.data.recommendations)
        ? response.data.recommendations
        : Array.isArray(response.data.data)
        ? response.data.data
        : [];
      
      return {
        success: true,
        recommendations,
      };
    }

    return {
      success: false,
      recommendations: [],
    };
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch recommendations');
  }
};

/**
 * GET PRICE HISTORY for a product in a market
 */
export const getPriceHistory = async (
  productId: string,
  marketId: string,
  options?: { days?: number; limit?: number }
): Promise<{
  success: boolean;
  history: PriceHistoryEntry[];
  trend?: PriceTrend;
}> => {
  try {
    const params = new URLSearchParams();
    if (options?.days) params.append('days', options.days.toString());
    if (options?.limit) params.append('limit', options.limit.toString());

    const url = `${PRICES_URL}/history/${productId}/${marketId}${
      params.toString() ? `?${params.toString()}` : ''
    }`;
    
    const response = await axios.get(url);

    if (response.data && response.data.success) {
      const history = Array.isArray(response.data.history)
        ? response.data.history
        : [];
      
      return {
        success: true,
        history,
        trend: response.data.trend,
      };
    }

    return {
      success: false,
      history: [],
    };
  } catch (error: any) {
    console.error('Error fetching price history:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch price history');
  }
};

/**
 * GET PRICE FORECAST (ML Prediction)
 */
export const getPriceForecast = async (
  productId: string,
  marketId: string,
  days: number = 7
): Promise<{
  success: boolean;
  forecast?: {
    product_id: string;
    market_id: string;
    predictions: Array<{ date: string; predicted_price: number; confidence_lower?: number; confidence_upper?: number }>;
    confidence: number;
  };
}> => {
  try {
    const response = await axios.get(
      `${PRICES_URL}/forecast/${productId}/${marketId}?days=${days}`
    );

    if (response.data && response.data.success) {
      return {
        success: true,
        forecast: response.data.forecast,
      };
    }

    return {
      success: false,
    };
  } catch (error: any) {
    console.error('Error fetching price forecast:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch price forecast');
  }
};

/**
 * COMPARE MARKETS for a product
 */
export const compareMarkets = async (
  productId: string
): Promise<{
  success: boolean;
  comparison: MarketComparison[];
  best_market?: MarketComparison;
}> => {
  try {
    const response = await axios.get(`${PRICES_URL}/compare/${productId}`);

    if (response.data && response.data.success) {
      const comparison = Array.isArray(response.data.comparison)
        ? response.data.comparison
        : [];
      
      return {
        success: true,
        comparison,
        best_market: response.data.best_market,
      };
    }

    return {
      success: false,
      comparison: [],
    };
  } catch (error: any) {
    console.error('Error comparing markets:', error);
    throw new Error(error.response?.data?.message || 'Failed to compare markets');
  }
};

/**
 * GET BEST TIME TO BUY for a product
 */
export const getBestTimeToBuy = async (
  productId: string
): Promise<{
  success: boolean;
  analysis?: {
    product_id: string;
    product_name: string;
    best_time: string;
    reason: string;
    seasonal_pattern: Array<{ month: number; average_price: number; is_best: boolean }>;
  };
}> => {
  try {
    const response = await axios.get(`${PRICES_URL}/best-time/${productId}`);

    if (response.data && response.data.success) {
      return {
        success: true,
        analysis: response.data.analysis,
      };
    }

    return {
      success: false,
    };
  } catch (error: any) {
    console.error('Error fetching best time to buy:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch best time to buy');
  }
};

/**
 * GET ALL PRICES (Public - with filters)
 */
export const getPrices = async (filters?: {
  marketId?: string;
  productId?: string;
  limit?: number;
}): Promise<{
  success: boolean;
  prices: PriceSubmission[];
}> => {
  try {
    const params = new URLSearchParams();
    if (filters?.marketId) params.append('marketId', filters.marketId);
    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = `${PRICES_URL}/${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await axios.get(url);

    if (response.data && response.data.success) {
      const prices = Array.isArray(response.data.prices)
        ? response.data.prices.map(mapPriceSubmission)
        : [];
      
      return {
        success: true,
        prices,
      };
    }

    return {
      success: false,
      prices: [],
    };
  } catch (error: any) {
    console.error('Error fetching prices:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch prices');
  }
};

/**
 * GET VENDOR PRICE STATS (Admin only)
 */
// src/services/priceSubmissionService.ts - Update getVendorPriceStats

/**
 * GET VENDOR PRICE STATS (Admin or vendor themselves)
 */
export const getVendorPriceStats = async (vendorId?: string): Promise<{
  total_submissions: number;
  approved_submissions: number;
  pending_submissions: number;
  rejected_submissions: number;
  flagged_submissions: number;
  average_price: number;
  total_contribution: number;
}> => {
  try {
    // If vendorId is provided, use the vendor-stats endpoint
    // Otherwise, use my-stats for the current user
    let url;
    if (vendorId) {
      url = `${PRICES_URL}/vendor-stats/${vendorId}`;
    } else {
      url = `${PRICES_URL}/my-stats`;
    }
    
    const response = await axios.get(url, {
      headers: getAuthHeaders(),
    });

    if (response.data && response.data.success) {
      // Handle both response formats
      const data = response.data.data || response.data.stats;
      return {
        total_submissions: data.total_submissions || 0,
        approved_submissions: data.approved_submissions || 0,
        pending_submissions: data.pending_submissions || 0,
        rejected_submissions: data.rejected_submissions || 0,
        flagged_submissions: data.flagged_submissions || 0,
        average_price: data.average_price || 0,
        total_contribution: data.total_contribution || 0,
      };
    }

    return {
      total_submissions: 0,
      approved_submissions: 0,
      pending_submissions: 0,
      rejected_submissions: 0,
      flagged_submissions: 0,
      average_price: 0,
      total_contribution: 0,
    };
  } catch (error: any) {
    console.error('Error fetching vendor price stats:', error);
    return {
      total_submissions: 0,
      approved_submissions: 0,
      pending_submissions: 0,
      rejected_submissions: 0,
      flagged_submissions: 0,
      average_price: 0,
      total_contribution: 0,
    };
  }
};


// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  submitVendorPrice,
  getMySubmissions,
  getPriceRecommendations,
  getPriceHistory,
  getPriceForecast,
  compareMarkets,
  getBestTimeToBuy,
  getPrices,
  getVendorPriceStats,
};

