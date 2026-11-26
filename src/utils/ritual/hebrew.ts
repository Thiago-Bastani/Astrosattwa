/**
 * Gematria hebraica, redução Aiq Bekar e transliteração latina → hebraica.
 */

/** Valor padrão de cada letra; as finais valem como as normais (mispar hechrechi). */
export const HEBREW_VALUES: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
  'י': 10, 'כ': 20, 'ך': 20, 'ל': 30, 'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50, 'ס': 60, 'ע': 70,
  'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
};

/** Finais com valor grande (mispar gadol): ך500 ם600 ן700 ף800 ץ900. */
const FINAL_GREAT: Record<string, number> = { 'ך': 500, 'ם': 600, 'ן': 700, 'ף': 800, 'ץ': 900 };

export const isHebrewLetter = (ch: string) => ch in HEBREW_VALUES;

export function hebrewLetters(text: string): string[] {
  return [...text].filter(isHebrewLetter);
}

/** Soma das letras; `finalsGreat` usa os valores grandes das letras finais. */
export function gematria(text: string, finalsGreat = false): number {
  return hebrewLetters(text).reduce((sum, ch) => sum + (finalsGreat && FINAL_GREAT[ch] ? FINAL_GREAT[ch] : HEBREW_VALUES[ch]), 0);
}

/**
 * Aiq Bekar (Cabala das Nove Câmaras): unidades, dezenas e centenas de mesmo dígito
 * ocupam a mesma câmara. Para caber no quadrado de lado n, divide por 10 até ≤ n².
 */
export function aiqBekarReduce(value: number, max: number): number {
  let v = value;
  while (v > max && v % 10 === 0) v /= 10;
  return v;
}

/**
 * Transliteração latina → hebraica usada no criador de sigilos (uma letra por letra).
 * Escolha fixa, mostrada na tela, para o resultado ser reproduzível.
 */
export const LATIN_TO_HEBREW: Record<string, string> = {
  A: 'א', B: 'ב', C: 'כ', D: 'ד', E: 'ה', F: 'פ', G: 'ג', H: 'ה', I: 'י', J: 'י',
  K: 'כ', L: 'ל', M: 'מ', N: 'נ', O: 'ע', P: 'פ', Q: 'ק', R: 'ר', S: 'ס', T: 'ת',
  U: 'ו', V: 'ו', W: 'ו', X: 'צ', Y: 'י', Z: 'ז',
};

/** Letras latinas maiúsculas sem acento (Ç → C, Ã → A…), só A–Z. */
export function latinLetters(text: string): string[] {
  return [...text.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()].filter(ch => ch >= 'A' && ch <= 'Z');
}
