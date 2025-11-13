require("dotenv").config({ path: ".env.local" });

module.exports = {
  expo: {
    name: "Bolt v0.1",
    slug: "bolt-mobile",
    version: "0.1.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    splash: {
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.benki.bolt",
      infoPlist: {
        NSMicrophoneUsageDescription:
          "This app uses the microphone to record and transcribe your voice.",
      },
    },
    android: {
      package: "com.benki.bolt",
      permissions: ["android.permission.RECORD_AUDIO"],
    },
    web: {},
    extra: {
      openaiApiKey: process.env.OPENAI_API_KEY,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    },
  },
};
