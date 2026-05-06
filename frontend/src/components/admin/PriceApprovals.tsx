import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Check, X, Search, Clock, TrendingUp, AlertCircle, Info, MapPin, User, ImageIcon } from 'lucide-react';
import { useProducts, useMarkets, usePrices } from '../../hooks/useAppData';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { getAllSubmissions, approveSubmission, rejectSubmission } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import type { PriceSubmission } from '../../types';

export default function PriceApprovals() {
  const [submissions, setSubmissions] = useState<PriceSubmission[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<PriceSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const { t } = useLanguage();
  const { products } = useProducts();
  const { markets } = useMarkets();
  const { prices: priceData } = usePrices();

  useEffect(() => {
    loadSubmissions();
    
    // Poll for new submissions every 5 seconds
    const interval = setInterval(() => {
      loadSubmissions();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadSubmissions = async () => {
    try {
      const { submissions: apiSubmissions } = await getAllSubmissions();
      setSubmissions(apiSubmissions || []);
    } catch (error) {
      console.error('Error loading submissions:', error);
      // Silently fail, will retry on next poll
    }
  };

  const getProduct = (id: string) => products.find(p => p.id === id);
  const getMarket = (id: string) => markets.find(m => m.id === id);

  const getPriceAnalysis = (submission: PriceSubmission) => {
    // Get existing prices for this product at this market
    const existingPrice = priceData.find(
      p => p.productId === submission.productId && p.marketId === submission.marketId
    );

    if (!existingPrice) {
      return { status: 'new', message: 'No existing price data', color: 'blue' };
    }

    const priceDiff = submission.price - existingPrice.current;
    const percentDiff = (priceDiff / existingPrice.current) * 100;

    if (Math.abs(percentDiff) < 5) {
      return { 
        status: 'normal', 
        message: `Within 5% of current price (${existingPrice.current.toLocaleString()} RWF)`,
        color: 'green',
        percentDiff 
      };
    } else if (percentDiff > 20) {
      return { 
        status: 'suspicious-high', 
        message: `${percentDiff.toFixed(1)}% higher than current price!`,
        color: 'red',
        percentDiff 
      };
    } else if (percentDiff < -20) {
      return { 
        status: 'suspicious-low', 
        message: `${Math.abs(percentDiff).toFixed(1)}% lower than current price!`,
        color: 'red',
        percentDiff 
      };
    } else if (percentDiff > 5) {
      return { 
        status: 'increase', 
        message: `${percentDiff.toFixed(1)}% higher than current price`,
        color: 'yellow',
        percentDiff 
      };
    } else {
      return { 
        status: 'decrease', 
        message: `${Math.abs(percentDiff).toFixed(1)}% lower than current price`,
        color: 'yellow',
        percentDiff 
      };
    }
  };

  const handleApprove = async (submission: PriceSubmission) => {
    try {
      await approveSubmission(submission.id);
      await loadSubmissions();
      
      const product = getProduct(submission.productId);
      toast.success(`✓ Price for ${product?.name} approved!`, {
        description: `${submission.price.toLocaleString()} RWF - Vendor will be notified`
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve submission');
    }
  };

  const handleRejectClick = (submission: PriceSubmission) => {
    setSelectedSubmission(submission);
    setRejectionReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedSubmission) return;
    
    if (!rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    try {
      await rejectSubmission(selectedSubmission.id, rejectionReason);
      await loadSubmissions();
      
      const product = getProduct(selectedSubmission.productId);
      toast.error(`✗ Price for ${product?.name} rejected`, {
        description: 'Vendor has been notified with the reason'
      });
      
      setRejectDialogOpen(false);
      setSelectedSubmission(null);
      setRejectionReason('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject submission');
    }
  };

  const getAgeColor = (hours: number) => {
    if (hours < 24) return 'text-emerald-400';
    if (hours < 48) return 'text-emerald-500';
    return 'text-emerald-600';
  };

  const filteredSubmissions = submissions
    .filter(s => filter === 'all' || s.status === filter)
    .filter(s => {
      if (!searchTerm) return true;
      const product = getProduct(s.productId);
      const market = getMarket(s.marketId);
      return (
        product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.vendorName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    })
    .sort((a, b) => {
      // Sort by: pending first, then by age (newest first)
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      return a.ageInHours - b.ageInHours;
    });

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedToday = submissions.filter(s => s.status === 'approved' && s.ageInHours < 24).length;
  const rejectedToday = submissions.filter(s => s.status === 'rejected' && s.ageInHours < 24).length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('pendingReview')}</p>
              <p className="text-2xl font-semibold text-white">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-primary/70" />
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('approvedToday')}</p>
              <p className="text-2xl font-semibold text-white">{approvedToday}</p>
            </div>
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('rejectedToday')}</p>
              <p className="text-2xl font-semibold text-white">{rejectedToday}</p>
            </div>
            <X className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('totalSubmissions')}</p>
              <p className="text-2xl font-semibold text-white">{submissions.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-primary/60" />
          </div>
        </Card>
      </div>

      {/* Alert for pending submissions */}
      {pendingCount > 0 && (
        <Card className="p-4 dark-glass border-primary/20 bg-primary/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <h4 className="font-medium text-white">
                {pendingCount} {t('submissionsAwaitingReview')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t('reviewPriceSubmissionsDescription')}
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
                placeholder={t('search')}
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
              {t('pending')} {pendingCount > 0 && `(${pendingCount})`}
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('approved')}
              className={filter === 'approved' ? 'bg-primary hover:bg-primary/90' : 'border-white/10 hover:bg-white/10'}
            >
              {t('approved')}
            </Button>
            <Button
              variant={filter === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('rejected')}
              className={filter === 'rejected' ? 'bg-primary hover:bg-primary/90' : 'border-white/10 hover:bg-white/10'}
            >
              {t('rejected')}
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className={filter === 'all' ? 'bg-primary hover:bg-primary/90' : 'border-white/10 hover:bg-white/10'}
            >
              {t('all')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Submissions List */}
      <div className="space-y-4">
        {filteredSubmissions.map((submission) => {
          const product = getProduct(submission.productId);
          const market = getMarket(submission.marketId);
          const analysis = getPriceAnalysis(submission);

          return (
            <Card key={submission.id} className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-lg text-white">{product?.name}</h3>
                      <Badge 
                        variant={
                          submission.status === 'approved' ? 'default' :
                          submission.status === 'rejected' ? 'destructive' :
                          'secondary'
                        }
                        className={
                          submission.status === 'pending' ? 'bg-primary/20 text-primary border-primary/30' :
                          submission.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }
                      >
                        {submission.status}
                      </Badge>
                      {submission.imageUrl && (
                        <Badge variant="outline" className="bg-white/5 border-white/10 text-muted-foreground flex items-center gap-1">
                          <ImageIcon className="h-3 w-3" /> Has Image
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {market?.name}</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {submission.vendorName}</span>
                      <span className={getAgeColor(submission.ageInHours)}>
                        <Clock className="inline h-3 w-3 mr-1" />
                        {submission.ageInHours}h ago
                      </span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-left sm:text-right">
                    <div className="text-2xl font-semibold gradient-text">
                      {submission.price.toLocaleString()} RWF
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {submission.quantity} {submission.unit}
                    </div>
                  </div>
                </div>

                {/* Price Analysis */}
                <div className={`p-3 rounded-lg border ${
                  analysis.color === 'green' ? 'bg-emerald-500/10 border-emerald-500/30' :
                  analysis.color === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  analysis.color === 'red' ? 'bg-red-500/10 border-red-500/30' :
                  'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <div className="flex items-center gap-2">
                    <Info className={`h-4 w-4 ${
                      analysis.color === 'green' ? 'text-emerald-400' :
                      analysis.color === 'yellow' ? 'text-yellow-400' :
                      analysis.color === 'red' ? 'text-red-400' :
                      'text-blue-400'
                    }`} />
                    <span className={`text-sm font-medium ${
                      analysis.color === 'green' ? 'text-emerald-300' :
                      analysis.color === 'yellow' ? 'text-yellow-300' :
                      analysis.color === 'red' ? 'text-red-300' :
                      'text-blue-300'
                    }`}>
                      {analysis.message}
                    </span>
                  </div>
                </div>

                {/* Image Preview */}
                {submission.imageUrl && (
                  <div>
                    <img 
                      src={submission.imageUrl} 
                      alt="Price tag" 
                      className="h-32 rounded-lg border border-white/10 object-cover"
                    />
                  </div>
                )}

                {/* Rejection Reason */}
                {submission.status === 'rejected' && submission.rejectionReason && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-sm font-medium text-red-400 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-300">{submission.rejectionReason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {submission.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/30 flex-1 sm:flex-initial"
                      onClick={() => handleRejectClick(submission)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject with Reason
                    </Button>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 flex-1 sm:flex-initial"
                      onClick={() => handleApprove(submission)}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Approve Price
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {filteredSubmissions.length === 0 && (
          <Card className="p-12 rounded-xl dark-glass border-white/10 shadow-lg">
            <div className="text-center text-muted-foreground">
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

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="dark-glass border-white/10">
          <DialogHeader>
            <DialogTitle className="gradient-text">Reject Price Submission</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Please provide a clear reason for rejecting this price. The vendor will receive this feedback.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="font-medium text-white">{getProduct(selectedSubmission.productId)?.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {selectedSubmission.price.toLocaleString()} RWF - {getMarket(selectedSubmission.marketId)?.name}
                </div>
              </div>

              <div>
                <Label className="text-white">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="E.g., Price is significantly higher than market average..."
                  className="mt-1.5 min-h-[100px] bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Be specific to help the vendor understand the issue
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setRejectDialogOpen(false)}
                  className="flex-1 border-white/10 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRejectConfirm}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  Reject Submission
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}