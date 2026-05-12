import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
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
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Plus,
  Filter
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import {
  getAllAdvertisements,
  getAdAnalytics,
  formatBudget,
  approveAdvertisement,
  rejectAdvertisement,
  getPendingAdvertisements,
  type Advertisement,
  type AdAnalytics as AdAnalyticsType
} from '../../services/advertisementService';
import { getVendors } from '../../services/vendorService';

type TabType = 'analytics' | 'pending' | 'all';

export function AdAnalyticsDashboard() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [timeRange, setTimeRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [pendingAds, setPendingAds] = useState<Advertisement[]>([]);
  const [analytics, setAnalytics] = useState<AdAnalyticsType | null>(null);
  const [vendors, setVendors] = useState<any[]>([]);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAds(),
        fetchPendingAds(),
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

  const fetchPendingAds = async () => {
    try {
      const data = await getPendingAdvertisements();
      setPendingAds(data);
    } catch (error) {
      console.error('Error fetching pending ads:', error);
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
    toast.success('Data refreshed');
  };

  const handleApprove = async (adId: number) => {
    setIsSubmitting(true);
    try {
      const result = await approveAdvertisement(adId);
      if (result.success) {
        toast.success(result.message);
        await fetchPendingAds();
        await fetchAds();
        await fetchAnalytics();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve advertisement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectClick = (ad: Advertisement) => {
    setSelectedAd(ad);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedAd) return;
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await rejectAdvertisement(selectedAd.id, rejectionReason);
      if (result.success) {
        toast.success(result.message);
        setRejectDialogOpen(false);
        setSelectedAd(null);
        setRejectionReason('');
        await fetchPendingAds();
        await fetchAds();
        await fetchAnalytics();
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject advertisement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExport = () => {
    const dataToExport = activeTab === 'pending' ? pendingAds : ads;
    if (!dataToExport.length) {
      toast.error('No data to export');
      return;
    }
    
    const csvHeaders = ['Ad ID', 'Title', 'Description', 'Type', 'Status', 'Budget', 'Vendor', 'Created At'];
    const csvRows = dataToExport.map(ad => [
      ad.id,
      ad.title,
      ad.description || '',
      ad.advertisement_type,
      ad.status,
      ad.budget,
      ad.vendor_name || 'Unknown',
      new Date(ad.created_at).toLocaleDateString()
    ]);
    
    const csvContent = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n');
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', `ads_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    toast.success('Export started');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: JSX.Element; color: string; label: string }> = {
      active: { icon: <CheckCircle className="h-3 w-3" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Active' },
      approved: { icon: <CheckCircle className="h-3 w-3" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Approved' },
      pending: { icon: <Clock className="h-3 w-3" />, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending' },
      rejected: { icon: <XCircle className="h-3 w-3" />, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Rejected' },
      expired: { icon: <AlertCircle className="h-3 w-3" />, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', label: 'Expired' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Calculate total metrics
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.views_count, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks_count, 0);
  const totalSpent = ads.reduce((sum, ad) => sum + ad.budget, 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Group ads by status
  const activeAds = ads.filter(ad => ad.status === 'active');
  const approvedAds = ads.filter(ad => ad.status === 'approved');
  const rejectedAds = ads.filter(ad => ad.status === 'rejected');
  const expiredAds = ads.filter(ad => ad.status === 'expired');

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
              <h2 className="text-lg lg:text-xl font-bold gradient-text">{t('adAnalytics') || 'Advertisement Management'}</h2>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Manage and approve advertisements from vendors
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
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

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Megaphone className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-white">{pendingAds.length}</p>
            <p className="text-xs text-muted-foreground">Pending Approval</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white">{activeAds.length + approvedAds.length}</p>
            <p className="text-xs text-muted-foreground">Approved/Active</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-xl font-bold text-white">{rejectedAds.length}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xl font-bold text-white">{expiredAds.length}</p>
            <p className="text-xs text-muted-foreground">Expired</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-white">{totalImpressions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Views</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-white">{avgCtr.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Avg CTR</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 ${activeTab === 'pending' ? 'bg-primary hover:bg-primary/90' : 'hover:bg-white/10'}`}
        >
          <Clock className="h-4 w-4" />
          Pending Approvals
          {pendingAds.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
              {pendingAds.length}
            </span>
          )}
        </Button>
        <Button
          variant={activeTab === 'all' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 ${activeTab === 'all' ? 'bg-primary hover:bg-primary/90' : 'hover:bg-white/10'}`}
        >
          <Megaphone className="h-4 w-4" />
          All Advertisements
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-primary hover:bg-primary/90' : 'hover:bg-white/10'}`}
        >
          <BarChart3 className="h-4 w-4" />
          Analytics
        </Button>
      </div>

      {/* Pending Approvals Tab */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingAds.length === 0 ? (
            <Card className="p-12 text-center rounded-xl dark-glass border-white/10">
              <CheckCircle className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
              <p className="text-white font-medium">No Pending Approvals</p>
              <p className="text-sm text-muted-foreground mt-1">All advertisements have been reviewed</p>
            </Card>
          ) : (
            pendingAds.map((ad) => (
              <Card key={ad.id} className="p-5 rounded-xl dark-glass border-white/10 hover:border-primary/30 transition-all">
                <div className="flex flex-col md:flex-row md:items-start gap-5">
                  {/* Ad Image/Icon */}
                  <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {ad.image_url ? (
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Megaphone className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Ad Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{ad.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{ad.description || 'No description provided'}</p>
                      </div>
                      {getStatusBadge(ad.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Vendor</p>
                        <p className="font-medium text-white">{ad.vendor_name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="font-medium text-white capitalize">{ad.advertisement_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="font-medium text-white">{formatBudget(ad.budget)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Submitted</p>
                        <p className="font-medium text-white">{new Date(ad.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {ad.target_url && (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground">Target URL</p>
                        <p className="text-sm text-primary truncate">{ad.target_url}</p>
                      </div>
                    )}
                    
                    {ad.placement && (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground">Placement</p>
                        <p className="text-sm text-white">{ad.placement}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-3 border-t border-white/10">
                      <Button
                        onClick={() => handleApprove(ad.id)}
                        disabled={isSubmitting}
                        className="bg-emerald-500 hover:bg-emerald-600"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejectClick(ad)}
                        disabled={isSubmitting}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* All Advertisements Tab */}
      {activeTab === 'all' && (
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
                    return (
                      <tr key={ad.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="p-3">
                          <div className="text-white">{ad.title}</div>
                          {ad.description && (
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{ad.description}</div>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground">{ad.vendor_name || 'Unknown'}</td>
                        <td className="p-3 text-center text-muted-foreground capitalize">{ad.advertisement_type}</td>
                        <td className="p-3 text-center">{getStatusBadge(ad.status)}</td>
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
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Performance Summary */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
                <BarChart3 className="h-5 w-5" />
                Campaign Summary
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Total Ads</p>
                    <p className="text-xl font-bold text-white">{ads.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Active</p>
                    <p className="text-xl font-bold text-emerald-400">{activeAds.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Pending</p>
                    <p className="text-xl font-bold text-yellow-400">{pendingAds.length}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground">Rejected</p>
                    <p className="text-xl font-bold text-red-400">{rejectedAds.length}</p>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-white/10">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Total Spend</span>
                    <span className="font-bold text-white">{formatBudget(totalSpent)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Views</span>
                    <span className="font-bold text-white">{totalImpressions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Top Performing Ads */}
            <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
                <TrendingUp className="h-5 w-5" />
                Top Performing Ads
              </h3>
              
              {ads.filter(ad => ad.clicks_count > 0).length === 0 ? (
                <div className="text-center py-8">
                  <Megaphone className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-3" />
                  <p className="text-muted-foreground">No performance data available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...ads]
                    .sort((a, b) => b.clicks_count - a.clicks_count)
                    .slice(0, 3)
                    .map((ad, idx) => (
                      <div key={ad.id} className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-primary">#{idx + 1}</span>
                            <span className="font-medium text-white">{ad.title}</span>
                          </div>
                          <span className="text-emerald-400 font-semibold">{ad.clicks_count} clicks</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div>
                            <p className="text-muted-foreground">Views</p>
                            <p className="font-semibold text-white">{ad.views_count.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">CTR</p>
                            <p className="font-semibold text-primary">
                              {ad.views_count > 0 ? ((ad.clicks_count / ad.views_count) * 100).toFixed(2) : '0'}%
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Budget</p>
                            <p className="font-semibold text-white">{formatBudget(ad.budget)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </Card>
          </div>

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
                      <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Views</th>
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
                      const hasActive = vendorAds.some(ad => ad.status === 'active');
                      
                      return (
                        <tr key={vendor.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-3 text-white">{vendor.name}</td>
                          <td className="p-3 text-center text-white">{vendorAds.length}</td>
                          <td className="p-3 text-center text-white">{vendorImpressions.toLocaleString()}</td>
                          <td className="p-3 text-center text-white">{vendorClicks.toLocaleString()}</td>
                          <td className="p-3 text-center text-white">{formatBudget(vendorBudget)}</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                              hasActive 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                : 'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }`}>
                              {hasActive ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                              {hasActive ? 'Active' : 'Inactive'}
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
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Reject Advertisement</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please provide a reason for rejecting this advertisement. The vendor will receive this feedback.
            </DialogDescription>
          </DialogHeader>

          {selectedAd && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-medium text-white">{selectedAd.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Vendor: {selectedAd.vendor_name || 'Unknown'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Budget: {formatBudget(selectedAd.budget)}
                </p>
              </div>

              <div>
                <Label className="text-white">Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this advertisement is being rejected..."
                  rows={4}
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be specific to help the vendor improve their advertisement
                </p>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setRejectDialogOpen(false)} className="btn-outline-premium">
                  Cancel
                </Button>
                <Button onClick={handleRejectConfirm} disabled={isSubmitting} className="bg-red-500 hover:bg-red-600">
                  {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Reject Advertisement
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}