import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Download, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useProducts, usePrices } from '../../hooks/useAppData';
import { exportBusinessAnalytics } from '../../lib/dataExport';
import { toast } from 'sonner';

const weeklyPriceData = [
  { week: 'Week 1', rice: 1180, beans: 950, tomatoes: 820 },
  { week: 'Week 2', rice: 1200, beans: 970, tomatoes: 850 },
  { week: 'Week 3', rice: 1190, beans: 960, tomatoes: 800 },
  { week: 'Week 4', rice: 1220, beans: 980, tomatoes: 790 }
];

const savingsData = [
  { product: 'Rice (Local)', potentialSavings: 12000 },
  { product: 'Cooking Oil', potentialSavings: 8500 },
  { product: 'Beans', potentialSavings: 6200 },
  { product: 'Sugar', potentialSavings: 4800 }
];

export default function BusinessAnalytics() {
  const { products } = useProducts();
  const { prices: priceData } = usePrices();

  const handleExport = () => {
    exportBusinessAnalytics({
      priceComparisons: [
        { product: 'Rice (Local)', cheapest: 1150, mostExpensive: 1300, potentialSavings: 12000 },
        { product: 'Cooking Oil', cheapest: 4000, mostExpensive: 4500, potentialSavings: 8500 },
        { product: 'Beans', cheapest: 940, mostExpensive: 1100, potentialSavings: 6200 },
        { product: 'Sugar', cheapest: 1800, mostExpensive: 2000, potentialSavings: 4800 }
      ]
    });
    toast.success('Report exported successfully!');
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl">Business Analytics</h2>
          <p className="text-muted-foreground">Insights to help optimize your purchasing decisions</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tracked Products</p>
              <p className="text-2xl font-semibold">12</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Monthly Spend</p>
              <p className="text-2xl font-semibold">2.4M RWF</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Potential Savings</p>
              <p className="text-2xl font-semibold text-green-600">31.5K RWF</p>
            </div>
            <TrendingDown className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Price Alerts</p>
              <p className="text-2xl font-semibold">8</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Trends */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">Monthly Price Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyPriceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(160, 35%, 30%)" />
              <XAxis dataKey="week" stroke="hsl(160, 40%, 60%)" />
              <YAxis stroke="hsl(160, 40%, 60%)" />
              <Tooltip />
              <Line type="monotone" dataKey="rice" stroke="#10B981" strokeWidth={2} name="Rice" />
              <Line type="monotone" dataKey="beans" stroke="#059669" strokeWidth={2} name="Beans" />
              <Line type="monotone" dataKey="tomatoes" stroke="#047857" strokeWidth={2} name="Tomatoes" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Potential Savings */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">Potential Monthly Savings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={savingsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="product" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="potentialSavings" fill="#10B981" name="Savings (RWF)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg mb-4">Purchase Recommendations</h3>
        <div className="space-y-3">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-green-900">Best Time to Buy Rice</h4>
                </div>
                <p className="text-sm text-green-800">
                  Prices at Nyabugogo Market are 8% below average. Consider stocking up now.
                </p>
              </div>
              <Badge className="bg-green-600">Save 12K RWF</Badge>
            </div>
          </div>

          <div className="p-4 bg-green-900 border border-green-700 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-green-300" />
                  <h4 className="font-medium text-green-300">Cooking Oil Prices Rising</h4>
                </div>
                <p className="text-sm text-green-200">
                  Prices have increased 5% this week across all markets. Monitor closely.
                </p>
              </div>
              <Badge className="bg-green-700">Watch</Badge>
            </div>
          </div>

          <div className="p-4 bg-green-900 border border-green-700 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-5 w-5 text-green-300" />
                  <h4 className="font-medium text-green-300">Bulk Purchase Opportunity</h4>
                </div>
                <p className="text-sm text-green-200">
                  Beans prices are stable. Good time for bulk purchasing to lock in current rates.
                </p>
              </div>
              <Badge className="bg-green-700">Opportunity</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Market Comparison */}
      <Card className="p-6">
        <h3 className="text-lg mb-4">Best Markets for Your Products</h3>
        <div className="space-y-3">
          {[
            { product: 'Rice (Local)', market: 'Nyabugogo Market', price: 1150, savings: '8% below average' },
            { product: 'Tomatoes', market: 'Kimironko Market', price: 780, savings: '12% below average' },
            { product: 'Beans', market: 'Remera Market', price: 940, savings: '6% below average' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{item.product}</p>
                <p className="text-sm text-muted-foreground">{item.market}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">{item.price.toLocaleString()} RWF</p>
                <p className="text-sm text-green-600">{item.savings}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

