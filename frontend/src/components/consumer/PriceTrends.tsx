import { useState } from 'react';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { useProducts, useMarkets, usePrices } from '../../hooks/useAppData';
import { useLanguage } from '../../contexts/LanguageContext';

export default function PriceTrends() {
  const { products, loading: productsLoading } = useProducts();
  const { markets, loading: marketsLoading } = useMarkets();
  const { prices: priceData, loading: pricesLoading } = usePrices();
  const loading = productsLoading || marketsLoading || pricesLoading;
  const { t } = useLanguage();
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedMarket, setSelectedMarket] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const productPrice = priceData.find(
    p => p.productId === selectedProduct && p.marketId === selectedMarket
  );
  const product = products.find(p => p.id === selectedProduct);
  const market = markets.find(m => m.id === selectedMarket);

  const getDaysFromRange = () => {
    if (timeRange === '7d') return 7;
    if (timeRange === '90d') return 90;
    return 30;
  };

  const chartData = (productPrice as any)?.history?.slice(-getDaysFromRange()).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: item.price
  })) || [];

  const getTrendDirection = () => {
    if (!productPrice?.history || productPrice.history.length < 2) return 'stable';
    const firstPrice = productPrice.history[0]?.price;
    const lastPrice = productPrice.history[productPrice.history.length - 1]?.price;
    if (lastPrice > firstPrice) return 'up';
    if (lastPrice < firstPrice) return 'down';
    return 'stable';
  };

  const trend = getTrendDirection();
  const priceChange = productPrice?.history && productPrice.history.length >= 2 
    ? ((productPrice.history[productPrice.history.length - 1]?.price - productPrice.history[0]?.price) / productPrice.history[0]?.price * 100).toFixed(1)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
            <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4 relative" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mt-4">{t('loadingTrends') || 'Loading price trends...'}</p>
        </div>
      </div>
    );
  }

  if (!products.length || !markets.length) {
    return (
      <Card className="p-12 text-center dark-glass border-white/10">
        <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground">No products or markets available</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters Card */}
      <Card className="p-4 rounded-xl dark-glass border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{t('product') || 'Product'}</label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                <SelectValue placeholder={t('selectProduct') || 'Select product'} />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id} className="text-white">
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{t('market') || 'Market'}</label>
            <Select value={selectedMarket} onValueChange={setSelectedMarket}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-colors">
                <SelectValue placeholder={t('selectMarket') || 'Select market'} />
              </SelectTrigger>
              <SelectContent className="bg-card border-white/10 backdrop-blur-xl">
                {markets.map(market => (
                  <SelectItem key={market.id} value={market.id} className="text-white">
                    {market.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block text-muted-foreground">{t('timeRange') || 'Time Range'}</label>
            <div className="flex gap-2">
              <Button
                variant={timeRange === '7d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('7d')}
                className={`flex-1 ${timeRange === '7d' ? 'btn-premium' : 'btn-outline-premium'}`}
              >
                7 {t('days') || 'Days'}
              </Button>
              <Button
                variant={timeRange === '30d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('30d')}
                className={`flex-1 ${timeRange === '30d' ? 'btn-premium' : 'btn-outline-premium'}`}
              >
                30 {t('days') || 'Days'}
              </Button>
              <Button
                variant={timeRange === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('90d')}
                className={`flex-1 ${timeRange === '90d' ? 'btn-premium' : 'btn-outline-premium'}`}
              >
                90 {t('days') || 'Days'}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {productPrice && product && market ? (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="p-4 rounded-xl dark-glass border-white/10">
              <p className="text-xs text-muted-foreground mb-1">{t('currentPrice') || 'Current Price'}</p>
              <p className="text-2xl font-bold text-white">{productPrice.current.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">RWF</span></p>
            </Card>
            <Card className="p-4 rounded-xl dark-glass border-white/10">
              <p className="text-xs text-muted-foreground mb-1">{t('averagePrice') || 'Average Price'}</p>
              <p className="text-2xl font-bold text-white">{productPrice.average.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">RWF</span></p>
            </Card>
            <Card className="p-4 rounded-xl dark-glass border-white/10">
              <p className="text-xs text-muted-foreground mb-1">{t('highestPrice') || 'Highest'}</p>
              <p className="text-2xl font-bold text-rose-400">{productPrice.highest.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">RWF</span></p>
            </Card>
            <Card className="p-4 rounded-xl dark-glass border-white/10">
              <p className="text-xs text-muted-foreground mb-1">{t('lowestPrice') || 'Lowest'}</p>
              <p className="text-2xl font-bold text-emerald-400">{productPrice.lowest.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">RWF</span></p>
            </Card>
          </div>

          {/* Trend Insight Card */}
          <Card className="p-4 rounded-xl dark-glass border-white/10">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className={`icon-container-small ${trend === 'up' ? 'bg-emerald-500/20' : trend === 'down' ? 'bg-rose-500/20' : 'bg-gray-500/20'}`}>
                  {trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                  ) : trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-rose-400" />
                  ) : (
                    <BarChart3 className="h-4 w-4 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {product.name} at {market.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t('priceTrend') || 'Price trend'} over the last {timeRange}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${
                  trend === 'up' ? 'text-emerald-400' : 
                  trend === 'down' ? 'text-rose-400' : 
                  'text-gray-400'
                }`}>
                  {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{Math.abs(Number(priceChange))}%
                </p>
                <p className="text-xs text-muted-foreground">
                  {trend === 'up' ? t('rising') || 'Rising' : 
                   trend === 'down' ? t('falling') || 'Falling' : 
                   t('stable') || 'Stable'}
                </p>
              </div>
            </div>
          </Card>

          {/* Chart Card */}
          <Card className="p-5 rounded-xl dark-glass border-white/10">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <h3 className="text-base font-semibold text-white">
                {product?.name} - {market?.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>{timeRange} {t('trend') || 'trend'}</span>
              </div>
            </div>
            
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis 
                    dataKey="date" 
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
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))', stroke: 'white', strokeWidth: 2 }}
                    fillOpacity={0.3}
                    fill="url(#priceGradient)"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">{t('noTrendData') || 'No price trend data available for this selection'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('tryDifferentSelection') || 'Try selecting a different product or market'}
                </p>
              </div>
            )}
          </Card>
        </>
      ) : (
        <Card className="p-12 text-center dark-glass border-white/10">
          <div className="flex flex-col items-center">
            <div className="icon-container mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground mb-2">{t('selectProductAndMarket') || 'Select a product and market to view price trends'}</p>
            <p className="text-xs text-muted-foreground">
              {t('trendsHelpText') || 'Choose a product and market from the dropdowns above to see historical price data'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}