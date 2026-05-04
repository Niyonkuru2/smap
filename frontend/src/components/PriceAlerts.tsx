import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bell, BellOff, Trash2, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  marketId?: string;
  marketName?: string;
  alertType: 'below' | 'above' | 'change';
  threshold: number;
  enabled: boolean;
  createdAt: Date;
}

interface PriceAlertsProps {
  alerts: PriceAlert[];
  onCreateAlert: (alert: Omit<PriceAlert, 'id' | 'createdAt' | 'enabled'>) => void;
  onToggleAlert: (alertId: string) => void;
  onDeleteAlert: (alertId: string) => void;
}

export function PriceAlerts({
  alerts,
  onCreateAlert,
  onToggleAlert,
  onDeleteAlert
}: PriceAlertsProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    productName: '',
    marketName: '',
    alertType: 'below' as 'below' | 'above' | 'change',
    threshold: 0
  });

  const handleCreateAlert = () => {
    if (!newAlert.productName) {
      toast.error('Please enter a product name');
      return;
    }

    if (newAlert.threshold <= 0) {
      toast.error('Please enter a valid threshold');
      return;
    }

    onCreateAlert({
      productId: `product-${Date.now()}`,
      productName: newAlert.productName,
      marketId: newAlert.marketName ? `market-${Date.now()}` : undefined,
      marketName: newAlert.marketName || undefined,
      alertType: newAlert.alertType,
      threshold: newAlert.threshold
    });

    // Reset form
    setNewAlert({
      productName: '',
      marketName: '',
      alertType: 'below',
      threshold: 0
    });
    setShowCreateForm(false);

    toast.success('Price alert created successfully!');
  };

  const getAlertDescription = (alert: PriceAlert) => {
    const marketText = alert.marketName ? ` at ${alert.marketName}` : '';
    
    switch (alert.alertType) {
      case 'below':
        return `Notify me when price drops below ${alert.threshold.toLocaleString()} RWF${marketText}`;
      case 'above':
        return `Notify me when price goes above ${alert.threshold.toLocaleString()} RWF${marketText}`;
      case 'change':
        return `Notify me of any ${alert.threshold}% price change${marketText}`;
      default:
        return 'Unknown alert type';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-base sm:text-lg">
            <Bell className="h-5 w-5" />
            Price Alerts
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Get notified when prices reach your target
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          New Alert
        </Button>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card className="p-4">
          <h4 className="mb-4">Create Price Alert</h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                placeholder="e.g., Tomatoes (1kg)"
                value={newAlert.productName}
                onChange={(e) => setNewAlert({ ...newAlert, productName: e.target.value })}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="marketName">Market (Optional)</Label>
              <Input
                id="marketName"
                placeholder="e.g., Musanze Market"
                value={newAlert.marketName}
                onChange={(e) => setNewAlert({ ...newAlert, marketName: e.target.value })}
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty to monitor all markets
              </p>
            </div>

            <div>
              <Label htmlFor="alertType">Alert When</Label>
              <Select 
                value={newAlert.alertType} 
                onValueChange={(value: any) => setNewAlert({ ...newAlert, alertType: value })}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="below">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      Price drops below
                    </div>
                  </SelectItem>
                  <SelectItem value="above">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Price goes above
                    </div>
                  </SelectItem>
                  <SelectItem value="change">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-green-600" />
                      Price changes by %
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="threshold">
                {newAlert.alertType === 'change' ? 'Percentage (%)' : 'Price (RWF)'}
              </Label>
              <Input
                id="threshold"
                type="number"
                placeholder={newAlert.alertType === 'change' ? 'e.g., 10' : 'e.g., 1000'}
                value={newAlert.threshold || ''}
                onChange={(e) => setNewAlert({ ...newAlert, threshold: parseFloat(e.target.value) || 0 })}
                className="mt-1.5"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateAlert} className="flex-1">
                Create Alert
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Alerts List */}
      {alerts.length > 0 ? (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4>{alert.productName}</h4>
                    <div className={`text-xs px-2 py-0.5 rounded ${
                      alert.alertType === 'below' ? 'bg-green-900 text-green-100' :
                      alert.alertType === 'above' ? 'bg-green-950 text-green-100' :
                      'bg-green-800 text-green-100'
                    }`}>
                      {alert.alertType === 'below' && <TrendingDown className="h-3 w-3 inline mr-1" />}
                      {alert.alertType === 'above' && <TrendingUp className="h-3 w-3 inline mr-1" />}
                      {alert.alertType === 'change' && <Bell className="h-3 w-3 inline mr-1" />}
                      {alert.alertType}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getAlertDescription(alert)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {alert.createdAt.toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleAlert(alert.id)}
                  >
                    {alert.enabled ? (
                      <Bell className="h-4 w-4 text-green-600" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm('Delete this alert?')) {
                        onDeleteAlert(alert.id);
                        toast.success('Alert deleted');
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h4 className="mb-2">No price alerts yet</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Create alerts to get notified when prices change
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Alert
          </Button>
        </Card>
      )}

      {/* Summary */}
      {alerts.length > 0 && (
        <Card className="p-4 bg-green-950 border-green-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-100">
              <Bell className="h-4 w-4 inline mr-2" />
              {alerts.filter(a => a.enabled).length} active alerts
            </span>
            <span className="text-green-300">
              {alerts.filter(a => !a.enabled).length} paused
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
