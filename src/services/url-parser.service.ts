export interface ParsedPlace {
  name: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
}

const SHORT_URL_PATTERNS = ["goo.gl", "maps.app.goo.gl"] as const;
const GOOGLE_MAPS_PATTERNS = ["google.com/maps", "google.co"] as const;
const APPLE_MAPS_PATTERN = "maps.apple.com";

const PLACE_NAME_REGEX = /\/place\/([^/@]+)/;
const URL_REGEX = /https?:\/\/[^\s]+/i;

// Google Maps encodes the actual pin coordinates in the data segment as
// !3d<lat>!4d<lng>; the @<lat>,<lng> segment is the map viewport center.
// Prefer the data segment, fall back to the viewport.
const DATA_COORD_REGEX = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/;
const AT_COORD_REGEX = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/;

function cleanPlaceName(raw: string): string {
  // Google/Apple Maps often puts the full formatted address in the place name
  // slug (e.g. "Cake Bliss, Kalpadruma Rd, ..."). Keep only the first segment.
  const first = raw.split(",")[0]?.trim();
  return first || raw.trim();
}

function extractAddress(raw: string): string | null {
  // Everything after the first comma is treated as the address/location.
  const parts = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 1) return null;
  return parts.slice(1).join(", ");
}

function extractCoords(
  url: string
): { latitude: number; longitude: number } | null {
  const dataMatch = url.match(DATA_COORD_REGEX);
  if (dataMatch) {
    return {
      latitude: parseFloat(dataMatch[1]),
      longitude: parseFloat(dataMatch[2]),
    };
  }
  const atMatch = url.match(AT_COORD_REGEX);
  if (atMatch) {
    return {
      latitude: parseFloat(atMatch[1]),
      longitude: parseFloat(atMatch[2]),
    };
  }
  return null;
}

function isShortUrl(url: string): boolean {
  return SHORT_URL_PATTERNS.some((pattern) => url.includes(pattern));
}

function isGoogleMapsUrl(url: string): boolean {
  return GOOGLE_MAPS_PATTERNS.some((pattern) => url.includes(pattern));
}

function isAppleMapsUrl(url: string): boolean {
  return url.includes(APPLE_MAPS_PATTERN);
}

async function resolveShortUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });
    return response.url;
  } catch (_headError: unknown) {
    try {
      const response = await fetch(url, { redirect: "follow" });
      return response.url;
    } catch (_getError: unknown) {
      return url;
    }
  }
}

export async function parseMapUrl(url: string): Promise<ParsedPlace> {
  const resolvedUrl = isShortUrl(url) ? await resolveShortUrl(url) : url;

  if (isGoogleMapsUrl(resolvedUrl)) {
    return parseGoogleMapsUrl(resolvedUrl, url);
  }

  if (isAppleMapsUrl(resolvedUrl)) {
    return parseAppleMapsUrl(resolvedUrl, url);
  }

  return { name: null, location: null, latitude: null, longitude: null, sourceUrl: url };
}

function parseGoogleMapsUrl(url: string, originalUrl: string): ParsedPlace {
  const result: ParsedPlace = {
    name: null,
    location: null,
    latitude: null,
    longitude: null,
    sourceUrl: originalUrl,
  };

  const placeMatch = url.match(PLACE_NAME_REGEX);
  if (placeMatch) {
    const decoded = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    result.name = cleanPlaceName(decoded);
    result.location = extractAddress(decoded);
  }

  const coords = extractCoords(url);
  if (coords) {
    result.latitude = coords.latitude;
    result.longitude = coords.longitude;
  }

  return result;
}

function parseAppleMapsUrl(url: string, originalUrl: string): ParsedPlace {
  const result: ParsedPlace = {
    name: null,
    location: null,
    latitude: null,
    longitude: null,
    sourceUrl: originalUrl,
  };

  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch (_parseError: unknown) {
    return result;
  }

  const q = urlObj.searchParams.get("q");
  if (q) {
    result.name = cleanPlaceName(q);
  }

  const address = urlObj.searchParams.get("address");
  if (address) {
    result.location = address;
  } else if (q) {
    result.location = extractAddress(q);
  }

  const ll = urlObj.searchParams.get("ll") ?? urlObj.searchParams.get("sll");
  if (ll) {
    const [latStr, lngStr] = ll.split(",");
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (!isNaN(lat) && !isNaN(lng)) {
      result.latitude = lat;
      result.longitude = lng;
    }
  }

  return result;
}

export function extractUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}
