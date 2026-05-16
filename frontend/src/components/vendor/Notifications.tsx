import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Bell, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface NotificationsProps {
  vendorName: string;
  vendorId: string;
}

export default function Notifications({ vendorName, vendorId }: NotificationsProps) {
  const { t } = useLanguage();

  // Mock notifications
  const notifications = [
    {
      id: '1',
      title: 'Price Approved',
      message: 'Your price for Rice (1kg) at RWF 1,200 has been approved',
      type: 'success' as const,
      time: '2 hours ago',
      read: false
    },
    {
      id: '2',
      title: 'Price Rejected',
      message: 'Your price for Beans (1kg) was rejected. Reason: Price too high',
      type: 'error' as const,
      time: '5 hours ago',
      read: false
    },
    {
      id: '3',
      title: 'Pending Approval',
      message: 'Your price for Maize Flour (1kg) is pending admin approval',
      type: 'warning' as const,
      time: '1 day ago',
      read: true
    },
    {
      id: '4',
      title: 'Price Approved',
      message: 'Your price for Cooking Oil (1L) has been approved',
      type: 'success' as const,
      time: '2 days ago',
      read: true
    }
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const getNotificationBg = (type: string, read: boolean) => {
    if (read) return 'bg-white/5 border-white/10';
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'error':
        return 'bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      default:
        return 'bg-primary/10 border-primary/30';
    }
  };

  const markAllAsRead = () => {
    // Mark all notifications as read
    // In a real app, this would call an API
    console.log('Mark all as read');
  };

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
        <Button variant="premium" size="sm" onClick={markAllAsRead}>
          Mark all as read
        </Button>
      </div>

      <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">All Notifications</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {notifications.filter(n => !n.read).length} unread notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-xl border transition-all ${getNotificationBg(notification.type, notification.read)}`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm ${!notification.read ? 'font-semibold text-white' : 'font-medium text-white'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-primary rounded-full mt-1.5 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{notification.time}</span>
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
      `}</style>
    </div>
  );
}