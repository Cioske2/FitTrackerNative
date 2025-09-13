import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  name: 'FitTrackerNative',
  slug: 'fittracker-native',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'fittracker',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#000'
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.example.fittrackernative'
  },
  android: {
    package: 'com.example.fittrackernative',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#000000'
    },
    permissions: ["CAMERA"],
  },
  web: {
    bundler: 'metro'
  },
  plugins: [
    ["expo-camera", {
      cameraPermission: "Consenti l'accesso alla fotocamera" 
    }]
  ],
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    CLARIFAI_API_KEY: process.env.CLARIFAI_API_KEY,
    OPENFOOD_API_KEY: process.env.OPENFOOD_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY
  },
  runtimeVersion: {
    policy: 'sdkVersion'
  }
});
