import { create } from "zustand";
import { Alert } from "react-native";
import { BackupInfo, BackupState } from "../types/backup.types";
import { GoogleAuthService } from "../services/google-auth.service";
import { BackupService } from "../services/backup.service";

interface BackupStoreState {
  isSignedIn: boolean;
  userEmail: string | null;
  lastBackupTime: string | null;
  lastBackupPlaceCount: number | null;
  backupState: BackupState;
  initialize: () => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  backup: () => Promise<void>;
  restore: (mode: "overwrite" | "append") => Promise<void>;
  refreshBackupInfo: () => Promise<void>;
}

export const useBackupStore = create<BackupStoreState>((set, get) => ({
  isSignedIn: false,
  userEmail: null,
  lastBackupTime: null,
  lastBackupPlaceCount: null,
  backupState: "idle",

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
      set({ backupState: "error" });
      Alert.alert("Sign-in Failed", "Could not sign in with Google. Please try again.");
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
      });
      Alert.alert(
        "Backup Complete",
        `${info.placeCount} places backed up to Google Drive.`
      );
    } catch (_error: unknown) {
      set({ backupState: "error" });
      Alert.alert(
        "Backup Failed",
        "Could not upload backup. Check your internet connection and try again."
      );
    }
  },

  restore: async (mode: "overwrite" | "append") => {
    set({ backupState: "restoring" });
    try {
      const result = await BackupService.performRestore(mode);
      set({ backupState: "idle" });
      const message =
        mode === "overwrite"
          ? `Restored ${result.placeCount} places from backup.`
          : `Added ${result.placeCount} new places from backup.`;
      Alert.alert("Restore Complete", message);
    } catch (_error: unknown) {
      set({ backupState: "error" });
      Alert.alert(
        "Restore Failed",
        "Could not restore from backup. The file may be corrupted or missing."
      );
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
}));
