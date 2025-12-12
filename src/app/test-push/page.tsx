'use client';

import { useState, useEffect } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

declare global {
  interface Window {
    OneSignalDeferred?: any[];
    OneSignal?: any;
  }
}

export default function TestPushPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [permission, setPermission] = useState<string>('unknown');
  const [isLoading, setIsLoading] = useState(false);

  const log = (message: string) => {
    console.log('[TestPush]', message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    log('Page loaded');
    log(`User Agent: ${navigator.userAgent.slice(0, 80)}...`);
    log(`Notification in window: ${'Notification' in window}`);
    log(`ServiceWorker in navigator: ${'serviceWorker' in navigator}`);
    
    if ('Notification' in window) {
      log(`Current permission: ${Notification.permission}`);
      setPermission(Notification.permission);
    }

    // Check if standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    log(`Is Standalone PWA: ${isStandalone}`);

    // Check iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    log(`Is iOS: ${isIOS}`);
  }, []);

  const initOneSignal = async () => {
    setIsLoading(true);
    log('Starting OneSignal initialization...');

    try {
      // Initialize deferred array
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      
      // Load SDK
      if (!document.getElementById('onesignal-sdk-test')) {
        log('Loading OneSignal SDK script...');
        const script = document.createElement('script');
        script.id = 'onesignal-sdk-test';
        script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
        script.defer = true;
        
        script.onload = () => log('SDK script loaded');
        script.onerror = (e) => log(`SDK script error: ${e}`);
        
        document.head.appendChild(script);
      } else {
        log('SDK script already exists');
      }

      // Push init
      window.OneSignalDeferred.push(async function(OneSignal: any) {
        try {
          log('Inside OneSignalDeferred callback...');
          
          if (OneSignal.initialized) {
            log('OneSignal already initialized');
          } else {
            log('Calling OneSignal.init()...');
            await OneSignal.init({
              appId: '728b062b-7ac8-41fd-97b1-1fa92909d22c',
              safari_web_id: 'web.onesignal.auto.468a09a1-a4c0-43e5-8472-22975b523798',
              allowLocalhostAsSecureOrigin: true,
              notifyButton: { enable: false },
            });
            log('OneSignal.init() completed');
          }

          // Check status
          const isPushSupported = OneSignal.Notifications.isPushSupported();
          log(`Push supported: ${isPushSupported}`);
          
          const perm = await OneSignal.Notifications.permission;
          log(`OneSignal permission: ${perm}`);
          setPermission(perm ? 'granted' : Notification.permission);
          
          const optedIn = await OneSignal.User.PushSubscription.optedIn;
          log(`Opted in: ${optedIn}`);
          
          const subId = OneSignal.User.PushSubscription.id;
          log(`Subscription ID: ${subId}`);
          setPlayerId(subId);

          // Listen for changes
          OneSignal.User.PushSubscription.addEventListener('change', (event: any) => {
            log(`Subscription changed: ${JSON.stringify(event.current)}`);
            if (event.current?.id) {
              setPlayerId(event.current.id);
            }
          });

        } catch (err: any) {
          log(`Init error: ${err.message}`);
        }
      });

    } catch (err: any) {
      log(`Setup error: ${err.message}`);
    }
    
    setIsLoading(false);
  };

  const requestPermission = async () => {
    setIsLoading(true);
    log('Requesting permission...');

    try {
      if (!window.OneSignal) {
        log('OneSignal not ready, using native API');
        const result = await Notification.requestPermission();
        log(`Native permission result: ${result}`);
        setPermission(result);
      } else {
        log('Using OneSignal.Notifications.requestPermission()');
        await window.OneSignal.Notifications.requestPermission();
        
        // Wait a bit for subscription
        await new Promise(r => setTimeout(r, 2000));
        
        const optedIn = await window.OneSignal.User.PushSubscription.optedIn;
        log(`After request - opted in: ${optedIn}`);
        
        const subId = window.OneSignal.User.PushSubscription.id;
        log(`After request - subscription ID: ${subId}`);
        setPlayerId(subId);
        
        if (optedIn) {
          setPermission('granted');
        }
      }
    } catch (err: any) {
      log(`Permission error: ${err.message}`);
    }
    
    setIsLoading(false);
  };

  const sendTestNotification = async () => {
    if (!playerId) {
      log('No player ID - cannot send notification');
      return;
    }

    setIsLoading(true);
    log(`Sending test notification to ${playerId}...`);

    try {
      const response = await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_ids: [playerId],
          title: 'Test Notification',
          message: 'This is a test from the debug page!',
        }),
      });

      const result = await response.json();
      log(`API response: ${JSON.stringify(result)}`);
    } catch (err: any) {
      log(`Send error: ${err.message}`);
    }

    setIsLoading(false);
  };

  const checkServiceWorker = async () => {
    log('Checking service workers...');
    
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      log(`Found ${registrations.length} service workers`);
      
      registrations.forEach((reg, i) => {
        log(`SW ${i}: scope=${reg.scope}, active=${!!reg.active}`);
      });
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-900 text-white">
      <div className="max-w-2xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold mb-6">Push Notification Debug</h1>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Permission:</strong> {permission}</p>
            <p><strong>Player ID:</strong> {playerId || 'None'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={initOneSignal} disabled={isLoading} className="w-full">
              1. Initialize OneSignal
            </Button>
            <Button onClick={requestPermission} disabled={isLoading} className="w-full">
              2. Request Permission
            </Button>
            <Button onClick={sendTestNotification} disabled={isLoading || !playerId} className="w-full">
              3. Send Test Notification
            </Button>
            <Button onClick={checkServiceWorker} disabled={isLoading} variant="secondary" className="w-full">
              Check Service Workers
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black/50 rounded p-3 max-h-96 overflow-y-auto font-mono text-xs">
              {logs.length === 0 ? (
                <p className="text-gray-500">No logs yet</p>
              ) : (
                logs.map((log, i) => (
                  <p key={i} className="text-green-400">{log}</p>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
