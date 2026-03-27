import * as Astronomy from 'astronomy-engine';
import type { GeoLocation, ChartData, PlanetPosition } from '../types/astro';
import { getZodiacSign, PLANET_GLYPHS } from '../utils/zodiac';

const PLANET_BODIES: { name: string; body: string }[] = [
  { name: 'Sun',     body: 'Sun' },
  { name: 'Moon',    body: 'Moon' },
  { name: 'Mercury', body: 'Mercury' },
  { name: 'Venus',   body: 'Venus' },
  { name: 'Mars',    body: 'Mars' },
  { name: 'Jupiter', body: 'Jupiter' },
  { name: 'Saturn',  body: 'Saturn' },
  { name: 'Uranus',  body: 'Uranus' },
  { name: 'Neptune', body: 'Neptune' },
  { name: 'Pluto',   body: 'Pluto' },
];

const DEG = Math.PI / 180;

function getPlanetLongitude(bodyName: string, date: Date): number {
  const time = Astronomy.MakeTime(date);

  if (bodyName === 'Sun') {
    return Astronomy.SunPosition(time).elon;
  }

  if (bodyName === 'Moon') {
    return Astronomy.EclipticGeoMoon(time).lon;
  }

  const geo = Astronomy.GeoVector(bodyName as Astronomy.Body, time, true);
  return Astronomy.Ecliptic(geo).elon;
}

function normalizeDeg(d: number): number {
  return ((d % 360) + 360) % 360;
}

function calculateAngles(date: Date, location: GeoLocation): { ascendant: number; mc: number } {
  const time = Astronomy.MakeTime(date);
  const gst = Astronomy.SiderealTime(time);
  const lst = ((gst + location.lon / 15) % 24 + 24) % 24;
  const ramcDeg = lst * 15;
  const ramcRad = ramcDeg * DEG;

  const obliquity = 23.4393;
  const oblRad = obliquity * DEG;
  const latRad = location.lat * DEG;

  // MC (Meio do Ceu): ecliptic longitude of the meridian
  // tan(MC) = tan(RAMC) / cos(obliquity)
  // atan2 handles quadrant correctly without extra correction
  const mc = normalizeDeg(Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(oblRad)) / DEG);

  // ASC (Ascendente)
  // tan(ASC) = -cos(RAMC) / (sin(RAMC)*cos(obl) + tan(lat)*sin(obl))
  const y = -Math.cos(ramcRad);
  const x = Math.sin(ramcRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad);
  const asc = normalizeDeg(Math.atan2(y, x) / DEG);

  return { ascendant: asc, mc };
}

export function calculateChart(date: Date, location: GeoLocation): ChartData {
  const planets: PlanetPosition[] = PLANET_BODIES.map(({ name, body }) => {
    const longitude = getPlanetLongitude(body, date);
    const { sign, degree, minute } = getZodiacSign(longitude);
    return {
      name,
      longitude,
      zodiacSign: sign.name,
      signDegree: degree,
      signMinute: minute,
      glyph: PLANET_GLYPHS[name],
    };
  });

  const { ascendant, mc } = calculateAngles(date, location);
  const descendant = normalizeDeg(ascendant + 180);
  const ic = normalizeDeg(mc + 180);

  // Equal House: casa 1 comeca exatamente no ascendente, cada casa = 30 graus
  const houseCusps = Array.from({ length: 12 }, (_, i) => normalizeDeg(ascendant + i * 30));

  return { planets, houseCusps, ascendant, mc, descendant, ic };
}
