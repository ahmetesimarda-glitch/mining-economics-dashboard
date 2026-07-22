import type { LocationSearchResult } from './types';
import { formatNormalizedLocation, normalizeLocationSearchQuery } from './types';

interface NominatimItem {
  place_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
  address?: {
    country?: string;
    state?: string;
    region?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
  };
}

/**
 * Server-side Nominatim search (OpenStreetMap).
 * Free-text supports country / state / city queries.
 */
export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const q = normalizeLocationSearchQuery(query);
  if (q.length < 2) return [];

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '6');

  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MiningEconomicsDashboard/1.0 (demo location search)',
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) return [];
  const raw = (await res.json()) as NominatimItem[];

  return (raw ?? []).map((item, index) => {
    const city =
      item.address?.city ||
      item.address?.town ||
      item.address?.village ||
      item.address?.municipality ||
      item.address?.county ||
      '';
    const state = item.address?.state || item.address?.region || '';
    const country = item.address?.country || '';
    const label =
      formatNormalizedLocation({ city, state, country }) ||
      item.display_name ||
      q;

    return {
      id: String(item.place_id ?? `${index}-${item.lat}-${item.lon}`),
      label,
      country,
      state,
      city,
      latitude: Number(item.lat ?? 0),
      longitude: Number(item.lon ?? 0),
    };
  });
}

export type { LocationSearchResult, NormalizedLocation } from './types';
export { formatNormalizedLocation, normalizeLocationSearchQuery } from './types';
