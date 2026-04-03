export const MIGRATION_V1 = `
CREATE TABLE IF NOT EXISTS places (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  category TEXT NOT NULL DEFAULT 'Uncategorized',
  tags TEXT NOT NULL DEFAULT '[]',
  note_must_order TEXT DEFAULT '',
  note_avoid TEXT DEFAULT '',
  note_general TEXT DEFAULT '',
  source_url TEXT DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_visited_at TEXT DEFAULT NULL
);

CREATE TABLE IF NOT EXISTS custom_tags (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE VIRTUAL TABLE IF NOT EXISTS places_fts USING fts5(
  name,
  tags,
  note_must_order,
  note_avoid,
  note_general,
  category,
  content='places',
  content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS places_ai AFTER INSERT ON places BEGIN
  INSERT INTO places_fts(rowid, name, tags, note_must_order, note_avoid, note_general, category)
  VALUES (new.rowid, new.name, new.tags, new.note_must_order, new.note_avoid, new.note_general, new.category);
END;

CREATE TRIGGER IF NOT EXISTS places_au AFTER UPDATE ON places BEGIN
  INSERT INTO places_fts(places_fts, rowid, name, tags, note_must_order, note_avoid, note_general, category)
  VALUES ('delete', old.rowid, old.name, old.tags, old.note_must_order, old.note_avoid, old.note_general, old.category);
  INSERT INTO places_fts(rowid, name, tags, note_must_order, note_avoid, note_general, category)
  VALUES (new.rowid, new.name, new.tags, new.note_must_order, new.note_avoid, new.note_general, new.category);
END;

CREATE TRIGGER IF NOT EXISTS places_ad AFTER DELETE ON places BEGIN
  INSERT INTO places_fts(places_fts, rowid, name, tags, note_must_order, note_avoid, note_general, category)
  VALUES ('delete', old.rowid, old.name, old.tags, old.note_must_order, old.note_avoid, old.note_general, old.category);
END;
`;

export const MIGRATION_V2 = `
ALTER TABLE places ADD COLUMN extra_fields TEXT DEFAULT '{}';
`;

export const MIGRATION_V3_STEPS: string[] = [
  `ALTER TABLE places ADD COLUMN location TEXT DEFAULT ''`,
  `DROP TRIGGER IF EXISTS places_ai`,
  `DROP TRIGGER IF EXISTS places_au`,
  `DROP TRIGGER IF EXISTS places_ad`,
  `DROP TABLE IF EXISTS places_fts`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS places_fts USING fts5(
    name,
    location,
    tags,
    note_must_order,
    note_avoid,
    note_general,
    category,
    content='places',
    content_rowid='rowid'
  )`,
  `CREATE TRIGGER places_ai AFTER INSERT ON places BEGIN
    INSERT INTO places_fts(rowid, name, location, tags, note_must_order, note_avoid, note_general, category)
    VALUES (new.rowid, new.name, new.location, new.tags, new.note_must_order, new.note_avoid, new.note_general, new.category);
  END`,
  `CREATE TRIGGER places_au AFTER UPDATE ON places BEGIN
    INSERT INTO places_fts(places_fts, rowid, name, location, tags, note_must_order, note_avoid, note_general, category)
    VALUES ('delete', old.rowid, old.name, old.location, old.tags, old.note_must_order, old.note_avoid, old.note_general, old.category);
    INSERT INTO places_fts(rowid, name, location, tags, note_must_order, note_avoid, note_general, category)
    VALUES (new.rowid, new.name, new.location, new.tags, new.note_must_order, new.note_avoid, new.note_general, new.category);
  END`,
  `CREATE TRIGGER places_ad AFTER DELETE ON places BEGIN
    INSERT INTO places_fts(places_fts, rowid, name, location, tags, note_must_order, note_avoid, note_general, category)
    VALUES ('delete', old.rowid, old.name, old.location, old.tags, old.note_must_order, old.note_avoid, old.note_general, old.category);
  END`,
  `INSERT INTO places_fts(places_fts) VALUES('rebuild')`,
];
