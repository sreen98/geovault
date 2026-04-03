export interface GoogleDriveFileMetadata {
  id: string;
  name: string;
  modifiedTime: string;
  size: string;
}

export interface BackupInfo {
  fileId: string;
  fileName: string;
  modifiedTime: string;
  placeCount: number;
}

export type BackupState =
  | "idle"
  | "signing-in"
  | "backing-up"
  | "restoring"
  | "loading"
  | "error";
