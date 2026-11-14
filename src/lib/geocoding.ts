export type GeocodingAccuracy = 'exact' | 'street' | 'area';

export interface GeocodingResult {
  placeId: string;
  displayName: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  type: string;
  accuracy: GeocodingAccuracy;
}

interface RawNominatimItem {
  place_id: number | string;
  lat: string;
  lon: string;
  display_name: string;
  type: string;
  class: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
    [key: string]: string | undefined;
  };
}

export function determineAccuracy(type: string, address?: RawNominatimItem['address']): GeocodingAccuracy {
  if (
    type === 'house' ||
    type === 'building' ||
    type === 'commercial' ||
    type === 'retail' ||
    type === 'apartments' ||
    Boolean(address?.house_number)
  ) {
    return 'exact';
  }
  if (
    type === 'street' ||
    type === 'road' ||
    type === 'residential' ||
    type === 'highway' ||
    type === 'secondary' ||
    type === 'tertiary' ||
    type === 'track' ||
    type === 'path'
  ) {
    return 'street';
  }
  return 'area';
}

/**
 * Searches OpenStreetMap Nominatim for locations matching the query.
 * Throws only on actual fetch errors or non-abort network issues.
 */
export async function searchAddress(query: string, signal?: AbortSignal): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 3) return [];

  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    trimmed,
  )}&addressdetails=1&limit=5`;

  const res = await fetch(url, {
    signal,
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
    },
  });

  if (!res.ok) {
    throw new Error(`Location lookup failed (${res.status})`);
  }

  const items = (await res.json()) as RawNominatimItem[];

  return items.map((item) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const accuracy = determineAccuracy(item.type, item.address);

    const parts = item.display_name.split(',').map((p) => p.trim());
    const title = parts[0] || item.display_name;
    const subtitle = parts.slice(1).join(', ');

    return {
      placeId: String(item.place_id),
      displayName: item.display_name,
      title,
      subtitle,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      type: item.type,
      accuracy,
    };
  });
}
