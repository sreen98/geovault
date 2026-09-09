import { Share } from "react-native";
import { Place } from "../types/place.types";
import { Trip, TripMembership } from "../types/trip.types";
import { ExportService, ParsedImport } from "./export.service";
import { TripsRepository } from "../db/trips.repository";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.geovault.app";

// Custom-scheme deep link the app handles at app/import.tsx.
const IMPORT_LINK_PREFIX = "geovault://import?d=";

export interface SharePayload {
  v: number;
  kind: "place" | "trip";
  title: string;
  places: Place[];
  trips: Trip[];
  tripPlaces: TripMembership[];
}

// ── URL-safe base64 (base64url) over UTF-8, self-contained (no btoa/Buffer) ──

const B64 =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function utf8ToBytes(str: string): Uint8Array {
  if (typeof TextEncoder !== "undefined") {
    return new TextEncoder().encode(str);
  }
  const escaped = encodeURIComponent(str);
  const bytes: number[] = [];
  for (let i = 0; i < escaped.length; i++) {
    if (escaped[i] === "%") {
      bytes.push(parseInt(escaped.substr(i + 1, 2), 16));
      i += 2;
    } else {
      bytes.push(escaped.charCodeAt(i));
    }
  }
  return new Uint8Array(bytes);
}

function bytesToUtf8(bytes: Uint8Array): string {
  if (typeof TextDecoder !== "undefined") {
    return new TextDecoder().decode(bytes);
  }
  let percent = "";
  for (let i = 0; i < bytes.length; i++) {
    percent += "%" + bytes[i].toString(16).padStart(2, "0");
  }
  return decodeURIComponent(percent);
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1];
    const b2 = bytes[i + 2];
    out += B64[b0 >> 2];
    out += B64[((b0 & 3) << 4) | ((b1 ?? 0) >> 4)];
    out += i + 1 < bytes.length ? B64[((b1 & 15) << 2) | ((b2 ?? 0) >> 6)] : "";
    out += i + 2 < bytes.length ? B64[b2 & 63] : "";
  }
  return out.replace(/\+/g, "-").replace(/\//g, "_");
}

function base64UrlToBytes(input: string): Uint8Array {
  const clean = input.replace(/-/g, "+").replace(/_/g, "/").replace(/[^A-Za-z0-9+/]/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    const e0 = B64.indexOf(clean[i]);
    const e1 = B64.indexOf(clean[i + 1]);
    const e2 = B64.indexOf(clean[i + 2]);
    const e3 = B64.indexOf(clean[i + 3]);
    bytes.push((e0 << 2) | (e1 >> 4));
    if (clean[i + 2] && e2 >= 0) bytes.push(((e1 & 15) << 4) | (e2 >> 2));
    if (clean[i + 3] && e3 >= 0) bytes.push(((e2 & 3) << 6) | e3);
  }
  return new Uint8Array(bytes);
}

function encodePayload(payload: SharePayload): string {
  return bytesToBase64Url(utf8ToBytes(JSON.stringify(payload)));
}

function isSharePayload(value: unknown): value is SharePayload {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.kind === "place" || v.kind === "trip") &&
    Array.isArray(v.places) &&
    Array.isArray(v.trips) &&
    Array.isArray(v.tripPlaces) &&
    typeof v.title === "string"
  );
}

// Pulls the base64url data token out of a full share message / link, or returns
// the input as-is if it already looks like a bare token. Stops at the first
// whitespace or & so a pasted multi-line message (with the trailing Play Store
// URL) doesn't corrupt the token.
export function extractImportToken(input: string): string | null {
  let data = input.trim();
  const idx = data.indexOf("d=");
  if (idx >= 0 && data.includes("import")) {
    data = data.slice(idx + 2);
  }
  data = data.split(/[\s&]/)[0];
  return data.length > 0 ? data : null;
}

// Accepts either a raw base64url data string or a full geovault://import?d=... link/message.
export function decodeImportData(input: string): SharePayload | null {
  const token = extractImportToken(input);
  if (!token) return null;
  try {
    const json = bytesToUtf8(base64UrlToBytes(token));
    const parsed: unknown = JSON.parse(json);
    return isSharePayload(parsed) ? parsed : null;
  } catch (_error: unknown) {
    return null;
  }
}

function buildMessage(payload: SharePayload): string {
  const link = IMPORT_LINK_PREFIX + encodePayload(payload);
  const label =
    payload.kind === "trip"
      ? `my trip "${payload.title}" (${payload.places.length} places)`
      : `"${payload.title}"`;
  return (
    `Check out ${label} on GeoVault.\n\n` +
    `If you have GeoVault installed, open this link to import it:\n${link}\n\n` +
    `New to GeoVault? Install it first, then open the link above:\n${PLAY_STORE_URL}`
  );
}

export const ShareService = {
  async sharePlace(place: Place): Promise<void> {
    const payload: SharePayload = {
      v: 1,
      kind: "place",
      title: place.name,
      places: [place],
      trips: [],
      tripPlaces: [],
    };
    await Share.share({ message: buildMessage(payload) });
  },

  async shareTrip(trip: Trip): Promise<void> {
    const places = TripsRepository.getPlacesInTrip(trip.id);
    const tripPlaces: TripMembership[] = places.map((p) => ({
      tripId: trip.id,
      placeId: p.id,
      addedAt: p.createdAt,
    }));
    const payload: SharePayload = {
      v: 1,
      kind: "trip",
      title: trip.name,
      places,
      trips: [trip],
      tripPlaces,
    };
    await Share.share({ message: buildMessage(payload) });
  },

  // Imports a decoded payload using the existing append semantics
  // (new records added, existing ids skipped). Returns what was added.
  importPayload(payload: SharePayload): { places: number } {
    const data: ParsedImport = {
      places: payload.places,
      trips: payload.trips,
      tripPlaces: payload.tripPlaces,
    };
    const added = ExportService.importAppend(data);
    return { places: added };
  },
};
