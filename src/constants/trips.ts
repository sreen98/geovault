import { Ionicons } from "@expo/vector-icons";

type IoniconsName = keyof typeof Ionicons.glyphMap;

// Preset palette for trip identity — pulled from the category color set so
// trips feel visually consistent with the rest of the app.
export const TRIP_COLORS: string[] = [
  "#34D399", // green
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#EF4444", // red
  "#14B8A6", // teal
];

export const DEFAULT_TRIP_COLOR = TRIP_COLORS[0];

// Ionicons only — no emojis (per project conventions).
export const TRIP_ICONS: IoniconsName[] = [
  "airplane",
  "car",
  "boat",
  "train",
  "bicycle",
  "walk",
  "bag",
  "map",
  "compass",
  "restaurant",
  "bed",
  "camera",
];

export const DEFAULT_TRIP_ICON: IoniconsName = "map";
