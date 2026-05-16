import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Bell, TrendingUp, TrendingDown, Info, AlertTriangle, CheckCircle, Settings, ChevronRight, RefreshCw, Filter, XCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getUserNotifications, markAsRead, markAllAsRead, getNotificationPreferences, updateNotificationPreferences } from '../../services/notificationService';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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

interface NotificationPreference {
  alert_type: string;
  is_enabled: boolean;
  notification_method: string;
}

export default function Notifications() {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filterType, setFilterType] = useState<string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [updatingPrefs, setUpdatingPrefs] = useState(false);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await getUserNotifications({ limit: 100 });
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (!silent) toast.error('Failed to load notifications');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchPreferences = async () => {
    try {
      const response = await getNotificationPreferences();
      setPreferences(response.preferences || []);
    } catch (error) {
      console.error('Error fetching preferences:', error);
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

  const handleTogglePreference = async (alertType: string, currentValue: boolean) => {
    setUpdatingPrefs(true);
    try {
      const updatedPreferences = preferences.map(pref =>
        pref.alert_type === alertType
          ? { ...pref, is_enabled: !currentValue }
          : pref
      );
      await updateNotificationPreferences(updatedPreferences);
      setPreferences(updatedPreferences);
      toast.success(`${alertType.replace('_', ' ')} ${!currentValue ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setUpdatingPrefs(false);
    }
  };

  const getFilteredNotifications = () => {
    if (filterType === 'all') return notifications;
    return notifications.filter(n => {
      const type = n.notification_type || n.type;
      if (filterType === 'price') {
        return type === 'price_alert' || type === 'price_approval' || type === 'price_rejection';
      }
      if (filterType === 'favorites') {
        return type === 'price_alert';
      }
      if (filterType === 'system') {
        return type === 'system' || type === 'system_update';
      }
      return type === filterType;
    });
  };

  const getNotificationIcon = (notification: Notification) => {
    const type = notification.notification_type || notification.type;
    const severity = notification.severity;
    
    switch (type) {
      case 'price_alert':
        if (notification.message?.toLowerCase().includes('dropped') || notification.message?.toLowerCase().includes('decrease')) {
          return <TrendingDown className="h-5 w-5 text-emerald-400" />;
        }
        if (notification.message?.toLowerCase().includes('increased') || notification.message?.toLowerCase().includes('increase')) {
          return <TrendingUp className="h-5 w-5 text-amber-400" />;
        }
        return <Bell className="h-5 w-5 text-primary" />;
      case 'price_approval':
        return <CheckCircle className="h-5 w-5 text-emerald-400" />;
      case 'price_rejection':
        return <XCircle className="h-5 w-5 text-red-400" />;
      case 'anomaly_detected':
        return <AlertTriangle className="h-5 w-5 text-orange-400" />;
      case 'system':
      case 'system_update':
        return <Info className="h-5 w-5 text-blue-400" />;
      default:
        return <Bell className="h-5 w-5 text-primary" />;
    }
  };

  const getNotificationBg = (notification: Notification) => {
    if (notification.is_read) return 'bg-white/5 border-white/10';
    
    const type = notification.notification_type || notification.type;
    
    switch (type) {
      case 'price_alert':
        return 'bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30';
      case 'price_approval':
        return 'bg-emerald-500/10 border-emerald-500/30';
      case 'price_rejection':
        return 'bg-red-500/10 border-red-500/30';
      case 'anomaly_detected':
        return 'bg-orange-500/10 border-orange-500/30';
      default:
        return 'bg-gradient-to-r from-primary/10 to-purple-500/10 border-primary/30';
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
      'price_alert': '💰 Price Alert',
      'price_approval': '✅ Price Approved',
      'price_rejection': '❌ Price Rejected',
      'anomaly_detected': '⚠️ Anomaly Detected',
      'system': '🔧 System Update',
      'system_update': '🔧 System Update'
    };
    return titleMap[type] || notification.title || '📬 Notification';
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadFilteredCount = filteredNotifications.filter(n => !n.is_read).length;

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
      {/* Notifications Card */}
      <Card className="p-5 rounded-xl dark-glass border-white/10">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="icon-container">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-bold gradient-text">{t('notifications') || 'Notifications'}</h2>
            {unreadCount > 0 && (
              <Badge className="bg-primary/20 text-primary border-primary/30">
                {unreadCount === 1 ? '1 unread' : `${unreadCount} unread`}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[130px] bg-white/5 border-white/10 text-white">
                <Filter className="h-3 w-3 mr-2" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent className="dark-glass border-white/10">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="price">Price Alerts</SelectItem>
                <SelectItem value="favorites">Favorites</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => fetchNotifications(false)}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Refresh
            </Button>
            {unreadCount > 0 && (
              <Button variant="premium" size="sm" onClick={handleMarkAllAsRead}>
                <CheckCircle className="h-3 w-3 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`p-4 rounded-xl border transition-all duration-200 hover:-translate-y-0.5 cursor-pointer ${getNotificationBg(notification)}`}
              onClick={() => !notification.is_read && handleMarkAsRead(notification.id)}
            >
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <div className={`p-2 rounded-lg ${!notification.is_read ? 'bg-primary/20' : 'bg-white/5'}`}>
                    {getNotificationIcon(notification)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className={`font-medium ${!notification.is_read ? 'text-white' : 'text-gray-300'}`}>
                        {getNotificationTitle(notification)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2 animate-pulse" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <p className="text-xs text-muted-foreground">
                      {getTimeAgo(notification.created_at)}
                    </p>
                    {!notification.is_read && (
                      <span className="text-[10px] text-primary">New</span>
                    )}
                    {notification.priority === 'high' && (
                      <Badge className="bg-red-500/20 text-red-400 text-[10px]">High Priority</Badge>
                    )}
                    {notification.priority === 'urgent' && (
                      <Badge className="bg-orange-500/20 text-orange-400 text-[10px]">Urgent</Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <div className="icon-container mx-auto mb-3">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-base font-medium text-white mb-1">No notifications</p>
            <p className="text-sm text-muted-foreground">
              {filterType !== 'all' ? 'Try changing the filter' : 'When you receive notifications, they will appear here'}
            </p>
            {filterType !== 'all' && (
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setFilterType('all')}>
                View all notifications
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Notification Settings Card */}
      <Card className="p-5 rounded-xl dark-glass border-white/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="icon-container-small">
              <Settings className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-white">Notification Settings</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowSettings(!showSettings)}
            className="text-primary"
          >
            {showSettings ? 'Hide' : 'Manage'}
          </Button>
        </div>
        
        {showSettings ? (
          <div className="space-y-2.5">
            {preferences.map(pref => (
              <div key={pref.alert_type} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${pref.is_enabled ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                    {pref.alert_type === 'price_below' && <TrendingDown className={`h-4 w-4 ${pref.is_enabled ? 'text-emerald-400' : 'text-red-400'}`} />}
                    {pref.alert_type === 'price_above' && <TrendingUp className={`h-4 w-4 ${pref.is_enabled ? 'text-emerald-400' : 'text-red-400'}`} />}
                    {pref.alert_type === 'price_change' && <Bell className={`h-4 w-4 ${pref.is_enabled ? 'text-emerald-400' : 'text-red-400'}`} />}
                    {pref.alert_type === 'system_update' && <Info className={`h-4 w-4 ${pref.is_enabled ? 'text-emerald-400' : 'text-red-400'}`} />}
                    {pref.alert_type === 'anomaly_alert' && <AlertTriangle className={`h-4 w-4 ${pref.is_enabled ? 'text-emerald-400' : 'text-red-400'}`} />}
                  </div>
                  <span className="text-sm text-gray-300 capitalize">
                    {pref.alert_type.replace('_', ' ')}
                  </span>
                </div>
                <button
                  onClick={() => handleTogglePreference(pref.alert_type, pref.is_enabled)}
                  disabled={updatingPrefs}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    pref.is_enabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}
                >
                  {pref.is_enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-emerald-500/10">
                  <TrendingDown className="h-4 w-4 text-emerald-400" />
                </div>
                <span className="text-sm text-gray-300">Price drop alerts</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {preferences.find(p => p.alert_type === 'price_below')?.is_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                </div>
                <span className="text-sm text-gray-300">Price increase alerts</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {preferences.find(p => p.alert_type === 'price_above')?.is_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-primary/10">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm text-gray-300">Price change alerts</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {preferences.find(p => p.alert_type === 'price_change')?.is_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-blue-500/10">
                  <Info className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm text-gray-300">System announcements</span>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                {preferences.find(p => p.alert_type === 'system_update')?.is_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        )}

        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="w-full mt-4 text-center text-xs text-primary hover:underline flex items-center justify-center gap-1"
        >
          <Settings className="h-3 w-3" />
          {showSettings ? 'Close settings' : 'Manage notification preferences'}
          <ChevronRight className="h-3 w-3" />
        </button>
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

        .icon-container {
          padding: 0.5rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .icon-container-small {
          padding: 0.375rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
}