// src/services/priceForecastService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const FORECAST_URL = `${API_BASE_URL}/forecast`;

export interface PricePrediction {
  days: number;
  price: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
}

export interface PriceForecast {
  success: boolean;
  product_id: number;
  product_name: string;
  market_id: number;
  market_name: string;
  current_price: number;
  average_price: number;
  min_price: number;
  max_price: number;
  volatility: number;
  data_points: number;
  predictions: PricePrediction[];
  factors: string[];
  recommendation: {
    action: 'wait' | 'buy_now' | 'monitor' | 'stable';
    message: string;
    urgency: 'low' | 'medium' | 'high';
    best_time: string;
  };
  generated_at: string;
}

export interface BestTimeToBuy {
  success: boolean;
  product_id: number;
  product_name: string;
  best_day: string;
  best_day_index: number;
  best_day_average_price: number;
  worst_day: string;
  worst_day_average_price: number;
  potential_savings: number;
  savings_percentage: number;
  confidence: number;
  data_points: number;
}

export interface MarketComparison {
  success: boolean;
  product_id: number;
  markets: Array<{
    market_id: number;
    market_name: string;
    province: string;
    district: string;
    average_price: number;
    min_price: number;
    max_price: number;
    price_count: number;
    last_updated: string;
  }>;
  best_market: {
    market_id: number;
    market_name: string;
    province: string;
    district: string;
    average_price: number;
    savings_vs_expensive: number;
    savings_percentage: number;
  };
}

export interface ProductForecastSummary {
  best_time_to_buy: BestTimeToBuy | null;
  market_comparison: MarketComparison | null;
  forecast: PriceForecast | null;
}

export interface ModelMetrics {
  total_products: number;
  total_markets: number;
  total_predictions: number;
  data_range: {
    from: string;
    to: string;
  };
  models: Array<{
    name: string;
    accuracy: number;
    mape: number;
    rmse: number;
  }>;
  avg_accuracy: number;
  last_trained: string;
}

export interface TrainModelsResult {
  success: boolean;
  models_trained: number;
  total_combinations: number;
  total_data_points: number;
  training_time_ms: number;
  timestamp: string;
  message: string;
}

/**
 * Get price forecast for a specific product and market
 * @param productId - Product ID
 * @param marketId - Market ID
 * @param days - Number of days to forecast (default: 30)
 */
export const getPriceForecast = async (
  productId: number | string,
  marketId: number | string,
  days: number = 30
): Promise<PriceForecast | null> => {
  try {
    const response = await axios.get(
      `${FORECAST_URL}/product/${productId}/market/${marketId}`,
      { params: { days } }
    );

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching price forecast:', error);
    throw error;
  }
};

/**
 * Get best time to buy for a product (analyzes day-of-week patterns)
 * @param productId - Product ID
 */
export const getBestTimeToBuy = async (
  productId: number | string
): Promise<BestTimeToBuy | null> => {
  try {
    const response = await axios.get(`${FORECAST_URL}/product/${productId}/best-time`);

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching best time to buy:', error);
    throw error;
  }
};

/**
 * Get market comparison for best prices
 * @param productId - Product ID
 */
export const getMarketComparison = async (
  productId: number | string
): Promise<MarketComparison | null> => {
  try {
    const response = await axios.get(`${FORECAST_URL}/product/${productId}/markets`);

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching market comparison:', error);
    throw error;
  }
};

/**
 * Get complete forecast summary for a product
 * Includes best time to buy, market comparison, and forecast
 * @param productId - Product ID
 */
export const getProductForecastSummary = async (
  productId: number | string
): Promise<ProductForecastSummary | null> => {
  try {
    const response = await axios.get(`${FORECAST_URL}/product/${productId}/summary`);

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching product forecast summary:', error);
    throw error;
  }
};

/**
 * Train/retrain all forecast models (Admin only)
 */
export const trainModels = async (): Promise<TrainModelsResult | null> => {
  try {
    const response = await axios.post(
      `${FORECAST_URL}/train`,
      {},
      { headers: getAuthHeaders() }
    );

    if (response.data && response.data.success) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Error training models:', error);
    throw error;
  }
};

/**
 * Get model performance metrics (Admin only)
 */
export const getModelMetrics = async (): Promise<ModelMetrics | null> => {
  try {
    const response = await axios.get(`${FORECAST_URL}/metrics`, {
      headers: getAuthHeaders()
    });

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching model metrics:', error);
    throw error;
  }
};

/**
 * Helper to get auth headers
 */
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// ============================================
// REACT HOOKS (if using React)
// ============================================

/**
 * React hook for price forecast
 * Example usage:
 * const { data: forecast, loading, error, refetch } = usePriceForecast(productId, marketId);
 */
export const usePriceForecast = (productId?: number | string, marketId?: number | string, days: number = 30) => {
  // This is a placeholder - you'll need to implement with your preferred state management
  // Example with React Query:
  // return useQuery(
  //   ['priceForecast', productId, marketId, days],
  //   () => getPriceForecast(productId!, marketId!, days),
  //   { enabled: !!productId && !!marketId }
  // );
  
  // For now, just return the function
  return { getPriceForecast: () => productId && marketId ? getPriceForecast(productId, marketId, days) : Promise.resolve(null) };
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  getPriceForecast,
  getBestTimeToBuy,
  getMarketComparison,
  getProductForecastSummary,
  trainModels,
  getModelMetrics,
};