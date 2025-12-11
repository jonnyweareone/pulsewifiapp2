import { useEffect, useState, useCallback } from 'react';

interface PushNotificationState {
  isSupported: boolean;
  isEnabled: boolean;
  playerId: string | null;
  error: string | null;
  permissionStatus: NotificationPermission | null;
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
  });

  const initOneSignal = useCallback(async () => {
    // Check if push is supported
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setState(prev => ({ ...prev, isSupported: false }));
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
      return;
    }

    try {
      // Load OneSignal SDK
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      
      // Check if SDK already loaded
      if (!document.getElementById('onesignal-sdk')) {
        const script = document.createElement('script');
        script.id = 'onesignal-sdk';
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.defer = true;
        document.head.appendChild(script);
      }

      window.OneSignalDeferred.push(async function(OneSignal: any) {
        await OneSignal.init({
          appId: appId,
          safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
          notifyButton: {
            enable: false, // We use our own UI
          },
          allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
          serviceWorkerPath: '/OneSignalSDKWorker.js',
        });

        // Get subscription state
        const isPushSupported = OneSignal.Notifications.isPushSupported();
        const permission = await OneSignal.Notifications.permission;
        const isSubscribed = await OneSignal.User.PushSubscription.optedIn;

        setState(prev => ({
          ...prev,
          isSupported: isPushSupported,
          isEnabled: isSubscribed,
          permissionStatus: permission ? 'granted' : 'default',
        }));

        // Get player ID (now called subscription ID)
        const subscriptionId = OneSignal.User.PushSubscription.id;
        if (subscriptionId) {
          setState(prev => ({ ...prev, playerId: subscriptionId }));
          onPlayerIdChange?.(subscriptionId);
        }

        // Listen for subscription changes
        OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
          const newId = event.current.id;
          const isOptedIn = event.current.optedIn;
          
          setState(prev => ({ 
            ...prev, 
            playerId: newId,
            isEnabled: isOptedIn,
          }));
          
          if (newId) {
            onPlayerIdChange?.(newId);
          }
        });
      });

    } catch (error) {
      console.error('[OneSignal] Init error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to initialize push notifications',
      }));
    }
  }, [onPlayerIdChange]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!window.OneSignal) {
      // Fallback to native permission request
      const permission = await Notification.requestPermission();
      setState(prev => ({ 
        ...prev, 
        isEnabled: permission === 'granted',
        permissionStatus: permission,
      }));
      return permission === 'granted';
    }

    try {
      await window.OneSignal.Notifications.requestPermission();
      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      setState(prev => ({ ...prev, isEnabled: isSubscribed }));
      return isSubscribed;
    } catch (error) {
      console.error('[OneSignal] Permission request error:', error);
      return false;
    }
  }, []);

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
