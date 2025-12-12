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

    // Check if push is supported
    if (typeof window === 'undefined') {
      setState(prev => ({ ...prev, isSupported: false, isInitializing: false }));
      return;
    }

    if (!('Notification' in window)) {
      console.log('[OneSignal] Notifications not supported in this browser');
      setState(prev => ({ 
        ...prev, 
        isSupported: false, 
        isInitializing: false,
        error: 'Notifications not supported in this browser',
      }));
      return;
    }

    if (!('serviceWorker' in navigator)) {
      console.log('[OneSignal] Service workers not supported');
      setState(prev => ({ 
        ...prev, 
        isSupported: false, 
        isInitializing: false,
        error: 'Service workers not supported',
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isSupported: true,
      permissionStatus: Notification.permission,
    }));

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    if (!appId) {
      console.warn('[OneSignal] No app ID configured');
      setState(prev => ({ 
        ...prev, 
        isInitializing: false,
        error: 'Push notifications not configured',
      }));
      return;
    }

    try {
      console.log('[OneSignal] Starting initialization...');
      
      // Load OneSignal SDK
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      
      // Check if SDK already loaded
      if (!document.getElementById('onesignal-sdk')) {
        const script = document.createElement('script');
        script.id = 'onesignal-sdk';
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.defer = true;
        
        // Add load/error handlers
        script.onload = () => console.log('[OneSignal] SDK script loaded');
        script.onerror = (e) => {
          console.error('[OneSignal] SDK script failed to load:', e);
          setState(prev => ({ 
            ...prev, 
            isInitializing: false,
            error: 'Failed to load notification service',
          }));
        };
        
        document.head.appendChild(script);
      }

      // Set a timeout for initialization
      const initTimeout = setTimeout(() => {
        console.warn('[OneSignal] Initialization timeout');
        setState(prev => {
          if (prev.isInitializing) {
            return { 
              ...prev, 
              isInitializing: false,
              isReady: true, // Mark as ready anyway so UI can proceed
              error: null, // Don't show error, just proceed
            };
          }
          return prev;
        });
      }, 10000); // 10 second timeout

      window.OneSignalDeferred.push(async function(OneSignal: any) {
        try {
          console.log('[OneSignal] Initializing with appId:', appId);
          
          await OneSignal.init({
            appId: appId,
            notifyButton: {
              enable: false,
            },
            allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
            serviceWorkerPath: '/OneSignalSDKWorker.js',
            serviceWorkerParam: { scope: '/' },
          });

          clearTimeout(initTimeout);
          console.log('[OneSignal] Initialized successfully');

          // Get subscription state
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
            permissionStatus: permission ? 'granted' : 'default',
            isInitializing: false,
            isReady: true,
          }));

          // Get player ID
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
            }));
            
            if (newId) {
              onPlayerIdChange?.(newId);
            }
          });

        } catch (initError) {
          clearTimeout(initTimeout);
          console.error('[OneSignal] Init error:', initError);
          setState(prev => ({ 
            ...prev, 
            isInitializing: false,
            isReady: true,
            error: 'Failed to initialize notifications',
          }));
        }
      });

    } catch (error) {
      console.error('[OneSignal] Setup error:', error);
      setState(prev => ({ 
        ...prev, 
        isInitializing: false,
        isReady: true,
        error: 'Failed to setup notifications',
      }));
    }
  }, [onPlayerIdChange]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    console.log('[OneSignal] Requesting permission...');
    
    // Check if OneSignal is ready
    if (!window.OneSignal) {
      console.log('[OneSignal] SDK not ready, using native API');
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

    try {
      console.log('[OneSignal] Using OneSignal API for permission');
      await window.OneSignal.Notifications.requestPermission();
      
      // Wait a moment for subscription to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      const subscriptionId = window.OneSignal.User.PushSubscription.id;
      
      console.log('[OneSignal] After permission - Subscribed:', isSubscribed, 'ID:', subscriptionId);
      
      setState(prev => ({ 
        ...prev, 
        isEnabled: isSubscribed,
        playerId: subscriptionId || prev.playerId,
        permissionStatus: 'granted',
      }));
      
      if (subscriptionId) {
        onPlayerIdChange?.(subscriptionId);
      }
      
      return isSubscribed;
    } catch (error) {
      console.error('[OneSignal] Permission request error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to enable notifications',
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

  useEffect(() => {
    initOneSignal();
  }, [initOneSignal]);

  return {
    ...state,
    requestPermission,
    optOut,
  };
}
