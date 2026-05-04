import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { BarChart3, TrendingUp, Package, DollarSign } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface MySalesProps {
  vendorName: string;
  vendorId: string;
}

export default function MySales({ vendorName, vendorId }: MySalesProps) {
  const { t } = useLanguage();

  // Mock sales data
  const salesStats = {
    totalSales: 1250,
    revenue: 'RWF 2,450,000',
    topProduct: 'Rice (1kg)',
    trend: '+15%'
  };

  const recentSales = [
    {
      id: '1',
      product: 'Rice (1kg)',
      quantity: 50,
      price: 'RWF 1,200',
      total: 'RWF 60,000',
      date: '2024-11-28',
      market: 'Kimironko Market'
    },
    {
      id: '2',
      product: 'Beans (1kg)',
      quantity: 30,
      price: 'RWF 800',
      total: 'RWF 24,000',
      date: '2024-11-27',
      market: 'Kimironko Market'
    },
    {
      id: '3',
      product: 'Maize Flour (1kg)',
      quantity: 40,
      price: 'RWF 900',
      total: 'RWF 36,000',
      date: '2024-11-26',
      market: 'Kimironko Market'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-1 text-white text-2xl font-bold">My Sales Performance</h2>
        <p className="text-green-300 text-sm">
          Track your sales and revenue
        </p>
      </div>

      {/* Sales Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900 to-green-950 border-green-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-green-300">Total Sales</CardTitle>
              <Package className="h-4 w-4 text-green-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white font-bold">{salesStats.totalSales}</div>
            <p className="text-xs text-green-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-950 border-green-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-green-300">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-green-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-white font-bold">{salesStats.revenue}</div>
            <p className="text-xs text-green-400 mt-1">Total earned</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-950 border-green-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-green-300">Top Product</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl truncate text-white font-bold">{salesStats.topProduct}</div>
            <p className="text-xs text-green-400 mt-1">Best seller</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900 to-green-950 border-green-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-green-300">Growth</CardTitle>
              <BarChart3 className="h-4 w-4 text-green-300" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl text-green-300 font-bold">{salesStats.trend}</div>
            <p className="text-xs text-green-400 mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card className="bg-gradient-to-br from-green-900 to-green-950 border-green-700">
        <CardHeader>
          <CardTitle className="text-white">Recent Sales</CardTitle>
          <CardDescription className="text-green-300">
            Your latest sales transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-4 border border-green-700 rounded-lg bg-green-950 hover:bg-green-900 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-300" />
                    <p className="text-white">{sale.product}</p>
                  </div>
                  <p className="text-sm text-green-400 mt-1">
                    {sale.market} • {sale.date}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-semibold">{sale.total}</p>
                  <p className="text-sm text-green-400">
                    {sale.quantity} × {sale.price}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {recentSales.length === 0 && (
            <div className="text-center py-8 text-green-300">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No sales yet</p>
              <p className="text-sm">Your sales will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

