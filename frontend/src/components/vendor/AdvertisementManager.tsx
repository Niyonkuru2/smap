import { useEffect, useState } from 'react';
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
  Trash2,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';

import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';

import {
  getAllCategories,
  type Category,
} from '../../services/categoryService';

import {
  getMyAdvertisements,
  getMyAdStats,
  submitAdvertisement,
  updateAdvertisement,
  deleteAdvertisement,
  formatBudget,
  formatAdType,
  type Advertisement,
  type AdStats,
  type AdPerformance,
  type SubmitAdRequest,
} from '../../services/advertisementService';

type ActiveTab = 'my-ads' | 'create' | 'analytics';

const initialForm: SubmitAdRequest = {
  title: '',
  description: '',
  image_url: '',
  target_url: '',
  advertisement_type: 'banner',
  placement: '',
  budget: 0,
  start_date: '',
  end_date: '',
};

export function AdvertisementManager() {
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<ActiveTab>('my-ads');

  const [ads, setAds] = useState<Advertisement[]>([]);
  const [stats, setStats] = useState<AdStats | null>(null);
  const [performance, setPerformance] = useState<AdPerformance[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  const [adForm, setAdForm] = useState<SubmitAdRequest>(initialForm);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);

    try {
      await Promise.all([
        fetchAdvertisements(),
        fetchStatistics(),
        fetchCategories(),
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdvertisements = async () => {
    try {
      const data = await getMyAdvertisements();
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching advertisements:', error);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await getMyAdStats();

      setStats(data?.stats || null);
      setPerformance(data?.performance || []);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getAllCategories();

      setCategories(
        (data || []).filter((category) => category.type === 'product')
      );
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const resetForm = () => {
    setAdForm(initialForm);
    setEditingAd(null);
  };

  const handleCreateAd = () => {
    resetForm();
    setActiveTab('create');
  };

  const handleEditAd = (ad: Advertisement) => {
    setEditingAd(ad);

    setAdForm({
      title: ad.title || '',
      description: ad.description || '',
      image_url: ad.image_url || '',
      target_url: ad.target_url || '',
      advertisement_type: ad.advertisement_type || 'banner',
      placement: ad.placement || '',
      budget: Number(ad.budget) || 0,
      start_date: ad.start_date
        ? ad.start_date.split('T')[0]
        : '',
      end_date: ad.end_date
        ? ad.end_date.split('T')[0]
        : '',
    });

    setActiveTab('create');
  };

  const handleDeleteAd = async (adId: number) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this advertisement?'
    );

    if (!confirmed) return;

    try {
      const result = await deleteAdvertisement(adId);

      if (result.success) {
        toast.success(result.message);

        await fetchAllData();
      }
    } catch (error: any) {
      toast.error(
        error?.message || 'Failed to delete advertisement'
      );
    }
  };

  const handleSubmitAd = async () => {
    if (!adForm.title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (Number(adForm.budget) <= 0) {
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
          budget: Number(adForm.budget),
          start_date: adForm.start_date,
          end_date: adForm.end_date,
        });
      } else {
        result = await submitAdvertisement({
          ...adForm,
          budget: Number(adForm.budget),
        });
      }

      if (result.success) {
        toast.success(result.message);

        resetForm();

        setActiveTab('my-ads');

        await fetchAllData();
      } else if (result.requiresSubscription) {
        toast.error(
          'You need an active subscription before creating advertisements.'
        );
      }
    } catch (error: any) {
      toast.error(
        error?.message || 'Failed to submit advertisement'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCTR = (
    clicks: number | string,
    views: number | string
  ) => {
    const safeClicks = Number(clicks) || 0;
    const safeViews = Number(views) || 0;

    if (safeViews <= 0) return '0.00';

    return ((safeClicks / safeViews) * 100).toFixed(2);
  };

  const getSafeNumber = (
    value: number | string | null | undefined
  ) => {
    return Number(value) || 0;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      active:
        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      approved:
        'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      pending:
        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      rejected:
        'bg-red-500/20 text-red-400 border-red-500/30',
      expired:
        'bg-gray-500/20 text-gray-400 border-gray-500/30',
    };

    const icons: Record<string, JSX.Element> = {
      active: <CheckCircle className="h-3 w-3" />,
      approved: <CheckCircle className="h-3 w-3" />,
      pending: <Clock className="h-3 w-3" />,
      rejected: <AlertCircle className="h-3 w-3" />,
      expired: <AlertCircle className="h-3 w-3" />,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${
          styles[status] || styles.pending
        }`}
      >
        {icons[status]}
        {status.toUpperCase()}
      </span>
    );
  };

  const tabs = [
    {
      id: 'my-ads',
      label: 'My Ads',
      icon: Megaphone,
    },
    {
      id: 'create',
      label: 'Create Ad',
      icon: Plus,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />

        <span className="ml-3 text-muted-foreground">
          Loading advertisements...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg backdrop-blur-xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-primary/20 p-3">
              <Megaphone className="h-6 w-6 text-primary" />
            </div>

            <div>
              <h2 className="text-2xl font-bold gradient-text">
                {t('advertisementManager') ||
                  'Advertisement Manager'}
              </h2>

              <p className="text-sm text-muted-foreground">
                Promote your products and reach more customers
              </p>
            </div>
          </div>

          <Button
            onClick={handleCreateAd}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create New Ad
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <StatCard
              icon={<Eye className="h-4 w-4 text-primary" />}
              label="Impressions"
              value={getSafeNumber(
                stats.total_views
              ).toLocaleString()}
            />

            <StatCard
              icon={
                <MousePointer className="h-4 w-4 text-primary" />
              }
              label="Clicks"
              value={getSafeNumber(
                stats.total_clicks
              ).toLocaleString()}
            />

            <StatCard
              icon={
                <TrendingUp className="h-4 w-4 text-primary" />
              }
              label="CTR"
              value={`${getCTR(
                stats.total_clicks,
                stats.total_views
              )}%`}
            />

            <StatCard
              icon={
                <DollarSign className="h-4 w-4 text-primary" />
              }
              label="Active Ads"
              value={String(
                getSafeNumber(stats.active_ads)
              )}
            />

            <StatCard
              icon={
                <BarChart3 className="h-4 w-4 text-primary" />
              }
              label="Total Ads"
              value={String(
                getSafeNumber(stats.total_ads)
              )}
            />
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-2 shadow-lg backdrop-blur-xl scrollbar-hide">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <Button
              key={tab.id}
              variant="ghost"
              onClick={() =>
                setActiveTab(tab.id as ActiveTab)
              }
              className={`relative flex min-w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'border-emerald-400/30 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-700 text-white shadow-lg shadow-emerald-500/20'
                  : 'border-transparent bg-transparent text-muted-foreground hover:border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon className="h-4 w-4" />

              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* MY ADS */}
      {activeTab === 'my-ads' && (
        <div className="space-y-4">
          {ads.length === 0 ? (
            <Card className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center backdrop-blur-xl">
              <Megaphone className="mx-auto mb-4 h-12 w-12 opacity-30" />

              <h3 className="text-lg font-semibold text-white">
                No advertisements yet
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Click below to create your first advertisement
              </p>

              <Button
                onClick={handleCreateAd}
                className="mt-5"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Ad
              </Button>
            </Card>
          ) : (
            ads.map((ad) => (
              <Card
                key={ad.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg transition-all hover:border-primary/30 backdrop-blur-xl"
              >
                <div className="flex flex-wrap gap-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    {ad.image_url ? (
                      <img
                        src={ad.image_url}
                        alt={ad.title}
                        className="h-full w-full rounded-xl object-cover"
                      />
                    ) : (
                      <Image className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold text-white">
                          {ad.title}
                        </h3>

                        <p className="text-sm text-muted-foreground">
                          {ad.description}
                        </p>
                      </div>

                      {getStatusBadge(ad.status)}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
                      <Metric
                        label="Impressions"
                        value={getSafeNumber(
                          ad.views_count
                        ).toLocaleString()}
                      />

                      <Metric
                        label="Clicks"
                        value={getSafeNumber(
                          ad.clicks_count
                        ).toLocaleString()}
                      />

                      <Metric
                        label="CTR"
                        value={`${getCTR(
                          ad.clicks_count,
                          ad.views_count
                        )}%`}
                      />

                      <Metric
                        label="Budget"
                        value={formatBudget(
                          getSafeNumber(ad.budget)
                        )}
                      />
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                      <span className="text-xs text-muted-foreground">
                        <Calendar className="mr-1 inline h-3 w-3" />
                        Type:{' '}
                        {formatAdType(
                          ad.advertisement_type
                        )}
                      </span>

                      <div className="flex-1" />

                      {ad.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleEditAd(ad)
                            }
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Edit
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDeleteAd(ad.id)
                            }
                            className="hover:border-red-500/30 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 text-red-400" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* CREATE */}
      {activeTab === 'create' && (
        <Card className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg backdrop-blur-xl">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold gradient-text">
            <Plus className="h-5 w-5" />

            {editingAd
              ? 'Edit Advertisement'
              : 'Create New Advertisement'}
          </h3>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmitAd();
            }}
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <FormInput
                  label="Ad Title *"
                  value={adForm.title}
                  onChange={(value) =>
                    setAdForm({
                      ...adForm,
                      title: value,
                    })
                  }
                  placeholder="Enter advertisement title"
                />

                <div>
                  <Label className="text-white">
                    Description
                  </Label>

                  <Textarea
                    rows={4}
                    value={adForm.description}
                    placeholder="Advertisement description"
                    onChange={(e) =>
                      setAdForm({
                        ...adForm,
                        description: e.target.value,
                      })
                    }
                    className="mt-1.5 border-white/10 bg-white/5 text-white placeholder:text-muted-foreground"
                  />
                </div>

                <div>
                  <Label className="text-white">
                    Ad Type
                  </Label>

                  <Select
                    value={adForm.advertisement_type}
                    onValueChange={(value) =>
                      setAdForm({
                        ...adForm,
                        advertisement_type:
                          value as any,
                      })
                    }
                  >
                    <SelectTrigger className="mt-1.5 border-white/10 bg-white/5 text-white">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent className="border-white/10 bg-background">
                      <SelectItem value="banner">
                        Banner Ad
                      </SelectItem>

                      <SelectItem value="sponsored">
                        Sponsored
                      </SelectItem>

                      <SelectItem value="featured">
                        Featured
                      </SelectItem>

                      <SelectItem value="popup">
                        Popup
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <FormInput
                  label="Target URL"
                  value={adForm.target_url || ''}
                  onChange={(value) =>
                    setAdForm({
                      ...adForm,
                      target_url: value,
                    })
                  }
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-4">
                <FormInput
                  label="Image URL"
                  value={adForm.image_url || ''}
                  onChange={(value) =>
                    setAdForm({
                      ...adForm,
                      image_url: value,
                    })
                  }
                  placeholder="https://image-url.com"
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">
                      Start Date
                    </Label>

                    <Input
                      type="date"
                      value={adForm.start_date}
                      onChange={(e) =>
                        setAdForm({
                          ...adForm,
                          start_date: e.target.value,
                        })
                      }
                      className="mt-1.5 border-white/10 bg-white/5 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white">
                      End Date
                    </Label>

                    <Input
                      type="date"
                      value={adForm.end_date}
                      onChange={(e) =>
                        setAdForm({
                          ...adForm,
                          end_date: e.target.value,
                        })
                      }
                      className="mt-1.5 border-white/10 bg-white/5 text-white"
                    />
                  </div>
                </div>

                <FormInput
                  label="Budget (RWF) *"
                  type="number"
                  value={
                    adForm.budget
                      ? String(adForm.budget)
                      : ''
                  }
                  onChange={(value) =>
                    setAdForm({
                      ...adForm,
                      budget:
                        parseFloat(value) || 0,
                    })
                  }
                  placeholder="50000"
                />

                <FormInput
                  label="Placement"
                  value={adForm.placement || ''}
                  onChange={(value) =>
                    setAdForm({
                      ...adForm,
                      placement: value,
                    })
                  }
                  placeholder="homepage, sidebar..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setActiveTab('my-ads')
                }
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                {editingAd
                  ? 'Update Ad'
                  : 'Submit for Review'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ANALYTICS */}
      {activeTab === 'analytics' && (
        <Card className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-lg backdrop-blur-xl">
          <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold gradient-text">
            <BarChart3 className="h-5 w-5" />
            Advertisement Analytics
          </h3>

          {performance.length === 0 ? (
            <div className="py-12 text-center">
              <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-30" />

              <p className="text-muted-foreground">
                No analytics data available yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {performance.map((ad) => (
                <div
                  key={ad.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-semibold text-white">
                      {ad.title}
                    </h4>

                    {getStatusBadge(ad.status)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                    <Metric
                      label="Budget"
                      value={formatBudget(
                        getSafeNumber(ad.budget)
                      )}
                    />

                    <Metric
                      label="Views"
                      value={getSafeNumber(
                        ad.views_count
                      ).toLocaleString()}
                    />

                    <Metric
                      label="Clicks"
                      value={getSafeNumber(
                        ad.clicks_count
                      ).toLocaleString()}
                    />

                    <Metric
                      label="CTR"
                      value={`${
                        Number(ad.ctr || 0).toFixed(
                          2
                        )
                      }%`}
                    />

                    <Metric
                      label="Cost / Click"
                      value={formatBudget(
                        getSafeNumber(
                          ad.cost_per_click
                        )
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/* -------------------------------- COMPONENTS -------------------------------- */

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}

        <span className="text-xs text-muted-foreground">
          {label}
        </span>
      </div>

      <p className="text-2xl font-bold text-white">
        {value}
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="font-semibold text-white">
        {value}
      </p>
    </div>
  );
}

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label className="text-white">{label}</Label>

      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="mt-1.5 border-white/10 bg-white/5 text-white placeholder:text-muted-foreground"
      />
    </div>
  );
}