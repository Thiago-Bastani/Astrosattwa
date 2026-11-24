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
import { ASPECTS, findAspect } from '../../utils/aspects';
import { calculateLahiriAyanamsa } from '../astroCalculator';
import MandalaChart from '../../components/MandalaChart';
import VedicChart from '../../components/VedicChart';
import AspectGrid from '../../components/AspectGrid';
import PlanetaryHoursChart from '../../components/PlanetaryHoursChart';
import { registerFonts, setRunFont, splitRuns } from './pdfFonts';
import { chartToSvg } from './pdfSvg';

/**
 * Relatório em PDF (A4, 2 páginas) montado só a partir dos dados do mapa:
 * mesmo conteúdo e mesmo layout em qualquer aparelho, independente da tela.
 */

export interface ReportInput {
  chart: ChartData;
  date: Date;
  location: GeoLocation;
  planetaryDay: PlanetaryDay | null;
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

function lonLabel(lon: number): string {
  const { sign, degree, minute } = getZodiacSign(lon);
  return `${sign.glyph} ${degree}°${pad(minute)}'`;
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

function footer(doc: jsPDF, t: Theme, input: ReportInput, page: number, pages: number): void {
  const sys = input.chart.zodiacSystem === 'sidereal'
    ? `zodíaco sideral · ayanamsa Lahiri ${calculateLahiriAyanamsa(input.date).toFixed(2)}°`
    : 'zodíaco tropical';
  doc.setDrawColor(t.line);
  doc.setLineWidth(0.2);
  doc.line(M, H - 11, W - M, H - 11);
  rich(doc, `Astrosattwa · ${sys} · casas por signo inteiro`, M, H - 7, { size: 7, color: t.faint });
  rich(doc, `Paleta do dia: ${t.paletteName} · ${page}/${pages}`, W - M, H - 7, { size: 7, color: t.faint, align: 'right' });
}

/** Faixa do topo nas cores do dia; a linha fina embaixo tem a cor do planeta da hora. */
function header(doc: jsPDF, t: Theme, input: ReportInput, compact: boolean): number {
  const h = compact ? 14 : 30;
  doc.setFillColor(t.accent);
  doc.rect(0, 0, W, h, 'F');
  doc.setFillColor(t.hourColor);
  doc.rect(0, h, W, 1.2, 'F');

  const when = `${ddmmyyyy(input.date)} · ${hhmm(input.date)}`;
  if (compact) {
    rich(doc, 'Astrosattwa', M, 9, { size: 13, color: t.onAccent, bold: true });
    rich(doc, `${when} · ${input.location.name}`, W - M, 9, { size: 8.5, color: t.onAccent, align: 'right' });
    return h + 1.2;
  }

  rich(doc, 'Astrosattwa', M, 13, { size: 22, color: t.onAccent, bold: true });
  rich(doc, 'MAPA DO CÉU', M, 21, { size: 8, color: t.onAccent, spacing: 0.8 });
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
      label: 'Mansões lunares',
      draw: x => {
        const n = moonPhase.lunarMansion, z = moonPhase.arabicMansion;
        rich(doc, `${n.number}ª`, x, y + 13, { size: 7.5, color: t.faint });
        rich(doc, fit(doc, n.name, w - 14, 10.5, true), x + 5.5, y + 13, { size: 10.5, color: t.text, bold: true });
        rich(doc, `${z.number}ª`, x, y + 19.5, { size: 7.5, color: t.faint });
        rich(doc, fit(doc, `${z.name}${z.meaning ? ` · ${z.meaning}` : ''}`, w - 14, 8), x + 5.5, y + 19.5, { size: 8, color: t.muted });
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
  const ps = chart.planets;
  const found: { a: string; b: string; aspect: (typeof ASPECTS)[number]; orb: number }[] = [];
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      // Os nodos estão sempre em oposição exata: não é informação
      if (ps[i].name === 'NorthNode' && ps[j].name === 'SouthNode') continue;
      const asp = findAspect(ps[i].longitude, ps[j].longitude);
      if (!asp) continue;
      const diff = Math.abs(ps[i].longitude - ps[j].longitude);
      const ang = diff > 180 ? 360 - diff : diff;
      found.push({ a: ps[i].name, b: ps[j].name, aspect: asp, orb: Math.abs(ang - asp.angle) });
    }
  }
  found.sort((p, q) => p.orb - q.orb);

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
    const deg = Math.floor(f.orb);
    rich(doc, `${deg}°${pad(Math.round((f.orb - deg) * 60))}'`, x + colW - 4, base, { size: 7, color: t.faint, align: 'right' });
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

export async function buildReport(input: ReportInput): Promise<jsPDF> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  await registerFonts(doc);
  const t = makeTheme(input);
  const { chart } = input;
  doc.setProperties({ title: `Astrosattwa · ${ddmmyyyy(input.date)} ${hhmm(input.date)}`, creator: 'Astrosattwa' });

  /* Página 1 */
  paintPage(doc, t);
  let y = header(doc, t, input, false) + 5;
  y = statusCards(doc, t, input, y) + 8;

  const chartW = (W - 2 * M - 8) / 2;
  sectionTitle(doc, t, 'Mandala', M, y, chartW);
  sectionTitle(doc, t, 'Mapa védico · Rashi', M + chartW + 8, y, chartW);
  y += 4;
  await drawSvg(doc, React.createElement(MandalaChart, { data: chart }), t, M, y, chartW, chartW);
  // O mapa védico tem uma margem interna menor: reduz um pouco para alinhar com a mandala
  const vInset = 4;
  await drawSvg(doc, React.createElement(VedicChart, { data: chart }), t, M + chartW + 8 + vInset, y + vInset, chartW - 2 * vInset, chartW - 2 * vInset);
  y += chartW + 6;

  sectionTitle(doc, t, 'Posições', M, y, W - 2 * M);
  y = positionsTable(doc, t, chart, y + 6.5) + 6;
  anglesRow(doc, t, chart, y);
  footer(doc, t, input, 1, 2);

  /* Página 2 */
  doc.addPage();
  paintPage(doc, t);
  y = header(doc, t, input, true) + 8;

  const leftW = 96;
  const rightX = M + leftW + 8;
  const rightW = W - M - rightX;
  sectionTitle(doc, t, 'Aspectos', M, y, leftW);
  sectionTitle(doc, t, 'Horas planetárias', rightX, y, rightW);
  y += 5;
  await drawSvg(doc, React.createElement(AspectGrid, { planets: chart.planets }), t, M, y, leftW, leftW);
  if (input.planetaryDay) {
    await drawSvg(doc, React.createElement(PlanetaryHoursChart, { day: input.planetaryDay, date: input.date }), t, rightX, y, rightW, rightW);
  } else {
    rich(doc, 'Sem nascer/pôr do sol nesta data e local.', rightX, y + 20, { size: 8.5, color: t.muted });
  }
  y += leftW + 3;
  y = aspectLegend(doc, t, M, y, leftW) + 9;

  sectionTitle(doc, t, 'Aspectos por orbe', M, y, W - 2 * M);
  y = aspectList(doc, t, chart, y + 6) + 6;

  if (input.planetaryDay) {
    sectionTitle(doc, t, `Horas planetárias · dia de ${WEEKDAY_NAMES_PT[input.planetaryDay.weekday]} ${glyph(input.planetaryDay.ruler)}`, M, y, W - 2 * M);
    hoursTable(doc, t, input.planetaryDay, y + 6);
  }

  footer(doc, t, input, 2, 2);
  return doc;
}

export function reportFileName(date: Date): string {
  return `astrosattwa-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.pdf`;
}

/** Gera o PDF e entrega: download no navegador, compartilhar/salvar no Android. */
export async function exportReport(input: ReportInput): Promise<void> {
  const doc = await buildReport(input);
  const fileName = reportFileName(input.date);

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
