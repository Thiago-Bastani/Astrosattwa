import { Capacitor, registerPlugin } from '@capacitor/core';
import type { GeoLocation } from '../types/astro';
import { calculateChart } from './astroCalculator';
import { getPlanetaryDay } from '../utils/planetary';
import { getZodiacSign, PLANET_GLYPHS } from '../utils/zodiac';
import { PLANET_NAMES_PT, SIGN_NAMES_PT } from '../utils/astroLabels';
import { findSkyEvents, type SkyEventKind } from './skyEvents';

/**
 * Notificação contínua "Céu agora" (Android).
 *
 * O cálculo fica todo aqui (mesmo código do app). O plugin nativo SkyNotification
 * só exibe: recebe a lista de retratos com horário, mostra o atual numa notificação
 * fixa e agenda alarmes para trocar o texto nos horários seguintes, inclusive com
 * o app fechado e depois de reiniciar o aparelho.
 */

export interface SkySnapshot {
  at: number;    // epoch ms a partir do qual este retrato vale
  title: string;
  body: string;
  sub: string;
}

interface SkyNotificationPlugin {
  requestNotificationPermission(): Promise<{ granted: boolean }>;
  schedule(options: { snapshots: SkySnapshot[] }): Promise<void>;
  scheduleEvents(options: { events: { at: number; key: string; title: string; text: string }[] }): Promise<void>;
  stop(): Promise<void>;
}

const SkyNotification = registerPlugin<SkyNotificationPlugin>('SkyNotification');

const HORIZON_MS = 48 * 3600_000;
const STEP_MS = 15 * 60_000;

const hhmm = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

function shortPlace(name: string): string {
  const parts = name.split(',').map(p => p.trim()).filter(Boolean);
  return parts[0] ?? name;
}

/** Retrato do céu no instante `t` (zodíaco sideral). */
export function buildSnapshot(t: number, location: GeoLocation): SkySnapshot | null {
  const date = new Date(t);
  const day = getPlanetaryDay(date, location);
  const hour = day?.current;
  if (!day || !hour) return null;

  const chart = calculateChart(date, location, 'sidereal');
  const asc = getZodiacSign(chart.ascendant);
  const ruler = chart.planets.find(p => p.name === hour.ruler);
  if (!ruler) return null;
  const rulerSign = getZodiacSign(ruler.longitude).sign;

  const rulerName = PLANET_NAMES_PT[hour.ruler];
  const retro = ruler.isRetrograde ? ' ℞' : '';

  return {
    at: t,
    title: `${PLANET_GLYPHS[hour.ruler]} Hora de ${rulerName} · até ${hhmm(hour.end)}`,
    body:
      `ASC ${asc.sign.glyph} ${SIGN_NAMES_PT[asc.sign.name]} ${asc.degree}° · ` +
      `${PLANET_GLYPHS[hour.ruler]}${retro} em ${rulerSign.glyph} ${SIGN_NAMES_PT[rulerSign.name]}, casa ${ruler.house}`,
    sub: `${shortPlace(location.name)} · sideral · dia de ${PLANET_GLYPHS[day.ruler]}`,
  };
}

/** Horários das atualizações: agora, a cada 15 min e em cada virada de hora planetária. */
export function snapshotTimes(now: number, location: GeoLocation): number[] {
  const end = now + HORIZON_MS;
  const times = new Set<number>([now]);

  for (let t = Math.ceil(now / STEP_MS) * STEP_MS; t <= end; t += STEP_MS) times.add(t);

  let day = getPlanetaryDay(new Date(now), location);
  while (day && day.sunrise.getTime() <= end) {
    for (const h of day.hours) {
      const s = h.start.getTime();
      if (s > now && s <= end) times.add(s);
    }
    day = getPlanetaryDay(new Date(day.nextSunrise.getTime() + 60_000), location);
  }

  // Remove instantes a menos de 1 min um do outro (mantém o mais cedo)
  const sorted = [...times].sort((a, b) => a - b);
  return sorted.filter((t, i) => i === 0 || t - sorted[i - 1] >= 60_000);
}

export function buildSnapshots(now: number, location: GeoLocation): SkySnapshot[] {
  return snapshotTimes(now, location)
    .map(t => buildSnapshot(t, location))
    .filter((s): s is SkySnapshot => s !== null);
}

let permissionAsked = false;

/**
 * (Re)agenda a notificação para as próximas 48h. Sem efeito fora do Android.
 * Chamado ao abrir o app, ao voltar para ele e quando a localização muda.
 */
export async function refreshSkyNotification(location: GeoLocation): Promise<void> {
  if (Capacitor.getPlatform() !== 'android') return;
  try {
    if (!permissionAsked) {
      permissionAsked = true;
      const { granted } = await SkyNotification.requestNotificationPermission();
      if (!granted) return;
    }
    // Pequena pausa para não travar a abertura do app (≈ 240 mapas calculados)
    await new Promise(r => setTimeout(r, 300));
    const snapshots = buildSnapshots(Date.now(), location);
    if (snapshots.length) await SkyNotification.schedule({ snapshots });
    await scheduleEventNotifications();
  } catch (err) {
    console.warn('[SkyNotification]', err);
  }
}

const EVENT_TITLES: Record<SkyEventKind, string> = {
  sign: 'Troca de signo',
  decan: 'Troca de decanato',
  phase: 'Fase da Lua',
  nakshatra: 'Novo nakshatra',
  manzil: 'Nova manzil',
};

/**
 * Avisos das mudanças do céu (védico) das próximas 48h. O nativo guarda o
 * instante do último aviso, então reagendar a lista nunca repete notificação.
 */
async function scheduleEventNotifications(): Promise<void> {
  const now = Date.now();
  const events = findSkyEvents(now - 3600_000, now + HORIZON_MS).map(e => ({
    at: e.at,
    key: e.key,
    title: `${e.glyph} ${EVENT_TITLES[e.kind]}`,
    text: e.text,
  }));
  await SkyNotification.scheduleEvents({ events });
}
