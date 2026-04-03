import type { GeoLocation } from '../types/astro';
import type { ConditionSet, SearchResult, SearchProgress } from '../types/conditions';
import { calculateChart } from './astroCalculator';
import { evaluateConditionSet } from './conditionEvaluator';

const HOUR_MS = 3600000;
const DAY_MS = 86400000;

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
): Promise<SearchResult | null> {
  const endTime = startDate.getTime() + maxDays * DAY_MS;

  // Fase 1: busca grossa (6h)
  const coarseStep = 6 * HOUR_MS;
  let matchTime: number | null = null;
  let prevTime = startDate.getTime();
  let iterations = 0;

  for (let t = startDate.getTime(); t <= endTime; t += coarseStep) {
    if (abortSignal?.aborted) return null;

    const date = new Date(t);
    const chart = calculateChart(date, location);

    if (evaluateConditionSet(conditionSet, chart)) {
      matchTime = t;
      break;
    }

    prevTime = t;
    iterations++;

    if (iterations % 20 === 0) {
      onProgress?.({
        currentDate: date,
        daysSearched: Math.floor((t - startDate.getTime()) / DAY_MS),
        isRunning: true,
      });
      await yieldToUI();
    }
  }

  if (matchTime === null) {
    onProgress?.({ currentDate: new Date(endTime), daysSearched: maxDays, isRunning: false });
    return null;
  }

  // Fase 2: refinamento médio (30min) na janela anterior
  const mediumStep = 30 * 60000; // 30 min
  let refinedTime = matchTime;

  for (let t = prevTime; t <= matchTime; t += mediumStep) {
    if (abortSignal?.aborted) return null;

    const date = new Date(t);
    const chart = calculateChart(date, location);

    if (evaluateConditionSet(conditionSet, chart)) {
      refinedTime = t;
      prevTime = Math.max(t - mediumStep, prevTime);
      break;
    }
    prevTime = t;
  }

  // Fase 3: refinamento fino (1min)
  const fineStep = 60000; // 1 min
  let finalTime = refinedTime;

  for (let t = prevTime; t <= refinedTime; t += fineStep) {
    if (abortSignal?.aborted) return null;

    const date = new Date(t);
    const chart = calculateChart(date, location);

    if (evaluateConditionSet(conditionSet, chart)) {
      finalTime = t;
      break;
    }
  }

  const finalDate = new Date(finalTime);
  const finalChart = calculateChart(finalDate, location);

  onProgress?.({
    currentDate: finalDate,
    daysSearched: Math.floor((finalTime - startDate.getTime()) / DAY_MS),
    isRunning: false,
  });

  return { date: finalDate, chart: finalChart };
}
