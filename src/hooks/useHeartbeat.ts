import { useEffect, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';

interface HeartbeatConfig {
  userId: string | null;
  intervalMs?: number; // default 1 hour
}

// Generate or retrieve a persistent device ID
const getDeviceId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let deviceId = localStorage.getItem('pulse_device_id');
  if (!deviceId) {
    deviceId = `${Capacitor.getPlatform()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('pulse_device_id', deviceId);
  }
  return deviceId;
};

// Get app/OS version info
const getDeviceInfo = () => {
  const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
  
  return {
    platform,
    app_version: '1.0.0', // TODO: Get from Capacitor App plugin
    os_version: navigator.userAgent || 'unknown',
  };
};

export function useHeartbeat({ userId, intervalMs = 3600000 }: HeartbeatConfig) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const playerIdRef = useRef<string | null>(null);

  const sendHeartbeat = useCallback(async () => {
    if (!userId) return;

    const deviceId = getDeviceId();
    const deviceInfo = getDeviceInfo();

    try {
      const response = await fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          device_id: deviceId,
          onesignal_player_id: playerIdRef.current,
          push_enabled: !!playerIdRef.current,
          ...deviceInfo,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('[Heartbeat] Sent successfully');
      }
    } catch (error) {
      console.error('[Heartbeat] Failed:', error);
    }
  }, [userId]);

  // Set OneSignal player ID when available
  const setPlayerId = useCallback((playerId: string) => {
    playerIdRef.current = playerId;
    // Send heartbeat immediately to update player ID
    sendHeartbeat();
  }, [sendHeartbeat]);

  useEffect(() => {
    if (!userId) return;

    // Send initial heartbeat
    sendHeartbeat();

    // Set up interval
    intervalRef.current = setInterval(sendHeartbeat, intervalMs);

    // Send heartbeat when app comes to foreground (Capacitor)
    const handleAppStateChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };
    
    document.addEventListener('visibilitychange', handleAppStateChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleAppStateChange);
    };
  }, [userId, intervalMs, sendHeartbeat]);

  return { sendHeartbeat, setPlayerId, deviceId: getDeviceId() };
}
