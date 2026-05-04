import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  XCircle, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Clock,
  User,
  MapPin,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Shield
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AnomalyAlert, SAMPLE_ANOMALIES, getAnomalyStats } from '../../lib/anomalyDetection';

export function AnomalyAlertsDashboard() {
  const { t } = useLanguage();
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(SAMPLE_ANOMALIES);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolution, setResolution] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const stats = getAnomalyStats(alerts);

  const handleResolve = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, status: 'resolved' as const } : alert
    ));
    setResolution('');
    setExpandedId(null);
  };

  const handleDismiss = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, status: 'dismissed' as const } : alert
    ));
  };

  const handleInvestigate = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, status: 'investigating' as const, assignedTo: 'Admin' } : alert
    ));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    return matchesSeverity && matchesStatus;
  });

  const getSeverityBadge = (severity: string) => {
    const styles: Record<string, string> = {
      low: 'bg-green-900 text-green-100 border-green-700',
      medium: 'bg-green-800 text-green-50 border-green-600',
      high: 'bg-green-700 text-green-50 border-green-600',
      critical: 'bg-green-950 text-green-100 border-green-800 animate-pulse',
    };
    return <Badge className={styles[severity]}>{severity.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: 'bg-green-900 text-green-100',
      investigating: 'bg-green-800 text-green-50',
      resolved: 'bg-green-700 text-green-50',
        dismissed: 'bg-green-950 text-green-100',
    };
    const icons: Record<string, JSX.Element> = {
      new: <Bell className="h-3 w-3" />,
      investigating: <Eye className="h-3 w-3" />,
      resolved: <CheckCircle className="h-3 w-3" />,
      dismissed: <XCircle className="h-3 w-3" />,
    };
    return (
      <Badge className={`${styles[status]} flex items-center gap-1`}>
        {icons[status]}
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price_spike':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'price_drop':
        return <TrendingDown className="h-5 w-5 text-green-400" />;
      case 'unusual_pattern':
        return <AlertTriangle className="h-5 w-5 text-green-600" />;
      case 'suspicious_vendor':
        return <User className="h-5 w-5 text-green-400" />;
      case 'data_inconsistency':
        return <Shield className="h-5 w-5 text-green-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-green-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 rounded-2xl border border-green-700 bg-green-950 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t('anomalyAlerts') || 'Anomaly Detection Alerts'}</h2>
              <p className="text-sm text-muted-foreground">
                AI-detected price anomalies and suspicious patterns
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl">
            <p className="text-xs text-green-400">Total Alerts</p>
            <p className="text-2xl font-bold text-green-300">{stats.total}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl">
            <p className="text-xs text-green-400">Critical</p>
            <p className="text-2xl font-bold text-green-300">{stats.bySeverity.critical}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl">
            <p className="text-xs text-green-400">High</p>
            <p className="text-2xl font-bold text-green-300">{stats.bySeverity.high}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl">
            <p className="text-xs text-green-400">Medium</p>
            <p className="text-2xl font-bold text-green-300">{stats.bySeverity.medium}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl">
            <p className="text-xs text-green-400">Investigating</p>
            <p className="text-2xl font-bold text-green-300">{stats.byStatus.investigating}</p>
          </div>
          <div className="p-4 bg-gradient-to-br from-green-950 to-green-900 rounded-xl">
            <p className="text-xs text-green-400">Resolved</p>
            <p className="text-2xl font-bold text-green-300">{stats.byStatus.resolved}</p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 rounded-2xl border border-green-700 bg-green-950 shadow-sm">
        <div className="flex flex-wrap gap-4">
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="investigating">Investigating</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="dismissed">Dismissed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.map((alert) => (
          <Card 
            key={alert.id}
            className={`p-4 rounded-2xl border transition-all ${
              alert.severity === 'critical' ? 'border-green-700 bg-green-950/50' :
              alert.severity === 'high' ? 'border-green-600 bg-green-900/50' :
              ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-xl ${
                  alert.severity === 'critical' ? 'bg-green-950' :
                  alert.severity === 'high' ? 'bg-green-900' :
                  alert.severity === 'medium' ? 'bg-green-800' :
                  'bg-green-700'
                }`}>
                  {getTypeIcon(alert.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{alert.product}</h3>
                    {getSeverityBadge(alert.severity)}
                    {getStatusBadge(alert.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500" />
                      <span>{alert.market}</span>
                    </div>
                    {alert.vendor && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-500" />
                        <span>{alert.vendor}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-500" />
                      <span>{alert.timestamp}</span>
                    </div>
                    <div>
                      <span className={`font-semibold ${alert.deviation > 0 ? 'text-green-700' : 'text-green-500'}`}>
                        {alert.deviation > 0 ? '+' : ''}{alert.deviation}% deviation
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm mb-3">
                    <div className="p-2 bg-secondary rounded">
                      <span className="text-muted-foreground">Current: </span>
                      <span className="font-semibold">{alert.currentPrice.toLocaleString()} RWF</span>
                    </div>
                    <div className="p-2 bg-secondary rounded">
                      <span className="text-muted-foreground">Expected: </span>
                      <span className="font-semibold">{alert.expectedPrice.toLocaleString()} RWF</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{alert.details}</p>

                  {alert.assignedTo && (
                    <p className="text-sm text-green-400 mt-2">
                      Assigned to: {alert.assignedTo}
                    </p>
                  )}

                  {/* Expanded Actions */}
                  {expandedId === alert.id && (alert.status === 'new' || alert.status === 'investigating') && (
                    <div className="mt-4 p-4 bg-green-900 rounded-lg space-y-4 border border-green-700">
                      <Textarea 
                        placeholder="Add resolution notes..."
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleResolve(alert.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Resolved
                        </Button>
                        <Button 
                          onClick={() => handleDismiss(alert.id)}
                          variant="outline"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Dismiss
                        </Button>
                        {alert.status === 'new' && (
                          <Button 
                            onClick={() => handleInvestigate(alert.id)}
                            variant="outline"
                            className="border-green-700 text-green-300"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Start Investigation
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
                >
                  {expandedId === alert.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                {alert.status === 'new' && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-green-700 text-green-300"
                    onClick={() => handleInvestigate(alert.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}

        {filteredAlerts.length === 0 && (
          <Card className="p-8 rounded-2xl border border-accent bg-card shadow-sm text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-medium">No anomalies detected</p>
            <p className="text-muted-foreground">All price submissions are within normal ranges.</p>
          </Card>
        )}
      </div>
    </div>
  );
}

