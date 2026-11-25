/** Seções opcionais do PDF (leve: importável sem carregar o jsPDF). */

export type Tradition = 'vedic' | 'western';
export type ReadingKind = 'natal' | 'electional';
export type ReportSection = `${Tradition}-${ReadingKind}`;

export const TRADITIONS: readonly { id: Tradition; label: string }[] = [
  { id: 'vedic',   label: 'Védico' },
  { id: 'western', label: 'Ocidental' },
];

export const KINDS: readonly { id: ReadingKind; label: string }[] = [
  { id: 'natal',      label: 'Natal' },
  { id: 'electional', label: 'Eletivo' },
];

/** Na ordem em que entram no PDF. */
export const REPORT_SECTIONS: readonly { id: ReportSection; label: string; hint: string }[] = [
  { id: 'vedic-natal',        label: 'Védico · natal',      hint: 'Lagna, regente, Lua, nakshatra e casas' },
  { id: 'vedic-electional',   label: 'Védico · eletivo',    hint: 'vara, tithi, nakshatra, asta e lagna do muhurta' },
  { id: 'western-natal',      label: 'Ocidental · natal',   hint: 'mandala, aspectos e leitura breve' },
  { id: 'western-electional', label: 'Ocidental · eletivo', hint: 'Lua, retrogradação, manzil e horas' },
];

export const ALL_SECTIONS: readonly ReportSection[] = REPORT_SECTIONS.map(s => s.id);

/** Cada tradição marcada × cada tipo marcado. */
export function combineSections(traditions: readonly Tradition[], kinds: readonly ReadingKind[]): ReportSection[] {
  return ALL_SECTIONS.filter(s => {
    const [tr, kd] = s.split('-') as [Tradition, ReadingKind];
    return traditions.includes(tr) && kinds.includes(kd);
  });
}
