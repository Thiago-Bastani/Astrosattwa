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
  rulerSignDignities?: { sign: string; dignity: DignityType }[];
}

export interface LunarMansion {
  number: number; // 1–27
  name: string;   // nome sânscrito
}

export interface MoonPhase {
  name: string;
  emoji: string;
  illumination: number; // 0–100 %
  angle: number;        // 0–360 °
  lunarMansion: LunarMansion;
}

export type ZodiacSystem = 'sidereal' | 'tropical';

export interface ChartData {
  planets: PlanetPosition[];
  houseCusps: number[];
  ascendant: number;
  mc: number;
  descendant: number;
  ic: number;
  moonPhase: MoonPhase;
  zodiacSystem: ZodiacSystem;
}

export interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}
