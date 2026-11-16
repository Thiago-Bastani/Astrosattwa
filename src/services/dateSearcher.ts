import type { GeoLocation, ZodiacSystem } from '../types/astro';
import type { ConditionSet, ConditionRule, ConditionTarget, SearchResult, SearchProgress } from '../types/conditions';
import { calculateChart } from './astroCalculator';
import { evaluateConditionSet } from './conditionEvaluator';
import { SIGN_RULERS } from '../utils/zodiac';

const MINUTE_MS = 60000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const MIN_STEP_MS = 5 * MINUTE_MS;
const MAX_STEP_MS = 6 * HOUR_MS;
const FINE_STEP_MS = MINUTE_MS;

/**
 * Velocidade máxima aproximada (°/hora) de cada corpo, com margem de segurança.
 * Usada para escolher um passo de busca que não "pule" janelas curtas.
 */
const ANGLE_SPEED = 30; // Ascendente pode chegar a ~2x a média de 15°/h
const BODY_SPEED: Record<string, number> = {
  Ascendant: ANGLE_SPEED,
  Descendant: ANGLE_SPEED,
  MC: ANGLE_SPEED,
  IC: ANGLE_SPEED,
  Vertex: ANGLE_SPEED,
  Moon: 0.7,
  Mercury: 0.1,
  Venus: 0.06,
  Sun: 0.045,
  Mars: 0.035,
  Jupiter: 0.01,
  Saturn: 0.01,
  Uranus: 0.01,
  Neptune: 0.01,
  Pluto: 0.01,
  Chiron: 0.01,
  NorthNode: 0.01,
  SouthNode: 0.01,
  Lilith: 0.01,
};
const MAX_RULER_SPEED = Math.max(...Object.values(SIGN_RULERS).map(r => BODY_SPEED[r] ?? ANGLE_SPEED));

function targetSpeed(target: ConditionTarget): number {
  switch (target.type) {
    case 'direct':
      return BODY_SPEED[target.body] ?? ANGLE_SPEED;
    case 'signRuler':
      return BODY_SPEED[SIGN_RULERS[target.sign]] ?? ANGLE_SPEED;
    case 'houseRuler':
      // O regente muda quando o signo da cúspide muda, que anda com o Ascendente
      return ANGLE_SPEED;
    case 'planetSignRuler':
      return MAX_RULER_SPEED;
  }
}

/** Menor janela (em horas) em que a regra pode ficar verdadeira. */
function minWindowHours(rule: ConditionRule): number {
  const speed = targetSpeed(rule.target);
  const c = rule.condition;
  switch (c.category) {
    case 'sign':
    case 'element':
    case 'modality':
    case 'dignity':
      return 30 / speed;
    case 'decanate':
      return 10 / speed;
    case 'house':
    case 'hemisphere':
      // Casas iguais a partir do Ascendente: a fronteira anda na velocidade dos ângulos
      return 30 / Math.max(speed, ANGLE_SPEED);
    case 'aspect': {
      const other = BODY_SPEED[c.withBody] ?? ANGLE_SPEED;
      return (2 * c.aspectOrb) / (speed + other);
    }
    case 'state':
      return Infinity; // estações duram semanas
  }
}

/** Passo grosso: metade da menor janela, para nunca pular um evento. */
export function chooseCoarseStep(conditionSet: ConditionSet): number {
  let minWindow = Infinity;
  for (const group of conditionSet.groups) {
    for (const rule of group.rules) {
      minWindow = Math.min(minWindow, minWindowHours(rule));
    }
  }
  const step = Math.floor((minWindow / 2) * HOUR_MS / MINUTE_MS) * MINUTE_MS;
  return Math.min(MAX_STEP_MS, Math.max(MIN_STEP_MS, step));
}

function needsRetrograde(conditionSet: ConditionSet): boolean {
  return conditionSet.groups.some(g => g.rules.some(r => r.condition.category === 'state'));
}

function yieldToUI(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0));
}

export async function findNextMatchingDate(
  conditionSet: ConditionSet,
  location: GeoLocation,
  startDate: Date,
  maxDays: number,
  onProgress?: (progress: SearchProgress) => void,
  abortSignal?: AbortSignal,
  zodiacSystem: ZodiacSystem = 'sidereal',
): Promise<SearchResult | null> {
  const startTime = startDate.getTime();
  const endTime = startTime + maxDays * DAY_MS;
  const options = { skipRetrograde: !needsRetrograde(conditionSet) };

  const matches = (t: number) =>
    evaluateConditionSet(conditionSet, calculateChart(new Date(t), location, zodiacSystem, options));

  let lastYield = performance.now();
  const maybeYield = async (t: number) => {
    if (performance.now() - lastYield < 50) return;
    onProgress?.({
      currentDate: new Date(t),
      daysSearched: Math.floor((t - startTime) / DAY_MS),
      isRunning: true,
    });
    await yieldToUI();
    lastYield = performance.now();
  };

  /**
   * Varre (lo, hi] com o passo dado e retorna o primeiro instante que satisfaz,
   * ou null. `lo` é assumido como não satisfazendo.
   */
  async function scan(lo: number, hi: number, step: number): Promise<number | null> {
    for (let t = lo + step; ; t += step) {
      if (abortSignal?.aborted) return null;
      const clamped = Math.min(t, hi);
      if (matches(clamped)) return clamped;
      if (clamped >= hi) return null;
      await maybeYield(clamped);
    }
  }

  // Já satisfaz no instante inicial?
  let matchTime: number | null = matches(startTime) ? startTime : null;

  if (matchTime === null) {
    const coarseStep = chooseCoarseStep(conditionSet);
    matchTime = await scan(startTime, endTime, coarseStep);
    if (abortSignal?.aborted) return null;

    if (matchTime !== null) {
      // Refinamentos sucessivos dentro da janela [match - passo, match]
      let step = coarseStep;
      for (const finer of [30 * MINUTE_MS, FINE_STEP_MS]) {
        if (finer >= step) continue;
        const lo = Math.max(startTime, matchTime - step);
        const refined = await scan(lo, matchTime, finer);
        if (abortSignal?.aborted) return null;
        if (refined !== null) matchTime = refined;
        step = finer;
      }
    }
  }

  if (matchTime === null) {
    onProgress?.({ currentDate: new Date(endTime), daysSearched: maxDays, isRunning: false });
    return null;
  }

  const finalDate = new Date(matchTime);
  const finalChart = calculateChart(finalDate, location, zodiacSystem);

  onProgress?.({
    currentDate: finalDate,
    daysSearched: Math.floor((matchTime - startTime) / DAY_MS),
    isRunning: false,
  });

  return { date: finalDate, chart: finalChart };
}
