export type DignityType = 'domicilio' | 'exaltacao' | 'queda' | 'exilio' | null;

export interface GeoLocation {
  lat: number;
  lon: number;
  name: string;
}

export interface PlanetPosition {
  name: string;
  longitude: number;
  zodiacSign: string;
  signDegree: number;
  signMinute: number;
  glyph: string;
  isRetrograde?: boolean;
  decanate?: 1 | 2 | 3;
  dignity?: DignityType;
  isVirtual?: boolean;
  house?: number;
  houseRuler?: string;
}

export interface ChartData {
  planets: PlanetPosition[];
  houseCusps: number[];
  ascendant: number;
  mc: number;
  descendant: number;
  ic: number;
}

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}
