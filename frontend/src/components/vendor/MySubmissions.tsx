// components/vendor/MySubmissions.tsx
import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Clock, Check, X, AlertCircle, RefreshCw, MapPin, Loader2 } from 'lucide-react';
import { useProducts, useMarkets } from '../../hooks/useAppData';
import { useLanguage } from '../../contexts/LanguageContext';
import { getMySubmissions } from '../../services/priceSubmissionService';
import { toast } from 'sonner';

interface Submission {
  id: string;
  product_id: string;
  market_id: string;
  vendor_id: string;
  price: number;
  unit: string;
  vendor_notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  flagged: boolean;
  flag_reason?: string;
  created_at: string;
  product_name?: string;
  market_name?: string;
}

interface MySubmissionsProps {
  vendorName: string;
  vendorId: string;
}

export default function MySubmissions({ vendorName, vendorId }: MySubmissionsProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t } = useLanguage();
  const { products } = useProducts();
  const { markets } = useMarkets();

  useEffect(() => {
    loadSubmissions();
    
    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      loadSubmissions(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [vendorId]);

  const loadSubmissions = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    
    try {
      const response = await getMySubmissions();
      if (response.success && response.submissions) {
        setSubmissions(response.submissions);
      }
    } catch (error: any) {
      if (!silent) {
        toast.error(error.message || 'Failed to load submissions');
      }
      console.error('Error loading submissions:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status: string, flagged: boolean) => {
    if (flagged) {
      return (
        <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
          <AlertCircle className="h-3 w-3 mr-1" />
          Flagged for Review
        </Badge>
      );
    }
    
    switch (status) {
      case 'approved':
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <Check className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <X className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        );
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const hours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (hours < 1) return 'Just now';
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return '1 day ago';
    return `${days} days ago`;
  };

  const getTimeColor = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const hours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (hours < 24) return 'text-emerald-400';
    if (hours < 48) return 'text-yellow-400';
    return 'text-muted-foreground';
  };

  const pendingCount = submissions.filter(s => s.status === 'pending' && !s.flagged).length;
  const flaggedCount = submissions.filter(s => s.flagged).length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  if (loading) {
    return (
      <Card className="p-12 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Loading your submissions...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">My Price Submissions</h2>
          <p className="text-muted-foreground mt-1">Track the status of your submitted prices</p>
        </div>
        <Button variant="premium" size="sm">
  <RefreshCw className="h-4 w-4" />
  Refresh
</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-semibold text-white">{submissions.length}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-primary/40" />
          </div>
        </Card>
        
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-2xl font-semibold text-yellow-400">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500/60" />
          </div>
        </Card>
        
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Flagged</p>
              <p className="text-2xl font-semibold text-orange-400">{flaggedCount}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500/60" />
          </div>
        </Card>
        
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Approved</p>
              <p className="text-2xl font-semibold text-emerald-400">{approvedCount}</p>
            </div>
            <Check className="h-8 w-8 text-emerald-500/60" />
          </div>
        </Card>
        
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Rejected</p>
              <p className="text-2xl font-semibold text-red-400">{rejectedCount}</p>
            </div>
            <X className="h-8 w-8 text-red-500/60" />
          </div>
        </Card>
      </div>

      {/* Submissions List */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="text-lg mb-4 gradient-text">All Submissions</h3>
        
        {submissions.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="font-medium text-white">No submissions yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Submit your first price to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {submissions.map((submission) => {
              // Find product and market from hooks or use data from API
              const product = products.find(p => p.id.toString() === submission.product_id);
              const market = markets.find(m => m.id === submission.market_id);
              
              return (
                <div
                  key={submission.id}
                  className={`p-4 rounded-xl border transition-all ${
                    submission.flagged
                      ? 'bg-orange-500/5 border-orange-500/30'
                      : submission.status === 'approved'
                      ? 'bg-emerald-500/5 border-emerald-500/30'
                      : submission.status === 'rejected'
                      ? 'bg-red-500/5 border-red-500/30'
                      : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-medium text-white text-lg">
                          {product?.name || submission.product_name || 'Unknown Product'}
                        </h4>
                        {getStatusBadge(submission.status, submission.flagged)}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {market?.name || submission.market_name || 'Unknown Market'}
                        {market?.location && ` (${market.location})`}
                      </p>
                      
                      <div className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="font-semibold text-white text-lg">
                          {submission.price.toLocaleString()} RWF
                        </span>
                        <span className="text-muted-foreground">
                          per {submission.unit}
                        </span>
                        <span className={`flex items-center gap-1 ${getTimeColor(submission.created_at)}`}>
                          <Clock className="h-3 w-3" />
                          {getTimeAgo(submission.created_at)}
                        </span>
                      </div>

                      {/* Vendor Notes */}
                      {submission.vendor_notes && (
                        <div className="mt-3 p-2 rounded-lg bg-white/5 border border-white/10">
                          <p className="text-xs text-muted-foreground mb-1">Your notes:</p>
                          <p className="text-sm text-white">{submission.vendor_notes}</p>
                        </div>
                      )}

                      {/* Flag Reason */}
                      {submission.flagged && submission.flag_reason && (
                        <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium text-orange-400">Flagged Reason:</p>
                              <p className="text-sm text-orange-300 mt-1">{submission.flag_reason}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Approval Message */}
                      {submission.status === 'approved' && !submission.flagged && (
                        <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                          <p className="text-sm text-emerald-400">
                            ✓ This price is now live and visible to all users!
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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

        .gradient-text {
          background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
}