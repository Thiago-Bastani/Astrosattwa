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
  Sun:     '\u2609',
  Moon:    '\u263D',
  Mercury: '\u263F',
  Venus:   '\u2640',
  Mars:    '\u2642',
  Jupiter: '\u2643',
  Saturn:  '\u2644',
  Uranus:  '\u2645',
  Neptune: '\u2646',
  Pluto:   '\u2647',
};

export function getZodiacSign(longitude: number): { sign: ZodiacSignInfo; degree: number; minute: number } {
  const normalized = ((longitude % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degreeInSign = normalized - signIndex * 30;
  const degree = Math.floor(degreeInSign);
  const minute = Math.floor((degreeInSign - degree) * 60);
  return { sign: ZODIAC_SIGNS[signIndex], degree, minute };
}
