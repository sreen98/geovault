import { Linking, Platform } from "react-native";

interface MapLaunchOptions {
  latitude: number;
  longitude: number;
}

export async function openMapsApp(options?: MapLaunchOptions): Promise<void> {
  const hasCoords =
    options !== undefined &&
    !isNaN(options.latitude) &&
    !isNaN(options.longitude);

  if (Platform.OS === "ios") {
    const url = hasCoords
      ? `maps://?ll=${options.latitude},${options.longitude}&z=15`
      : "maps://";
    await Linking.openURL(url);
    return;
  }

  // Android: geo: intent with query parameter keeps Google Maps open
  // and interactive (user can search/browse from this location)
  const url = hasCoords
    ? `geo:${options.latitude},${options.longitude}?q=${options.latitude},${options.longitude}&z=15`
    : "geo:0,0";

  await Linking.openURL(url);
}
