import { create } from "zustand";
import { SettingsRepository } from "../db/settings.repository";

type ThemeMode = "dark" | "light";

interface SettingsState {
  themeMode: ThemeMode;
  isMetric: boolean;
  loadSettings: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setIsMetric: (metric: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  themeMode: "dark",
  isMetric: true,

  loadSettings: () => {
    const storedTheme = SettingsRepository.get("theme_mode");
    const storedMetric = SettingsRepository.get("is_metric");
    set({
      themeMode: storedTheme === "light" ? "light" : "dark",
      isMetric: storedMetric === "false" ? false : true,
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
}));
