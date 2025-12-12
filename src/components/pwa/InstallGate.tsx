'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowUpOnSquareIcon, 
  PlusCircleIcon,
  EllipsisVerticalIcon,
  WifiIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Detect device type
const getDeviceInfo = () => {
  if (typeof window === 'undefined') return { isIOS: false, isAndroid: false, isMobile: false, browser: 'unknown' };
  
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid || /Mobile/.test(ua);
  
  let browser = 'unknown';
  if (/Safari/.test(ua) && !/Chrome/.test(ua)) browser = 'safari';
  else if (/Chrome/.test(ua)) browser = 'chrome';
  else if (/Firefox/.test(ua)) browser = 'firefox';
  
  return { isIOS, isAndroid, isMobile, browser };
};

// Check if running as standalone PWA
const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');
};

export function InstallGate({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({ isIOS: false, isAndroid: false, isMobile: false, browser: 'unknown' });
  const [isInstalled, setIsInstalled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const info = getDeviceInfo();
    setDeviceInfo(info);
    
    // Check if already installed (running as PWA)
    const installed = isStandalone();
    setIsInstalled(installed);
    
    setChecking(false);
    
    // Listen for beforeinstallprompt (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
    });
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  // Still checking
  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
      </div>
    );
  }

  // ✅ Already installed as PWA OR on desktop - show normal app
  if (isInstalled || !deviceInfo.isMobile) {
    return <>{children}</>;
  }

  // 🚫 Mobile browser (not installed) - ONLY show install screen
  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-900 flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        
        {/* Logo/Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 rounded-[22px] bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-500/30">
            <WifiIcon className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* App name */}
        <h1 className="text-3xl font-bold text-white mb-2">Pulse WiFi</h1>
        <p className="text-gray-400 text-center mb-8 max-w-xs">
          Seamless public WiFi. Connect once, stay connected everywhere.
        </p>

        {/* Install Instructions Card */}
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white text-center mb-1">
            Install the App
          </h2>
          <p className="text-gray-400 text-center text-sm mb-6">
            Add to your home screen to continue
          </p>

          {deviceInfo.isIOS ? (
            // iOS Safari Instructions
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-400 font-bold text-sm">1</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">Tap Share</p>
                  <p className="text-gray-500 text-xs">Bottom of screen</p>
                </div>
                <ArrowUpOnSquareIcon className="h-6 w-6 text-blue-400 flex-shrink-0" />
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 font-bold text-sm">2</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">Add to Home Screen</p>
                  <p className="text-gray-500 text-xs">Scroll down in menu</p>
                </div>
                <PlusCircleIcon className="h-6 w-6 text-purple-400 flex-shrink-0" />
              </div>

              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-400 font-bold text-sm">3</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">Open from Home</p>
                  <p className="text-gray-500 text-xs">Tap the app icon</p>
                </div>
              </div>

              {/* Animated arrow pointing down */}
              <div className="pt-4 flex flex-col items-center">
                <ArrowDownIcon className="h-6 w-6 text-blue-400 animate-bounce" />
                <p className="text-blue-400 text-xs mt-1">Tap Share below</p>
              </div>
            </div>
          ) : deviceInfo.isAndroid ? (
            // Android Instructions
            <div className="space-y-3">
              {deferredPrompt ? (
                // Chrome install prompt available
                <button
                  onClick={handleAndroidInstall}
                  className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all active:scale-[0.98]"
                >
                  Install App
                </button>
              ) : (
                // Manual instructions for other browsers
                <>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-400 font-bold text-sm">1</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">Tap Menu</p>
                      <p className="text-gray-500 text-xs">Three dots at top</p>
                    </div>
                    <EllipsisVerticalIcon className="h-6 w-6 text-blue-400 flex-shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-purple-400 font-bold text-sm">2</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">Install App</p>
                      <p className="text-gray-500 text-xs">Or &quot;Add to Home&quot;</p>
                    </div>
                    <PlusCircleIcon className="h-6 w-6 text-purple-400 flex-shrink-0" />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-400 font-bold text-sm">3</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium">Open from Home</p>
                      <p className="text-gray-500 text-xs">Tap the app icon</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>

        {/* Features preview */}
        <div className="mt-8 flex gap-6 text-center">
          <div>
            <div className="text-2xl mb-1">🔒</div>
            <p className="text-xs text-gray-500">Secure</p>
          </div>
          <div>
            <div className="text-2xl mb-1">📶</div>
            <p className="text-xs text-gray-500">Fast</p>
          </div>
          <div>
            <div className="text-2xl mb-1">🆓</div>
            <p className="text-xs text-gray-500">Free</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 pb-[env(safe-area-inset-bottom)] text-center">
        <p className="text-gray-600 text-xs">
          Powered by Passpoint 2.0 technology
        </p>
      </div>
    </div>
  );
}
