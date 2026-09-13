import { File, Paths } from "expo-file-system/next";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { PlacesRepository } from "../db/places.repository";
import { CollectionsRepository } from "../db/collections.repository";
import {
  RestorePayload,
  RestoreResult,
  restoreAppend,
  restoreOverwrite,
} from "../db/restore.repository";
import { Place, parsePlaceExports } from "../types/place.types";
import {
  CollectionExport,
  parseCollectionExports,
} from "../types/collection.types";

/**
 * v1 files carry places only. v2 adds collections and their membership.
 * Both directions stay readable: a v1 file imports with zero collections, and
 * a v2 file opened by an older build still finds the `places` array it expects.
 */
export const EXPORT_FORMAT_VERSION = 2;

export interface GeoVaultExport {
  appName: string;
  version: number;
  exportedAt: string;
  totalPlaces: number;
  totalCollections: number;
  places: Place[];
  collections: CollectionExport[];
}

export function parseImportFile(content: string): RestorePayload {
  const parsed: unknown = JSON.parse(content);

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Invalid GeoVault export file");
  }

  const source = parsed as Record<string, unknown>;
  if (!Array.isArray(source.places)) {
    throw new Error("Invalid GeoVault export file");
  }

  const places = parsePlaceExports(source.places);
  const collections = parseCollectionExports(source.collections);

  // An empty result means either a genuinely empty file or one whose records
  // were all unusable. Refusing here stops an overwrite from wiping the vault.
  if (places.length === 0 && collections.length === 0) {
    throw new Error("Export file contains no usable records");
  }

  return { places, collections };
}

export function buildExportJson(): string {
  const places = PlacesRepository.exportAll();
  const collections = CollectionsRepository.exportAll();

  const payload: GeoVaultExport = {
    appName: "GeoVault",
    version: EXPORT_FORMAT_VERSION,
    exportedAt: new Date().toISOString(),
    totalPlaces: places.length,
    totalCollections: collections.length,
    places,
    collections,
  };

  return JSON.stringify(payload, null, 2);
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

  async pickAndReadFile(): Promise<RestorePayload | null> {
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

  importOverwrite(payload: RestorePayload): RestoreResult {
    return restoreOverwrite(payload);
  },

  importAppend(payload: RestorePayload): RestoreResult {
    return restoreAppend(payload);
  },
};
