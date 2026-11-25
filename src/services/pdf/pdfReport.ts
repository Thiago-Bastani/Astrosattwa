import React from 'react';
import { jsPDF } from 'jspdf';
import 'svg2pdf.js';
import { Capacitor } from '@capacitor/core';
import type { ChartData, GeoLocation } from '../../types/astro';
import type { PlanetaryDay } from '../../utils/planetary';
import { WEEKDAY_NAMES_PT, getPlanetaryWeekday } from '../../utils/planetary';
import { getCurrentTattwa, type TattwaInfo } from '../../utils/tattwa';
import { DAY_PALETTES, paletteToCssVars } from '../../theme/palettes';
import { PLANET_COLORS, PLANET_GLYPHS, ZODIAC_SIGNS, getZodiacSign } from '../../utils/zodiac';
import { PLANET_NAMES_PT, SIGN_NAMES_PT } from '../../utils/astroLabels';
import { ASPECTS, listAspects, type FoundAspect } from '../../utils/aspects';
import {
  ASPECT_WORDS, HOUSE_KEYWORDS, PLANET_KEYWORDS, SIGN_KEYWORDS,
  REAL_HOUSE_ANGULAR_ORB, REAL_HOUSE_COMMON_ORB, getRealHouse, isApproximate, orientBySpeed, speedRank,
} from '../../utils/briefReading';
import { calculateLahiriAyanamsa } from '../astroCalculator';
import MandalaChart from '../../components/MandalaChart';
import VedicChart from '../../components/VedicChart';
import AspectGrid from '../../components/AspectGrid';
import PlanetaryHoursChart from '../../components/PlanetaryHoursChart';
import NakshatraSymbol from '../../components/NakshatraSymbol';
import { MANAZIL, NAKSHATRAS, NAKSHATRA_DATA } from '../../utils/lunarMansions';
import {
  BENEFIC_WESTERN, HOUR_USE, MALEFIC_WESTERN, TITHI_GROUP_TEXT, VARA_INFO,
  FACE_TEXT, MUHURTA_NATURE, NAKSHATRA_FACE, moonDignity, varaOf,
} from '../../utils/electionalReading';
import {
  BHAVA_TEXT, DASHA_YEARS, GANA_TEXT, GRAHA_INFO, GRAHA_NAMES, HOUSE_GROUPS, HOUSE_TYPE_TEXT, LAGNA_TEXT, NAKSHATRA_INFO, NATURE_TEXT, SIGN_INFO, VEDIC_RULERS,
  dignityText, grahaDignity, grahasInHouse, houseSignIndex, nakshatraPada, nakshatraSpan, padaNavamsha, wholeSignHouse,
} from '../../utils/vedicReading';
import { electionalDay, type ElectionalDay, type Period } from '../../utils/electionalDay';
import { registerFonts, setRunFont, splitRuns } from './pdfFonts';
import { chartToSvg } from './pdfSvg';
import { ALL_SECTIONS, REPORT_SECTIONS, type ReportSection } from './pdfSections';

/**
 * Relatório em PDF (A4): capa, leitura védica e leitura ocidental montado só a partir dos dados do mapa:
 * mesmo conteúdo e mesmo layout em qualquer aparelho, independente da tela.
 */

export interface ReportInput {
  chart: ChartData;
  date: Date;
  location: GeoLocation;
  planetaryDay: PlanetaryDay | null;
  /** Nome para a capa (opcional, para mapas natais) */
  name?: string;
  /** Seções incluídas, na ordem de ALL_SECTIONS (vazio/ausente: todas) */
  sections?: readonly ReportSection[];
}

const W = 210;
const H = 297;
const M = 12;

/* ── Cores ── */

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(c: RGB): string {
  return '#' + c.map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

function hslToHex(hsl: string): string {
  const m = hsl.match(/hsl\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*\)/);
  if (!m) return '#111111';
  const h = parseFloat(m[1]) / 360, s = parseFloat(m[2]) / 100, l = parseFloat(m[3]) / 100;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return rgbToHex([f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255]);
}

/** Cor `fg` com opacidade `alpha` sobre o fundo `bg` (sem transparência no PDF). */
function blend(fg: string, bg: string, alpha: number): string {
  const a = hexToRgb(fg), b = hexToRgb(bg);
  return rgbToHex([0, 1, 2].map(i => b[i] + (a[i] - b[i]) * alpha) as RGB);
}

interface Theme {
  vars: Record<string, string>;
  accent: string;
  onAccent: string;
  highlight: string;
  bg: string;
  raised: string;
  text: string;
  muted: string;
  faint: string;
  line: string;
  hourColor: string;
  dayName: string;
  dayRuler: string;
  paletteName: string;
}

function makeTheme(input: ReportInput): Theme {
  const weekday = getPlanetaryWeekday(input.date, input.location);
  const palette = DAY_PALETTES[weekday];
  const vars = paletteToCssVars(palette);
  const bg = hslToHex(vars['--as-bg']);
  const raised = hslToHex(vars['--as-bg-raised']);
  const text = vars['--as-text'];
  const hourRuler = input.planetaryDay?.current?.ruler ?? palette.planet;
  return {
    vars,
    accent: palette.accent,
    onAccent: palette.partner,
    highlight: vars['--as-highlight'],
    bg,
    raised,
    text,
    muted: blend(text, bg, 0.62),
    faint: blend(text, bg, 0.38),
    line: blend(palette.accent, bg, 0.4),
    hourColor: PLANET_COLORS[hourRuler] ?? palette.accent,
    dayName: WEEKDAY_NAMES_PT[weekday],
    dayRuler: palette.planet,
    paletteName: palette.name,
  };
}

/* ── Texto com glifos ── */

interface TextOpts {
  size: number;
  color: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  spacing?: number;
}

function runWidth(doc: jsPDF, text: string, spacing = 0): number {
  return doc.getTextWidth(text) + spacing * text.length;
}

function textWidth(doc: jsPDF, text: string, size: number, bold = false, spacing = 0): number {
  doc.setFontSize(size);
  return splitRuns(text).reduce((w, r) => {
    setRunFont(doc, r.font, bold);
    return w + runWidth(doc, r.text, spacing);
  }, 0);
}

/** Escreve texto misturando Times e as fontes de símbolos. Devolve a largura. */
function rich(doc: jsPDF, text: string, x: number, y: number, o: TextOpts): number {
  const total = textWidth(doc, text, o.size, o.bold, o.spacing);
  let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
  doc.setFontSize(o.size);
  doc.setTextColor(o.color);
  for (const r of splitRuns(text)) {
    setRunFont(doc, r.font, o.bold);
    doc.text(r.text, cx, y, o.spacing ? { charSpace: o.spacing } : undefined);
    cx += runWidth(doc, r.text, o.spacing);
  }
  return total;
}

/** Corta o texto com "…" para caber na largura. */
function fit(doc: jsPDF, text: string, maxW: number, size: number, bold = false): string {
  if (textWidth(doc, text, size, bold) <= maxW) return text;
  let t = text;
  while (t.length > 1 && textWidth(doc, t + '…', size, bold) > maxW) t = t.slice(0, -1);
  return t.trimEnd() + '…';
}

/* ── Formatação ── */

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const ddmmyyyy = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const glyph = (name: string) => PLANET_GLYPHS[name] ?? '';
const nameOf = (name: string) => PLANET_NAMES_PT[name] ?? name;
/** "do Sol", "da Lua", "de Mercúrio" */
const ofName = (name: string) => (name === 'Sun' ? 'do ' : name === 'Moon' ? 'da ' : 'de ') + nameOf(name);

function lonLabel(lon: number): string {
  const { sign, degree, minute } = getZodiacSign(lon);
  return `${sign.glyph} ${degree}°${pad(minute)}'`;
}

function orbLabel(orb: number): string {
  let deg = Math.floor(orb);
  let min = Math.round((orb - deg) * 60);
  if (min === 60) { deg += 1; min = 0; }
  return `${deg}°${pad(min)}'`;
}

const DIGNITY_PT: Record<string, { label: string; color: string }> = {
  domicilio: { label: 'Domicílio', color: '#2ecc71' },
  exaltacao: { label: 'Exaltação', color: '#f1c40f' },
  queda:     { label: 'Queda',     color: '#e74c3c' },
  exilio:    { label: 'Exílio',    color: '#95a5a6' },
};

/* ── Blocos de layout ── */

function paintPage(doc: jsPDF, t: Theme): void {
  doc.setFillColor(t.bg);
  doc.rect(0, 0, W, H, 'F');
}

function sectionTitle(doc: jsPDF, t: Theme, title: string, x: number, y: number, w: number): void {
  rich(doc, title.toUpperCase(), x, y, { size: 8, color: t.highlight, bold: true, spacing: 0.4 });
  doc.setDrawColor(t.line);
  doc.setLineWidth(0.2);
  doc.line(x, y + 1.6, x + w, y + 1.6);
}

function card(doc: jsPDF, t: Theme, x: number, y: number, w: number, h: number, edge?: string): void {
  doc.setFillColor(t.raised);
  doc.setDrawColor(blend(t.accent, t.raised, 0.35));
  doc.setLineWidth(0.25);
  doc.roundedRect(x, y, w, h, 2, 2, 'FD');
  if (edge) {
    doc.setFillColor(edge);
    doc.rect(x + 0.6, y + 2, 0.9, h - 4, 'F');
  }
}

type Part = 'cover' | ReportSection;

const PART_FOOTER: Record<ReportSection, string> = {
  'vedic-natal': 'leitura védica · casas por signo inteiro',
  'vedic-electional': 'muhurta · casas por signo inteiro',
  'western-natal': 'leitura ocidental · casas iguais a partir do ASC',
  'western-electional': 'eleição ocidental',
};

function footer(doc: jsPDF, t: Theme, input: ReportInput, page: number, pages: number, part: Part): void {
  if (part === 'cover') return;
  const sys = input.chart.zodiacSystem === 'sidereal'
    ? `zodíaco sideral · ayanamsa Lahiri ${calculateLahiriAyanamsa(input.date).toFixed(2)}°`
    : 'zodíaco tropical';
  doc.setDrawColor(t.line);
  doc.setLineWidth(0.2);
  doc.line(M, H - 11, W - M, H - 11);
  rich(doc, `Astrosattwa · ${sys} · ${PART_FOOTER[part]}`, M, H - 7, { size: 7, color: t.faint });
  rich(doc, `Paleta do dia: ${t.paletteName} · ${page}/${pages}`, W - M, H - 7, { size: 7, color: t.faint, align: 'right' });
}

