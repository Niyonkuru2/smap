// components/admin/PriceApprovals.tsx
import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { 
  Check, X, Search, Clock, TrendingUp, AlertCircle, Info, 
  MapPin, User, Package, DollarSign, Calendar, Loader2, 
  Eye, EyeOff, RefreshCw 
} from 'lucide-react';
import { useProducts, useMarkets } from '../../hooks/useAppData';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { getAllSubmissions, approveSubmission, rejectSubmission } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';

interface Submission {
  id: number;
  productId: string;
  product_id?: string;
  marketId: string;
  market_id?: string;
  vendorId: string;
  vendor_id?: string;
  vendorName: string;
  vendor_name?: string;
  price: number;
  quantity: number;
  unit: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  imageUrl?: string;
  image_url?: string;
  rejectionReason?: string;
  rejection_reason?: string;
  flagReason?: string;
  flag_reason?: string;
  vendorNotes?: string;
  vendor_notes?: string;
  adminNotes?: string;
  admin_notes?: string;
  createdAt: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  approvedAt?: string;
  approved_at?: string;
  rejectedAt?: string;
  rejected_at?: string;
  ageInHours: number;
  age_in_hours?: number;
}

export default function PriceApprovals() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'flagged'>('pending');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const { t } = useLanguage();
  const { products } = useProducts();
  const { markets } = useMarkets();

  useEffect(() => {
    loadSubmissions();
    
    // Poll for new submissions every 10 seconds
    const interval = setInterval(() => {
      loadSubmissions(true);
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadSubmissions = async (silent = false) => {
    if (!silent) setLoading(true);
    
    try {
      const response = await getAllSubmissions();
      let subs = response.submissions || response.data || [];
      
      // Normalize data structure
      subs = subs.map((s: any) => ({
        id: s.id,
        productId: s.productId || s.product_id?.toString(),
        product_id: s.product_id,
        marketId: s.marketId || s.market_id,
        market_id: s.market_id,
        vendorId: s.vendorId || s.vendor_id?.toString(),
        vendor_id: s.vendor_id,
        vendorName: s.vendorName || s.vendor_name || 'Unknown Vendor',
        vendor_name: s.vendor_name,
        price: typeof s.price === 'string' ? parseFloat(s.price) : s.price,
        quantity: s.quantity || 1,
        unit: s.unit || 'kg',
        status: s.status || 'pending',
        imageUrl: s.imageUrl || s.image_url,
        image_url: s.image_url,
        rejectionReason: s.rejectionReason || s.rejection_reason,
        rejection_reason: s.rejection_reason,
        flagReason: s.flagReason || s.flag_reason,
        flag_reason: s.flag_reason,
        vendorNotes: s.vendorNotes || s.vendor_notes,
        vendor_notes: s.vendor_notes,
        adminNotes: s.adminNotes || s.admin_notes,
        admin_notes: s.admin_notes,
        createdAt: s.createdAt || s.created_at,
        created_at: s.created_at,
        updatedAt: s.updatedAt || s.updated_at,
        updated_at: s.updated_at,
        approvedAt: s.approvedAt || s.approved_at,
        approved_at: s.approved_at,
        rejectedAt: s.rejectedAt || s.rejected_at,
        rejected_at: s.rejected_at,
        ageInHours: s.ageInHours || s.age_in_hours || 0,
        age_in_hours: s.age_in_hours
      }));
      
      setSubmissions(subs);
    } catch (error) {
      if (!silent) {
        console.error('Error loading submissions:', error);
        toast.error('Failed to load submissions');
      }
    } finally {
      setLoading(false);
    }
  };

  const getProduct = (productId: string) => {
    if (!productId) return null;
    return products.find(p => p.id === productId || p.id === parseInt(productId));
  };
  
  const getMarket = (marketId: string) => {
    if (!marketId) return null;
    return markets.find(m => m.id === marketId);
  };

  const getTimeAgo = (dateString: string) => {
    if (!dateString) return 'Unknown';
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

  const handleApprove = async (submission: Submission) => {
    setSelectedSubmission(submission);
    setAdminNotes('');
    setApproveDialogOpen(true);
  };

  const handleApproveConfirm = async () => {
    if (!selectedSubmission) return;
    
    setSubmitting(true);
    try {
      await approveSubmission(selectedSubmission.id.toString());
      
      toast.success(`✓ Price for ${selectedSubmission.vendorName} approved!`, {
        description: `${selectedSubmission.price.toLocaleString()} RWF - Vendor will be notified`
      });
      await loadSubmissions();
      setApproveDialogOpen(false);
      setSelectedSubmission(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve submission');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectClick = (submission: Submission) => {
    setSelectedSubmission(submission);
    setRejectionReason('');
    setAdminNotes('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedSubmission) return;
    
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setSubmitting(true);
    try {
      await rejectSubmission(selectedSubmission.id.toString(), rejectionReason);
      
      toast.error(`✗ Price for ${selectedSubmission.vendorName} rejected`, {
        description: 'Vendor has been notified with the reason'
      });
      await loadSubmissions();
      setRejectDialogOpen(false);
      setSelectedSubmission(null);
      setRejectionReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject submission');
    } finally {
      setSubmitting(false);
    }
  };

  const isFlagged = (submission: Submission) => {
    return !!submission.flagReason || !!submission.flag_reason;
  };

  const filteredSubmissions = submissions
    .filter(s => {
      if (filter === 'all') return true;
      if (filter === 'flagged') return isFlagged(s);
      return s.status === filter;
    })
    .filter(s => {
      if (!searchTerm) return true;
      const product = getProduct(s.productId || s.product_id?.toString() || '');
      const market = getMarket(s.marketId || s.market_id || '');
      return (
        product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.vendorName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      // Pending and flagged first, then by newest
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      if (isFlagged(a) && !isFlagged(b)) return -1;
      if (!isFlagged(a) && isFlagged(b)) return 1;
      return (b.ageInHours || 0) - (a.ageInHours || 0);
    });

  const pendingCount = submissions.filter(s => s.status === 'pending' && !isFlagged(s)).length;
  const flaggedCount = submissions.filter(s => isFlagged(s)).length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  if (loading) {
    return (
      <Card className="p-12 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-muted-foreground">Loading submissions...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold gradient-text">Price Approval Dashboard</h2>
          <p className="text-muted-foreground mt-1">Review and manage vendor price submissions</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadSubmissions()}
          className="btn-outline-premium"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
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
            <TrendingUp className="h-8 w-8 text-primary/40" />
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

      {/* Alert for pending submissions */}
      {(pendingCount > 0 || flaggedCount > 0) && (
        <Card className="p-4 dark-glass border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <h4 className="font-medium text-white">
                {pendingCount > 0 && `${pendingCount} submission(s) awaiting review`}
                {pendingCount > 0 && flaggedCount > 0 && ' • '}
                {flaggedCount > 0 && `${flaggedCount} flagged submission(s) need attention`}
              </h4>
              <p className="text-sm text-muted-foreground">
                Review price submissions to keep market data accurate and up-to-date
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product, market, or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
              className={filter === 'pending' ? 'bg-primary hover:bg-primary/90' : 'border-white/10 hover:bg-white/10'}
            >
              Pending {pendingCount > 0 && `(${pendingCount})`}
            </Button>
            <Button
              variant={filter === 'flagged' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('flagged')}
              className={filter === 'flagged' ? 'bg-orange-500 hover:bg-orange-600' : 'border-white/10 hover:bg-white/10'}
            >
              Flagged {flaggedCount > 0 && `(${flaggedCount})`}
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('approved')}
              className={filter === 'approved' ? 'bg-primary hover:bg-primary/90' : 'border-white/10 hover:bg-white/10'}
            >
              Approved
            </Button>
            <Button
              variant={filter === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('rejected')}
              className={filter === 'rejected' ? 'bg-primary hover:bg-primary/90' : 'border-white/10 hover:bg-white/10'}
            >
              Rejected
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-primary hover:bg-primary/90' : 'border-white/10 hover:bg-white/10'}
            >
              All
            </Button>
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.map((submission) => {
          const product = getProduct(submission.productId || submission.product_id?.toString() || '');
          const market = getMarket(submission.marketId || submission.market_id || '');
          const isFlaggedItem = isFlagged(submission);
          const isExpanded = expandedId === submission.id;
          
          return (
            <Card 
              key={submission.id} 
              className={`overflow-hidden rounded-xl dark-glass border-white/10 shadow-lg transition-all ${
                isFlaggedItem ? 'border-l-4 border-l-orange-500' : ''
              }`}
            >
              <div className="p-4">
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg text-white">{product?.name || 'Unknown Product'}</h3>
                      {getStatusBadge(submission.status, isFlaggedItem)}
                    </div>
                    
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {market?.name || submission.marketId || submission.market_id || 'Unknown Market'}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <User className="h-3 w-3" />
                        {submission.vendorName || submission.vendor_name || 'Unknown Vendor'}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {getTimeAgo(submission.createdAt || submission.created_at || '')}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(submission.createdAt || submission.created_at || '').toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="text-left lg:text-right">
                    <div className="flex items-center gap-2 justify-start lg:justify-end">
                      <span className="text-2xl font-bold gradient-text">
                        {submission.price.toLocaleString()} RWF
                      </span>
                      <Badge variant="outline" className="border-primary/50 text-primary">
                        per {submission.unit}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Quantity: {submission.quantity} {submission.unit}
                    </div>
                  </div>
                </div>

                {/* Vendor Notes */}
                {(submission.vendorNotes || submission.vendor_notes) && (
                  <div className="mt-3 p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-xs text-muted-foreground mb-1">Vendor Notes:</p>
                    <p className="text-sm text-white">{submission.vendorNotes || submission.vendor_notes}</p>
                  </div>
                )}

                {/* Flag Reason */}
                {isFlaggedItem && (submission.flagReason || submission.flag_reason) && (
                  <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-orange-400">Flag Reason:</p>
                        <p className="text-sm text-orange-300 mt-1">{submission.flagReason || submission.flag_reason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {submission.status === 'rejected' && (submission.rejectionReason || submission.rejection_reason) && (
                  <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-start gap-2">
                      <X className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-400">Rejection Reason:</p>
                        <p className="text-sm text-red-300 mt-1">{submission.rejectionReason || submission.rejection_reason}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Notes (if any) */}
                {(submission.adminNotes || submission.admin_notes) && (
                  <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                    <p className="text-xs text-purple-400 mb-1">Admin Notes:</p>
                    <p className="text-sm text-purple-300">{submission.adminNotes || submission.admin_notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {submission.status === 'pending' && !isFlaggedItem && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 mt-2 border-t border-white/10">
                    <Button
                      variant="outline"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 flex-1"
                      onClick={() => handleRejectClick(submission)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject with Reason
                    </Button>
                    <Button
                      className="bg-primary hover:bg-primary/90 flex-1"
                      onClick={() => handleApprove(submission)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve Price
                    </Button>
                  </div>
                )}

                {isFlaggedItem && submission.status === 'pending' && (
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 mt-2 border-t border-white/10">
                    <Button
                      variant="outline"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 flex-1"
                      onClick={() => handleRejectClick(submission)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject Submission
                    </Button>
                    <Button
                      className="bg-emerald-500 hover:bg-emerald-600 flex-1"
                      onClick={() => handleApprove(submission)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve (Override Flag)
                    </Button>
                  </div>
                )}

                {/* Expand/Collapse for more details */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedId(isExpanded ? null : submission.id)}
                  className="mt-3 w-full text-muted-foreground hover:text-white"
                >
                  {isExpanded ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                  {isExpanded ? 'Show Less' : 'Show More Details'}
                </Button>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-white/10 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Submission ID:</span>
                        <span className="text-white font-mono">{submission.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Product ID:</span>
                        <span className="text-white">{submission.productId || submission.product_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Market ID:</span>
                        <span className="text-white">{submission.marketId || submission.market_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vendor ID:</span>
                        <span className="text-white">{submission.vendorId || submission.vendor_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created At:</span>
                        <span className="text-white">{new Date(submission.createdAt || submission.created_at || '').toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Updated At:</span>
                        <span className="text-white">{new Date(submission.updatedAt || submission.updated_at || '').toLocaleString()}</span>
                      </div>
                      {submission.approvedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Approved At:</span>
                          <span className="text-emerald-400">{new Date(submission.approvedAt).toLocaleString()}</span>
                        </div>
                      )}
                      {submission.rejectedAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rejected At:</span>
                          <span className="text-red-400">{new Date(submission.rejectedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {filteredSubmissions.length === 0 && (
          <Card className="p-12 rounded-xl dark-glass border-white/10 shadow-lg">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-white">No {filter !== 'all' && filter} submissions found</p>
              <p className="text-sm mt-1 text-muted-foreground">
                {filter === 'pending' 
                  ? 'All caught up! No submissions awaiting review.'
                  : 'Try adjusting your filters or search term'}
              </p>
            </div>
          </Card>
        )}
      </div>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Approve Price Submission</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This price will be published and visible to all users.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="font-semibold text-white text-lg">
                  {getProduct(selectedSubmission.productId || selectedSubmission.product_id?.toString() || '')?.name || 'Unknown Product'}
                </div>
                <div className="text-2xl font-bold text-primary mt-1">
                  {selectedSubmission.price.toLocaleString()} RWF
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  at {getMarket(selectedSubmission.marketId || selectedSubmission.market_id || '')?.name || 'Unknown Market'} • per {selectedSubmission.unit}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Vendor: {selectedSubmission.vendorName || selectedSubmission.vendor_name}
                </div>
              </div>

              <div>
                <Label className="text-white">Admin Notes (Optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes about this approval..."
                  className="mt-1.5 min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setApproveDialogOpen(false)}
                  className="flex-1 border-white/10 hover:bg-white/10"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleApproveConfirm}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-600"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                  Approve Price
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="dark-glass border-white/10 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="gradient-text">Reject Price Submission</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please provide a clear reason for rejection. The vendor will receive this feedback.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 mt-4">
              <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="font-semibold text-white text-lg">
                  {getProduct(selectedSubmission.productId || selectedSubmission.product_id?.toString() || '')?.name || 'Unknown Product'}
                </div>
                <div className="text-2xl font-bold text-primary mt-1">
                  {selectedSubmission.price.toLocaleString()} RWF
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  at {getMarket(selectedSubmission.marketId || selectedSubmission.market_id || '')?.name || 'Unknown Market'} • per {selectedSubmission.unit}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  Vendor: {selectedSubmission.vendorName || selectedSubmission.vendor_name}
                </div>
              </div>

              <div>
                <Label className="text-white">Rejection Reason *</Label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="E.g., Price is significantly higher than market average, quality concerns, etc."
                  className="mt-1.5 min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be specific to help the vendor understand the issue
                </p>
              </div>

              <div>
                <Label className="text-white">Admin Notes (Optional)</Label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this rejection..."
                  className="mt-1.5 min-h-[80px] bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setRejectDialogOpen(false)}
                  className="flex-1 border-white/10 hover:bg-white/10"
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRejectConfirm}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                  Reject Submission
                </Button>
              </div>
            </div>
          )}
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