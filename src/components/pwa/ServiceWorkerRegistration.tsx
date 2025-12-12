'use client';

// OneSignal handles its own service worker registration
// This component is no longer needed but kept as a placeholder
// in case we need to add non-push service worker features in the future

export function ServiceWorkerRegistration() {
  // OneSignal SDK automatically registers OneSignalSDKWorker.js
  // Do NOT manually register it here as it can cause conflicts
  return null;
}
