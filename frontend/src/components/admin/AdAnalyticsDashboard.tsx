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
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold gradient-text">{t('adAnalytics') || 'Advertisement Analytics'}</h2>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Track ad performance and ROI across all campaigns
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[140px] bg-white/5 border-white/10 text-white">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark-glass border-white/10">
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="btn-outline-premium">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => {
              const csvContent = 'Ad ID,Impressions,Clicks,CTR,Revenue\n' + 
                SAMPLE_ADS.map((ad: any) => `${ad.id},${ad.impressions},${ad.clicks},${((ad.clicks / ad.impressions) * 100).toFixed(2)}%,${ad.spent}`).join('\n');
              const element = document.createElement('a');
              element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
              element.setAttribute('download', 'ad_analytics.csv');
              element.style.display = 'none';
              document.body.appendChild(element);
              element.click();
              document.body.removeChild(element);
            }} className="btn-outline-premium">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Eye className="h-5 w-5 text-primary" />
              <span className="text-xs text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                12%
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalImpressions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Impressions</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <MousePointer className="h-5 w-5 text-primary" />
              <span className="text-xs text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                8%
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalClicks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Clicks</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-xs text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                0.3%
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.avgCtr.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">Avg. CTR</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="text-xs text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                15%
              </span>
            </div>
            <p className="text-2xl font-bold text-white">478</p>
            <p className="text-xs text-muted-foreground">Conversions</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-xs text-red-400 flex items-center">
                <ArrowDownRight className="h-3 w-3" />
                2%
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalSpent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Ad Spend (RWF)</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-xs text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                18%
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Revenue (RWF)</p>
          </div>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
            <BarChart3 className="h-5 w-5" />
            Performance Trend
          </h3>
          
          <div className="space-y-4">
            {chartData.map((day, i) => (
              <div key={day.date} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-12">{day.date}</span>
                <div className="flex-1 h-6 bg-white/10 rounded-full overflow-hidden relative">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                    style={{ width: `${(day.impressions / 6100) * 100}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-white">
                    {day.impressions.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-6 mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Impressions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-muted-foreground">Clicks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-xs text-muted-foreground">Conversions</span>
            </div>
          </div>
        </Card>

        {/* Top Performers */}
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
            <Megaphone className="h-5 w-5" />
            Top Performing Ads
          </h3>
          
          <div className="space-y-4">
            {topPerformers.map((ad, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i === 0 ? 'bg-primary/20 text-primary' :
                      i === 1 ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="font-medium text-white">{ad.name}</span>
                  </div>
                  <span className="text-emerald-400 font-semibold">{ad.revenue.toLocaleString()} RWF</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded bg-white/5">
                    <p className="text-xs text-muted-foreground">CTR</p>
                    <p className="font-semibold text-white">{ad.ctr}%</p>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <p className="text-xs text-muted-foreground">Conversions</p>
                    <p className="font-semibold text-white">{ad.conversions}</p>
                  </div>
                  <div className="p-2 rounded bg-white/5">
                    <p className="text-xs text-muted-foreground">Conv. Rate</p>
                    <p className="font-semibold text-white">{((ad.conversions / (ad.ctr * 100)) * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Audience Insights */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
          <Users className="h-5 w-5" />
          Audience Insights
        </h3>
        
        <div className="grid md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm text-primary mb-3">By User Type</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Consumers</span>
                <span className="font-semibold text-white">68%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '68%' }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Businesses</span>
                <span className="font-semibold text-white">24%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '24%' }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Vendors</span>
                <span className="font-semibold text-white">8%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '8%' }} />
              </div>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-primary mb-3">Top Markets</p>
            <div className="space-y-2">
              {['Kimironko (32%)', 'Nyabugogo (28%)', 'Muhima (18%)', 'Kicukiro (12%)', 'Other (10%)'].map((market, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  {market}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-primary mb-3">Top Categories</p>
            <div className="space-y-2">
              {['Vegetables (35%)', 'Meat (25%)', 'Fruits (20%)', 'Dairy (12%)', 'Grains (8%)'].map((cat, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  {cat}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <p className="text-sm text-primary mb-3">Device Breakdown</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Mobile</span>
                <span className="font-semibold text-white">72%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '72%' }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Desktop</span>
                <span className="font-semibold text-white">18%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '18%' }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm text-muted-foreground">Tablet</span>
                <span className="font-semibold text-white">10%</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>
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