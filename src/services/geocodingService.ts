import type { NominatimResult } from '../types/astro';

export async function searchLocation(query: string): Promise<NominatimResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5`;
    // Navegadores/WebView não permitem definir User-Agent; o Nominatim identifica pelo Referer
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data.map((item: any) => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
    }));
  } catch {
    return [];
  }
}
