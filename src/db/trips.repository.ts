import { getDatabase } from "./database";
import {
  Trip,
  NewTrip,
  TripRow,
  TripMembership,
  TripPlaceRow,
  rowToTrip,
} from "../types/trip.types";
import { Place, PlaceRow, rowToPlace } from "../types/place.types";
import { generateId } from "../utils/uuid";
import { nowISO } from "../utils/date";

const SELECT_WITH_COUNT = `
  SELECT t.*, (
    SELECT COUNT(*) FROM trip_places tp WHERE tp.trip_id = t.id
  ) AS place_count
  FROM trips t
`;

export const TripsRepository = {
  getPaginated(limit: number, offset: number): Trip[] {
    const db = getDatabase();
    return db
      .getAllSync<TripRow>(
        `${SELECT_WITH_COUNT} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
        [limit, offset]
      )
      .map(rowToTrip);
  },

  getFilteredCount(): number {
    const db = getDatabase();
    const result = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM trips"
    );
    return result?.count ?? 0;
  },

  getById(id: string): Trip | null {
    const db = getDatabase();
    const row = db.getFirstSync<TripRow>(
      `${SELECT_WITH_COUNT} WHERE t.id = ?`,
      [id]
    );
    return row ? rowToTrip(row) : null;
  },

  insert(trip: NewTrip): Trip {
    const db = getDatabase();
    const now = nowISO();
    const id = generateId();

    db.runSync(
      `INSERT INTO trips (id, name, description, color, icon, start_date, end_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        trip.name,
        trip.description,
        trip.color,
        trip.icon,
        trip.startDate,
        trip.endDate,
        now,
        now,
      ]
    );

    return {
      ...trip,
      id,
      createdAt: now,
      updatedAt: now,
      placeCount: 0,
    };
  },

  update(id: string, updates: Partial<NewTrip>): void {
    const db = getDatabase();
    const now = nowISO();
    const sets: string[] = ["updated_at = ?"];
    const params: (string | number | null)[] = [now];

    if (updates.name !== undefined) {
      sets.push("name = ?");
      params.push(updates.name);
    }
    if (updates.description !== undefined) {
      sets.push("description = ?");
      params.push(updates.description);
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
    db.runSync(`UPDATE trips SET ${sets.join(", ")} WHERE id = ?`, params);
  },

  delete(id: string): void {
    const db = getDatabase();
    // trip_places rows are removed automatically via ON DELETE CASCADE.
    db.runSync("DELETE FROM trips WHERE id = ?", [id]);
  },

  // --- Membership ---

  addPlace(tripId: string, placeId: string): void {
    const db = getDatabase();
    db.runSync(
      "INSERT OR IGNORE INTO trip_places (trip_id, place_id, added_at) VALUES (?, ?, ?)",
      [tripId, placeId, nowISO()]
    );
  },

  removePlace(tripId: string, placeId: string): void {
    const db = getDatabase();
    db.runSync(
      "DELETE FROM trip_places WHERE trip_id = ? AND place_id = ?",
      [tripId, placeId]
    );
  },

  getPlacesInTrip(tripId: string): Place[] {
    const db = getDatabase();
    return db
      .getAllSync<PlaceRow>(
        `SELECT p.* FROM places p
         INNER JOIN trip_places tp ON tp.place_id = p.id
         WHERE tp.trip_id = ?
         ORDER BY tp.added_at DESC`,
        [tripId]
      )
      .map(rowToPlace);
  },

  getPlaceIdsInTrip(tripId: string): string[] {
    const db = getDatabase();
    return db
      .getAllSync<{ place_id: string }>(
        "SELECT place_id FROM trip_places WHERE trip_id = ?",
        [tripId]
      )
      .map((row) => row.place_id);
  },

  getTripsForPlace(placeId: string): Trip[] {
    const db = getDatabase();
    return db
      .getAllSync<TripRow>(
        `${SELECT_WITH_COUNT}
         INNER JOIN trip_places tp ON tp.trip_id = t.id
         WHERE tp.place_id = ?
         ORDER BY t.created_at DESC`,
        [placeId]
      )
      .map(rowToTrip);
  },

  setPlacesForTrip(tripId: string, placeIds: string[]): void {
    const db = getDatabase();
    const now = nowISO();
    db.withTransactionSync(() => {
      db.runSync("DELETE FROM trip_places WHERE trip_id = ?", [tripId]);
      for (const placeId of placeIds) {
        db.runSync(
          "INSERT OR IGNORE INTO trip_places (trip_id, place_id, added_at) VALUES (?, ?, ?)",
          [tripId, placeId, now]
        );
      }
    });
  },

  // --- Backup / export ---

  exportAll(): Trip[] {
    const db = getDatabase();
    return db
      .getAllSync<TripRow>(
        `${SELECT_WITH_COUNT} ORDER BY t.created_at DESC`
      )
      .map(rowToTrip);
  },

  exportMemberships(): TripMembership[] {
    const db = getDatabase();
    return db
      .getAllSync<TripPlaceRow>(
        "SELECT trip_id, place_id, added_at FROM trip_places"
      )
      .map((row) => ({
        tripId: row.trip_id,
        placeId: row.place_id,
        addedAt: row.added_at,
      }));
  },

  importAll(trips: Trip[], memberships: TripMembership[]): void {
    const db = getDatabase();
    db.execSync("DELETE FROM trip_places");
    db.execSync("DELETE FROM trips");

    for (const trip of trips) {
      db.runSync(
        `INSERT INTO trips (id, name, description, color, icon, start_date, end_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trip.id,
          trip.name,
          trip.description ?? "",
          trip.color ?? "",
          trip.icon ?? "",
          trip.startDate ?? null,
          trip.endDate ?? null,
          trip.createdAt,
          trip.updatedAt,
        ]
      );
    }

    this.insertMemberships(memberships);
  },

  appendAll(trips: Trip[], memberships: TripMembership[]): number {
    const db = getDatabase();
    let added = 0;

    for (const trip of trips) {
      const existing = db.getFirstSync<{ id: string }>(
        "SELECT id FROM trips WHERE id = ?",
        [trip.id]
      );
      if (existing) continue;

      db.runSync(
        `INSERT INTO trips (id, name, description, color, icon, start_date, end_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          trip.id,
          trip.name,
          trip.description ?? "",
          trip.color ?? "",
          trip.icon ?? "",
          trip.startDate ?? null,
          trip.endDate ?? null,
          trip.createdAt,
          trip.updatedAt,
        ]
      );
      added++;
    }

    this.insertMemberships(memberships);
    return added;
  },

  // Inserts membership rows, ignoring any whose trip or place no longer exists
  // (INSERT OR IGNORE also skips duplicates and FK violations gracefully).
  insertMemberships(memberships: TripMembership[]): void {
    const db = getDatabase();
    for (const m of memberships) {
      const trip = db.getFirstSync<{ id: string }>(
        "SELECT id FROM trips WHERE id = ?",
        [m.tripId]
      );
      const place = db.getFirstSync<{ id: string }>(
        "SELECT id FROM places WHERE id = ?",
        [m.placeId]
      );
      if (!trip || !place) continue;

      db.runSync(
        "INSERT OR IGNORE INTO trip_places (trip_id, place_id, added_at) VALUES (?, ?, ?)",
        [m.tripId, m.placeId, m.addedAt]
      );
    }
  },

  getCount(): number {
    const db = getDatabase();
    const result = db.getFirstSync<{ count: number }>(
      "SELECT COUNT(*) as count FROM trips"
    );
    return result?.count ?? 0;
  },
};
