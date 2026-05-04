import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Heart, MapPin, TrendingUp, TrendingDown, Trash2, Loader2, Star, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useProducts, useMarkets, usePrices } from '../../hooks/useAppData';
import { getFavorites, removeFavorite, type StoredFavorite } from '../../lib/localStorage';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

interface FavoritesProps {
  userId: string;
}

export default function Favorites({ userId }: FavoritesProps) {
  const [favorites, setFavorites] = useState<StoredFavorite[]>([]);
  const { t } = useLanguage();
  const { products, loading: productsLoading } = useProducts();
  const { markets, loading: marketsLoading } = useMarkets();
  const { prices: priceData, loading: pricesLoading } = usePrices();
  const loading = productsLoading || marketsLoading || pricesLoading;

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const loadFavorites = () => {
    const storedFavorites = getFavorites(userId);
    setFavorites(storedFavorites);
  };

  const handleRemoveFavorite = (productId: string, marketId: string) => {
    removeFavorite(userId, productId, marketId);
    loadFavorites();
    toast.success('Removed from favorites');
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

  if (loading) {
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

  return (
    <div className="space-y-4">
      <Card className="p-5 rounded-xl dark-glass border-white/10">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="icon-container">
              <Heart className="h-5 w-5 text-primary fill-primary/20" />
            </div>
            <h2 className="text-lg font-bold gradient-text">{t('favorites')}</h2>
            {favorites.length > 0 && (
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {favorites.length}
              </Badge>
            )}
          </div>
          {favorites.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {favorites.length} {t('savedItems') || 'saved items'}
            </p>
          )}
        </div>

        {favorites.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {favorites.map(favorite => {
              const product = products.find(p => p.id === favorite.productId);
              const market = markets.find(m => m.id === favorite.marketId);
              const priceInfo = priceData.find(
                p => p.productId === favorite.productId && p.marketId === favorite.marketId
              );

              const ageInHours = priceInfo?.lastUpdated 
                ? Math.round((Date.now() - new Date(priceInfo.lastUpdated).getTime()) / (1000 * 60 * 60))
                : null;

              return (
                <Card 
                  key={`${favorite.productId}-${favorite.marketId}`} 
                  className="relative overflow-hidden rounded-xl dark-glass border-white/10 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 group"
                >
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-purple-500 to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-white">{product?.name}</h3>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px] bg-white/10 text-muted-foreground border-white/10">
                          {product?.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{market?.name}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 h-auto"
                      onClick={() => handleRemoveFavorite(favorite.productId, favorite.marketId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {priceInfo ? (
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-muted-foreground">{t('currentPrice') || 'Current Price'}</span>
                        <span className="text-xl font-bold text-white">
                          {priceInfo.current.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">RWF</span>
                        </span>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[11px] text-muted-foreground">{t('average') || 'Average'}</p>
                            <p className="text-sm font-medium text-white">{priceInfo.average.toLocaleString()} RWF</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-muted-foreground">{t('range') || 'Range'}</p>
                            <p className="text-sm font-medium text-white">
                              {priceInfo.lowest.toLocaleString()} - {priceInfo.highest.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            {getTrendIcon(priceInfo.trend)}
                            {t('trend') || 'Trend'}
                          </p>
                          <p className={`text-sm font-medium ${
                            priceInfo.trend === 'up' ? 'text-emerald-400' :
                            priceInfo.trend === 'down' ? 'text-rose-400' :
                            'text-gray-400'
                          }`}>
                            {getTrendText(priceInfo.trend)}
                          </p>
                        </div>
                        <div className="bg-white/5 rounded-lg p-2">
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {t('lastUpdated') || 'Updated'}
                          </p>
                          <p className="text-sm font-medium text-white">
                            {ageInHours && ageInHours < 1 ? t('justNow') || 'Just now' : `${ageInHours}h ago`}
                          </p>
                        </div>
                      </div>
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
        ) : (
          <div className="text-center py-16">
            <div className="icon-container mx-auto mb-4">
              <Heart className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-white mb-1">{t('noFavoritesYet') || 'No favorite products yet'}</p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {t('addFavoritesHelp') || 'Add products to favorites by clicking the heart icon on product cards to track their prices easily'}
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}