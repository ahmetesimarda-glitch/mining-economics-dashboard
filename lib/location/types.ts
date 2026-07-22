/**
 * Location normalization + geocoding helpers.
 * Prepares for future GIS layers without changing MiningProject schema yet.
 */

export interface NormalizedLocation {
  displayName: string;
  country: string;
  state: string;
  city: string;
  latitude: number;
  longitude: number;
  providerPlaceId?: string;
}

export interface LocationSearchResult {
  id: string;
  label: string;
  country: string;
  state: string;
  city: string;
  latitude: number;
  longitude: number;
}

/** Build a stable "City, State, Country" display string. */
export function formatNormalizedLocation(parts: {
  city?: string;
  state?: string;
  country?: string;
}): string {
  return [parts.city, parts.state, parts.country]
    .map((p) => (p ?? '').trim())
    .filter(Boolean)
    .join(', ');
}

export function normalizeLocationSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').slice(0, 120);
}
