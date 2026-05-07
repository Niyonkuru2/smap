import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown, DollarSign, Package } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function PriceAnalysis() {
  const { t } = useLanguage();

  const priceData = [
    {
      product: 'Rice (1kg)',
      currentPrice: 'RWF 1,200',
      previousPrice: 'RWF 1,150',
      change: '+4.3%',
      trend: 'up' as const,
      lowestMarket: 'Kimironko',
      highestMarket: 'Nyabugogo'
    },
    {
      product: 'Beans (1kg)',
      currentPrice: 'RWF 800',
      previousPrice: 'RWF 850',
      change: '-5.9%',
      trend: 'down' as const,
      lowestMarket: 'Nyanza',
      highestMarket: 'Kigali City Market'
    },
    {
      product: 'Maize Flour (1kg)',
      currentPrice: 'RWF 900',
      previousPrice: 'RWF 900',
      change: '0%',
      trend: 'stable' as const,
      lowestMarket: 'Muhanga',
      highestMarket: 'Rubavu'
    }
  ];

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
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 gradient-text text-2xl font-bold">Price Analysis</h2>
        <p className="text-muted-foreground text-sm">
          Compare prices across markets and identify trends
        </p>
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
                  <CardTitle className="text-lg text-white">{item.product}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {getTrendIcon(item.trend)}
                  <span className={`text-sm font-medium ${getTrendColor(item.trend)}`}>
                    {item.change}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground">Current Price</p>
                  <p className="text-base font-semibold text-white mt-1">{item.currentPrice}</p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-xs text-muted-foreground">Previous Price</p>
                  <p className="text-base font-semibold text-white mt-1">{item.previousPrice}</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-xs text-emerald-400">Lowest Market</p>
                  <p className="text-base font-semibold text-emerald-400 mt-1">{item.lowestMarket}</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-xs text-red-400">Highest Market</p>
                  <p className="text-base font-semibold text-red-400 mt-1">{item.highestMarket}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}