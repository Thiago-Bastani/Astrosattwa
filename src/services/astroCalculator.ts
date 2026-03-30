import * as Astronomy from 'astronomy-engine';
import type { GeoLocation, ChartData, PlanetPosition } from '../types/astro';
import { getZodiacSign, getDecanate, getDignity, getHouseFromLongitude, getSignRuler, PLANET_GLYPHS } from '../utils/zodiac';

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

/* ── Retrogradação ── */

function checkRetrograde(bodyName: string, date: Date): boolean {
  // Sol e Lua nunca são retrógrados
  if (bodyName === 'Sun' || bodyName === 'Moon') return false;

  const lon1 = getPlanetLongitude(bodyName, date);
  const nextDay = new Date(date.getTime() + 86400000);
  const lon2 = getPlanetLongitude(bodyName, nextDay);

  let diff = lon2 - lon1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff < 0;
}

/* ── Pontos virtuais ── */

function dateToJulianCenturies(date: Date): number {
  const jd = date.getTime() / 86400000 + 2440587.5;
  return (jd - 2451545.0) / 36525.0;
}

function calculateMeanLilith(date: Date): number {
  const T = dateToJulianCenturies(date);
  const L = 83.3532364 + 4069.0137287 * T + 0.0103238 * T * T;
  return normalizeDeg(L);
}

function calculateNorthNode(date: Date): number {
  const T = dateToJulianCenturies(date);
  const omega = 125.0445479
    - 1934.1362891 * T
    + 0.0020754 * T * T
    + (T * T * T) / 467441
    - (T * T * T * T) / 60616000;
  return normalizeDeg(omega);
}

/* ── Ângulos ── */

function calculateAnglesForLat(date: Date, lon: number, lat: number): { ascendant: number; mc: number } {
  const time = Astronomy.MakeTime(date);
  const gst = Astronomy.SiderealTime(time);
  const lst = ((gst + lon / 15) % 24 + 24) % 24;
  const ramcDeg = lst * 15;
  const ramcRad = ramcDeg * DEG;

  const obliquity = 23.4393;
  const oblRad = obliquity * DEG;
  const latRad = lat * DEG;

  const mc = normalizeDeg(Math.atan2(Math.sin(ramcRad), Math.cos(ramcRad) * Math.cos(oblRad)) / DEG);

  const y = Math.cos(ramcRad);
  const x = -(Math.sin(ramcRad) * Math.cos(oblRad) + Math.tan(latRad) * Math.sin(oblRad));
  const asc = normalizeDeg(Math.atan2(y, x) / DEG);

  return { ascendant: asc, mc };
}

function calculateVertex(date: Date, location: GeoLocation): number {
  const coLat = Math.min(Math.max(90 - location.lat, -85), 85);
  const { ascendant } = calculateAnglesForLat(date, location.lon, coLat);
  return normalizeDeg(ascendant + 180);
}

/* ── Chart principal ── */

export function calculateChart(date: Date, location: GeoLocation): ChartData {
  // Ângulos (calcular primeiro para ter as casas)
  const { ascendant, mc } = calculateAnglesForLat(date, location.lon, location.lat);
  const descendant = normalizeDeg(ascendant + 180);
  const ic = normalizeDeg(mc + 180);

  const houseCusps = Array.from({ length: 12 }, (_, i) => normalizeDeg(ascendant + i * 30));

  // Planetas reais
  const planets: PlanetPosition[] = PLANET_BODIES.map(({ name, body }) => {
    const longitude = getPlanetLongitude(body, date);
    const { sign, degree, minute } = getZodiacSign(longitude);
    const house = getHouseFromLongitude(longitude, houseCusps);
    const houseSign = getZodiacSign(houseCusps[house - 1]).sign.name;
    const houseRuler = getSignRuler(houseSign);
    
    return {
      name,
      longitude,
      zodiacSign: sign.name,
      signDegree: degree,
      signMinute: minute,
      glyph: PLANET_GLYPHS[name],
      isRetrograde: checkRetrograde(body, date),
      decanate: getDecanate(degree),
      dignity: getDignity(name, sign.name),
      house,
      houseRuler,
    };
  });

  // Pontos virtuais
  const virtualPoints: { name: string; longitude: number }[] = [
    { name: 'Lilith',    longitude: calculateMeanLilith(date) },
    { name: 'NorthNode', longitude: calculateNorthNode(date) },
    { name: 'SouthNode', longitude: normalizeDeg(calculateNorthNode(date) + 180) },
    { name: 'Vertex',    longitude: calculateVertex(date, location) },
  ];

  for (const vp of virtualPoints) {
    const { sign, degree, minute } = getZodiacSign(vp.longitude);
    const house = getHouseFromLongitude(vp.longitude, houseCusps);
    const houseSign = getZodiacSign(houseCusps[house - 1]).sign.name;
    const houseRuler = getSignRuler(houseSign);
    
    planets.push({
      name: vp.name,
      longitude: vp.longitude,
      zodiacSign: sign.name,
      signDegree: degree,
      signMinute: minute,
      glyph: PLANET_GLYPHS[vp.name],
      isRetrograde: false,
      decanate: getDecanate(degree),
      dignity: null,
      isVirtual: true,
      house,
      houseRuler,
    });
  }

  return { planets, houseCusps, ascendant, mc, descendant, ic };
}
