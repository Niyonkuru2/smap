import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Bell, TrendingUp, TrendingDown, Info, AlertTriangle, CheckCircle, Settings, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  icon: React.ReactNode;
}

const notifications: Notification[] = [
  {
    id: '1',
    type: 'price_decrease',
    title: 'Price Drop Alert',
    message: 'Tomatoes price decreased by 12% in Nyabugogo Market',
    time: '2 hours ago',
    read: false,
    icon: <TrendingDown className="h-5 w-5 text-emerald-400" />
  },
  {
    id: '2',
    type: 'price_increase',
    title: 'Price Increase',
    message: 'Rice (Local) price increased by 8% in Kimironko Market',
    time: '5 hours ago',
    read: false,
    icon: <TrendingUp className="h-5 w-5 text-amber-400" />
  },
  {
    id: '3',
    type: 'favorite_update',
    title: 'Favorite Product Update',
    message: 'Onions prices updated in your favorite markets',
    time: '1 day ago',
    read: true,
    icon: <CheckCircle className="h-5 w-5 text-primary" />
  },
  {
    id: '4',
    type: 'system',
    title: 'New Feature',
    message: 'You can now compare prices across multiple markets',
    time: '2 days ago',
    read: true,
    icon: <Bell className="h-5 w-5 text-primary" />
  },
  {
    id: '5',
    type: 'alert',
    title: 'Price Alert Triggered',
    message: 'Your set alert for Potatoes at Kicukiro Market has been triggered',
    time: '3 days ago',
    read: true,
    icon: <AlertTriangle className="h-5 w-5 text-amber-400" />
  }
];

export default function Notifications() {
  const unreadCount = notifications.filter(n => !n.read).length;
  const { t } = useLanguage();

  const getUnreadCountText = () => {
    if (unreadCount === 0) return t('noUnread') || 'No unread';
    if (unreadCount === 1) return '1 unread';
    return `${unreadCount} unread`;
  };

  return (
    <div className="space-y-4">
      {/* Notifications Card */}
      <Card className="p-5 rounded-xl dark-glass border-white/10">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="icon-container">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold gradient-text">{t('notifications')}</h2>
            {unreadCount > 0 && (
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {getUnreadCountText()}
              </Badge>
            )}
          </div>
          <button className="text-xs text-primary hover:underline flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            {t('markAllRead') || 'Mark all as read'}
          </button>
        </div>

        <div className="space-y-2.5">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 ${
                notification.read
                  ? 'bg-white/5 border-white/10'
                  : 'bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30'
              }`}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className={`p-2 rounded-lg ${
                    notification.read ? 'bg-white/5' : 'bg-primary/20'
                  }`}>
                    {notification.icon}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`font-medium ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs text-muted-foreground">
                      {notification.time}
                    </p>
                    {!notification.read && (
                      <span className="text-[10px] text-primary">{t('new') || 'New'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="text-center py-12">
            <div className="icon-container mx-auto mb-3">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-white mb-1">{t('noNotifications') || 'No notifications'}</p>
            <p className="text-sm text-muted-foreground">
              {t('notificationsHelp') || 'When you receive notifications, they will appear here'}
            </p>
          </div>
        )}
      </Card>

      {/* Notification Settings Card */}
      <Card className="p-5 rounded-xl dark-glass border-white/10">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="icon-container-small">
            <Settings className="h-4 w-4 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-white">{t('notificationSettings') || 'Notification Settings'}</h3>
        </div>
        
        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-emerald-500/10">
                <TrendingDown className="h-4 w-4 text-emerald-400" />
              </div>
              <span className="text-sm text-gray-300">{t('priceDropAlerts') || 'Price drop alerts'}</span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {t('enabled') || 'Enabled'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-amber-500/10">
                <TrendingUp className="h-4 w-4 text-amber-400" />
              </div>
              <span className="text-sm text-gray-300">{t('priceIncreaseAlerts') || 'Price increase alerts'}</span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {t('enabled') || 'Enabled'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <CheckCircle className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-gray-300">{t('favoriteUpdates') || 'Favorite product updates'}</span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {t('enabled') || 'Enabled'}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-blue-500/10">
                <Info className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-sm text-gray-300">{t('systemAnnouncements') || 'System announcements'}</span>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
              {t('enabled') || 'Enabled'}
            </Badge>
          </div>
        </div>

        <button className="w-full mt-4 text-center text-xs text-primary hover:underline flex items-center justify-center gap-1">
          <Settings className="h-3 w-3" />
          {t('manageSettings') || 'Manage notification preferences'}
          <ChevronRight className="h-3 w-3" />
        </button>
      </Card>
    </div>
  );
}