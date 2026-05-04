import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  BarChart3, 
  Eye, 
  MousePointer, 
  TrendingUp, 
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Megaphone,
  Users,
  ShoppingCart,
  Target
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SAMPLE_ADS, calculateAdStats } from '../../lib/advertisementService';

export function AdAnalyticsDashboard() {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = calculateAdStats(SAMPLE_ADS);

  // Simulated historical data
  const chartData = [
    { date: 'Feb 6', impressions: 3200, clicks: 145, conversions: 23 },
    { date: 'Feb 7', impressions: 4100, clicks: 198, conversions: 31 },
    { date: 'Feb 8', impressions: 3800, clicks: 176, conversions: 28 },
    { date: 'Feb 9', impressions: 5200, clicks: 287, conversions: 45 },
    { date: 'Feb 10', impressions: 4600, clicks: 234, conversions: 38 },
    { date: 'Feb 11', impressions: 5800, clicks: 312, conversions: 52 },
    { date: 'Feb 12', impressions: 6100, clicks: 341, conversions: 61 },
  ];

  const topPerformers = [
    { name: 'Fresh Organic Vegetables', ctr: 5.49, conversions: 124, revenue: 186000 },
    { name: 'Premium Quality Meat', ctr: 5.51, conversions: 287, revenue: 574000 },
    { name: 'Fresh Milk Daily', ctr: 4.37, conversions: 67, revenue: 100500 },
  ];

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 rounded-2xl border border-accent bg-card shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold">{t('adAnalytics') || 'Advertisement Analytics'}</h2>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Track ad performance and ROI across all campaigns
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                const csvContent = 'Ad ID,Impressions,Clicks,CTR,Revenue\n' + 
                  analyticsData.map((row: any) => `${row.adId},${row.impressions},${row.clicks},${row.ctr},${row.revenue}`).join('\n');
                const element = document.createElement('a');
                element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
                element.setAttribute('download', 'ad_analytics.csv');
                element.style.display = 'none';
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-5 w-5 text-green-500" />
              <span className="text-xs text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                12%
              </span>
            </div>
            <p className="text-2xl font-bold text-green-300">{stats.totalImpressions.toLocaleString()}</p>
            <p className="text-xs text-green-300">Total Impressions</p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <MousePointer className="h-5 w-5 text-green-500" />
              <span className="text-xs text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                8%
              </span>
            </div>
            <p className="text-2xl font-bold text-green-300">{stats.totalClicks.toLocaleString()}</p>
            <p className="text-xs text-green-300">Total Clicks</p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-xs text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                0.3%
              </span>
            </div>
            <p className="text-2xl font-bold text-green-300">{stats.avgCtr.toFixed(2)}%</p>
            <p className="text-xs text-green-300">Avg. CTR</p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="h-5 w-5 text-green-500" />
              <span className="text-xs text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                15%
              </span>
            </div>
            <p className="text-2xl font-bold text-green-300">478</p>
            <p className="text-xs text-green-300">Conversions</p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              <span className="text-xs text-green-600 flex items-center">
                <ArrowDownRight className="h-3 w-3" />
                2%
              </span>
            </div>
            <p className="text-2xl font-bold text-green-300">{stats.totalSpent.toLocaleString()}</p>
            <p className="text-xs text-green-300">Ad Spend (RWF)</p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-green-500" />
              <span className="text-xs text-green-600 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                18%
              </span>
            </div>
            <p className="text-2xl font-bold text-green-300">{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-green-300">Revenue (RWF)</p>
          </div>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card className="p-6 rounded-2xl border border-accent bg-card shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Trend
          </h3>
          
          <div className="space-y-4">
            {chartData.map((day, i) => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12">{day.date}</span>
                <div className="flex-1 h-6 bg-secondary rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                    style={{ width: `${(day.impressions / 6100) * 100}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium">
                    {day.impressions.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-xs">Impressions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-xs">Clicks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span className="text-xs">Conversions</span>
            </div>
          </div>
        </Card>

        {/* Top Performers */}
        <Card className="p-6 rounded-2xl border border-accent bg-card shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Top Performing Ads
          </h3>
          
          <div className="space-y-4">
            {topPerformers.map((ad, i) => (
              <div key={i} className="p-4 rounded-xl bg-secondary border border-accent shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-green-400 text-green-900' :
                      i === 1 ? 'bg-green-500 text-green-900' :
                      'bg-green-600 text-green-100'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-medium">{ad.name}</span>
                  </div>
                  <span className="text-green-600 font-semibold">{ad.revenue.toLocaleString()} RWF</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-green-900 rounded">
                    <p className="text-xs text-green-300">CTR</p>
                    <p className="font-semibold text-green-300">{ad.ctr}%</p>
                  </div>
                  <div className="p-2 bg-green-900 rounded">
                    <p className="text-xs text-green-300">Conversions</p>
                    <p className="font-semibold text-green-300">{ad.conversions}</p>
                  </div>
                  <div className="p-2 bg-green-900 rounded">
                    <p className="text-xs text-green-300">Conv. Rate</p>
                    <p className="font-semibold text-green-300">{((ad.conversions / (ad.ctr * 100)) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Audience Insights */}
      <Card className="p-6 rounded-2xl border border-accent bg-card shadow-sm">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Audience Insights
        </h3>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-green-300 mb-3">By User Type</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Consumers</span>
                <span className="font-semibold">68%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '68%' }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm">Businesses</span>
                <span className="font-semibold">24%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '24%' }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm">Vendors</span>
                <span className="font-semibold">8%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-green-300 mb-3">Top Markets</p>
            <div className="space-y-2">
              {['Kimironko (32%)', 'Nyabugogo (28%)', 'Muhima (18%)', 'Kicukiro (12%)', 'Other (10%)'].map((market, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    ['bg-green-500', 'bg-green-500', 'bg-green-500', 'bg-green-500', 'bg-green-500'][i]
                  }`} />
                  {market}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-green-300 mb-3">Top Categories</p>
            <div className="space-y-2">
              {['Vegetables (35%)', 'Meat (25%)', 'Fruits (20%)', 'Dairy (12%)', 'Grains (8%)'].map((cat, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    ['bg-green-500', 'bg-green-500', 'bg-green-500', 'bg-green-500', 'bg-green-500'][i]
                  }`} />
                  {cat}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-green-300 mb-3">Device Breakdown</p>
            <div className="space-y-2">
              {['Mobile (72%)', 'Desktop (18%)', 'Tablet (10%)'].map((device, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    ['bg-green-500', 'bg-green-500', 'bg-green-500'][i]
                  }`} />
                  {device}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

