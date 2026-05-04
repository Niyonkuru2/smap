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
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl mb-4">Competitive Price Insights</h2>
        <p className="text-sm text-muted-foreground mb-6">
          See how prices of similar products are trending in other markets
        </p>

        <div className="space-y-4">
          {competitorPrices.map(price => {
            const product = products.find(p => p.id === price.productId);
            const market = markets.find(m => m.id === price.marketId);

            return (
              <div key={`${price.productId}-${price.marketId}`} className="p-4 bg-secondary rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{product?.name}</h4>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{market?.name}</span>
                    </div>
                  </div>
                  <Badge variant={
                    price.trend === 'up' ? 'destructive' :
                    price.trend === 'down' ? 'default' :
                    'secondary'
                  }>
                    {price.trend === 'up' && <TrendingUp className="h-3 w-3 mr-1" />}
                    {price.trend === 'down' && <TrendingDown className="h-3 w-3 mr-1" />}
                    {price.trend}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current</p>
                    <p className="font-semibold text-primary">
                      {price.current.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Average</p>
                    <p className="font-semibold">{price.average.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Highest</p>
                    <p className="font-semibold text-green-600">{price.highest.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Lowest</p>
                    <p className="font-semibold text-green-600">{price.lowest.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg mb-4">Price Recommendations</h3>
        <div className="space-y-3">
          <div className="p-4 bg-green-950 border border-green-700 rounded-lg">
            <p className="text-sm font-medium text-green-100">
              Your Rice prices are competitive with the market average
            </p>
          </div>
          <div className="p-4 bg-green-900 border border-green-700 rounded-lg">
            <p className="text-sm font-medium text-green-100">
              Consider updating Tomatoes prices - they're higher than the market average by 15%
            </p>
          </div>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900">
              Your Onions prices are among the lowest in the market - great positioning!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

