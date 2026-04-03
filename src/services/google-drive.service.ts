import { GoogleDriveFileMetadata } from "../types/backup.types";

const FILES_URL = "https://www.googleapis.com/drive/v3/files";
const UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

export const GoogleDriveService = {
  async listBackups(accessToken: string): Promise<GoogleDriveFileMetadata[]> {
    const params = new URLSearchParams({
      spaces: "appDataFolder",
      fields: "files(id,name,modifiedTime,size)",
      orderBy: "modifiedTime desc",
    });

    const response = await fetch(`${FILES_URL}?${params}`, {
      headers: authHeader(accessToken),
    });

    if (!response.ok) {
      throw new Error(`Drive list failed: ${response.status}`);
    }

    const data: unknown = await response.json();
    const files = (data as { files: GoogleDriveFileMetadata[] }).files ?? [];
    return files;
  },

  async uploadBackup(
    accessToken: string,
    jsonContent: string
  ): Promise<GoogleDriveFileMetadata> {
    // Check if a backup file already exists
    const existing = await this.listBackups(accessToken);
    const existingFile = existing.find(
      (f) => f.name === "geovault-backup.json"
    );

    if (existingFile) {
      return this.updateBackup(accessToken, existingFile.id, jsonContent);
    }

    // Create new file
    const boundary = "geovault_boundary_" + Date.now();
    const metadata = JSON.stringify({
      name: "geovault-backup.json",
      parents: ["appDataFolder"],
    });

    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${metadata}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${jsonContent}\r\n` +
      `--${boundary}--`;

    const response = await fetch(`${UPLOAD_URL}?uploadType=multipart`, {
      method: "POST",
      headers: {
        ...authHeader(accessToken),
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Drive upload failed: ${response.status}`);
    }

    const result: unknown = await response.json();
    return result as GoogleDriveFileMetadata;
  },

  async updateBackup(
    accessToken: string,
    fileId: string,
    jsonContent: string
  ): Promise<GoogleDriveFileMetadata> {
    const boundary = "geovault_boundary_" + Date.now();
    const metadata = JSON.stringify({
      name: "geovault-backup.json",
    });

    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${metadata}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${jsonContent}\r\n` +
      `--${boundary}--`;

    const response = await fetch(
      `${UPLOAD_URL}/${fileId}?uploadType=multipart`,
      {
        method: "PATCH",
        headers: {
          ...authHeader(accessToken),
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!response.ok) {
      throw new Error(`Drive update failed: ${response.status}`);
    }

    const result: unknown = await response.json();
    return result as GoogleDriveFileMetadata;
  },

  async downloadBackup(
    accessToken: string,
    fileId: string
  ): Promise<string> {
    const response = await fetch(`${FILES_URL}/${fileId}?alt=media`, {
      headers: authHeader(accessToken),
    });

    if (!response.ok) {
      throw new Error(`Drive download failed: ${response.status}`);
    }

    return response.text();
  },

  async deleteFile(accessToken: string, fileId: string): Promise<void> {
    const response = await fetch(`${FILES_URL}/${fileId}`, {
      method: "DELETE",
      headers: authHeader(accessToken),
    });

    if (!response.ok && response.status !== 404) {
      throw new Error(`Drive delete failed: ${response.status}`);
    }
  },

  async pruneOldBackups(
    accessToken: string,
    keepCount: number
  ): Promise<void> {
    const files = await this.listBackups(accessToken);
    const toDelete = files.slice(keepCount);

    for (const file of toDelete) {
      await this.deleteFile(accessToken, file.id);
    }
  },
};
