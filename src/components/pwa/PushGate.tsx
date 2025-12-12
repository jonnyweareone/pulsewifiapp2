'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { 
  BellSlashIcon,
  BellAlertIcon,
  WifiIcon,
  ExclamationTriangleIcon,
  Cog6ToothIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface PushGateProps {
  children: React.ReactNode;
  /** If true, blocks access completely when push is disabled. If false, just shows a warning banner. */
  blocking?: boolean;
  /** Callback when push status changes */
  onPushStatusChange?: (enabled: boolean) => void;
}

// Check if running as standalone PWA
const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

// Detect iOS
const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Try to open notification settings (best effort - doesn't work on all platforms)
const openNotificationSettings = () => {
  const isIOS = isIOSDevice();
  
  if (isIOS) {
    // iOS doesn't allow opening settings directly from PWA
    // Best we can do is show instructions
    return false;
  }
  
  // On Android Chrome PWA, there's no reliable way to open settings
  // Return false to indicate we couldn't open settings
  return false;
};

export function PushGate({ children, blocking = true, onPushStatusChange }: PushGateProps) {
  const { 
    isReady, 
    isEnabled, 
    isSupported, 
    permissionStatus,
    requestPermission,
    isIOS,
    isStandalone: isPWA,
  } = usePushNotifications();
  
  const [showGate, setShowGate] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check push status whenever hook state changes
  useEffect(() => {
    if (!isReady) return;
    
    // Only gate if in standalone PWA mode (installed)
    if (!isPWA) {
      setShowGate(false);
      return;
    }
    
    // Check if push is disabled
    const pushDisabled = isSupported && !isEnabled && permissionStatus !== 'default';
    setShowGate(pushDisabled);
    
    // Notify parent of status change
    onPushStatusChange?.(isEnabled);
    
    console.log('[PushGate] Status check:', {
      isReady,
      isSupported,
      isEnabled,
      permissionStatus,
      isPWA,
      showGate: pushDisabled,
    });
  }, [isReady, isSupported, isEnabled, permissionStatus, isPWA, onPushStatusChange]);

  const handleEnablePush = useCallback(async () => {
    setRequesting(true);
    setError(null);
    
    try {
      // If permission was denied, we can't re-request - user must go to settings
      if (permissionStatus === 'denied') {
        const couldOpenSettings = openNotificationSettings();
        if (!couldOpenSettings) {
          setError('Please enable notifications in your device settings, then reload the app.');
        }
        setRequesting(false);
        return;
      }
      
      // Try to request permission
      const success = await requestPermission();
      
      if (success) {
        setShowGate(false);
      } else {
        setError('Failed to enable notifications. Please check your settings.');
      }
    } catch (err: any) {
      console.error('[PushGate] Error enabling push:', err);
      setError(err?.message || 'Failed to enable notifications');
    } finally {
      setRequesting(false);
    }
  }, [permissionStatus, requestPermission]);

  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  // Not ready yet - show loading or children
  if (!isReady) {
    return <>{children}</>;
  }

  // Push is enabled or not in PWA mode - show children
  if (!showGate) {
    return <>{children}</>;
  }

  // Non-blocking mode - show banner but allow access
  if (!blocking) {
    return (
      <>
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between" style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top, 0px))' }}>
          <div className="flex items-center gap-2">
            <BellSlashIcon className="h-5 w-5 text-amber-900" />
            <span className="text-sm font-medium text-amber-900">
              Push notifications are disabled
            </span>
          </div>
          <button
            onClick={handleEnablePush}
            disabled={requesting}
            className="px-3 py-1 bg-amber-900 text-amber-100 text-sm font-medium rounded-full hover:bg-amber-800 transition-colors disabled:opacity-50"
          >
            {requesting ? 'Enabling...' : 'Enable'}
          </button>
        </div>
        <div style={{ paddingTop: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}>
          {children}
        </div>
      </>
    );
  }

  // Blocking mode - show full-screen gate
  return (
    <div className="min-h-screen min-h-[100dvh] bg-slate-900 flex flex-col">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        
        {/* Warning Icon */}
        <div className="mb-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-red-500/20 border-2 border-amber-500/30 flex items-center justify-center">
            <BellSlashIcon className="h-12 w-12 text-amber-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2 text-center">
          Notifications Disabled
        </h1>
        <p className="text-gray-400 text-center mb-8 max-w-xs">
          Push notifications are required for WiFi access. Please enable them to continue.
        </p>

        {/* Explanation Card */}
        <div className="w-full max-w-sm bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-400" />
            Why we need notifications
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <WifiIcon className="h-4 w-4 text-indigo-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Connection alerts</p>
                <p className="text-gray-500 text-xs">Know when you connect to Pulse WiFi</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <BellAlertIcon className="h-4 w-4 text-purple-400" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">Security updates</p>
                <p className="text-gray-500 text-xs">Important account notifications</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">Nearby venues</p>
                <p className="text-gray-500 text-xs">Discover WiFi spots near you</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="w-full max-w-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="w-full max-w-sm space-y-3">
          {permissionStatus === 'denied' ? (
            // Permission was denied - need to go to settings
            <>
              {isIOS ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-white text-sm font-medium mb-2">To enable notifications on iOS:</p>
                  <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
                    <li>Open <span className="text-white">Settings</span> app</li>
                    <li>Scroll down and tap <span className="text-white">Pulse WiFi</span></li>
                    <li>Tap <span className="text-white">Notifications</span></li>
                    <li>Enable <span className="text-white">Allow Notifications</span></li>
                  </ol>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <p className="text-white text-sm font-medium mb-2">To enable notifications:</p>
                  <ol className="text-gray-400 text-sm space-y-1 list-decimal list-inside">
                    <li>Tap the <span className="text-white">ⓘ</span> icon in your browser address bar</li>
                    <li>Find <span className="text-white">Notifications</span></li>
                    <li>Change from &quot;Block&quot; to <span className="text-white">Allow</span></li>
                  </ol>
                </div>
              )}
              
              <button
                onClick={handleReload}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <ArrowPathIcon className="h-5 w-5" />
                I&apos;ve Enabled Them - Reload
              </button>
            </>
          ) : (
            // Permission not yet denied - can request
            <button
              onClick={handleEnablePush}
              disabled={requesting}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-semibold hover:from-indigo-500 hover:to-purple-500 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {requesting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  Enabling...
                </>
              ) : (
                <>
                  <BellAlertIcon className="h-5 w-5" />
                  Enable Notifications
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 pb-[env(safe-area-inset-bottom)] text-center">
        <p className="text-gray-600 text-xs">
          You can disable notifications anytime in Settings
        </p>
      </div>
    </div>
  );
}
