import type { NominatimResult } from '../types/astro';

const NOMINATIM = 'https://nominatim.openstreetmap.org';

interface NominatimSearchItem {
  display_name: string;
  lat: string;
  lon: string;
}

interface NominatimReverse {
  address?: Record<string, string>;
  display_name?: string;
}

export async function searchLocation(query: string): Promise<NominatimResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `${NOMINATIM}/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5`;
    // Navegadores/WebView não permitem definir User-Agent; o Nominatim identifica pelo Referer
    const res = await fetch(url);
    if (!res.ok) return [];
    const data: NominatimSearchItem[] = await res.json();
    return data.map(item => ({
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
    }));
  } catch {
    return [];
  }
}

/**
 * Nome legível de uma coordenada ("Cidade, Estado, País") pelo Nominatim.
 * Retorna null se o serviço falhar (o chamador usa as coordenadas como nome).
 */
export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const url = `${NOMINATIM}/reverse?format=json&lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&zoom=10&accept-language=pt-BR`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data: NominatimReverse = await res.json();
    const a = data.address ?? {};
    const city = a.city || a.town || a.village || a.municipality || a.county;
    const parts = [city, a.state, a.country].filter(Boolean);
    return parts.length ? parts.join(', ') : data.display_name ?? null;
  } catch {
    return null;
  }
}
