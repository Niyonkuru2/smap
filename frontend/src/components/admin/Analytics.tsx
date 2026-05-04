import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  ShoppingCart,
  MapPin,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useState, useEffect } from "react";
import { getAdminStats } from "../../lib/api";
import { useLanguage } from "../../contexts/LanguageContext";

// Default analytics data (will be updated from API)
const defaultAnalyticsData = {
  totalProducts: 0,
  totalMarkets: 0,
  totalUsers: 0,
  activeVendors: 0,
  pendingApprovals: 0,
  priceUpdatesToday: 0,
  popularProducts: [
    { name: 'Rice (Local)', searches: 342 },
    { name: 'Tomatoes', searches: 298 },
    { name: 'Onions', searches: 267 },
    { name: 'Cooking Oil', searches: 234 },
    { name: 'Beans', searches: 201 }
  ],
  activeMarkets: [
    { name: 'Kimironko Market', submissions: 45 },
    { name: 'Nyabugogo Market', submissions: 38 },
    { name: 'Musanze Central Market', submissions: 34 },
    { name: 'Kimisagara Market', submissions: 32 },
    { name: 'Remera Market', submissions: 28 }
  ],
  priceChangeAlerts: [
    { product: 'Rice (Local)', market: 'Kimironko', change: '+8%', type: 'increase' },
    { product: 'Tomatoes', market: 'Nyabugogo', change: '-12%', type: 'decrease' },
    { product: 'Potatoes', market: 'Musanze Central', change: '-5%', type: 'decrease' },
    { product: 'Cooking Oil', market: 'Remera', change: '+5%', type: 'increase' }
  ]
};

const COLORS = [
  "#10B981",
  "#059669",
  "#047857",
  "#065f46",
  "#1e3a2f",
];

const weeklyData = [
  { day: "Mon", submissions: 45, searches: 230 },
  { day: "Tue", submissions: 52, searches: 280 },
  { day: "Wed", submissions: 48, searches: 310 },
  { day: "Thu", submissions: 61, searches: 290 },
  { day: "Fri", submissions: 55, searches: 340 },
  { day: "Sat", submissions: 67, searches: 420 },
  { day: "Sun", submissions: 43, searches: 380 },
];

const categoryData = [
  { name: "Groceries", value: 35 },
  { name: "Vegetables", value: 28 },
  { name: "Fruits", value: 18 },
  { name: "Meat & Fish", value: 12 },
  { name: "Other", value: 7 },
];

export default function Analytics() {
  const { t } = useLanguage();
  const [analyticsData, setAnalyticsData] = useState(defaultAnalyticsData);

  useEffect(() => {
    async function fetchStats() {
      try {
        const stats = await getAdminStats();
        setAnalyticsData(prev => ({
          ...prev,
          totalUsers: stats.users?.total || prev.totalUsers,
          activeVendors: stats.users?.vendors || prev.activeVendors,
          totalMarkets: stats.markets || prev.totalMarkets,
          totalProducts: stats.products || prev.totalProducts,
          pendingApprovals: stats.submissions?.pending || prev.pendingApprovals,
          priceUpdatesToday: stats.submissions?.today || prev.priceUpdatesToday,
        }));
      } catch (error) {
        console.error('Failed to fetch admin stats:', error);
      }
    }
    fetchStats();
  }, []);

  const handleExport = (format: "csv" | "pdf") => {
    alert(`${t('exporting')} ${format.toUpperCase()}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl">{t('analyticsDashboard')}</h2>
          <p className="text-xs lg:text-sm text-muted-foreground">
            {t('analyticsOverview') || 'Overview of system activity and trends'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("csv")}
            className="text-xs"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('exportCsv') || 'Export CSV'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("pdf")}
          >
            <Download className="h-4 w-4 mr-2" />
            {t('exportPdf') || 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('totalUsers')}
              </p>
              <p className="text-2xl font-semibold">
                {analyticsData.totalUsers.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12% from last month
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('activeVendors')}
              </p>
              <p className="text-2xl font-semibold">
                {analyticsData.activeVendors}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8% from last month
              </p>
            </div>
            <ShoppingCart className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('totalMarkets')}
              </p>
              <p className="text-2xl font-semibold">
                {analyticsData.totalMarkets}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t('across3Districts') || 'Across 3 districts'}
              </p>
            </div>
            <MapPin className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('updatesToday')}
              </p>
              <p className="text-2xl font-semibold">
                {analyticsData.priceUpdatesToday}
              </p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {t('aboveAverage') || 'Above average'}
              </p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">{t('weeklyActivity')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(160, 35%, 30%)"
              />
              <XAxis dataKey="day" stroke="hsl(160, 40%, 60%)" />
              <YAxis stroke="hsl(160, 40%, 60%)" />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="submissions"
                stroke="#10B981"
                strokeWidth={2}
                name={t('submissions')}
              />
              <Line
                type="monotone"
                dataKey="searches"
                stroke="#059669"
                strokeWidth={2}
                name={t('searches')}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Distribution */}
        <Card className="p-6">
          <h3 className="text-lg mb-4">
            {t('priceSubmissionsByCategory')}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#10B981"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Popular Products */}
      <Card className="p-6">
        <h3 className="text-lg mb-4">{t('mostSearchedProducts')}</h3>
        <div className="space-y-3">
          {analyticsData.popularProducts.map(
            (product, index) => (
              <div
                key={index}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </div>
                  <span>{product.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">
                    {product.searches} searches
                  </span>
                  <div className="w-32 bg-green-950/50 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(product.searches / 342) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ),
          )}
        </div>
      </Card>

      {/* Active Markets */}
      <Card className="p-6">
        <h3 className="text-lg mb-4">Most Active Markets</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={analyticsData.activeMarkets}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(160, 35%, 30%)"
            />
            <XAxis dataKey="name" stroke="hsl(160, 40%, 60%)" />
            <YAxis stroke="hsl(160, 40%, 60%)" />
            <Tooltip />
            <Bar
              dataKey="submissions"
              fill="#10B981"
              name="Price Submissions"
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Price Alerts */}
      <Card className="p-6">
        <h3 className="text-lg mb-4">Recent Price Changes</h3>
        <div className="space-y-3">
          {analyticsData.priceChangeAlerts.map(
            (alert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-accent shadow-sm"
              >
                <div className="flex items-center gap-3">
                  {alert.type === "increase" ? (
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium text-foreground">
                      {alert.product}
                    </p>
                    <p className="text-sm text-gray-600">
                      {alert.market}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-semibold ${alert.type === "increase" ? "text-green-600" : "text-green-600"}`}
                >
                  {alert.change}
                </span>
              </div>
            ),
          )}
        </div>
      </Card>
    </div>
  );
}

