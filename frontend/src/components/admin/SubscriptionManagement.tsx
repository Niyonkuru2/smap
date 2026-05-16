// src/components/admin/SubscriptionManagement.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  Crown, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw
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
  const [activeTab, setActiveTab] = useState('plans');
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [pendingSubscriptions, setPendingSubscriptions] = useState<PendingSubscription[]>([]);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
    // Required field validation
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
      // Prepare data for API
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
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="h-3 w-3 mr-1" /> Expired</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30"><XCircle className="h-3 w-3 mr-1" /> Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Subscription Management</h2>
          <p className="text-muted-foreground mt-1">Manage subscription plans and approve user subscriptions</p>
        </div>
        <Button onClick={handleAddPlan} className="btn-premium">
          <Plus className="h-4 w-4 mr-2" />
          Add New Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats?.total_subscriptions || 0}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">{stats?.active_count || 0}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{stats?.pending_count || 0}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expired</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{stats?.expired_count || 0}</div>
          </CardContent>
        </Card>
        <Card className="dark-glass border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {stats?.total_revenue?.toLocaleString()} RWF
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Card className="dark-glass border-white/10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="border-b border-white/10 rounded-none px-6 pt-4">
            <TabsTrigger value="plans" className="data-[state=active]:border-primary">
              <Crown className="h-4 w-4 mr-2" />
              Subscription Plans
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:border-primary">
              <Clock className="h-4 w-4 mr-2" />
              Pending Approvals
              {pendingSubscriptions.length > 0 && (
                <Badge className="ml-2 bg-yellow-500/20 text-yellow-400">
                  {pendingSubscriptions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Plans Tab */}
          <TabsContent value="plans" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <Card key={plan.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{plan.name}</CardTitle>
                      {!plan.is_active && (
                        <Badge className="bg-red-500/20 text-red-400">Inactive</Badge>
                      )}
                    </div>
                    <CardDescription className="text-muted-foreground">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-primary">
                        {plan.price.toLocaleString()} RWF
                      </span>
                      <span className="text-muted-foreground"> / {plan.duration_days} days</span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      {plan.max_products && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-muted-foreground">Up to {plan.max_products} products</span>
                        </div>
                      )}
                      {plan.max_price_submissions && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-muted-foreground">Up to {plan.max_price_submissions} price submissions</span>
                        </div>
                      )}
                      {plan.priority_support && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-muted-foreground">Priority support</span>
                        </div>
                      )}
                      {plan.featured_listing && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-muted-foreground">Featured listing</span>
                        </div>
                      )}
                      {plan.analytics_access && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-emerald-400" />
                          <span className="text-muted-foreground">Advanced analytics access</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-6 pt-4 border-t border-white/10">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEditPlan(plan)}
                        
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
                  </CardContent>
                </Card>
              ))}
            </div>

            {plans.length === 0 && (
              <div className="text-center py-12">
                <Crown className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-white">No subscription plans found</p>
                <p className="text-sm text-muted-foreground">Click "Add New Plan" to create your first plan</p>
              </div>
            )}
          </TabsContent>

          {/* Pending Subscriptions Tab */}
          <TabsContent value="pending" className="p-6">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10">
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingSubscriptions.map((sub) => (
                    <TableRow key={sub.id} className="border-white/5 hover:bg-white/5">
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{sub.user_name}</div>
                          <div className="text-xs text-muted-foreground">{sub.user_email}</div>
                          {sub.user_phone && (
                            <div className="text-xs text-muted-foreground">{sub.user_phone}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-white">{sub.plan_name}</div>
                        <div className="text-xs text-muted-foreground">{sub.duration_days} days</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-emerald-400">
                          {Number(sub.amount_paid).toLocaleString()} RWF
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-primary/30 text-primary">
                          {sub.payment_method}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(sub.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(sub.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pendingSubscriptions.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
                <p className="text-white">No pending subscriptions</p>
                <p className="text-sm text-muted-foreground">All subscription requests have been processed</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>

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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSavePlan} className="btn-premium">
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Subscription Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="dark-glass border-white/10">
          <DialogHeader>
            <DialogTitle className="gradient-text">Reject Subscription</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this subscription request
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-white">User</Label>
              <p className="text-white font-medium mt-1">{selectedSubscription?.user_name}</p>
              <p className="text-sm text-muted-foreground">{selectedSubscription?.user_email}</p>
            </div>
            <div>
              <Label className="text-white">Plan</Label>
              <p className="text-white font-medium mt-1">{selectedSubscription?.plan_name}</p>
              <p className="text-sm text-muted-foreground">{selectedSubscription?.amount_paid?.toLocaleString()} RWF</p>
            </div>
            <div>
              <Label className="text-white">Rejection Reason *</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this subscription request is being rejected..."
                rows={3}
                className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)} className="btn-outline-premium">
              Cancel
            </Button>
            <Button onClick={handleRejectSubscription} className="bg-red-500 hover:bg-red-600">
              Reject Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}