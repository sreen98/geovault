import { Ionicons } from "@expo/vector-icons";

export type CollectionIcon = keyof typeof Ionicons.glyphMap;

/** Icons offered in the collection form. First entry is the default. */
export const COLLECTION_ICONS: readonly CollectionIcon[] = [
  "albums-outline",
  "airplane-outline",
  "map-outline",
  "car-outline",
  "restaurant-outline",
  "cafe-outline",
  "bed-outline",
  "camera-outline",
  "heart-outline",
  "star-outline",
  "briefcase-outline",
  "people-outline",
  "sunny-outline",
  "leaf-outline",
] as const;

export const DEFAULT_COLLECTION_ICON: CollectionIcon = "albums-outline";

/** Accent colours offered in the collection form. First entry is the default. */
export const COLLECTION_COLORS: readonly string[] = [
  "#34D399",
  "#3B82F6",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#EF4444",
  "#14B8A6",
  "#A3A3A3",
] as const;

export const DEFAULT_COLLECTION_COLOR: string = COLLECTION_COLORS[0];

/**
 * Input limits. Enforced by the form (maxLength) and again on import, where
 * over-long values are truncated rather than rejected so a hand-edited or
 * third-party file never fails the whole restore.
 */
export const COLLECTION_NAME_MAX = 60;
export const COLLECTION_DESCRIPTION_MAX = 300;

const ICON_SET: ReadonlySet<string> = new Set(COLLECTION_ICONS);
const COLOR_SET: ReadonlySet<string> = new Set(COLLECTION_COLORS);

export function isValidCollectionIcon(value: string): value is CollectionIcon {
  return ICON_SET.has(value);
}

export function isValidCollectionColor(value: string): boolean {
  return COLOR_SET.has(value);
}
