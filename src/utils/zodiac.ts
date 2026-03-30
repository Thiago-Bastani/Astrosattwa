import type { DignityType } from '../types/astro';

export interface ZodiacSignInfo {
  name: string;
  glyph: string;
  element: 'fire' | 'earth' | 'air' | 'water';
  color: string;
}

export const ZODIAC_SIGNS: ZodiacSignInfo[] = [
  { name: 'Aries',       glyph: '\u2648', element: 'fire',  color: '#e74c3c' },
  { name: 'Taurus',      glyph: '\u2649', element: 'earth', color: '#27ae60' },
  { name: 'Gemini',      glyph: '\u264A', element: 'air',   color: '#f1c40f' },
  { name: 'Cancer',      glyph: '\u264B', element: 'water', color: '#3498db' },
  { name: 'Leo',         glyph: '\u264C', element: 'fire',  color: '#e74c3c' },
  { name: 'Virgo',       glyph: '\u264D', element: 'earth', color: '#27ae60' },
  { name: 'Libra',       glyph: '\u264E', element: 'air',   color: '#f1c40f' },
  { name: 'Scorpio',     glyph: '\u264F', element: 'water', color: '#3498db' },
  { name: 'Sagittarius', glyph: '\u2650', element: 'fire',  color: '#e74c3c' },
  { name: 'Capricorn',   glyph: '\u2651', element: 'earth', color: '#27ae60' },
  { name: 'Aquarius',    glyph: '\u2652', element: 'air',   color: '#f1c40f' },
  { name: 'Pisces',      glyph: '\u2653', element: 'water', color: '#3498db' },
];

export const PLANET_GLYPHS: Record<string, string> = {
  Sun:       '\u2609',
  Moon:      '\u263D',
  Mercury:   '\u263F',
  Venus:     '\u2640',
  Mars:      '\u2642',
  Jupiter:   '\u2643',
  Saturn:    '\u2644',
  Uranus:    '\u2645',
  Neptune:   '\u2646',
  Pluto:     '\u2647',
  Lilith:    '\u26B8',
  NorthNode: '\u260A',
  SouthNode: '\u260B',
  Vertex:    'Vx',
};

export const PLANET_COLORS: Record<string, string> = {
  Sun:       '#f1c40f',
  Moon:      '#ecf0f1',
  Mercury:   '#bdc3c7',
  Venus:     '#e91e8c',
  Mars:      '#e74c3c',
  Jupiter:   '#e67e22',
  Saturn:    '#95a5a6',
  Uranus:    '#1abc9c',
  Neptune:   '#3498db',
  Pluto:     '#9b59b6',
  Lilith:    '#8e44ad',
  NorthNode: '#c9a84c',
  SouthNode: '#7f8c8d',
  Vertex:    '#16a085',
};

/* ── Tabela de dignidades ── */

export const DIGNITY_TABLE: Record<string, {
  domicilio: string[];
  exaltacao: string[];
  queda: string[];
  exilio: string[];
}> = {
  Sun:     { domicilio: ['Leo'],                    exaltacao: ['Aries'],   queda: ['Libra'],      exilio: ['Aquarius'] },
  Moon:    { domicilio: ['Cancer'],                 exaltacao: ['Taurus'],  queda: ['Scorpio'],    exilio: ['Capricorn'] },
  Mercury: { domicilio: ['Gemini', 'Virgo'],        exaltacao: ['Virgo'],   queda: ['Pisces'],     exilio: ['Sagittarius', 'Pisces'] },
  Venus:   { domicilio: ['Taurus', 'Libra'],        exaltacao: ['Pisces'],  queda: ['Virgo'],      exilio: ['Aries', 'Scorpio'] },
  Mars:    { domicilio: ['Aries', 'Scorpio'],       exaltacao: ['Capricorn'], queda: ['Cancer'],   exilio: ['Taurus', 'Libra'] },
  Jupiter: { domicilio: ['Sagittarius', 'Pisces'],  exaltacao: ['Cancer'],  queda: ['Capricorn'],  exilio: ['Gemini', 'Virgo'] },
  Saturn:  { domicilio: ['Capricorn', 'Aquarius'],  exaltacao: ['Libra'],   queda: ['Aries'],      exilio: ['Cancer', 'Leo'] },
  Uranus:  { domicilio: ['Aquarius'],               exaltacao: ['Scorpio'], queda: ['Taurus'],     exilio: ['Leo'] },
  Neptune: { domicilio: ['Pisces'],                 exaltacao: ['Cancer'],  queda: ['Capricorn'],  exilio: ['Virgo'] },
  Pluto:   { domicilio: ['Scorpio'],                exaltacao: ['Leo'],     queda: ['Aquarius'],   exilio: ['Taurus'] },
};

export function getDignity(planetName: string, signName: string): DignityType {
  const entry = DIGNITY_TABLE[planetName];
  if (!entry) return null;
  if (entry.domicilio.includes(signName)) return 'domicilio';
  if (entry.exaltacao.includes(signName)) return 'exaltacao';
  if (entry.queda.includes(signName))     return 'queda';
  if (entry.exilio.includes(signName))    return 'exilio';
  return null;
}

export function getDecanate(signDegree: number): 1 | 2 | 3 {
  if (signDegree < 10) return 1;
  if (signDegree < 20) return 2;
  return 3;
}

export function getZodiacSign(longitude: number): { sign: ZodiacSignInfo; degree: number; minute: number } {
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degreeInSign = normalized - signIndex * 30;
  const degree = Math.floor(degreeInSign);
  const minute = Math.floor((degreeInSign - degree) * 60);
  return { sign: ZODIAC_SIGNS[signIndex], degree, minute };
}
