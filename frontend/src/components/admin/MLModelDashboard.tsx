import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  RefreshCw,
  Activity,
  BarChart3,
  Database,
  Cpu,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Settings,
  Play,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { getModelMetrics } from '../../lib/mlPriceEngine';

interface ModelConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  weight: number;
  lastTrained: string;
  accuracy: number;
  status: 'active' | 'training' | 'idle' | 'error';
}

export function MLModelDashboard() {
  const { t } = useLanguage();
  const [isTraining, setIsTraining] = useState(false);
  const [selectedModel, setSelectedModel] = useState('ensemble');
  const [trainingProgress, setTrainingProgress] = useState(0);
  
  const metrics = getModelMetrics();
  
  const [models, setModels] = useState<ModelConfig[]>([
    { id: '1', name: 'Linear Regression', type: 'Statistical', enabled: true, weight: 0.15, lastTrained: '2 hours ago', accuracy: 78.5, status: 'active' },
    { id: '2', name: 'Random Forest', type: 'ML Ensemble', enabled: true, weight: 0.25, lastTrained: '1 hour ago', accuracy: 84.2, status: 'active' },
    { id: '3', name: 'LSTM Neural Network', type: 'Deep Learning', enabled: true, weight: 0.30, lastTrained: '30 min ago', accuracy: 87.8, status: 'active' },
    { id: '4', name: 'ARIMA', type: 'Time Series', enabled: true, weight: 0.15, lastTrained: '1 hour ago', accuracy: 81.3, status: 'active' },
    { id: '5', name: 'XGBoost', type: 'Gradient Boosting', enabled: false, weight: 0.15, lastTrained: '3 hours ago', accuracy: 83.1, status: 'idle' },
  ]);

  const [trainingData, setTrainingData] = useState({
    totalRecords: 125847,
    lastUpdated: '10 min ago',
    categories: ['Vegetables', 'Fruits', 'Grains', 'Meat', 'Dairy', 'Spices'],
    markets: 48,
    products: 324,
    dateRange: 'Jan 2024 - Feb 2026',
  });

  const handleTrainAll = () => {
    setIsTraining(true);
    setTrainingProgress(0);
    
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          setModels(models.map(m => ({
            ...m,
            lastTrained: 'Just now',
            accuracy: Math.min(95, m.accuracy + Math.random() * 2),
            status: 'active' as const,
          })));
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
  };

  const handleTrainModel = (modelId: string) => {
    setModels(models.map(m => 
      m.id === modelId ? { ...m, status: 'training' as const } : m
    ));
    
    setTimeout(() => {
      setModels(models.map(m => 
        m.id === modelId ? { 
          ...m, 
          status: 'active' as const,
          lastTrained: 'Just now',
          accuracy: Math.min(95, m.accuracy + Math.random() * 3),
        } : m
      ));
    }, 3000);
  };

  const toggleModel = (modelId: string) => {
    setModels(models.map(m => 
      m.id === modelId ? { ...m, enabled: !m.enabled, status: m.enabled ? 'idle' as const : 'active' as const } : m
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'training': return 'bg-primary/20 text-primary border-primary/30';
      case 'idle': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-3 w-3" />;
      case 'training': return <RefreshCw className="h-3 w-3 animate-spin" />;
      case 'idle': return <Clock className="h-3 w-3" />;
      case 'error': return <AlertTriangle className="h-3 w-3" />;
      default: return <Minus className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold gradient-text">{t('mlModelDashboard') || 'ML Model Training Dashboard'}</h2>
              <p className="text-sm text-muted-foreground">
                Configure and train AI models for price prediction
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              disabled={isTraining}
              className="btn-outline-premium"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleTrainAll}
              disabled={isTraining}
              className="bg-primary hover:bg-primary/90"
            >
              {isTraining ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Training... {Math.round(trainingProgress)}%
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Train All Models
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Training Progress */}
        {isTraining && (
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white">Training Progress</span>
              <span className="text-primary">{Math.round(trainingProgress)}%</span>
            </div>
            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-300 rounded-full"
                style={{ width: `${trainingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Overall Accuracy</span>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.avgAccuracy}%</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Predictions</span>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.totalPredictions.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Database className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Training Records</span>
            </div>
            <p className="text-2xl font-bold text-white">{trainingData.totalRecords.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Active Models</span>
            </div>
            <p className="text-2xl font-bold text-white">{models.filter(m => m.enabled).length}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Products</span>
            </div>
            <p className="text-2xl font-bold text-white">{trainingData.products}</p>
          </div>
        </div>
      </Card>

      {/* Model List */}
      <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
          <Settings className="h-5 w-5" />
          ML Models Configuration
        </h3>
        
        <div className="space-y-3">
          {models.map((model) => (
            <div 
              key={model.id}
              className={`p-4 rounded-xl border transition-all ${
                model.enabled 
                  ? 'bg-white/5 border-white/10 hover:bg-white/10' 
                  : 'bg-white/5 border-white/10 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${model.enabled ? 'bg-primary/20' : 'bg-white/5'}`}>
                    <Brain className={`h-5 w-5 ${model.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold text-white">{model.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(model.status)}`}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(model.status)}
                          {model.status}
                        </span>
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{model.type}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Accuracy</p>
                    <p className={`font-bold text-emerald-400`}>
                      {model.accuracy.toFixed(1)}%
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="font-semibold text-white">{(model.weight * 100).toFixed(0)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Last Trained</p>
                    <p className="text-sm text-muted-foreground">{model.lastTrained}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTrainModel(model.id)}
                      disabled={model.status === 'training' || !model.enabled}
                      className="border-white/10 hover:bg-white/10"
                    >
                      {model.status === 'training' ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={model.enabled ? "default" : "outline"}
                      onClick={() => toggleModel(model.id)}
                      className={model.enabled ? "bg-primary hover:bg-primary/90" : "border-white/10 hover:bg-white/10"}
                    >
                      {model.enabled ? 'Enabled' : 'Disabled'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Training Data Info */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
            <Database className="h-5 w-5" />
            Training Data
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-muted-foreground">Total Records</span>
              <span className="font-semibold text-white">{trainingData.totalRecords.toLocaleString()}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-muted-foreground">Markets Covered</span>
              <span className="font-semibold text-white">{trainingData.markets}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-muted-foreground">Products Tracked</span>
              <span className="font-semibold text-white">{trainingData.products}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-muted-foreground">Date Range</span>
              <span className="font-semibold text-white">{trainingData.dateRange}</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-semibold text-white">{trainingData.lastUpdated}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 rounded-xl dark-glass border-white/10 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 gradient-text">
            <BarChart3 className="h-5 w-5" />
            Model Performance
          </h3>
          <div className="space-y-3">
            {metrics.models.map((model, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-white">{model.name}</span>
                  <span className={`text-sm font-bold text-emerald-400`}>
                    {model.accuracy}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${model.accuracy >= 85 ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${model.accuracy}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                  <span>MAPE: {model.mape}%</span>
                  <span>RMSE: {model.rmse}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
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