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
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-slate-300" />;
      default:
        return <Bell className="h-5 w-5 text-green-400" />;
    }
  };

  const getNotificationBg = (type: string, read: boolean) => {
    if (read) return 'bg-gradient-to-br from-green-950 to-green-980 border-green-700';
    switch (type) {
      case 'success':
        return 'bg-gradient-to-br from-green-900 to-green-950 border-green-700';
      case 'error':
        return 'bg-gradient-to-br from-green-900 to-green-950 border-green-700';
      case 'warning':
        return 'bg-gradient-to-br from-green-900 to-green-950 border-green-700';
      default:
        return 'bg-gradient-to-br from-green-900 to-green-950 border-green-700';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 shadow-sm">
            <Bell className="h-4 w-4 text-white" />
          </div>
          <div>
          <h2 className="text-lg font-bold text-white mb-0.5">Notifications</h2>
          <p className="text-green-300 text-xs">
            Stay updated on your price submissions
          </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 px-2.5 text-xs border-green-700 bg-green-900 text-green-200 hover:bg-green-800">
          Mark all as read
        </Button>
      </div>

      <Card className="rounded-2xl border-green-700 bg-gradient-to-br from-green-900 to-green-950 backdrop-blur-sm shadow-[0_14px_34px_-22px_rgba(15,23,42,0.45)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base text-white">All Notifications</CardTitle>
          <CardDescription className="text-xs text-green-300">
            {notifications.filter(n => !n.read).length} unread notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border rounded-xl transition-colors shadow-sm ${getNotificationBg(notification.type, notification.read)}`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm text-white ${!notification.read ? 'font-semibold' : 'font-medium'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="flex-shrink-0 w-2 h-2 bg-green-400 rounded-full mt-1.5" />
                      )}
                    </div>
                    <p className="text-xs text-green-300 mt-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-green-400">
                      <Clock className="h-3 w-3" />
                      <span>{notification.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {notifications.length === 0 && (
            <div className="text-center py-10 text-green-400">
              <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No notifications</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

