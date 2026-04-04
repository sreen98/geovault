import { create } from "zustand";
import { SettingsRepository } from "../db/settings.repository";
import {
  AutoBackupService,
  AutoBackupInterval,
} from "../services/auto-backup.service";

type ThemeMode = "dark" | "light";

const VALID_INTERVALS: AutoBackupInterval[] = ["daily", "weekly", "monthly"];

function isValidInterval(value: string | null): value is AutoBackupInterval {
  return value !== null && VALID_INTERVALS.includes(value as AutoBackupInterval);
}

interface SettingsState {
  themeMode: ThemeMode;
  isMetric: boolean;
  autoBackupEnabled: boolean;
  autoBackupInterval: AutoBackupInterval;
  lastAutoBackupTime: string | null;
  loadSettings: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setIsMetric: (metric: boolean) => void;
  setAutoBackup: (enabled: boolean) => void;
  setAutoBackupInterval: (interval: AutoBackupInterval) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  themeMode: "dark",
  isMetric: true,
  autoBackupEnabled: false,
  autoBackupInterval: "daily",
  lastAutoBackupTime: null,

  loadSettings: () => {
    const storedTheme = SettingsRepository.get("theme_mode");
    const storedMetric = SettingsRepository.get("is_metric");
    const storedAutoBackup = SettingsRepository.get("auto_backup_enabled");
    const storedInterval = SettingsRepository.get("auto_backup_interval");
    const storedLastTime = SettingsRepository.get("last_auto_backup_time");

    set({
      themeMode: storedTheme === "light" ? "light" : "dark",
      isMetric: storedMetric === "false" ? false : true,
      autoBackupEnabled: storedAutoBackup === "true",
      autoBackupInterval: isValidInterval(storedInterval) ? storedInterval : "daily",
      lastAutoBackupTime: storedLastTime,
    });
  },

  setThemeMode: (mode: ThemeMode) => {
    SettingsRepository.set("theme_mode", mode);
    set({ themeMode: mode });
  },

  setIsMetric: (metric: boolean) => {
    SettingsRepository.set("is_metric", String(metric));
    set({ isMetric: metric });
  },

  setAutoBackup: (enabled: boolean) => {
    SettingsRepository.set("auto_backup_enabled", String(enabled));
    set({ autoBackupEnabled: enabled });

    if (enabled) {
      const { autoBackupInterval } = get();
      AutoBackupService.register(autoBackupInterval);
    } else {
      AutoBackupService.unregister();
    }
  },

  setAutoBackupInterval: (interval: AutoBackupInterval) => {
    SettingsRepository.set("auto_backup_interval", interval);
    set({ autoBackupInterval: interval });

    const { autoBackupEnabled } = get();
    if (autoBackupEnabled) {
      // Re-register with new interval
      AutoBackupService.unregister().then(() => {
        AutoBackupService.register(interval);
      });
    }
  },
}));
