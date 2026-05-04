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
    if (hours < 24) return 'text-green-600';
    if (hours < 48) return 'text-green-700';
    return 'text-green-800';
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
        <Card className="p-4 rounded-xl border border-green-700 bg-green-950 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('pendingReview')}</p>
              <p className="text-2xl font-semibold text-foreground">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4 rounded-xl border border-green-700 bg-green-950 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('approvedToday')}</p>
              <p className="text-2xl font-semibold text-foreground">{approvedToday}</p>
            </div>
            <Check className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 rounded-xl border border-green-700 bg-green-950 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('rejectedToday')}</p>
              <p className="text-2xl font-semibold text-foreground">{rejectedToday}</p>
            </div>
            <X className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4 rounded-xl border border-green-700 bg-green-950 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('totalSubmissions')}</p>
              <p className="text-2xl font-semibold text-foreground">{submissions.length}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </Card>
      </div>

      {/* Alert for pending submissions */}
      {pendingCount > 0 && (
        <Card className="p-4 bg-green-950 border-green-700">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-green-100">
                {pendingCount} {t('submissionsAwaitingReview')}
              </h4>
              <p className="text-sm text-green-300">
                {t('reviewPriceSubmissionsDescription')}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 rounded-xl border border-green-700 bg-green-950 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-green-700 bg-green-950 text-green-100"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              {t('pending')} {pendingCount > 0 && `(${pendingCount})`}
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('approved')}
            >
              {t('approved')}
            </Button>
            <Button
              variant={filter === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('rejected')}
            >
              {t('rejected')}
            </Button>
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
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
            <Card key={submission.id} className="p-4 rounded-xl border border-green-700 bg-green-950 shadow-sm">
              <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-lg">{product?.name}</h3>
                      <Badge variant={
                        submission.status === 'approved' ? 'default' :
                        submission.status === 'rejected' ? 'destructive' :
                        'secondary'
                      }>
                        {submission.status}
                      </Badge>
                      {submission.imageUrl && (
                        <Badge variant="outline" className="bg-green-900 text-green-100 flex items-center gap-1">
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
                    <div className="text-2xl font-semibold text-primary">
                      {submission.price.toLocaleString()} RWF
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {submission.quantity} {submission.unit}
                    </div>
                  </div>
                </div>

                {/* Price Analysis */}
                <div className={`p-3 rounded-lg border ${
                  analysis.color === 'green' ? 'bg-green-950 border-green-700' :
                  analysis.color === 'yellow' ? 'bg-green-900 border-green-700' :
                  analysis.color === 'red' ? 'bg-green-950 border-green-700' :
                  'bg-green-900 border-green-700'
                }`}>
                  <div className="flex items-center gap-2">
                    <Info className={`h-4 w-4 ${
                      analysis.color === 'green' ? 'text-green-500' :
                      analysis.color === 'yellow' ? 'text-green-400' :
                      analysis.color === 'red' ? 'text-green-600' :
                      'text-green-500'
                    }`} />
                    <span className={`text-sm font-medium ${
                      analysis.color === 'green' ? 'text-green-100' :
                      analysis.color === 'yellow' ? 'text-green-100' :
                      analysis.color === 'red' ? 'text-green-100' :
                      'text-green-100'
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
                      className="h-32 rounded border object-cover"
                    />
                  </div>
                )}

                {/* Rejection Reason */}
                {submission.status === 'rejected' && submission.rejectionReason && (
                  <div className="p-3 bg-green-950 border border-green-700 rounded-lg">
                    <p className="text-sm font-medium text-green-200 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-green-300">{submission.rejectionReason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {submission.status === 'pending' && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-600 hover:text-green-700 hover:bg-green-950 flex-1 sm:flex-initial"
                      onClick={() => handleRejectClick(submission)}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reject with Reason
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-initial"
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
          <Card className="p-12 rounded-xl border border-green-700 bg-green-950 shadow-sm">
            <div className="text-center text-muted-foreground">
              <div className="mx-auto w-16 h-16 bg-secondary rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-gray-400" />
              </div>
              <p className="font-medium">No {filter !== 'all' && filter} submissions found</p>
              <p className="text-sm mt-1">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Price Submission</DialogTitle>
            <DialogDescription>
              Please provide a clear reason for rejecting this price. The vendor will receive this feedback.
            </DialogDescription>
          </DialogHeader>

          {selectedSubmission && (
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-green-900 rounded-lg border border-green-700">
                <div className="font-medium">{getProduct(selectedSubmission.productId)?.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {selectedSubmission.price.toLocaleString()} RWF - {getMarket(selectedSubmission.marketId)?.name}
                </div>
              </div>

              <div>
                <Label htmlFor="rejection-reason">Rejection Reason *</Label>
                <Textarea
                  id="rejection-reason"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="E.g., Price is significantly higher than market average..."
                  className="mt-1.5 min-h-[100px]"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Be specific to help the vendor understand the issue
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setRejectDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleRejectConfirm}
                  className="flex-1 bg-green-600 hover:bg-green-700"
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


