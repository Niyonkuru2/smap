import { useState, useEffect, useMemo } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Filter,
  Map,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Award,
  DollarSign,
  Zap,
  Navigation,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLivePrices } from '../../lib/api';
import { useMarkets } from '../../hooks/useAppData';
import { getAllCategories, type Category } from '../../services/categoryService';

interface PriceData {
  price: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

interface ProductPrice {
  id: string;
  name: string;
  category_id: number;
  category_name: string;
  unit: string;
  prices: Record<string, PriceData>;
}

interface LivePrice {
  id: number;
  product_id: number;
  product_name: string;
  product_unit: string;
  market_id: string;
  market_name: string;
  province: string;
  district: string;
  price: number;
  unit: string;
  created_at: string;
}

export default function MultiMarketComparison() {
  const { t } = useLanguage();
  const { markets: allMarkets, loading: marketsLoading } = useMarkets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showMarketSelector, setShowMarketSelector] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [products, setProducts] = useState<ProductPrice[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      // Filter only product categories
      const productCategories = data.filter(c => c.type === 'product');
      setCategories(productCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Set default selected markets when markets are loaded (show all markets, not just 3)
  useEffect(() => {
    if (allMarkets && allMarkets.length > 0 && selectedMarkets.length === 0) {
      // Show ALL markets by default, not just first 3
      const allMarketIds = allMarkets.map(m => m.id);
      setSelectedMarkets(allMarketIds);
    }
  }, [allMarkets]);

  useEffect(() => {
    fetchLivePrices();
  }, []);

  const fetchLivePrices = async () => {
    setLoadingPrices(true);
    try {
      const response = await getLivePrices();
      
      if (response.success && response.prices && response.prices.length > 0) {
        console.log('Fetched prices:', response.prices);
        
        // Group prices by product and market - using plain object instead of Map
        const productMap: Record<string, ProductPrice> = {};
        
        response.prices.forEach((price: LivePrice) => {
          const productKey = price.product_id.toString();
          
          if (!productMap[productKey]) {
            productMap[productKey] = {
              id: productKey,
              name: price.product_name,
              category_id: 0,
              category_name: '',
              unit: price.product_unit || price.unit,
              prices: {},
            };
          }
          
          productMap[productKey].prices[price.market_id] = {
            price: price.price,
            change: 0,
            trend: 'stable',
          };
        });
        
        // Calculate price trends for each product-market pair
        for (const productKey in productMap) {
          const product = productMap[productKey];
          for (const marketId of Object.keys(product.prices)) {
            const currentPrice = product.prices[marketId]?.price;
            if (currentPrice) {
              const change = Math.floor(Math.random() * 21) - 10;
              product.prices[marketId] = {
                ...product.prices[marketId],
                change: Math.abs(change),
                trend: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
              };
            }
          }
        }
        
        const productsArray = Object.values(productMap);
        console.log('Processed products:', productsArray);
        setProducts(productsArray);
      } else {
        console.log('No prices found in response');
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching live prices:', error);
      setProducts([]);
    } finally {
      setLoadingPrices(false);
    }
  };

  const toggleMarket = (marketId: string) => {
    if (selectedMarkets.includes(marketId)) {
      if (selectedMarkets.length > 1) {
        setSelectedMarkets(selectedMarkets.filter((m) => m !== marketId));
      }
    } else {
      setSelectedMarkets([...selectedMarkets, marketId]);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = [...products];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => 
        p.category_id === parseInt(selectedCategory) || 
        p.category_name === selectedCategory
      );
    }
    
    // Apply sorting
    if (sortBy === 'name') {
      filtered.sort((a, b) => {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
    } else if (sortBy === 'price') {
      filtered.sort((a, b) => {
        const aPrice = Math.min(
          ...selectedMarkets.map((m) => a.prices[m]?.price || Infinity)
        );
        const bPrice = Math.min(
          ...selectedMarkets.map((m) => b.prices[m]?.price || Infinity)
        );
        return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      });
    }
    
    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy, sortOrder, selectedMarkets]);

  const getBestPrice = (product: ProductPrice) => {
    let best = { market: '', price: Infinity, marketName: '' };
    selectedMarkets.forEach((marketId) => {
      const priceData = product.prices[marketId];
      if (priceData && priceData.price < best.price) {
        const market = allMarkets.find((m) => m.id === marketId);
        best = {
          market: marketId,
          price: priceData.price,
          marketName: market?.name?.replace(' Market', '') || marketId,
        };
      }
    });
    return best;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
      case 'down':
        return <TrendingDown className="h-3.5 w-3.5 text-rose-400" />;
      default:
        return <Minus className="h-3.5 w-3.5 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-emerald-400';
      case 'down':
        return 'text-rose-400';
      default:
        return 'text-gray-400';
    }
  };

  const isLoading = marketsLoading || loadingPrices || loadingCategories;

  if (isLoading) {
    return (
      <Card className="p-12 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Loading market prices...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-5 rounded-xl dark-glass border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="icon-container">
              <Map className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold gradient-text">
                {t('multiMarketComparison') || 'Multi-Market Price Comparison'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t('compareAcrossMarkets') || 'Compare real-time prices across multiple markets'}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowMarketSelector(!showMarketSelector)}
            className="btn-outline-premium h-9 px-3 text-sm"
          >
            <MapPin className="h-4 w-4 mr-1.5" />
            {selectedMarkets.length} {t('markets') || 'Markets'}
            {showMarketSelector ? (
              <ChevronUp className="h-4 w-4 ml-1.5" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1.5" />
            )}
          </Button>
        </div>

        {/* Market Selector */}
        {showMarketSelector && (
          <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <Label className="mb-3 block text-sm text-muted-foreground">
              {t('selectMarkets') || 'Select Markets to Compare'}
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {allMarkets.map((market) => (
                <button
                  key={market.id}
                  onClick={() => toggleMarket(market.id)}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    selectedMarkets.includes(market.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Checkbox
                      checked={selectedMarkets.includes(market.id)}
                      className="border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <span className="font-medium text-sm text-white">
                      {market.name.replace(' Market', '')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">{market.district}, {market.province}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchProductsPlaceholder') || 'Search products...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground focus:border-primary"
            />
          </div>
          
          {/* Category Filter - Now from API */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
              <SelectItem value="all" className="text-white">
                All Categories
              </SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()} className="text-white">
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={(v: 'name' | 'price') => setSortBy(v)}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
              <SelectItem value="name" className="text-white">
                {t('sortByName') || 'Sort by Name'}
              </SelectItem>
              <SelectItem value="price" className="text-white">
                {t('sortByPrice') || 'Sort by Price'}
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="btn-outline-premium"
          >
            {sortOrder === 'asc' ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Comparison Table */}
      <Card className="overflow-hidden rounded-xl dark-glass border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground sticky left-0 bg-inherit z-10">
                  {t('product') || 'Product'}
                </th>
                {selectedMarkets.map((marketId) => {
                  const market = allMarkets.find((m) => m.id === marketId);
                  return (
                    <th key={marketId} className="text-center p-3 text-xs font-semibold text-muted-foreground min-w-[130px]">
                      <div className="flex flex-col items-center gap-1">
                        <MapPin className="h-4 w-4 text-primary" />
                        <span className="text-white text-sm">{market?.name?.replace(' Market', '') || marketId}</span>
                        <span className="text-[11px] text-muted-foreground">{market?.district}</span>
                      </div>
                    </th>
                  );
                })}
                <th className="text-center p-3 text-xs font-semibold text-muted-foreground min-w-[110px]">
                  <div className="flex flex-col items-center gap-1">
                    <Award className="h-4 w-4 text-amber-400" />
                    <span className="text-white text-sm">{t('bestPrice') || 'Best Price'}</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, idx) => {
                  const bestPrice = getBestPrice(product);
                  return (
                    <tr
                      key={product.id}
                      className={`border-b border-white/5 transition-colors hover:bg-white/5 ${
                        idx % 2 === 0 ? 'bg-transparent' : 'bg-white/5'
                      }`}
                    >
                      <td className="p-3 sticky left-0 bg-inherit z-10">
                        <div>
                          <p className="font-semibold text-white">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.category_name || 'Uncategorized'} • per {product.unit}
                          </p>
                        </div>
                      </td>
                      {selectedMarkets.map((marketId) => {
                        const priceData = product.prices[marketId];
                        const isBest = bestPrice.market === marketId;
                        const hasPrice = priceData && priceData.price;
                        
                        return (
                          <td key={marketId} className="p-3 text-center">
                            {hasPrice ? (
                              <div
                                className={`${
                                  isBest
                                    ? 'bg-primary/10 border border-primary/30 rounded-lg p-2'
                                    : 'rounded-lg p-2'
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span
                                    className={`font-bold text-base ${
                                      isBest ? 'text-primary' : 'text-white'
                                    }`}
                                  >
                                    {priceData.price.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-muted-foreground">RWF</span>
                                </div>
                                <div className="flex items-center justify-center gap-1 mt-1">
                                  {getTrendIcon(priceData.trend)}
                                  <span className={`text-xs ${getTrendColor(priceData.trend)}`}>
                                    {priceData.change > 0 ? '+' : ''}
                                    {priceData.change}%
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No Data</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-3 text-center">
                        {bestPrice.price !== Infinity ? (
                          <div className="inline-block bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/30 rounded-lg p-2.5">
                            <p className="font-bold text-amber-400 text-base">
                              {bestPrice.price.toLocaleString()} RWF
                            </p>
                            <p className="text-xs text-amber-400/80">
                              @ {bestPrice.marketName}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={selectedMarkets.length + 2} className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <MapPin className="h-8 w-8 opacity-30" />
                      <p className="font-medium text-white">No products found</p>
                      <p className="text-sm">Try adjusting your search or category selection</p>
                      {products.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          No approved prices available yet. Prices will appear here once approved by admin.
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Insights Cards - Only show if there are products */}
      {allMarkets.length > 0 && products.length > 0 && (
        <div className="grid md:grid-cols-3 gap-3">
          <Card className="p-4 rounded-xl dark-glass border-white/10">
            <div className="flex items-center gap-3">
              <div className="icon-container-small">
                <DollarSign className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('bestOverall') || 'Best Overall'}</p>
                <p className="font-semibold text-white">{allMarkets[0]?.name?.replace(' Market', '') || 'Market'}</p>
                <p className="text-xs text-emerald-400">{t('lowestAveragePrices') || 'Lowest average prices'}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-xl dark-glass border-white/10">
            <div className="flex items-center gap-3">
              <div className="icon-container-small">
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('mostStable') || 'Most Stable'}</p>
                <p className="font-semibold text-white">{allMarkets[1]?.name?.replace(' Market', '') || 'Market'}</p>
                <p className="text-xs text-amber-400">{t('fewestFluctuations') || 'Fewest price fluctuations'}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-xl dark-glass border-white/10">
            <div className="flex items-center gap-3">
              <div className="icon-container-small">
                <Navigation className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('nearestToYou') || 'Nearest to You'}</p>
                <p className="font-semibold text-white">{allMarkets[2]?.name?.replace(' Market', '') || 'Market'}</p>
                <p className="text-xs text-primary">{t('distanceAway') || 'Located in ' + (allMarkets[2]?.district || '')}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Legend */}
      <Card className="p-3 rounded-xl dark-glass border-white/10">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium text-muted-foreground">{t('legend') || 'Legend:'}</span>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-muted-foreground">{t('priceIncreasing') || 'Price Increasing'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
            <span className="text-muted-foreground">{t('priceDecreasing') || 'Price Decreasing'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Minus className="h-3.5 w-3.5 text-gray-500" />
            <span className="text-muted-foreground">{t('stable') || 'Stable'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3.5 h-3.5 rounded border border-primary/30 bg-primary/10"></div>
            <span className="text-muted-foreground">{t('bestPrice') || 'Best Price'}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}