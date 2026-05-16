import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, MapPin, Heart, TrendingUp, TrendingDown, Minus, RefreshCw, Loader2, Volume2 } from 'lucide-react';
import { getProvinceColor, allProvinces } from '../../utils/provinceUtils';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLivePrices } from '../../lib/api';
import { toast } from 'sonner';
import { AdBanner} from '../shared/AdDisplay';
import { VoiceSearch, SpeakPriceButton } from '../VoiceSearch';

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

export default function ProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('all');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [livePrices, setLivePrices] = useState<LivePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
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

  useEffect(() => {
    fetchLivePrices();
    // Refresh prices every 5 minutes
    const interval = setInterval(fetchLivePrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFavorite = (productName: string) => {
    setFavorites(prev =>
      prev.includes(productName)
        ? prev.filter(name => name !== productName)
        : [...prev, productName]
    );
  };

  // Get unique products from live prices
  const uniqueProducts = [...new Set(livePrices.map(p => p.product_name))];
  
  // Filter products based on search
  const filteredProducts = uniqueProducts.filter(productName => {
    const matchesSearch = productName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get prices for a specific product
  const getProductPrices = (productName: string) => {
    return livePrices.filter(p => {
      const matchesProduct = p.product_name === productName;
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
      <div className="dark-glass border border-white/10 rounded-xl p-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-bold flex items-center gap-2">
              <span className="text-lg">🇷🇼</span>
              <span className="gradient-text">{t('rwandaMarketPrices')}</span>
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
            className="btn-outline-premium h-8 px-3 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </Button>
        </div>
      </div>

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
      <Card className="p-3 rounded-xl dark-glass border-white/10">
        <div className="space-y-3">
          {/* Voice Search Component */}
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
            placeholder={t('searchForProducts')}
          />

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
      <div className="rounded-xl dark-glass border-white/10 p-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="icon-container-small">
              <Search className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{t('productsFound')}</span>
          </div>
          <Badge className="h-6 rounded-full bg-primary/20 text-primary border-primary/30 px-2.5 text-[11px] font-semibold">
            {filteredProducts.length}
          </Badge>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">{t('pricesInRWF')}</p>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredProducts.map(productName => {
          const productPrices = getProductPrices(productName);
          const avgPrice = productPrices.length > 0
            ? productPrices.reduce((sum, p) => sum + p.price, 0) / productPrices.length
            : 0;
          const lowestPrice = productPrices.length > 0
            ? Math.min(...productPrices.map(p => p.price))
            : 0;
          const highestPrice = productPrices.length > 0
            ? Math.max(...productPrices.map(p => p.price))
            : 0;
          const cheapestMarket = productPrices.find(p => p.price === lowestPrice);
          const unit = productPrices[0]?.unit || 'unit';

          return (
            <Card key={productName} className="relative overflow-hidden rounded-xl dark-glass border-white/10 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 group">
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-primary via-purple-500 to-primary opacity-60 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-white leading-tight">{productName}</h3>
                  <Badge variant="secondary" className="mt-1.5 text-[10px] bg-white/10 text-muted-foreground border-white/10">
                    {t('per')} {unit}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorite(productName)}
                  className="p-1.5 hover:bg-white/10 rounded-md"
                >
                  <Heart
                    className={`h-4 w-4 transition-colors ${
                      favorites.includes(productName)
                        ? 'fill-rose-500 text-rose-500'
                        : 'text-gray-400 group-hover:text-rose-400'
                    }`}
                  />
                </Button>
              </div>

              {productPrices.length > 0 ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
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
                      <span className="font-medium text-emerald-400 truncate">{cheapestMarket.market_name}</span>
                      <SpeakPriceButton
                        product={productName}
                        price={lowestPrice}
                        unit={cheapestMarket.unit || 'kg'}
                        market={cheapestMarket.market_name}
                        className="ml-auto flex-shrink-0"
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
        <Card className="p-8 text-center dark-glass border-white/10">
          <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium text-base text-white mb-1">{t('noProductsFound')}</h3>
          <p className="text-sm text-muted-foreground">
            {t('tryDifferentSearch')}
          </p>
        </Card>
      )}
    </div>
  );
}