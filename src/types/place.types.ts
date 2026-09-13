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

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function readFiniteNumber(
  source: Record<string, unknown>,
  key: string
): number | null {
  const value = source[key];
  if (typeof value === "number" && isFinite(value)) return value;
  // Coordinates written by a hand-edited file may arrive as strings.
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (isFinite(parsed)) return parsed;
  }
  return null;
}

function readStringRecord(
  source: Record<string, unknown>,
  key: string
): Record<string, string> {
  const value = source[key];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [entryKey, entryValue] of Object.entries(
    value as Record<string, unknown>
  )) {
    if (typeof entryValue === "string") {
      result[entryKey] = entryValue;
    }
  }
  return result;
}

/**
 * Parses the `places` array of an export file defensively. Entries that could
 * not be stored at all — no id, no name, or unusable coordinates — are skipped
 * so one malformed record cannot abort an otherwise good restore. Everything
 * else falls back to a safe default.
 */
export function parsePlaceExports(value: unknown): Place[] {
  if (!Array.isArray(value)) return [];

  const result: Place[] = [];
  const seenIds = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      continue;
    }
    const source = entry as Record<string, unknown>;

    const id = readString(source, "id").trim();
    const name = readString(source, "name").trim();
    if (!id || !name) continue;
    if (seenIds.has(id)) continue;

    const latitude = readFiniteNumber(source, "latitude");
    const longitude = readFiniteNumber(source, "longitude");
    if (latitude === null || longitude === null) continue;
    if (!isValidCoordinates(latitude, longitude)) continue;

    seenIds.add(id);

    const category = readString(source, "category");
    const createdAt = readString(source, "createdAt");
    const updatedAt = readString(source, "updatedAt");
    const fallbackTimestamp = new Date().toISOString();
    const lastVisitedAt = source["lastVisitedAt"];

    const tags = Array.isArray(source["tags"])
      ? (source["tags"] as unknown[]).filter(
          (tag): tag is string => typeof tag === "string"
        )
      : [];

    result.push({
      id,
      name,
      location: readString(source, "location"),
      latitude,
      longitude,
      category: isValidCategory(category) ? category : "Other",
      tags,
      noteMustOrder: readString(source, "noteMustOrder"),
      noteAvoid: readString(source, "noteAvoid"),
      noteGeneral: readString(source, "noteGeneral"),
      extraFields: readStringRecord(source, "extraFields"),
      sourceUrl: readString(source, "sourceUrl"),
      createdAt: createdAt || fallbackTimestamp,
      updatedAt: updatedAt || createdAt || fallbackTimestamp,
      lastVisitedAt: typeof lastVisitedAt === "string" ? lastVisitedAt : null,
    });
  }

  return result;
}
