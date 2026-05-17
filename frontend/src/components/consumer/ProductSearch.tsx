import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, MapPin, Heart, TrendingUp, TrendingDown, Minus, RefreshCw, Loader2, Volume2, Mic } from 'lucide-react';
import { getProvinceColor, allProvinces } from '../../utils/provinceUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLivePrices } from '../../lib/api';
import { addFavorite, removeFavorite, getFavorites } from '../../services/favoriteService';
import { toast } from 'sonner';
import { AdBanner } from '../shared/AdDisplay';
import { VoiceSearch, SpeakPriceButton } from '../VoiceSearch';
import { Input } from '../ui/input';

interface LivePrice {
  product_id: number;
  product_name: string;
  market_id: string;
  market_name: string;
  province: string;
  price: number;
  unit: string;
  trend: string;
  last_updated: string;
  source: string;
}

interface FavoriteItem {
  product_id: number;
  market_id: string;
}

export default function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [livePrices, setLivePrices] = useState<LivePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [favoriteLoading, setFavoriteLoading] = useState<{ [key: string]: boolean }>({});
  const { t } = useLanguage();

  // Fetch live prices from the API
  const fetchLivePrices = async () => {
    try {
      setLoading(true);
      const data = await getLivePrices();
      setLivePrices(data.prices || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to fetch live prices:', error);
      toast.error('Failed to load prices. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's favorites
  const fetchFavorites = async () => {
    try {
      const response = await getFavorites();
      if (response.success && response.favorites) {
        setFavorites(response.favorites.map(f => ({ 
          product_id: f.product_id, 
          market_id: f.market_id 
        })));
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  };

  useEffect(() => {
    fetchLivePrices();
    fetchFavorites();
    // Refresh prices every 5 minutes
    const interval = setInterval(fetchLivePrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const isFavorite = (productId: number, marketId: string) => {
    return favorites.some(f => f.product_id === productId && f.market_id === marketId);
  };

  const toggleFavorite = async (productId: number, marketId: string, productName: string) => {
    const key = `${productId}-${marketId}`;
    const currentlyFavorite = isFavorite(productId, marketId);
    
    setFavoriteLoading(prev => ({ ...prev, [key]: true }));
    
    try {
      if (currentlyFavorite) {
        await removeFavorite({ productId, marketId });
        setFavorites(prev => prev.filter(f => !(f.product_id === productId && f.market_id === marketId)));
        toast.success(`Removed ${productName} from favorites`);
      } else {
        await addFavorite({ productId, marketId });
        setFavorites(prev => [...prev, { product_id: productId, market_id: marketId }]);
        toast.success(`Added ${productName} to favorites`);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setFavoriteLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Get unique products from live prices (group by product name and ID)
  const uniqueProducts = [...new Map(livePrices.map(p => [p.product_name, { name: p.product_name, id: p.product_id }])).values()];
  
  // Filter products based on search
  const filteredProducts = uniqueProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get prices for a specific product
  const getProductPrices = (productId: number) => {
    return livePrices.filter(p => {
      const matchesProduct = p.product_id === productId;
      const matchesProvince = selectedProvince === 'all' || p.province === selectedProvince;
      const matchesMarket = selectedMarket === 'all' || p.market_name === selectedMarket;
      return matchesProduct && matchesProvince && matchesMarket;
    });
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-rose-400" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const getTrendText = (trend: string) => {
    if (trend === 'up') return t('rising');
    if (trend === 'down') return t('falling');
    return t('stable');
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-emerald-400';
    if (trend === 'down') return 'text-rose-400';
    return 'text-gray-400';
  };

  // Get province statistics from live prices
  const provinceStats = allProvinces.map(province => {
    const provinceName = province.replace(' Province', '');
    const provinceMarkets = [...new Set(livePrices.filter(p => p.province === provinceName).map(p => p.market_name))];
    return {
      province,
      shortName: provinceName,
      marketCount: provinceMarkets.length,
      colors: getProvinceColor(province)
    };
  });

  // Get unique markets for filter
  const uniqueMarkets = [...new Set(livePrices.map(p => p.market_name))];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4 relative" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-4">{t('loadingLivePrices')}</p>
          <p className="text-xs text-muted-foreground">{t('fetchingFromMarkets')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sponsored Banner Ad */}
      <AdBanner placement="home_top" />

      {/* Enhanced Header */}
      <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 gradient-text">
              <span className="text-xl">🇷🇼</span>
              {t('rwandaMarketPrices')}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                {t('livePricesFrom')} <span className="font-semibold text-emerald-400">{uniqueMarkets.length}</span> {t('markets')}
              </span>
              {lastUpdate && <span className="ml-2">• {t('updated')} {lastUpdate.toLocaleTimeString()}</span>}
            </p>
          </div>
          <Button 
            onClick={fetchLivePrices} 
            variant="outline" 
            size="sm" 
            disabled={loading} 
            className="btn-outline-premium"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>
      </Card>

      {/* Province Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {provinceStats.map(stat => (
          <Card 
            key={stat.province}
            className={`rounded-xl p-2.5 cursor-pointer dark-glass border transition-all duration-300 hover:-translate-y-0.5 ${
              selectedProvince === stat.shortName
                ? 'border-primary ring-1 ring-primary/50 bg-primary/5' 
                : 'border-white/10 hover:border-white/20'
            }`}
            onClick={() => setSelectedProvince(selectedProvince === stat.shortName ? 'all' : stat.shortName)}
          >
            <div className="text-center">
              <div className="text-xl mb-1 transform hover:scale-110 transition-transform">{stat.colors.emoji}</div>
              <div className="text-xs font-semibold mb-1 text-white line-clamp-1">{stat.shortName}</div>
              <div className="flex items-center justify-center gap-2">
                <Badge variant="secondary" className="text-[10px] bg-white/10 text-muted-foreground border-white/10">
                  {stat.marketCount} {t('markets')}
                </Badge>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="space-y-4">
          {/* Search Input with Voice Search */}
          <div className="relative">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <Search className="h-4 w-4 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder={t('searchForProducts') || 'Search products...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-12 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary/50"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <VoiceSearch
                onSearch={(query) => setSearchTerm(query)}
                onCommand={(command) => {
                  if (command.market) {
                    const matchedMarket = uniqueMarkets.find(m => 
                      m.toLowerCase().includes(command.market!.toLowerCase())
                    );
                    if (matchedMarket) {
                      setSelectedMarket(matchedMarket);
                    }
                  }
                }}
                placeholder=""
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{t('province')}</label>
              <Select value={selectedProvince} onValueChange={setSelectedProvince}>
                <SelectTrigger className="h-9 text-sm bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                  <SelectValue placeholder={t('allProvinces')} />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                  <SelectItem value="all" className="text-white">
                    <span className="flex items-center gap-2">
                      🗺️ {t('allProvinces')}
                    </span>
                  </SelectItem>
                  {['Kigali', 'Eastern', 'Western', 'Northern', 'Southern'].map(province => {
                    const colors = getProvinceColor(province + ' Province');
                    return (
                      <SelectItem key={province} value={province} className="text-white">
                        <span className="flex items-center gap-2">
                          {colors.emoji} {province}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{t('market')}</label>
              <Select value={selectedMarket} onValueChange={setSelectedMarket}>
                <SelectTrigger className="h-9 text-sm bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                  <SelectValue placeholder={t('allMarkets')} />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                  <SelectItem value="all" className="text-white">
                    {t('allMarkets')} ({uniqueMarkets.length})
                  </SelectItem>
                  {uniqueMarkets
                    .filter(market => {
                      if (selectedProvince === 'all') return true;
                      const marketPrices = livePrices.find(p => p.market_name === market);
                      return marketPrices?.province === selectedProvince;
                    })
                    .map(market => (
                      <SelectItem key={market} value={market} className="text-white">
                        {market}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </Card>

      {/* Results Header */}
      <Card className="rounded-xl dark-glass border-white/10 shadow-lg p-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">{t('productsFound')}</span>
          </div>
          <Badge className="h-6 rounded-full bg-primary/20 text-primary border-primary/30 px-2.5 text-[11px] font-semibold">
            {filteredProducts.length}
          </Badge>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">{t('pricesInRWF')}</p>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProducts.map(product => {
          const productPrices = getProductPrices(product.id);
          const avgPrice = productPrices.length > 0
            ? productPrices.reduce((sum, p) => sum + p.price, 0) / productPrices.length
            : 0;
          const lowestPrice = productPrices.length > 0
            ? Math.min(...productPrices.map(p => p.price))
            : 0;
          const cheapestMarket = productPrices.find(p => p.price === lowestPrice);
          const unit = productPrices[0]?.unit || 'unit';
          const isFav = isFavorite(product.id, cheapestMarket?.market_id || '');
          const favoriteKey = `${product.id}-${cheapestMarket?.market_id || ''}`;
          const isFavLoading = favoriteLoading[favoriteKey];

          return (
            <Card key={product.id} className="relative overflow-hidden rounded-xl dark-glass border-white/10 shadow-lg p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 group">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-purple-500 to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-base">{product.name}</h3>
                  <Badge variant="secondary" className="mt-1.5 text-[10px] bg-white/10 text-muted-foreground border-white/10">
                    {t('per')} {unit}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => cheapestMarket && toggleFavorite(product.id, cheapestMarket.market_id, product.name)}
                  disabled={isFavLoading}
                  className="p-1.5 hover:bg-white/10 rounded-md h-8 w-8"
                >
                  {isFavLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Heart
                      className={`h-4 w-4 transition-colors ${
                        isFav
                          ? 'fill-rose-500 text-rose-500'
                          : 'text-muted-foreground group-hover:text-rose-400'
                      }`}
                    />
                  )}
                </Button>
              </div>

              {productPrices.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/5 border border-white/10 p-2 rounded-lg">
                      <p className="text-[10px] text-muted-foreground">{t('lowest')}</p>
                      <p className="text-sm font-bold text-emerald-400">
                        {lowestPrice.toLocaleString()} RWF
                      </p>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-2 rounded-lg">
                      <p className="text-[10px] text-muted-foreground">{t('average')}</p>
                      <p className="text-sm font-bold text-primary">
                        {Math.round(avgPrice).toLocaleString()} RWF
                      </p>
                    </div>
                  </div>

                  {cheapestMarket && (
                    <div className="flex items-center gap-2 text-[11px] bg-white/5 border border-white/10 p-2 rounded-lg">
                      <MapPin className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                      <span className="text-muted-foreground">{t('cheapestAt')}</span>
                      <span className="font-medium text-emerald-400 truncate flex-1">{cheapestMarket.market_name}</span>
                      <SpeakPriceButton
                        product={product.name}
                        price={lowestPrice}
                        unit={cheapestMarket.unit || 'kg'}
                        market={cheapestMarket.market_name}
                        className="flex-shrink-0"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">{t('in')}</span>
                      <span className="font-medium text-white">{productPrices.length} {t('markets')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {getTrendIcon(productPrices[0]?.trend || 'stable')}
                      <span className={`text-xs ${getTrendColor(productPrices[0]?.trend || 'stable')}`}>
                        {getTrendText(productPrices[0]?.trend || 'stable')}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="text-xs">{t('noPricesAvailable')}</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="p-12 text-center dark-glass border-white/10 shadow-lg rounded-xl">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium text-lg text-white mb-2">{t('noProductsFound')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('tryDifferentSearch')}
          </p>
        </Card>
      )}

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