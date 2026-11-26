import { type Kamea, cellOf } from './kameas';
import { HEBREW_VALUES, LATIN_TO_HEBREW, aiqBekarReduce, hebrewLetters, latinLetters, latinTokens } from './hebrew';

/**
 * Criador de sigilos: o texto vira uma sequência de números, cada número é uma casa
 * do quadrado e o sigilo é a linha que passa pelas casas, na ordem.
 */

export type SigilMethod = 'aiqbekar' | 'hebrew' | 'pythagorean' | 'sequential';

export const SIGIL_METHODS: { id: SigilMethod; name: string; hint: string }[] = [
  { id: 'aiqbekar', name: 'Aiq Bekar',
    hint: 'Letras latinas viram hebraicas (tabela abaixo; TH, SH, CH, PH, TZ/TS e KH contam como uma letra); o valor que não cabe no quadrado desce de câmara (200 → 20 → 2).' },
  { id: 'hebrew', name: 'Hebraico direto',
    hint: 'Digite em hebraico. Gematria padrão (finais = normais) e redução Aiq Bekar.' },
  { id: 'pythagorean', name: 'Pitagórica 1–9',
    hint: 'A=1 … I=9, J=1 … R=9, S=1 … Z=8. Usa só as casas de 1 a 9.' },
  { id: 'sequential', name: 'Sequencial A=1…Z=26',
    hint: 'Posição da letra no alfabeto; acima de n², volta ao começo (módulo n²).' },
];

export interface SigilStep {
  letter: string;      // letra como digitada (latina) ou hebraica
  hebrew?: string;     // letra hebraica correspondente (Aiq Bekar)
  value: number;       // valor bruto
  reduced: number;     // casa do quadrado
}

export interface SigilResult {
  steps: SigilStep[];
  /** Letras descartadas por repetição. */
  dropped: string[];
  /** Casas na ordem do traço, sem repetições seguidas. */
  path: { value: number; row: number; col: number }[];
  /** Valores que não acharam casa (não deveria ocorrer). */
  missing: number[];
}

function dedupe<T>(items: T[], key: (t: T) => string): { kept: T[]; dropped: T[] } {
  const seen = new Set<string>();
  const kept: T[] = [], dropped: T[] = [];
  for (const it of items) {
    const k = key(it);
    if (seen.has(k)) dropped.push(it);
    else { seen.add(k); kept.push(it); }
  }
  return { kept, dropped };
}

export function buildSigil(text: string, kamea: Kamea, method: SigilMethod, cutRepeats: boolean): SigilResult {
  const max = kamea.order * kamea.order;
  let letters: string[];
  if (method === 'hebrew') letters = hebrewLetters(text);
  else if (method === 'aiqbekar') letters = latinTokens(text);
  else letters = latinLetters(text);

  let dropped: string[] = [];
  if (cutRepeats) {
    // Finais contam como a mesma letra da forma normal
    const norm: Record<string, string> = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
    const r = dedupe(letters, l => norm[l] ?? l);
    letters = r.kept;
    dropped = r.dropped;
  }

  const steps: SigilStep[] = letters.map(letter => {
    switch (method) {
      case 'aiqbekar': {
        const hebrew = LATIN_TO_HEBREW[letter];
        const value = HEBREW_VALUES[hebrew];
        return { letter, hebrew, value, reduced: aiqBekarReduce(value, max) };
      }
      case 'hebrew': {
        const value = HEBREW_VALUES[letter];
        return { letter, value, reduced: aiqBekarReduce(value, max) };
      }
      case 'pythagorean': {
        const value = ((letter.charCodeAt(0) - 65) % 9) + 1;
        return { letter, value, reduced: value };
      }
      case 'sequential': {
        const value = letter.charCodeAt(0) - 64;
        return { letter, value, reduced: ((value - 1) % max) + 1 };
      }
    }
  });

  const path: SigilResult['path'] = [];
  const missing: number[] = [];
  for (const s of steps) {
    const cell = cellOf(kamea, s.reduced);
    if (!cell) { missing.push(s.reduced); continue; }
    // Duas letras seguidas na mesma casa não traçam nada
    if (path.length && path[path.length - 1].value === s.reduced) continue;
    path.push({ value: s.reduced, ...cell });
  }
  return { steps, dropped, path, missing };
}
