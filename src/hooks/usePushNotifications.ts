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
      setState(prev => ({ ...prev, isSupported: false, isInitializing: false }));
      return;
    }

    // Check notification support
    if (!('Notification' in window)) {
      console.log('[OneSignal] Notifications not supported in this browser');
      setState(prev => ({ 
        ...prev, 
        isSupported: false, 
        isInitializing: false,
        isReady: true,
        error: 'Notifications not supported in this browser',
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isSupported: true,
      permissionStatus: Notification.permission,
    }));

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || ONESIGNAL_APP_ID;
    
    try {
      console.log('[OneSignal] Starting initialization with appId:', appId);
      
      // Initialize the deferred array
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      
      // Load SDK script if not already loaded
      if (!document.getElementById('onesignal-sdk')) {
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

      // Push init function to deferred array
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        try {
          console.log('[OneSignal] Initializing...');
          
          await OneSignal.init({
            appId: appId,
            safari_web_id: SAFARI_WEB_ID,
            notifyButton: {
              enable: false, // We use our own UI
            },
            allowLocalhostAsSecureOrigin: process.env.NODE_ENV === 'development',
            serviceWorkerPath: '/OneSignalSDKWorker.js',
            serviceWorkerParam: { scope: '/' },
            promptOptions: {
              slidedown: {
                prompts: [
                  {
                    type: "push",
                    autoPrompt: false,
                    text: {
                      actionMessage: "Get instant account verification and Wi-Fi setup notifications",
                      acceptButton: "Allow",
                      cancelButton: "Later",
                    }
                  }
                ]
              }
            }
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Get updated subscription state
      const isSubscribed = await window.OneSignal.User.PushSubscription.optedIn;
      const subscriptionId = window.OneSignal.User.PushSubscription.id;
      
      console.log('[OneSignal] After permission - Subscribed:', isSubscribed, 'ID:', subscriptionId);
      
      setState(prev => ({ 
        ...prev, 
        isEnabled: isSubscribed,
        playerId: subscriptionId || prev.playerId,
        permissionStatus: isSubscribed ? 'granted' : Notification.permission,
      }));
      
      if (subscriptionId) {
        onPlayerIdChange?.(subscriptionId);
      }
      
      return isSubscribed;
    } catch (error) {
      console.error('[OneSignal] Permission request error:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to enable notifications. Please check your browser settings.',
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
