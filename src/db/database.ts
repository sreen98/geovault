import * as SQLite from "expo-sqlite";
import { MIGRATION_V1, MIGRATION_V2, MIGRATION_V3_STEPS } from "./migrations";

const DB_NAME = "geovault.db";

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync(DB_NAME);
    db.execSync("PRAGMA journal_mode = WAL");
    db.execSync("PRAGMA foreign_keys = ON");
    runMigrations(db);
  }
  return db;
}

function runMigrations(database: SQLite.SQLiteDatabase) {
  const result = database.getFirstSync<{ user_version: number }>(
    "PRAGMA user_version"
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion < 1) {
    database.execSync(MIGRATION_V1);
    database.execSync("PRAGMA user_version = 1");
  }
  if (currentVersion < 2) {
    database.execSync(MIGRATION_V2);
    database.execSync("PRAGMA user_version = 2");
  }
  if (currentVersion < 3) {
    for (const step of MIGRATION_V3_STEPS) {
      database.execSync(step);
    }
    database.execSync("PRAGMA user_version = 3");
  }
}
