import { useEffect, useState, useCallback, useRef } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  isEnabled: boolean;
  playerId: string | null;
  error: string | null;
  permissionStatus: NotificationPermission | null;
  isInitializing: boolean;
  isReady: boolean;
}

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

const ONESIGNAL_APP_ID = '728b062b-7ac8-41fd-97b1-1fa92909d22c';
const SAFARI_WEB_ID = 'web.onesignal.auto.468a09a1-a4c0-43e5-8472-22975b523798';

// Helper to detect iOS
const isIOSDevice = () => {
  if (typeof window === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Helper to detect if running as standalone PWA
const isStandalonePWA = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
};

export function usePushNotifications(onPlayerIdChange?: (playerId: string) => void) {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isEnabled: false,
    playerId: null,
    error: null,
    permissionStatus: null,
    isInitializing: true,
    isReady: false,
  });
  
  const initAttempted = useRef(false);

  const initOneSignal = useCallback(async () => {
    // Prevent double initialization
    if (initAttempted.current) return;
    initAttempted.current = true;

    // Check if we're in browser
    if (typeof window === 'undefined') {
      setState(prev => ({ ...prev, isSupported: false, isInitializing: false, isReady: true }));
      return;
    }

    const isIOS = isIOSDevice();
    const isStandalone = isStandalonePWA();
    
    console.log('[OneSignal] Device check - iOS:', isIOS, 'Standalone:', isStandalone);

    // Check notification support
    if (!('Notification' in window)) {
      console.log('[OneSignal] Notifications API not supported');
      setState(prev => ({ 
        ...prev, 
        isSupported: false, 
        isInitializing: false,
        isReady: true,
        error: 'Notifications not supported in this browser',
      }));
      return;
    }

    // On iOS, push only works in standalone PWA mode
    if (isIOS && !isStandalone) {
      console.log('[OneSignal] iOS detected but not in standalone mode - push won\'t work');
      setState(prev => ({ 
        ...prev, 
        isSupported: false, 
        isInitializing: false,
        isReady: true,
        error: 'On iPhone/iPad, you must install the app to your home screen first to enable notifications.',
      }));
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('[OneSignal] Service workers not supported');
      setState(prev => ({ 
        ...prev, 
        isSupported: false, 
        isInitializing: false,
        isReady: true,
        error: 'Service workers not supported',
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isSupported: true,
      permissionStatus: Notification.permission,
    }));

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ONESIGNAL_APP_ID;
    const safariWebId = process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID || SAFARI_WEB_ID;
    
    try {
      console.log('[OneSignal] Starting initialization...');
      console.log('[OneSignal] App ID:', appId);
      
      // Initialize the deferred array - this is the OneSignal recommended pattern
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      
      // Check if SDK script already exists
      const existingScript = document.getElementById('onesignal-sdk');
      
      // Load SDK script if not already loaded
      if (!existingScript && !window.OneSignal) {
        console.log('[OneSignal] Loading SDK script...');
        const script = document.createElement('script');
        script.id = 'onesignal-sdk';
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.defer = true;
        
        script.onload = () => console.log('[OneSignal] SDK script loaded successfully');
        script.onerror = (e) => {
          console.error('[OneSignal] SDK script failed to load:', e);
          setState(prev => ({ 
            ...prev, 
            isInitializing: false,
            isReady: true,
            error: 'Failed to load notification service',
          }));
        };
        
        document.head.appendChild(script);
      } else {
        console.log('[OneSignal] SDK already loaded or script exists');
      }

      // Set initialization timeout
      const initTimeout = setTimeout(() => {
        console.warn('[OneSignal] Initialization timeout after 15s');
        setState(prev => {
          if (prev.isInitializing) {
            return { 
              ...prev, 
              isInitializing: false,
              isReady: true,
            };
          }
          return prev;
        });
      }, 15000);

      // Push init function to deferred array - OneSignal will call this when ready
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        try {
          console.log('[OneSignal] Running init...');
          
          // Check if already initialized
          if (OneSignal.initialized) {
            console.log('[OneSignal] Already initialized, getting state...');
            clearTimeout(initTimeout);
            
            const isPushSupported = OneSignal.Notifications.isPushSupported();
            const permission = await OneSignal.Notifications.permission;
            const isSubscribed = await OneSignal.User.PushSubscription.optedIn;
            const subscriptionId = OneSignal.User.PushSubscription.id;
            
            setState(prev => ({
              ...prev,
              isSupported: isPushSupported,
              isEnabled: isSubscribed,
              playerId: subscriptionId || null,
              permissionStatus: permission ? 'granted' : Notification.permission,
              isInitializing: false,
              isReady: true,
            }));
            
            if (subscriptionId) {
              onPlayerIdChange?.(subscriptionId);
            }
            return;
          }
          
          // Initialize OneSignal with minimal configuration
          // The service worker file OneSignalSDKWorker.js must be at site root
          await OneSignal.init({
            appId: appId,
            safari_web_id: safariWebId,
            notifyButton: {
              enable: false, // We use our own UI
            },
            allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
          });

          clearTimeout(initTimeout);
          console.log('[OneSignal] Initialized successfully');

          // Check push support and subscription state
          const isPushSupported = OneSignal.Notifications.isPushSupported();
          console.log('[OneSignal] Push supported:', isPushSupported);
          
          let permission = false;
          let isSubscribed = false;
          
          try {
            permission = await OneSignal.Notifications.permission;
            isSubscribed = await OneSignal.User.PushSubscription.optedIn;
            console.log('[OneSignal] Permission:', permission, 'Subscribed:', isSubscribed);
          } catch (e) {
            console.log('[OneSignal] Error getting permission state:', e);
          }

          setState(prev => ({
            ...prev,
            isSupported: isPushSupported,
            isEnabled: isSubscribed,
            permissionStatus: permission ? 'granted' : Notification.permission,
            isInitializing: false,
            isReady: true,
          }));

          // Get subscription ID (player ID)
          try {
            const subscriptionId = OneSignal.User.PushSubscription.id;
            console.log('[OneSignal] Subscription ID:', subscriptionId);
            if (subscriptionId) {
              setState(prev => ({ ...prev, playerId: subscriptionId }));
              onPlayerIdChange?.(subscriptionId);
            }
          } catch (e) {
            console.log('[OneSignal] Error getting subscription ID:', e);
          }

          // Listen for subscription changes
          OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
            console.log('[OneSignal] Subscription changed:', event);
            const newId = event.current?.id;
            const isOptedIn = event.current?.optedIn;
            
            setState(prev => ({ 
              ...prev, 
              playerId: newId || prev.playerId,
              isEnabled: isOptedIn ?? prev.isEnabled,
              permissionStatus: isOptedIn ? 'granted' : prev.permissionStatus,
            }));
            
            if (newId) {
              onPlayerIdChange?.(newId);
            }
          });

        } catch (initError: any) {
          clearTimeout(initTimeout);
          console.error('[OneSignal] Init error:', initError);
          setState(prev => ({ 
            ...prev, 
            isInitializing: false,
            isReady: true,
            error: initError?.message || 'Failed to initialize notifications',
          }));
        }
      });

    } catch (error: any) {
      console.error('[OneSignal] Setup error:', error);
      setState(prev => ({ 
        ...prev, 
        isInitializing: false,
        isReady: true,
        error: error?.message || 'Failed to setup notifications',
      }));
    }
  }, [onPlayerIdChange]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log('[OneSignal] Requesting permission...');
    
    // On iOS not in standalone mode, can't request
    if (isIOSDevice() && !isStandalonePWA()) {
      console.log('[OneSignal] iOS not in standalone mode, cannot request permission');
      setState(prev => ({ 
        ...prev, 
        error: 'Please install the app to your home screen first, then open it from there.',
      }));
      return false;
    }
    
    // Wait for OneSignal to be ready
    if (!window.OneSignal) {
      console.log('[OneSignal] SDK not ready, waiting...');
      
      // Wait up to 5 seconds for OneSignal
      let waitTime = 0;
      while (!window.OneSignal && waitTime < 5000) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitTime += 100;
      }
      
      if (!window.OneSignal) {
        console.log('[OneSignal] SDK still not ready, using native API');
        try {
          const permission = await Notification.requestPermission();
          console.log('[OneSignal] Native permission result:', permission);
          setState(prev => ({ 
            ...prev, 
            isEnabled: permission === 'granted',
            permissionStatus: permission,
          }));
          return permission === 'granted';
        } catch (e) {
          console.error('[OneSignal] Native permission error:', e);
          return false;
        }
      }
    }

    try {
      console.log('[OneSignal] Using OneSignal API for permission request');
      
      // Request permission through OneSignal
      await window.OneSignal.Notifications.requestPermission();
      
      // Wait for subscription to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get updated subscription state
      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      const subscriptionId = window.OneSignal.User.PushSubscription.id;
      
      console.log('[OneSignal] After permission - Subscribed:', isSubscribed, 'ID:', subscriptionId);
      
      setState(prev => ({ 
        ...prev, 
        isEnabled: isSubscribed,
        playerId: subscriptionId || prev.playerId,
        permissionStatus: isSubscribed ? 'granted' : Notification.permission,
        error: null,
      }));
      
      if (subscriptionId) {
        onPlayerIdChange?.(subscriptionId);
      }
      
      return isSubscribed;
    } catch (error: any) {
      console.error('[OneSignal] Permission request error:', error);
      setState(prev => ({ 
        ...prev, 
        error: error?.message || 'Failed to enable notifications. Please check your browser settings.',
      }));
      return false;
    }
  }, [onPlayerIdChange]);

  const optOut = useCallback(async () => {
    if (!window.OneSignal) return;
    
    try {
      await window.OneSignal.User.PushSubscription.optOut();
      setState(prev => ({ ...prev, isEnabled: false }));
    } catch (error) {
      console.error('[OneSignal] Opt out error:', error);
    }
  }, []);

  // Link Supabase user ID to OneSignal for targeting by external_user_id
  const linkUserId = useCallback(async (userId: string): Promise<boolean> => {
    if (!window.OneSignal) {
      console.warn('[OneSignal] SDK not ready for linking user ID');
      return false;
    }
    
    try {
      await window.OneSignal.login(userId);
      console.log('[OneSignal] User ID linked:', userId);
      return true;
    } catch (error) {
      console.error('[OneSignal] Failed to link user ID:', error);
      return false;
    }
  }, []);

  // Unlink user ID (on logout)
  const unlinkUserId = useCallback(async (): Promise<boolean> => {
    if (!window.OneSignal) return false;
    
    try {
      await window.OneSignal.logout();
      console.log('[OneSignal] User ID unlinked');
      return true;
    } catch (error) {
      console.error('[OneSignal] Failed to unlink user ID:', error);
      return false;
    }
  }, []);

  // Set tags for segmentation
  const setTags = useCallback(async (tags: Record<string, string>): Promise<boolean> => {
    if (!window.OneSignal) return false;
    
    try {
      await window.OneSignal.User.addTags(tags);
      console.log('[OneSignal] Tags set:', tags);
      return true;
    } catch (error) {
      console.error('[OneSignal] Failed to set tags:', error);
      return false;
    }
  }, []);

  useEffect(() => {
    initOneSignal();
  }, [initOneSignal]);

  return {
    ...state,
    requestPermission,
    optOut,
    linkUserId,
    unlinkUserId,
    setTags,
    // Expose helpers
    isIOS: isIOSDevice(),
    isStandalone: isStandalonePWA(),
  };
}
