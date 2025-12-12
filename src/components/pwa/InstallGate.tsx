'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowUpOnSquareIcon, 
  PlusCircleIcon,
  EllipsisVerticalIcon,
  DevicePhoneMobileIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Detect device type
const getDeviceInfo = () => {
  if (typeof window === 'undefined') return { isIOS: false, isAndroid: false, isMobile: false };
  
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isMobile = isIOS || isAndroid || /Mobile/.test(ua);
  
  return { isIOS, isAndroid, isMobile };
};

// Check if running as standalone PWA
const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://');
};

export function InstallGate({ children }: { children: React.ReactNode }) {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({ isIOS: false, isAndroid: false, isMobile: false });
  const [isInstalled, setIsInstalled] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const info = getDeviceInfo();
    setDeviceInfo(info);
    
    // Check if already installed
    const installed = isStandalone();
    setIsInstalled(installed);
    
    // If on mobile and not installed, show install prompt
    if (info.isMobile && !installed) {
      setShowInstallPrompt(true);
    }
    
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
      setShowInstallPrompt(false);
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
        setShowInstallPrompt(false);
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

  // Already installed or on desktop - show normal app
  if (isInstalled || !deviceInfo.isMobile) {
    return <>{children}</>;
  }

  // Show install instructions
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 mb-4">
          <DevicePhoneMobileIcon className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
          Pulse WiFi
        </h1>
        <p className="mt-2 text-gray-400">Seamless Public WiFi</p>
      </div>

      {/* Install Card */}
      <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white text-center mb-2">
          Install the App
        </h2>
        <p className="text-gray-400 text-center text-sm mb-6">
          Add Pulse WiFi to your home screen to get started
        </p>

        {deviceInfo.isIOS ? (
          // iOS Instructions
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Tap the Share button</p>
                <p className="text-gray-400 text-sm">At the bottom of Safari</p>
              </div>
              <ArrowUpOnSquareIcon className="h-6 w-6 text-blue-400" />
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <span className="text-purple-400 font-bold">2</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Add to Home Screen</p>
                <p className="text-gray-400 text-sm">Scroll down and tap it</p>
              </div>
              <PlusCircleIcon className="h-6 w-6 text-purple-400" />
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <span className="text-green-400 font-bold">3</span>
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">Open from Home Screen</p>
                <p className="text-gray-400 text-sm">Launch the app to continue</p>
              </div>
            </div>

            {/* Visual pointer to share button */}
            <div className="mt-6 text-center">
              <ArrowDownIcon className="h-8 w-8 text-blue-400 mx-auto animate-bounce" />
              <p className="text-blue-400 text-sm mt-2">Tap Share below ↓</p>
            </div>
          </div>
        ) : deviceInfo.isAndroid ? (
          // Android Instructions
          <div className="space-y-4">
            {deferredPrompt ? (
              // Chrome install prompt available
              <button
                onClick={handleAndroidInstall}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all"
              >
                Install App
              </button>
            ) : (
              // Manual instructions for other browsers
              <>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <span className="text-blue-400 font-bold">1</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Tap the menu</p>
                    <p className="text-gray-400 text-sm">Three dots at top right</p>
                  </div>
                  <EllipsisVerticalIcon className="h-6 w-6 text-blue-400" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-purple-400 font-bold">2</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Install app</p>
                    <p className="text-gray-400 text-sm">Or "Add to Home Screen"</p>
                  </div>
                  <PlusCircleIcon className="h-6 w-6 text-purple-400" />
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-400 font-bold">3</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">Open from Home Screen</p>
                    <p className="text-gray-400 text-sm">Launch the app to continue</p>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}

        {/* Why install */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-gray-500 text-xs text-center">
            Installing the app enables push notifications and seamless WiFi configuration
          </p>
        </div>
      </div>

      {/* Skip for desktop testing */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={() => setShowInstallPrompt(false)}
          className="mt-6 text-gray-500 text-sm underline"
        >
          Skip (dev only)
        </button>
      )}
    </div>
  );
}
