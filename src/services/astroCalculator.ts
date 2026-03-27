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

function getPlanetLongitude(bodyName: string, date: Date): number {
  const time = Astronomy.MakeTime(date);

  if (bodyName === 'Sun') {
    const sunPos = Astronomy.SunPosition(time);
    return sunPos.elon;
  }

  if (bodyName === 'Moon') {
    const moonPos = Astronomy.EclipticGeoMoon(time);
    return moonPos.lon;
  }

  const geo = Astronomy.GeoVector(bodyName as Astronomy.Body, time, true);
  const ecl = Astronomy.Ecliptic(geo);
  return ecl.elon;
}

function calculateAscendant(date: Date, location: GeoLocation): number {
  const time = Astronomy.MakeTime(date);
  const gst = Astronomy.SiderealTime(time);
  const lst = (gst + location.lon / 15 + 24) % 24;
  const ramcDeg = lst * 15;
  const ramcRad = (ramcDeg * Math.PI) / 180;
  const obliquity = 23.4393;
  const oblRad = (obliquity * Math.PI) / 180;
  const latRad = (location.lat * Math.PI) / 180;

  const y = -Math.cos(ramcRad);
  const x = Math.sin(ramcRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad);
  let asc = (Math.atan2(y, x) * 180) / Math.PI;

  asc = ((asc % 360) + 360) % 360;
  return asc;
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

  const ascendant = calculateAscendant(date, location);
  const houseCusps = Array.from({ length: 12 }, (_, i) => (ascendant + i * 30) % 360);

  return { planets, houseCusps, ascendant };
}
