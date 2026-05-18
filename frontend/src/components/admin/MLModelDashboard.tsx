import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
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
import { trainModels, getModelMetrics, type TrainModelsResult, type ModelMetrics } from '../../services/priceForecastService';

interface ModelConfig {
  id: string;
  name: string;
  type: string;
  enabled: boolean;
  weight: number;
  lastTrained: string;
  accuracy: number;
  status: 'active' | 'training' | 'idle' | 'error';
  mape?: number;
  rmse?: number;
}

export function MLModelDashboard() {
  const { t } = useLanguage();
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [trainingResult, setTrainingResult] = useState<TrainModelsResult | null>(null);
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [models, setModels] = useState<ModelConfig[]>([
    { id: 'linearRegression', name: 'Linear Regression', type: 'Statistical', enabled: true, weight: 0.25, lastTrained: 'Not trained', accuracy: 0, status: 'idle', mape: 0, rmse: 0 },
    { id: 'exponentialSmoothing', name: 'Exponential Smoothing', type: 'Time Series', enabled: true, weight: 0.25, lastTrained: 'Not trained', accuracy: 0, status: 'idle', mape: 0, rmse: 0 },
    { id: 'seasonalTrend', name: 'Seasonal Decomposition', type: 'Statistical', enabled: true, weight: 0.25, lastTrained: 'Not trained', accuracy: 0, status: 'idle', mape: 0, rmse: 0 },
    { id: 'ensemble', name: 'Ensemble Model', type: 'ML Ensemble', enabled: true, weight: 0.25, lastTrained: 'Not trained', accuracy: 0, status: 'idle', mape: 0, rmse: 0 },
  ]);

  const [trainingData, setTrainingData] = useState({
    totalRecords: 0,
    lastUpdated: 'Not available',
    categories: [] as string[],
    markets: 0,
    products: 0,
    dateRange: 'No data',
  });

  // Fetch metrics on component mount
  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getModelMetrics();
      if (data) {
        setMetrics(data);
        
        // Update training data from metrics
        setTrainingData({
          totalRecords: data.total_predictions,
          lastUpdated: new Date(data.last_trained).toLocaleString(),
          categories: ['Vegetables', 'Fruits', 'Grains', 'Meat', 'Dairy'],
          markets: data.total_markets,
          products: data.total_products,
          dateRange: data.data_range.from 
            ? `${new Date(data.data_range.from).toLocaleDateString()} - ${new Date(data.data_range.to).toLocaleDateString()}`
            : 'No data',
        });
        
        // Update models with accuracy from API
        if (data.models && data.models.length > 0) {
          setModels(prevModels => 
            prevModels.map(model => {
              const apiModel = data.models.find(m => 
                m.name.toLowerCase().includes(model.name.toLowerCase())
              );
              if (apiModel) {
                return {
                  ...model,
                  accuracy: apiModel.accuracy,
                  mape: apiModel.mape,
                  rmse: apiModel.rmse,
                  lastTrained: new Date(data.last_trained).toLocaleString(),
                  status: 'active' as const,
                };
              }
              return model;
            })
          );
        }
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError('Failed to load model metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainAll = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    setError(null);
    
    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 500);
    
    try {
      // Update model statuses to training
      setModels(prev => prev.map(m => ({ ...m, status: 'training' as const })));
      
      // Call the actual train API
      const result = await trainModels();
      
      if (result && result.success) {
        setTrainingResult(result);
        setTrainingProgress(100);
        
        // Fetch updated metrics
        await fetchMetrics();
        
        // Update last trained timestamp
        setModels(prev => prev.map(m => ({ 
          ...m, 
          status: 'active' as const,
          lastTrained: new Date(result.timestamp).toLocaleString()
        })));
      } else {
        throw new Error('Training failed');
      }
    } catch (err) {
      console.error('Error training models:', err);
      setError('Failed to train models. Please try again.');
      setModels(prev => prev.map(m => ({ ...m, status: 'error' as const })));
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsTraining(false);
        setTrainingProgress(0);
      }, 1000);
    }
  };

  const handleTrainModel = async (modelId: string) => {
    // Update specific model to training status
    setModels(prev => prev.map(m =>
      m.id === modelId ? { ...m, status: 'training' as const } : m
    ));
    
    try {
      // Call the train all API (backend trains all models)
      const result = await trainModels();
      
      if (result && result.success) {
        // Fetch updated metrics
        await fetchMetrics();
        
        setModels(prev => prev.map(m => 
          m.id === modelId ? { 
            ...m, 
            status: 'active' as const,
            lastTrained: new Date(result.timestamp).toLocaleString()
          } : m
        ));
      } else {
        throw new Error('Training failed');
      }
    } catch (err) {
      console.error('Error training model:', err);
      setModels(prev => prev.map(m => 
        m.id === modelId ? { ...m, status: 'error' as const } : m
      ));
      setError(`Failed to train ${models.find(m => m.id === modelId)?.name}`);
    }
  };

  const toggleModel = async (modelId: string) => {
    // Note: This is a frontend-only toggle since backend doesn't have individual model enable/disable
    setModels(prev => prev.map(m => 
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

  const avgAccuracy = metrics?.avg_accuracy || models.reduce((acc, m) => acc + m.accuracy, 0) / models.length;

  if (loading && !metrics) {
    return (
      <Card className="p-12 rounded-xl dark-glass border-white/10">
        <div className="flex flex-col items-center justify-center gap-4">
          <RefreshCw className="h-8 w-8 text-primary animate-spin" />
          <p className="text-muted-foreground">Loading model metrics...</p>
        </div>
      </Card>
    );
  }

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
              onClick={fetchMetrics}
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
            {trainingResult && trainingProgress === 100 && (
              <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm text-emerald-400">
                  ✓ {trainingResult.message}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Overall Accuracy</span>
            </div>
            <p className="text-2xl font-bold text-white">{avgAccuracy.toFixed(1)}%</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Predictions</span>
            </div>
            <p className="text-2xl font-bold text-white">{trainingData.totalRecords.toLocaleString()}</p>
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
                    <p className={`font-bold ${model.accuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {model.accuracy.toFixed(1)}%
                    </p>
                  </div>
                  {model.mape && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">MAPE</p>
                      <p className="text-sm text-muted-foreground">{model.mape}%</p>
                    </div>
                  )}
                  {model.rmse && (
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">RMSE</p>
                      <p className="text-sm text-muted-foreground">{model.rmse}</p>
                    </div>
                  )}
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Last Trained</p>
                    <p className="text-sm text-muted-foreground">{model.lastTrained}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTrainModel(model.id)}
                      disabled={model.status === 'training' || !model.enabled || isTraining}
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
            {models.map((model, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-white">{model.name}</span>
                  <span className={`text-sm font-bold ${model.accuracy >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {model.accuracy.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${model.accuracy >= 80 ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${model.accuracy}%` }}
                  />
                </div>
                {model.mape && model.rmse && (
                  <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                    <span>MAPE: {model.mape}%</span>
                    <span>RMSE: {model.rmse}</span>
                  </div>
                )}
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