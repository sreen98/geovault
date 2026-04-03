import { getDatabase } from "./database";
import { SEED_PLACES } from "./seed";
import { generateId } from "../utils/uuid";
import { nowISO } from "../utils/date";

export function seedDatabase(): number {
  const db = getDatabase();
  const now = nowISO();
  let count = 0;

  for (const place of SEED_PLACES) {
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
    count++;
  }

  db.execSync("INSERT INTO places_fts(places_fts) VALUES('rebuild')");
  return count;
}

export function clearAllPlaces(): void {
  const db = getDatabase();
  db.execSync("DELETE FROM places");
  db.execSync("INSERT INTO places_fts(places_fts) VALUES('rebuild')");
}
