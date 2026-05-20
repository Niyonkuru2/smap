import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { 
  Crown, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Users,
  DollarSign,
  Calendar,
  TrendingUp
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import {
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
  getPendingSubscriptions,
  approveSubscription,
  rejectSubscription,
  getSubscriptionStats,
  type SubscriptionPlan,
  type PendingSubscription,
  type SubscriptionStats
} from '../../services/subscriptionService';

export default function SubscriptionManagement() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'plans' | 'pending'>('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [pendingSubscriptions, setPendingSubscriptions] = useState<PendingSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<PendingSubscription | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: '',
    description: '',
    price: 0,
    duration_days: 30,
    max_products: null,
    max_price_submissions: null,
    priority_support: false,
    featured_listing: false,
    analytics_access: false
  });

  // Fetch data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchPlans(),
        fetchPendingSubscriptions(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const data = await getAllPlans(true);
      setPlans(data);
    } catch (error) {
      toast.error('Failed to load subscription plans');
    }
  };

  const fetchPendingSubscriptions = async () => {
    try {
      const data = await getPendingSubscriptions();
      setPendingSubscriptions(data);
    } catch (error) {
      console.error('Error fetching pending subscriptions:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await getSubscriptionStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchAllData();
    setIsRefreshing(false);
    toast.success('Data refreshed');
  };

  const handleAddPlan = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration_days: 30,
      max_products: null,
      max_price_submissions: null,
      priority_support: false,
      featured_listing: false,
      analytics_access: false
    });
    setIsDialogOpen(true);
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      duration_days: plan.duration_days,
      max_products: plan.max_products,
      max_price_submissions: plan.max_price_submissions,
      priority_support: plan.priority_support,
      featured_listing: plan.featured_listing,
      analytics_access: plan.analytics_access
    });
    setIsDialogOpen(true);
  };

  const handleDeletePlan = async (planId: number) => {
    if (window.confirm('Are you sure you want to deactivate this plan?')) {
      try {
        await deletePlan(planId);
        toast.success('Plan deactivated successfully');
        fetchPlans();
      } catch (error) {
        toast.error('Failed to deactivate plan');
      }
    }
  };

  const handleSavePlan = async () => {
    if (!formData.name || formData.name.trim() === '') {
      toast.error('Plan name is required');
      return;
    }
    
    if (formData.price === undefined || formData.price === null) {
      toast.error('Price is required');
      return;
    }
    
    if (formData.price < 0) {
      toast.error('Price cannot be negative');
      return;
    }
    
    if (!formData.duration_days || formData.duration_days <= 0) {
      toast.error('Valid duration is required');
      return;
    }

    try {
      const planToSave = {
        name: formData.name.trim(),
        description: formData.description || '',
        price: Number(formData.price),
        duration_days: Number(formData.duration_days),
        max_products: (formData.max_products === null || formData.max_products === 0) ? null : Number(formData.max_products),
        max_price_submissions: (formData.max_price_submissions === null || formData.max_price_submissions === 0) ? null : Number(formData.max_price_submissions),
        priority_support: Boolean(formData.priority_support),
        featured_listing: Boolean(formData.featured_listing),
        analytics_access: Boolean(formData.analytics_access)
      };

      if (editingPlan) {
        await updatePlan(editingPlan.id, planToSave);
        toast.success('Plan updated successfully');
      } else {
        await createPlan(planToSave);
        toast.success('Plan created successfully');
      }
      
      setIsDialogOpen(false);
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration_days: 30,
        max_products: null,
        max_price_submissions: null,
        priority_support: false,
        featured_listing: false,
        analytics_access: false
      });
      await fetchPlans();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      const errorMessage = error?.response?.data?.message || error?.message || (editingPlan ? 'Failed to update plan' : 'Failed to create plan');
      toast.error(errorMessage);
    }
  };

  const handleApproveSubscription = async (subscriptionId: number) => {
    try {
      await approveSubscription(subscriptionId);
      toast.success('Subscription approved successfully');
      await Promise.all([
        fetchPendingSubscriptions(),
        fetchStats()
      ]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to approve subscription');
    }
  };

  const handleRejectSubscription = async () => {
    if (!selectedSubscription) return;
    
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      await rejectSubscription(selectedSubscription.id, rejectionReason);
      toast.success('Subscription rejected');
      setIsRejectDialogOpen(false);
      setSelectedSubscription(null);
      setRejectionReason('');
      await Promise.all([
        fetchPendingSubscriptions(),
        fetchStats()
      ]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Failed to reject subscription');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: JSX.Element; color: string; label: string }> = {
      active: { icon: <CheckCircle className="h-3 w-3" />, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'Active' },
      pending: { icon: <Clock className="h-3 w-3" />, color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'Pending' },
      expired: { icon: <AlertCircle className="h-3 w-3" />, color: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'Expired' },
      cancelled: { icon: <XCircle className="h-3 w-3" />, color: 'bg-slate-500/20 text-slate-400 border-slate-500/30', label: 'Cancelled' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading subscription data...</span>
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
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold gradient-text">{t('subscriptionManagement') || 'Subscription Management'}</h2>
              <p className="text-xs lg:text-sm text-muted-foreground">
                Manage subscription plans and approve user subscriptions
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="btn-outline-premium">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleAddPlan} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add New Plan
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-white">{stats?.total_subscriptions || 0}</p>
            <p className="text-xs text-muted-foreground">Total Subscriptions</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white">{stats?.active_count || 0}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-400" />
            </div>
            <p className="text-xl font-bold text-white">{stats?.pending_count || 0}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-red-400" />
            </div>
            <p className="text-xl font-bold text-white">{stats?.expired_count || 0}</p>
            <p className="text-xs text-muted-foreground">Expired</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xl font-bold text-white">{stats?.total_revenue?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <Button
          variant={activeTab === 'plans' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 ${activeTab === 'plans' ? 'bg-primary hover:bg-primary/90' : 'hover:bg-white/10'}`}
        >
          <Crown className="h-4 w-4" />
          Subscription Plans
        </Button>
        <Button
          variant={activeTab === 'pending' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 ${activeTab === 'pending' ? 'bg-primary hover:bg-primary/90' : 'hover:bg-white/10'}`}
        >
          <Clock className="h-4 w-4" />
          Pending Approvals
          {pendingSubscriptions.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
              {pendingSubscriptions.length}
            </span>
          )}
        </Button>
      </div>

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans.length === 0 ? (
            <Card className="p-12 text-center rounded-xl dark-glass border-white/10 col-span-full">
              <Crown className="h-12 w-12 mx-auto text-muted-foreground opacity-30 mb-4" />
              <p className="text-white font-medium">No Subscription Plans</p>
              <p className="text-sm text-muted-foreground mt-1">Click "Add New Plan" to create your first plan</p>
            </Card>
          ) : (
            plans.map((plan) => (
              <Card key={plan.id} className="p-5 rounded-xl dark-glass border-white/10 hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-white text-lg">{plan.name}</h3>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    )}
                  </div>
                  {!plan.is_active && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border bg-red-500/20 text-red-400 border-red-500/30">
                      <XCircle className="h-3 w-3" />
                      Inactive
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <span className="text-2xl font-bold text-primary">{plan.price.toLocaleString()} RWF</span>
                  <span className="text-muted-foreground"> / {plan.duration_days} days</span>
                </div>

                <div className="space-y-2 mb-4">
                  {plan.max_products && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-muted-foreground">Up to {plan.max_products} products</span>
                    </div>
                  )}
                  {plan.max_price_submissions && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-muted-foreground">Up to {plan.max_price_submissions} price submissions</span>
                    </div>
                  )}
                  {plan.priority_support && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-muted-foreground">Priority support</span>
                    </div>
                  )}
                  {plan.featured_listing && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-muted-foreground">Featured listing</span>
                    </div>
                  )}
                  {plan.analytics_access && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      <span className="text-muted-foreground">Advanced analytics access</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-white/10">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditPlan(plan)}
                    className="flex-1 btn-outline-premium"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeletePlan(plan.id)}
                    className="flex-1 hover:bg-red-500/10 hover:border-red-500/30"
                  >
                    <Trash2 className="h-4 w-4 mr-2 text-red-400" />
                    Delete
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pending Subscriptions Tab - Using Table Design from AdAnalyticsDashboard */}
      {activeTab === 'pending' && (
        <Card className="rounded-xl dark-glass border-white/10 shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">User</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Plan</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Amount</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Payment Method</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Request Date</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="text-center p-3 text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingSubscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <CheckCircle className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
                      <p className="text-white font-medium">No Pending Subscriptions</p>
                      <p className="text-sm text-muted-foreground mt-1">All subscription requests have been processed</p>
                    </td>
                  </tr>
                ) : (
                  pendingSubscriptions.map((sub) => (
                    <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-white">{sub.user_name}</div>
                        <div className="text-xs text-muted-foreground">{sub.user_email}</div>
                        {sub.user_phone && (
                          <div className="text-xs text-muted-foreground">{sub.user_phone}</div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-white">{sub.plan_name}</div>
                        <div className="text-xs text-muted-foreground">{sub.duration_days} days</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-semibold text-emerald-400">
                          {Number(sub.amount_paid).toLocaleString()} RWF
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-primary/30 text-primary bg-primary/10">
                          {sub.payment_method}
                        </span>
                      </td>
                      <td className="p-3 text-center text-muted-foreground">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-3 text-center">
                        {getStatusBadge(sub.status)}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            onClick={() => handleApproveSubscription(sub.id)}
                            className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedSubscription(sub);
                              setIsRejectDialogOpen(true);
                            }}
                            className="hover:bg-red-500/10 hover:border-red-500/30"
                          >
                            <XCircle className="h-4 w-4 mr-1 text-red-400" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add/Edit Plan Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gradient-text">
              {editingPlan ? 'Edit Subscription Plan' : 'Create New Plan'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Configure the subscription plan details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white">Plan Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Basic, Premium, Enterprise"
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the plan benefits"
                rows={3}
                className="mt-1.5 bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Price (RWF) *</Label>
                <Input
                  type="number"
                  value={formData.price === 0 ? '' : formData.price}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    price: e.target.value === '' ? 0 : parseFloat(e.target.value) 
                  })}
                  placeholder="0"
                  className="mt-1.5 bg-white/5 border-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white">Duration (Days) *</Label>
                <Input
                  type="number"
                  value={formData.duration_days === 0 ? '' : formData.duration_days}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    duration_days: e.target.value === '' ? 30 : parseInt(e.target.value) 
                  })}
                  placeholder="30"
                  className="mt-1.5 bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Features</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.priority_support}
                    onChange={(e) => setFormData({ ...formData, priority_support: e.target.checked })}
                    className="rounded border-white/20 bg-white/5"
                  />
                  <span className="text-sm text-muted-foreground">Priority Support</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.featured_listing}
                    onChange={(e) => setFormData({ ...formData, featured_listing: e.target.checked })}
                    className="rounded border-white/20 bg-white/5"
                  />
                  <span className="text-sm text-muted-foreground">Featured Listing</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.analytics_access}
                    onChange={(e) => setFormData({ ...formData, analytics_access: e.target.checked })}
                    className="rounded border-white/20 bg-white/5"
                  />
                  <span className="text-sm text-muted-foreground">Analytics Access</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Max Products</Label>
                <Input
                  type="number"
                  value={formData.max_products === null || formData.max_products === 0 ? '' : formData.max_products}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    max_products: e.target.value === '' ? null : parseInt(e.target.value) 
                  })}
                  placeholder="Unlimited"
                  className="mt-1.5 bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
              </div>
              <div>
                <Label className="text-white">Max Price Submissions</Label>
                <Input
                  type="number"
                  value={formData.max_price_submissions === null || formData.max_price_submissions === 0 ? '' : formData.max_price_submissions}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    max_price_submissions: e.target.value === '' ? null : parseInt(e.target.value) 
                  })}
                  placeholder="Unlimited"
                  className="mt-1.5 bg-white/5 border-white/10 text-white"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="btn-outline-premium">
              Cancel
            </Button>
            <Button onClick={handleSavePlan} className="bg-primary hover:bg-primary/90">
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Subscription Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Reject Subscription</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please provide a reason for rejecting this subscription request
            </DialogDescription>
          </DialogHeader>
          
          {selectedSubscription && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <p className="font-medium text-white">{selectedSubscription.user_name}</p>
                <p className="text-sm text-muted-foreground">{selectedSubscription.user_email}</p>
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-sm text-white">Plan: {selectedSubscription.plan_name}</p>
                  <p className="text-sm text-emerald-400">{Number(selectedSubscription.amount_paid).toLocaleString()} RWF</p>
                </div>
              </div>

              <div>
                <Label className="text-white">Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this subscription request is being rejected..."
                  rows={4}
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be specific to help the user understand the rejection
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} className="btn-outline-premium">
              Cancel
            </Button>
            <Button onClick={handleRejectSubscription} className="bg-red-500 hover:bg-red-600">
              <XCircle className="h-4 w-4 mr-2" />
              Reject Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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