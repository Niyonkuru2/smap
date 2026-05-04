import { useState, useEffect } from 'react';
import { getProducts, getMarkets, getCategories, getAllPrices, getLivePrices } from '../lib/api';

export interface Product {
  id: string;
  name: string;
  category: string;
  unit: string;
  image?: string;
}

export interface Market {
  id: string;
  name: string;
  location: string;
  district: string;
  province?: string;
  type?: 'public' | 'modern' | 'neighborhood';
  description?: string;
  operatingHours?: string;
  daysOpen?: string;
  phone?: string;
  popularProducts?: string[];
  rating?: number;
  vendorCount?: number;
}

export interface PriceData {
  id?: string;
  productId: string;
  marketId: string;
  productName?: string;
  marketName?: string;
  current: number;
  average?: number;
  highest?: number;
  lowest?: number;
  lastUpdated: Date;
  trend?: 'up' | 'down' | 'stable';
  history?: { date: Date; price: number }[];
  rating?: number;
  totalRatings?: number;
}

// Products hook
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const response = await getProducts();
        setProducts(response.products || []);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch products:', err);
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return { products, loading, error, refetch: () => {} };
}

// Markets hook
export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMarkets() {
      try {
        setLoading(true);
        const response = await getMarkets();
        setMarkets(response.markets || []);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch markets:', err);
        setError(err.message);
        setMarkets([]);
      } finally {
        setLoading(false);
      }
    }
    fetchMarkets();
  }, []);

  return { markets, loading, error };
}

// Categories hook
export function useCategories() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const response = await getCategories();
        setCategories(response.categories || []);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch categories:', err);
        setError(err.message);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCategories();
  }, []);

  return { categories, loading, error };
}

// Prices hook
export function usePrices() {
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        setLoading(true);
        const response = await getAllPrices();
        const pricesData = (response.prices || []).map((p: any) => ({
          id: p.id,
          productId: p.product_id,
          marketId: p.market_id,
          productName: p.product_name,
          marketName: p.market_name,
          current: p.price,
          lastUpdated: new Date(p.submitted_at || p.created_at),
          trend: 'stable' as const,
        }));
        setPrices(pricesData);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch prices:', err);
        setError(err.message);
        setPrices([]);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
  }, []);

  return { prices, loading, error };
}

// Live prices hook
export function useLivePrices() {
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLivePrices() {
      try {
        setLoading(true);
        const response = await getLivePrices();
        setPrices(response.prices || []);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch live prices:', err);
        setError(err.message);
        setPrices([]);
      } finally {
        setLoading(false);
      }
    }
    fetchLivePrices();
  }, []);

  return { prices, loading, error };
}

// Combined hook for all app data
export function useAppData() {
  const { products, loading: productsLoading } = useProducts();
  const { markets, loading: marketsLoading } = useMarkets();
  const { categories, loading: categoriesLoading } = useCategories();
  const { prices, loading: pricesLoading } = usePrices();

  const loading = productsLoading || marketsLoading || categoriesLoading || pricesLoading;

  return {
    products,
    markets,
    categories,
    prices,
    loading,
  };
}
