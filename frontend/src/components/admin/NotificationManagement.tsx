// Simplified NotificationManagement component with proper error handling
import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Bell, Send, AlertTriangle, Info, CheckCircle, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { getUserNotifications, markAsRead, markAllAsRead, sendNotification } from '../../services/notificationService';

interface Notification {
    id: number;
    title: string;
    message: string;
    notification_type: string;
    priority: string;
    is_read: boolean;
    created_at: string;
}

export default function NotificationManagement() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [notificationType, setNotificationType] = useState('');
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');
    const [targetAudience, setTargetAudience] = useState('all');
    const [priority, setPriority] = useState('normal');
    const [sending, setSending] = useState(false);

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
            // Safely access properties with fallbacks
            setNotifications(response.notifications || []);
            setUnreadCount(response.unreadCount || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            if (!silent) toast.error('Failed to load notifications');
            // Set empty state on error
            setNotifications([]);
            setUnreadCount(0);
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

    const handleSendNotification = async () => {
        if (!notificationTitle || !notificationMessage) {
            toast.error('Please fill in both title and message');
            return;
        }

        setSending(true);
        try {
            await sendNotification({
                title: notificationTitle,
                message: notificationMessage,
                notificationType: notificationType || 'general',
                targetAudience,
                priority
            });
            
            toast.success('Notification sent successfully!');
            setNotificationTitle('');
            setNotificationMessage('');
            setNotificationType('');
        } catch (error: any) {
            console.error('Error sending notification:', error);
            toast.error(error.response?.data?.message || 'Failed to send notification');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading notifications...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Unread</p>
                            <p className="text-2xl font-semibold text-white">{unreadCount}</p>
                        </div>
                        <Bell className="h-8 w-8 text-primary/70" />
                    </div>
                </Card>
                <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-2xl font-semibold text-white">{notifications.length}</p>
                        </div>
                        <Bell className="h-8 w-8 text-primary/70" />
                    </div>
                </Card>
                <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Read</p>
                            <p className="text-2xl font-semibold text-white">
                                {notifications.filter(n => n.is_read).length}
                            </p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-primary/70" />
                    </div>
                </Card>
            </div>

            {/* Send New Notification */}
            <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Bell className="h-5 w-5 text-primary" />
                        <h3 className="text-lg gradient-text">Send New Notification</h3>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => fetchNotifications(false)} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <Label className="text-white">Notification Type</Label>
                            <Select value={notificationType} onValueChange={setNotificationType}>
                                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="dark-glass border-white/10">
                                    <SelectItem value="price_alert">Price Alert</SelectItem>
                              <SelectItem value="system">System Update</SelectItem>
                          <SelectItem value="price_alert">Market Information</SelectItem>
                            <SelectItem value="system">General Announcement</SelectItem>
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

                        <div>
                            <Label className="text-white">Priority</Label>
                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger className="mt-1.5 bg-white/5 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="dark-glass border-white/10">
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="normal">Normal</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="urgent">Urgent</SelectItem>
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

                    <Button 
                        onClick={handleSendNotification} 
                        disabled={sending}
                        className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                    >
                        {sending ? (
                            <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send className="h-4 w-4 mr-2" />
                                Send Notification
                            </>
                        )}
                    </Button>
                </div>
            </Card>

            {/* Notifications List */}
            <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg gradient-text">Recent Notifications</h3>
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark All Read ({unreadCount})
                        </Button>
                    )}
                </div>
                
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div key={notification.id} className={`flex gap-4 p-4 rounded-xl transition-colors ${
                                notification.is_read 
                                    ? 'bg-white/5 border border-white/10' 
                                    : 'bg-primary/10 border-2 border-primary/30'
                            }`}>
                                <div className="flex-shrink-0">
                                    {notification.priority === 'urgent' && <AlertTriangle className="h-5 w-5 text-red-400" />}
                                    {notification.priority === 'high' && <AlertTriangle className="h-5 w-5 text-orange-400" />}
                                    {notification.priority === 'normal' && <Info className="h-5 w-5 text-yellow-400" />}
                                    {notification.priority === 'low' && <Info className="h-5 w-5 text-primary" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <div className="flex-1">
                                            <p className="font-medium text-white">{notification.title}</p>
                                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                                <span>{new Date(notification.created_at).toLocaleString()}</span>
                                                <span className="capitalize">
                                                    {notification.notification_type?.replace('_', ' ') || 'General'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Badge className={notification.is_read 
                                                ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' 
                                                : 'bg-primary/20 text-primary border-primary/30'
                                            }>
                                                {notification.is_read ? 'Read' : 'Unread'}
                                            </Badge>
                                            {!notification.is_read && (
                                                <Button size="sm" variant="outline" onClick={() => handleMarkAsRead(notification.id)}>
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Mark Read
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12">
                            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-30" />
                            <p className="text-muted-foreground">No notifications yet</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}