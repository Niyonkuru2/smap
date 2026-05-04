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
        <h2 className="mb-1">Comparison Tools</h2>
        <p className="text-muted-foreground text-sm">
          Compare prices across different markets
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Market Price Comparison</CardTitle>
          <CardDescription>Average prices across all products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {marketComparison.map((market, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-green-600" />
                  <div>
                    <p>{market.market}</p>
                    <p className="text-sm text-muted-foreground">{market.itemsTracked} items tracked</p>
                  </div>
                </div>
                <div className="text-right">
                  <p>{market.avgPrice}</p>
                  <p className="text-sm text-muted-foreground">Avg. price</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
