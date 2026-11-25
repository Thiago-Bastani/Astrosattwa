import type { ChartData, GeoLocation, ZodiacSystem } from '../types/astro';
import type { PlanetaryDay } from './planetary';
import { calculateChart } from '../services/astroCalculator';
import { SIGN_RULERS, combustGrahas, muhurtaChecks, retrogrades, tithiOf, westernMoon, type MuhurtaCheck, type NextAspect } from './electionalReading';

/**
 * O dia eletivo inteiro: o céu é recalculado ao longo do dia (no zodíaco do app) e cada
 * fator vira uma lista de períodos com início e fim, refinados até o minuto.
 */

export interface Period<T> { start: Date; end: Date; value: T }

const STEP = 10 * 60_000; // amostragem
const PRECISION = 30_000; // refino das fronteiras

/** Dia védico/planetário (nascer ao nascer do sol); sem nascer do sol, o dia civil. */
export function dayWindow(day: PlanetaryDay | null, date: Date): { start: Date; end: Date } {
  if (day) return { start: day.sunrise, end: day.nextSunrise };
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return { start, end: new Date(start.getTime() + 24 * 3600_000) };
}

function timeline<T>(start: number, end: number, at: (t: number) => T, key: (v: T) => string): Period<T>[] {
  const out: Period<T>[] = [];
  let segStart = start;
  let value = at(start);
  let k = key(value);
  let prev = start;
  for (let t = Math.min(start + STEP, end); ; t = Math.min(t + STEP, end)) {
    const v = at(t);
    if (key(v) !== k) {
      // Bissecção entre a última amostra igual e a primeira diferente
      let a = prev, b = t;
      while (b - a > PRECISION) {
        const mid = (a + b) / 2;
        if (key(at(mid)) === k) a = mid; else b = mid;
      }
      out.push({ start: new Date(segStart), end: new Date(b), value });
      segStart = b;
      value = at(b);
      k = key(value);
    }
    prev = t;
    if (t >= end) break;
  }
  out.push({ start: new Date(segStart), end: new Date(end), value });
  return out;
}

export interface LagnaPeriod { lagnaSign: number; checks: MuhurtaCheck[] }
export interface MoonState { waxing: boolean; sunState: 'combusta' | 'sob os raios' | null; viaCombusta: boolean }

export interface ElectionalDay {
  start: Date;
  end: Date;
  nakshatras: Period<number>[];
  tithis: Period<ReturnType<typeof tithiOf>>[];
  lagnas: Period<LagnaPeriod>[];
  moonSigns: Period<number>[];
  manazil: Period<number>[];
  moonStates: Period<MoonState>[];
  /** Aspecto que a Lua aplica em cada trecho; null = fora de curso. */
  moonAspects: Period<NextAspect | null>[];
  /** Planetas tradicionais retrógrados (Mercúrio a Saturno). */
  retrogrades: Period<string[]>[];
  /** Regente do ascendente em cada trecho e se está retrógrado. */
  ascRulers: Period<{ sign: number; ruler: string; retro: boolean }>[];
  /** Grahas asta (combustos). */
  combust: Period<string[]>[];
}

export function electionalDay(
  date: Date, location: GeoLocation, zodiac: ZodiacSystem, day: PlanetaryDay | null, pt: (name: string) => string,
): ElectionalDay {
  const { start, end } = dayWindow(day, date);
  const cache = new Map<number, ChartData>();
  const chartAt = (t: number) => {
    const ms = Math.round(t);
    let c = cache.get(ms);
    if (!c) { c = calculateChart(new Date(ms), location, zodiac); cache.set(ms, c); }
    return c;
  };
  const s = start.getTime(), e = end.getTime();
  const moonLon = (c: ChartData) => c.planets.find(p => p.name === 'Moon')?.longitude ?? 0;

  return {
    start, end,
    nakshatras: timeline(s, e, t => chartAt(t).moonPhase.lunarMansion.number - 1, String),
    tithis: timeline(s, e, t => tithiOf(chartAt(t).moonPhase.angle), v => String(v.number)),
    lagnas: timeline(s, e, t => {
      const c = chartAt(t);
      return { lagnaSign: Math.floor((((c.ascendant % 360) + 360) % 360) / 30), checks: muhurtaChecks(c, pt) };
    }, v => `${v.lagnaSign}|${v.checks.map(c => `${c.holds}:${c.detail}`).join('|')}`),
    moonSigns: timeline(s, e, t => Math.floor((((moonLon(chartAt(t)) % 360) + 360) % 360) / 30), String),
    manazil: timeline(s, e, t => chartAt(t).moonPhase.arabicMansion.number - 1, String),
    moonStates: timeline(s, e, t => {
      const m = westernMoon(chartAt(t));
      return { waxing: m.waxing, sunState: m.sunState, viaCombusta: m.viaCombusta };
    }, v => JSON.stringify(v)),
    moonAspects: timeline(s, e, t => westernMoon(chartAt(t)).next, v => (v ? `${v.planet}|${v.aspect}` : 'void')),
    retrogrades: timeline(s, e, t => retrogrades(chartAt(t)), v => v.join()),
    ascRulers: timeline(s, e, t => {
      const c = chartAt(t);
      const sign = Math.floor((((c.ascendant % 360) + 360) % 360) / 30);
      const ruler = SIGN_RULERS[sign];
      return { sign, ruler, retro: !!c.planets.find(p => p.name === ruler)?.isRetrograde };
    }, v => `${v.sign}|${v.retro}`),
    combust: timeline(s, e, t => combustGrahas(chartAt(t)), v => v.join()),
  };
}
