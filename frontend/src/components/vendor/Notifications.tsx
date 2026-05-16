import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Bell, CheckCircle, XCircle, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getUserNotifications, markAsRead, markAllAsRead } from '../../services/notificationService';
import { toast } from 'sonner';

interface NotificationsProps {
  vendorName: string;
  vendorId: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  notification_type: string;
  priority: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  severity: string;
}

export default function Notifications({ vendorName, vendorId }: NotificationsProps) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await getUserNotifications({ limit: 50 });
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (!silent) toast.error('Failed to load notifications');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      await fetchNotifications(true);
      toast.success('Marked as read');
    } catch (error) {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      await fetchNotifications(true);
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    const type = notification.notification_type || notification.type;
    const severity = notification.severity;
    
    switch (type) {
      case 'price_approval':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'price_rejection':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'price_alert':
        if (severity === 'critical' || severity === 'high') {
          return <AlertCircle className="h-5 w-5 text-red-400" />;
        }
        return <Bell className="h-5 w-5 text-yellow-400" />;
      case 'anomaly_detected':
        return <AlertCircle className="h-5 w-5 text-orange-400" />;
      case 'subscription_expiry':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'subscription_activation':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const getNotificationBg = (notification: Notification) => {
    if (notification.is_read) return 'bg-white/5 border-white/10';
    
    const type = notification.notification_type || notification.type;
    const severity = notification.severity;
    
    switch (type) {
      case 'price_approval':
      case 'subscription_activation':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'price_rejection':
        return 'bg-red-500/10 border-red-500/30';
      case 'price_alert':
        if (severity === 'critical' || severity === 'high') {
          return 'bg-red-500/10 border-red-500/30';
        }
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'anomaly_detected':
        return 'bg-orange-500/10 border-orange-500/30';
      case 'subscription_expiry':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-primary/10 border-primary/30';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  const getNotificationTitle = (notification: Notification) => {
    const type = notification.notification_type || notification.type;
    const titleMap: Record<string, string> = {
      'price_approval': 'Price Approved',
      'price_rejection': 'Price Rejected',
      'price_alert': 'Price Alert',
      'anomaly_detected': 'Anomaly Detected',
      'anomaly_resolved': 'Anomaly Resolved',
      'subscription_activation': 'Subscription Activated',
      'subscription_expiry': 'Subscription Expiring',
      'system': 'System Update',
      'price_submitted': 'Price Submitted',
      'payment_received': 'Payment Received'
    };
    return titleMap[type] || notification.title || 'Notification';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-primary/20 shadow-sm">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold gradient-text mb-0.5">Notifications</h2>
            <p className="text-muted-foreground text-xs">
              Stay updated on your price submissions
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchNotifications(false)}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button variant="premium" size="sm" onClick={handleMarkAllAsRead}>
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">All Notifications</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-xl border transition-all ${getNotificationBg(notification)} ${!notification.is_read ? 'cursor-pointer hover:bg-opacity-20' : ''}`}
                onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notification.is_read ? 'font-semibold text-white' : 'font-medium text-white'}`}>
                        {getNotificationTitle(notification)}
                      </p>
                      {!notification.is_read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1.5 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{getTimeAgo(notification.created_at)}</span>
                      <span>•</span>
                      <span className="capitalize">{notification.priority || 'normal'} priority</span>
                      {notification.notification_type && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{notification.notification_type.replace('_', ' ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">No notifications</p>
              <p className="text-xs text-muted-foreground mt-1">You're all caught up!</p>
            </div>
          )}
        </CardContent>
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

        .dark-glass {
          background: rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(10px);
        }

        .gradient-text {
          background: linear-gradient(135deg, #fff 0%, #10b981 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
}