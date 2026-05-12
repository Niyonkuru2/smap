import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { 
  Megaphone,
  Plus,
  Eye,
  MousePointer,
  DollarSign,
  BarChart3,
  TrendingUp,
  Calendar,
  Image,
  Target,
  Play,
  Pause,
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Package,
  Zap,
  Crown,
  Star,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import { useMarkets } from '../../hooks/useAppData';
import { getAllCategories, type Category } from '../../services/categoryService';
import {
  getMyAdvertisements,
  getMyAdStats,
  submitAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  getActiveAdvertisements,
  formatBudget,
  formatAdType,
  type Advertisement,
  type AdStats,
  type AdPerformance,
  type SubmitAdRequest
} from '../../services/advertisementService';

export function AdvertisementManager() {
  const { t } = useLanguage();
  const { markets, loading: marketsLoading } = useMarkets();
  const [activeTab, setActiveTab] = useState<'my-ads' | 'create' | 'analytics'>('my-ads');
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [stats, setStats] = useState<AdStats | null>(null);
  const [performance, setPerformance] = useState<AdPerformance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [adForm, setAdForm] = useState<SubmitAdRequest>({
    title: '',
    description: '',
    image_url: '',
    target_url: '',
    advertisement_type: 'banner',
    placement: '',
    budget: 0,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchAds(),
        fetchStats(),
        fetchCategories()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAds = async () => {
    try {
      const data = await getMyAdvertisements();
      setAds(data);
    } catch (error) {
      console.error('Error fetching ads:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getMyAdStats();
      setStats(data.stats);
      setPerformance(data.performance);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();
      setCategories(data.filter(c => c.type === 'product'));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateAd = () => {
    setEditingAd(null);
    setAdForm({
      title: '',
      description: '',
      image_url: '',
      target_url: '',
      advertisement_type: 'banner',
      placement: '',
      budget: 0,
      start_date: '',
      end_date: '',
    });
    setShowCreateForm(true);
    setActiveTab('create');
  };

  const handleEditAd = (ad: Advertisement) => {
    setEditingAd(ad);
    setAdForm({
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url || '',
      target_url: ad.target_url || '',
      advertisement_type: ad.advertisement_type,
      placement: ad.placement || '',
      budget: ad.budget,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
    });
    setShowCreateForm(true);
    setActiveTab('create');
  };

  const handleDeleteAd = async (adId: number) => {
    if (window.confirm('Are you sure you want to delete this advertisement?')) {
      try {
        const result = await deleteAdvertisement(adId);
        if (result.success) {
          toast.success(result.message);
          fetchAds();
          fetchStats();
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to delete advertisement');
      }
    }
  };

  const handleSubmitAd = async () => {
    if (!adForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (adForm.budget <= 0) {
      toast.error('Valid budget is required');
      return;
    }

    setIsSubmitting(true);
    try {
      let result;
      if (editingAd) {
        result = await updateAdvertisement(editingAd.id, {
          title: adForm.title,
          description: adForm.description,
          image_url: adForm.image_url,
          target_url: adForm.target_url,
          budget: adForm.budget,
          start_date: adForm.start_date,
          end_date: adForm.end_date,
        });
      } else {
        result = await submitAdvertisement(adForm);
      }
      
      if (result.success) {
        toast.success(result.message);
        setShowCreateForm(false);
        setActiveTab('my-ads');
        await fetchAllData();
      } else if (result.requiresSubscription) {
        toast.error('You need an active subscription to submit advertisements. Please subscribe to a plan first.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit advertisement');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
      expired: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };
    const icons: Record<string, JSX.Element> = {
      active: <CheckCircle className="h-3 w-3" />,
      approved: <CheckCircle className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />,
      rejected: <AlertCircle className="h-3 w-3" />,
      expired: <AlertCircle className="h-3 w-3" />,
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 border ${styles[status] || styles.pending}`}>
        {icons[status]}
        {status.toUpperCase()}
      </span>
    );
  };

  const tabs = [
    { id: 'my-ads', label: 'My Ads', icon: Megaphone },
    { id: 'create', label: 'Create Ad', icon: Plus },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading advertisements...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold gradient-text">{t('advertisementManager') || 'Advertisement Manager'}</h2>
              <p className="text-sm text-muted-foreground">
                Promote your products and reach more customers
              </p>
            </div>
          </div>
          <Button 
            onClick={handleCreateAd}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Ad
          </Button>
        </div>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Impressions</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.total_views.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <MousePointer className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Clicks</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.total_clicks.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">CTR</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {stats.total_views > 0 
                  ? ((stats.total_clicks / stats.total_views) * 100).toFixed(2)
                  : '0'}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Active Ads</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.active_ads}</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Ads</span>
              </div>
              <p className="text-2xl font-bold text-white">{stats.total_ads}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
              setShowCreateForm(false);
            }}
            className={`flex items-center gap-2 ${
              activeTab === tab.id 
                ? 'bg-primary hover:bg-primary/90 text-white' 
                : 'hover:bg-white/10'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* My Ads Tab */}
      {activeTab === 'my-ads' && (
        <div className="space-y-4">
          {ads.length === 0 ? (
            <Card className="p-12 text-center rounded-xl dark-glass border-white/10">
              <Megaphone className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
              <p className="text-white">No advertisements yet</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Create New Ad" to get started</p>
              <Button onClick={handleCreateAd} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Ad
              </Button>
            </Card>
          ) : (
            ads.map((ad) => (
              <Card key={ad.id} className="p-4 rounded-xl dark-glass border-white/10 hover:border-primary/30 transition-all">
                <div className="flex gap-4 flex-wrap">
                  <div className="w-24 h-24 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                    {ad.image_url ? (
                      <img src={ad.image_url} alt={ad.title} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <Image className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                      <div>
                        <h3 className="font-semibold text-white">{ad.title}</h3>
                        <p className="text-sm text-muted-foreground">{ad.description}</p>
                      </div>
                      {getStatusBadge(ad.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Impressions</p>
                        <p className="font-semibold text-white">{ad.views_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                        <p className="font-semibold text-white">{ad.clicks_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CTR</p>
                        <p className="font-semibold text-white">
                          {ad.views_count > 0 
                            ? ((ad.clicks_count / ad.views_count) * 100).toFixed(2)
                            : '0'}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="font-semibold text-white">{formatBudget(ad.budget)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        Type: {formatAdType(ad.advertisement_type)}
                      </span>
                      <div className="flex-1" />
                      <div className="flex gap-2">
                        {ad.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleEditAd(ad)}
                              className="btn-outline-premium"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteAd(ad.id)}
                              className="hover:bg-red-500/10 hover:border-red-500/30"
                            >
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Ad Tab */}
      {activeTab === 'create' && (
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 gradient-text">
            <Plus className="h-5 w-5" />
            {editingAd ? 'Edit Advertisement' : 'Create New Advertisement'}
          </h3>
          
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmitAd(); }}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Ad Title *</Label>
                  <Input 
                    placeholder="Enter a catchy title for your ad"
                    value={adForm.title}
                    onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                    className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>
                
                <div>
                  <Label className="text-white">Description</Label>
                  <Textarea 
                    placeholder="Describe your offer or product"
                    rows={3}
                    value={adForm.description}
                    onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                    className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <Label className="text-white">Ad Type</Label>
                  <Select value={adForm.advertisement_type} onValueChange={(v) => setAdForm({ ...adForm, advertisement_type: v as any })}>
                    <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark-glass border-white/10">
                      <SelectItem value="banner">Banner Ad</SelectItem>
                      <SelectItem value="sponsored">Sponsored</SelectItem>
                      <SelectItem value="featured">Featured Listing</SelectItem>
                      <SelectItem value="popup">Popup Ad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-white">Target URL</Label>
                  <Input 
                    placeholder="https://..."
                    value={adForm.target_url}
                    onChange={(e) => setAdForm({ ...adForm, target_url: e.target.value })}
                    className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-white">Image URL</Label>
                  <Input 
                    placeholder="https://..."
                    value={adForm.image_url}
                    onChange={(e) => setAdForm({ ...adForm, image_url: e.target.value })}
                    className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Start Date</Label>
                    <Input 
                      type="date"
                      value={adForm.start_date}
                      onChange={(e) => setAdForm({ ...adForm, start_date: e.target.value })}
                      className="mt-1.5 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">End Date</Label>
                    <Input 
                      type="date"
                      value={adForm.end_date}
                      onChange={(e) => setAdForm({ ...adForm, end_date: e.target.value })}
                      className="mt-1.5 bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-white">Budget (RWF) *</Label>
                  <Input 
                    type="number"
                    placeholder="50000"
                    value={adForm.budget || ''}
                    onChange={(e) => setAdForm({ ...adForm, budget: parseFloat(e.target.value) || 0 })}
                    className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                    required
                  />
                </div>

                <div>
                  <Label className="text-white">Placement</Label>
                  <Input 
                    placeholder="e.g., homepage, sidebar, product-page"
                    value={adForm.placement || ''}
                    onChange={(e) => setAdForm({ ...adForm, placement: e.target.value })}
                    className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => {
                  setActiveTab('my-ads');
                  setShowCreateForm(false);
                }}
                className="btn-outline-premium"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {editingAd ? 'Update Ad' : 'Submit for Review'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
              <BarChart3 className="h-5 w-5" />
              Ad Performance
            </h3>
            
            {performance.length === 0 ? (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
                <p className="text-muted-foreground">No performance data available yet</p>
                <p className="text-sm text-muted-foreground">Create ads and start getting impressions to see analytics</p>
              </div>
            ) : (
              <div className="space-y-4">
                {performance.map((ad) => (
                  <div key={ad.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <h4 className="font-semibold text-white">{ad.title}</h4>
                      {getStatusBadge(ad.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Budget</p>
                        <p className="font-semibold text-white">{formatBudget(ad.budget)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Views</p>
                        <p className="font-semibold text-white">{ad.views_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                        <p className="font-semibold text-white">{ad.clicks_count.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CTR</p>
                        <p className="font-semibold text-primary">{ad.ctr.toFixed(2)}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cost per Click</p>
                        <p className="font-semibold text-emerald-400">{formatBudget(ad.cost_per_click)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}