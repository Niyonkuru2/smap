import { Card } from "../ui/card";
import { Button } from "../ui/button";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  Activity,
  Package,
  Loader2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Crown,
  Megaphone,
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
import { useLanguage } from "../../contexts/LanguageContext";
import { toast } from "sonner";
import * as analyticsService from "../../services/analyticsService";

// Types
interface AnalyticsData {
  totalProducts: number;
  totalMarkets: number;
  totalUsers: number;
  activeVendors: number;
  pendingApprovals: number;
  priceUpdatesToday: number;
  totalPriceSubmissions: number;
  approvedPriceSubmissions: number;
  flaggedSubmissions: number;
  activeSubscriptions: number;
  totalAdvertisements: number;
  activeAdvertisements: number;
}

interface PopularProduct {
  name: string;
  submissions: number;
  markets: number;
}

interface ActiveMarket {
  name: string;
  submissions: number;
}

interface PriceAlert {
  product: string;
  market: string;
  change: string;
  type: 'increase' | 'decrease';
  percentage: number;
}

interface CategoryDistribution {
  name: string;
  value: number;
}

interface WeeklyData {
  day: string;
  submissions: number;
}

const COLORS = [
  "hsl(var(--primary))",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
];

export default function Analytics() {
  const { t } = useLanguage();
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalProducts: 0,
    totalMarkets: 0,
    totalUsers: 0,
    activeVendors: 0,
    pendingApprovals: 0,
    priceUpdatesToday: 0,
    totalPriceSubmissions: 0,
    approvedPriceSubmissions: 0,
    flaggedSubmissions: 0,
    activeSubscriptions: 0,
    totalAdvertisements: 0,
    activeAdvertisements: 0,
  });
  
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [activeMarkets, setActiveMarkets] = useState<ActiveMarket[]>([]);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllAnalyticsData();
  }, []);

  const fetchAllAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Fetch all analytics data in parallel
      const [
        dashboardData,
        popularData,
        marketsData,
        weeklyActivityData,
        categoriesData,
        alertsData,
        summaryData
      ] = await Promise.all([
        analyticsService.getAnalyticsDashboard(),
        analyticsService.getPopularProducts(5),
        analyticsService.getActiveMarkets(5),
        analyticsService.getWeeklyActivity(),
        analyticsService.getCategoryDistribution(),
        analyticsService.getPriceAlerts(5),
        analyticsService.getSummaryStats()
      ]);

      // Update analytics data
      setAnalyticsData({
        totalProducts: dashboardData.total_products,
        totalMarkets: dashboardData.total_markets,
        totalUsers: dashboardData.total_users,
        activeVendors: dashboardData.total_vendors,
        pendingApprovals: dashboardData.pending_approvals,
        priceUpdatesToday: dashboardData.price_updates_today,
        totalPriceSubmissions: dashboardData.total_price_submissions,
        approvedPriceSubmissions: dashboardData.approved_submissions,
        flaggedSubmissions: dashboardData.flagged_submissions,
        activeSubscriptions: dashboardData.active_subscriptions,
        totalAdvertisements: dashboardData.total_advertisements,
        activeAdvertisements: dashboardData.active_advertisements,
      });

      // Update popular products
      setPopularProducts(popularData.map(p => ({
        name: p.name,
        submissions: p.submissions,
        markets: p.markets
      })));

      // Update active markets
      setActiveMarkets(marketsData.map(m => ({
        name: m.name,
        submissions: m.submissions
      })));

      // Update weekly activity
      setWeeklyData(weeklyActivityData.map(w => ({
        day: w.day_name,
        submissions: w.submissions
      })));

      // Update category distribution
      if (categoriesData && categoriesData.length > 0) {
        setCategoryDistribution(categoriesData);
      } else {
        // Fallback data if no categories
        setCategoryDistribution([
          { name: "Vegetables", value: 28 },
          { name: "Fruits", value: 22 },
          { name: "Grains", value: 18 },
          { name: "Proteins", value: 20 },
          { name: "Other", value: 12 },
        ]);
      }

      // Update price alerts
      setPriceAlerts(alertsData.map(a => ({
        product: a.product,
        market: a.market,
        change: a.change,
        type: a.type,
        percentage: a.percentage
      })));

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
      
      // Set fallback data for charts
      setWeeklyData([
        { day: "Mon", submissions: 0 },
        { day: "Tue", submissions: 0 },
        { day: "Wed", submissions: 0 },
        { day: "Thu", submissions: 0 },
        { day: "Fri", submissions: 0 },
        { day: "Sat", submissions: 0 },
        { day: "Sun", submissions: 0 },
      ]);
      
      setCategoryDistribution([
        { name: "Vegetables", value: 28 },
        { name: "Fruits", value: 22 },
        { name: "Grains", value: 18 },
        { name: "Proteins", value: 20 },
        { name: "Other", value: 12 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAllAnalyticsData();
    toast.success('Data refreshed');
  };

  const handleExport = () => {
    const csvData = [
      ['Metric', 'Value'],
      ['Total Products', analyticsData.totalProducts],
      ['Total Markets', analyticsData.totalMarkets],
      ['Total Users', analyticsData.totalUsers],
      ['Active Vendors', analyticsData.activeVendors],
      ['Pending Approvals', analyticsData.pendingApprovals],
      ['Price Updates Today', analyticsData.priceUpdatesToday],
      ['Total Price Submissions', analyticsData.totalPriceSubmissions],
      ['Approved Submissions', analyticsData.approvedPriceSubmissions],
      ['Flagged Submissions', analyticsData.flaggedSubmissions],
      ['Active Subscriptions', analyticsData.activeSubscriptions],
      ['Total Advertisements', analyticsData.totalAdvertisements],
      ['Active Advertisements', analyticsData.activeAdvertisements],
      ['', ''],
      ['Popular Products', ''],
      ...popularProducts.map(p => [p.name, `${p.submissions} submissions, ${p.markets} markets`]),
      ['', ''],
      ['Active Markets', ''],
      ...activeMarkets.map(m => [m.name, `${m.submissions} submissions`]),
      ['', ''],
      ['Recent Price Alerts', ''],
      ...priceAlerts.map(a => [`${a.product} at ${a.market}`, `${a.change} (${a.type})`]),
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', `analytics_${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    URL.revokeObjectURL(url);
    
    toast.success('Exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading analytics data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl gradient-text">{t('analyticsDashboard')}</h2>
          <p className="text-xs lg:text-sm text-muted-foreground">
            Overview of system activity and trends
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
          >
            <Activity className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-semibold text-white">{analyticsData.totalProducts.toLocaleString()}</p>
              <p className="text-xs text-emerald-400 flex items-center mt-1">
                <Package className="h-3 w-3 mr-1" />
                Available products
              </p>
            </div>
            <Package className="h-8 w-8 text-primary/70" />
          </div>
        </Card>

        <Card className="p-4 dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Markets</p>
              <p className="text-2xl font-semibold text-white">{analyticsData.totalMarkets}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Active trading locations
              </p>
            </div>
            <MapPin className="h-8 w-8 text-primary/60" />
          </div>
        </Card>

        <Card className="p-4 dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Price Submissions</p>
              <p className="text-2xl font-semibold text-white">{analyticsData.totalPriceSubmissions.toLocaleString()}</p>
              <p className="text-xs text-emerald-400 flex items-center mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                {analyticsData.approvedPriceSubmissions} approved
              </p>
            </div>
            <Activity className="h-8 w-8 text-primary/50" />
          </div>
        </Card>

        <Card className="p-4 dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Vendors</p>
              <p className="text-2xl font-semibold text-white">{analyticsData.activeVendors}</p>
              <p className="text-xs text-emerald-400 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                Active contributors
              </p>
            </div>
            <Users className="h-8 w-8 text-primary/40" />
          </div>
        </Card>
      </div>

      {/* Additional Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-semibold text-yellow-400">{analyticsData.pendingApprovals}</p>
              <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500/60" />
          </div>
        </Card>

        <Card className="p-4 dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Flagged Submissions</p>
              <p className="text-2xl font-semibold text-orange-400">{analyticsData.flaggedSubmissions}</p>
              <p className="text-xs text-muted-foreground mt-1">Needs attention</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-orange-500/60" />
          </div>
        </Card>

        <Card className="p-4 dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <p className="text-2xl font-semibold text-primary">{analyticsData.activeSubscriptions}</p>
              <p className="text-xs text-muted-foreground mt-1">Premium vendors</p>
            </div>
            <Crown className="h-8 w-8 text-primary/60" />
          </div>
        </Card>

        <Card className="p-4 dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Ads</p>
              <p className="text-2xl font-semibold text-white">{analyticsData.activeAdvertisements}</p>
              <p className="text-xs text-muted-foreground mt-1">Total: {analyticsData.totalAdvertisements}</p>
            </div>
            <Megaphone className="h-8 w-8 text-primary/50" />
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card className="p-6 dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg mb-4 gradient-text">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.5rem',
                  color: 'white'
                }}
              />
              <Bar
                dataKey="submissions"
                fill="hsl(var(--primary))"
                name="Price Submissions"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Distribution */}
        <Card className="p-6 dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg mb-4 gradient-text">Product Categories</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="hsl(var(--primary))"
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.5rem',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Popular Products */}
      {popularProducts.length > 0 && (
        <Card className="p-6 dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg mb-4 gradient-text">Most Active Products</h3>
          <div className="space-y-3">
            {popularProducts.map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-primary/20 text-primary w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <span className="text-white">{product.name}</span>
                    <p className="text-xs text-muted-foreground">{product.markets} markets</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground text-sm">
                    {product.submissions} submissions
                  </span>
                  <div className="w-32 bg-white/10 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{
                        width: `${(product.submissions / popularProducts[0].submissions) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Markets */}
      {activeMarkets.length > 0 && (
        <Card className="p-6 dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg mb-4 gradient-text">Most Active Markets</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activeMarkets}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={80} />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '0.5rem',
                  color: 'white'
                }}
              />
              <Bar
                dataKey="submissions"
                fill="hsl(var(--primary))"
                name="Price Submissions"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Price Alerts */}
      {priceAlerts.length > 0 && (
        <Card className="p-6 dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg mb-4 gradient-text">Recent Price Changes</h3>
          <div className="space-y-3">
            {priceAlerts.map((alert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {alert.type === "increase" ? (
                    <TrendingUp className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-400" />
                  )}
                  <div>
                    <p className="font-medium text-white">{alert.product}</p>
                    <p className="text-sm text-muted-foreground">{alert.market}</p>
                  </div>
                </div>
                <span
                  className={`font-semibold ${alert.type === "increase" ? "text-emerald-400" : "text-red-400"}`}
                >
                  {alert.change}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}