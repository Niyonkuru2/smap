import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive, Zap, X } from 'lucide-react';
import { getPerformanceMetrics, getMemoryUsage } from '../../utils/performance';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

interface PerformanceMonitorProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  defaultCollapsed?: boolean;
}

/**
 * PerformanceMonitor Component
 * Development tool for monitoring app performance metrics
 */
export default function PerformanceMonitor({ 
  position = 'bottom-right',
  defaultCollapsed = true 
}: PerformanceMonitorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const [metrics, setMetrics] = useState(getPerformanceMetrics());
  const [memory, setMemory] = useState(getMemoryUsage());
  const [fps, setFps] = useState(60);

  // Only show in development
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development' || 
                  window.location.hostname === 'localhost';
    setIsVisible(isDev);
  }, []);

  // Update metrics periodically
  useEffect(() => {
    if (!isVisible || isCollapsed) return;

    const interval = setInterval(() => {
      setMetrics(getPerformanceMetrics());
      setMemory(getMemoryUsage());
    }, 1000);

    return () => clearInterval(interval);
  }, [isVisible, isCollapsed]);

  // FPS counter
  useEffect(() => {
    if (!isVisible || isCollapsed) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const countFps = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(countFps);
    };

    animationId = requestAnimationFrame(countFps);
    return () => cancelAnimationFrame(animationId);
  }, [isVisible, isCollapsed]);

  if (!isVisible) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getScoreColor = (value: number | null, thresholds: { good: number; ok: number }) => {
    if (value === null) return 'text-muted-foreground';
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.ok) return 'text-green-600';
    return 'text-green-700';
  };

  if (isCollapsed) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsCollapsed(false)}
        className={cn(
          'fixed z-50 shadow-lg',
          positionClasses[position]
        )}
      >
        <Activity className="h-4 w-4 mr-1" />
        <span className={cn(
          fps >= 50 ? 'text-green-500' : fps >= 30 ? 'text-green-600' : 'text-green-700'
        )}>
          {fps} FPS
        </span>
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'fixed z-50 w-72 bg-background/95 backdrop-blur border rounded-lg shadow-xl',
        positionClasses[position]
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Performance Monitor</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsCollapsed(true)}
            className="h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="p-3 space-y-3 text-sm">
        {/* FPS */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <span>FPS</span>
          </div>
          <span className={cn(
            'font-mono font-bold',
            fps >= 50 ? 'text-green-500' : fps >= 30 ? 'text-green-600' : 'text-green-700'
          )}>
            {fps}
          </span>
        </div>

        {/* Core Web Vitals */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase">Core Web Vitals</span>
          
          {/* LCP */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">LCP</span>
            <span className={cn('font-mono', getScoreColor(metrics.lcp, { good: 2500, ok: 4000 }))}>
              {metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'N/A'}
            </span>
          </div>

          {/* FID */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">FID</span>
            <span className={cn('font-mono', getScoreColor(metrics.fid, { good: 100, ok: 300 }))}>
              {metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'N/A'}
            </span>
          </div>

          {/* CLS */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">CLS</span>
            <span className={cn('font-mono', getScoreColor(metrics.cls ? metrics.cls * 1000 : null, { good: 100, ok: 250 }))}>
              {metrics.cls !== null ? metrics.cls.toFixed(4) : 'N/A'}
            </span>
          </div>

          {/* FCP */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">FCP</span>
            <span className={cn('font-mono', getScoreColor(metrics.fcp, { good: 1800, ok: 3000 }))}>
              {metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A'}
            </span>
          </div>

          {/* TTFB */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">TTFB</span>
            <span className={cn('font-mono', getScoreColor(metrics.ttfb, { good: 200, ok: 500 }))}>
              {metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'N/A'}
            </span>
          </div>
        </div>

        {/* Memory */}
        {memory && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase">Memory</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Used Heap</span>
              <span className="font-mono">{formatBytes(memory.usedJSHeapSize)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Total Heap</span>
              <span className="font-mono">{formatBytes(memory.totalJSHeapSize)}</span>
            </div>

            {/* Memory usage bar */}
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ 
                  width: `${(memory.usedJSHeapSize / memory.totalJSHeapSize) * 100}%` 
                }}
              />
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Good
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" /> Needs Improvement
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-600" /> Poor
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
