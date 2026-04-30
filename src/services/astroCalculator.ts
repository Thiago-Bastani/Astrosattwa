import * as Astronomy from 'astronomy-engine';
import type { GeoLocation, ChartData, PlanetPosition, MoonPhase } from '../types/astro';
import { getZodiacSign, getDecanate, getDignity, getHouseFromLongitude, getSignRuler, getRulerSignDignities, PLANET_GLYPHS } from '../utils/zodiac';

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

/**
 * Lahiri (Chitrapaksha) ayanamsa — padrão oficial da astrologia indiana (IAU).
 * Converte longitude tropical → sideral: sidereal = tropical - ayanamsa
 */
function calculateLahiriAyanamsa(date: Date): number {
  const T = dateToJulianCenturies(date);
  // 23.85° em J2000.0, precessão de ~1.3972°/século
  return 23.85 + 1.3972 * T;
}

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

/* ── Quíron ── */

function calculateChiron(date: Date): number {
  const T = dateToJulianCenturies(date);
  const daysFromJ2000 = T * 36525;

  // Elementos orbitais de Quíron no J2000.0
  const e = 0.37911;           // excentricidade
  const omega = 339.557;       // argumento do periélio (°)
  const node = 209.385;        // longitude do nodo ascendente (°)
  const M0 = 68.944;           // anomalia média no J2000 (°)
  const n = 0.01955;           // movimento médio diário (°/dia)

  // Anomalia média
  const M = normalizeDeg(M0 + n * daysFromJ2000);
  const Mrad = M * Math.PI / 180;

  // Resolver equação de Kepler iterativamente: E - e*sin(E) = M
  let E = Mrad;
  for (let i = 0; i < 15; i++) {
    E = Mrad + e * Math.sin(E);
  }

  // Anomalia verdadeira
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  ) * 180 / Math.PI;

  // Longitude eclíptica heliocêntrica (aproximada, ignorando inclinação ~7°)
  return normalizeDeg(trueAnomaly + omega + node);
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

/* ── Fase da Lua ── */

function calculateMoonPhase(date: Date): MoonPhase {
  // Usa longitudes tropicais — a diferença Sol/Lua é idêntica em qualquer sistema
  const sunLon  = getPlanetLongitude('Sun', date);
  const moonLon = getPlanetLongitude('Moon', date);
  const angle   = normalizeDeg(moonLon - sunLon);
  const illumination = Math.round((1 - Math.cos(angle * DEG)) / 2 * 100);

  let name: string;
  let emoji: string;

  if (angle < 22.5 || angle >= 337.5)       { name = 'Lua Nova';            emoji = '🌑'; }
  else if (angle < 67.5)                     { name = 'Crescente';           emoji = '🌒'; }
  else if (angle < 112.5)                    { name = 'Quarto Crescente';    emoji = '🌓'; }
  else if (angle < 157.5)                    { name = 'Gibosa Crescente';    emoji = '🌔'; }
  else if (angle < 202.5)                    { name = 'Lua Cheia';           emoji = '🌕'; }
  else if (angle < 247.5)                    { name = 'Gibosa Minguante';    emoji = '🌖'; }
  else if (angle < 292.5)                    { name = 'Quarto Minguante';    emoji = '🌗'; }
  else                                       { name = 'Minguante';           emoji = '🌘'; }

  return { name, emoji, illumination, angle };
}

/* ── Chart principal ── */

export type ZodiacSystem = 'sidereal' | 'tropical';

export function calculateChart(date: Date, location: GeoLocation, zodiacSystem: ZodiacSystem = 'sidereal'): ChartData {
  const ayanamsa = zodiacSystem === 'sidereal' ? calculateLahiriAyanamsa(date) : 0;

  // Ângulos — subtraí ayanamsa apenas no sistema sideral
  const tropAngles = calculateAnglesForLat(date, location.lon, location.lat);
  const ascendant = normalizeDeg(tropAngles.ascendant - ayanamsa);
  const mc = normalizeDeg(tropAngles.mc - ayanamsa);
  const descendant = normalizeDeg(ascendant + 180);
  const ic = normalizeDeg(mc + 180);

  const houseCusps = Array.from({ length: 12 }, (_, i) => normalizeDeg(ascendant + i * 30));

  const planets: PlanetPosition[] = PLANET_BODIES.map(({ name, body }) => {
    const longitude = normalizeDeg(getPlanetLongitude(body, date) - ayanamsa);
    const { sign, degree, minute } = getZodiacSign(longitude);
    const house = getHouseFromLongitude(longitude, houseCusps);
    const houseSign = getZodiacSign(houseCusps[house - 1]).sign.name;
    const houseRuler = getSignRuler(houseSign);
    const rulerSignDignities = houseRuler ? getRulerSignDignities(name, houseRuler) : [];
    
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
      rulerSignDignities,
    };
  });

  // Pontos virtuais
  const virtualPoints: { name: string; longitude: number }[] = [
    { name: 'Chiron',    longitude: normalizeDeg(calculateChiron(date) - ayanamsa) },
    { name: 'Lilith',    longitude: normalizeDeg(calculateMeanLilith(date) - ayanamsa) },
    { name: 'NorthNode', longitude: normalizeDeg(calculateNorthNode(date) - ayanamsa) },
    { name: 'SouthNode', longitude: normalizeDeg(calculateNorthNode(date) + 180 - ayanamsa) },
    { name: 'Vertex',    longitude: normalizeDeg(calculateVertex(date, location) - ayanamsa) },
  ];

  for (const vp of virtualPoints) {
    const { sign, degree, minute } = getZodiacSign(vp.longitude);
    const house = getHouseFromLongitude(vp.longitude, houseCusps);
    const houseSign = getZodiacSign(houseCusps[house - 1]).sign.name;
    const houseRuler = getSignRuler(houseSign);
    const rulerSignDignities = houseRuler ? getRulerSignDignities(vp.name, houseRuler) : [];
    
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
      rulerSignDignities,
    });
  }

  const moonPhase = calculateMoonPhase(date);

  return { planets, houseCusps, ascendant, mc, descendant, ic, moonPhase, zodiacSystem };
}
