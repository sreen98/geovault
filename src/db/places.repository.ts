import { getDatabase } from "./database";
import {
  Place,
  NewPlace,
  PlaceRow,
  rowToPlace,
} from "../types/place.types";
import { generateId } from "../utils/uuid";
import { nowISO } from "../utils/date";

export const PlacesRepository = {
  getAll(filters?: {
    category?: string;
    statusTag?: string;
  }): Place[] {
    const db = getDatabase();
    let query = "SELECT * FROM places";
    const conditions: string[] = [];
    const params: string[] = [];

    if (filters?.category) {
      conditions.push("category = ?");
      params.push(filters.category);
    }

    if (filters?.statusTag) {
      conditions.push("json_each.value = ?");
      params.push(filters.statusTag);
    }

    if (filters?.statusTag) {
      query = `SELECT DISTINCT p.* FROM places p, json_each(p.tags)`;
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(" AND ")}`;
      }
    } else if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " ORDER BY created_at DESC";

    return db
      .getAllSync<PlaceRow>(query, params)
      .map(rowToPlace);
  },

  getPaginated(
    limit: number,
    offset: number,
    filters?: { category?: string }
  ): Place[] {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters?.category) {
      conditions.push("category = ?");
      params.push(filters.category);
    }

    let query = "SELECT * FROM places";
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    return db.getAllSync<PlaceRow>(query, params).map(rowToPlace);
  },

  getFilteredCount(filters?: { category?: string }): number {
    const db = getDatabase();
    const conditions: string[] = [];
    const params: string[] = [];

    if (filters?.category) {
      conditions.push("category = ?");
      params.push(filters.category);
    }

    let query = "SELECT COUNT(*) as count FROM places";
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    const result = db.getFirstSync<{ count: number }>(query, params);
    return result?.count ?? 0;
  },

  searchPaginated(query: string, limit: number, offset: number): Place[] {
    const db = getDatabase();
    const sanitized = query.replace(/['"]/g, "").trim();
    if (!sanitized) return [];

    const ftsQuery = sanitized
      .split(/\s+/)
      .map((w) => `"${w}"*`)
      .join(" ");

    return db
      .getAllSync<PlaceRow>(
        `SELECT p.* FROM places p
         INNER JOIN places_fts fts ON p.rowid = fts.rowid
         WHERE places_fts MATCH ?
         ORDER BY rank
         LIMIT ? OFFSET ?`,
        [ftsQuery, limit, offset]
      )
      .map(rowToPlace);
  },

  getById(id: string): Place | null {
    const db = getDatabase();
    const row = db.getFirstSync<PlaceRow>(
      "SELECT * FROM places WHERE id = ?",
      [id]
    );
    return row ? rowToPlace(row) : null;
  },

  search(query: string): Place[] {
    const db = getDatabase();
    const sanitized = query.replace(/['"]/g, "").trim();
    if (!sanitized) return [];

    const ftsQuery = sanitized
      .split(/\s+/)
      .map((w) => `"${w}"*`)
      .join(" ");

    return db
      .getAllSync<PlaceRow>(
        `SELECT p.* FROM places p
         INNER JOIN places_fts fts ON p.rowid = fts.rowid
         WHERE places_fts MATCH ?
         ORDER BY rank
         LIMIT 50`,
        [ftsQuery]
      )
      .map(rowToPlace);
  },

  insert(place: NewPlace): Place {
    const db = getDatabase();
    const now = nowISO();
    const id = generateId();

    db.runSync(
      `INSERT INTO places (id, name, location, latitude, longitude, category, tags, note_must_order, note_avoid, note_general, extra_fields, source_url, created_at, updated_at, last_visited_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        place.name,
        place.location,
        place.latitude,
        place.longitude,
        place.category,
        JSON.stringify(place.tags),
        place.noteMustOrder,
        place.noteAvoid,
        place.noteGeneral,
        JSON.stringify(place.extraFields),
        place.sourceUrl,
        now,
        now,
        place.lastVisitedAt,
      ]
    );

    return {
      ...place,
      id,
      createdAt: now,
      updatedAt: now,
    };
  },

  update(id: string, updates: Partial<NewPlace>): void {
    const db = getDatabase();
    const now = nowISO();
    const sets: string[] = ["updated_at = ?"];
    const params: (string | number | null)[] = [now];

    if (updates.name !== undefined) {
      sets.push("name = ?");
      params.push(updates.name);
    }
    if (updates.location !== undefined) {
      sets.push("location = ?");
      params.push(updates.location);
    }
    if (updates.latitude !== undefined) {
      sets.push("latitude = ?");
      params.push(updates.latitude);
    }
    if (updates.longitude !== undefined) {
      sets.push("longitude = ?");
      params.push(updates.longitude);
    }
    if (updates.category !== undefined) {
      sets.push("category = ?");
      params.push(updates.category);
    }
    if (updates.tags !== undefined) {
      sets.push("tags = ?");
      params.push(JSON.stringify(updates.tags));
    }
    if (updates.noteMustOrder !== undefined) {
      sets.push("note_must_order = ?");
      params.push(updates.noteMustOrder);
    }
    if (updates.noteAvoid !== undefined) {
      sets.push("note_avoid = ?");
      params.push(updates.noteAvoid);
    }
    if (updates.noteGeneral !== undefined) {
      sets.push("note_general = ?");
      params.push(updates.noteGeneral);
    }
    if (updates.extraFields !== undefined) {
      sets.push("extra_fields = ?");
      params.push(JSON.stringify(updates.extraFields));
    }
    if (updates.sourceUrl !== undefined) {
      sets.push("source_url = ?");
      params.push(updates.sourceUrl);
    }
    if (updates.lastVisitedAt !== undefined) {
      sets.push("last_visited_at = ?");
      params.push(updates.lastVisitedAt);
    }

    params.push(id);
    db.runSync(`UPDATE places SET ${sets.join(", ")} WHERE id = ?`, params);
  },

  delete(id: string): void {
    const db = getDatabase();
    db.runSync("DELETE FROM places WHERE id = ?", [id]);
  },

  exportAll(): Place[] {
    const db = getDatabase();
    return db
      .getAllSync<PlaceRow>("SELECT * FROM places ORDER BY created_at DESC")
      .map(rowToPlace);
  },

  importAll(places: Place[]): void {
    const db = getDatabase();
    db.execSync("DELETE FROM places");

    for (const place of places) {
      db.runSync(
        `INSERT INTO places (id, name, location, latitude, longitude, category, tags, note_must_order, note_avoid, note_general, extra_fields, source_url, created_at, updated_at, last_visited_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          place.id,
          place.name,
          place.location ?? "",
          place.latitude,
          place.longitude,
          place.category,
          JSON.stringify(place.tags),
          place.noteMustOrder,
          place.noteAvoid,
          place.noteGeneral,
          JSON.stringify(place.extraFields ?? {}),
          place.sourceUrl,
          place.createdAt,
          place.updatedAt,
          place.lastVisitedAt,
        ]
      );
    }

    db.execSync("INSERT INTO places_fts(places_fts) VALUES('rebuild')");
  },

  appendAll(places: Place[]): number {
    const db = getDatabase();
    let added = 0;

    for (const place of places) {
      const existing = db.getFirstSync<{ id: string }>(
        "SELECT id FROM places WHERE id = ?",
        [place.id]
      );
      if (existing) continue;

      db.runSync(
        `INSERT INTO places (id, name, location, latitude, longitude, category, tags, note_must_order, note_avoid, note_general, extra_fields, source_url, created_at, updated_at, last_visited_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          place.id,
          place.name,
          place.location ?? "",
          place.latitude,
          place.longitude,
          place.category,
          JSON.stringify(place.tags),
          place.noteMustOrder,
          place.noteAvoid,
          place.noteGeneral,
          JSON.stringify(place.extraFields ?? {}),
          place.sourceUrl,
          place.createdAt,
          place.updatedAt,
          place.lastVisitedAt,
        ]
      );
      added++;
    }

    if (added > 0) {
      db.execSync("INSERT INTO places_fts(places_fts) VALUES('rebuild')");
    }
    return added;
  },

  getCount(): number {
    const db = getDatabase();
    const result = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM places"
    );
    return result?.count ?? 0;
  },
};
