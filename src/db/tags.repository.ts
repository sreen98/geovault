import { getDatabase } from "./database";
import { generateId } from "../utils/uuid";
import { nowISO } from "../utils/date";

export interface CustomTag {
  id: string;
  label: string;
  createdAt: string;
}

interface CustomTagRow {
  id: string;
  label: string;
  created_at: string;
}

export const TagsRepository = {
  getAll(): CustomTag[] {
    const db = getDatabase();
    return db
      .getAllSync<CustomTagRow>(
        "SELECT * FROM custom_tags ORDER BY label ASC"
      )
      .map((row) => ({
        id: row.id,
        label: row.label,
        createdAt: row.created_at,
      }));
  },

  create(label: string): CustomTag {
    const db = getDatabase();
    const id = generateId();
    const now = nowISO();

    db.runSync(
      "INSERT INTO custom_tags (id, label, created_at) VALUES (?, ?, ?)",
      [id, label.trim(), now]
    );

    return { id, label: label.trim(), createdAt: now };
  },

  delete(id: string): void {
    const db = getDatabase();
    db.runSync("DELETE FROM custom_tags WHERE id = ?", [id]);
  },

  exists(label: string): boolean {
    const db = getDatabase();
    const row = db.getFirstSync<{ id: string }>(
      "SELECT id FROM custom_tags WHERE label = ?",
      [label.trim()]
    );
    return !!row;
  },
};
