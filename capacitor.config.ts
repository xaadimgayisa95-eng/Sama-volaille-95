import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.samavolaille95.app',
  appName: 'Sama Volaille 95',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1E5C20',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    }
  },
  android: {
    allowMixedContent: true,
    captureInput: true
  }
};

export default config;
