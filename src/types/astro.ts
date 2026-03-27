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
}

export interface ChartData {
  planets: PlanetPosition[];
  houseCusps: number[];
  ascendant: number;
}
