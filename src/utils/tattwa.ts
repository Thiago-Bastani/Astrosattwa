import * as Astronomy from 'astronomy-engine';
import type { GeoLocation } from '../types/astro';

export interface TattwaInfo {
  name: string;
  namePt: string;
  element: string;
  color: string;
  bgColor: string;
  shape: 'crescent-left' | 'pentagon' | 'triangle' | 'square' | 'crescent-up';
  subTattwa: TattwaInfo | null;
  minutesRemaining: number;
}

const TATTWAS = [
  { name: 'Akasha',  namePt: 'Akasha (Éter)',   element: 'ether', color: '#0000ff', bgColor: '#2a0050', shape: 'crescent-left' as const },
  { name: 'Vayu',    namePt: 'Vayu (Ar)',        element: 'air',   color: '#00ff00', bgColor: '#1a3a2a', shape: 'pentagon' as const },
  { name: 'Tejas',   namePt: 'Tejas (Fogo)',     element: 'fire',  color: '#ff0000', bgColor: '#5c1a1a', shape: 'triangle' as const },
  { name: 'Prithvi', namePt: 'Prithvi (Terra)',  element: 'earth', color: '#ffaa00', bgColor: '#5c3a1a', shape: 'square' as const },
  { name: 'Apas',    namePt: 'Apas (Água)',      element: 'water', color: '#ff00ff', bgColor: '#3a1a4e', shape: 'crescent-up' as const },
];

const TATTWA_DURATION = 24; // minutos por tattwa principal
const SUB_TATTWA_DURATION = TATTWA_DURATION / 5; // 4.8 minutos por sub-tattwa
const CYCLE_DURATION = TATTWAS.length * TATTWA_DURATION; // 120 minutos

function getSunrise(date: Date, location: GeoLocation): Date | null {
  const observer = new Astronomy.Observer(location.lat, location.lon, 0);
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
  const result = Astronomy.SearchRiseSet('Sun' as Astronomy.Body, observer, 1, startOfDay, 1);
  if (!result) return null;
  return result.date;
}

export function getCurrentTattwa(date: Date, location: GeoLocation): TattwaInfo | null {
  const sunrise = getSunrise(date, location);
  if (!sunrise) return null;

  const msSinceSunrise = date.getTime() - sunrise.getTime();
  if (msSinceSunrise < 0) {
    // Antes do nascer do sol: usar nascer do dia anterior
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySunrise = getSunrise(yesterday, location);
    if (!yesterdaySunrise) return null;
    const ms = date.getTime() - yesterdaySunrise.getTime();
    return computeTattwa(ms);
  }

  return computeTattwa(msSinceSunrise);
}

function computeTattwa(msSinceSunrise: number): TattwaInfo {
  const minutesSinceSunrise = msSinceSunrise / 60000;
  const positionInCycle = ((minutesSinceSunrise % CYCLE_DURATION) + CYCLE_DURATION) % CYCLE_DURATION;

  const mainIndex = Math.floor(positionInCycle / TATTWA_DURATION);
  const minutesIntoMain = positionInCycle - mainIndex * TATTWA_DURATION;
  const subIndex = Math.floor(minutesIntoMain / SUB_TATTWA_DURATION);

  const main = TATTWAS[mainIndex % 5];
  const sub = TATTWAS[subIndex % 5];

  const minutesRemaining = TATTWA_DURATION - minutesIntoMain;

  return {
    ...main,
    subTattwa: { ...sub, subTattwa: null, minutesRemaining: SUB_TATTWA_DURATION - (minutesIntoMain - subIndex * SUB_TATTWA_DURATION) },
    minutesRemaining,
  };
}
