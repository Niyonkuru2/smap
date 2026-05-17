// src/services/favoriteService.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const FAVORITES_URL = `${API_BASE_URL}/favorites`;

export interface Favorite {
  id: number;
  user_id: number;
  product_id: number;
  market_id: string;
  product_name?: string;
  market_name?: string;
  product_unit?: string;
  product_image?: string;
  created_at: string;
}

export interface AddFavoriteData {
  productId: number;
  marketId: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Get all favorites for the current user
 */
export const getFavorites = async (): Promise<{ success: boolean; favorites: Favorite[] }> => {
  try {
    const response = await axios.get(FAVORITES_URL, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    throw error;
  }
};

/**
 * Add a product to favorites
 */
export const addFavorite = async (data: AddFavoriteData): Promise<{ success: boolean; message: string; favorite?: Favorite }> => {
  try {
    const response = await axios.post(`${FAVORITES_URL}/add`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error adding favorite:', error);
    throw error;
  }
};

/**
 * Remove a product from favorites
 */
export const removeFavorite = async (data: AddFavoriteData): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.post(`${FAVORITES_URL}/remove`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  } catch (error) {
    console.error('Error removing favorite:', error);
    throw error;
  }
};

/**
 * Toggle favorite status (add if not exists, remove if exists)
 */
export const toggleFavorite = async (
  productId: number, 
  marketId: string, 
  isCurrentlyFavorite: boolean
): Promise<{ success: boolean; message: string; isFavorite: boolean }> => {
  if (isCurrentlyFavorite) {
    await removeFavorite({ productId, marketId });
    return { success: true, message: 'Removed from favorites', isFavorite: false };
  } else {
    await addFavorite({ productId, marketId });
    return { success: true, message: 'Added to favorites', isFavorite: true };
  }
};

/**
 * Check if a specific product-market combination is favorited
 */
export const isFavorite = async (productId: number, marketId: string): Promise<boolean> => {
  try {
    const response = await getFavorites();
    if (response.success && response.favorites) {
      return response.favorites.some(
        fav => fav.product_id === productId && fav.market_id === marketId
      );
    }
    return false;
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

/**
 * Get favorite products with their current prices
 */
export const getFavoriteProductsWithPrices = async (): Promise<{
  success: boolean;
  favorites: Array<Favorite & { current_price?: number; lowest_price?: number; market_count?: number }>;
}> => {
  try {
    const response = await getFavorites();
    if (!response.success || !response.favorites) {
      return { success: false, favorites: [] };
    }

    // Fetch current prices for favorited products
    const pricePromises = response.favorites.map(async (favorite) => {
      try {
        const priceResponse = await axios.get(`${API_BASE_URL}/prices/live`, {
          params: {
            productId: favorite.product_id
          }
        });
        
        const prices = priceResponse.data.prices || [];
        const productPrices = prices.filter(p => p.product_id === favorite.product_id);
        
        if (productPrices.length > 0) {
          const currentPrice = productPrices.find(p => p.market_id === favorite.market_id);
          const lowestPrice = Math.min(...productPrices.map(p => p.price));
          
          return {
            ...favorite,
            current_price: currentPrice?.price || lowestPrice,
            lowest_price: lowestPrice,
            market_count: productPrices.length
          };
        }
        
        return favorite;
      } catch (error) {
        return favorite;
      }
    });

    const favoritesWithPrices = await Promise.all(pricePromises);
    
    return {
      success: true,
      favorites: favoritesWithPrices
    };
  } catch (error) {
    console.error('Error fetching favorite products with prices:', error);
    return { success: false, favorites: [] };
  }
};

/**
 * Get favorite count for a user
 */
export const getFavoriteCount = async (): Promise<number> => {
  try {
    const response = await getFavorites();
    return response.success ? response.favorites.length : 0;
  } catch (error) {
    console.error('Error getting favorite count:', error);
    return 0;
  }
};

export default {
  getFavorites,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  isFavorite,
  getFavoriteProductsWithPrices,
  getFavoriteCount
};