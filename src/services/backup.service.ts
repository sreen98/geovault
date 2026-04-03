import { GoogleAuthService } from "./google-auth.service";
import { GoogleDriveService } from "./google-drive.service";
import { buildExportJson, parseImportFile } from "./export.service";
import { PlacesRepository } from "../db/places.repository";
import { BackupInfo } from "../types/backup.types";

async function getTokenWithRetry(): Promise<string> {
  try {
    return await GoogleAuthService.getAccessToken();
  } catch (_error: unknown) {
    // Token may be stale, try signing in again
    const result = await GoogleAuthService.signIn();
    return result.accessToken;
  }
}

export const BackupService = {
  async performBackup(): Promise<BackupInfo> {
    const accessToken = await getTokenWithRetry();
    const json = buildExportJson();

    const file = await GoogleDriveService.uploadBackup(accessToken, json);

    // Prune old backups, keep latest 3
    await GoogleDriveService.pruneOldBackups(accessToken, 3);

    const placeCount = PlacesRepository.getCount();

    return {
      fileId: file.id,
      fileName: file.name,
      modifiedTime: new Date().toISOString(),
      placeCount,
    };
  },

  async getLatestBackupInfo(): Promise<BackupInfo | null> {
    const accessToken = await getTokenWithRetry();
    const files = await GoogleDriveService.listBackups(accessToken);

    if (files.length === 0) return null;

    const latest = files[0];

    // Download to get place count
    const content = await GoogleDriveService.downloadBackup(
      accessToken,
      latest.id
    );
    let placeCount = 0;
    try {
      const places = parseImportFile(content);
      placeCount = places.length;
    } catch (_error: unknown) {
      // Corrupted file, still return metadata
    }

    return {
      fileId: latest.id,
      fileName: latest.name,
      modifiedTime: latest.modifiedTime,
      placeCount,
    };
  },

  async performRestore(
    mode: "overwrite" | "append"
  ): Promise<{ placeCount: number }> {
    const accessToken = await getTokenWithRetry();
    const files = await GoogleDriveService.listBackups(accessToken);

    if (files.length === 0) {
      throw new Error("No backup found on Google Drive");
    }

    const content = await GoogleDriveService.downloadBackup(
      accessToken,
      files[0].id
    );
    const places = parseImportFile(content);

    if (mode === "overwrite") {
      PlacesRepository.importAll(places);
      return { placeCount: places.length };
    } else {
      const added = PlacesRepository.appendAll(places);
      return { placeCount: added };
    }
  },
};
