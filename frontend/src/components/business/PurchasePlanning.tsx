import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { ShoppingCart, Calendar, DollarSign } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function PurchasePlanning() {
  const { t } = useLanguage();

  const recommendations = [
    {
      product: 'Rice (1kg)',
      bestMarket: 'Kimironko Market',
      bestPrice: 'RWF 1,150',
      savings: 'RWF 100',
      bestDay: 'Wednesday'
    },
    {
      product: 'Beans (1kg)',
      bestMarket: 'Nyanza Market',
      bestPrice: 'RWF 750',
      savings: 'RWF 150',
      bestDay: 'Friday'
    },
    {
      product: 'Cooking Oil (1L)',
      bestMarket: 'Muhanga Market',
      bestPrice: 'RWF 2,800',
      savings: 'RWF 200',
      bestDay: 'Monday'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1">Purchase Planning</h2>
        <p className="text-muted-foreground text-sm">
          Optimize your purchasing decisions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Smart Purchase Recommendations</CardTitle>
          <CardDescription>
            Based on price trends and market analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg bg-green-950 border-green-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-green-500" />
                    <p>{rec.product}</p>
                  </div>
                  <span className="text-sm bg-green-600 text-white px-2 py-1 rounded">
                    Save {rec.savings}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Best Market</p>
                    <p className="mt-1">{rec.bestMarket}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Best Price</p>
                    <p className="mt-1">{rec.bestPrice}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Best Day</p>
                    <p className="mt-1">{rec.bestDay}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
