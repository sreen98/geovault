import { CATEGORIES } from "../constants/categories";

export interface Place {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  tags: string[];
  noteMustOrder: string;
  noteAvoid: string;
  noteGeneral: string;
  extraFields: Record<string, string>;
  sourceUrl: string;
  createdAt: string;
  updatedAt: string;
  lastVisitedAt: string | null;
}

export type NewPlace = Omit<Place, "id" | "createdAt" | "updatedAt">;

export type PlaceCategory =
  | "Dining"
  | "Cafe"
  | "Tourist Attraction"
  | "Stay"
  | "Viewpoint"
  | "Shopping"
  | "Fuel/EV"
  | "W.C"
  | "Other";

const VALID_CATEGORIES: ReadonlySet<string> = new Set(CATEGORIES);

function isValidCategory(value: string): value is PlaceCategory {
  return VALID_CATEGORIES.has(value);
}

function safeParseJsonArray(json: string): string[] {
  try {
    const parsed: unknown = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.every((item): item is string => typeof item === "string")) {
      return parsed;
    }
    return [];
  } catch (_parseError: unknown) {
    return [];
  }
}

function safeParseJsonObject(json: string): Record<string, string> {
  try {
    const parsed: unknown = JSON.parse(json);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof value === "string") {
          result[key] = value;
        }
      }
      return result;
    }
    return {};
  } catch (_parseError: unknown) {
    return {};
  }
}

export interface PlaceRow {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  tags: string;
  note_must_order: string;
  note_avoid: string;
  note_general: string;
  extra_fields: string;
  source_url: string;
  created_at: string;
  updated_at: string;
  last_visited_at: string | null;
}

export function rowToPlace(row: PlaceRow): Place {
  return {
    id: row.id,
    name: row.name,
    location: row.location || "",
    latitude: row.latitude,
    longitude: row.longitude,
    category: isValidCategory(row.category) ? row.category : "Other",
    tags: safeParseJsonArray(row.tags || "[]"),
    noteMustOrder: row.note_must_order || "",
    noteAvoid: row.note_avoid || "",
    noteGeneral: row.note_general || "",
    extraFields: safeParseJsonObject(row.extra_fields || "{}"),
    sourceUrl: row.source_url || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastVisitedAt: row.last_visited_at,
  };
}

export function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
