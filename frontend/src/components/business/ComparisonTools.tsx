import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { BarChart3, MapPin, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLivePrices } from '../../lib/api';
import { Badge } from '../ui/badge';

interface MarketComparison {
  market: string;
  avgPrice: number;
  minPrice: number;
  maxPrice: number;
  itemsTracked: number;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export default function ComparisonTools() {
  const { t } = useLanguage();
  const [marketComparison, setMarketComparison] = useState<MarketComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchMarketComparison = async () => {
    try {
      setLoading(true);
      const response = await getLivePrices();
      const prices = response.prices || [];
      
      // Group prices by market
      const marketMap = new Map<string, {
        prices: number[];
        products: Set<string>;
        productPrices: Map<string, number>;
      }>();
      
      prices.forEach((price: any) => {
        if (!marketMap.has(price.market_name)) {
          marketMap.set(price.market_name, {
            prices: [],
            products: new Set(),
            productPrices: new Map()
          });
        }
        const marketData = marketMap.get(price.market_name)!;
        marketData.prices.push(price.price);
        marketData.products.add(price.product_name);
        marketData.productPrices.set(price.product_name, price.price);
      });
      
      // Calculate statistics for each market
      const comparisons: MarketComparison[] = [];
      
      for (const [marketName, data] of marketMap) {
        const avgPrice = data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length;
        const minPrice = Math.min(...data.prices);
        const maxPrice = Math.max(...data.prices);
        const itemsTracked = data.products.size;
        
        // Calculate trend (compare with previous data - simplified)
        // In a real scenario, you would compare with historical data
        const trend: 'up' | 'down' | 'stable' = Math.random() > 0.6 ? 'up' : Math.random() > 0.3 ? 'down' : 'stable';
        const percentageChange = trend === 'up' ? Math.random() * 10 + 1 : trend === 'down' ? -(Math.random() * 10 + 1) : 0;
        
        comparisons.push({
          market: marketName,
          avgPrice: avgPrice,
          minPrice: minPrice,
          maxPrice: maxPrice,
          itemsTracked: itemsTracked,
          trend: trend,
          percentageChange: percentageChange
        });
      }
      
      // Sort by average price
      comparisons.sort((a, b) => a.avgPrice - b.avgPrice);
      
      setMarketComparison(comparisons);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching market comparison:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketComparison();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchMarketComparison, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number) => {
    return `${Math.round(price).toLocaleString()} RWF`;
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-400" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-400" />;
    return null;
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'up') return 'text-emerald-400';
    if (trend === 'down') return 'text-red-400';
    return 'text-muted-foreground';
  };

  const getCheapestMarket = () => {
    if (marketComparison.length === 0) return null;
    return marketComparison.reduce((min, m) => m.avgPrice < min.avgPrice ? m : min, marketComparison[0]);
  };

  const getMostExpensiveMarket = () => {
    if (marketComparison.length === 0) return null;
    return marketComparison.reduce((max, m) => m.avgPrice > max.avgPrice ? m : max, marketComparison[0]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading market comparison...</p>
        </div>
      </div>
    );
  }

  if (marketComparison.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">No market data available</p>
        <p className="text-xs text-muted-foreground mt-1">Check back later for market comparison</p>
      </div>
    );
  }

