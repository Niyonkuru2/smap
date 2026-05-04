import { Download } from 'lucide-react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { useAuth } from '@/contexts/AuthContext';

export default function InstallPrompt() {
  const { user } = useAuth();
  const {
    deferredPrompt,
    isInstalled,
    shouldShow,
    setShouldShow,
  } = useInstallPrompt(user);

  if (isInstalled || !shouldShow) return null;

  const track = (event: string) => {
    console.log("INSTALL_EVENT:", event);

    // 👉 Replace with real analytics later
    // fetch('/api/analytics', { method: 'POST', body: JSON.stringify({ event }) })
  };

  const handleInstall = async () => {
    if (!deferredPrompt) {
      track('fallback_instruction');

      alert('Use browser menu → Add to Home Screen');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      track('accepted');
    } else {
      track('dismissed_native');
    }

    setShouldShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('install_dismissed', 'true');
    track('dismissed_custom');
    setShouldShow(false);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-slate-800 rounded-xl shadow-lg border border-green-700 p-4">
        <div className="flex gap-3">
          <Download className="h-5 w-5 text-green-400" />

          <div className="flex-1">
            <h3 className="font-semibold text-white">
              Install SMPMPS
            </h3>

            <p className="text-sm text-slate-300 mb-3">
              Faster access. Works offline.
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg"
              >
                Install
              </button>

              <button
                onClick={handleDismiss}
                className="flex-1 px-3 py-2 bg-slate-700 text-slate-300 rounded-lg"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}