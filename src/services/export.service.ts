import { File, Paths } from "expo-file-system/next";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { PlacesRepository } from "../db/places.repository";
import { Place } from "../types/place.types";

export interface GeoVaultExport {
  appName: string;
  version: number;
  exportedAt: string;
  totalPlaces: number;
  places: Place[];
}

export function parseImportFile(content: string): Place[] {
  const parsed: unknown = JSON.parse(content);
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "places" in parsed &&
    Array.isArray((parsed as GeoVaultExport).places)
  ) {
    return (parsed as GeoVaultExport).places;
  }
  throw new Error("Invalid GeoVault export file");
}

export function buildExportJson(): string {
  const places = PlacesRepository.exportAll();
  return JSON.stringify(
    {
      appName: "GeoVault",
      version: 1,
      exportedAt: new Date().toISOString(),
      totalPlaces: places.length,
      places,
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

  async pickAndReadFile(): Promise<Place[] | null> {
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

  importOverwrite(places: Place[]): number {
    PlacesRepository.importAll(places);
    return places.length;
  },

  importAppend(places: Place[]): number {
    return PlacesRepository.appendAll(places);
  },
};
