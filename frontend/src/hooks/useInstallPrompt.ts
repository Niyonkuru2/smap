import { useEffect, useState } from 'react';

export function useInstallPrompt(user: any) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Detect installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Track visits
    const visits = Number(localStorage.getItem('visits') || 0) + 1;
    localStorage.setItem('visits', String(visits));

    // Conditions
    const dismissed = localStorage.getItem('install_dismissed');
    const minVisits = visits >= 3; 
    if (!dismissed && minVisits && user) {
      setShouldShow(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      localStorage.setItem('installed', 'true');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [user]);

  return {
    deferredPrompt,
    isInstalled,
    shouldShow,
    setShouldShow,
  };
}