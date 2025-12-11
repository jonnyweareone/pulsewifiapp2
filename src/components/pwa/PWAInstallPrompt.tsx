'use client';

import { useState, useEffect } from 'react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { XMarkIcon } from '@heroicons/react/24/outline';

export function PWAInstallPrompt() {
  const { isInstallable, isInstalled, isIOS, canPrompt, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Check if user previously dismissed
  useEffect(() => {
    const wasDismissed = localStorage.getItem('pwa-install-dismissed');
    if (wasDismissed) {
      const dismissedAt = new Date(wasDismissed);
      const daysSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      // Show again after 7 days
      if (daysSince < 7) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
    } else if (canPrompt) {
      await promptInstall();
    }
  };

  // Don't show if already installed or dismissed
  if (isInstalled || dismissed) return null;

  // Don't show if not installable (unless iOS which doesn't support beforeinstallprompt)
  if (!isInstallable && !isIOS) return null;

  return (
    <>
      {/* Install Banner */}
      <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-96 z-40 animate-slide-up">
        <div className="bg-gray-900/95 backdrop-blur border border-gray-700 rounded-2xl p-4 shadow-xl">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
          
          <div className="flex items-start gap-4">
            <div className="text-4xl">📱</div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Install Pulse WiFi</h3>
              <p className="text-gray-400 text-sm mb-3">
                Add to your home screen for quick access and offline support
              </p>
              <button
                onClick={handleInstall}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors text-sm"
              >
                {isIOS ? 'How to Install' : 'Install App'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Instructions Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full animate-slide-up">
            <h3 className="text-xl font-bold text-white mb-4 text-center">
              Install Pulse WiFi
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-lg">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-white">
                    Tap the <span className="text-indigo-400">Share</span> button
                  </p>
                  <p className="text-gray-400 text-sm">
                    (square with arrow at bottom of Safari)
                  </p>
                </div>
                <div className="text-2xl">⬆️</div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-lg">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-white">
                    Scroll and tap <span className="text-indigo-400">Add to Home Screen</span>
                  </p>
                </div>
                <div className="text-2xl">➕</div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-600/20 flex items-center justify-center text-lg">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-white">
                    Tap <span className="text-indigo-400">Add</span> to confirm
                  </p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>
            
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}
