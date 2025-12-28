/**
 * Capacitor Configuration
 *
 * Mobile app wrapper configuration for iOS and Android.
 *
 * @module capacitor.config
 */

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.safeos.guardian',
  appName: 'SafeOS Guardian',
  webDir: 'apps/guardian-ui/out', // Next.js static export output
  bundledWebRuntime: false,

  // Server configuration (for development)
  server: {
    // Use this for development to connect to local dev server
    // url: 'http://localhost:3000',
    // cleartext: true, // Allow HTTP for local development
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },

  // Plugins configuration
  plugins: {
    // Push Notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // Local Notifications
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#10b981',
      sound: 'beep.wav',
    },

    // Camera
    Camera: {
      quality: 80,
      allowEditing: false,
      resultType: 'dataUrl', // or 'base64' / 'uri'
    },

    // Splash Screen
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: true,
      spinnerColor: '#10b981',
      iosSpinnerStyle: 'large',
    },

    // Keyboard
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },

    // Status Bar
    StatusBar: {
      style: 'Dark', // 'Dark' or 'Light'
      backgroundColor: '#0f172a',
    },

    // Haptics
    Haptics: {},

    // App
    App: {
      // App-level settings
    },

    // Network
    Network: {},

    // Device
    Device: {},
  },

  // iOS-specific configuration
  ios: {
    contentInset: 'automatic',
    scrollEnabled: true,
    scheme: 'SafeOS Guardian',
    preferredContentMode: 'mobile',
  },

  // Android-specific configuration
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false, // Set to true for debugging
  },

  // Cordova preferences (if using Cordova plugins)
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      'android-minSdkVersion': '22',
      BackupWebStorage: 'none',
    },
  },
};

export default config;