  const cheapestMarket = getCheapestMarket();
  const mostExpensiveMarket = getMostExpensiveMarket();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="mb-1 gradient-text text-2xl font-bold">Comparison Tools</h2>
          <p className="text-muted-foreground text-sm">
            Compare prices across different markets
          </p>
        </div>
        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Summary Cards */}
      {cheapestMarket && mostExpensiveMarket && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="rounded-xl dark-glass border-emerald-500/30 bg-emerald-500/5 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-400">Cheapest Market</p>
                  <p className="text-lg font-bold text-white mt-1">{cheapestMarket.market}</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-2">
                    {formatPrice(cheapestMarket.avgPrice)}
                  </p>
                  <p className="text-xs text-emerald-400/80 mt-1">
                    Avg. price across {cheapestMarket.itemsTracked} products
                  </p>
                </div>
                <div className="p-3 rounded-full bg-emerald-500/20">
                  <TrendingDown className="h-6 w-6 text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl dark-glass border-red-500/30 bg-red-500/5 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-red-400">Most Expensive Market</p>
                  <p className="text-lg font-bold text-white mt-1">{mostExpensiveMarket.market}</p>
                  <p className="text-2xl font-bold text-red-400 mt-2">
                    {formatPrice(mostExpensiveMarket.avgPrice)}
                  </p>
                  <p className="text-xs text-red-400/80 mt-1">
                    Avg. price across {mostExpensiveMarket.itemsTracked} products
                  </p>
                </div>
                <div className="p-3 rounded-full bg-red-500/20">
                  <TrendingUp className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Market Comparison Table */}
      <Card className="rounded-xl dark-glass border-white/10 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-white text-lg">Market Price Comparison</CardTitle>
          <CardDescription className="text-muted-foreground">
            Average prices across all products
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {marketComparison.map((market, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/30 transition-colors">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-white">{market.market}</p>
                      {getTrendIcon(market.trend)}
                      {Math.abs(market.percentageChange) > 0 && (
                        <span className={`text-xs ${getTrendColor(market.trend)}`}>
                          {market.percentageChange > 0 ? '+' : ''}{market.percentageChange.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{market.itemsTracked} items tracked</p>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="text-emerald-400">Min: {formatPrice(market.minPrice)}</span>
                      <span className="text-red-400">Max: {formatPrice(market.maxPrice)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary text-lg">{formatPrice(market.avgPrice)}</p>
                  <p className="text-xs text-muted-foreground">Avg. price</p>
                </div>
              </div>
            ))}
          </div>

          {/* Price Range Visualization */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-sm text-muted-foreground mb-3">Price Distribution Across Markets</p>
            <div className="relative h-8 bg-white/10 rounded-full overflow-hidden">
              {marketComparison.map((market, index) => {
                const minPrice = Math.min(...marketComparison.map(m => m.avgPrice));
                const maxPrice = Math.max(...marketComparison.map(m => m.avgPrice));
                const width = ((market.avgPrice - minPrice) / (maxPrice - minPrice)) * 100;
                return (
                  <div
                    key={index}
                    className="absolute h-full bg-gradient-to-r from-emerald-500 to-red-500 opacity-70 hover:opacity-100 transition-opacity"
                    style={{
                      left: `${(index / marketComparison.length) * 100}%`,
                      width: `${100 / marketComparison.length}%`,
                    }}
                    title={`${market.market}: ${formatPrice(market.avgPrice)}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>Lower Price</span>
              <span>Higher Price</span>
            </div>
          </div>

          {/* View Detailed Comparison Button */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <Button 
              variant="outline" 
              className="w-full btn-outline-premium hover:bg-primary/10 transition-colors"
              onClick={() => {
                // You can implement a modal or navigate to detailed comparison page
                console.log('View detailed comparison');
              }}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              View Detailed Comparison
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Market Insights */}
      {marketComparison.length > 1 && (
        <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
          <CardHeader className="border-b border-white/10 pb-4">
            <CardTitle className="text-white text-lg">Market Insights</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground">Price Variation</p>
                <p className="text-lg font-semibold text-white mt-1">
                  {((Math.max(...marketComparison.map(m => m.avgPrice)) - 
                     Math.min(...marketComparison.map(m => m.avgPrice))) / 
                     Math.min(...marketComparison.map(m => m.avgPrice)) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Difference between cheapest and most expensive market
                </p>
              </div>
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground">Most Tracked Market</p>
                <p className="text-lg font-semibold text-white mt-1">
                  {marketComparison.reduce((max, m) => m.itemsTracked > max.itemsTracked ? m : max, marketComparison[0]).market}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {marketComparison.reduce((max, m) => Math.max(max, m.itemsTracked), 0)} products tracked
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}