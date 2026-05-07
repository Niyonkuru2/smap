import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Edit, Clock, Check, X, AlertCircle, RefreshCw, MapPin } from 'lucide-react';
import { useProducts, useMarkets } from '../../hooks/useAppData';
import { getPriceSubmissionsByVendor, getNotifications, markNotificationAsRead } from '../../lib/localStorage';
import { useLanguage } from '../../contexts/LanguageContext';
import type { PriceSubmission } from '../../types';

interface MySubmissionsProps {
  vendorName: string;
  vendorId: string;
}

export default function MySubmissions({ vendorName, vendorId }: MySubmissionsProps) {
  const [submissions, setSubmissions] = useState<PriceSubmission[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const { t } = useLanguage();
  const { products } = useProducts();
  const { markets } = useMarkets();

  useEffect(() => {
    loadSubmissions();
    loadNotifications();

    // Poll for updates every 2 seconds
    const interval = setInterval(() => {
      loadSubmissions();
      loadNotifications();
    }, 2000);

    return () => clearInterval(interval);
  }, [vendorId]);

  const loadSubmissions = () => {
    // Get from localStorage
    const stored = getPriceSubmissionsByVendor(vendorId);
    
    const combined = [
      ...stored.map(s => ({
        id: s.id,
        productId: s.productId,
        marketId: s.marketId,
        vendorId: s.vendorId,
        vendorName: s.vendorName,
        price: s.price,
        quantity: s.quantity,
        unit: s.unit,
        submittedAt: new Date(s.submittedAt),
        status: s.status,
        ageInHours: s.ageInHours,
        imageUrl: s.imageUrl,
        rejectionReason: s.rejectionReason
      }))
    ];

    // Sort by newest first
    combined.sort((a, b) => a.ageInHours - b.ageInHours);

    setSubmissions(combined);
  };

  const loadNotifications = () => {
    const notifs = getNotifications(vendorId);
    setNotifications(notifs.slice(0, 3)); // Show latest 3
  };

  const handleMarkAsRead = (notifId: string) => {
    markNotificationAsRead(vendorId, notifId);
    loadNotifications();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
    }
  };

  const getAgeColor = (hours: number) => {
    if (hours < 24) return 'text-emerald-400';
    if (hours < 48) return 'text-emerald-500';
    return 'text-emerald-600';
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('totalSubmissions')}</p>
              <p className="text-2xl font-semibold text-white">{submissions.length}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-primary/60" />
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('approved')}</p>
              <p className="text-2xl font-semibold text-emerald-400">{approvedCount}</p>
            </div>
            <Check className="h-8 w-8 text-emerald-500" />
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('pending')}</p>
              <p className="text-2xl font-semibold text-yellow-400">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{t('rejected')}</p>
              <p className="text-2xl font-semibold text-red-400">{rejectedCount}</p>
            </div>
            <X className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium gradient-text">{t('recentNotifications')}</h3>
          {notifications.map(notif => (
            <Card key={notif.id} className={`p-4 rounded-xl dark-glass border-white/10 transition-all ${
              notif.read ? 'opacity-60' : ''
            } ${
              notif.type === 'success' ? 'border-emerald-500/30 bg-emerald-500/5' :
              notif.type === 'error' ? 'border-red-500/30 bg-red-500/5' :
              'border-primary/30 bg-primary/5'
            }`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className={`font-medium ${
                      notif.type === 'success' ? 'text-emerald-400' :
                      notif.type === 'error' ? 'text-red-400' :
                      'text-primary'
                    }`}>
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <Badge className="bg-primary/20 text-primary border-primary/30">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notif.message}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(notif.timestamp).toLocaleString()}
                  </p>
                </div>
                {!notif.read && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="btn-outline-premium"
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Submissions List */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="text-lg mb-4 gradient-text">{t('allSubmissions')}</h3>
        <div className="space-y-3">
          {submissions.map(submission => {
            const product = products.find(p => p.id === submission.productId);
            const market = markets.find(m => m.id === submission.marketId);

            return (
              <Card key={submission.id} className={`p-4 rounded-xl transition-all ${
                submission.status === 'approved' ? 'bg-white/5 border-white/10' :
                submission.status === 'rejected' ? 'bg-white/5 border-white/10' :
                'bg-primary/5 border-primary/20'
              }`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-medium text-white">{product?.name}</h4>
                      {getStatusBadge(submission.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {market?.name}
                    </p>
                    <div className="flex items-center gap-4 text-sm flex-wrap">
                      <span className="font-semibold text-white">
                        {submission.price.toLocaleString()} RWF
                      </span>
                      <span className="text-muted-foreground">
                        {submission.quantity} {submission.unit}
                      </span>
                      <span className={`flex items-center gap-1 ${getAgeColor(submission.ageInHours)}`}>
                        <Clock className="h-3 w-3" />
                        {submission.ageInHours}h ago
                      </span>
                    </div>

                    {/* Rejection Reason */}
                    {submission.status === 'rejected' && submission.rejectionReason && (
                      <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-red-400">Rejection Reason:</p>
                            <p className="text-sm text-red-300 mt-1">{submission.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Approval Message */}
                    {submission.status === 'approved' && (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <p className="text-sm text-emerald-400">
                          ✓ This price is now live and visible to all users!
                        </p>
                      </div>
                    )}
                  </div>

                  {submission.status === 'approved' && (
                    <Button variant="outline" size="sm" className="btn-outline-premium">
                      <Edit className="h-4 w-4 mr-1" />
                      Update
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}

          {submissions.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
              <p className="font-medium text-white">No submissions yet</p>
              <p className="text-sm text-muted-foreground mt-2">Submit your first price to get started!</p>
            </div>
          )}
        </div>
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
      `}</style>
    </div>
  );
}