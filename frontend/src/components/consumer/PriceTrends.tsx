import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Calendar, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLivePrices } from '../../lib/api';
import { toast } from 'sonner';

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

interface PriceHistoryItem {
  date: string;
  price: number;
  formattedDate: string;
}

interface ProductPriceData {
  productId: number;
  productName: string;
  productUnit: string;
  marketId: string;
  marketName: string;
  province: string;
  district: string;
  currentPrice: number;
  averagePrice: number;
  highestPrice: number;
  lowestPrice: number;
  priceHistory: PriceHistoryItem[];
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
}

export default function PriceTrends() {
  const [livePrices, setLivePrices] = useState<LivePrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedMarket, setSelectedMarket] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [productPriceData, setProductPriceData] = useState<ProductPriceData | null>(null);
  const { t } = useLanguage();

  // Get unique products from live prices
  const uniqueProducts = [...new Map(
    livePrices.map(p => [p.product_id, { id: p.product_id, name: p.product_name, unit: p.product_unit }])
  ).values()];

  // Get unique markets from live prices for selected product
  const getMarketsForProduct = (productId: string) => {
    return [...new Map(
      livePrices
        .filter(p => p.product_id.toString() === productId)
        .map(p => [p.market_id, { id: p.market_id, name: p.market_name, province: p.province, district: p.district }])
    ).values()];
  };

  const marketsForProduct = selectedProduct ? getMarketsForProduct(selectedProduct) : [];

  // Fetch live prices
  const fetchLivePrices = async () => {
    try {
      setRefreshing(true);
      const response = await getLivePrices();
      if (response.success && response.prices) {
        setLivePrices(response.prices);
      }
    } catch (error) {
      console.error('Error fetching live prices:', error);
      toast.error('Failed to load price data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLivePrices();
    // Refresh every 5 minutes
    const interval = setInterval(fetchLivePrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate price trends when selection changes
  useEffect(() => {
    if (selectedProduct && selectedMarket && livePrices.length > 0) {
      calculateProductPriceData();
    } else {
      setProductPriceData(null);
    }
  }, [selectedProduct, selectedMarket, livePrices, timeRange]);

  const calculateProductPriceData = () => {
    const productPrices = livePrices.filter(
      p => p.product_id.toString() === selectedProduct && p.market_id === selectedMarket
    );

    if (productPrices.length === 0) {
      setProductPriceData(null);
      return;
    }

    // Sort by date (oldest first for history)
    const sortedPrices = [...productPrices].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const currentPrice = sortedPrices[sortedPrices.length - 1].price;
    const prices = sortedPrices.map(p => p.price);
    const averagePrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const highestPrice = Math.max(...prices);
    const lowestPrice = Math.min(...prices);

    // Create price history based on time range
    const daysToShow = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToShow);

    // Group prices by day
    const priceByDay = new Map<string, { date: Date; prices: number[] }>();
    
    sortedPrices.forEach(price => {
      const priceDate = new Date(price.created_at);
      if (priceDate >= cutoffDate) {
        const dateKey = priceDate.toISOString().split('T')[0];
        if (!priceByDay.has(dateKey)) {
          priceByDay.set(dateKey, { date: priceDate, prices: [] });
        }
        priceByDay.get(dateKey)!.prices.push(price.price);
      }
    });

    // Calculate daily average prices
    const priceHistory: PriceHistoryItem[] = Array.from(priceByDay.entries())
      .map(([dateKey, data]) => ({
        date: dateKey,
        formattedDate: data.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let percentageChange = 0;

    if (priceHistory.length >= 2) {
      const firstPrice = priceHistory[0].price;
      const lastPrice = priceHistory[priceHistory.length - 1].price;
      percentageChange = ((lastPrice - firstPrice) / firstPrice) * 100;
      
      if (percentageChange > 5) trend = 'up';
      else if (percentageChange < -5) trend = 'down';
      else trend = 'stable';
    }

    const product = uniqueProducts.find(p => p.id.toString() === selectedProduct);
    const market = marketsForProduct.find(m => m.id === selectedMarket);

    setProductPriceData({
      productId: parseInt(selectedProduct),
      productName: product?.name || '',
      productUnit: product?.unit || 'kg',
      marketId: selectedMarket,
      marketName: market?.name || '',
      province: market?.province || '',
      district: market?.district || '',
      currentPrice,
      averagePrice,
      highestPrice,
      lowestPrice,
      priceHistory,
      trend,
      percentageChange
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4 relative" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-4">Loading price trends...</p>
        </div>
      </div>
    );
  }

  if (livePrices.length === 0) {
    return (
      <Card className="p-12 text-center dark-glass border-white/10">
        <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No price data available</p>
        <Button 
          onClick={fetchLivePrices} 
          variant="outline" 
          className="mt-4"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <Card className="p-4 rounded-xl dark-glass border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">
              {t('product') || 'Product'}
            </label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                {uniqueProducts.map(product => (
                  <SelectItem key={product.id} value={product.id.toString()} className="text-white">
                    {product.name} ({product.unit})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">
              {t('market') || 'Market'}
            </label>
            <Select value={selectedMarket} onValueChange={setSelectedMarket} disabled={!selectedProduct}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                <SelectValue placeholder={selectedProduct ? "Select market" : "Select product first"} />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                {marketsForProduct.map(market => (
                  <SelectItem key={market.id} value={market.id} className="text-white">
                    {market.name} ({market.province})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">
              {t('timeRange') || 'Time Range'}
            </label>
            <div className="flex gap-2">
              <Button
                variant={timeRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('7d')}
                className="flex-1"
              >
                7 Days
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('30d')}
                className="flex-1"
              >
                30 Days
              </Button>
              <Button
                variant={timeRange === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('90d')}
                className="flex-1"
              >
                90 Days
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {productPriceData ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4 rounded-xl dark-glass border-white/10">
              <p className="text-xs text-muted-foreground mb-1">Current Price</p>
              <p className="text-2xl font-bold text-white">
                {productPriceData.currentPrice.toLocaleString()} 
                <span className="text-sm font-normal text-muted-foreground"> RWF</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">per {productPriceData.productUnit}</p>
            </Card>
            
            <Card className="p-4 rounded-xl dark-glass border-white/10">
              <p className="text-xs text-muted-foreground mb-1">Average Price</p>
              <p className="text-2xl font-bold text-white">
                {Math.round(productPriceData.averagePrice).toLocaleString()} 
                <span className="text-sm font-normal text-muted-foreground"> RWF</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Over selected period</p>
            </Card>
            
            <Card className="p-4 rounded-xl dark-glass border-white/10">
              <p className="text-xs text-muted-foreground mb-1">Highest Price</p>
              <p className="text-2xl font-bold text-rose-400">
                {productPriceData.highestPrice.toLocaleString()} 
                <span className="text-sm font-normal text-muted-foreground"> RWF</span>
              </p>
            </Card>
            
            <Card className="p-4 rounded-xl dark-glass border-white/10">
              <p className="text-xs text-muted-foreground mb-1">Lowest Price</p>
              <p className="text-2xl font-bold text-emerald-400">
                {productPriceData.lowestPrice.toLocaleString()} 
                <span className="text-sm font-normal text-muted-foreground"> RWF</span>
              </p>
            </Card>
          </div>

          {/* Trend Insight Card */}
          <Card className="p-4 rounded-xl dark-glass border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className={`icon-container-small ${
                  productPriceData.trend === 'up' ? 'bg-emerald-500/20' : 
                  productPriceData.trend === 'down' ? 'bg-rose-500/20' : 'bg-gray-500/20'
                }`}>
                  {productPriceData.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  ) : productPriceData.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-rose-400" />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {productPriceData.productName} at {productPriceData.marketName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {productPriceData.province} • {productPriceData.district}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${
                  productPriceData.trend === 'up' ? 'text-emerald-400' : 
                  productPriceData.trend === 'down' ? 'text-rose-400' : 
                  'text-gray-400'
                }`}>
                  {productPriceData.trend === 'up' ? '+' : productPriceData.trend === 'down' ? '-' : ''}
                  {Math.abs(productPriceData.percentageChange).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {productPriceData.trend === 'up' ? 'Rising' : 
                   productPriceData.trend === 'down' ? 'Falling' : 
                   'Stable'} over {timeRange}
                </p>
              </div>
            </div>
          </Card>

          {/* Chart Card */}
          <Card className="p-5 rounded-xl dark-glass border-white/10">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <div>
                <h3 className="text-base font-semibold text-white">
                  {productPriceData.productName} - {productPriceData.marketName}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Price trend analysis over the last {timeRange}
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{timeRange.replace('d', ' days')} trend</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={fetchLivePrices}
                  disabled={refreshing}
                  className="ml-2 h-7 px-2"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
            
            {productPriceData.priceHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={productPriceData.priceHistory}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="formattedDate" 
                    stroke="#6b7280" 
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickLine={{ stroke: '#4b5563' }}
                  />
                  <YAxis 
                    stroke="#6b7280" 
                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                    tickLine={{ stroke: '#4b5563' }}
                    tickFormatter={(value) => `${value.toLocaleString()}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(18, 18, 24, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      backdropFilter: 'blur(12px)',
                      color: 'white'
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} RWF`, 'Price']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    fill="url(#priceGradient)"
                    dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'white', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Insufficient price history data for this period</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try selecting a different time range or check back later
                </p>
              </div>
            )}
          </Card>

          {/* Additional Stats */}
          {productPriceData.priceHistory.length > 0 && (
            <Card className="p-4 rounded-xl dark-glass border-white/10">
              <h4 className="text-sm font-semibold text-white mb-3">Price Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground">Price Range</p>
                  <p className="text-sm font-medium text-white mt-1">
                    {productPriceData.lowestPrice.toLocaleString()} - {productPriceData.highestPrice.toLocaleString()} RWF
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground">Price Volatility</p>
                  <p className="text-sm font-medium text-white mt-1">
                    {((productPriceData.highestPrice - productPriceData.lowestPrice) / productPriceData.averagePrice * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground">Data Points</p>
                  <p className="text-sm font-medium text-white mt-1">
                    {productPriceData.priceHistory.length} days of data
                  </p>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-12 text-center dark-glass border-white/10">
          <div className="flex flex-col items-center">
            <div className="icon-container mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-2">
              {selectedProduct && !selectedMarket 
                ? 'Select a market to view price trends' 
                : 'Select a product and market to view price trends'}
            </p>
            <p className="text-xs text-muted-foreground">
              Choose a product and market from the dropdowns above to see historical price data
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}