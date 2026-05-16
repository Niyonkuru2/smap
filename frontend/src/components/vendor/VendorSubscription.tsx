import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { 
  Crown, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Package,
  Zap,
  Shield,
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { toast } from 'sonner';
import {
  getAllPlans,
  getMyActiveSubscription,
  getMySubscriptions,
  subscribeToPlan,
  cancelSubscription,
  formatPlanPrice,
  formatDate,
  getDaysRemaining,
  type SubscriptionPlan,
  type UserSubscription,
  type SubscriptionWithDetails
} from '../../services/subscriptionService';

interface VendorSubscriptionProps {
  vendorId: string;
  vendorName: string;
}

export default function VendorSubscription({ vendorId, vendorName }: VendorSubscriptionProps) {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSubscription, setActiveSubscription] = useState<SubscriptionWithDetails | null>(null);
  const [subscriptionHistory, setSubscriptionHistory] = useState<UserSubscription[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [isSubscribeDialogOpen, setIsSubscribeDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchPlans(),
        fetchActiveSubscription(),
        fetchSubscriptionHistory()
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
      setPlans(data.filter(p => p.is_active));
    } catch (error) {
      toast.error('Failed to load subscription plans');
    }
  };

  const fetchActiveSubscription = async () => {
    try {
      const subscription = await getMyActiveSubscription();
      setActiveSubscription(subscription as SubscriptionWithDetails);
    } catch (error) {
      console.error('Error fetching active subscription:', error);
    }
  };

  const fetchSubscriptionHistory = async () => {
    try {
      const history = await getMySubscriptions(10);
      setSubscriptionHistory(history);
    } catch (error) {
      console.error('Error fetching subscription history:', error);
    }
  };

  const handleSubscribe = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setPaymentMethod('bank_transfer');
    setPaymentReference('');
    setIsSubscribeDialogOpen(true);
  };

  const handleSubscribeConfirm = async () => {
    if (!selectedPlan) return;

    setIsSubscribing(true);
    try {
      const result = await subscribeToPlan({
        planId: selectedPlan.id,
        paymentMethod,
        paymentReference: paymentReference || undefined
      });

      if (result.success) {
        toast.success(result.message);
        setIsSubscribeDialogOpen(false);
        await Promise.all([
          fetchActiveSubscription(),
          fetchSubscriptionHistory()
        ]);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to subscribe');
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!activeSubscription) return;

    setIsSubscribing(true);
    try {
      const result = await cancelSubscription(activeSubscription.id);
      if (result.success) {
        toast.success(result.message);
        setIsCancelDialogOpen(false);
        await Promise.all([
          fetchActiveSubscription(),
          fetchSubscriptionHistory()
        ]);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel subscription');
    } finally {
      setIsSubscribing(false);
    }
  };

  const getStatusBadge = (status: string) => {
  const baseBadge =
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border whitespace-nowrap";

  switch (status) {
    case "active":
      return (
        <span
          className={`${baseBadge} bg-emerald-500/10 text-emerald-300 border-emerald-500/30`}
        >
          <CheckCircle className="h-3 w-3" />
          Active
        </span>
      );

    case "pending":
      return (
        <span
          className={`${baseBadge} bg-yellow-500/10 text-yellow-300 border-yellow-500/30`}
        >
          <Clock className="h-3 w-3" />
          Pending Approval
        </span>
      );

    case "expired":
      return (
        <span
          className={`${baseBadge} bg-red-500/10 text-red-300 border-red-500/30`}
        >
          <AlertCircle className="h-3 w-3" />
          Expired
        </span>
      );

    case "cancelled":
      return (
        <span
          className={`${baseBadge} bg-white/5 text-gray-300 border-white/10`}
        >
          <XCircle className="h-3 w-3" />
          Cancelled
        </span>
      );

    default:
      return (
        <span
          className={`${baseBadge} bg-white/5 text-white border-white/10`}
        >
          {status}
        </span>
      );
  }
};

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading subscription plans...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Subscription Management</h2>
          <p className="text-muted-foreground mt-1">Manage your subscription plan and benefits</p>
        </div>
        <Button
          variant="premium"
          size="sm"
          onClick={() => fetchAllData()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Active Subscription Card */}
      {activeSubscription && activeSubscription.status === 'active' && (
        <Card className="rounded-xl dark-glass border-white/10 shadow-lg overflow-hidden">
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-emerald-500/10 to-primary/5" />
          <CardContent className="relative p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Crown className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{activeSubscription.plan_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(activeSubscription.status)}
                    <span className="text-sm text-muted-foreground">
                      Expires: {formatDate(activeSubscription.end_date)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-muted-foreground">Days Remaining</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {getDaysRemaining(activeSubscription.end_date)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelDialogOpen(true)}
                  className="mt-2 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-200"
                >
                  Cancel Subscription
                </Button>
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Your Benefits</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {activeSubscription.max_products && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-sm text-white">Up to {activeSubscription.max_products} products</span>
                  </div>
                )}
                {activeSubscription.max_price_submissions && (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm text-white">Up to {activeSubscription.max_price_submissions} price submissions</span>
                  </div>
                )}
                {activeSubscription.priority_support && (
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span className="text-sm text-white">Priority support</span>
                  </div>
                )}
                {activeSubscription.featured_listing && (
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <span className="text-sm text-white">Featured listing</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Subscription Card */}
      {activeSubscription && activeSubscription.status === 'pending' && (
        <Card className="rounded-xl dark-glass border-white/10 shadow-lg bg-yellow-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">Subscription Pending Approval</h3>
                <p className="text-muted-foreground mt-1">
                  Your request for <span className="text-white font-medium">{activeSubscription.plan_name}</span> plan is being reviewed by our team.
                  You'll be notified once approved.
                </p>
                <div className="mt-3 text-sm text-muted-foreground">
                  Submitted on: {formatDate(activeSubscription.created_at)}
                </div>
              </div>
              {getStatusBadge(activeSubscription.status)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Active Subscription - Show Plans */}
      {(!activeSubscription || (activeSubscription.status !== 'active' && activeSubscription.status !== 'pending')) && (
        <>
          <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
            <CardContent className="p-6 text-center">
              <Crown className="h-12 w-12 mx-auto text-primary mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Active Subscription</h3>
              <p className="text-muted-foreground">
                Choose a plan below to unlock premium features and benefits.
              </p>
            </CardContent>
          </Card>

          {/* Subscription Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className="rounded-xl dark-glass border-white/10 shadow-lg hover:border-primary/50 transition-all">
                <CardHeader>
                  <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <span className="text-3xl font-bold gradient-text">
                      {formatPlanPrice(plan.price)}
                    </span>
                    <span className="text-muted-foreground"> / {plan.duration_days} days</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    {plan.max_products && (
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Up to {plan.max_products} products</span>
                      </div>
                    )}
                    {plan.max_price_submissions && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Up to {plan.max_price_submissions} price submissions</span>
                      </div>
                    )}
                    {plan.priority_support && (
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Priority support</span>
                      </div>
                    )}
                    {plan.featured_listing && (
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Featured listing</span>
                      </div>
                    )}
                    {plan.analytics_access && (
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-muted-foreground">Advanced analytics</span>
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plan)}
                    className="w-full mt-6 btn-premium"
                    disabled={!!activeSubscription}
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Subscribe Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Subscription History */}
      {subscriptionHistory.length > 0 && (
        <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="text-white">Subscription History</CardTitle>
            <CardDescription className="text-muted-foreground">
              View your past subscription records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subscriptionHistory.map((sub) => (
                <div key={sub.id} className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{sub.plan_name}</h4>
                        {getStatusBadge(sub.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatPlanPrice(sub.amount_paid)} • {sub.duration_days} days
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Started: {formatDate(sub.start_date)} • 
                        {sub.status === 'expired' || sub.status === 'cancelled' 
                          ? ` Ended: ${formatDate(sub.end_date)}`
                          : ` Expires: ${formatDate(sub.end_date)}`}
                      </p>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Payment: </span>
                      <span className="text-white uppercase">{sub.payment_method}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscribe Dialog */}
      <Dialog open={isSubscribeDialogOpen} onOpenChange={setIsSubscribeDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Subscribe to {selectedPlan?.name} Plan</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Complete your subscription to unlock premium benefits
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-semibold text-white">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Price</span>
                  <span className="font-semibold text-primary">{formatPlanPrice(selectedPlan.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Duration</span>
                  <span className="text-white">{selectedPlan.duration_days} days</span>
                </div>
              </div>

              <div>
                <Label className="text-white">Payment Method *</Label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full mt-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white focus:border-primary/50 focus:outline-none"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="mobile_money">Mobile Money</option>
                  <option value="card">Credit/Debit Card</option>
                </select>
              </div>

              <div>
                <Label className="text-white">Payment Reference (Optional)</Label>
                <Input
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter transaction reference if available"
                  className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                />
              </div>

              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                <p className="text-xs text-yellow-400 flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span>Your subscription will be activated after admin approval. You'll receive a notification once approved.</span>
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsSubscribeDialogOpen(false)} className="flex-1 btn-outline-premium">
                  Cancel
                </Button>
                <Button onClick={handleSubscribeConfirm} disabled={isSubscribing} className="flex-1 btn-premium">
                  {isSubscribing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <DollarSign className="h-4 w-4 mr-2" />}
                  {isSubscribing ? 'Processing...' : `Subscribe ${formatPlanPrice(selectedPlan.price)}`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Cancel Subscription</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to cancel your subscription?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-400">
                Cancelling your subscription will:
              </p>
              <ul className="text-sm text-red-300 mt-2 space-y-1 list-disc list-inside">
                <li>Stop auto-renewal of your plan</li>
                <li>Remove premium benefits after the current period ends</li>
                <li>You'll have access until {activeSubscription ? formatDate(activeSubscription.end_date) : 'the end date'}</li>
              </ul>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCancelDialogOpen(false)} className="btn-outline-premium">
                Keep Subscription
              </Button>
              <Button onClick={handleCancelSubscription} disabled={isSubscribing} className="bg-red-500 hover:bg-red-600">
                {isSubscribing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                Yes, Cancel Subscription
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}