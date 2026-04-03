import React, { createContext, useContext, useMemo } from "react";
import { useSettingsStore } from "../stores/settings.store";
import { DARK_COLORS, LIGHT_COLORS, ThemeColors } from "../constants/theme";

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: DARK_COLORS,
  isDark: true,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeMode = useSettingsStore((s) => s.themeMode);

  const value = useMemo<ThemeContextValue>(() => ({
    colors: themeMode === "dark" ? DARK_COLORS : LIGHT_COLORS,
    isDark: themeMode === "dark",
  }), [themeMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