/** Faixa do topo nas cores do dia; a linha fina embaixo tem a cor do planeta da hora. */
function header(doc: jsPDF, t: Theme, input: ReportInput, compact: boolean, kicker = 'MAPA DO CÉU'): number {
  const h = compact ? 14 : 30;
  doc.setFillColor(t.accent);
  doc.rect(0, 0, W, h, 'F');
  doc.setFillColor(t.hourColor);
  doc.rect(0, h, W, 1.2, 'F');

  const when = `${ddmmyyyy(input.date)} · ${hhmm(input.date)}`;
  if (compact) {
    rich(doc, 'Astrosattwa', M, 9, { size: 13, color: t.onAccent, bold: true });
    const who = input.name ? `${input.name} · ` : '';
    rich(doc, fit(doc, `${who}${when} · ${input.location.name}`, 140, 8.5), W - M, 9, { size: 8.5, color: t.onAccent, align: 'right' });
    return h + 1.2;
  }

  rich(doc, 'Astrosattwa', M, 13, { size: 22, color: t.onAccent, bold: true });
  rich(doc, kicker, M, 21, { size: 8, color: t.onAccent, spacing: 0.8 });
  rich(doc, when, W - M, 12.5, { size: 15, color: t.onAccent, bold: true, align: 'right' });
  const place = fit(doc, input.location.name, 110, 9);
  rich(doc, place, W - M, 19, { size: 9, color: t.onAccent, align: 'right' });
  const sys = input.chart.zodiacSystem === 'sidereal' ? 'Sideral (Lahiri)' : 'Tropical';
  const coords = `${Math.abs(input.location.lat).toFixed(2)}°${input.location.lat >= 0 ? 'N' : 'S'} ${Math.abs(input.location.lon).toFixed(2)}°${input.location.lon >= 0 ? 'L' : 'O'}`;
  rich(doc, `${coords} · ${sys} · Dia de ${t.dayName} ${glyph(t.dayRuler)}`, W - M, 24.5, { size: 8, color: t.onAccent, align: 'right' });
  return h + 1.2;
}

/* ── Página 1: resumo, mandala, mapa védico e posições ── */

function tattwaShape(doc: jsPDF, tw: TattwaInfo, cx: number, cy: number, r: number, bg: string): void {
  doc.setFillColor(tw.color);
  switch (tw.shape) {
    case 'square':
      doc.rect(cx - r, cy - r, 2 * r, 2 * r, 'F');
      break;
    case 'triangle':
      doc.triangle(cx, cy - r, cx + r, cy + r * 0.8, cx - r, cy + r * 0.8, 'F');
      break;
    case 'pentagon':
      doc.circle(cx, cy, r, 'F');
      break;
    case 'crescent-up':
      doc.circle(cx, cy, r, 'F');
      doc.setFillColor(bg);
      doc.circle(cx, cy - r * 0.45, r * 0.85, 'F');
      break;
    case 'crescent-left':
      doc.ellipse(cx, cy, r * 0.75, r, 'F');
      break;
  }
}

function statusCards(doc: jsPDF, t: Theme, input: ReportInput, y: number): number {
  const gap = 3;
  const w = (W - 2 * M - 3 * gap) / 4;
  const h = 24;
  const { moonPhase } = input.chart;
  const tw = getCurrentTattwa(input.date, input.location);
  const hour = input.planetaryDay?.current ?? null;

  const cards: { label: string; edge?: string; draw: (x: number) => void }[] = [
    {
      label: 'Tattwa',
      edge: tw?.color,
      draw: x => {
        if (!tw) { rich(doc, '—', x, y + 14, { size: 12, color: t.text }); return; }
        tattwaShape(doc, tw, x + 2.4, y + 12.6, 2.2, t.raised);
        rich(doc, tw.name, x + 6.5, y + 14, { size: 12, color: t.text, bold: true });
        rich(doc, fit(doc, `${tw.elementPt}${tw.subTattwa ? ` · sub ${tw.subTattwa.name}` : ''}`, w - 8, 7.5), x, y + 19.5, { size: 7.5, color: t.muted });
        rich(doc, `${Math.ceil(tw.minutesRemaining)} min`, x + w - 7, y + 6.5, { size: 7, color: t.faint, align: 'right' });
      },
    },
    {
      label: 'Lua',
      draw: x => {
        // Disco da Lua: parte clara proporcional à iluminação
        const cx = x + 2.6, cy = y + 12.6, r = 2.5;
        doc.setFillColor(blend('#ecf0f1', t.raised, 0.18));
        doc.circle(cx, cy, r, 'F');
        doc.setFillColor('#ecf0f1');
        doc.ellipse(cx, cy, r * Math.max(0.05, moonPhase.illumination / 100), r, 'F');
        const avail = w - 15;
        const size = [11.5, 10.5, 9.5].find(sz => textWidth(doc, moonPhase.name, sz, true) <= avail) ?? 9.5;
        rich(doc, fit(doc, moonPhase.name, avail, size, true), x + 6.8, y + 14, { size, color: t.text, bold: true });
        rich(doc, `${moonPhase.illumination}% iluminada · ${Math.round(moonPhase.angle)}° do Sol`, x, y + 19.5, { size: 7.5, color: t.muted });
      },
    },
    {
      label: 'Manzil',
      draw: x => {
        const z = moonPhase.arabicMansion;
        rich(doc, `${z.number}ª`, x, y + 14, { size: 7.5, color: t.faint });
        rich(doc, fit(doc, z.name, w - 14, 10.5, true), x + 5.5, y + 14, { size: 10.5, color: t.text, bold: true });
        rich(doc, fit(doc, z.meaning ?? '', w - 8, 7.5), x, y + 19.5, { size: 7.5, color: t.muted });
      },
    },
    {
      label: 'Hora planetária',
      edge: t.hourColor,
      draw: x => {
        if (!hour) { rich(doc, '—', x, y + 14, { size: 12, color: t.text }); return; }
        rich(doc, glyph(hour.ruler), x, y + 14.4, { size: 13, color: PLANET_COLORS[hour.ruler] });
        rich(doc, nameOf(hour.ruler), x + 6.5, y + 14, { size: 12, color: t.text, bold: true });
        rich(doc, `${hhmm(hour.start)}–${hhmm(hour.end)} · ${(hour.index - 1) % 12 + 1}ª ${hour.isDay ? 'diurna' : 'noturna'}`, x, y + 19.5, { size: 7.5, color: t.muted });
      },
    },
  ];

  cards.forEach((c, i) => {
    const x = M + i * (w + gap);
    card(doc, t, x, y, w, h, c.edge);
    rich(doc, c.label.toUpperCase(), x + 4, y + 6.5, { size: 6.5, color: t.highlight, bold: true, spacing: 0.3 });
    c.draw(x + 4);
  });
  return y + h;
}

async function drawSvg(doc: jsPDF, el: React.ReactElement, t: Theme, x: number, y: number, w: number, h: number): Promise<void> {
  const svg = chartToSvg(el, t.vars);
  if (!svg) return;
  await doc.svg(svg, { x, y, width: w, height: h });
}

function positionsTable(doc: jsPDF, t: Theme, chart: ChartData, y: number): number {
  const cols = [
    { title: 'Corpo', w: 36 },
    { title: 'Signo', w: 33 },
    { title: 'Grau', w: 17 },
    { title: 'Casa', w: 13 },
    { title: 'Dignidade', w: 22 },
    { title: 'Decanato', w: 17 },
    { title: 'Mov.', w: 13 },
    { title: 'Regente da casa', w: 35 },
  ];
  const rowH = 5.6;
  let x = M;
  const xs = cols.map(c => { const cx = x; x += c.w; return cx; });

  cols.forEach((c, i) => rich(doc, c.title.toUpperCase(), xs[i] + 1.5, y, { size: 6.5, color: t.faint, bold: true, spacing: 0.2 }));
  y += 2;

  chart.planets.forEach((p, r) => {
    const top = y + r * rowH;
    if (r % 2 === 0) {
      doc.setFillColor(blend(t.raised, t.bg, 0.7));
      doc.rect(M, top, W - 2 * M, rowH, 'F');
    }
    const base = top + rowH * 0.7;
    const color = PLANET_COLORS[p.name] ?? t.text;
    const sign = ZODIAC_SIGNS.find(s => s.name === p.zodiacSign);
    rich(doc, glyph(p.name), xs[0] + 1.5, base, { size: 9.5, color });
    rich(doc, nameOf(p.name), xs[0] + 7, base, { size: 8.5, color: t.text, bold: !p.isVirtual });
    rich(doc, sign?.glyph ?? '', xs[1] + 1.5, base, { size: 9, color: sign?.color ?? t.text });
    rich(doc, SIGN_NAMES_PT[p.zodiacSign] ?? p.zodiacSign, xs[1] + 6.5, base, { size: 8.5, color: t.text });
    rich(doc, `${p.signDegree}°${pad(p.signMinute)}'`, xs[2] + 1.5, base, { size: 8.5, color: t.text });
    rich(doc, p.house ? String(p.house) : '—', xs[3] + 1.5, base, { size: 8.5, color: t.text });
    const dig = p.dignity ? DIGNITY_PT[p.dignity] : null;
    rich(doc, dig?.label ?? '—', xs[4] + 1.5, base, { size: 8, color: dig?.color ?? t.faint });
    rich(doc, p.decanate ? `${p.decanate}º` : '—', xs[5] + 1.5, base, { size: 8.5, color: t.muted });
    rich(doc, p.isRetrograde ? 'R' : p.isVirtual ? '—' : 'D', xs[6] + 1.5, base, { size: 8.5, color: p.isRetrograde ? '#e74c3c' : t.faint, bold: p.isRetrograde });
    if (p.houseRuler) {
      rich(doc, glyph(p.houseRuler), xs[7] + 1.5, base, { size: 9, color: PLANET_COLORS[p.houseRuler] ?? t.text });
      rich(doc, nameOf(p.houseRuler), xs[7] + 7, base, { size: 8, color: t.muted });
    }
  });
  return y + chart.planets.length * rowH;
}

