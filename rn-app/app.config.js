import "dotenv/config";

export default ({ config }) => ({
  ...config,
  name: "nextRep",
  slug: "fittracker-native",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/nextrepplogo.jpg",
  scheme: "fittracker",
  userInterfaceStyle: "dark",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.example.fittrackernative",
  },
  android: {
    package: "com.example.fittrackernative",
    adaptiveIcon: {
      foregroundImage: "./assets/nextrepplogo.jpg",
      backgroundColor: "#000000",
    },
    permissions: ["CAMERA"],
  },
  web: {
    bundler: "metro",
  },
  plugins: [
    [
      "expo-camera",
      {
        cameraPermission: "Consenti l'accesso alla fotocamera",
      },
    ],
  ],
  extra: {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    CLARIFAI_API_KEY: process.env.CLARIFAI_API_KEY,
    OPENFOODREPO_API_KEY: process.env.OPENFOODREPO_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    eas: {
      projectId: "cbfd46b4-1b49-4baa-8733-6a6f01b2e96d",
    },
  },
  runtimeVersion: {
    policy: "sdkVersion",
  },
});
