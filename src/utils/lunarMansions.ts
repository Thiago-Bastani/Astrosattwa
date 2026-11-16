import type { LunarMansion } from '../types/astro';

export type MansionSystem = 'vedic' | 'arabic';

/* ── Nakshatras (27, védico, zodíaco sideral Lahiri) ── */

export const NAKSHATRAS: string[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

/* ── Manazil al-Qamar (28, árabe, zodíaco tropical a partir de 0° Áries) ── */

export const MANAZIL: { name: string; meaning: string }[] = [
  { name: 'Al-Sharatain',          meaning: 'Os Dois Sinais' },
  { name: 'Al-Butain',             meaning: 'A Pequena Barriga' },
  { name: 'Al-Thurayya',           meaning: 'As Plêiades' },
  { name: 'Al-Dabaran',            meaning: 'O Seguidor' },
  { name: "Al-Haq'a",              meaning: 'O Cacho de Pelos' },
  { name: "Al-Han'a",              meaning: 'A Marca' },
  { name: 'Al-Dhira',              meaning: 'O Braço' },
  { name: 'Al-Nathra',             meaning: 'O Focinho do Leão' },
  { name: 'Al-Tarf',               meaning: 'O Olhar' },
  { name: 'Al-Jabha',              meaning: 'A Fronte' },
  { name: 'Al-Zubra',              meaning: 'A Juba' },
  { name: 'Al-Sarfa',              meaning: 'A Mudança' },
  { name: "Al-'Awwa",              meaning: 'O Ladrador' },
  { name: 'Al-Simak',              meaning: 'O Desarmado' },
  { name: 'Al-Ghafr',              meaning: 'A Cobertura' },
  { name: 'Al-Zubana',             meaning: 'As Pinças' },
  { name: 'Al-Iklil',              meaning: 'A Coroa' },
  { name: 'Al-Qalb',               meaning: 'O Coração' },
  { name: 'Al-Shawla',             meaning: 'O Ferrão' },
  { name: "Al-Na'a'im",            meaning: 'Os Avestruzes' },
  { name: 'Al-Balda',              meaning: 'A Cidade' },
  { name: "Sa'd al-Dhabih",        meaning: 'Sorte do Sacrificador' },
  { name: "Sa'd Bula",             meaning: 'Sorte do Engolidor' },
  { name: "Sa'd al-Su'ud",         meaning: 'Sorte das Sortes' },
  { name: "Sa'd al-Akhbiya",       meaning: 'Sorte das Tendas' },
  { name: 'Al-Fargh al-Muqaddam',  meaning: 'O Primeiro Bico do Cântaro' },
  { name: "Al-Fargh al-Mu'akhkhar", meaning: 'O Segundo Bico do Cântaro' },
  { name: 'Batn al-Hut',           meaning: 'O Ventre do Peixe' },
];

function normalize(d: number): number {
  return ((d % 360) + 360) % 360;
}

/** Nakshatra pela longitude SIDERAL (Lahiri) da Lua. */
export function getNakshatra(moonSiderealLon: number): LunarMansion {
  const index = Math.floor(normalize(moonSiderealLon) / (360 / 27)) % 27;
  return { number: index + 1, name: NAKSHATRAS[index] };
}

/** Manzil pela longitude TROPICAL da Lua (tradição de Picatrix/Agrippa). */
export function getManzil(moonTropicalLon: number): LunarMansion {
  const index = Math.floor(normalize(moonTropicalLon) / (360 / 28)) % 28;
  return { number: index + 1, name: MANAZIL[index].name, meaning: MANAZIL[index].meaning };
}
