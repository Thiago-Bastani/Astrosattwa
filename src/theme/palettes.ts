import type { ClassicalPlanet } from '../utils/planetary';

/**
 * Paleta de cada dia planetário: a cor principal pinta barras, botões e bordas;
 * a parceira é o texto sobre a cor principal (e, quando é colorida, os destaques).
 * O fundo é sempre um escuro tingido pela principal, para manter os gráficos legíveis.
 */
export interface DayPalette {
  weekday: number;
  planet: ClassicalPlanet;
  name: string;     // ex. "Laranja dourado + preto"
  accent: string;   // cor principal
  partner: string;  // cor parceira
}

export const DAY_PALETTES: DayPalette[] = [
  { weekday: 0, planet: 'Sun',     name: 'Laranja dourado + preto', accent: '#F0A030', partner: '#000000' },
  { weekday: 1, planet: 'Moon',    name: 'Roxo neon + branco',      accent: '#9D00FF', partner: '#FFFFFF' },
  { weekday: 2, planet: 'Mars',    name: 'Vermelho fogo + preto',   accent: '#E8341C', partner: '#000000' },
  { weekday: 3, planet: 'Mercury', name: 'Amarelo dourado + branco', accent: '#E9B800', partner: '#FFFFFF' },
  { weekday: 4, planet: 'Jupiter', name: 'Púrpura rosado + dourado', accent: '#A8327F', partner: '#D4AF37' },
  { weekday: 5, planet: 'Venus',   name: 'Azul anil + dourado',     accent: '#2F3FC8', partner: '#D4AF37' },
  { weekday: 6, planet: 'Saturn',  name: 'Verde esmeralda + preto', accent: '#14B377', partner: '#000000' },
];

/* ── Conversões de cor ── */

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: RGB): string {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
}

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function luminance([r, g, b]: RGB): number {
  const f = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l * 100];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h * 60, s * 100, l * 100];
}

const rgbStr = (c: RGB) => c.map(Math.round).join(', ');

const isNeutral = (hex: string) => /^#(000000|ffffff)$/i.test(hex);

/** Variáveis CSS derivadas de uma paleta. */
export function paletteToCssVars(p: DayPalette): Record<string, string> {
  const accent = hexToRgb(p.accent);
  const partner = hexToRgb(p.partner);
  const [h, s] = rgbToHsl(accent);

  // Destaque (títulos, valores): parceira se for colorida (dourado), senão a principal,
  // clareada quando escura demais para ler sobre o fundo escuro.
  let highlight = isNeutral(p.partner) ? accent : partner;
  if (luminance(highlight) < 0.12) highlight = mix(highlight, [255, 255, 255], 0.3);

  // Texto sobre a cor principal: a parceira; se o contraste for baixo, ganha sombra.
  const lighter = Math.max(luminance(accent), luminance(partner));
  const darker = Math.min(luminance(accent), luminance(partner));
  const contrast = (lighter + 0.05) / (darker + 0.05);

  const sat = Math.min(s, 55);
  return {
    '--as-accent': p.accent,
    '--as-accent-rgb': rgbStr(accent),
    '--as-on-accent': p.partner,
    '--as-on-accent-rgb': rgbStr(partner),
    '--as-on-accent-shadow': contrast < 3 ? '0 1px 2px rgba(0, 0, 0, 0.55)' : 'none',
    // Barras (topo e abas) na cor principal, texto na parceira
    '--as-bar-bg': p.accent,
    '--as-bar-fg': p.partner,
    '--as-bar-fg-rgb': rgbStr(partner),
    '--as-bar-shadow': contrast < 3 ? '0 1px 2px rgba(0, 0, 0, 0.55)' : 'none',
    '--as-bar-border': 'transparent',
    '--as-highlight': rgbToHex(highlight),
    '--as-highlight-rgb': rgbStr(highlight),
    '--as-bg': `hsl(${h.toFixed(0)}, ${sat.toFixed(0)}%, 7%)`,
    '--as-bg-raised': `hsl(${h.toFixed(0)}, ${Math.min(s, 45).toFixed(0)}%, 13%)`,
    '--as-text': p.partner.toUpperCase() === '#FFFFFF' ? '#ffffff' : '#eceff1',
    '--ion-color-primary': p.accent,
    '--ion-color-primary-rgb': rgbStr(accent),
    '--ion-color-primary-contrast': p.partner,
    '--ion-background-color': `hsl(${h.toFixed(0)}, ${sat.toFixed(0)}%, 7%)`,
  };
}

/** Tema neutro (sem paleta do dia): fundo preto, texto e destaques em branco. */
export const NEUTRAL_CSS_VARS: Record<string, string> = {
  '--as-accent': '#ffffff',
  '--as-accent-rgb': '255, 255, 255',
  '--as-on-accent': '#000000',
  '--as-on-accent-rgb': '0, 0, 0',
  '--as-on-accent-shadow': 'none',
  '--as-bar-bg': '#000000',
  '--as-bar-fg': '#ffffff',
  '--as-bar-fg-rgb': '255, 255, 255',
  '--as-bar-shadow': 'none',
  '--as-bar-border': 'rgba(255, 255, 255, 0.14)',
  '--as-highlight': '#ffffff',
  '--as-highlight-rgb': '255, 255, 255',
  '--as-bg': '#000000',
  '--as-bg-raised': '#161616',
  '--as-text': '#ffffff',
  '--ion-color-primary': '#ffffff',
  '--ion-color-primary-rgb': '255, 255, 255',
  '--ion-color-primary-contrast': '#000000',
  '--ion-background-color': '#000000',
};
