export interface ParsedPlace {
  name: string | null;
  sourceUrl: string;
}

const SHORT_URL_PATTERNS = ["goo.gl", "maps.app.goo.gl"] as const;
const GOOGLE_MAPS_PATTERNS = ["google.com/maps", "google.co"] as const;
const APPLE_MAPS_PATTERN = "maps.apple.com";

const PLACE_NAME_REGEX = /\/place\/([^/@]+)/;
const URL_REGEX = /https?:\/\/[^\s]+/i;

function cleanPlaceName(raw: string): string {
  // Google/Apple Maps often puts the full formatted address in the place name
  // slug (e.g. "Cake Bliss, Kalpadruma Rd, ..."). Keep only the first segment.
  const first = raw.split(",")[0]?.trim();
  return first || raw.trim();
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
    return parseGoogleMapsUrl(resolvedUrl);
  }

  if (isAppleMapsUrl(resolvedUrl)) {
    return parseAppleMapsUrl(resolvedUrl);
  }

  return { name: null, sourceUrl: url };
}

function parseGoogleMapsUrl(url: string): ParsedPlace {
  const result: ParsedPlace = { name: null, sourceUrl: url };

  const placeMatch = url.match(PLACE_NAME_REGEX);
  if (placeMatch) {
    const decoded = decodeURIComponent(placeMatch[1].replace(/\+/g, " "));
    result.name = cleanPlaceName(decoded);
  }

  return result;
}

function parseAppleMapsUrl(url: string): ParsedPlace {
  const result: ParsedPlace = { name: null, sourceUrl: url };

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

  return result;
}

export function extractUrl(text: string): string | null {
  const match = text.match(URL_REGEX);
  return match ? match[0] : null;
}
