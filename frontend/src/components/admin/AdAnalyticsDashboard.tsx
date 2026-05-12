import { useState, useEffect } from 'react';
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
  Target,
  Loader2
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import {
  getAllAdvertisements,
  getAdAnalytics,
  formatBudget,
  type Advertisement,
  type AdAnalytics as AdAnalyticsType
} from '../../services/advertisementService';
import { getVendors } from '../../services/vendorService';

export function AdAnalyticsDashboard() {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [analytics, setAnalytics] = useState<AdAnalyticsType | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAds(),
        fetchAnalytics(),
        fetchVendors()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAds = async () => {
    try {
      const data = await getAllAdvertisements();
      setAds(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await getAdAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await getVendors();
      setVendors(data);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
    toast.success('Analytics data refreshed');
  };

  const handleExport = () => {
    if (!ads.length) {
      toast.error('No data to export');
      return;
    }
    
    const csvHeaders = ['Ad ID', 'Title', 'Type', 'Status', 'Impressions', 'Clicks', 'CTR', 'Budget', 'Spent', 'Vendor'];
    const csvRows = ads.map(ad => [
      ad.id,
      ad.title,
      ad.advertisement_type,
      ad.status,
      ad.views_count,
      ad.clicks_count,
      ad.views_count > 0 ? ((ad.clicks_count / ad.views_count) * 100).toFixed(2) : '0',
      ad.budget,
      ad.budget,
      ad.vendor_name || 'Unknown'
    ]);
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n');
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `ad_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success('Export started');
  };

  // Calculate total metrics
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.views_count, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks_count, 0);
  const totalRevenue = 0; // This would come from a separate revenue tracking system
  const totalSpent = ads.reduce((sum, ad) => sum + ad.budget, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const conversions = 0; // This would come from a separate conversion tracking system

  // Group ads by status
  const activeAds = ads.filter(ad => ad.status === 'active');
  const pendingAds = ads.filter(ad => ad.status === 'pending');
  const rejectedAds = ads.filter(ad => ad.status === 'rejected');
  const expiredAds = ads.filter(ad => ad.status === 'expired');

  // Top performing ads (by clicks)
  const topPerformers = [...ads]
    .sort((a, b) => b.clicks_count - a.clicks_count)
    .slice(0, 3)
    .map(ad => ({
      name: ad.title,
      ctr: ad.views_count > 0 ? (ad.clicks_count / ad.views_count) * 100 : 0,
      conversions: 0, // Would need conversion tracking
      revenue: 0, // Would need revenue tracking
      clicks: ad.clicks_count,
      views: ad.views_count
    }));

  // Get unique markets from ads (would need to fetch from market data)
  const marketNames = ads.map(ad => ad.placement).filter(Boolean).slice(0, 5);
  const marketCounts: Record<string, number> = {};
  marketNames.forEach(name => {
    if (name) marketCounts[name] = (marketCounts[name] || 0) + 1;
  });

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
            <Button variant="outline" onClick={handleExport} className="btn-outline-premium">
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
                {ads.length > 0 ? '+8%' : '0%'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{totalImpressions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Impressions</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <MousePointer className="h-5 w-5 text-primary" />
              <span className="text-xs text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                {totalClicks > 0 ? '+12%' : '0%'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{totalClicks.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Clicks</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-xs text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                {avgCtr > 0 ? '+0.5%' : '0%'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{avgCtr.toFixed(2)}%</p>
            <p className="text-xs text-muted-foreground">Avg. CTR</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="text-xs text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                {conversions > 0 ? '+5%' : '0%'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{conversions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Conversions</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="text-xs text-red-400 flex items-center">
                <ArrowDownRight className="h-3 w-3" />
                -2%
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{totalSpent.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Ad Spend (RWF)</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-primary" />
              <span className="text-xs text-emerald-400 flex items-center">
                <ArrowUpRight className="h-3 w-3" />
                {totalRevenue > 0 ? '+15%' : '0%'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Revenue (RWF)</p>
          </div>
        </div>
      </Card>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Performance Summary */}
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
            <BarChart3 className="h-5 w-5" />
            Campaign Summary
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Megaphone className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Ads</p>
                  <p className="text-xl font-bold text-white">{ads.length}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Active</p>
                <p className="text-xl font-bold text-emerald-400">{activeAds.length}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-bold text-yellow-400">{pendingAds.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground">Rejected</p>
                <p className="text-lg font-bold text-red-400">{rejectedAds.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground">Expired</p>
                <p className="text-lg font-bold text-gray-400">{expiredAds.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-muted-foreground">CTR Avg</p>
                <p className="text-lg font-bold text-primary">{avgCtr.toFixed(2)}%</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Top Performing Ads */}
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
            <Megaphone className="h-5 w-5" />
            Top Performing Ads
          </h3>
          
          {topPerformers.length === 0 ? (
            <div className="text-center py-8">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3" />
              <p className="text-muted-foreground">No ad data available</p>
              <p className="text-xs text-muted-foreground mt-1">Ads will appear here once they have impressions</p>
            </div>
          ) : (
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
                      <span className="font-medium text-white truncate max-w-[200px]">{ad.name}</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">{ad.clicks} clicks</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded bg-white/5">
                      <p className="text-xs text-muted-foreground">CTR</p>
                      <p className="font-semibold text-white">{ad.ctr.toFixed(2)}%</p>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <p className="text-xs text-muted-foreground">Views</p>
                      <p className="font-semibold text-white">{ad.views.toLocaleString()}</p>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <p className="text-xs text-muted-foreground">Conv. Rate</p>
                      <p className="font-semibold text-white">0%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* All Ads Table */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
          <Target className="h-5 w-5" />
          All Advertisements
        </h3>
        
        {ads.length === 0 ? (
          <div className="text-center py-12">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
            <p className="text-white">No advertisements found</p>
            <p className="text-sm text-muted-foreground mt-1">Ads will appear here when vendors submit them</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Title</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Vendor</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Views</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Clicks</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">CTR</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Budget</th>
                </tr>
              </thead>
              <tbody>
                {ads.map((ad) => {
                  const ctr = ad.views_count > 0 ? (ad.clicks_count / ad.views_count) * 100 : 0;
                  const statusColors: Record<string, string> = {
                    active: 'bg-emerald-500/20 text-emerald-400',
                    approved: 'bg-emerald-500/20 text-emerald-400',
                    pending: 'bg-yellow-500/20 text-yellow-400',
                    rejected: 'bg-red-500/20 text-red-400',
                    expired: 'bg-gray-500/20 text-gray-400',
                  };
                  
                  return (
                    <tr key={ad.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-white">
                        {ad.title}
                        {ad.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">{ad.description}</p>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{ad.vendor_name || 'Unknown'}</td>
                      <td className="p-3 text-center">
                        <span className="text-xs text-muted-foreground">
                          {ad.advertisement_type}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[ad.status] || 'bg-gray-500/20 text-gray-400'}`}>
                          {ad.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-center text-white">{ad.views_count.toLocaleString()}</td>
                      <td className="p-3 text-center text-white">{ad.clicks_count.toLocaleString()}</td>
                      <td className="p-3 text-center text-primary">{ctr.toFixed(2)}%</td>
                      <td className="p-3 text-center text-white">{formatBudget(ad.budget)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Vendor Performance */}
      {vendors.length > 0 && (
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
            <Users className="h-5 w-5" />
            Vendor Performance
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Vendor</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Ads</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Impression</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Clicks</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Budget</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {vendors.slice(0, 5).map((vendor) => {
                  const vendorAds = ads.filter(ad => ad.vendor_name === vendor.name);
                  const vendorImpressions = vendorAds.reduce((sum, ad) => sum + ad.views_count, 0);
                  const vendorClicks = vendorAds.reduce((sum, ad) => sum + ad.clicks_count, 0);
                  const vendorBudget = vendorAds.reduce((sum, ad) => sum + ad.budget, 0);
                  const isActive = vendorAds.some(ad => ad.status === 'active');
                  
                  return (
                    <tr key={vendor.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3 text-white">{vendor.name}</td>
                      <td className="p-3 text-center text-white">{vendorAds.length}</td>
                      <td className="p-3 text-center text-white">{vendorImpressions.toLocaleString()}</td>
                      <td className="p-3 text-center text-white">{vendorClicks.toLocaleString()}</td>
                      <td className="p-3 text-center text-white">{formatBudget(vendorBudget)}</td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}