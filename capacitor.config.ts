import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uk.co.pulsewifi.app',
  appName: 'Pulse WiFi',
  webDir: 'out',
  server: {
    // Production URL - the web app
    url: 'https://app.pulsewifi.co.uk',
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0a0a0f',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
  ios: {
    contentInset: 'automatic',
    scheme: 'pulsewifi',
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
