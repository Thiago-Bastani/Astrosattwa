import { vedicLongitudes, moonPhaseIndex, MOON_PHASES } from './astroCalculator';
import { NAKSHATRAS, MANAZIL } from '../utils/lunarMansions';
import { ZODIAC_SIGNS, PLANET_GLYPHS } from '../utils/zodiac';
import { SIGN_NAMES_PT } from '../utils/astroLabels';

/**
 * Mudanças do céu (sempre védico: sideral Lahiri, nove grahas):
 * troca de signo, troca de decanato, fase da Lua, nakshatra e manzil.
 * Não dependem do lugar, só do instante.
 */

export type SkyEventKind = 'sign' | 'decan' | 'phase' | 'nakshatra' | 'manzil';

export interface SkyEvent {
  at: number;          // epoch ms (precisão de ~1 min)
  kind: SkyEventKind;
  glyph: string;
  text: string;
  /** Chave estável (evita duplicar notificações e itens). */
  key: string;
}

const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'NorthNode'] as const;

const GRAHA_PT: Record<string, string> = {
  Sun: 'Sol', Moon: 'Lua', Mars: 'Marte', Mercury: 'Mercúrio', Jupiter: 'Júpiter',
  Venus: 'Vênus', Saturn: 'Saturno', NorthNode: 'Rahu',
};

const STEP_MS = 20 * 60_000;
const PRECISION_MS = 30_000;

type State = Record<string, number>;

/** Índices discretos em cada instante; uma mudança de índice é um evento. */
function stateAt(t: number): { state: State; lons: Record<string, number> } {
  const { lons, phaseAngle } = vedicLongitudes(new Date(t));
  const state: State = {};
  for (const g of GRAHAS) state[`d:${g}`] = Math.floor(lons[g] / 10); // 36 decanatos (signo = decanato/3)
  state.phase = moonPhaseIndex(phaseAngle);
  state.nak = Math.floor(lons.Moon / (360 / 27)) % 27;
  state.man = Math.floor(lons.Moon / (360 / 28)) % 28;
  return { state, lons };
}

/** Busca binária do instante da troca de `field` entre a e b. */
function refine(a: number, b: number, field: string, before: number): number {
  while (b - a > PRECISION_MS) {
    const m = (a + b) / 2;
    if (stateAt(m).state[field] === before) a = m;
    else b = m;
  }
  return Math.round(b / 60_000) * 60_000;
}

function signLabel(i: number): string {
  const s = ZODIAC_SIGNS[i];
  return `${s.glyph} ${SIGN_NAMES_PT[s.name]}`;
}

const ORD = ['1º', '2º', '3º'];

/** Mudanças em (start, end]. */
export function findSkyEvents(start: number, end: number): SkyEvent[] {
  const events: SkyEvent[] = [];
  // Grade alinhada em horários absolutos: o mesmo evento sai sempre no mesmo minuto,
  // não importa quando a busca começa (essencial para não duplicar avisos)
  const gridStart = Math.floor(start / STEP_MS) * STEP_MS;
  let prev = stateAt(gridStart);

  for (let a = gridStart; a < end; a += STEP_MS) {
    const tt = a + STEP_MS;
    const cur = stateAt(tt);

    for (const field of Object.keys(cur.state)) {
      const before = prev.state[field];
      const after = cur.state[field];
      if (before === after) continue;
      const at = refine(a, tt, field, before);

      if (field.startsWith('d:')) {
        const g = field.slice(2);
        // Movimento para trás no zodíaco = retrógrado (Rahu/Ketu andam sempre assim)
        const retro = ((after - before + 36) % 36) > 18;
        const retroTxt = retro && g !== 'NorthNode' ? ' (retrógrado)' : '';
        const sign = Math.floor(after / 3);
        const signChanged = Math.floor(before / 3) !== sign;
        const name = g === 'NorthNode' ? 'Rahu' : GRAHA_PT[g];
        const glyph = PLANET_GLYPHS[g];

        if (g === 'NorthNode') {
          // Ketu vai junto, sempre no signo oposto
          const ketuSign = (sign + 6) % 12;
          const ketuDec = (after + 18) % 36;
          events.push(signChanged
            ? { at, kind: 'sign', glyph, key: `sign:Rahu:${after}:${at}`,
                text: `Rahu entra em ${signLabel(sign)} · Ketu em ${signLabel(ketuSign)}` }
            : { at, kind: 'decan', glyph, key: `decan:Rahu:${after}:${at}`,
                text: `Rahu no ${ORD[after % 3]} decanato de ${signLabel(sign)} · Ketu no ${ORD[ketuDec % 3]} de ${signLabel(ketuSign)}` });
        } else if (signChanged) {
          events.push({ at, kind: 'sign', glyph, key: `sign:${g}:${sign}:${at}`,
            text: `${name} entra em ${signLabel(sign)}${retroTxt}` });
        } else {
          events.push({ at, kind: 'decan', glyph, key: `decan:${g}:${after}:${at}`,
            text: `${name} entra no ${ORD[after % 3]} decanato de ${signLabel(sign)}${retroTxt}` });
        }
      } else if (field === 'phase') {
        const p = MOON_PHASES[after];
        events.push({ at, kind: 'phase', glyph: p.emoji, key: `phase:${after}:${at}`,
          text: `Lua muda de fase: ${p.name}` });
      } else if (field === 'nak') {
        events.push({ at, kind: 'nakshatra', glyph: PLANET_GLYPHS.Moon, key: `nak:${after}:${at}`,
          text: `Lua entra no nakshatra ${after + 1} · ${NAKSHATRAS[after]}` });
      } else if (field === 'man') {
        const m = MANAZIL[after];
        events.push({ at, kind: 'manzil', glyph: PLANET_GLYPHS.Moon, key: `man:${after}:${at}`,
          text: `Lua entra na manzil ${after + 1} · ${m.name} (${m.meaning})` });
      }
    }
    prev = cur;
  }

  const inRange = events.filter(e => e.at > start && e.at <= end);
  const order: SkyEventKind[] = ['phase', 'sign', 'nakshatra', 'manzil', 'decan'];
  return inRange.sort((x, y) => x.at - y.at || order.indexOf(x.kind) - order.indexOf(y.kind));
}

/** Eventos do dia local de `ref` (meia-noite a meia-noite). */
export function dayEvents(ref: Date): SkyEvent[] {
  const start = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate()).getTime();
  const end = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + 1).getTime();
  return findSkyEvents(start, end);
}
