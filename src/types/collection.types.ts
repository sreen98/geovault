import {
  CollectionIcon,
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_NAME_MAX,
  DEFAULT_COLLECTION_COLOR,
  DEFAULT_COLLECTION_ICON,
  isValidCollectionColor,
  isValidCollectionIcon,
} from "../constants/collections";

export interface Collection {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: CollectionIcon;
  /** ISO date string (YYYY-MM-DD) or null when the collection is not a dated trip. */
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewCollection = Omit<Collection, "id" | "createdAt" | "updatedAt">;

/** A collection plus the derived data the list card needs. */
export interface CollectionSummary extends Collection {
  placeCount: number;
  /** Names of the first few member places, for the card preview line. */
  previewNames: string[];
}

export interface CollectionRow {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Shape written into the export/backup JSON. Membership travels with the collection. */
export interface CollectionExport extends Collection {
  /** Member place ids, in display order. */
  placeIds: string[];
}

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Accepts a plain YYYY-MM-DD date that is also a real calendar date. */
export function isValidISODate(value: string): boolean {
  if (!ISO_DATE_REGEX.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (isNaN(parsed.getTime())) return false;
  // Rejects overflow like 2026-02-31, which Date would roll forward.
  return parsed.toISOString().slice(0, 10) === value;
}

function normaliseDate(value: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return isValidISODate(trimmed) ? trimmed : null;
}

/**
 * True when the range is usable: either bound may be absent, but if both are
 * present the end may not precede the start.
 */
export function isValidDateRange(
  startDate: string | null,
  endDate: string | null
): boolean {
  if (!startDate || !endDate) return true;
  return startDate <= endDate;
}

export function rowToCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    name: row.name || "",
    description: row.description || "",
    color: isValidCollectionColor(row.color) ? row.color : DEFAULT_COLLECTION_COLOR,
    icon: isValidCollectionIcon(row.icon) ? row.icon : DEFAULT_COLLECTION_ICON,
    startDate: normaliseDate(row.start_date),
    endDate: normaliseDate(row.end_date),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function readString(source: Record<string, unknown>, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value : "";
}

function readNullableString(
  source: Record<string, unknown>,
  key: string
): string | null {
  const value = source[key];
  return typeof value === "string" ? value : null;
}

function readStringArray(source: Record<string, unknown>, key: string): string[] {
  const value = source[key];
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

/**
 * Parses the `collections` array of an export file defensively: anything that
 * is not a well-formed collection is skipped, and salvageable entries are
 * repaired (clamped text, fallback colour/icon, timestamps) instead of thrown
 * away. A v1 file with no `collections` key yields an empty array.
 */
export function parseCollectionExports(value: unknown): CollectionExport[] {
  if (!Array.isArray(value)) return [];

  const result: CollectionExport[] = [];
  const seenIds = new Set<string>();

  for (const entry of value) {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      continue;
    }
    const source = entry as Record<string, unknown>;

    const id = readString(source, "id").trim();
    const name = readString(source, "name").trim();
    // An entry with no id or no name cannot be shown or addressed — drop it.
    if (!id || !name) continue;
    // A duplicated id would violate the primary key; keep the first.
    if (seenIds.has(id)) continue;
    seenIds.add(id);

    const color = readString(source, "color");
    const icon = readString(source, "icon");
    const createdAt = readString(source, "createdAt");
    const updatedAt = readString(source, "updatedAt");
    const fallbackTimestamp = new Date().toISOString();

    const startDate = normaliseDate(readNullableString(source, "startDate"));
    const endDate = normaliseDate(readNullableString(source, "endDate"));
    const rangeIsSane = isValidDateRange(startDate, endDate);

    result.push({
      id,
      name: name.slice(0, COLLECTION_NAME_MAX),
      description: readString(source, "description")
        .trim()
        .slice(0, COLLECTION_DESCRIPTION_MAX),
      color: isValidCollectionColor(color) ? color : DEFAULT_COLLECTION_COLOR,
      icon: isValidCollectionIcon(icon) ? icon : DEFAULT_COLLECTION_ICON,
      startDate: rangeIsSane ? startDate : null,
      endDate: rangeIsSane ? endDate : null,
      createdAt: createdAt || fallbackTimestamp,
      updatedAt: updatedAt || createdAt || fallbackTimestamp,
      // De-duplicated so a repeated id cannot break the join table's primary key.
      placeIds: Array.from(new Set(readStringArray(source, "placeIds"))),
    });
  }

  return result;
}
