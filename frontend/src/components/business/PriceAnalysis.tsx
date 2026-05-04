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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1">Price Analysis</h2>
        <p className="text-muted-foreground text-sm">
          Compare prices across markets and identify trends
        </p>
      </div>

      <div className="grid gap-4">
        {priceData.map((item, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">{item.product}</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  {item.trend === 'up' && (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  )}
                  {item.trend === 'down' && (
                    <TrendingDown className="h-5 w-5 text-green-600" />
                  )}
                  <span className={`text-sm ${
                    item.trend === 'up' ? 'text-green-500' :
                    item.trend === 'down' ? 'text-green-600' :
                    'text-gray-600'
                  }`}>
                    {item.change}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Price</p>
                  <p className="text-lg mt-1">{item.currentPrice}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Previous Price</p>
                  <p className="text-lg mt-1">{item.previousPrice}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lowest Market</p>
                  <p className="text-lg mt-1">{item.lowestMarket}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Highest Market</p>
                  <p className="text-lg mt-1">{item.highestMarket}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
