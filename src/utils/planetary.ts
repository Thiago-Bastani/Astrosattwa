import * as Astronomy from 'astronomy-engine';
import type { GeoLocation } from '../types/astro';

/** Planetas clássicos, na ordem caldaica (do mais lento ao mais rápido). */
export const CHALDEAN_ORDER = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'] as const;
export type ClassicalPlanet = typeof CHALDEAN_ORDER[number];

/** Regente de cada dia da semana (0 = domingo). */
export const DAY_RULERS: ClassicalPlanet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

export const WEEKDAY_NAMES_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export interface PlanetaryHour {
  index: number;        // 1–24 (1–12 diurnas, 13–24 noturnas)
  ruler: ClassicalPlanet;
  start: Date;
  end: Date;
  isDay: boolean;
}

export interface PlanetaryDay {
  weekday: number;      // 0–6, dia da semana do nascer do sol que abriu o dia
  ruler: ClassicalPlanet;
  sunrise: Date;
  sunset: Date;
  nextSunrise: Date;
  hours: PlanetaryHour[];
  current: PlanetaryHour | null;
}

function riseSet(direction: 1 | -1, observer: Astronomy.Observer, from: Date, limitDays: number): Date | null {
  const result = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, direction, from, limitDays);
  return result ? result.date : null;
}

/**
 * Dia planetário que contém `date`: começa no nascer do sol e vai até o próximo.
 * Retorna null em latitudes onde o Sol não nasce/põe (dias/noites polares).
 */
export function getPlanetaryDay(date: Date, location: GeoLocation): PlanetaryDay | null {
  const observer = new Astronomy.Observer(location.lat, location.lon, 0);

  const sunrise = riseSet(1, observer, date, -2);          // último nascer antes de `date`
  if (!sunrise) return null;
  const sunset = riseSet(-1, observer, sunrise, 1.5);      // pôr do sol seguinte
  const nextSunrise = riseSet(1, observer, new Date(sunrise.getTime() + 60000), 2);
  if (!sunset || !nextSunrise || sunset >= nextSunrise) return null;

  const weekday = sunrise.getDay();
  const ruler = DAY_RULERS[weekday];
  const firstIdx = CHALDEAN_ORDER.indexOf(ruler);

  const dayLen = (sunset.getTime() - sunrise.getTime()) / 12;
  const nightLen = (nextSunrise.getTime() - sunset.getTime()) / 12;

  const hours: PlanetaryHour[] = Array.from({ length: 24 }, (_, i) => {
    const isDay = i < 12;
    const start = isDay
      ? sunrise.getTime() + i * dayLen
      : sunset.getTime() + (i - 12) * nightLen;
    const end = start + (isDay ? dayLen : nightLen);
    return {
      index: i + 1,
      ruler: CHALDEAN_ORDER[(firstIdx + i) % 7],
      start: new Date(start),
      end: new Date(end),
      isDay,
    };
  });

  const t = date.getTime();
  const current = hours.find(h => t >= h.start.getTime() && t < h.end.getTime()) ?? null;

  return { weekday, ruler, sunrise, sunset, nextSunrise, hours, current };
}

/** Dia da semana planetário (vira no nascer do sol); cai para o dia civil se não houver nascer. */
export function getPlanetaryWeekday(date: Date, location: GeoLocation): number {
  return getPlanetaryDay(date, location)?.weekday ?? date.getDay();
}