function anglesRow(doc: jsPDF, t: Theme, chart: ChartData, y: number): number {
  const items: [string, number][] = [
    ['Ascendente', chart.ascendant], ['Meio do Céu', chart.mc],
    ['Descendente', chart.descendant], ['Fundo do Céu', chart.ic],
  ];
  const w = (W - 2 * M) / 4;
  items.forEach(([label, lon], i) => {
    const x = M + i * w;
    const { sign } = getZodiacSign(lon);
    rich(doc, label.toUpperCase(), x, y, { size: 6.5, color: t.faint, bold: true, spacing: 0.2 });
    const lw = rich(doc, lonLabel(lon), x, y + 5, { size: 10, color: t.text, bold: true });
    rich(doc, SIGN_NAMES_PT[sign.name], x + lw + 1.5, y + 5, { size: 8, color: t.muted });
  });
  return y + 6;
}

/* ── Página 2: aspectos e horas planetárias ── */

function aspectLegend(doc: jsPDF, t: Theme, x: number, y: number, w: number): number {
  let cx = x, cy = y;
  for (const a of ASPECTS) {
    const label = `${a.glyph} ${a.name} (${a.orb}°)`;
    const lw = textWidth(doc, label, 7.5) + 4;
    if (cx + lw > x + w) { cx = x; cy += 4.2; }
    rich(doc, a.glyph, cx, cy, { size: 8, color: a.color });
    rich(doc, ` ${a.name} (${a.orb}°)`, cx + textWidth(doc, a.glyph, 8), cy, { size: 7.5, color: t.muted });
    cx += lw;
  }
  return cy;
}

function aspectList(doc: jsPDF, t: Theme, chart: ChartData, y: number): number {
  const found = listAspects(chart.planets).sort((p, q) => p.orb - q.orb);

  const cols = 3;
  const colW = (W - 2 * M) / cols;
  const rowH = 4.9;
  const maxRows = 11;
  const shown = found.slice(0, cols * maxRows);
  shown.forEach((f, i) => {
    const col = Math.floor(i / maxRows);
    const row = i % maxRows;
    const x = M + col * colW;
    const base = y + row * rowH;
    let cx = x;
    cx += rich(doc, glyph(f.a), cx, base, { size: 8.5, color: PLANET_COLORS[f.a] ?? t.text }) + 1;
    cx += rich(doc, f.aspect.glyph, cx, base, { size: 8.5, color: f.aspect.color }) + 1;
    cx += rich(doc, glyph(f.b), cx, base, { size: 8.5, color: PLANET_COLORS[f.b] ?? t.text }) + 2;
    rich(doc, fit(doc, `${nameOf(f.a)} ${f.aspect.name.toLowerCase()} ${nameOf(f.b)}`, colW - (cx - x) - 12, 7.5), cx, base, { size: 7.5, color: t.text });
    rich(doc, orbLabel(f.orb), x + colW - 4, base, { size: 7, color: t.faint, align: 'right' });
  });
  if (!found.length) rich(doc, 'Nenhum aspecto dentro das orbes.', M, y, { size: 8, color: t.muted });
  const rows = Math.min(maxRows, Math.max(1, shown.length));
  if (found.length > shown.length) {
    rich(doc, `+ ${found.length - shown.length} aspectos de orbe maior`, M, y + rows * rowH, { size: 7, color: t.faint });
    return y + (rows + 1) * rowH;
  }
  return y + rows * rowH;
}

function hoursTable(doc: jsPDF, t: Theme, day: PlanetaryDay, y: number): number {
  const colW = (W - 2 * M - 6) / 2;
  const rowH = 5;
  const groups = [
    { title: `Dia · ${hhmm(day.sunrise)} → ${hhmm(day.sunset)}`, hours: day.hours.filter(h => h.isDay), x: M },
    { title: `Noite · ${hhmm(day.sunset)} → ${hhmm(day.nextSunrise)}`, hours: day.hours.filter(h => !h.isDay), x: M + colW + 6 },
  ];
  for (const g of groups) {
    rich(doc, g.title, g.x, y, { size: 7.5, color: t.muted, bold: true });
    g.hours.forEach((h, i) => {
      const top = y + 2 + i * rowH;
      const isCurrent = day.current?.index === h.index;
      if (isCurrent) {
        doc.setFillColor(blend(PLANET_COLORS[h.ruler] ?? t.accent, t.bg, 0.3));
        doc.rect(g.x, top, colW, rowH, 'F');
      } else if (i % 2 === 0) {
        doc.setFillColor(blend(t.raised, t.bg, 0.7));
        doc.rect(g.x, top, colW, rowH, 'F');
      }
      const base = top + rowH * 0.72;
      rich(doc, `${(h.index - 1) % 12 + 1}ª`, g.x + 2, base, { size: 7.5, color: t.faint });
      rich(doc, `${hhmm(h.start)}–${hhmm(h.end)}`, g.x + 10, base, { size: 8, color: t.text });
      rich(doc, glyph(h.ruler), g.x + 34, base, { size: 9, color: PLANET_COLORS[h.ruler] });
      rich(doc, nameOf(h.ruler), g.x + 40, base, { size: 8, color: t.text, bold: isCurrent });
      if (isCurrent) rich(doc, 'agora', g.x + colW - 2, base, { size: 7, color: t.highlight, align: 'right', bold: true });
    });
  }
  return y + 2 + 12 * rowH;
}

/* ── Montagem ── */

/* ── Leitura breve natal ── */

const CONTENT_BOTTOM = H - 15;

function newPage(doc: jsPDF, t: Theme, input: ReportInput): number {
  doc.addPage();
  paintPage(doc, t);
  return header(doc, t, input, true) + 8;
}

/** Escreve um parágrafo quebrando linhas; devolve o y após a última linha. */
function paragraph(doc: jsPDF, text: string, x: number, y: number, w: number, size: number, color: string, lh: number): number {
  doc.setFontSize(size);
  setRunFont(doc, 'times', false);
  const lines: string[] = doc.splitTextToSize(text, w);
  lines.forEach((l, i) => rich(doc, l, x, y + i * lh, { size, color }));
  return y + lines.length * lh;
}

