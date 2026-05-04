import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Signal, SignalLow, SignalMedium, SignalHigh } from 'lucide-react';
import { useDataSaver } from '../../contexts/DataSaverContext';
import { cn } from '../ui/utils';

interface OfflineIndicatorProps {
  className?: string;
  showConnectionInfo?: boolean;
}

/**
 * OfflineIndicator Component
 * Shows network status and connection quality
 */
export default function OfflineIndicator({ 
  className,
  showConnectionInfo = true 
}: OfflineIndicatorProps) {
  const { isOffline, connectionType, effectiveType, saveData } = useDataSaver();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner briefly when going offline/online
    setShowBanner(true);
    const timer = setTimeout(() => {
      if (!isOffline) {
        setShowBanner(false);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isOffline]);

  if (!showBanner && !isOffline) return null;

  const getSignalIcon = () => {
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return <SignalLow className="h-4 w-4" />;
      case '3g':
        return <SignalMedium className="h-4 w-4" />;
      case '4g':
        return <SignalHigh className="h-4 w-4" />;
      default:
        return <Signal className="h-4 w-4" />;
    }
  };

  const getConnectionLabel = () => {
    if (isOffline) return 'Offline';
    if (saveData) return 'Data Saver Active';
    return effectiveType?.toUpperCase() || 'Connected';
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full shadow-lg transition-all duration-300',
        isOffline 
          ? 'bg-green-600 text-white' 
          : saveData 
            ? 'bg-green-700 text-white'
            : 'bg-green-500 text-white',
        showBanner ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0',
        className
      )}
    >
      {isOffline ? (
        <WifiOff className="h-4 w-4" />
      ) : (
        <>
          <Wifi className="h-4 w-4" />
          {showConnectionInfo && getSignalIcon()}
        </>
      )}
      <span className="text-sm font-medium">{getConnectionLabel()}</span>
    </div>
  );
}

/**
 * Compact offline indicator for headers
 */
export function CompactOfflineIndicator({ className }: { className?: string }) {
  const { isOffline, effectiveType } = useDataSaver();

  if (!isOffline && effectiveType !== 'slow-2g' && effectiveType !== '2g') {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
        isOffline ? 'bg-green-900 text-green-100' : 'bg-green-800 text-green-100',
        className
      )}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      ) : (
        <>
          <SignalLow className="h-3 w-3" />
          <span>Slow</span>
        </>
      )}
    </div>
  );
}
