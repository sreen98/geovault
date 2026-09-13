import { getDatabase } from "./database";
import {
  Collection,
  CollectionExport,
  CollectionRow,
  CollectionSummary,
  NewCollection,
  rowToCollection,
} from "../types/collection.types";
import { Place, PlaceRow, rowToPlace } from "../types/place.types";
import {
  COLLECTION_DESCRIPTION_MAX,
  COLLECTION_NAME_MAX,
} from "../constants/collections";
import { generateId } from "../utils/uuid";
import { nowISO } from "../utils/date";

const PREVIEW_NAME_COUNT = 3;

const INSERT_COLLECTION_SQL = `
  INSERT INTO collections (id, name, description, color, icon, start_date, end_date, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

interface SummaryRow extends CollectionRow {
  place_count: number;
}

interface PreviewRow {
  collection_id: string;
  name: string;
}

/**
 * Escapes the LIKE wildcards so a search for "50% off" or "a_b" matches
 * literally instead of turning into a pattern.
 */
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

function clampName(value: string): string {
  return value.trim().slice(0, COLLECTION_NAME_MAX);
}

function clampDescription(value: string): string {
  return value.trim().slice(0, COLLECTION_DESCRIPTION_MAX);
}

/** Bumps updated_at so "recently used" ordering reflects membership changes too. */
function touch(collectionId: string, timestamp: string): void {
  const db = getDatabase();
  db.runSync("UPDATE collections SET updated_at = ? WHERE id = ?", [
    timestamp,
    collectionId,
  ]);
}

function nextPosition(collectionId: string): number {
  const db = getDatabase();
  const row = db.getFirstSync<{ max_position: number | null }>(
    "SELECT MAX(position) as max_position FROM collection_places WHERE collection_id = ?",
    [collectionId]
  );
  return (row?.max_position ?? -1) + 1;
}

/** Member place ids of a collection in display order. */
function orderedPlaceIds(collectionId: string): string[] {
  const db = getDatabase();
  return db
    .getAllSync<{ place_id: string }>(
      `SELECT place_id FROM collection_places
       WHERE collection_id = ?
       ORDER BY position ASC, added_at ASC`,
      [collectionId]
    )
    .map((row) => row.place_id);
}

export const CollectionsRepository = {
  getAllSummaries(): CollectionSummary[] {
    const db = getDatabase();

    const rows = db.getAllSync<SummaryRow>(
      `SELECT c.*, COUNT(cp.place_id) as place_count
       FROM collections c
       LEFT JOIN collection_places cp ON cp.collection_id = c.id
       GROUP BY c.id
       ORDER BY c.updated_at DESC`
    );

    if (rows.length === 0) return [];

    // One extra query gets the first few member names per collection, rather
    // than one query per card.
    const previews = db.getAllSync<PreviewRow>(
      `SELECT collection_id, name FROM (
         SELECT cp.collection_id AS collection_id,
                p.name AS name,
                ROW_NUMBER() OVER (
                  PARTITION BY cp.collection_id
                  ORDER BY cp.position ASC, cp.added_at ASC
                ) AS row_num
         FROM collection_places cp
         INNER JOIN places p ON p.id = cp.place_id
       )
       WHERE row_num <= ?`,
      [PREVIEW_NAME_COUNT]
    );

    const previewsByCollection = new Map<string, string[]>();
    for (const preview of previews) {
      const existing = previewsByCollection.get(preview.collection_id);
      if (existing) {
        existing.push(preview.name);
      } else {
        previewsByCollection.set(preview.collection_id, [preview.name]);
      }
    }

    return rows.map((row) => ({
      ...rowToCollection(row),
      placeCount: row.place_count,
      previewNames: previewsByCollection.get(row.id) ?? [],
    }));
  },

  getById(id: string): Collection | null {
    const db = getDatabase();
    const row = db.getFirstSync<CollectionRow>(
      "SELECT * FROM collections WHERE id = ?",
      [id]
    );
    return row ? rowToCollection(row) : null;
  },

  getCount(): number {
    const db = getDatabase();
    const result = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM collections"
    );
    return result?.count ?? 0;
  },

  create(input: NewCollection): Collection {
    const db = getDatabase();
    const now = nowISO();
    const id = generateId();

    const collection: Collection = {
      id,
      name: clampName(input.name),
      description: clampDescription(input.description),
      color: input.color,
      icon: input.icon,
      startDate: input.startDate,
      endDate: input.endDate,
      createdAt: now,
      updatedAt: now,
    };

    db.runSync(INSERT_COLLECTION_SQL, [
      collection.id,
      collection.name,
      collection.description,
      collection.color,
      collection.icon,
      collection.startDate,
      collection.endDate,
      collection.createdAt,
      collection.updatedAt,
    ]);

    return collection;
  },

  update(id: string, updates: Partial<NewCollection>): void {
    const db = getDatabase();
    const sets: string[] = ["updated_at = ?"];
    const params: (string | null)[] = [nowISO()];

    if (updates.name !== undefined) {
      sets.push("name = ?");
      params.push(clampName(updates.name));
    }
    if (updates.description !== undefined) {
      sets.push("description = ?");
      params.push(clampDescription(updates.description));
    }
    if (updates.color !== undefined) {
      sets.push("color = ?");
      params.push(updates.color);
    }
    if (updates.icon !== undefined) {
      sets.push("icon = ?");
      params.push(updates.icon);
    }
    if (updates.startDate !== undefined) {
      sets.push("start_date = ?");
      params.push(updates.startDate);
    }
    if (updates.endDate !== undefined) {
      sets.push("end_date = ?");
      params.push(updates.endDate);
    }

    params.push(id);
    db.runSync(`UPDATE collections SET ${sets.join(", ")} WHERE id = ?`, params);
  },

  /** Memberships are removed by the ON DELETE CASCADE; places are untouched. */
  delete(id: string): void {
    const db = getDatabase();
    db.runSync("DELETE FROM collections WHERE id = ?", [id]);
  },

  getPlacesPaginated(
    collectionId: string,
    limit: number,
    offset: number
  ): Place[] {
    const db = getDatabase();
    return db
      .getAllSync<PlaceRow>(
        `SELECT p.* FROM collection_places cp
         INNER JOIN places p ON p.id = cp.place_id
         WHERE cp.collection_id = ?
         ORDER BY cp.position ASC, cp.added_at ASC
         LIMIT ? OFFSET ?`,
        [collectionId, limit, offset]
      )
      .map(rowToPlace);
  },

  getPlaceCount(collectionId: string): number {
    const db = getDatabase();
    const result = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM collection_places WHERE collection_id = ?",
      [collectionId]
    );
    return result?.count ?? 0;
  },

  /**
   * Adds places to the end of a collection. Ids that do not exist or are
   * already members are skipped; returns how many rows were actually added.
   */
  addPlaces(collectionId: string, placeIds: string[]): number {
    const uniqueIds = Array.from(new Set(placeIds.filter((id) => id.length > 0)));
    if (uniqueIds.length === 0) return 0;

    const db = getDatabase();
    const now = nowISO();
    let position = nextPosition(collectionId);
    let added = 0;

    for (const placeId of uniqueIds) {
      const place = db.getFirstSync<{ id: string }>(
        "SELECT id FROM places WHERE id = ?",
        [placeId]
      );
      if (!place) continue;

      const result = db.runSync(
        `INSERT OR IGNORE INTO collection_places (collection_id, place_id, position, added_at)
         VALUES (?, ?, ?, ?)`,
        [collectionId, placeId, position, now]
      );

      // changes === 0 means the place was already a member.
      if (result.changes > 0) {
        position++;
        added++;
      }
    }

    if (added > 0) {
      touch(collectionId, now);
    }
    return added;
  },

  removePlace(collectionId: string, placeId: string): void {
    const db = getDatabase();
    db.runSync(
      "DELETE FROM collection_places WHERE collection_id = ? AND place_id = ?",
      [collectionId, placeId]
    );
    touch(collectionId, nowISO());
  },

  /**
   * Rewrites positions for a collection. Ids that are not members are ignored,
   * and members missing from the list keep their relative order at the end, so
   * reordering a partially loaded list cannot drop or scramble the remainder.
   */
  setPlaceOrder(collectionId: string, placeIds: string[]): void {
    const db = getDatabase();
    const members = orderedPlaceIds(collectionId);
    if (members.length === 0) return;

    const memberSet = new Set(members);
    const requested = placeIds.filter((id) => memberSet.has(id));
    const requestedSet = new Set(requested);
    const finalOrder = [
      ...requested,
      ...members.filter((id) => !requestedSet.has(id)),
    ];

    db.withTransactionSync(() => {
      finalOrder.forEach((placeId, index) => {
        db.runSync(
          "UPDATE collection_places SET position = ? WHERE collection_id = ? AND place_id = ?",
          [index, collectionId, placeId]
        );
      });
    });

    touch(collectionId, nowISO());
  },

  /** Moves one place one slot up or down. A no-op at either end of the list. */
  movePlace(
    collectionId: string,
    placeId: string,
    direction: "up" | "down"
  ): void {
    const members = orderedPlaceIds(collectionId);
    const index = members.indexOf(placeId);
    if (index === -1) return;

    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= members.length) return;

    const reordered = [...members];
    reordered[index] = members[swapWith];
    reordered[swapWith] = placeId;

    this.setPlaceOrder(collectionId, reordered);
  },

  /** Collections a given place belongs to. */
  getForPlace(placeId: string): Collection[] {
    const db = getDatabase();
    return db
      .getAllSync<CollectionRow>(
        `SELECT c.* FROM collection_places cp
         INNER JOIN collections c ON c.id = cp.collection_id
         WHERE cp.place_id = ?
         ORDER BY c.updated_at DESC`,
        [placeId]
      )
      .map(rowToCollection);
  },

  /**
   * Makes the place's membership exactly match the given collection ids,
   * adding and removing as needed. Used by the picker on the place screen.
   */
  setCollectionsForPlace(placeId: string, collectionIds: string[]): void {
    const db = getDatabase();
    const target = new Set(collectionIds);
    const current = new Set(
      db
        .getAllSync<{ collection_id: string }>(
          "SELECT collection_id FROM collection_places WHERE place_id = ?",
          [placeId]
        )
        .map((row) => row.collection_id)
    );

    for (const collectionId of current) {
      if (!target.has(collectionId)) {
        this.removePlace(collectionId, placeId);
      }
    }
    for (const collectionId of target) {
      if (!current.has(collectionId)) {
        this.addPlaces(collectionId, [placeId]);
      }
    }
  },

  /** Substring match on name and description, for the Search tab. */
  searchByName(query: string, limit: number): CollectionSummary[] {
    const trimmed = query.trim();
    if (!trimmed) return [];

    const db = getDatabase();
    const pattern = `%${escapeLikePattern(trimmed)}%`;

    const rows = db.getAllSync<SummaryRow>(
      `SELECT c.*, COUNT(cp.place_id) as place_count
       FROM collections c
       LEFT JOIN collection_places cp ON cp.collection_id = c.id
       WHERE c.name LIKE ? ESCAPE '\\' OR c.description LIKE ? ESCAPE '\\'
       GROUP BY c.id
       ORDER BY c.updated_at DESC
       LIMIT ?`,
      [pattern, pattern, limit]
    );

    return rows.map((row) => ({
      ...rowToCollection(row),
      placeCount: row.place_count,
      previewNames: [],
    }));
  },

  exportAll(): CollectionExport[] {
    const db = getDatabase();
    const rows = db.getAllSync<CollectionRow>(
      "SELECT * FROM collections ORDER BY created_at DESC"
    );

    return rows.map((row) => ({
      ...rowToCollection(row),
      placeIds: orderedPlaceIds(row.id),
    }));
  },

  /**
   * Inserts a collection preserving its id and timestamps. Used by restore;
   * deliberately transaction-free so the caller can wrap the whole restore.
   */
  insertWithId(collection: Collection): void {
    const db = getDatabase();
    db.runSync(INSERT_COLLECTION_SQL, [
      collection.id,
      collection.name,
      collection.description,
      collection.color,
      collection.icon,
      collection.startDate,
      collection.endDate,
      collection.createdAt,
      collection.updatedAt,
    ]);
  },

  exists(id: string): boolean {
    const db = getDatabase();
    const row = db.getFirstSync<{ id: string }>(
      "SELECT id FROM collections WHERE id = ?",
      [id]
    );
    return !!row;
  },
};
