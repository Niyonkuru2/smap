import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { 
  listenForInstallPrompt, 
  showInstallPrompt, 
  canInstallApp,
  isAppInstalled 
} from '../lib/pwa';

export function InstallPWA() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isAppInstalled()) {
      return;
    }

    // Check if user dismissed it before
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      return;
    }

    // Listen for install prompt
    listenForInstallPrompt(() => {
      setShowPrompt(true);
    });

    // If browser doesn't support install prompt, show manual instructions after 30 seconds
    setTimeout(() => {
      if (!canInstallApp() && !dismissed) {
        setShowPrompt(true);
      }
    }, 30000);
  }, [dismissed]);

  const handleInstall = async () => {
    const installed = await showInstallPrompt();
    if (installed) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt || isAppInstalled()) {
    return null;
  }

  return (
    <Card className="fixed bottom-4 right-4 left-4 md:left-auto md:w-96 p-4 shadow-lg z-50 border-2 border-green-700 bg-gradient-to-br from-green-950 to-green-900">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 bg-green-700 p-2 rounded-lg">
          <Smartphone className="h-6 w-6 text-white" />
        </div>
        
        <div className="flex-1">
          <h4 className="mb-1">Install SMPMPS</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Add SMPMPS to your home screen for quick access and offline use!
          </p>
          
          <div className="flex gap-2">
            <Button onClick={handleInstall} size="sm" className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              Install
            </Button>
            <Button onClick={handleDismiss} variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {!canInstallApp() && (
            <div className="mt-3 text-xs text-muted-foreground bg-green-900 p-2 rounded border">
              <p className="font-semibold mb-1">How to install:</p>
              <ul className="space-y-1 ml-4 list-disc">
                <li>Tap the share button</li>
                <li>Select "Add to Home Screen"</li>
                <li>Tap "Add"</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
