import { PlaceCategory } from "../types/place.types";

export const DARK_COLORS = {
  background: "#0F1724",
  surface: "#141D2B",
  surfaceCard: "#1A2535",
  surfaceElevated: "#1E293B",
  surfaceHighlight: "#243044",

  onSurface: "#FFFFFF",
  onSurfaceVariant: "#8B9AB5",
  onSurfaceMuted: "#5A6A85",

  primary: "#2563EB",
  primaryContainer: "#1D4ED8",
  accent: "#34D399",
  accentMuted: "rgba(52, 211, 153, 0.15)",

  danger: "#EF4444",
  dangerMuted: "rgba(239, 68, 68, 0.15)",
  warning: "#F59E0B",
  warningMuted: "rgba(245, 158, 11, 0.15)",
  success: "#10B981",
  successMuted: "rgba(16, 185, 129, 0.15)",

  white: "#FFFFFF",
  black: "#000000",
  border: "rgba(255, 255, 255, 0.08)",
  borderLight: "rgba(255, 255, 255, 0.12)",
  overlay: "rgba(0, 0, 0, 0.5)",

  secondary: "#8B9AB5",
  muted: "#5A6A85",
  surfaceLowest: "#1A2535",
  surfaceContainerLow: "#1E293B",
  surfaceContainer: "#243044",
  surfaceContainerHigh: "#2D3A4F",
  surfaceContainerHighest: "#374357",
  outlineVariant: "rgba(255, 255, 255, 0.12)",
  tertiary: "#3E5C43",
} as const;

export const LIGHT_COLORS: ThemeColors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceCard: "#F1F5F9",
  surfaceElevated: "#E2E8F0",
  surfaceHighlight: "#CBD5E1",

  onSurface: "#0F172A",
  onSurfaceVariant: "#475569",
  onSurfaceMuted: "#94A3B8",

  primary: "#2563EB",
  primaryContainer: "#1D4ED8",
  accent: "#059669",
  accentMuted: "rgba(5, 150, 105, 0.12)",

  danger: "#DC2626",
  dangerMuted: "rgba(220, 38, 38, 0.1)",
  warning: "#D97706",
  warningMuted: "rgba(217, 119, 6, 0.1)",
  success: "#059669",
  successMuted: "rgba(5, 150, 105, 0.1)",

  white: "#FFFFFF",
  black: "#000000",
  border: "rgba(0, 0, 0, 0.08)",
  borderLight: "rgba(0, 0, 0, 0.12)",
  overlay: "rgba(0, 0, 0, 0.3)",

  secondary: "#475569",
  muted: "#94A3B8",
  surfaceLowest: "#F1F5F9",
  surfaceContainerLow: "#E2E8F0",
  surfaceContainer: "#CBD5E1",
  surfaceContainerHigh: "#94A3B8",
  surfaceContainerHighest: "#64748B",
  outlineVariant: "rgba(0, 0, 0, 0.12)",
  tertiary: "#166534",
};

export type ThemeColors = { [K in keyof typeof DARK_COLORS]: string };

// Default alias — used by files not yet converted to useTheme()
export const COLORS = DARK_COLORS;

export const CATEGORY_COLORS: Record<PlaceCategory, string> = {
  Dining: "#3B82F6",
  Cafe: "#F59E0B",
  "Tourist Attraction": "#10B981",
  Stay: "#8B5CF6",
  Viewpoint: "#06B6D4",
  Shopping: "#EC4899",
  "Fuel/EV": "#EF4444",
  "W.C": "#14B8A6",
  Other: "#6B7280",
};

export const TYPOGRAPHY = {
  header: "Manrope",            // For editorial headlines
  body: "Inter",                // For data and navigation
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const ROUNDNESS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const APP_VERSION = "1.0.0";
