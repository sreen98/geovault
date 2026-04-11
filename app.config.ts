const config = {
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
    backgroundColor: "#000000",
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
    versionCode: 5,
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
  extra: {
    eas: {
      projectId: "e9172980-e761-4661-9e6d-0f59386e4738",
    },
  },
  plugins: [
    "expo-router",
    "expo-sqlite",
    "expo-location",
    "expo-font",
    "expo-splash-screen",
    [
      "@react-native-google-signin/google-signin",
      {
        iosUrlScheme:
          "com.googleusercontent.apps.40136881833-t04bd5amku0eh85s209hhdjke4bhfc3l",
      },
    ],
  ],
};

export default config;
