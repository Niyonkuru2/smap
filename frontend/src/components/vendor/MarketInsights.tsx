import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, TrendingDown, MapPin, Loader2 } from 'lucide-react';
import { useProducts, useMarkets, usePrices } from '../../hooks/useAppData';

export default function MarketInsights() {
  const { products, loading: productsLoading } = useProducts();
  const { markets, loading: marketsLoading } = useMarkets();
  const { prices: priceData, loading: pricesLoading } = usePrices();
  const loading = productsLoading || marketsLoading || pricesLoading;

  const competitorPrices = priceData.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'up':
        return {
          variant: 'destructive' as const,
          className: 'bg-red-500/20 text-red-400 border-red-500/30',
          icon: <TrendingUp className="h-3 w-3 mr-1" />
        };
      case 'down':
        return {
          variant: 'default' as const,
          className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
          icon: <TrendingDown className="h-3 w-3 mr-1" />
        };
      default:
        return {
          variant: 'secondary' as const,
          className: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
          icon: null
        };
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h2 className="text-xl mb-2 gradient-text">Competitive Price Insights</h2>
        <p className="text-sm text-muted-foreground mb-6">
          See how prices of similar products are trending in other markets
        </p>

        <div className="space-y-4">
          {competitorPrices.map(price => {
            const product = products.find(p => p.id === price.productId);
            const market = markets.find(m => m.id === price.marketId);
            const trendBadge = getTrendBadge(price.trend);

            return (
              <div key={`${price.productId}-${price.marketId}`} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <h4 className="font-medium text-white">{product?.name}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{market?.name}</span>
                    </div>
                  </div>
                  <Badge className={trendBadge.className}>
                    {trendBadge.icon}
                    {price.trend}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current</p>
                    <p className="font-semibold text-white">
                      {price.current.toLocaleString()} RWF
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Average</p>
                    <p className="font-semibold text-muted-foreground">
                      {price.average.toLocaleString()} RWF
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Highest</p>
                    <p className="font-semibold text-red-400">
                      {price.highest.toLocaleString()} RWF
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lowest</p>
                    <p className="font-semibold text-emerald-400">
                      {price.lowest.toLocaleString()} RWF
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="text-lg mb-4 gradient-text">Price Recommendations</h3>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 transition-colors">
            <p className="text-sm font-medium text-emerald-400">
              ✓ Your Rice prices are competitive with the market average
            </p>
          </div>
          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/15 transition-colors">
            <p className="text-sm font-medium text-yellow-400">
              ⚠ Consider updating Tomatoes prices - they're higher than the market average by 15%
            </p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 transition-colors">
            <p className="text-sm font-medium text-emerald-400">
              ✓ Your Onions prices are among the lowest in the market - great positioning!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}