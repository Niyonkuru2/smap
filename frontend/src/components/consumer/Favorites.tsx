import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Heart, MapPin, TrendingUp, TrendingDown, Trash2, Loader2, Star, Clock, DollarSign, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useProducts, useMarkets, usePrices } from '../../hooks/useAppData';
import {removeFavorite, getFavoriteProductsWithPrices, type Favorite } from '../../services/favoriteService';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

interface FavoritesProps {
  userId: string;
}

interface FavoriteWithDetails extends Favorite {
  current_price?: number;
  lowest_price?: number;
  market_count?: number;
  trend?: 'up' | 'down' | 'stable';
  price_difference?: number;
  last_updated?: string;
}

export default function Favorites({ userId }: FavoritesProps) {
  const [favorites, setFavorites] = useState<FavoriteWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const { products, loading: productsLoading } = useProducts();
  const { markets, loading: marketsLoading } = useMarkets();
  const { prices: priceData, loading: pricesLoading } = usePrices();

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await getFavoriteProductsWithPrices();
      if (response.success) {
        // Enhance favorites with trend data from priceData
        const enhancedFavorites = response.favorites.map(fav => {
          const productPrices = priceData.filter(p => p.product_id === fav.product_id);
          const marketPrice = productPrices.find(p => p.market_id === fav.market_id);
          
          // Calculate trend based on price history
          let trend: 'up' | 'down' | 'stable' = 'stable';
          let priceDifference = 0;
          
          if (marketPrice && marketPrice.previous_price) {
            priceDifference = ((marketPrice.price - marketPrice.previous_price) / marketPrice.previous_price) * 100;
            if (priceDifference > 5) trend = 'up';
            else if (priceDifference < -5) trend = 'down';
            else trend = 'stable';
          }
          
          return {
            ...fav,
            current_price: marketPrice?.price || fav.current_price,
            lowest_price: fav.lowest_price,
            market_count: fav.market_count,
            trend,
            price_difference: priceDifference,
            last_updated: marketPrice?.created_at
          };
        });
        
        setFavorites(enhancedFavorites);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId: number, marketId: string, productName: string) => {
    try {
      await removeFavorite({ productId, marketId });
      await loadFavorites();
      toast.success(`Removed ${productName} from favorites`);
    } catch (error) {
      toast.error('Failed to remove from favorites');
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-rose-400" />;
    return null;
  };

  const getTrendText = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return t('rising') || 'Rising';
    if (trend === 'down') return t('falling') || 'Falling';
    return t('stable') || 'Stable';
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return 'text-emerald-400';
    if (trend === 'down') return 'text-rose-400';
    return 'text-gray-400';
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} RWF`;
  };

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const isLoading = loading || productsLoading || marketsLoading || pricesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4 relative" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-4">{t('loadingFavorites') || 'Loading favorites...'}</p>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card className="p-12 text-center dark-glass border-white/10 rounded-xl">
        <div className="icon-container mx-auto mb-4">
          <Heart className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Favorites Yet</h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Start adding products you love to your favorites list by clicking the heart icon on any product.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-xl dark-glass border-white/10">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="icon-container">
              <Heart className="h-5 w-5 text-primary fill-primary/20" />
            </div>
            <h2 className="text-lg font-bold gradient-text">{t('favorites') || 'Favorites'}</h2>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              {favorites.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadFavorites} className="btn-outline-premium">
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            <p className="text-xs text-muted-foreground">
              {favorites.length} {t('savedItems') || 'saved items'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {favorites.map(favorite => {
            const product = products.find(p => p.id === favorite.product_id);
            const market = markets.find(m => m.id === favorite.market_id);
            const hasPriceData = favorite.current_price && favorite.current_price > 0;

            return (
              <Card 
                key={`${favorite.product_id}-${favorite.market_id}`} 
                className="relative overflow-hidden rounded-xl dark-glass border-white/10 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 group"
              >
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-purple-500 to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-base text-white">{product?.name || favorite.product_name}</h3>
                      <Heart className="h-4 w-4 text-rose-400 fill-rose-400" />
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {product?.category && (
                        <Badge variant="secondary" className="text-[10px] bg-white/10 text-muted-foreground border-white/10">
                          {product.category}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{market?.name || favorite.market_name}</span>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveFavorite(favorite.product_id, favorite.market_id, product?.name || favorite.product_name || 'Product')}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {hasPriceData ? (
                  <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-muted-foreground">{t('currentPrice') || 'Current Price'}</span>
                      <div className="text-right">
                        <span className="text-xl font-bold text-white">
                          {formatPrice(favorite.current_price!)}
                        </span>
                        {favorite.trend && favorite.price_difference !== 0 && (
                          <div className={`text-xs ${getTrendColor(favorite.trend)} flex items-center gap-0.5 justify-end mt-0.5`}>
                            {getTrendIcon(favorite.trend)}
                            <span>{Math.abs(favorite.price_difference!).toFixed(1)}%</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-4">
                        {favorite.lowest_price && favorite.lowest_price > 0 && (
                          <div>
                            <p className="text-[11px] text-muted-foreground">{t('bestPrice') || 'Best Price'}</p>
                            <p className="text-sm font-medium text-emerald-400">{formatPrice(favorite.lowest_price)}</p>
                          </div>
                        )}
                        {favorite.market_count && favorite.market_count > 0 && (
                          <div>
                            <p className="text-[11px] text-muted-foreground">{t('markets') || 'Markets'}</p>
                            <p className="text-sm font-medium text-white">{favorite.market_count} markets</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          {getTrendIcon(favorite.trend || 'stable')}
                          {t('trend') || 'Trend'}
                        </p>
                        <p className={`text-sm font-medium ${getTrendColor(favorite.trend || 'stable')}`}>
                          {getTrendText(favorite.trend || 'stable')}
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t('lastUpdated') || 'Updated'}
                        </p>
                        <p className="text-sm font-medium text-white">
                          {getTimeAgo(favorite.last_updated)}
                        </p>
                      </div>
                    </div>

                    {/* Savings indicator */}
                    {favorite.lowest_price && favorite.current_price && favorite.current_price > favorite.lowest_price && (
                      <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          You could save {formatPrice(favorite.current_price - favorite.lowest_price)} by buying at the best market
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="icon-container-small mx-auto mb-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">{t('noPriceData') || 'No price data available'}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('checkBackLater') || 'Check back later for updates'}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Card>

      <style>{`
        .btn-outline-premium {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: hsl(var(--foreground));
          transition: all 0.2s ease;
        }

        .btn-outline-premium:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .icon-container {
          padding: 0.75rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
        }

        .icon-container-small {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(10px);
          display: inline-flex;
        }

        .gradient-text {
          background: linear-gradient(135deg, #fff 0%, #d1fae5 45%, #6ee7b7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
}