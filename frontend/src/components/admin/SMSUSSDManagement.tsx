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
      delivered: 'bg-green-900 text-green-100 border border-green-700',
      pending: 'bg-green-900 text-green-100 border border-green-700',
      failed: 'bg-green-950 text-green-100 border border-green-700',
    };
    return styles[status] || 'bg-green-900 text-green-100 border border-green-700';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price_query':
        return <Search className="h-4 w-4 text-green-500" />;
      case 'alert':
        return <Bell className="h-4 w-4 text-green-500" />;
      case 'price_alert':
        return <AlertTriangle className="h-4 w-4 text-green-500" />;
      case 'market_query':
        return <Activity className="h-4 w-4 text-green-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 rounded-2xl border border-green-700/50 bg-green-950/80 backdrop-blur-sm shadow-[0_14px_32px_-22px_rgba(0,0,0,0.8)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-teal-500 rounded-xl">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-green-100">{t('smsUssdManagement') || 'SMS/USSD Management'}</h2>
            <p className="text-sm text-green-300/80">
              {t('smsUssdDesc') || 'Manage SMS notifications and USSD services for non-smartphone users'}
            </p>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 glass-card text-center">
          <p className="text-2xl font-bold text-green-300">{smsStats.totalSent}</p>
          <p className="text-xs text-muted-foreground">Total SMS Sent</p>
        </Card>
        <Card className="p-4 glass-card text-center">
          <p className="text-2xl font-bold text-green-300">{smsStats.todaySent}</p>
          <p className="text-xs text-muted-foreground">Sent Today</p>
        </Card>
        <Card className="p-4 glass-card text-center">
          <p className="text-2xl font-bold text-green-300">{smsStats.priceQueries}</p>
          <p className="text-xs text-muted-foreground">Price Queries</p>
        </Card>
        <Card className="p-4 glass-card text-center">
          <p className="text-2xl font-bold text-green-300">{smsStats.alertsActive}</p>
          <p className="text-xs text-muted-foreground">Active Alerts</p>
        </Card>
        <Card className="p-4 glass-card text-center">
          <p className="text-2xl font-bold text-green-300">{smsStats.ussdSessions}</p>
          <p className="text-xs text-muted-foreground">USSD Sessions</p>
        </Card>
        <Card className="p-4 glass-card text-center">
          <p className="text-2xl font-bold text-green-300">{smsStats.deliveryRate}%</p>
          <p className="text-xs text-muted-foreground">Delivery Rate</p>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="rounded-2xl border border-green-700/50 bg-green-950/80 backdrop-blur-sm shadow-[0_14px_32px_-22px_rgba(0,0,0,0.8)]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
            <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="bulk" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500">
              <Send className="h-4 w-4 mr-2" />
              Bulk SMS
            </TabsTrigger>
            <TabsTrigger value="alerts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500">
              <Bell className="h-4 w-4 mr-2" />
              Price Alerts
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Recent SMS Activity</h3>
            <div className="space-y-3">
              {recentSMSLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-green-950 border border-green-700 shadow-sm hover:border-green-600 hover:bg-green-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getTypeIcon(log.type)}
                    <div>
                      <p className="font-semibold text-sm text-slate-800">{log.phone}</p>
                      <p className="text-xs font-medium text-slate-600">{log.message}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(log.status)}`}>
                      {log.status}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* USSD Commands Reference */}
            <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">USSD Service Code: *123#</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-green-600">
                <div>
                  <p className="font-medium">SMS Commands:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• PRICE [product] - Get prices</li>
                    <li>• MARKET [name] - Market info</li>
                    <li>• ALERT [product] [price] - Set alert</li>
                    <li>• HELP - Get help</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">USSD Menu:</p>
                  <ul className="mt-1 space-y-1">
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
                <Label>Target Audience</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subscribers ({smsStats.alertsActive})</SelectItem>
                    <SelectItem value="consumers">Consumers Only</SelectItem>
                    <SelectItem value="vendors">Vendors Only</SelectItem>
                    <SelectItem value="agents">Market Agents</SelectItem>
                    <SelectItem value="active_alerts">Users with Active Alerts</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Message</Label>
                <Textarea
                  value={bulkMessage}
                  onChange={(e) => setBulkMessage(e.target.value)}
                  placeholder="Enter your message (max 160 characters for single SMS)..."
                  className="mt-1 min-h-[120px]"
                  maxLength={320}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {bulkMessage.length}/320 characters ({bulkMessage.length <= 160 ? '1' : '2'} SMS)
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleSendBulkSMS}
                  disabled={sending || !bulkMessage.trim()}
                  className="bg-gradient-to-r from-green-500 to-teal-500"
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
                >
                  Schedule for Later
                </Button>
              </div>

              {/* Quick Templates */}
              <div className="mt-6">
                <h4 className="font-medium mb-2">Quick Templates</h4>
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
                      className="text-xs"
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
            <h3 className="font-semibold mb-4">Active Price Alerts ({activeAlerts.length})</h3>
            <div className="space-y-3">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-green-950 to-green-900 rounded-lg border border-green-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-green-900 rounded-lg">
                      <Bell className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium">{alert.phone}</p>
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
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        Triggered
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-900 text-green-100">
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
                <h3 className="font-semibold mb-4">SMS Gateway Configuration</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>SMS Provider</Label>
                    <Select defaultValue="africas_talking">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="africas_talking">Africa's Talking</SelectItem>
                        <SelectItem value="twilio">Twilio</SelectItem>
                        <SelectItem value="infobip">Infobip</SelectItem>
                        <SelectItem value="local">Local Gateway</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Sender ID</Label>
                    <Input defaultValue="SMPMPS" className="mt-1" />
                  </div>
                  <div>
                    <Label>API Key</Label>
                    <Input type="password" defaultValue="••••••••••••" className="mt-1" />
                  </div>
                  <div>
                    <Label>USSD Short Code</Label>
                    <Input defaultValue="*123#" className="mt-1" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Notification Settings</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Send price alerts when threshold is met</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Send daily price summary to subscribed users</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Send weekly market report</span>
                  </label>
                </div>
              </div>

              <Button className="bg-gradient-to-r from-blue-500 to-purple-500">
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
