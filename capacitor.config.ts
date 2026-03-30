import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.astrosattwa.app',
  appName: 'Astrosattwa',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: "#0f0f23",
      androidSplashResourceName: "splash",
      showSpinner: false,
    }
  }
};

export default config;
