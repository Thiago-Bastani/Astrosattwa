import type { jsPDF } from 'jspdf';
import symUrl from '../../assets/fonts/NotoSansSymbols-Regular.ttf?url';
import sym2Url from '../../assets/fonts/NotoSansSymbols2-Regular.ttf?url';

/**
 * Fontes do PDF. O texto usa Times (fonte padrão de todo leitor de PDF); os glifos
 * astrológicos usam Noto Sans Symbols 1 e 2, embutidas no arquivo. Assim o documento
 * sai idêntico em qualquer aparelho, sem depender das fontes do sistema.
 */

export type FontKey = 'times' | 'sym' | 'sym2';

/** Nomes registrados no jsPDF (também usados como font-family nos SVGs). */
export const FONT_FAMILY: Record<FontKey, string> = {
  times: 'times',
  sym: 'NotoSym',
  sym2: 'NotoSym2',
};

interface LoadedFont {
  base64: string;
  coverage: Set<number>;
}

let cache: Promise<{ sym: LoadedFont; sym2: LoadedFont }> | null = null;
let coverage: { sym: Set<number>; sym2: Set<number> } | null = null;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

/** Lê a tabela cmap (formatos 4 e 12) para saber quais caracteres a fonte tem. */
function readCoverage(buf: ArrayBuffer): Set<number> {
  const v = new DataView(buf);
  const has = new Set<number>();
  const numTables = v.getUint16(4);
  let cmap = -1;
  for (let i = 0; i < numTables; i++) {
    const o = 12 + i * 16;
    const tag = String.fromCharCode(v.getUint8(o), v.getUint8(o + 1), v.getUint8(o + 2), v.getUint8(o + 3));
    if (tag === 'cmap') cmap = v.getUint32(o + 8);
  }
  if (cmap < 0) return has;
  const subtables = v.getUint16(cmap + 2);
  for (let i = 0; i < subtables; i++) {
    const off = cmap + v.getUint32(cmap + 4 + i * 8 + 4);
    const format = v.getUint16(off);
    if (format === 4) {
      const segX2 = v.getUint16(off + 6);
      const ends = off + 14;
      const starts = ends + segX2 + 2;
      for (let s = 0; s < segX2 / 2; s++) {
        const end = v.getUint16(ends + s * 2);
        const start = v.getUint16(starts + s * 2);
        for (let c = start; c <= end && c < 0xffff; c++) has.add(c);
      }
    } else if (format === 12) {
      const groups = v.getUint32(off + 12);
      for (let g = 0; g < groups; g++) {
        const start = v.getUint32(off + 16 + g * 12);
        const end = v.getUint32(off + 20 + g * 12);
        for (let c = start; c <= end; c++) has.add(c);
      }
    }
  }
  return has;
}

async function load(url: string): Promise<LoadedFont> {
  const buf = await (await fetch(url)).arrayBuffer();
  return { base64: toBase64(buf), coverage: readCoverage(buf) };
}

/** Registra as fontes de símbolos no documento (carrega os arquivos só uma vez). */
export async function registerFonts(doc: jsPDF): Promise<void> {
  cache ??= Promise.all([load(symUrl), load(sym2Url)]).then(([sym, sym2]) => ({ sym, sym2 }));
  const fonts = await cache;
  coverage = { sym: fonts.sym.coverage, sym2: fonts.sym2.coverage };
  for (const [key, file] of [['sym', 'NotoSansSymbols-Regular.ttf'], ['sym2', 'NotoSansSymbols2-Regular.ttf']] as const) {
    doc.addFileToVFS(file, fonts[key].base64);
    // Mesmo arquivo para "bold": os gráficos pedem negrito em alguns glifos
    doc.addFont(file, FONT_FAMILY[key], 'normal');
    doc.addFont(file, FONT_FAMILY[key], 'bold');
  }
}

/* ── Divisão do texto por fonte ── */

// Caracteres fora do Latin-1 que a codificação WinAnsi das fontes padrão aceita
const WINANSI_EXTRA = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.split('').map(c => c.codePointAt(0)!));

const SUBSTITUTES: Record<string, string> = {
  '℞': 'R',   // ℞ não existe nas fontes embutidas
  '︎': '',    // seletor "texto" (só faz sentido na tela)
  '️': '',
  '≈': '~',
};

function fontFor(cp: number): FontKey | null {
  if ((cp >= 0x20 && cp < 0x7f) || (cp >= 0xa0 && cp <= 0xff) || WINANSI_EXTRA.has(cp)) return 'times';
  if (coverage?.sym.has(cp)) return 'sym';
  if (coverage?.sym2.has(cp)) return 'sym2';
  return null;
}

export interface Run {
  font: FontKey;
  text: string;
}

/** Quebra o texto em trechos contínuos de uma mesma fonte. */
export function splitRuns(text: string): Run[] {
  const runs: Run[] = [];
  for (const raw of text) {
    const ch = raw in SUBSTITUTES ? SUBSTITUTES[raw] : raw;
    if (!ch) continue;
    const font = fontFor(ch.codePointAt(0)!) ?? 'times';
    const safe = fontFor(ch.codePointAt(0)!) ? ch : '?';
    const last = runs[runs.length - 1];
    if (last && last.font === font) last.text += safe;
    else runs.push({ font, text: safe });
  }
  return runs;
}

export function setRunFont(doc: jsPDF, font: FontKey, bold = false): void {
  if (font === 'times') doc.setFont('times', bold ? 'bold' : 'normal');
  else doc.setFont(FONT_FAMILY[font], 'normal');
}
