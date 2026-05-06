import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Bell, Send, TrendingUp, TrendingDown, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { globalNotifications } from '../../state/globalState';
import { toast } from 'sonner';

const recentNotifications = [
  {
    id: '1',
    type: 'price_increase',
    title: 'Rice prices increased',
    message: 'Rice (Local) price increased by 8% in Kimironko Market',
    sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    recipients: 342,
    icon: <TrendingUp className="h-5 w-5 text-primary" />
  },
  {
    id: '2',
    type: 'price_decrease',
    title: 'Tomatoes prices dropped',
    message: 'Tomatoes price decreased by 12% in Nyabugogo Market',
    sentAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    recipients: 298,
    icon: <TrendingDown className="h-5 w-5 text-primary" />
  },
  {
    id: '3',
    type: 'system',
    title: 'System Update',
    message: 'New features added: Price comparison charts and favorites',
    sentAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    recipients: 1247,
    icon: <Info className="h-5 w-5 text-primary" />
  }
];

export default function NotificationManagement() {
  const [notificationType, setNotificationType] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [liveNotifications, setLiveNotifications] = useState(globalNotifications);

  useEffect(() => {
    // Update live notifications
    const interval = setInterval(() => {
      setLiveNotifications([...globalNotifications]);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSendNotification = () => {
    if (notificationTitle && notificationMessage) {
      toast.success(`Notification sent to ${targetAudience} users!`);
      setNotificationTitle('');
      setNotificationMessage('');
      setNotificationType('');
    }
  };

  const handleMarkAsRead = (id: string) => {
    const notification = globalNotifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      setLiveNotifications([...globalNotifications]);
      toast.success('Notification marked as read');
    }
  };

  const adminNotifications = liveNotifications.filter(n => n.userRole === 'admin');

  return (
    <div className="space-y-6">
      {/* Pending Price Submissions Notifications */}
      {adminNotifications.length > 0 && (
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="text-lg gradient-text">
              Pending Price Submissions ({adminNotifications.filter(n => !n.read).length} unread)
            </h3>
          </div>
          <div className="space-y-3">
            {adminNotifications.map((notification) => (
              <div key={notification.id} className={`flex gap-4 p-4 rounded-lg ${
                notification.read 
                  ? 'bg-white/5 border border-white/10' 
                  : 'bg-primary/10 border-2 border-primary/30'
              }`}>
                <div className="flex-shrink-0">
                  <Info className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex-1">
                      <p className="font-medium text-white">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{new Date(notification.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={notification.read 
                        ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' 
                        : 'bg-primary/20 text-primary border-primary/30'
                      }>
                        {notification.read ? 'Read' : 'Unread'}
                      </Badge>
                      {!notification.read && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(notification.id)} className="btn-outline-premium">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Mark Read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Send New Notification */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg gradient-text">Send New Notification</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-white">Notification Type</Label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="dark-glass border-white/10">
                  <SelectItem value="price_alert">Price Alert</SelectItem>
                  <SelectItem value="system_update">System Update</SelectItem>
                  <SelectItem value="market_info">Market Information</SelectItem>
                  <SelectItem value="general">General Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Target Audience</Label>
              <Select value={targetAudience} onValueChange={setTargetAudience}>
                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark-glass border-white/10">
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="consumers">Consumers Only</SelectItem>
                  <SelectItem value="vendors">Vendors Only</SelectItem>
                  <SelectItem value="business">Business Owners Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-white">Title</Label>
            <Input
              value={notificationTitle}
              onChange={(e) => setNotificationTitle(e.target.value)}
              placeholder="Enter notification title"
              className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <Label className="text-white">Message</Label>
            <Textarea
              value={notificationMessage}
              onChange={(e) => setNotificationMessage(e.target.value)}
              placeholder="Enter notification message"
              rows={4}
              className="mt-1.5 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>

          <Button onClick={handleSendNotification} className="w-full sm:w-auto bg-primary hover:bg-primary/90">
            <Send className="h-4 w-4 mr-2" />
            Send Notification
          </Button>
        </div>
      </Card>

      {/* Notification Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Sent Today</p>
              <p className="text-2xl font-semibold text-white">8</p>
            </div>
            <Send className="h-8 w-8 text-primary/70" />
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Recipients</p>
              <p className="text-2xl font-semibold text-white">3,421</p>
            </div>
            <Bell className="h-8 w-8 text-primary/70" />
          </div>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open Rate</p>
              <p className="text-2xl font-semibold text-white">78%</p>
            </div>
            <Info className="h-8 w-8 text-primary/70" />
          </div>
        </Card>
      </div>

      {/* Recent Notifications */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="text-lg gradient-text mb-4">Recent Notifications</h3>
        <div className="space-y-3">
          {recentNotifications.map((notification) => (
            <div key={notification.id} className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex-shrink-0">
                {notification.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex-1">
                    <p className="font-semibold text-white">{notification.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Sent {new Date(notification.sentAt).toLocaleString()}</span>
                      <span>•</span>
                      <span>{notification.recipients} recipients</span>
                    </div>
                  </div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 capitalize">
                    {notification.type.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Automated Alerts Settings */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="text-lg gradient-text mb-4">Automated Alert Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-white">Price Increase Alerts</p>
                <p className="text-sm text-muted-foreground">Notify users when prices increase by 10% or more</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-white">Price Drop Alerts</p>
                <p className="text-sm text-muted-foreground">Notify users when prices drop by 10% or more</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-white">Outdated Price Warnings</p>
                <p className="text-sm text-muted-foreground">Remind vendors to update prices older than 48 hours</p>
              </div>
            </div>
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Active</Badge>
          </div>
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