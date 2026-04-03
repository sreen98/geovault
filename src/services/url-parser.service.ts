export interface ParsedPlace {
  name: string | null;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
}

const SHORT_URL_PATTERNS = ["goo.gl", "maps.app.goo.gl"] as const;
const GOOGLE_MAPS_PATTERNS = ["google.com/maps", "google.co"] as const;
const APPLE_MAPS_PATTERN = "maps.apple.com";

const COORD_REGEX = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
const PLACE_NAME_REGEX = /\/place\/([^/@]+)/;
const QUERY_COORD_REGEX = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
const URL_REGEX = /https?:\/\/[^\s]+/i;

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

function parseCoordinate(value: string): number | null {
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  return num;
}

export async function parseMapUrl(url: string): Promise<ParsedPlace> {
  const resolvedUrl = isShortUrl(url) ? await resolveShortUrl(url) : url;

  if (isGoogleMapsUrl(resolvedUrl)) {
    return parseGoogleMapsUrl(resolvedUrl);
  }

  if (isAppleMapsUrl(resolvedUrl)) {
    return parseAppleMapsUrl(resolvedUrl);
  }

  return { name: null, latitude: null, longitude: null, sourceUrl: url };
}

function parseGoogleMapsUrl(url: string): ParsedPlace {
  const result: ParsedPlace = {
    name: null,
    latitude: null,
    longitude: null,
    sourceUrl: url,
  };

  const coordMatch = url.match(COORD_REGEX);
  if (coordMatch) {
    result.latitude = parseCoordinate(coordMatch[1]);
    result.longitude = parseCoordinate(coordMatch[2]);
  }

  const placeMatch = url.match(PLACE_NAME_REGEX);
  if (placeMatch) {
    result.name = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
  }

  if (result.latitude === null || result.longitude === null) {
    const queryMatch = url.match(QUERY_COORD_REGEX);
    if (queryMatch) {
      result.latitude = parseCoordinate(queryMatch[1]);
      result.longitude = parseCoordinate(queryMatch[2]);
    }
  }

  return result;
}

function parseAppleMapsUrl(url: string): ParsedPlace {
  const result: ParsedPlace = {
    name: null,
    latitude: null,
    longitude: null,
    sourceUrl: url,
  };

  let urlObj: URL;
  try {
    urlObj = new URL(url);
  } catch (_parseError: unknown) {
    return result;
  }

  const ll = urlObj.searchParams.get("ll");
  if (ll) {
    const parts = ll.split(",");
    if (parts.length >= 2) {
      const lat = parseCoordinate(parts[0]);
      const lng = parseCoordinate(parts[1]);
      if (lat !== null && lng !== null) {
        result.latitude = lat;
        result.longitude = lng;
      }
    }
  }

  const q = urlObj.searchParams.get("q");
  if (q) {
    result.name = q;
  }

  return result;
}

export function extractUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}
