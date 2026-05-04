import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Trash2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface NotificationsProps {
  agentId: string;
}

// Sample notifications
const sampleNotifications = [
  {
    id: '1',
    type: 'success',
    title: 'Collection Approved',
    message: 'Your price collection for Musanze Market (Feb 12) has been approved.',
    timestamp: '10 minutes ago',
    read: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Collection Pending Review',
    message: 'Your Kimironko Market submission is awaiting admin approval.',
    timestamp: '2 hours ago',
    read: false,
  },
  {
    id: '3',
    type: 'info',
    title: 'New Market Assignment',
    message: 'You have been assigned to Nyabugogo Market. Please start collecting prices.',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: '4',
    type: 'error',
    title: 'Collection Rejected',
    message: 'Your Nyabugogo Market submission (Feb 11) was rejected. Prices significantly differ from verified sources.',
    timestamp: '1 day ago',
    read: true,
  },
  {
    id: '5',
    type: 'info',
    title: 'Weekly Report Available',
    message: 'Your weekly performance report is now available. You collected 87 prices this week.',
    timestamp: '2 days ago',
    read: true,
  },
];

export default function Notifications({ agentId }: NotificationsProps) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState(sampleNotifications);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <Clock className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-green-400" />;
    }
  };

  const getBgColor = (type: string, read: boolean) => {
    if (read) return 'bg-green-900';
    switch (type) {
      case 'success':
        return 'bg-green-950 border-l-4 border-l-green-500';
      case 'warning':
        return 'bg-green-950 border-l-4 border-l-green-400';
      case 'error':
        return 'bg-green-950 border-l-4 border-l-green-500';
      default:
        return 'bg-green-950 border-l-4 border-l-green-400';
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 glass-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl relative">
              <Bell className="h-6 w-6 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('notifications')}</h2>
              <p className="text-sm text-muted-foreground">
                {unreadCount > 0 
                  ? `${unreadCount} ${t('unreadNotifications') || 'unread notifications'}`
                  : t('allCaughtUp') || 'You\'re all caught up!'
                }
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {t('markAllRead') || 'Mark all as read'}
            </Button>
          )}
        </div>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card className="p-8 glass-card text-center">
            <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-muted-foreground">{t('noNotifications') || 'No notifications yet'}</p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`p-4 transition-all hover:shadow-md ${getBgColor(notification.type, notification.read)}`}
              onClick={() => markAsRead(notification.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className={`font-semibold text-sm sm:text-base ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      <p className={`text-xs sm:text-sm mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">{notification.timestamp}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-gray-400 hover:text-green-500 w-auto"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
