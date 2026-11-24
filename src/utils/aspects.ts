/* Aspectos usados na grade e no PDF */

export interface AspectType {
  name: string;
  angle: number;
  orb: number;
  glyph: string;
  color: string;
}

export const ASPECTS: AspectType[] = [
  { name: 'Conjunção',    angle: 0,   orb: 8, glyph: '\u260C', color: '#f1c40f' },
  { name: 'Sextil',       angle: 60,  orb: 6, glyph: '\u26B9', color: '#3498db' },
  { name: 'Quadratura',   angle: 90,  orb: 8, glyph: '\u25A1', color: '#e74c3c' },
  { name: 'Trígono',      angle: 120, orb: 8, glyph: '\u25B3', color: '#2ecc71' },
  { name: 'Oposição',     angle: 180, orb: 8, glyph: '\u260D', color: '#e74c3c' },
  { name: 'Quincúncio',   angle: 150, orb: 2, glyph: '\u26BB', color: '#95a5a6' },
  { name: 'Semi-sextil',  angle: 30,  orb: 2, glyph: '\u26BA', color: '#95a5a6' },
];

export function findAspect(lon1: number, lon2: number): AspectType | null {
  const diff = Math.abs(lon1 - lon2);
  const angle = diff > 180 ? 360 - diff : diff;

  for (const aspect of ASPECTS) {
    if (Math.abs(angle - aspect.angle) <= aspect.orb) {
      return aspect;
    }
  }
  return null;
}
