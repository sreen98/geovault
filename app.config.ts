import { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "GeoVault",
  slug: "geovault",
  version: "1.0.0",
  scheme: "geovault",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,
  splash: {
    image: "./assets/splash-icon.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  ios: {
    bundleIdentifier: "com.geovault.app",
    supportsTablet: false,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "GeoVault uses your location to save your current position.",
      UIBackgroundModes: ["fetch"],
    },
  },
  android: {
    package: "com.geovault.app",
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    edgeToEdgeEnabled: true,
    permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-sqlite",
    "expo-location",
    "expo-font",
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme: "com.googleusercontent.apps.40136881833-t04bd5amku0eh85s209hhdjke4bhfc3l",
      },
    ],
  ],
});
