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
        <h2 className="mb-1 gradient-text text-2xl font-bold">Purchase Planning</h2>
        <p className="text-muted-foreground text-sm">
          Optimize your purchasing decisions
        </p>
      </div>

      <Card className="rounded-xl dark-glass border-white/10 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-white/10 pb-4">
          <CardTitle className="text-white text-lg">Smart Purchase Recommendations</CardTitle>
          <CardDescription className="text-muted-foreground">
            Based on price trends and market analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <div 
                key={index} 
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <ShoppingCart className="h-5 w-5 text-primary" />
                    </div>
                    <p className="font-medium text-white text-base">{rec.product}</p>
                  </div>
                  <span className="text-sm font-medium px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Save {rec.savings}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Best Market</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <p className="text-sm font-medium text-white">{rec.bestMarket}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Best Price</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="h-3 w-3 text-emerald-400" />
                      <p className="text-sm font-semibold text-emerald-400">{rec.bestPrice}</p>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Best Day</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3 text-primary" />
                      <p className="text-sm font-medium text-white">{rec.bestDay}</p>
                    </div>
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