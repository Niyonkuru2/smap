import { useState } from 'react';
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
  Star
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Advertisement, 
  AdPackage, 
  AD_PACKAGES, 
  SAMPLE_ADS,
  calculateAdStats,
  getAdsByAdvertiser
} from '../../lib/advertisementService';

export function AdvertisementManager() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'my-ads' | 'create' | 'packages' | 'analytics'>('my-ads');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<AdPackage | null>(null);
  
  // Get ads for current vendor/business
  const myAds = SAMPLE_ADS; // In real app, filter by current user
  const stats = calculateAdStats(myAds);
  
  // Form state
  const [adForm, setAdForm] = useState({
    title: '',
    description: '',
    imageUrl: '',
    targetUrl: '',
    type: 'banner',
    placements: [] as string[],
    markets: [] as string[],
    categories: [] as string[],
    budget: '',
    startDate: '',
    endDate: '',
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active: 'bg-green-900 text-green-100',
      pending_review: 'bg-green-800 text-green-100',
      paused: 'bg-green-900 text-green-100',
      expired: 'bg-green-950 text-green-100',
      rejected: 'bg-green-950 text-green-100',
      draft: 'bg-green-900 text-green-100',
    };
    const icons: Record<string, JSX.Element> = {
      active: <CheckCircle className="h-3 w-3" />,
      pending_review: <Clock className="h-3 w-3" />,
      paused: <Pause className="h-3 w-3" />,
      expired: <AlertCircle className="h-3 w-3" />,
      rejected: <AlertCircle className="h-3 w-3" />,
      draft: <Edit className="h-3 w-3" />,
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${styles[status] || styles.draft}`}>
        {icons[status]}
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const tabs = [
    { id: 'my-ads', label: 'My Ads', icon: Megaphone },
    { id: 'create', label: 'Create Ad', icon: Plus },
    { id: 'packages', label: 'Ad Packages', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-green-900 to-green-950 border-green-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl">
              <Megaphone className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{t('advertisementManager') || 'Advertisement Manager'}</h2>
              <p className="text-sm text-green-300">
                Promote your products and reach more customers
              </p>
            </div>
          </div>
          <Button 
            onClick={() => setActiveTab('create')}
            className="bg-gradient-to-r from-orange-500 to-pink-500"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Ad
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl border border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-green-400" />
              <span className="text-xs text-green-300">Impressions</span>
            </div>
            <p className="text-2xl font-bold text-green-100">{stats.totalImpressions.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl border border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <MousePointer className="h-4 w-4 text-green-400" />
              <span className="text-xs text-green-300">Clicks</span>
            </div>
            <p className="text-2xl font-bold text-green-100">{stats.totalClicks.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl border border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <span className="text-xs text-green-300">CTR</span>
            </div>
            <p className="text-2xl font-bold text-green-100">{stats.avgCtr.toFixed(2)}%</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl border border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-400" />
              <span className="text-xs text-green-300">Spent</span>
            </div>
            <p className="text-2xl font-bold text-green-100">{stats.totalSpent.toLocaleString()} RWF</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl border border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-green-400" />
              <span className="text-xs text-green-300">Revenue</span>
            </div>
            <p className="text-2xl font-bold text-green-100">{stats.totalRevenue.toLocaleString()} RWF</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* My Ads Tab */}
      {activeTab === 'my-ads' && (
        <div className="space-y-4">
          {myAds.map((ad) => (
            <Card key={ad.id} className="p-4 bg-gradient-to-br from-green-900 to-green-950 border-green-700">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gradient-to-br from-green-800 to-green-900 rounded-lg flex items-center justify-center flex-shrink-0 border border-green-700">
                  <Image className="h-8 w-8 text-green-300" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-white">{ad.title}</h3>
                      <p className="text-sm text-green-300">{ad.description}</p>
                    </div>
                    {getStatusBadge(ad.status)}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-green-300">Impressions</p>
                      <p className="font-semibold text-white">{ad.metrics.impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-300">Clicks</p>
                      <p className="font-semibold text-white">{ad.metrics.clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-300">CTR</p>
                      <p className="font-semibold text-white">{ad.metrics.ctr.toFixed(2)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-green-300">Budget Used</p>
                      <p className="font-semibold text-white">{Math.round((ad.spent / ad.budget) * 100)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-green-700">
                    <span className="text-xs text-green-300">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {ad.startDate} - {ad.endDate}
                    </span>
                    <span className="text-xs text-green-300 ml-4">
                      Type: {ad.type.replace('_', ' ')}
                    </span>
                    <div className="flex-1" />
                    <Button size="sm" variant="outline" onClick={() => {}} className="border-green-700 bg-green-900 text-green-200 hover:bg-green-800">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {ad.status === 'active' ? (
                      <Button size="sm" variant="outline" onClick={() => {}} className="border-green-700 bg-green-900 text-green-200 hover:bg-green-800">
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => {}} className="border-green-700 bg-green-900 text-green-200 hover:bg-green-800">
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => {}} className="border-green-700 bg-green-900 text-green-200 hover:bg-green-800">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Ad Tab */}
      {activeTab === 'create' && (
        <Card className="p-6 glass-card">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Advertisement
          </h3>
          
          <form className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Ad Title</Label>
                  <Input 
                    placeholder="Enter a catchy title for your ad"
                    value={adForm.title}
                    onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    placeholder="Describe your offer or product"
                    rows={3}
                    value={adForm.description}
                    onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Ad Type</Label>
                  <Select value={adForm.type} onValueChange={(v) => setAdForm({ ...adForm, type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="banner">Banner Ad</SelectItem>
                      <SelectItem value="featured_product">Featured Product</SelectItem>
                      <SelectItem value="sponsored_listing">Sponsored Listing</SelectItem>
                      <SelectItem value="sidebar">Sidebar Ad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Target URL</Label>
                  <Input 
                    placeholder="https://..."
                    value={adForm.targetUrl}
                    onChange={(e) => setAdForm({ ...adForm, targetUrl: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Upload Image</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center bg-secondary">
                    <Image className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload or drag and drop</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Date</Label>
                    <Input 
                      type="date"
                      value={adForm.startDate}
                      onChange={(e) => setAdForm({ ...adForm, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>End Date</Label>
                    <Input 
                      type="date"
                      value={adForm.endDate}
                      onChange={(e) => setAdForm({ ...adForm, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Budget (RWF)</Label>
                  <Input 
                    type="number"
                    placeholder="50000"
                    value={adForm.budget}
                    onChange={(e) => setAdForm({ ...adForm, budget: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Targeting Options</Label>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Markets
                  </h4>
                  <div className="space-y-2 text-sm">
                    {['Kimironko', 'Nyabugogo', 'Muhima', 'Kicukiro'].map(market => (
                      <label key={market} className="flex items-center gap-2">
                        <Checkbox />
                        {market}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Categories</h4>
                  <div className="space-y-2 text-sm">
                    {['Vegetables', 'Fruits', 'Meat', 'Dairy', 'Grains'].map(cat => (
                      <label key={cat} className="flex items-center gap-2">
                        <Checkbox />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">User Types</h4>
                  <div className="space-y-2 text-sm">
                    {['Consumers', 'Businesses', 'Vendors'].map(type => (
                      <label key={type} className="flex items-center gap-2">
                        <Checkbox />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => alert('Advertisement saved as draft!')}
              >
                Save as Draft
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-orange-500 to-pink-500">
                Submit for Review
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="grid md:grid-cols-3 gap-6">
          {AD_PACKAGES.map((pkg) => (
            <Card 
              key={pkg.id}
              className={`p-6 relative overflow-hidden ${
                pkg.popular 
                  ? 'border-2 border-green-600 glass-card' 
                  : 'glass-card'
              }`}
            >
              {pkg.popular && (
                <div className="absolute top-4 right-4">
                  <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    Popular
                  </span>
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${
                  pkg.id === 'premium' 
                    ? 'bg-gradient-to-br from-slate-700 to-slate-800' 
                    : pkg.id === 'standard'
                    ? 'bg-gradient-to-br from-blue-400 to-indigo-500'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  {pkg.id === 'premium' ? (
                    <Crown className="h-5 w-5 text-white" />
                  ) : pkg.id === 'standard' ? (
                    <Zap className="h-5 w-5 text-white" />
                  ) : (
                    <Package className="h-5 w-5 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg">{pkg.name}</h3>
                  <p className="text-sm text-muted-foreground">{pkg.duration} days</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{pkg.description}</p>

              <div className="mb-4">
                <span className="text-3xl font-bold">{pkg.price.toLocaleString()}</span>
                <span className="text-muted-foreground"> RWF</span>
              </div>

              <ul className="space-y-2 mb-6">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button 
                className={`w-full ${
                  pkg.popular 
                    ? 'bg-gradient-to-r from-orange-500 to-pink-500' 
                    : ''
                }`}
                variant={pkg.popular ? 'default' : 'outline'}
              >
                Choose {pkg.name}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card className="p-6 glass-card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance Overview
            </h3>
            
            <div className="h-64 bg-gradient-to-br from-secondary to-secondary rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-muted-foreground">Performance chart coming soon</p>
                <p className="text-sm text-muted-foreground">Track impressions, clicks, and conversions over time</p>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 glass-card">
              <h3 className="text-lg font-semibold mb-4">Top Performing Ads</h3>
              <div className="space-y-3">
                {myAds.slice(0, 3).map((ad, i) => (
                  <div key={ad.id} className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-green-600 text-white' :
                      i === 1 ? 'bg-green-700 text-white' :
                      'bg-green-800 text-white'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{ad.title}</p>
                      <p className="text-xs text-muted-foreground">CTR: {ad.metrics.ctr}%</p>
                    </div>
                    <span className="font-semibold text-green-600">
                      {ad.metrics.conversions} conversions
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 glass-card">
              <h3 className="text-lg font-semibold mb-4">ROI Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-900 rounded-lg">
                  <span>Total Revenue</span>
                  <span className="font-bold text-green-300">{stats.totalRevenue.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-950 rounded-lg">
                  <span>Total Spent</span>
                  <span className="font-bold text-green-300">{stats.totalSpent.toLocaleString()} RWF</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-900 rounded-lg">
                  <span>Net Profit</span>
                  <span className="font-bold text-green-300">
                    {(stats.totalRevenue - stats.totalSpent).toLocaleString()} RWF
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-950 rounded-lg">
                  <span>ROI</span>
                  <span className="font-bold text-green-300">
                    {(((stats.totalRevenue - stats.totalSpent) / stats.totalSpent) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

