import { useState, useMemo, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  BarChart3,
  Loader2,
  Sparkles,
  Globe,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
  Filter
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMarkets } from '../../hooks/useAppData';
import { getLivePrices } from '../../lib/api';
import {
  getPriceForecast,
  getMarketComparison,
  type MarketComparison as MarketComparisonType
} from '../../services/priceForecastService';

const timeframes = [
  { value: '7', label: '7 Days' },
  { value: '14', label: '14 Days' },
  { value: '30', label: '30 Days' },
];

interface ProductInfo {
  id: number;
  name: string;
  unit: string;
  category: string;
}

interface ForecastDisplayData {
  id: number;
  product_id: number;
  product_name: string;
  category: string;
  currentPrice: number;
  unit: string;
  market_id: string;
  market_name: string;
  predictions: {
    days: number;
    price: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
    percentChange: number;
  }[];
  factors: string[];
  recommendation: {
    action: string;
    message: string;
    urgency: string;
    best_time: string;
  };
  data_points: number;
  volatility: number;
}

export default function PriceForecast() {
  const { t } = useLanguage();
  const { markets: allMarkets, loading: marketsLoading } = useMarkets();
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('7');
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMarketSelector, setShowMarketSelector] = useState(false);
  const [forecasts, setForecasts] = useState<ForecastDisplayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marketComparisons, setMarketComparisons] = useState<Map<number, MarketComparisonType>>(new Map());
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch products from live prices
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getLivePrices();
        
        if (response.success && response.prices) {
          // Extract unique products from prices
          const uniqueProducts = new Map<number, ProductInfo>();
          const uniqueCategories = new Set<string>();
          
          response.prices.forEach((price: any) => {
            if (!uniqueProducts.has(price.product_id)) {
              // Determine category based on product name (you can adjust this logic)
              let category = 'Other';
              const productName = price.product_name.toLowerCase();
              if (['rice', 'beans', 'maize', 'wheat', 'soy'].some(c => productName.includes(c))) {
                category = 'Grains';
              } else if (['tomato', 'onion', 'potato', 'carrot', 'cabbage'].some(c => productName.includes(c))) {
                category = 'Vegetables';
              } else if (['banana', 'apple', 'orange', 'mango', 'avocado'].some(c => productName.includes(c))) {
                category = 'Fruits';
              } else if (['milk', 'cheese', 'butter', 'egg'].some(c => productName.includes(c))) {
                category = 'Dairy';
              } else if (['chicken', 'beef', 'goat', 'fish'].some(c => productName.includes(c))) {
                category = 'Meat';
              }
              
              uniqueCategories.add(category);
              
              uniqueProducts.set(price.product_id, {
                id: price.product_id,
                name: price.product_name,
                unit: price.product_unit || price.unit || 'kg',
                category: category
              });
            }
          });
          
          setProducts(Array.from(uniqueProducts.values()));
          setCategories(['All', ...Array.from(uniqueCategories).sort()]);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    
    fetchProducts();
  }, []);

  // Set default selected markets when markets are loaded
  useEffect(() => {
    if (allMarkets && allMarkets.length > 0 && selectedMarkets.length === 0) {
      const defaultMarkets = allMarkets.slice(0, 3).map(m => m.id);
      setSelectedMarkets(defaultMarkets);
    }
  }, [allMarkets]);

  // Fetch forecasts for selected markets and products
  useEffect(() => {
    if (products.length > 0 && selectedMarkets.length > 0) {
      fetchAllForecasts();
    }
  }, [selectedMarkets, products]);

  const fetchAllForecasts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const allForecasts: ForecastDisplayData[] = [];
      const comparisonsMap = new Map<number, MarketComparisonType>();
      
      // Fetch forecasts for each product and each selected market
      for (const product of products) {
        let bestForecast: ForecastDisplayData | null = null;
        
        for (const marketId of selectedMarkets) {
          try {
            // FIXED: Removed parseInt() - marketId is already a string
            const forecast = await getPriceForecast(product.id, marketId, 30);
            
            if (forecast && forecast.success) {
              const forecastData: ForecastDisplayData = {
                id: product.id,
                product_id: forecast.product_id,
                product_name: forecast.product_name,
                category: product.category,
                currentPrice: forecast.current_price,
                unit: product.unit,
                market_id: forecast.market_id,
                market_name: forecast.market_name,
                predictions: forecast.predictions.map(p => ({
                  days: p.days,
                  price: p.price,
                  confidence: p.confidence,
                  trend: p.trend,
                  percentChange: p.percentChange
                })),
                factors: forecast.factors,
                recommendation: forecast.recommendation,
                data_points: forecast.data_points,
                volatility: forecast.volatility
              };
              
              // Keep the forecast with highest confidence or first one
              if (!bestForecast || (forecastData.predictions[0]?.confidence || 0) > (bestForecast.predictions[0]?.confidence || 0)) {
                bestForecast = forecastData;
              }
            }
          } catch (err) {
            console.error(`Error fetching forecast for product ${product.id}, market ${marketId}:`, err);
          }
        }
        
        if (bestForecast) {
          allForecasts.push(bestForecast);
          
          // Fetch market comparison for this product
          try {
            const comparison = await getMarketComparison(product.id);
            if (comparison?.success) {
              comparisonsMap.set(product.id, comparison);
            }
          } catch (err) {
            console.error(`Error fetching market comparison for product ${product.id}:`, err);
          }
        }
      }
      
      setForecasts(allForecasts);
      setMarketComparisons(comparisonsMap);
    } catch (err) {
      console.error('Error fetching forecasts:', err);
      setError('Failed to load forecast data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllForecasts();
    setIsRefreshing(false);
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

  const filteredForecasts = useMemo(() => {
    let filtered = [...forecasts];
    
    // Apply category filter
    if (selectedCategory !== 'all' && selectedCategory !== 'All') {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }
    
    return filtered;
  }, [forecasts, selectedCategory]);

  const getTrendIcon = (trend: string, size = 'h-5 w-5') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className={`${size} text-amber-400`} />;
      case 'down':
        return <TrendingDown className={`${size} text-emerald-400`} />;
      default:
        return <Minus className={`${size} text-gray-500`} />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (confidence >= 65) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  };

  const getPriceChange = (current: number, predicted: number) => {
    const change = ((predicted - current) / current) * 100;
    return change.toFixed(1);
  };

  const getTrendText = (trend: string) => {
    if (trend === 'up') return t('increase') || 'increase';
    if (trend === 'down') return t('decrease') || 'decrease';
    return t('remainStable') || 'remain stable';
  };

  const getActionButtonColor = (action: string) => {
    switch (action) {
      case 'buy_now':
        return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
      case 'wait':
        return 'bg-amber-500/20 border-amber-500/50 text-amber-400';
      default:
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    }
  };

  const isLoading = marketsLoading || loading;

  if (isLoading && forecasts.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="p-12 rounded-xl dark-glass border-white/10">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-muted-foreground">{t('loadingForecasts') || 'Loading AI forecasts...'}</p>
            <p className="text-xs text-muted-foreground">{t('analyzingData') || 'Analyzing historical price data and market patterns'}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Card className="p-12 rounded-xl dark-glass border-white/10">
          <div className="flex flex-col items-center justify-center gap-4">
            <AlertTriangle className="h-8 w-8 text-amber-400" />
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="btn-outline-premium">
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('tryAgain') || 'Try Again'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-5 rounded-xl dark-glass border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="icon-container">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold gradient-text">{t('priceForecast') || 'AI Price Forecast'}</h2>
              <p className="text-sm text-muted-foreground">
                {t('forecastDesc') || 'Machine learning predictions for future market prices'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
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
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn-outline-premium"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? (t('updating') || 'Updating...') : (t('refresh') || 'Refresh')}
            </Button>
          </div>
        </div>

        {/* Market Selector */}
        {showMarketSelector && (
          <div className="mb-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <Label className="mb-3 block text-sm text-muted-foreground">
              {t('selectMarkets') || 'Select Markets to Analyze'}
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
        <div className="flex flex-wrap gap-4">
          {categories.length > 1 && (
            <div>
              <Label className="mb-1.5 block text-xs text-muted-foreground">{t('category') || 'Category'}</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-white">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="text-white">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div>
            <Label className="mb-1.5 block text-xs text-muted-foreground">{t('forecastPeriod') || 'Forecast Period'}</Label>
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-[150px] bg-white/5 border-white/10 text-white">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                {timeframes.map(tf => (
                  <SelectItem key={tf.value} value={tf.value} className="text-white">{tf.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Model Info Card */}
      <Card className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30">
        <div className="flex items-start gap-3">
          <div className="icon-container-small flex-shrink-0 mt-0.5">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-white mb-1">{t('howAIWorks') || 'How our AI predictions work:'}</p>
            <p className="text-xs">
              {t('aiDescription') || 'Our model analyzes historical price data, seasonal patterns, supply chain factors, and market trends using statistical regression and machine learning algorithms. Confidence scores indicate prediction reliability based on data availability and market stability.'}
            </p>
          </div>
        </div>
      </Card>

      {/* Predictions Grid */}
      {filteredForecasts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredForecasts.map((forecast) => {
            const forecastData = forecast.predictions.find(p => p.days === parseInt(selectedTimeframe));
            const priceChange = forecastData ? getPriceChange(forecast.currentPrice, forecastData.price) : '0';
            const isSelected = selectedProduct === forecast.id;
            const comparison = marketComparisons.get(forecast.id);

            return (
              <Card
                key={forecast.id}
                className={`rounded-xl dark-glass border-white/10 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 cursor-pointer ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedProduct(isSelected ? null : forecast.id)}
              >
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-white">{forecast.product_name}</h3>
                      <p className="text-xs text-muted-foreground">{forecast.category}</p>
                      {comparison?.best_market && (
                        <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          Best: {comparison.best_market.market_name}
                        </p>
                      )}
                    </div>
                    {forecastData && (
                      <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getConfidenceColor(forecastData.confidence)}`}>
                        {forecastData.confidence}% {t('confidence') || 'confidence'}
                      </div>
                    )}
                  </div>

                  {/* Price Comparison */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-muted-foreground">{t('current') || 'Current'}</p>
                      <p className="text-xl font-bold text-white">{forecast.currentPrice.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">RWF/{forecast.unit}</p>
                      {forecast.data_points && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Based on {forecast.data_points} data points
                        </p>
                      )}
                    </div>
                    {forecastData && (
                      <div className={`p-3 rounded-lg border ${
                        forecastData.trend === 'down' ? 'bg-emerald-500/10 border-emerald-500/30' :
                        forecastData.trend === 'up' ? 'bg-amber-500/10 border-amber-500/30' :
                        'bg-gray-500/10 border-gray-500/30'
                      }`}>
                        <p className="text-xs text-muted-foreground">{selectedTimeframe}-{t('day') || 'Day'}</p>
                        <p className="text-xl font-bold text-white flex items-center gap-1">
                          {forecastData.price.toLocaleString()}
                          {getTrendIcon(forecastData.trend, 'h-4 w-4')}
                        </p>
                        <p className={`text-xs font-medium ${
                          parseFloat(priceChange) > 0 ? 'text-amber-400' :
                          parseFloat(priceChange) < 0 ? 'text-emerald-400' :
                          'text-gray-400'
                        }`}>
                          {parseFloat(priceChange) > 0 ? '+' : ''}{priceChange}%
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Trend Indicator */}
                  <div className="flex items-center gap-2 mb-3">
                    {getTrendIcon(forecastData?.trend || 'stable')}
                    <span className="text-sm text-muted-foreground">
                      {t('priceExpectedTo') || 'Price expected to'} {getTrendText(forecastData?.trend || 'stable')}
                    </span>
                  </div>

                  {/* Volatility Indicator */}
                  {forecast.volatility && (
                    <div className="flex items-center gap-2 mb-3 text-xs">
                      <BarChart3 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Volatility: {(forecast.volatility * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {/* Expanded Details */}
                  {isSelected && (
                    <div className="pt-3 border-t border-white/10 mt-3 space-y-3 animate-fadeIn">
                      {/* All Timeframe Predictions */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {t('forecastTimeline') || 'Forecast Timeline:'}
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {forecast.predictions.map((pred) => (
                            <div 
                              key={pred.days}
                              className={`p-2 rounded-lg text-center transition-all ${
                                pred.days === parseInt(selectedTimeframe) 
                                  ? 'bg-primary/20 border border-primary/50' 
                                  : 'bg-white/5 border border-white/10'
                              }`}
                            >
                              <p className="text-xs text-muted-foreground">{pred.days}d</p>
                              <p className="font-semibold text-sm text-white">{pred.price.toLocaleString()}</p>
                              <p className="text-xs text-muted-foreground">{pred.confidence}%</p>
                              <div className="flex justify-center mt-1">
                                {getTrendIcon(pred.trend, 'h-3 w-3')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Factors */}
                      {forecast.factors && forecast.factors.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Globe className="h-3 w-3" /> {t('keyFactors') || 'Key Factors:'}
                          </p>
                          <ul className="text-xs space-y-1">
                            {forecast.factors.map((factor, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <ChevronRight className="h-3 w-3 mt-0.5 text-primary" />
                                <span className="text-muted-foreground">{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Market Comparison */}
                      {comparison && comparison.success && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {t('marketComparison') || 'Market Comparison:'}
                          </p>
                          <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                            <p className="text-sm text-white">
                              Best price at <span className="font-semibold text-emerald-400">{comparison.best_market.market_name}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Average: {comparison.best_market.average_price.toLocaleString()} RWF/{forecast.unit}
                              {comparison.best_market.savings_percentage > 0 && (
                                <span className="text-emerald-400 ml-2">
                                  Save {comparison.best_market.savings_percentage}%
                                </span>
                              )}
                            </p>
                            {comparison.markets && comparison.markets.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-white/10">
                                <p className="text-xs text-muted-foreground mb-1">All markets:</p>
                                <div className="space-y-1">
                                  {comparison.markets.slice(0, 3).map((market) => (
                                    <p key={market.market_id} className="text-xs">
                                      {market.market_name}: {market.average_price.toLocaleString()} RWF
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Recommendation */}
                      {forecast.recommendation && (
                        <div className={`p-3 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border ${getActionButtonColor(forecast.recommendation.action)}`}>
                          <p className="text-xs font-medium flex items-center gap-1 mb-1">
                            <Lightbulb className="h-3 w-3" /> {t('aiRecommendation') || 'AI Recommendation:'}
                          </p>
                          <p className="text-sm text-white">{forecast.recommendation.message}</p>
                          {forecast.recommendation.urgency === 'high' && (
                            <p className="text-xs text-amber-400 mt-1">⚠️ {t('urgent') || 'Time-sensitive recommendation'}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-12 rounded-xl dark-glass border-white/10">
          <div className="flex flex-col items-center justify-center gap-4 text-center">
            <Brain className="h-12 w-12 text-muted-foreground opacity-30" />
            <div>
              <p className="text-white font-medium mb-1">No forecasts available</p>
              <p className="text-sm text-muted-foreground">
                {selectedMarkets.length === 0 
                  ? 'Please select at least one market to see forecasts' 
                  : products.length === 0
                  ? 'No products found in the database'
                  : 'No forecast data available for the selected filters'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      {filteredForecasts.length > 0 && (
        <div className="grid md:grid-cols-3 gap-3">
          <Card className="p-4 rounded-xl dark-glass border-white/10">
            <div className="flex items-center gap-3">
              <div className="icon-container-small">
                <TrendingDown className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('expectedToDecrease') || 'Expected to Decrease'}</p>
                <p className="font-bold text-xl text-white">
                  {filteredForecasts.filter(f => f.predictions.find(p => p.days === parseInt(selectedTimeframe))?.trend === 'down').length}
                </p>
                <p className="text-xs text-emerald-400">{t('goodTimeToWait') || 'Good time to wait'}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-xl dark-glass border-white/10">
            <div className="flex items-center gap-3">
              <div className="icon-container-small">
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('expectedToIncrease') || 'Expected to Increase'}</p>
                <p className="font-bold text-xl text-white">
                  {filteredForecasts.filter(f => f.predictions.find(p => p.days === parseInt(selectedTimeframe))?.trend === 'up').length}
                </p>
                <p className="text-xs text-amber-400">{t('considerBuyingNow') || 'Consider buying now'}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 rounded-xl dark-glass border-white/10">
            <div className="flex items-center gap-3">
              <div className="icon-container-small">
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('averageConfidence') || 'Average Confidence'}</p>
                <p className="font-bold text-xl text-white">
                  {filteredForecasts.length > 0 
                    ? Math.round(filteredForecasts.reduce((acc, f) => {
                        const pred = f.predictions.find(p => p.days === parseInt(selectedTimeframe));
                        return acc + (pred?.confidence || 0);
                      }, 0) / filteredForecasts.length)
                    : 0}%
                </p>
                <p className="text-xs text-primary">{t('modelAccuracy') || 'Model accuracy'}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Disclaimer */}
      <Card className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-amber-400">{t('importantDisclaimer') || 'Important Disclaimer'}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t('disclaimerText') || 'These predictions are generated by AI models based on historical data and market patterns. Actual prices may vary due to unforeseen circumstances. Use this information as a guide, not a guarantee. Always verify current prices before making purchasing decisions.'}
            </p>
          </div>
        </div>
      </Card>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}