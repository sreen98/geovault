import { File, Paths } from "expo-file-system/next";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { PlacesRepository } from "../db/places.repository";
import { TripsRepository } from "../db/trips.repository";
import { Place } from "../types/place.types";
import { Trip, TripMembership } from "../types/trip.types";

// version 1: places only. version 2: adds trips + tripPlaces (memberships).
export interface GeoVaultExport {
  appName: string;
  version: number;
  exportedAt: string;
  totalPlaces: number;
  totalTrips?: number;
  places: Place[];
  trips?: Trip[];
  tripPlaces?: TripMembership[];
}

export interface ParsedImport {
  places: Place[];
  trips: Trip[];
  tripPlaces: TripMembership[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTrips(value: unknown): Trip[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (t): t is Trip =>
      isRecord(t) && typeof t.id === "string" && typeof t.name === "string"
  );
}

function parseMemberships(value: unknown): TripMembership[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (m): m is TripMembership =>
      isRecord(m) &&
      typeof m.tripId === "string" &&
      typeof m.placeId === "string" &&
      typeof m.addedAt === "string"
  );
}

export function parseImportFile(content: string): ParsedImport {
  const parsed: unknown = JSON.parse(content);
  if (isRecord(parsed) && Array.isArray(parsed.places)) {
    return {
      places: parsed.places as Place[],
      trips: parseTrips(parsed.trips),
      tripPlaces: parseMemberships(parsed.tripPlaces),
    };
  }
  throw new Error("Invalid GeoVault export file");
}

export function buildExportJson(): string {
  const places = PlacesRepository.exportAll();
  const trips = TripsRepository.exportAll();
  const tripPlaces = TripsRepository.exportMemberships();
  return JSON.stringify(
    {
      appName: "GeoVault",
      version: 2,
      exportedAt: new Date().toISOString(),
      totalPlaces: places.length,
      totalTrips: trips.length,
      places,
      trips,
      tripPlaces,
    },
    null,
    2
  );
}

export const ExportService = {
  async exportAsJson(): Promise<void> {
    const json = buildExportJson();

    const fileName = `geovault-export-${Date.now()}.json`;
    const file = new File(Paths.cache, fileName);
    file.create();
    file.write(json);

    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      dialogTitle: "Export GeoVault Data",
    });
  },

  async pickAndReadFile(): Promise<ParsedImport | null> {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled || result.assets.length === 0) {
      return null;
    }

    const file = new File(result.assets[0].uri);
    const content = await file.text();
    return parseImportFile(content);
  },

  importOverwrite(data: ParsedImport): number {
    // Places first — trip memberships reference place ids via foreign keys.
    PlacesRepository.importAll(data.places);
    TripsRepository.importAll(data.trips, data.tripPlaces);
    return data.places.length;
  },

  importAppend(data: ParsedImport): number {
    const added = PlacesRepository.appendAll(data.places);
    TripsRepository.appendAll(data.trips, data.tripPlaces);
    return added;
  },
};
