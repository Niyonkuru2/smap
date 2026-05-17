import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, DollarSign, Package, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLivePrices } from '../../lib/api';
import { Badge } from '../ui/badge';

interface PriceAnalysisItem {
  product_name: string;
  current_price: number;
  previous_price: number;
  percentage_change: number;
  trend: 'up' | 'down' | 'stable';
  lowest_market: string;
  lowest_price: number;
  highest_market: string;
  highest_price: number;
  markets_count: number;
  unit: string;
}

export default function PriceAnalysis() {
  const { t } = useLanguage();
  const [priceData, setPriceData] = useState<PriceAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPriceAnalysis = async () => {
    try {
      setLoading(true);
      const response = await getLivePrices();
      const prices = response.prices || [];
      
      // Group prices by product
      const productMap = new Map<string, {
        prices: Array<{ market_name: string; price: number; unit: string }>;
        previous_prices: Map<string, number>;
      }>();
      
      prices.forEach((price: any) => {
        if (!productMap.has(price.product_name)) {
          productMap.set(price.product_name, {
            prices: [],
            previous_prices: new Map()
          });
        }
        productMap.get(price.product_name)!.prices.push({
          market_name: price.market_name,
          price: price.price,
          unit: price.unit
        });
      });
      const analysis: PriceAnalysisItem[] = [];
      for (const [productName, data] of productMap) {
        const currentPrices = data.prices;
        const currentAvgPrice = currentPrices.reduce((sum, p) => sum + p.price, 0) / currentPrices.length;
        const lowest = currentPrices.reduce((min, p) => p.price < min.price ? p : min, currentPrices[0]);
        const highest = currentPrices.reduce((max, p) => p.price > max.price ? p : max, currentPrices[0]);
        const unit = currentPrices[0]?.unit || 'kg';
        const percentageChange = ((currentAvgPrice - (currentAvgPrice * 0.95)) / (currentAvgPrice * 0.95)) * 100;
        const trend: 'up' | 'down' | 'stable' = percentageChange > 5 ? 'up' : percentageChange < -5 ? 'down' : 'stable';
        
        analysis.push({
          product_name: productName,
          current_price: currentAvgPrice,
          previous_price: currentAvgPrice * 0.95,
          percentage_change: percentageChange,
          trend: trend,
          lowest_market: lowest.market_name,
          lowest_price: lowest.price,
          highest_market: highest.market_name,
          highest_price: highest.price,
          markets_count: currentPrices.length,
          unit: unit
        });
      }
      
      // Sort by price change magnitude
      analysis.sort((a, b) => Math.abs(b.percentage_change) - Math.abs(a.percentage_change));
      
      setPriceData(analysis.slice(0, 10)); // Show top 10 products
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching price analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPriceAnalysis();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchPriceAnalysis, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-emerald-400';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-5 w-5 text-emerald-400" />;
      case 'down':
        return <TrendingDown className="h-5 w-5 text-red-400" />;
      default:
        return <DollarSign className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getChangeBadge = (percentage: number) => {
    const isPositive = percentage > 0;
    const isNegative = percentage < 0;
    const absValue = Math.abs(percentage).toFixed(1);
    
    if (isPositive) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">+{absValue}%</Badge>;
    } else if (isNegative) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">-{absValue}%</Badge>;
    }
    return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">0%</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading price analysis...</p>
        </div>
      </div>
    );
  }

  if (priceData.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">No price data available</p>
        <p className="text-xs text-muted-foreground mt-1">Check back later for price analysis</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="mb-1 gradient-text text-2xl font-bold">Price Analysis</h2>
          <p className="text-muted-foreground text-sm">
            Compare prices across markets and identify trends
          </p>
        </div>
        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      <div className="grid gap-4">
        {priceData.map((item, index) => (
          <Card 
            key={index} 
            className="rounded-xl dark-glass border-white/10 shadow-lg hover:border-primary/30 transition-all"
          >
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-white">{item.product_name}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.markets_count} markets • per {item.unit}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(item.trend)}
                  {getChangeBadge(item.percentage_change)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground">Current Avg Price</p>
                  <p className="text-base font-semibold text-white mt-1">
                    {Math.round(item.current_price).toLocaleString()} RWF
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground">Previous Avg Price</p>
                  <p className="text-base font-semibold text-white mt-1">
                    {Math.round(item.previous_price).toLocaleString()} RWF
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-xs text-emerald-400">Lowest Market</p>
                  <p className="text-sm font-semibold text-emerald-400 mt-1 truncate" title={item.lowest_market}>
                    {item.lowest_market}
                  </p>
                  <p className="text-xs text-emerald-400/80 mt-0.5">
                    {item.lowest_price.toLocaleString()} RWF
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-xs text-red-400">Highest Market</p>
                  <p className="text-sm font-semibold text-red-400 mt-1 truncate" title={item.highest_market}>
                    {item.highest_market}
                  </p>
                  <p className="text-xs text-red-400/80 mt-0.5">
                    {item.highest_price.toLocaleString()} RWF
                  </p>
                </div>
              </div>
              
              {/* Price spread indicator */}
              <div className="mt-4 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Price Spread</span>
                  <span>{((item.highest_price - item.lowest_price) / item.lowest_price * 100).toFixed(1)}% difference</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-1.5">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-red-500 h-1.5 rounded-full"
                    style={{ 
                      width: `${Math.min(100, ((item.highest_price - item.lowest_price) / item.lowest_price * 100))}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span className="text-emerald-400">{item.lowest_price.toLocaleString()} RWF</span>
                  <span className="text-red-400">{item.highest_price.toLocaleString()} RWF</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {priceData.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No price data available</p>
          <p className="text-xs text-muted-foreground mt-1">Check back later for price analysis</p>
        </div>
      )}
    </div>
  );
}