// src/services/priceForecastService.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const FORECAST_URL = `${API_BASE_URL}/forecast`;

export const getPriceForecast = async (
  productId,  
  marketId, 
  days = 30
) => {
  try {
    const response = await axios.get(
      `${FORECAST_URL}/product/${productId}/market/${marketId}`,
      { params: { days } }
    );

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    if (error.response?.status === 404) {
      console.log(`No forecast data for product ${productId}, market ${marketId}`);
      return null;
    }
    console.error('Error fetching price forecast:', error);
    throw error;
  }
};

export const getMarketComparison = async (productId) => {
  try {
    const response = await axios.get(`${FORECAST_URL}/product/${productId}/markets`);

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching market comparison:', error);
    throw error;
  }
};

export const getBestTimeToBuy = async (productId) => {
  try {
    const response = await axios.get(`${FORECAST_URL}/product/${productId}/best-time`);

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching best time to buy:', error);
    throw error;
  }
};

export const getProductForecastSummary = async (productId) => {
  try {
    const response = await axios.get(`${FORECAST_URL}/product/${productId}/summary`);

    if (response.data && response.data.success && response.data.data) {
      return response.data.data;
    }

    return null;
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error('Error fetching product forecast summary:', error);
    throw error;
  }
};

export const trainModels = async () => {
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

export const getModelMetrics = async () => {
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

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default {
  getPriceForecast,
  getBestTimeToBuy,
  getMarketComparison,
  getProductForecastSummary,
  trainModels,
  getModelMetrics,
};