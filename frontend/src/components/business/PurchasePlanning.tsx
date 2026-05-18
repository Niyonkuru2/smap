import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { 
  ShoppingCart, 
  Calendar, 
  DollarSign, 
  TrendingDown, 
  TrendingUp,
  Lightbulb,
  ArrowRight,
  MapPin,
  Clock,
  AlertTriangle,
  Loader2,
  BarChart3,
  CheckCircle2,
  Zap
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getBestTimeToBuy, getMarketComparison, getPriceForecast } from '../../services/priceForecastService';
import { getLivePrices } from '../../lib/api';
import { useMarkets } from '../../hooks/useAppData';

interface PurchaseRecommendation {
  productId: number;
  productName: string;
  category: string;
  currentPrice: number;
  unit: string;
  bestMarketId: string;
  bestMarketName: string;
  bestPrice: number;
  potentialSavings: number;
  savingsPercentage: number;
  bestDay: string;
  bestDayIndex: number;
  bestTimeToBuy: string;
  forecastTrend: 'up' | 'down' | 'stable';
  forecastChange: number;
  confidence: number;
  urgency: 'high' | 'medium' | 'low';
  action: 'buy_now' | 'wait' | 'monitor';
  recommendationText: string;
  factors: string[];
}

export default function PurchasePlanning() {
  const { t } = useLanguage();
  const { markets: allMarkets } = useMarkets();
  const [recommendations, setRecommendations] = useState<PurchaseRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalSavings, setTotalSavings] = useState(0);
  const [urgentCount, setUrgentCount] = useState(0);

  useEffect(() => {
    fetchRecommendations();
  }, [allMarkets]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch live prices to get products
      const livePricesResponse = await getLivePrices();
      
      if (!livePricesResponse.success || !livePricesResponse.prices) {
        throw new Error('Failed to fetch live prices');
      }

      // Get unique products from prices
      const uniqueProducts = new Map();
      livePricesResponse.prices.forEach((price: any) => {
        if (!uniqueProducts.has(price.product_id)) {
          uniqueProducts.set(price.product_id, {
            id: price.product_id,
            name: price.product_name,
            unit: price.product_unit || price.unit || 'kg'
          });
        }
      });

      const products = Array.from(uniqueProducts.values());
      const recommendationsList: PurchaseRecommendation[] = [];

      // Fetch recommendations for each product
      for (const product of products) {
        try {
          // Get best time to buy (day of week analysis)
          const bestTimeData = await getBestTimeToBuy(product.id);
          
          // Get market comparison for best prices
          const marketComparison = await getMarketComparison(product.id);
          
          // Get first available market ID as fallback
          const defaultMarketId = allMarkets && allMarkets.length > 0 ? allMarkets[0].id : null;
          
          // Use best market from comparison or fallback to first market
          let marketIdForForecast = defaultMarketId;
          let bestMarketName = 'Unknown Market';
          let bestPrice = 0;
          
          if (marketComparison?.success && marketComparison.best_market) {
            marketIdForForecast = marketComparison.best_market.market_id;
            bestMarketName = marketComparison.best_market.market_name;
            bestPrice = marketComparison.best_market.average_price;
          } else if (defaultMarketId) {
            // Find market name
            const defaultMarket = allMarkets.find(m => m.id === defaultMarketId);
            bestMarketName = defaultMarket?.name || 'Default Market';
          }
          
          // Skip if no market available
          if (!marketIdForForecast) {
            console.warn(`No market available for product ${product.id}`);
            continue;
          }
          
          // Get 7-day forecast
          let forecast = null;
          try {
            forecast = await getPriceForecast(product.id, marketIdForForecast, 7);
          } catch (forecastErr) {
            console.warn(`Could not fetch forecast for product ${product.id}:`, forecastErr);
          }

          // Only proceed if we have best time data
          if (bestTimeData?.success) {
            // Get current price from live prices or forecast
            let currentPrice = 0;
            const currentPriceEntry = livePricesResponse.prices.find((p: any) => p.product_id === product.id);
            if (currentPriceEntry) {
              currentPrice = currentPriceEntry.price;
            } else if (forecast?.success) {
              currentPrice = forecast.current_price;
            } else {
              currentPrice = bestPrice || 1000; // Fallback price
            }
            
            const potentialSavings = currentPrice - bestPrice;
            const savingsPercentage = bestPrice > 0 ? (potentialSavings / currentPrice) * 100 : 0;
            
            // Determine urgency and action
            let urgency: 'high' | 'medium' | 'low' = 'medium';
            let action: 'buy_now' | 'wait' | 'monitor' = 'monitor';
            let recommendationText = '';
            let factors: string[] = [];

            const forecastData = forecast?.success ? forecast.predictions[0] : null;
            const isPriceIncreasing = forecastData?.trend === 'up' && forecastData.percentChange > 3;
            const isPriceDecreasing = forecastData?.trend === 'down' && forecastData.percentChange < -3;
            const isBestDayToday = bestTimeData.best_day_index === new Date().getDay();
            const hasValidSavings = savingsPercentage > 0;

            if (isPriceIncreasing && isBestDayToday && hasValidSavings) {
              urgency = 'high';
              action = 'buy_now';
              recommendationText = `⚠️ Prices expected to increase by ${Math.abs(forecastData.percentChange).toFixed(1)}% soon. Today is the best day to buy. Purchase immediately to maximize savings.`;
              factors = [`Price trend: +${forecastData.percentChange}% in 7 days`, `Today is ${bestTimeData.best_day} - lowest prices`, `Save ${savingsPercentage.toFixed(1)}% at ${bestMarketName}`];
            } 
            else if (isPriceIncreasing && hasValidSavings) {
              urgency = 'high';
              action = 'buy_now';
              recommendationText = `📈 Prices are rising! Buy now at ${bestMarketName} to save ${savingsPercentage.toFixed(1)}% before prices increase further.`;
              factors = [`Upward trend: +${forecastData.percentChange}% forecast`, `Best market: ${bestMarketName}`, `Save ${potentialSavings.toLocaleString()} RWF per ${product.unit}`];
            }
            else if (isPriceDecreasing && !isBestDayToday && hasValidSavings) {
              urgency = 'low';
              action = 'wait';
              recommendationText = `📉 Prices dropping. Wait ${bestTimeData.best_day} for best prices at ${bestMarketName}. Expected savings: ${savingsPercentage.toFixed(1)}%.`;
              factors = [`Downward trend: ${forecastData.percentChange}% forecast`, `Best day: ${bestTimeData.best_day}`, `Prices ${Math.abs(forecastData.percentChange)}% lower in 7 days`];
            }
            else if (isBestDayToday && savingsPercentage > 5 && hasValidSavings) {
              urgency = 'high';
              action = 'buy_now';
              recommendationText = `🎯 Today is ${bestTimeData.best_day} - best day to buy! Get ${product.name} at ${bestPrice.toLocaleString()} RWF/${product.unit} from ${bestMarketName}.`;
              factors = [`Best day of week: ${bestTimeData.best_day}`, `${savingsPercentage.toFixed(1)}% below average`, `Confidence: ${bestTimeData.confidence}%`];
            }
            else if (hasValidSavings) {
              urgency = 'medium';
              action = 'monitor';
              recommendationText = `Monitor prices at ${bestMarketName}. Best to buy on ${bestTimeData.best_day}s. Current savings potential: ${savingsPercentage.toFixed(1)}%.`;
              factors = [`Best market: ${bestMarketName}`, `Best day: ${bestTimeData.best_day}`, `Confidence: ${bestTimeData.confidence}%`];
            }
            else {
              urgency = 'low';
              action = 'monitor';
              recommendationText = `No significant savings found for ${product.name}. Monitor prices at ${bestMarketName} for future opportunities.`;
              factors = [`Best market: ${bestMarketName}`, `Best day: ${bestTimeData.best_day}`, `Prices are currently competitive`];
            }

            recommendationsList.push({
              productId: product.id,
              productName: product.name,
              category: product.category || 'General',
              currentPrice: currentPrice,
              unit: product.unit,
              bestMarketId: marketIdForForecast,
              bestMarketName: bestMarketName,
              bestPrice: bestPrice > 0 ? bestPrice : currentPrice,
              potentialSavings: Math.max(0, potentialSavings),
              savingsPercentage: Math.max(0, savingsPercentage),
              bestDay: bestTimeData.best_day,
              bestDayIndex: bestTimeData.best_day_index,
              bestTimeToBuy: `${bestTimeData.best_day}s`,
              forecastTrend: forecastData?.trend || 'stable',
              forecastChange: forecastData?.percentChange || 0,
              confidence: bestTimeData.confidence,
              urgency,
              action,
              recommendationText,
              factors
            });
          }
        } catch (err) {
          console.error(`Error fetching recommendations for product ${product.id}:`, err);
        }
      }

      // Sort by urgency and savings potential
      recommendationsList.sort((a, b) => {
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        if (a.urgency !== b.urgency) return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
        return b.savingsPercentage - a.savingsPercentage;
      });

      setRecommendations(recommendationsList);
      setTotalSavings(recommendationsList.reduce((sum, r) => sum + r.potentialSavings, 0));
      setUrgentCount(recommendationsList.filter(r => r.urgency === 'high').length);
      
    } catch (err) {
      console.error('Error fetching purchase recommendations:', err);
      setError('Failed to load purchase recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/30';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      default: return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    }
  };

  const getActionButton = (action: string) => {
    switch (action) {
      case 'buy_now': 
        return { text: 'Buy Now', color: 'bg-emerald-500 hover:bg-emerald-600', icon: <ShoppingCart className="h-4 w-4" /> };
      case 'wait':
        return { text: 'Best to Wait', color: 'bg-amber-500 hover:bg-amber-600', icon: <Clock className="h-4 w-4" /> };
      default:
        return { text: 'Monitor Price', color: 'bg-blue-500 hover:bg-blue-600', icon: <BarChart3 className="h-4 w-4" /> };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="mb-1 gradient-text text-2xl font-bold">Purchase Planning</h2>
          <p className="text-muted-foreground text-sm">Optimize your purchasing decisions</p>
        </div>
        <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-muted-foreground">Analyzing market data for recommendations...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="mb-1 gradient-text text-2xl font-bold">Purchase Planning</h2>
          <p className="text-muted-foreground text-sm">Optimize your purchasing decisions</p>
        </div>
        <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center gap-4 text-center">
              <AlertTriangle className="h-12 w-12 text-amber-400" />
              <p className="text-muted-foreground">{error}</p>
              <button 
                onClick={fetchRecommendations}
                className="px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="mb-1 gradient-text text-2xl font-bold">Purchase Planning</h2>
          <p className="text-muted-foreground text-sm">
            AI-powered recommendations to optimize your purchasing decisions
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
            <p className="text-xs text-muted-foreground">Total Potential Savings</p>
            <p className="text-xl font-bold text-emerald-400">{totalSavings.toLocaleString()} RWF</p>
          </div>
          {urgentCount > 0 && (
            <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30">
              <p className="text-xs text-muted-foreground">Urgent Opportunities</p>
              <p className="text-xl font-bold text-red-400">{urgentCount}</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Grid */}
      {recommendations.length > 0 ? (
        <div className="grid gap-4">
          {recommendations.map((rec, index) => {
            const actionBtn = getActionButton(rec.action);
            
            return (
              <Card 
                key={index} 
                className="rounded-xl dark-glass border-white/10 shadow-lg overflow-hidden hover:border-white/20 transition-all duration-300"
              >
                <CardContent className="p-0">
                  {/* Urgency Banner */}
                  <div className={`px-4 py-2 ${getUrgencyColor(rec.urgency)} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      {rec.urgency === 'high' && <AlertTriangle className="h-4 w-4" />}
                      {rec.urgency === 'medium' && <Clock className="h-4 w-4" />}
                      {rec.urgency === 'low' && <CheckCircle2 className="h-4 w-4" />}
                      <span className="text-sm font-medium capitalize">
                        {rec.urgency === 'high' ? 'Urgent - Act Now' : rec.urgency === 'medium' ? 'Monitor Closely' : 'Good Opportunity'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {rec.forecastTrend === 'up' && <TrendingUp className="h-4 w-4 text-red-400" />}
                      {rec.forecastTrend === 'down' && <TrendingDown className="h-4 w-4 text-emerald-400" />}
                      <span className={`text-sm font-medium ${rec.forecastTrend === 'up' ? 'text-red-400' : rec.forecastTrend === 'down' ? 'text-emerald-400' : 'text-gray-400'}`}>
                        {rec.forecastChange > 0 ? '+' : ''}{rec.forecastChange}% forecast
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    {/* Product Header */}
                    <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/20">
                          <ShoppingCart className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg">{rec.productName}</h3>
                          <p className="text-xs text-muted-foreground">per {rec.unit}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-center">
                          <p className="text-xs text-muted-foreground">Current</p>
                          <p className="font-semibold text-white">{rec.currentPrice.toLocaleString()} RWF</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
                          <p className="text-xs text-emerald-400">Best Price</p>
                          <p className="font-semibold text-emerald-400">{rec.bestPrice.toLocaleString()} RWF</p>
                        </div>
                      </div>
                    </div>

                    {/* Savings and Details */}
                    <div className="grid md:grid-cols-3 gap-4 mb-4">
                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="h-4 w-4 text-emerald-400" />
                          <p className="text-xs text-muted-foreground">Potential Savings</p>
                        </div>
                        <p className="text-lg font-bold text-emerald-400">
                          {rec.potentialSavings.toLocaleString()} RWF/{rec.unit}
                        </p>
                        <p className="text-xs text-muted-foreground">({rec.savingsPercentage.toFixed(1)}% below current)</p>
                      </div>

                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-primary" />
                          <p className="text-xs text-muted-foreground">Best Market</p>
                        </div>
                        <p className="font-semibold text-white">{rec.bestMarketName}</p>
                        <p className="text-xs text-muted-foreground mt-1">Confidence: {rec.confidence}%</p>
                      </div>

                      <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="h-4 w-4 text-primary" />
                          <p className="text-xs text-muted-foreground">Best Day to Buy</p>
                        </div>
                        <p className="font-semibold text-white">{rec.bestDay}s</p>
                        <p className="text-xs text-muted-foreground mt-1">{rec.bestTimeToBuy}</p>
                      </div>
                    </div>

                    {/* Recommendation */}
                    <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/30 mb-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-primary mb-1">AI Recommendation</p>
                          <p className="text-sm text-white">{rec.recommendationText}</p>
                        </div>
                      </div>
                    </div>

                    {/* Factors */}
                    <div className="mb-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Key Factors:</p>
                      <div className="flex flex-wrap gap-2">
                        {rec.factors.map((factor, i) => (
                          <span key={i} className="px-2 py-1 text-xs rounded-lg bg-white/5 border border-white/10 text-muted-foreground">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button 
                      className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${actionBtn.color}`}
                      onClick={() => {
                        window.location.href = `/consumer/market-comparison?product=${rec.productId}&market=${rec.bestMarketId}`;
                      }}
                    >
                      {actionBtn.icon}
                      {actionBtn.text}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
          <CardContent className="p-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <p className="text-white font-medium mb-1">No recommendations available</p>
            <p className="text-sm text-muted-foreground">
              Insufficient data to generate purchase recommendations. Please ensure there are enough price records in the system.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}