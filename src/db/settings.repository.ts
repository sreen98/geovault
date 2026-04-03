import { getDatabase } from "./database";

export const SettingsRepository = {
  get(key: string): string | null {
    const db = getDatabase();
    const row = db.getFirstSync<{ value: string }>(
      "SELECT value FROM app_settings WHERE key = ?",
      [key]
    );
    return row?.value ?? null;
  },

  set(key: string, value: string): void {
    const db = getDatabase();
    db.runSync(
      "INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)",
      [key, value]
    );
  },

  delete(key: string): void {
    const db = getDatabase();
    db.runSync("DELETE FROM app_settings WHERE key = ?", [key]);
  },
};
