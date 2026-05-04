import React, { useState, useEffect } from 'react';
import CacheManager from '../utils/cacheManager';

interface CacheMetrics {
  totalSize: string;
  itemCount: number;
  oldestItem: string | null;
  usagePercent: number;
}

/**
 * Storage Monitor Component
 * Displays cache statistics and provides cleanup controls
 */
const StorageMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    updateMetrics();
    // Update metrics every 30 seconds
    const interval = setInterval(updateMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateMetrics = () => {
    const stats = CacheManager.getStats();
    const maxSize = 5 * 1024 * 1024; // 5MB
    const usagePercent = (stats.totalSize / maxSize) * 100;

    setMetrics({
      totalSize: CacheManager.getFormattedSize(stats.totalSize),
      itemCount: stats.itemCount,
      oldestItem: stats.oldestItem,
      usagePercent: Math.round(usagePercent),
    });
  };

  const handleClearCache = () => {
    if (
      window.confirm(
        'Are you sure you want to clear all cache? This will force re-fetching of data.',
      )
    ) {
      CacheManager.clear();
      updateMetrics();
    }
  };

  const handleCleanup = () => {
    CacheManager.cleanup();
    updateMetrics();
  };

  if (!metrics) {
    return null;
  }

  const isNearLimit = metrics.usagePercent > 80;

  return (
    <div
      className="fixed bottom-4 right-4 z-40 transition-all duration-300"
      style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Collapsed View */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="px-4 py-2 text-sm font-medium hover:bg-green-900/20 transition-colors w-full text-left flex items-center justify-between"
          style={{
            color: isNearLimit ? '#10b981' : '#b3e5fc',
          }}
        >
          <span>📦 Cache: {metrics.totalSize}</span>
          <span className="text-xs ml-2">{metrics.usagePercent}%</span>
        </button>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="p-4 min-w-72">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Storage Stats</h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          {/* Usage Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600">Cache Usage</span>
              <span
                className={`font-semibold ${
                  isNearLimit ? 'text-green-700' : 'text-green-600'
                }`}
              >
                {metrics.usagePercent}%
              </span>
            </div>
            <div
              style={{
                background: 'hsl(160,40%,30%)',
                borderRadius: '4px',
                height: '6px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${metrics.usagePercent}%`,
                  background: isNearLimit ? '#10b981' : '#059669',
                  height: '100%',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between text-gray-700">
              <span>Total Size:</span>
              <span className="font-mono font-semibold">{metrics.totalSize}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Cached Items:</span>
              <span className="font-mono font-semibold">{metrics.itemCount}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Oldest Item:</span>
              <span className="font-mono text-xs">
                {metrics.oldestItem || 'N/A'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCleanup}
              className="flex-1 px-3 py-2 text-xs font-medium rounded bg-green-900 text-green-100 hover:bg-green-800 transition-colors"
            >
              🧹 Cleanup
            </button>
            <button
              onClick={handleClearCache}
              className="flex-1 px-3 py-2 text-xs font-medium rounded bg-green-950 text-green-100 hover:bg-green-900 transition-colors"
            >
              🗑️ Clear All
            </button>
          </div>

          {isNearLimit && (
            <div className="mt-3 p-2 bg-green-950 rounded text-xs text-green-300">
              ⚠️ Cache is near capacity. Click "Cleanup" to free up space.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StorageMonitor;
