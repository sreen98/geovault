import { getDatabase } from "./database";
import { PlacesRepository } from "./places.repository";
import { CollectionsRepository } from "./collections.repository";
import { Place } from "../types/place.types";
import { CollectionExport } from "../types/collection.types";

export interface RestorePayload {
  places: Place[];
  collections: CollectionExport[];
}

export interface RestoreResult {
  placeCount: number;
  collectionCount: number;
}

/**
 * Writes the collections and their membership. Places must already be in the
 * database: membership rows for ids that are missing are silently dropped, so
 * a file that references a place it does not carry still restores cleanly.
 */
function writeCollections(
  collections: CollectionExport[],
  skipExisting: boolean
): number {
  const db = getDatabase();
  let written = 0;

  for (const collection of collections) {
    const alreadyPresent = CollectionsRepository.exists(collection.id);

    if (alreadyPresent && skipExisting) {
      // Still merge membership into the collection that is already here.
      CollectionsRepository.addPlaces(collection.id, collection.placeIds);
      db.runSync("UPDATE collections SET updated_at = ? WHERE id = ?", [
        collection.updatedAt,
        collection.id,
      ]);
      continue;
    }

    if (!alreadyPresent) {
      CollectionsRepository.insertWithId(collection);
      written++;
    }

    CollectionsRepository.addPlaces(collection.id, collection.placeIds);

    // addPlaces bumps updated_at; restore the timestamp from the file so the
    // imported collection keeps its own history.
    db.runSync("UPDATE collections SET updated_at = ? WHERE id = ?", [
      collection.updatedAt,
      collection.id,
    ]);
  }

  return written;
}

/**
 * Replaces the entire database with the payload. Runs in one transaction: a
 * failure part-way through leaves the existing data untouched rather than a
 * half-empty vault.
 */
export function restoreOverwrite(payload: RestorePayload): RestoreResult {
  const db = getDatabase();
  let collectionCount = 0;

  db.withTransactionSync(() => {
    // Deleting places cascades into collection_places; collections are cleared
    // explicitly because nothing cascades into them.
    db.execSync("DELETE FROM places");
    db.execSync("DELETE FROM collections");

    for (const place of payload.places) {
      PlacesRepository.insertWithId(place);
    }

    collectionCount = writeCollections(payload.collections, false);

    db.execSync("INSERT INTO places_fts(places_fts) VALUES('rebuild')");
  });

  return { placeCount: payload.places.length, collectionCount };
}

/**
 * Merges the payload into the existing data. Places and collections that are
 * already present (matched by id) are kept as they are, but membership from
 * the file is still merged into them.
 */
export function restoreAppend(payload: RestorePayload): RestoreResult {
  const db = getDatabase();
  let placeCount = 0;
  let collectionCount = 0;

  db.withTransactionSync(() => {
    for (const place of payload.places) {
      if (PlacesRepository.exists(place.id)) continue;
      PlacesRepository.insertWithId(place);
      placeCount++;
    }

    collectionCount = writeCollections(payload.collections, true);

    if (placeCount > 0) {
      db.execSync("INSERT INTO places_fts(places_fts) VALUES('rebuild')");
    }
  });

  return { placeCount, collectionCount };
}
