import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  MessageSquare,
  Smartphone,
  Send,
  Users,
  Activity,
  Settings,
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../../contexts/LanguageContext';

// Sample SMS statistics
const smsStats = {
  totalSent: 1247,
  todaySent: 89,
  priceQueries: 456,
  alertsActive: 234,
  ussdSessions: 178,
  deliveryRate: 98.5,
};

// Sample recent SMS logs
const recentSMSLogs = [
  { id: '1', phone: '+250788***456', type: 'price_query', message: 'PRICE TOMATOES', response: 'Tomatoes prices sent', time: '2 min ago', status: 'delivered' },
  { id: '2', phone: '+250722***789', type: 'alert', message: 'ALERT RICE 1000', response: 'Alert created', time: '5 min ago', status: 'delivered' },
  { id: '3', phone: '+250788***123', type: 'market_query', message: 'MARKET MUSANZE', response: 'Market prices sent', time: '8 min ago', status: 'delivered' },
  { id: '4', phone: '+250733***321', type: 'help', message: 'HELP', response: 'Help message sent', time: '12 min ago', status: 'delivered' },
  { id: '5', phone: '+250788***654', type: 'price_alert', message: 'System Alert', response: 'Tomatoes price drop alert', time: '15 min ago', status: 'pending' },
];

// Sample active alerts
const activeAlerts = [
  { id: '1', phone: '+250788***456', product: 'Tomatoes', targetPrice: 700, currentPrice: 750, market: 'All', createdAt: '2026-02-10' },
  { id: '2', phone: '+250722***789', product: 'Rice', targetPrice: 1000, currentPrice: 1400, market: 'Musanze', createdAt: '2026-02-11' },
  { id: '3', phone: '+250788***123', product: 'Beans', targetPrice: 800, currentPrice: 880, market: 'Kimironko', createdAt: '2026-02-12' },
];

