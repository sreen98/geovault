import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { GoogleAuthService } from "./google-auth.service";
import { BackupService } from "./backup.service";
import { SettingsRepository } from "../db/settings.repository";

export const AUTO_BACKUP_TASK = "GEOVAULT_AUTO_BACKUP";

export type AutoBackupInterval = "daily" | "weekly" | "monthly";

const INTERVAL_SECONDS: Record<AutoBackupInterval, number> = {
  daily: 86400,
  weekly: 604800,
  monthly: 2592000,
};

export function defineAutoBackupTask(): void {
  TaskManager.defineTask(AUTO_BACKUP_TASK, async () => {
    try {
      if (!GoogleAuthService.isSignedIn()) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      await BackupService.performBackup();
      SettingsRepository.set(
        "last_auto_backup_time",
        new Date().toISOString()
      );

      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (_error: unknown) {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
}

export const AutoBackupService = {
  async register(interval: AutoBackupInterval): Promise<void> {
    const seconds = INTERVAL_SECONDS[interval];

    await BackgroundFetch.registerTaskAsync(AUTO_BACKUP_TASK, {
      minimumInterval: seconds,
      stopOnTerminate: false,
      startOnBoot: true,
    });
  },

  async unregister(): Promise<void> {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(
      AUTO_BACKUP_TASK
    );
    if (isRegistered) {
      await BackgroundFetch.unregisterTaskAsync(AUTO_BACKUP_TASK);
    }
  },

  async isRegistered(): Promise<boolean> {
    return TaskManager.isTaskRegisteredAsync(AUTO_BACKUP_TASK);
  },
};
