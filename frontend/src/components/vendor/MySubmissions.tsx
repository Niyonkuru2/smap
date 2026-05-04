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
        return <Badge className="bg-green-600"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
    }
  };

  const getAgeColor = (hours: number) => {
    if (hours < 24) return 'text-green-600';
    if (hours < 48) return 'text-green-700';
    return 'text-green-800';
  };

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-green-900 to-green-950 border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-300">{t('totalSubmissions')}</p>
              <p className="text-2xl font-semibold text-white">{submissions.length}</p>
            </div>
            <RefreshCw className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-900 to-green-950 border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-300">{t('approved')}</p>
              <p className="text-2xl font-semibold text-green-100">{approvedCount}</p>
            </div>
            <Check className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-900 to-green-950 border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-300">{t('pending')}</p>
              <p className="text-2xl font-semibold text-green-100">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-900 to-green-950 border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-300">{t('rejected')}</p>
              <p className="text-2xl font-semibold text-green-100">{rejectedCount}</p>
            </div>
            <X className="h-8 w-8 text-green-700" />
          </div>
        </Card>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-medium text-white">{t('recentNotifications')}</h3>
          {notifications.map(notif => (
            <Card key={notif.id} className={`p-4 ${notif.read ? 'opacity-60' : ''} ${
              notif.type === 'success' ? 'border-green-700 bg-green-950' :
              notif.type === 'error' ? 'border-green-700 bg-green-900' :
              'border-green-700 bg-green-900'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className={`font-medium ${
                      notif.type === 'success' ? 'text-green-100' :
                      notif.type === 'error' ? 'text-green-100' :
                      'text-green-100'
                    }`}>
                      {notif.title}
                    </h4>
                    {!notif.read && (
                      <Badge variant="outline" className="bg-card">New</Badge>
                    )}
                  </div>
                  <p className={`text-sm ${
                    notif.type === 'success' ? 'text-green-300' :
                    notif.type === 'error' ? 'text-green-300' :
                    'text-green-300'
                  }`}>
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
      <Card className="p-6 bg-gradient-to-br from-green-900 to-green-950 border-green-700">
        <h3 className="text-lg mb-4 text-white">{t('allSubmissions')}</h3>
        <div className="space-y-3">
          {submissions.map(submission => {
            const product = products.find(p => p.id === submission.productId);
            const market = markets.find(m => m.id === submission.marketId);

            return (
              <Card key={submission.id} className={`p-4 ${
                submission.status === 'approved' ? 'bg-green-950 border-green-700' :
                submission.status === 'rejected' ? 'bg-green-900 border-green-700' :
                'bg-secondary'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white">{product?.name}</h4>
                      {getStatusBadge(submission.status)}
                    </div>
                    <p className="text-sm text-green-300 mb-2 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {market?.name}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="font-semibold text-green-300">
                        {submission.price.toLocaleString()} RWF
                      </span>
                      <span className="text-green-400">
                        {submission.quantity} {submission.unit}
                      </span>
                      <span className={`flex items-center gap-1 ${getAgeColor(submission.ageInHours)}`}>
                        <Clock className="h-3 w-3" />
                        {submission.ageInHours}h ago
                      </span>
                    </div>

                    {/* Rejection Reason */}
                    {submission.status === 'rejected' && submission.rejectionReason && (
                      <div className="mt-3 p-3 bg-green-900 border border-green-700 rounded">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-green-300 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-green-100">Rejection Reason:</p>
                            <p className="text-sm text-green-300 mt-1">{submission.rejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Approval Message */}
                    {submission.status === 'approved' && (
                      <div className="mt-3 p-2 bg-green-100 border border-green-200 rounded">
                        <p className="text-sm text-green-800">
                          ✓ This price is now live and visible to all users!
                        </p>
                      </div>
                    )}
                  </div>

                  {submission.status === 'approved' && (
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Update
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}

          {submissions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No submissions yet</p>
              <p className="text-sm mt-2">Submit your first price to get started!</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

