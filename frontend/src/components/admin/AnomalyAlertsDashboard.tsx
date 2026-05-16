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
      low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
      high: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      critical: 'bg-red-500/10 text-red-400 border-red-500/30 animate-pulse',
    };
    return <Badge className={styles[severity]}>{severity.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      new: 'bg-primary/20 text-primary border-primary/30',
      investigating: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      dismissed: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
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
        return <TrendingUp className="h-5 w-5 text-emerald-400" />;
      case 'price_drop':
        return <TrendingDown className="h-5 w-5 text-red-400" />;
      case 'unusual_pattern':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'suspicious_vendor':
        return <User className="h-5 w-5 text-primary" />;
      case 'data_inconsistency':
        return <Shield className="h-5 w-5 text-purple-400" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <AlertTriangle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold gradient-text">{t('anomalyAlerts') || 'Anomaly Detection Alerts'}</h2>
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
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-muted-foreground">Total Alerts</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <p className="text-xs text-red-400">Critical</p>
            <p className="text-2xl font-bold text-red-400">{stats.bySeverity.critical}</p>
          </div>
          <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/20">
            <p className="text-xs text-orange-400">High</p>
            <p className="text-2xl font-bold text-orange-400">{stats.bySeverity.high}</p>
          </div>
          <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
            <p className="text-xs text-yellow-400">Medium</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.bySeverity.medium}</p>
          </div>
          <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <p className="text-xs text-blue-400">Investigating</p>
            <p className="text-2xl font-bold text-blue-400">{stats.byStatus.investigating}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-xs text-emerald-400">Resolved</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.byStatus.resolved}</p>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex flex-wrap gap-4">
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent className="dark-glass border-white/10">
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px] bg-white/5 border-white/10">
              <Clock className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="dark-glass border-white/10">
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
            className={`p-4 rounded-xl dark-glass border transition-all ${
              alert.severity === 'critical' ? 'border-red-500/30 bg-red-500/5' :
              alert.severity === 'high' ? 'border-orange-500/30 bg-orange-500/5' :
              alert.severity === 'medium' ? 'border-yellow-500/30 bg-yellow-500/5' :
              'border-white/10'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4 flex-1">
                <div className={`p-3 rounded-xl ${
                  alert.severity === 'critical' ? 'bg-red-500/20' :
                  alert.severity === 'high' ? 'bg-orange-500/20' :
                  alert.severity === 'medium' ? 'bg-yellow-500/20' :
                  'bg-white/5'
                }`}>
                  {getTypeIcon(alert.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="font-semibold text-lg text-white">{alert.product}</h3>
                    {getSeverityBadge(alert.severity)}
                    {getStatusBadge(alert.status)}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{alert.market}</span>
                    </div>
                    {alert.vendor && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{alert.vendor}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{alert.timestamp}</span>
                    </div>
                    <div>
                      <span className={`font-semibold ${alert.deviation > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {alert.deviation > 0 ? '+' : ''}{alert.deviation}% deviation
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-4 text-sm mb-3">
                    <div className="p-2 rounded bg-white/5">
                      <span className="text-muted-foreground">Current: </span>
                      <span className="font-semibold text-white">{alert.currentPrice.toLocaleString()} RWF</span>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <span className="text-muted-foreground">Expected: </span>
                      <span className="font-semibold text-white">{alert.expectedPrice.toLocaleString()} RWF</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{alert.details}</p>

                  {alert.assignedTo && (
                    <p className="text-sm text-primary mt-2">
                      Assigned to: {alert.assignedTo}
                    </p>
                  )}

                  {/* Expanded Actions */}
                  {expandedId === alert.id && (alert.status === 'new' || alert.status === 'investigating') && (
                    <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 space-y-4">
                      <Textarea
                        placeholder="Add resolution notes..."
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value)}
                        rows={2}
                        className="bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
                      />
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleResolve(alert.id)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark Resolved
                        </Button>
                        <Button 
                          onClick={() => handleDismiss(alert.id)}
                          variant="outline"
                          className="border-white/10 hover:bg-white/10"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Dismiss
                        </Button>
                        {alert.status === 'new' && (
                          <Button 
                            onClick={() => handleInvestigate(alert.id)}
                            variant="outline"
                            className="border-primary/30 text-primary hover:bg-primary/10"
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
                  className="border-white/10 hover:bg-white/10"
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
                    className="border-primary/30 text-primary hover:bg-primary/10"
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
          <Card className="p-8 rounded-xl dark-glass border-white/10 shadow-lg text-center">
            <CheckCircle className="h-12 w-12 mx-auto text-emerald-400 mb-4" />
            <p className="text-lg font-medium text-white">No anomalies detected</p>
            <p className="text-muted-foreground">All price submissions are within normal ranges.</p>
          </Card>
        )}
      </div>

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