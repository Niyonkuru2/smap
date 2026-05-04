import { useState } from 'react';
import { Battery, Zap, Image, Wifi, ChevronDown, ChevronUp } from 'lucide-react';
import { useDataSaver } from '../../contexts/DataSaverContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { cn } from '../ui/utils';

interface DataSaverToggleProps {
  className?: string;
  compact?: boolean;
}

/**
 * DataSaverToggle Component
 * Allows users to manage data saver settings
 */
export default function DataSaverToggle({ className, compact = false }: DataSaverToggleProps) {
  const { 
    isDataSaverEnabled, 
    toggleDataSaver, 
    imageQuality, 
    setImageQuality,
    effectiveType,
    isOffline
  } = useDataSaver();
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleDataSaver}
        className={cn(
          'flex items-center gap-2',
          isDataSaverEnabled && 'text-green-600',
          className
        )}
        title={isDataSaverEnabled ? 'Data Saver: ON' : 'Data Saver: OFF'}
      >
        {isDataSaverEnabled ? (
          <Battery className="h-4 w-4 fill-current" />
        ) : (
          <Zap className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <div className={cn('rounded-lg border bg-card p-4', className)}>
      {/* Main Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-full',
            isDataSaverEnabled ? 'bg-green-100 text-green-600' : 'bg-muted'
          )}>
            <Battery className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">{t('dataSaverMode') || 'Data Saver Mode'}</h3>
            <p className="text-sm text-muted-foreground">
              {t('reducesDataUsage') || 'Reduces data usage and improves speed'}
            </p>
          </div>
        </div>
        <Switch 
          checked={isDataSaverEnabled} 
          onCheckedChange={toggleDataSaver}
        />
      </div>

      {/* Expand Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="w-full mt-3 flex items-center justify-center gap-1 text-muted-foreground"
      >
        {expanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            {t('showLess') || 'Show less'}
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            {t('moreOptions') || 'More options'}
          </>
        )}
      </Button>

      {/* Expanded Options */}
      {expanded && (
        <div className="mt-4 space-y-4 pt-4 border-t">
          {/* Image Quality */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{t('imageQuality') || 'Image Quality'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['high', 'medium', 'low'] as const).map((quality) => (
                <Button
                  key={quality}
                  variant={imageQuality === quality ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setImageQuality(quality)}
                  className="capitalize"
                >
                  {t(quality) || quality}
                </Button>
              ))}
            </div>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wifi className="h-4 w-4" />
            <span>
              {isOffline 
                ? (t('offlineMode') || 'Offline Mode')
                : `${t('connection') || 'Connection'}: ${effectiveType?.toUpperCase() || 'Unknown'}`
              }
            </span>
          </div>

          {/* Data Savings Estimate */}
          {isDataSaverEnabled && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-3">
              <p className="text-sm text-green-700 dark:text-green-400">
                💡 {t('dataSaverTip') || 'You may save up to 40% data with current settings'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Mini Data Saver indicator for headers
 */
export function DataSaverIndicator({ className }: { className?: string }) {
  const { isDataSaverEnabled } = useDataSaver();

  if (!isDataSaverEnabled) return null;

  return (
    <div className={cn(
      'flex items-center gap-1 px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-medium',
      className
    )}>
      <Battery className="h-3 w-3 fill-current" />
      <span>Saver</span>
    </div>
  );
}