export default function SMSUSSDManagement() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [bulkMessage, setBulkMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [sending, setSending] = useState(false);

  const handleSendBulkSMS = async () => {
    if (!bulkMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    setSending(true);
    try {
      // Simulate sending
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Bulk SMS sent successfully!');
      setBulkMessage('');
    } catch (error) {
      toast.error('Failed to send bulk SMS');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[status] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price_query':
        return <Search className="h-4 w-4 text-primary" />;
      case 'alert':
        return <Bell className="h-4 w-4 text-primary" />;
      case 'price_alert':
        return <AlertTriangle className="h-4 w-4 text-primary" />;
      case 'market_query':
        return <Activity className="h-4 w-4 text-primary" />;
      default:
        return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/20">
            <Smartphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold gradient-text">{t('smsUssdManagement') || 'SMS/USSD Management'}</h2>
            <p className="text-sm text-muted-foreground">
              {t('smsUssdDesc') || 'Manage SMS notifications and USSD services for non-smartphone users'}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-2xl font-bold text-white">{smsStats.totalSent}</p>
          <p className="text-xs text-muted-foreground">Total SMS Sent</p>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-2xl font-bold text-white">{smsStats.todaySent}</p>
          <p className="text-xs text-muted-foreground">Sent Today</p>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-2xl font-bold text-white">{smsStats.priceQueries}</p>
          <p className="text-xs text-muted-foreground">Price Queries</p>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-2xl font-bold text-white">{smsStats.alertsActive}</p>
          <p className="text-xs text-muted-foreground">Active Alerts</p>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-2xl font-bold text-white">{smsStats.ussdSessions}</p>
          <p className="text-xs text-muted-foreground">USSD Sessions</p>
        </Card>
        <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg text-center">
          <p className="text-2xl font-bold text-emerald-400">{smsStats.deliveryRate}%</p>
          <p className="text-xs text-muted-foreground">Delivery Rate</p>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="rounded-xl dark-glass border-white/10 shadow-lg">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b border-white/10 rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="bulk" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary">
              <Send className="h-4 w-4 mr-2" />
              Bulk SMS
            </TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary">
              <Bell className="h-4 w-4 mr-2" />
              Price Alerts
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6">
            <h3 className="font-semibold gradient-text mb-4">Recent SMS Activity</h3>
            <div className="space-y-3">
              {recentSMSLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex-wrap gap-3"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(log.type)}
                    <div>
                      <p className="font-semibold text-sm text-white">{log.phone}</p>
                      <p className="text-xs font-medium text-muted-foreground">{log.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* USSD Commands Reference */}
            <div className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="font-semibold text-primary mb-3">USSD Service Code: *123#</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-white">SMS Commands:</p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    <li>• PRICE [product] - Get prices</li>
                    <li>• MARKET [name] - Market info</li>
                    <li>• ALERT [product] [price] - Set alert</li>
                    <li>• HELP - Get help</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium text-white">USSD Menu:</p>
                  <ul className="mt-1 space-y-1 text-muted-foreground">
                    <li>• 1 → Check Prices</li>
                    <li>• 2 → Price Alerts</li>
                    <li>• 3 → Register</li>
                    <li>• 4 → Help</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Bulk SMS Tab */}
          <TabsContent value="bulk" className="p-6">
            <div className="space-y-4">
              <div>
                <Label className="text-white">Target Audience</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="dark-glass border-white/10">
                    <SelectItem value="all">All Subscribers ({smsStats.alertsActive})</SelectItem>
                    <SelectItem value="consumers">Consumers Only</SelectItem>
                    <SelectItem value="vendors">Vendors Only</SelectItem>
                    <SelectItem value="agents">Market Agents</SelectItem>
                    <SelectItem value="active_alerts">Users with Active Alerts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white">Message</Label>
                <Textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="Enter your message (max 160 characters for single SMS)..."
                  className="mt-1 min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                  maxLength={320}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {bulkMessage.length}/320 characters ({bulkMessage.length <= 160 ? '1' : '2'} SMS)
                </p>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleSendBulkSMS}
                  disabled={sending || !bulkMessage.trim()}
                  className="bg-primary hover:bg-primary/90"
                >
                  {sending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send to {targetAudience === 'all' ? smsStats.alertsActive : '...'} users
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => alert('Schedule feature coming soon!')}
                  className="btn-outline-premium"
                >
                  Schedule for Later
                </Button>
              </div>

              {/* Quick Templates */}
              <div className="mt-6">
                <h4 className="font-medium text-white mb-2">Quick Templates</h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Price Update: [Product] now at [Price] RWF in [Market].',
                    'SMPMPS Alert: Price drop detected! Check prices now.',
                    'New market added! [Market] prices now available.',
                  ].map((template, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkMessage(template)}
                      className="text-xs btn-outline-premium"
                    >
                      Template {i + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Price Alerts Tab */}
          <TabsContent value="alerts" className="p-6">
            <h3 className="font-semibold gradient-text mb-4">Active Price Alerts ({activeAlerts.length})</h3>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex-wrap gap-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Bell className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{alert.phone}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.product} • Target: {alert.targetPrice} RWF • Current: {alert.currentPrice} RWF
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Market: {alert.market} • Created: {alert.createdAt}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {alert.currentPrice <= alert.targetPrice ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Triggered
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                        Watching
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold gradient-text mb-4">SMS Gateway Configuration</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">SMS Provider</Label>
                    <Select defaultValue="africas_talking">
                      <SelectTrigger className="mt-1 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="dark-glass border-white/10">
                        <SelectItem value="africas_talking">Africa's Talking</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="infobip">Infobip</SelectItem>
                        <SelectItem value="local">Local Gateway</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Sender ID</Label>
                    <Input defaultValue="SMPMPS" className="mt-1 bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-white">API Key</Label>
                    <Input type="password" defaultValue="••••••••••••" className="mt-1 bg-white/5 border-white/10 text-white" />
                  </div>
                  <div>
                    <Label className="text-white">USSD Short Code</Label>
                    <Input defaultValue="*123#" className="mt-1 bg-white/5 border-white/10 text-white" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold gradient-text mb-4">Notification Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5" />
                    <span className="text-sm text-white">Send price alerts when threshold is met</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-white/20 bg-white/5" />
                    <span className="text-sm text-white">Send daily price summary to subscribed users</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="rounded border-white/20 bg-white/5" />
                    <span className="text-sm text-white">Send weekly market report</span>
                  </label>
                </div>
              </div>

              <Button className="bg-primary hover:bg-primary/90">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
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