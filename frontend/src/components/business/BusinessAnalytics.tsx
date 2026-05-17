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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl gradient-text">Business Analytics</h2>
          <p className="text-muted-foreground">Insights to help optimize your purchasing decisions</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Tracked Products</p>
              <p className="text-2xl font-semibold text-white">12</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-primary/70" />
          </div>
        </Card>

        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Monthly Spend</p>
              <p className="text-2xl font-semibold text-white">2.4M RWF</p>
            </div>
            <DollarSign className="h-8 w-8 text-primary/70" />
          </div>
        </Card>

        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Potential Savings</p>
              <p className="text-2xl font-semibold text-emerald-400">31.5K RWF</p>
            </div>
            <TrendingDown className="h-8 w-8 text-emerald-400" />
          </div>
        </Card>

        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Price Alerts</p>
              <p className="text-2xl font-semibold text-white">8</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary/70" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Price Trends */}
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg mb-4 gradient-text">Monthly Price Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyPriceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10,15,45,0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.5rem',
                  color: 'white'
                }}
              />
              <Line type="monotone" dataKey="rice" stroke="#3B82F6" strokeWidth={2} name="Rice" />
              <Line type="monotone" dataKey="beans" stroke="#10B981" strokeWidth={2} name="Beans" />
              <Line type="monotone" dataKey="tomatoes" stroke="#8B5CF6" strokeWidth={2} name="Tomatoes" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Potential Savings */}
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg mb-4 gradient-text">Potential Monthly Savings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={savingsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="product" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(10,15,45,0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.5rem',
                  color: 'white'
                }}
              />
              <Bar dataKey="potentialSavings" fill="#3B82F6" name="Savings (RWF)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="text-lg mb-4 gradient-text">Purchase Recommendations</h3>
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/15 transition-colors">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-5 w-5 text-emerald-400" />
                  <h4 className="font-medium text-white">Best Time to Buy Rice</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Prices at Nyabugogo Market are 8% below average. Consider stocking up now.
                </p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Save 12K RWF</Badge>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/15 transition-colors">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-5 w-5 text-yellow-400" />
                  <h4 className="font-medium text-white">Cooking Oil Prices Rising</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Prices have increased 5% this week across all markets. Monitor closely.
                </p>
              </div>
              <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Watch</Badge>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/15 transition-colors">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <h4 className="font-medium text-white">Bulk Purchase Opportunity</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  Beans prices are stable. Good time for bulk purchasing to lock in current rates.
                </p>
              </div>
              <Badge className="bg-primary/20 text-primary border-primary/30">Opportunity</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Market Comparison */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="text-lg mb-4 gradient-text">Best Markets for Your Products</h3>
        <div className="space-y-3">
          {[
            { product: 'Rice (Local)', market: 'Nyabugogo Market', price: 1150, savings: '8% below average' },
            { product: 'Tomatoes', market: 'Kimironko Market', price: 780, savings: '12% below average' },
            { product: 'Beans', market: 'Remera Market', price: 940, savings: '6% below average' }
          ].map((item, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex-wrap gap-3">
              <div className="flex-1">
                <p className="font-medium text-white">{item.product}</p>
                <p className="text-sm text-muted-foreground">{item.market}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-primary">{item.price.toLocaleString()} RWF</p>
                <p className="text-sm text-emerald-400">{item.savings}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <style>{`
        .btn-outline-premium {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: hsl(var(--foreground));
          transition: all 0.2s ease;
        }

        .btn-outline-premium:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
}