import { create } from "zustand";
import { BackupInfo, BackupState } from "../types/backup.types";
import { GoogleAuthService } from "../services/google-auth.service";
import { BackupService } from "../services/backup.service";

interface MessageInfo {
  title: string;
  message: string;
  type: "success" | "error";
}

interface BackupStoreState {
  isSignedIn: boolean;
  userEmail: string | null;
  lastBackupTime: string | null;
  lastBackupPlaceCount: number | null;
  backupState: BackupState;
  pendingMessage: MessageInfo | null;
  initialize: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  backup: () => Promise<void>;
  restore: (mode: "overwrite" | "append") => Promise<void>;
  refreshBackupInfo: () => Promise<void>;
  clearMessage: () => void;
}

export const useBackupStore = create<BackupStoreState>((set) => ({
  isSignedIn: false,
  userEmail: null,
  lastBackupTime: null,
  lastBackupPlaceCount: null,
  backupState: "idle",
  pendingMessage: null,

  initialize: () => {
    const signedIn = GoogleAuthService.isSignedIn();
    const user = GoogleAuthService.getCurrentUser();
    set({
      isSignedIn: signedIn,
      userEmail: user?.email ?? null,
    });
  },

  signIn: async () => {
    set({ backupState: "signing-in" });
    try {
      const { userEmail } = await GoogleAuthService.signIn();
      set({
        isSignedIn: true,
        userEmail,
        backupState: "idle",
      });
    } catch (error: unknown) {
      if (GoogleAuthService.isUserCancelError(error)) {
        set({ backupState: "idle" });
        return;
      }
      set({
        backupState: "error",
        pendingMessage: {
          title: "Sign-in Failed",
          message: "Could not sign in with Google. Please try again.",
          type: "error",
        },
      });
    }
  },

  signOut: async () => {
    try {
      await GoogleAuthService.signOut();
    } catch (_error: unknown) {
      // sign out silently
    }
    set({
      isSignedIn: false,
      userEmail: null,
      lastBackupTime: null,
      lastBackupPlaceCount: null,
      backupState: "idle",
    });
  },

  backup: async () => {
    set({ backupState: "backing-up" });
    try {
      const info: BackupInfo = await BackupService.performBackup();
      set({
        lastBackupTime: info.modifiedTime,
        lastBackupPlaceCount: info.placeCount,
        backupState: "idle",
        pendingMessage: {
          title: "Backup Complete",
          message: `${info.placeCount} places backed up to Google Drive.`,
          type: "success",
        },
      });
    } catch (_error: unknown) {
      set({
        backupState: "error",
        pendingMessage: {
          title: "Backup Failed",
          message: "Could not upload backup. Check your internet connection and try again.",
          type: "error",
        },
      });
    }
  },

  restore: async (mode: "overwrite" | "append") => {
    set({ backupState: "restoring" });
    try {
      const result = await BackupService.performRestore(mode);
      const message =
        mode === "overwrite"
          ? `Restored ${result.placeCount} places from backup.`
          : `Added ${result.placeCount} new places from backup.`;
      set({
        backupState: "idle",
        pendingMessage: { title: "Restore Complete", message, type: "success" },
      });
    } catch (_error: unknown) {
      set({
        backupState: "error",
        pendingMessage: {
          title: "Restore Failed",
          message: "Could not restore from backup. The file may be corrupted or missing.",
          type: "error",
        },
      });
    }
  },

  refreshBackupInfo: async () => {
    set({ backupState: "loading" });
    try {
      const info = await BackupService.getLatestBackupInfo();
      set({
        lastBackupTime: info?.modifiedTime ?? null,
        lastBackupPlaceCount: info?.placeCount ?? null,
        backupState: "idle",
      });
    } catch (_error: unknown) {
      set({ backupState: "idle" });
    }
  },

  clearMessage: () => {
    set({ pendingMessage: null });
  },
}));