/** "a, b e c" */
function listPt(words?: readonly string[]): string {
  if (!words || !words.length) return '—';
  if (words.length === 1) return words[0];
  return `${words.slice(0, -1).join(', ')} e ${words[words.length - 1]}`;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

interface Seg { text: string; color: string; bold?: boolean }

const BOLD_SLACK = 0.45;

/**
 * Texto corrido com trechos de estilos diferentes, quebrando por palavra.
 * Com draw = false só mede. Devolve o y da linha seguinte.
 */
function flow(doc: jsPDF, segs: Seg[], x: number, y: number, w: number, size: number, lh: number, draw = true): number {
  const words: Seg[] = [];
  for (const s of segs) {
    s.text.split(/(\s+)/).filter(Boolean).forEach(p => words.push({ ...s, text: p }));
  }
  let cx = x;
  let cy = y;
  let lineStart = true;
  for (const wd of words) {
    const isSpace = /^\s+$/.test(wd.text);
    if (isSpace && lineStart) continue;
    const ww = textWidth(doc, wd.text, size, wd.bold);
    if (!isSpace && cx + ww > x + w && !lineStart) {
      cx = x;
      cy += lh;
      lineStart = true;
    }
    if (draw && !isSpace) rich(doc, wd.text, cx, cy, { size, color: wd.color, bold: wd.bold });
    // O negrito do leitor costuma sair um pouco mais largo que a métrica do jsPDF
    cx += ww + (wd.bold && !isSpace ? BOLD_SLACK : 0);
    lineStart = false;
  }
  return cy + lh;
}

const signOf = (lon: number) => getZodiacSign(lon).sign;
const signName = (name: string) => SIGN_NAMES_PT[name] ?? name;

const READ_SIZE = 8.6;
const READ_LH = 4.1;

/* Casas */

function houseSegs(t: Theme, chart: ChartData, i: number): Seg[] {
  const sign = signOf(chart.houseCusps[i]);
  return [
    { text: cap(listPt(HOUSE_KEYWORDS[i])), color: t.text, bold: true },
    { text: ' na energia de ', color: t.faint },
    { text: `${listPt(SIGN_KEYWORDS[sign.name])}.`, color: t.muted },
  ];
}

function houseCard(doc: jsPDF, t: Theme, chart: ChartData, i: number, x: number, y: number, w: number, h: number): void {
  const sign = signOf(chart.houseCusps[i]);
  card(doc, t, x, y, w, h, sign.color);
  const lx = x + 4;

  // Referência discreta: casa, signo e corpos (casa real; * = veio da casa anterior)
  let cx = lx;
  cx += rich(doc, `Casa ${i + 1}`, cx, y + 4.6, { size: 6.5, color: t.faint, spacing: 0.2 }) + 1.5;
  rich(doc, `${sign.glyph} ${signName(sign.name)}`, cx, y + 4.6, { size: 6.5, color: t.faint, spacing: 0.2 });
  const bodies = chart.planets.filter(p => getRealHouse(p.longitude, chart) === i + 1);
  let gx = x + w - 3.5;
  for (const p of [...bodies].reverse()) {
    if (p.house !== undefined && p.house !== i + 1) gx -= rich(doc, '*', gx, y + 4.6, { size: 6.5, color: t.faint, align: 'right' });
    gx -= rich(doc, glyph(p.name), gx, y + 4.8, { size: 7.5, color: PLANET_COLORS[p.name] ?? t.text, align: 'right' }) + 0.8;
  }

  flow(doc, houseSegs(t, chart, i), lx, y + 9.6, w - 8, READ_SIZE, READ_LH);
}

/* Aspectos */

function bodySegs(t: Theme, chart: ChartData, name: string, lead: Seg[]): Seg[] {
  const p = chart.planets.find(q => q.name === name)!;
  const sign = signOf(p.longitude);
  const house = getRealHouse(p.longitude, chart);
  const kw = listPt(PLANET_KEYWORDS[name]);
  return [
    ...lead,
    { text: lead.length ? kw : cap(kw), color: t.text, bold: true },
    { text: ', na energia de ', color: t.faint },
    { text: listPt(SIGN_KEYWORDS[sign.name]), color: t.muted },
    { text: ', na área de ', color: t.faint },
    { text: listPt(HOUSE_KEYWORDS[house - 1]), color: t.muted },
  ];
}

function bodyRef(chart: ChartData, name: string): string {
  const p = chart.planets.find(q => q.name === name)!;
  const sign = signOf(p.longitude);
  const house = getRealHouse(p.longitude, chart);
  const shifted = p.house !== undefined && p.house !== house;
  return `${nameOf(name)} · ${sign.glyph} ${signName(sign.name)} · Casa ${house}${shifted ? '*' : ''}`;
}

function aspectBody(t: Theme, chart: ChartData, f: FoundAspect): { a: Seg[]; b: Seg[] } {
  const word = ASPECT_WORDS[f.aspect.name] ?? f.aspect.name;
  return {
    a: [...bodySegs(t, chart, f.a, []), { text: ',', color: t.faint }],
    b: [...bodySegs(t, chart, f.b, [
      // O corpo mais lento (b) atua sobre o mais rápido (a)
      { text: 'recebendo, em ', color: t.faint },
      { text: word.toLowerCase(), color: f.aspect.color, bold: true },
      { text: ', a influência de ', color: t.faint },
    ]), { text: '.', color: t.faint }],
  };
}

const ASPECT_TEXT_TOP = 10.2;

function aspectCardHeight(doc: jsPDF, t: Theme, chart: ChartData, f: FoundAspect, w: number): number {
  const { a, b } = aspectBody(t, chart, f);
  const tw = w - 8;
  let y = flow(doc, a, 0, 0, tw, READ_SIZE, READ_LH, false);
  y = flow(doc, b, 0, y, tw, READ_SIZE, READ_LH, false);
  return ASPECT_TEXT_TOP + y - READ_LH + 3.6;
}

function aspectCard(doc: jsPDF, t: Theme, chart: ChartData, f: FoundAspect, y: number, h: number): void {
  const x = M;
  const w = W - 2 * M;
  card(doc, t, x, y, w, h, f.aspect.color);
  const lx = x + 4;
  const top = y + 4.8;

  // Referência discreta no topo: quem, onde e o aspecto técnico
  let cx = lx;
  cx += rich(doc, glyph(f.a), cx, top + 0.2, { size: 7.5, color: PLANET_COLORS[f.a] ?? t.text }) + 1;
  cx += rich(doc, f.aspect.glyph, cx, top + 0.2, { size: 7.5, color: f.aspect.color }) + 1;
  cx += rich(doc, glyph(f.b), cx, top + 0.2, { size: 7.5, color: PLANET_COLORS[f.b] ?? t.text }) + 2.5;
  rich(doc, `${bodyRef(chart, f.a)}   recebe ${f.aspect.name.toLowerCase()} de   ${bodyRef(chart, f.b)}`, cx, top, { size: 6.5, color: t.faint, spacing: 0.1 });
  const approx = isApproximate(f.orb, f.aspect.orb);
  rich(doc, `orbe ${orbLabel(f.orb)}${approx ? ' · aproximado' : ''}`, x + w - 4, top, { size: 6.5, color: t.faint, align: 'right' });

  const { a, b } = aspectBody(t, chart, f);
  const tw = w - 8;
  const ny = flow(doc, a, lx, y + ASPECT_TEXT_TOP, tw, READ_SIZE, READ_LH);
  flow(doc, b, lx, ny, tw, READ_SIZE, READ_LH);
}

function briefReading(doc: jsPDF, t: Theme, input: ReportInput): void {
  const { chart } = input;
  let y = newPage(doc, t, input);
  const fullW = W - 2 * M;

  sectionTitle(doc, t, 'Leitura breve natal', M, y, fullW);
  y = paragraph(doc,
    'Leitura descritiva por palavras-chave: indica temas e qualidades presentes no mapa, sem caráter de previsão. ' +
    `Considera a casa real: um corpo a até ${REAL_HOUSE_COMMON_ORB}° antes de uma cúspide, ou a até ${REAL_HOUSE_ANGULAR_ORB}° antes do ASC, IC, DSC ou MC, ` +
    'é lido na casa seguinte (marcado com *).',
    M, y + 6, fullW, 7.8, t.muted, 3.6) + 4;

  /* Casas: 2 colunas × 6 linhas, altura pela casa de texto mais longo */
  sectionTitle(doc, t, 'Energia das casas', M, y, fullW);
  y += 4.5;
  const gap = 4;
  const cw = (fullW - gap) / 2;
  let lines = 1;
  for (let i = 0; i < 12; i++) {
    lines = Math.max(lines, Math.round(flow(doc, houseSegs(t, chart, i), 0, 0, cw - 8, READ_SIZE, READ_LH, false) / READ_LH));
  }
  const ch = 9.6 + (lines - 1) * READ_LH + 3.4;
  for (let i = 0; i < 12; i++) {
    const col = i < 6 ? 0 : 1;
    const row = i % 6;
    houseCard(doc, t, chart, i, M + col * (cw + gap), y + row * (ch + 2.5), cw, ch);
  }
  y += 6 * (ch + 2.5) + 5;

  /* Aspectos: o mais rápido recebe, o mais lento atua; agrupados pelo mais rápido, depois pelo mais exato */
  const found = listAspects(chart.planets)
    .map(orientBySpeed)
    .sort((p, q) => speedRank(p.a) - speedRank(q.a) || speedRank(p.b) - speedRank(q.b) || p.orb - q.orb);

  const agap = 2.8;
  const first = found.length ? aspectCardHeight(doc, t, chart, found[0], fullW) : 10;
  if (y + 10 + first > CONTENT_BOTTOM) y = newPage(doc, t, input);
  sectionTitle(doc, t, 'Aspectos', M, y, fullW);
  y += 4.5;
  if (!found.length) {
    rich(doc, 'Nenhum aspecto dentro das orbes.', M, y + 4, { size: 8, color: t.muted });
    return;
  }
  for (const f of found) {
    const ah = aspectCardHeight(doc, t, chart, f, fullW);
    if (y + ah > CONTENT_BOTTOM) {
      y = newPage(doc, t, input);
      sectionTitle(doc, t, 'Aspectos (continuação)', M, y, fullW);
      y += 4.5;
    }
    aspectCard(doc, t, chart, f, y, ah);
    y += ah + agap;
  }
}

/* ── Capa ── */

async function coverPage(doc: jsPDF, t: Theme, input: ReportInput): Promise<void> {
  const { chart } = input;
  paintPage(doc, t);
  doc.setFillColor(t.accent);
  doc.rect(0, 0, W, 7, 'F');
  doc.setFillColor(t.hourColor);
  doc.rect(0, 7, W, 1, 'F');

  let y = 30;
  rich(doc, 'ASTROSATTWA', W / 2, y, { size: 9, color: t.highlight, bold: true, spacing: 1.6, align: 'center' });
  y += 17;
  rich(doc, 'Mapa Astral', W / 2, y, { size: 34, color: t.text, bold: true, align: 'center' });
  y += 13;
  if (input.name) {
    rich(doc, fit(doc, input.name, W - 2 * M - 20, 20, true), W / 2, y, { size: 20, color: t.highlight, bold: true, align: 'center' });
    y += 10;
  }
  rich(doc, `${ddmmyyyy(input.date)} · ${hhmm(input.date)} · ${fit(doc, input.location.name, 110, 11)}`, W / 2, y, { size: 11, color: t.text, align: 'center' });
  y += 6;
  const sys = chart.zodiacSystem === 'sidereal'
    ? `zodíaco sideral · ayanamsa Lahiri ${calculateLahiriAyanamsa(input.date).toFixed(2)}°`
    : 'zodíaco tropical';
  const coords = `${Math.abs(input.location.lat).toFixed(2)}°${input.location.lat >= 0 ? 'N' : 'S'} ${Math.abs(input.location.lon).toFixed(2)}°${input.location.lon >= 0 ? 'L' : 'O'}`;
  rich(doc, `${coords} · ${sys}`, W / 2, y, { size: 8.5, color: t.faint, align: 'center' });

  // As duas mandalas lado a lado
  y += 12;
  const chartW = (W - 2 * M - 8) / 2;
  await drawSvg(doc, React.createElement(MandalaChart, { data: chart }), t, M, y, chartW, chartW);
  const vInset = 4;
  await drawSvg(doc, React.createElement(VedicChart, { data: chart }), t, M + chartW + 8 + vInset, y + vInset, chartW - 2 * vInset, chartW - 2 * vInset);
  y += chartW + 5;
  rich(doc, 'MANDALA OCIDENTAL', M + chartW / 2, y, { size: 7, color: t.faint, spacing: 0.5, align: 'center' });
  rich(doc, 'MAPA VÉDICO · RASHI', M + chartW + 8 + chartW / 2, y, { size: 7, color: t.faint, spacing: 0.5, align: 'center' });

  // Sumário
  y += 14;
  const boxW = 150;
  const bx = (W - boxW) / 2;
  const included = REPORT_SECTIONS.filter(s => sectionsOf(input).includes(s.id));
  card(doc, t, bx, y, boxW, 14 + 8 * included.length);
  rich(doc, 'NESTA LEITURA', bx + 7, y + 7, { size: 7, color: t.highlight, bold: true, spacing: 0.4 });
  included.forEach((s, i) => {
    const ly = y + 15 + 8 * i;
    rich(doc, ['I', 'II', 'III', 'IV'][i], bx + 7, ly, { size: 9, color: t.highlight, bold: true });
    rich(doc, s.label, bx + 16, ly, { size: 10, color: t.text, bold: true });
    rich(doc, fit(doc, s.hint, boxW - 63, 8.5), bx + 56, ly, { size: 8.5, color: t.muted });
  });

  rich(doc, 'Leitura descritiva, sem caráter de previsão.', W / 2, H - 16, { size: 8, color: t.faint, align: 'center' });
  doc.setFillColor(t.accent);
  doc.rect(0, H - 7, W, 7, 'F');
}

/* ── Leitura védica ── */

const V_SIZE = 9;
const V_LH = 4.4;

interface Story {
  kicker?: string;
  title: Seg[];
  right?: Seg[];
  paras: Seg[][];
  edge?: string;
  /** Espaço (mm) aberto no título depois do segmento de índice `after`, para um desenho. */
  titleGap?: { after: number; width: number };
}

const STORY_TITLE_SIZE = 10.5;

const PARA_GAP = 3.2 + V_LH - 0.4; // da linha de base anterior à primeira linha do parágrafo

/* Bloco sem moldura: rubrica com filete, título e texto corrido na largura toda. */
const STORY_TOP = 3;      // da borda do bloco à linha de base da rubrica
const STORY_TITLE = 6.6;  // da rubrica à linha de base do título
const STORY_GAP = 7;      // entre blocos

function storyHeight(doc: jsPDF, st: Story, w: number): number {
  let cy = st.kicker ? STORY_TOP + STORY_TITLE : STORY_TOP;
  for (const p of st.paras) cy = flow(doc, p, 0, cy + PARA_GAP, w, V_SIZE, V_LH, false) - V_LH;
  return cy + 1.5;
}

function segsWidth(doc: jsPDF, segs: Seg[], size: number): number {
  return segs.reduce((s, g) => s + textWidth(doc, g.text, size, g.bold) + (g.bold ? BOLD_SLACK : 0), 0);
}

function drawSegs(doc: jsPDF, segs: Seg[], x: number, y: number, size: number, align: 'left' | 'right' = 'left', gap?: { after: number; width: number }): void {
  let cx = align === 'right' ? x - segsWidth(doc, segs, size) - (gap?.width ?? 0) : x;
  segs.forEach((g, i) => {
    cx += rich(doc, g.text, cx, y, { size, color: g.color, bold: g.bold }) + (g.bold ? BOLD_SLACK : 0);
    if (gap && i === gap.after) cx += gap.width;
  });
}

function drawStory(doc: jsPDF, t: Theme, st: Story, y: number): void {
  const x = M;
  const w = W - 2 * M;
  let cy = y + STORY_TOP;
  if (st.kicker) {
    sectionTitle(doc, t, st.kicker, x, cy, w);
    cy += STORY_TITLE;
  }
  drawSegs(doc, st.title, x, cy, STORY_TITLE_SIZE, 'left', st.titleGap);
  if (st.right) drawSegs(doc, st.right, x + w, cy, 9, 'right');
  for (const p of st.paras) cy = flow(doc, p, x, cy + PARA_GAP, w, V_SIZE, V_LH) - V_LH;
}

/** Coloca um bloco, abrindo página nova se não couber. Devolve o y seguinte. */
function placeStory(doc: jsPDF, t: Theme, input: ReportInput, st: Story, y: number, gap = STORY_GAP): number {
  const { top, next } = storySlot(doc, t, input, st, y, gap);
  drawStory(doc, t, st, top);
  return next;
}

/** Onde o bloco cabe (abre página se preciso): topo e y seguinte. */
function storySlot(doc: jsPDF, t: Theme, input: ReportInput, st: Story, y: number, gap = STORY_GAP): { top: number; next: number } {
  const h = storyHeight(doc, st, W - 2 * M);
  if (y + h > CONTENT_BOTTOM) y = newPage(doc, t, input);
  return { top: y, next: y + h + gap };
}

const pName = (name: string) => `${glyph(name)} ${nameOf(name)}`;
const signLabel = (lon: number) => { const s = signOf(lon); return `${s.glyph} ${signName(s.name)}`; };
const degMin = (d: number) => { let g = Math.floor(d); let m = Math.round((d - g) * 60); if (m === 60) { g += 1; m = 0; } return `${g}°${pad(m)}'`; };

/* Frase única por posição, na ordem: onde estou → o que o astro representa → que energia está ali. */

const B = (text: string, color: string): Seg => ({ text, color, bold: true });
const N = (text: string, color: string): Seg => ({ text, color });

/** Qualidades do signo, sem o prefixo técnico de elemento e modalidade. */
const signQualities = (key: string) => SIGN_INFO[key].energy.split(': ').slice(1).join(': ');

function grahaSubject(t: Theme, chart: ChartData, name: string, capital = false): Seg[] {
  const p = chart.planets.find(q => q.name === name)!;
  const subj = GRAHA_INFO[name].subject;
  // Rahu e Ketu já têm o nome sânscrito como nome: não repete
  const inner = [subj === GRAHA_NAMES[name] ? '' : GRAHA_NAMES[name], p.isRetrograde ? 'retrógrado' : ''].filter(Boolean).join(', ');
  return [B(`${capital ? cap(subj) : subj}${inner ? ` (${inner})` : ''}`, PLANET_COLORS[name] ?? t.text)];
}

/** Avaliação: dignidade no signo (e, se pedido, o tipo da casa onde está). */
function conditionSegs(t: Theme, chart: ChartData, name: string, withHouse: boolean): Seg[] {
  const p = chart.planets.find(q => q.name === name)!;
  const d = grahaDignity(name, p.longitude);
  const text = `${cap(GRAHA_INFO[name].subject)} ${dignityText(d.kind, signName(d.sign), nameOf(d.lord))}.`;
  const house = withHouse ? ` ${HOUSE_TYPE_TEXT[wholeSignHouse(p.longitude, chart) - 1]}` : '';
  return [N(text + house, t.text)];
}

/** Graha posicionado: onde está, o que representa, a energia do signo e a condição, num texto só. */
function placementParas(t: Theme, chart: ChartData, name: string): Seg[][] {
  const p = chart.planets.find(q => q.name === name)!;
  const h = wholeSignHouse(p.longitude, chart);
  const b = BHAVA_TEXT[h - 1];
  const sign = signOf(p.longitude).name;
  return [[
    ...grahaSubject(t, chart, name, true), N(' está na ', t.text), B(`casa ${h} (${b.name})`, t.text),
    N(`, ${b.principle} Ali, representa ${GRAHA_INFO[name].what}, com a energia de `, t.text),
    B(`${signName(sign)} (${SIGN_INFO[sign].skt})`, t.text), N(`: ${signQualities(sign)}. `, t.text),
    ...conditionSegs(t, chart, name, true),
  ]];
}

function placementTitle(t: Theme, chart: ChartData, name: string): Seg[] {
  const p = chart.planets.find(q => q.name === name)!;
  const s = signOf(p.longitude);
  return [
    { text: pName(name), color: PLANET_COLORS[name] ?? t.text, bold: true },
    { text: ` (${GRAHA_NAMES[name]})${p.isRetrograde ? ' R' : ''}`, color: t.muted },
    { text: ` em ${s.glyph} ${signName(s.name)} ${degMin(getZodiacSign(p.longitude).degree + getZodiacSign(p.longitude).minute / 60)} · casa ${wholeSignHouse(p.longitude, chart)}`, color: t.text, bold: true },
  ];
}

function vedicSummary(doc: jsPDF, t: Theme, chart: ChartData, x: number, y: number, w: number): void {
  const lagna = signOf(chart.ascendant);
  const ruler = VEDIC_RULERS[lagna.name];
  const rp = chart.planets.find(p => p.name === ruler);
  const moon = chart.planets.find(p => p.name === 'Moon');
  const nk = chart.moonPhase.lunarMansion;
  const data = NAKSHATRA_DATA[nk.number - 1];
  const asc = getZodiacSign(chart.ascendant);
  const rows: [string, string][] = [
    ['Lagna', `${lagna.glyph} ${signName(lagna.name)} (${SIGN_INFO[lagna.name].skt}) ${asc.degree}°${pad(asc.minute)}'`],
    ['Regente do Lagna', rp ? `${pName(ruler)} em ${signLabel(rp.longitude)} · casa ${wholeSignHouse(rp.longitude, chart)}` : '—'],
    ['Lua', moon ? `${signLabel(moon.longitude)} · casa ${wholeSignHouse(moon.longitude, chart)}` : '—'],
    ['Janma nakshatra', moon ? `${nk.number} · ${nk.name} · pada ${nakshatraPada(moon.longitude)}` : nk.name],
    ['Regente do nakshatra', `${data.lord} (início da Vimshottari)`],
    ['Zodíaco', chart.zodiacSystem === 'sidereal' ? 'Sideral (Lahiri)' : 'Tropical'],
  ];
  let cy = y + 4;
  for (const [k, v] of rows) {
    rich(doc, k.toUpperCase(), x, cy, { size: 6.5, color: t.faint, bold: true, spacing: 0.3 });
    rich(doc, fit(doc, v, w, 10), x, cy + 5, { size: 10, color: t.text, bold: true });
    cy += 12.4;
  }
  doc.setDrawColor(t.line);
  doc.setLineWidth(0.2);
  doc.line(x - 4, y, x - 4, cy - 4);
}

/** Faixa do nakshatra em texto: "entre 3°20' e 16°40' de Escorpião" ou atravessando signos. */
function spanText(idx: number): string {
  const { from, to } = nakshatraSpan(idx);
  const sn = (i: number) => signName(ZODIAC_SIGNS[i].name);
  return from[0] === to[0]
    ? `entre ${degMin(from[1])} e ${degMin(to[1])} de ${sn(from[0])}`
    : `entre ${degMin(from[1])} de ${sn(from[0])} e ${degMin(to[1])} de ${sn(to[0])}`;
}

/** Frase de posição (ao lado do símbolo). */
function nakshatraLead(t: Theme, chart: ChartData, idx: number): Seg[] {
  const moon = chart.planets.find(p => p.name === 'Moon');
  const where = moon ? `no pada ${nakshatraPada(moon.longitude)} de ` : 'em ';
  return [
    N(`A Lua está ${where}`, t.text), B(NAKSHATRAS[idx], t.text),
    N(`, ${spanText(idx)}, nakshatra regido por ${NAKSHATRA_DATA[idx].lord}.`, t.text),
  ];
}

/** Texto corrido (largura total). */
function nakshatraBody(t: Theme, chart: ChartData, idx: number): Seg[][] {
  const info = NAKSHATRA_INFO[idx];
  const data = NAKSHATRA_DATA[idx];
  const moon = chart.planets.find(p => p.name === 'Moon');
  const paras: Seg[][] = [[N(info.text, t.text)]];
  const tail: Seg[] = [];
  if (moon) {
    const pada = nakshatraPada(moon.longitude);
    const nav = ZODIAC_SIGNS[padaNavamsha(idx, pada)].name;
    tail.push(N(`O pada ${pada} corresponde ao navamsha de `, t.text), B(`${signName(nav)} (${SIGN_INFO[nav].skt})`, t.text),
      N(`, o que dá a esta parte do nakshatra uma energia ${SIGN_INFO[nav].energy}. `, t.text));
  }
  const years = DASHA_YEARS[data.lord];
  tail.push(N(`Por ser regido por ${data.lord}, o nakshatra da Lua abre a Vimshottari com o período (dasha) de ${data.lord}${years ? `, de ${years} anos` : ''}.`, t.text));
  paras.push(tail);
  paras.push([N(`${NATURE_TEXT[info.nature]} Gana ${GANA_TEXT[data.gana] ?? data.gana}; yoni ${info.yoni}.`, t.muted)]);
  return paras;
}

async function nakshatraStory(doc: jsPDF, t: Theme, input: ReportInput, y: number): Promise<number> {
  const { chart } = input;
  const nk = chart.moonPhase.lunarMansion;
  const idx = nk.number - 1;
  const data = NAKSHATRA_DATA[idx];
  const x = M;
  const w = W - 2 * M;
  const sym = 36;
  const tx = x + sym + 8;
  const tw = x + w - tx;

  // Alturas: cabeçalho (símbolo | título + frase de posição) e corpo em largura total
  const leadEnd = flow(doc, nakshatraLead(t, chart, idx), 0, 22, tw, V_SIZE, V_LH, false) - V_LH;
  const headH = Math.max(6 + sym + 12, leadEnd + 4);
  const body = nakshatraBody(t, chart, idx);
  let bodyEnd = headH - PARA_GAP + V_LH;
  for (const p of body) bodyEnd = flow(doc, p, 0, bodyEnd + PARA_GAP, w, V_SIZE, V_LH, false) - V_LH;
  const h = bodyEnd + 5;
  if (y + h > CONTENT_BOTTOM) y = newPage(doc, t, input);

  await drawSvg(doc, React.createElement(NakshatraSymbol, {
    index: idx, color: t.highlight, bg: blend(t.accent, t.raised, 0.18), ring: blend(t.highlight, t.raised, 0.55),
  }), t, x, y + 6, sym, sym);
  const cx = x + sym / 2;
  rich(doc, fit(doc, NAKSHATRAS[idx], sym + 8, 9.5, true), cx, y + 6 + sym + 5, { size: 9.5, color: t.text, bold: true, align: 'center' });
  rich(doc, fit(doc, data.symbol.toLowerCase(), sym + 8, 7.5), cx, y + 6 + sym + 9.2, { size: 7.5, color: t.faint, align: 'center' });

  rich(doc, 'NAKSHATRA DA LUA · JANMA NAKSHATRA', tx, y + 7, { size: 6.8, color: t.highlight, bold: true, spacing: 0.4 });
  let hx = tx;
  hx += rich(doc, `${nk.number}`, hx, y + 15, { size: 16, color: t.faint, bold: true }) + 3;
  hx += rich(doc, NAKSHATRAS[idx], hx, y + 15, { size: 16, color: t.text, bold: true }) + BOLD_SLACK + 3;
  // Nome do símbolo escrito ao lado do nome do nakshatra
  rich(doc, `· ${data.symbol.toLowerCase()}`, hx, y + 15, { size: 13, color: t.highlight });
  flow(doc, nakshatraLead(t, chart, idx), tx, y + 22, tw, V_SIZE, V_LH);

  doc.setDrawColor(t.line);
  doc.setLineWidth(0.15);
  doc.line(x, y + headH, x + w, y + headH);
  let py = y + headH - PARA_GAP + V_LH;
  for (const p of body) py = flow(doc, p, x, py + PARA_GAP, w, V_SIZE, V_LH) - V_LH;
  return y + h + STORY_GAP;
}

function houseStory(t: Theme, chart: ChartData, house: number): Story {
  const sign = ZODIAC_SIGNS[houseSignIndex(chart, house)];
  const b = BHAVA_TEXT[house - 1];
  const grahas = grahasInHouse(chart, house);
  const paras: Seg[][] = [[
    N(`Esta é ${b.principle} ${b.classic} Está com a energia ${signQualities(sign.name)}.`, t.text),
  ]];
  grahas.forEach((g, i) => {
    const d = grahaDignity(g.name, g.longitude);
    paras.push([
      N(i === 0 ? 'Nela está ' : 'Também nela está ', t.text), ...grahaSubject(t, chart, g.name),
      N(`, que representa ${GRAHA_INFO[g.name].what}, e que ${dignityText(d.kind, signName(d.sign), nameOf(d.lord))}.`, t.text),
    ]);
  });
  return {
    title: [
      { text: `Casa ${house} · ${b.name}`, color: t.text, bold: true },
      { text: ` ("${b.meaning}")   ${sign.glyph} ${signName(sign.name)}`, color: t.muted },
    ],
    right: grahas.map(g => ({ text: ` ${glyph(g.name)}`, color: PLANET_COLORS[g.name] ?? t.text })),
    paras,
    edge: sign.color,
  };
}

async function vedicReading(doc: jsPDF, t: Theme, input: ReportInput): Promise<void> {
  const { chart } = input;
  doc.addPage();
  paintPage(doc, t);
  let y = header(doc, t, input, false, 'LEITURA VÉDICA') + 7;
  const fullW = W - 2 * M;

  // Rashi + resumo
  const chartW = 92;
  sectionTitle(doc, t, 'Mapa védico · Rashi', M, y, chartW);
  sectionTitle(doc, t, 'Em resumo', M + chartW + 10, y, fullW - chartW - 10);
  y += 4;
  await drawSvg(doc, React.createElement(VedicChart, { data: chart }), t, M + 2, y + 2, chartW - 4, chartW - 4);
  vedicSummary(doc, t, chart, M + chartW + 14, y + 2, fullW - chartW - 14);
  y += chartW + 6;

  // Lagna
  const lagna = signOf(chart.ascendant);
  const li = SIGN_INFO[lagna.name];
  const asc = getZodiacSign(chart.ascendant);
  y = placeStory(doc, t, input, {
    kicker: 'ASCENDENTE · LAGNA',
    title: [
      { text: `Lagna em ${lagna.glyph} ${signName(lagna.name)}`, color: t.text, bold: true },
      { text: ` (${li.skt}) ${asc.degree}°${pad(asc.minute)}'`, color: t.muted },
    ],
    paras: [
      [N(LAGNA_TEXT[lagna.name], t.text)],
      [N('O Lagna é o signo que se elevava no horizonte leste no momento considerado; por signo inteiro, ele é a casa 1 e ordena todas as demais.', t.faint)],
    ],
    edge: lagna.color,
  }, y);

  // Regente do Lagna
  const ruler = VEDIC_RULERS[lagna.name];
  if (chart.planets.some(p => p.name === ruler)) {
    y = placeStory(doc, t, input, {
      kicker: 'REGENTE DO ASCENDENTE · LAGNESHA',
      title: placementTitle(t, chart, ruler),
      paras: (() => {
        const rp = chart.planets.find(p => p.name === ruler)!;
        const rh = wholeSignHouse(rp.longitude, chart);
        return [
          [
            N(`Regente de ${signName(lagna.name)}, `, t.text), ...grahaSubject(t, chart, ruler),
            N(' leva os temas da primeira casa para a ', t.text), B(`casa ${rh} (${BHAVA_TEXT[rh - 1].name})`, t.text),
            N(`: ${BHAVA_TEXT[rh - 1].lagnesha}`, t.text),
          ],
          [
            N(`Ali, representa ${GRAHA_INFO[ruler].what}, com a energia de `, t.text),
            B(`${signName(signOf(rp.longitude).name)} (${SIGN_INFO[signOf(rp.longitude).name].skt})`, t.text),
            N(`: ${signQualities(signOf(rp.longitude).name)}. `, t.text),
            ...conditionSegs(t, chart, ruler, true),
          ],
        ];
      })(),
      edge: PLANET_COLORS[ruler],
    }, y);
  }

  // Lua
  if (chart.planets.some(p => p.name === 'Moon')) {
    y = placeStory(doc, t, input, {
      kicker: 'LUA · CHANDRA',
      title: placementTitle(t, chart, 'Moon'),
      paras: placementParas(t, chart, 'Moon'),
      edge: PLANET_COLORS.Moon,
    }, y);
  }

  // Nakshatra
  y = await nakshatraStory(doc, t, input, y);

  // Casas
  for (const [gi, group] of HOUSE_GROUPS.entries()) {
    const stories = group.houses.map(h => houseStory(t, chart, h));
    const firstH = storyHeight(doc, stories[0], fullW);
    const headH = (gi === 0 ? 16 : 0) + 9;
    if (y + headH + firstH > CONTENT_BOTTOM) y = newPage(doc, t, input);
    if (gi === 0) {
      sectionTitle(doc, t, 'As casas · bhavas', M, y + 3, fullW);
      y = paragraph(doc, 'Por signo inteiro, a partir do Lagna, na ordem da tradição: kendras, trikonas, dusthanas, upachayas e a casa 2.',
        M, y + 9, fullW, 8, t.muted, 3.6) + 3;
    }
    let cx = M;
    cx += rich(doc, group.title.toUpperCase(), cx, y + 3, { size: 7.5, color: t.highlight, bold: true, spacing: 0.4 }) + 3;
    rich(doc, `casas ${group.houses.join(', ')} · ${group.note}`, cx, y + 3, { size: 7.5, color: t.faint });
    y += 6;
    for (const st of stories) y = placeStory(doc, t, input, st, y);
    y += 2;
  }
}

/* ── Leitura ocidental: mandala, posições e aspectos ── */

async function westernReading(doc: jsPDF, t: Theme, input: ReportInput): Promise<void> {
  const { chart } = input;
  doc.addPage();
  paintPage(doc, t);
  let y = header(doc, t, input, false, 'LEITURA OCIDENTAL') + 7;

  const chartW = 110;
  sectionTitle(doc, t, 'Mandala', M, y, W - 2 * M);
  y += 3;
  await drawSvg(doc, React.createElement(MandalaChart, { data: chart }), t, (W - chartW) / 2, y, chartW, chartW);
  y += chartW + 6;

  sectionTitle(doc, t, 'Posições', M, y, W - 2 * M);
  y = positionsTable(doc, t, chart, y + 6.5) + 6;
  anglesRow(doc, t, chart, y);

  y = newPage(doc, t, input);
  const gridW = 100;
  const gx = (W - gridW) / 2;
  sectionTitle(doc, t, 'Aspectos', M, y, W - 2 * M);
  y += 5;
  await drawSvg(doc, React.createElement(AspectGrid, { planets: chart.planets }), t, gx, y, gridW, gridW);
  y += gridW + 3;
  y = aspectLegend(doc, t, gx, y, gridW) + 9;

  sectionTitle(doc, t, 'Aspectos por orbe', M, y, W - 2 * M);
  aspectList(doc, t, chart, y + 6);
}

/* ── Eletivo: o dia inteiro ── */

const dayCache = new WeakMap<ReportInput, ElectionalDay>();

/** Períodos do dia eletivo (calculados uma vez por relatório). */
function dayOf(input: ReportInput): ElectionalDay {
  let d = dayCache.get(input);
  if (!d) {
    d = electionalDay(input.date, input.location, input.chart.zodiacSystem, input.planetaryDay, nameOf);
    dayCache.set(input, d);
  }
  return d;
}

const span = (p: { start: Date; end: Date }) => `${hhmm(p.start)}–${hhmm(p.end)}`;
const wholeDay = (d: ElectionalDay, list: Period<unknown>[]) => list.length === 1 && list[0].start.getTime() === d.start.getTime() && list[0].end.getTime() === d.end.getTime();

function dayNote(d: ElectionalDay, input: ReportInput, what: string): string {
  return `${what} correspondem às ${hhmm(input.date)}; os períodos abaixo cobrem o dia, do nascer do sol (${hhmm(d.start)}) ao seguinte (${hhmm(d.end)}).`;
}

/* ── Eletivo védico: muhurta ── */

async function vedicElectional(doc: jsPDF, t: Theme, input: ReportInput): Promise<void> {
  const d = dayOf(input);
  doc.addPage();
  paintPage(doc, t);
  let y = header(doc, t, input, false, 'MUHURTA · ELEIÇÃO VÉDICA') + 7;
  y = paragraph(doc,
    'O muhurta escolhe o momento de um começo pelos cinco membros do panchanga e pelo mapa do próprio instante. ' +
    'Resumo dos critérios mais usados; não substitui o exame do mapa natal de quem age (tara bala, chandra bala). ' +
    dayNote(d, input, 'Os gráficos da capa'),
    M, y, W - 2 * M, 8, t.muted, 3.6) + 4;

  // Vara
  const vara = varaOf(input.planetaryDay, input.date);
  const vi = VARA_INFO[vara.ruler];
  y = placeStory(doc, t, input, {
    kicker: 'VARA · DIA DA SEMANA',
    title: [B(`${glyph(vara.ruler)} ${vi.name}`, t.text), N(` · dia de ${nameOf(vara.ruler)}`, t.muted)],
    paras: [
      [N(`O dia védico corre de um nascer do sol ao seguinte e pertence ao graha que o nomeia. A tradição do muhurta reserva o dia de ${nameOf(vara.ruler)} a ${vi.use}.`, t.text)],
      ...(vara.rahuKala ? [[
        N('Rahu kala, a oitava parte do dia evitada para inícios: ', t.text),
        B(span(vara.rahuKala), t.text),
      ]] : []),
    ],
  }, y);

  // Tithis do dia
  y = placeStory(doc, t, input, {
    kicker: 'TITHI · DIA LUNAR',
    title: [B(d.tithis.map(p => p.value.name).join(' → '), t.text)],
    paras: [
      [N('O tithi mede cada 12° de afastamento entre a Lua e o Sol; são trinta no mês lunar. Shukla paksha, a quinzena clara, é a preferida para inícios; Krishna paksha, a quinzena escura, é tradicionalmente reservada a conclusões.', t.text)],
      ...d.tithis.map(p => {
        const ti = p.value;
        const tg = TITHI_GROUP_TEXT[ti.group];
        return [
          B(`${span(p)} · ${ti.name},`, t.text),
          N(` ${ti.n}ª de ${ti.shukla ? 'Shukla' : 'Krishna'} paksha. Grupo `, t.text), B(tg.name, t.text),
          N(` ("${tg.meaning}"): ${tg.use}.`, t.text),
          ...(ti.name === 'Amavasya' ? [N(' Amavasya, a lua nova, é evitada para toda obra auspiciosa.', t.text)] : []),
        ];
      }),
    ],
  }, y);

  // Nakshatras do dia, cada um com o símbolo ao lado do nome
  for (const [i, p] of d.nakshatras.entries()) {
    y = await nakshatraElection(doc, t, input, p.value, i === 0, wholeDay(d, d.nakshatras) ? 'o dia todo' : span(p), y);
  }

  // Asta: grahas combustos ao longo do dia
  const combustLabel = (names: string[]) => {
    if (!names.length) return 'nenhum graha combusto';
    if (names.length === 1) return `${nameOf(names[0])} ${names[0] === 'Moon' ? 'combusta' : 'combusto'}`;
    return `${listPt(names.map(nameOf))} combustos`;
  };
  y = placeStory(doc, t, input, {
    kicker: 'ASTA · COMBUSTÃO',
    title: [B('Grahas combustos', t.text)],
    paras: [
      [N('Um graha muito próximo do Sol fica asta ("posto", encoberto pelos raios) e perde a força para dar resultados. Limites a partir do Sol, segundo o Surya Siddhanta: Lua 12°, Marte 17°, Mercúrio 14° (12° quando retrógrado), Júpiter 11°, Vênus 10° (8° quando retrógrado), Saturno 15°.', t.text)],
      ...d.combust.map(p => [
        B(`${wholeDay(d, d.combust) ? 'O dia todo' : span(p)}: `, t.text),
        N(`${combustLabel(p.value)}.`, t.text),
      ]),
      [N('Com Júpiter ou Vênus asta, os textos de muhurta vetam casamento, upanayana, entrada em casa nova e os demais samskaras.' +
        (d.combust.some(p => p.value.includes('Moon')) ? ' A Lua fica asta durante Amavasya e Shukla Pratipada, os dois tithis a menos de 12° do Sol.' : ''), t.text)],
    ],
  }, y);

  // Lagna ao longo do dia
  const rules = d.lagnas[0].value.checks.map(c => c.rule);
  y = placeStory(doc, t, input, {
    kicker: 'LAGNA DO MUHURTA',
    title: [B('Lagna ao longo do dia', t.text)],
    paras: [
      [N('O instante é julgado como um mapa, com casas por signo inteiro a partir do lagna; o lagna muda de signo cerca de doze vezes ao dia, e com ele as casas de todos os grahas. Regras mais citadas:', t.text)],
      ...rules.map((r, i) => [B(`${i + 1}. `, t.text), N(`${r}.`, t.text)]),
    ],
  }, y, 3);
  for (const p of d.lagnas) {
    const sg = ZODIAC_SIGNS[p.value.lagnaSign];
    const para: Seg[] = [];
    p.value.checks.forEach((c, i) => {
      para.push(B(`${i + 1} `, t.text), B(c.holds ? 'atendida' : 'não atendida', c.holds ? '#27ae60' : '#c0392b'));
      para.push(N(` (${c.detail})${i < p.value.checks.length - 1 ? '; ' : '.'}`, t.muted));
    });
    y = placeStory(doc, t, input, {
      title: [B(span(p), t.text), N(' · Lagna em ', t.muted), B(`${sg.glyph} ${signName(sg.name)}`, t.text), N(` (${SIGN_INFO[sg.name].skt})`, t.muted)],
      paras: [para],
    }, y, 3);
  }
}

async function nakshatraElection(doc: jsPDF, t: Theme, input: ReportInput, ni: number, withKicker: boolean, when: string, y: number): Promise<number> {
  const info = NAKSHATRA_INFO[ni];
  const nd = NAKSHATRA_DATA[ni];
  const mn = MUHURTA_NATURE[info.nature];
  const face = FACE_TEXT[NAKSHATRA_FACE[ni]];
  const peers = NAKSHATRAS.filter((_, i) => i !== ni && NAKSHATRA_INFO[i].nature === info.nature);
  const sym = 6.4;
  const st: Story = {
    kicker: withKicker ? 'NAKSHATRA DA LUA' : undefined,
    title: [B(NAKSHATRAS[ni], t.text), N(` (${info.meaning})`, t.muted), N(`· devata ${nd.devata} · regente ${nd.lord}`, t.muted)],
    titleGap: { after: 1, width: sym + 3 },
    right: [N(when, t.faint)],
    paras: [
      [
        N('No muhurta, pertence ao grupo ', t.text), B(mn.name, t.text),
        N(`${peers.length ? `, com ${listPt(peers)}` : ''}, ao qual corresponde o dia de ${mn.weekday}. O Muhurta Chintamani reserva a esse grupo ${mn.use}.`, t.text),
      ],
      [N('Pela direção da face, é ', t.text), B(face.name, t.text), N(`, próprio para ${face.use}.`, t.text)],
    ],
  };
  const slot = storySlot(doc, t, input, st, y);
  drawStory(doc, t, st, slot.top);
  const titleY = slot.top + STORY_TOP + (st.kicker ? STORY_TITLE : 0);
  const symX = M + segsWidth(doc, st.title.slice(0, 2), STORY_TITLE_SIZE) + 1.5;
  await drawSvg(doc, React.createElement(NakshatraSymbol, {
    index: ni, color: t.highlight, bg: t.bg, ring: blend(t.highlight, t.bg, 0.55),
  }), t, symX, titleY - sym / 2 - 1.3, sym, sym);
  return slot.next;
}

/* ── Eletivo ocidental: Lua, manazil e horas planetárias ── */

const FEMININE_ASPECTS = ['conjunção', 'quadratura', 'oposição'];

async function westernElectional(doc: jsPDF, t: Theme, input: ReportInput): Promise<void> {
  const d = dayOf(input);
  doc.addPage();
  paintPage(doc, t);
  let y = header(doc, t, input, false, 'ELEIÇÃO OCIDENTAL') + 5;
  y = statusCards(doc, t, input, y) + 5;
  y = paragraph(doc, dayNote(d, input, 'Os cartões acima'), M, y, W - 2 * M, 8, t.muted, 3.6) + 4;

  // Lua: signos, condição e aspectos ao longo do dia
  const signTitle: Seg[] = [B(`${glyph('Moon')} Lua em `, t.text)];
  d.moonSigns.forEach((p, i) => {
    const sg = ZODIAC_SIGNS[p.value];
    const dig = moonDignity(p.value);
    if (i) signTitle.push(N(` → ${hhmm(p.start)} `, t.muted));
    signTitle.push(B(`${sg.glyph} ${signName(sg.name)}`, t.text));
    if (dig) signTitle.push(N(` (${dig})`, t.muted));
  });

  const paras: Seg[][] = [
    [N('Na eleição ocidental a Lua é a significadora geral de todo começo. A tradição prefere a Lua crescente para o que deve crescer e tornar-se visível, e reserva a minguante para o que deve diminuir, concluir-se ou permanecer oculto.', t.text)],
  ];
  for (const p of d.moonStates) {
    const s = p.value;
    const notes = [s.waxing ? 'crescente' : 'minguante', s.sunState, s.viaCombusta ? 'na via combusta' : null].filter(Boolean);
    paras.push([B(`${wholeDay(d, d.moonStates) ? 'O dia todo' : span(p)}: `, t.text), N(`${notes.join(', ')}.`, t.text)]);
  }
  const anyBeams = d.moonStates.some(p => p.value.sunState);
  const anyVia = d.moonStates.some(p => p.value.viaCombusta);
  if (anyBeams || anyVia) {
    paras.push([N([
      anyBeams ? 'Combusta, a menos de 8°30\' do Sol, é condição que os autores mandam evitar; sob os raios, a menos de 17°, condição enfraquecida.' : '',
      anyVia ? 'A via combusta, de 15° de Libra a 15° de Escorpião, é trecho tradicionalmente evitado.' : '',
    ].filter(Boolean).join(' '), t.text)]);
  }

  paras.push([N('Aspectos que a Lua aplica antes de deixar o signo, com os planetas tradicionais:', t.text)]);
  for (const p of d.moonAspects) {
    const a = p.value;
    const lead = B(`${span(p)}: `, t.text);
    if (!a) { paras.push([lead, B('fora de curso.', t.text)]); continue; }
    const fem = FEMININE_ASPECTS.includes(a.aspect);
    const ends = p.end.getTime() < d.end.getTime();
    const kind = BENEFIC_WESTERN.includes(a.planet) ? ' (benéfico)' : MALEFIC_WESTERN.includes(a.planet) ? ' (maléfico)' : '';
    paras.push([
      lead, N(`aplica ${fem ? 'à' : 'ao'} `, t.text), B(`${a.aspect} ${ofName(a.planet)}`, t.text),
      N(`${kind}${ends ? `, ${fem ? 'exata' : 'exato'} às ${hhmm(p.end)}` : ', que se completa depois do fim do dia'}.`, t.text),
    ]);
  }
  const hasVoid = d.moonAspects.some(p => !p.value);
  paras.push([N('Aplicar a um benéfico é o testemunho preferido; a um maléfico, testemunho de obstáculo, menos grave por sextil ou trígono.' +
    (hasVoid ? ' Da Lua fora de curso, a tradição diz que o que então se inicia não chega a termo.' : ''), t.text)]);

  y = placeStory(doc, t, input, { kicker: 'A LUA · SIGNIFICADORA GERAL', title: signTitle, paras }, y);

  // Retrogradação e regente do ascendente
  const retroParas: Seg[][] = [
    [N('Na eleição, os autores mandam evitar significadores retrógrados, em primeiro lugar o regente do ascendente e o regente da casa do assunto (Bonatti, Lilly). O Sol e a Lua nunca retrogradam; entre os planetas tradicionais, podem retrogradar Mercúrio, Vênus, Marte, Júpiter e Saturno.', t.text)],
  ];
  d.retrogrades.forEach((p, i) => {
    const names = p.value;
    const label = names.length ? `${listPt(names.map(nameOf))} ${names.length > 1 ? 'retrógrados' : 'retrógrado'}` : 'nenhum planeta tradicional retrógrado';
    const para: Seg[] = [B(`${wholeDay(d, d.retrogrades) ? 'O dia todo' : span(p)}: `, t.text), N(`${label}.`, t.text)];
    const nxt = d.retrogrades[i + 1];
    if (nxt) {
      const turnedRetro = nxt.value.filter(n => !names.includes(n));
      const turnedDirect = names.filter(n => !nxt.value.includes(n));
      const notes = [
        ...turnedRetro.map(n => `${nameOf(n)} estaciona e passa a retrógrado`),
        ...turnedDirect.map(n => `${nameOf(n)} estaciona e retoma o movimento direto`),
      ];
      if (notes.length) para.push(N(` Às ${hhmm(p.end)}, ${notes.join('; ')}.`, t.text));
    }
    retroParas.push(para);
  });
  retroParas.push([N('Regente do ascendente ao longo do dia:', t.text)]);
  for (const p of d.ascRulers) {
    const sg = ZODIAC_SIGNS[p.value.sign];
    retroParas.push([
      B(`${span(p)}: `, t.text), N(`ascendente em ${sg.glyph} ${signName(sg.name)}, regido por `, t.text),
      B(`${glyph(p.value.ruler)} ${nameOf(p.value.ruler)}${p.value.retro ? ',' : '.'}`, t.text),
      ...(p.value.retro ? [B(' retrógrado.', '#c0392b')] : []),
    ]);
  }
  y = placeStory(doc, t, input, { kicker: 'RETROGRADAÇÃO', title: [B('Planetas retrógrados e regente do ascendente', t.text)], paras: retroParas }, y);

  // Manazil do dia
  for (const [i, p] of d.manazil.entries()) {
    const z = MANAZIL[p.value];
    y = placeStory(doc, t, input, {
      kicker: i === 0 ? 'MANZIL · MANSÃO LUNAR' : undefined,
      title: [N(`${p.value + 1}ª `, t.faint), B(z.name, t.text), N(` · ${z.meaning}`, t.muted)],
      right: [N(wholeDay(d, d.manazil) ? 'o dia todo' : span(p), t.faint)],
      paras: [
        ...(i === 0 ? [[N('As vinte e oito mansões dividem o percurso mensal da Lua a partir de 0° de Áries; o Picatrix e Agrippa (De Occulta Philosophia II, 33) atribuem a cada uma as operações que favorece ou impede.', t.text)]] : []),
        [B('Uso eletivo: ', t.text), N(z.election, t.text)],
      ],
    }, y);
  }

  // Horas planetárias, por planeta
  const day = input.planetaryDay;
  if (!day) return;
  const CHALDEAN = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
  y = placeStory(doc, t, input, {
    kicker: 'HORAS PLANETÁRIAS',
    title: [B(`Dia ${ofName(day.ruler)}`, t.text)],
    paras: [
      [N('O dia e a noite dividem-se cada um em doze horas desiguais, regidas na ordem caldaica a partir do regente do dia.', t.text)],
      ...CHALDEAN.map(pl => [
        B(`${glyph(pl)} ${nameOf(pl)}: `, t.text),
        N(`${day.hours.filter(h => h.ruler === pl).map(h => span(h)).join(', ')}. `, t.muted),
        N(`${cap(HOUR_USE[pl])}.`, t.text),
      ]),
    ],
  }, y);

  const chartW = 92;
  const need = 8 + chartW + 6 + 64;
  if (y + need > CONTENT_BOTTOM) y = newPage(doc, t, input);
  sectionTitle(doc, t, `Horas planetárias · dia de ${WEEKDAY_NAMES_PT[day.weekday]} ${glyph(day.ruler)}`, M, y, W - 2 * M);
  y += 5;
  await drawSvg(doc, React.createElement(PlanetaryHoursChart, { day, date: input.date }), t, (W - chartW) / 2, y, chartW, chartW);
  hoursTable(doc, t, day, y + chartW + 6);
}

function sectionsOf(input: ReportInput): readonly ReportSection[] {
  return input.sections?.length ? input.sections : ALL_SECTIONS;
}

export async function buildReport(input: ReportInput): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  await registerFonts(doc);
  const t = makeTheme(input);
  const who = input.name ? `${input.name} · ` : '';
  doc.setProperties({ title: `Astrosattwa · ${who}${ddmmyyyy(input.date)} ${hhmm(input.date)}`, creator: 'Astrosattwa' });
  const parts: Part[] = [];
  const mark = (part: Part) => { while (parts.length < doc.getNumberOfPages()) parts.push(part); };

  /* Capa */
  await coverPage(doc, t, input);
  mark('cover');

  /* Cada tradição marcada × cada tipo marcado, na ordem de ALL_SECTIONS */
  const builders: Record<ReportSection, () => Promise<void> | void> = {
    'vedic-natal': () => vedicReading(doc, t, input),
    'vedic-electional': () => vedicElectional(doc, t, input),
    'western-natal': async () => { await westernReading(doc, t, input); briefReading(doc, t, input); },
    'western-electional': () => westernElectional(doc, t, input),
  };
  for (const s of sectionsOf(input)) {
    await builders[s]();
    mark(s);
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    footer(doc, t, input, p, pages, parts[p - 1]);
  }
  return doc;
}

export function reportFileName(date: Date, name?: string): string {
  const slug = (name ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `astrosattwa-${slug ? `${slug}-` : ''}${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.pdf`;
}

/** Gera o PDF e entrega: download no navegador, compartilhar/salvar no Android. */
export async function exportReport(input: ReportInput): Promise<void> {
  const doc = await buildReport(input);
  const fileName = reportFileName(input.date, input.name);

  if (!Capacitor.isNativePlatform()) {
    doc.save(fileName);
    return;
  }

  const [{ Filesystem, Directory }, { Share }] = await Promise.all([
    import('@capacitor/filesystem'),
    import('@capacitor/share'),
  ]);
  const data = doc.output('datauristring').split(',')[1];
  const { uri } = await Filesystem.writeFile({ path: fileName, data, directory: Directory.Cache });
  await Share.share({ title: 'Mapa Astrosattwa', files: [uri], dialogTitle: 'Salvar ou compartilhar PDF' });
}
