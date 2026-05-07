import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { BarChart3, MapPin } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function ComparisonTools() {
  const { t } = useLanguage();

  const marketComparison = [
    { market: 'Kimironko Market', avgPrice: 'RWF 950', itemsTracked: 45 },
    { market: 'Nyabugogo Market', avgPrice: 'RWF 1,100', itemsTracked: 52 },
    { market: 'Kigali City Market', avgPrice: 'RWF 1,050', itemsTracked: 38 },
    { market: 'Nyanza Market', avgPrice: 'RWF 900', itemsTracked: 31 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 gradient-text text-2xl font-bold">Comparison Tools</h2>
        <p className="text-muted-foreground text-sm">
          Compare prices across different markets
        </p>
      </div>

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
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{market.market}</p>
                    <p className="text-sm text-muted-foreground">{market.itemsTracked} items tracked</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-primary text-lg">{market.avgPrice}</p>
                  <p className="text-xs text-muted-foreground">Avg. price</p>
                </div>
              </div>
            ))}
          </div>

          {/* Optional: Add a View All button */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <Button variant="outline" className="w-full btn-outline-premium">
              <BarChart3 className="h-4 w-4 mr-2" />
              View Detailed Comparison
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}