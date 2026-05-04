import { Card } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { useState } from 'react';

// Sample data - in real app, this would come from API
const generatePriceHistory = (basePrice: number, days: number = 30) => {
  const data = [];
  const today = new Date();
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Simulate price fluctuation
    const fluctuation = (Math.random() - 0.5) * (basePrice * 0.2);
    const price = Math.round(basePrice + fluctuation);
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price,
      avgPrice: basePrice
    });
  }
  
  return data;
};

const marketComparisonData = [
  { market: 'Musanze', price: 1200, products: 45 },
  { market: 'Kimironko', price: 1350, products: 52 },
  { market: 'Nyabugogo', price: 1180, products: 48 },
  { market: 'Rubavu', price: 1280, products: 41 },
  { market: 'Muhanga', price: 1220, products: 38 }
];

const categoryDistribution = [
  { name: 'Agricultural', value: 35, color: '#10B981' },
  { name: 'Household', value: 25, color: '#059669' },
  { name: 'Construction', value: 20, color: '#047857' },
  { name: 'Electronics', value: 12, color: '#065f46' },
  { name: 'Transport', value: 8, color: '#1e3a2f' }
];

interface PriceAnalyticsChartsProps {
  productName?: string;
  basePrice?: number;
}

export function PriceAnalyticsCharts({ 
  productName = 'Tomatoes (1kg)', 
  basePrice = 1200 
}: PriceAnalyticsChartsProps) {
  const [timeRange, setTimeRange] = useState<string>('30');
  
  const priceHistory = generatePriceHistory(basePrice, parseInt(timeRange));
  
  // Calculate trend
  const firstPrice = priceHistory[0]?.price || 0;
  const lastPrice = priceHistory[priceHistory.length - 1]?.price || 0;
  const priceChange = lastPrice - firstPrice;
  const percentChange = ((priceChange / firstPrice) * 100).toFixed(1);
  const isTrendingUp = priceChange > 0;

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg sm:text-base">Price Analytics</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Historical trends and market comparison for {productName}
          </p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Trend Card */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <h4 className="text-base">Price Trend</h4>
          <div className={`flex items-center gap-1 px-2 py-1 rounded w-fit ${
            isTrendingUp ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-700'
          }`}>
            {isTrendingUp ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm">{percentChange}%</span>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={priceHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Price (RWF)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(160, 40%, 20%)', 
                border: '1px solid hsl(160, 35%, 30%)',
                borderRadius: '8px',
                color: 'hsl(160, 40%, 95%)'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke="#10B981" 
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Actual Price"
            />
            <Line 
              type="monotone" 
              dataKey="avgPrice" 
              stroke="#10B981" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
              name="Average Price"
            />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Current Price</p>
            <p className="text-base sm:text-lg">{lastPrice.toLocaleString()} RWF</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Average Price</p>
            <p className="text-base sm:text-lg">{basePrice.toLocaleString()} RWF</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Price Change</p>
            <p className={`text-base sm:text-lg ${isTrendingUp ? 'text-green-700' : 'text-green-600'}`}>
              {isTrendingUp ? '+' : ''}{priceChange} RWF
            </p>
          </div>
        </div>
      </Card>

      {/* Market Comparison */}
      <Card className="p-4">
        <h4 className="mb-4">Market Comparison</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={marketComparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="market" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(160, 40%, 20%)', 
                border: '1px solid hsl(160, 35%, 30%)',
                borderRadius: '8px',
                color: 'hsl(160, 40%, 95%)'
              }}
            />
            <Legend />
            <Bar dataKey="price" fill="#10B981" name="Price (RWF)" />
            <Bar dataKey="products" fill="#059669" name="Products Available" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground mb-2">Best Value Markets:</p>
          <div className="flex gap-2 flex-wrap">
            {marketComparisonData
              .sort((a, b) => a.price - b.price)
              .slice(0, 3)
              .map((market, index) => (
                <div 
                  key={market.market}
                  className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded text-sm"
                >
                  <span className="font-semibold">#{index + 1}</span>
                  <span>{market.market}</span>
                  <span className="text-xs">({market.price} RWF)</span>
                </div>
              ))}
          </div>
        </div>
      </Card>

      {/* Category Distribution */}
      <Card className="p-4">
        <h4 className="mb-4">Price Submissions by Category</h4>
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#10B981"
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex-1 space-y-2 w-full">
            {categoryDistribution.map((category) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm">{category.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {category.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
