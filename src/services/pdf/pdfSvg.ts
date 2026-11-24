import type React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FONT_FAMILY, splitRuns } from './pdfFonts';

/**
 * Converte um gráfico do app (componente React que desenha SVG) num SVG pronto
 * para o svg2pdf: troca as variáveis CSS do tema pelas cores do dia, passa rgba()
 * para cor + opacidade e separa os textos em trechos com a fonte certa.
 * Nada depende do tamanho da tela: o SVG é desenhado pelo seu viewBox.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

function parseColor(value: string): { color: string; alpha: number } | null {
  const m = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/);
  if (!m) return null;
  return { color: `rgb(${m[1]}, ${m[2]}, ${m[3]})`, alpha: m[4] !== undefined ? parseFloat(m[4]) : 1 };
}

function normalizePaint(el: Element): void {
  // style="stroke: …" → atributos (o svg2pdf lê melhor atributos simples)
  const style = el.getAttribute('style');
  if (style) {
    for (const decl of style.split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim();
      const val = decl.slice(i + 1).trim();
      if (['fill', 'stroke', 'fill-opacity', 'stroke-opacity', 'opacity'].includes(prop)) el.setAttribute(prop, val);
    }
    el.removeAttribute('style');
  }

  for (const prop of ['fill', 'stroke'] as const) {
    const v = el.getAttribute(prop);
    if (!v) continue;
    if (v === 'transparent') {
      el.setAttribute(prop, 'none');
      continue;
    }
    const parsed = parseColor(v);
    if (parsed && parsed.alpha < 1) {
      const key = `${prop}-opacity`;
      const prev = parseFloat(el.getAttribute(key) ?? '1');
      el.setAttribute(prop, parsed.color);
      el.setAttribute(key, String(prev * parsed.alpha));
    } else if (parsed) {
      el.setAttribute(prop, parsed.color);
    }
  }
}

function splitTextFonts(svg: SVGSVGElement): void {
  const doc = svg.ownerDocument;
  const nodes: Text[] = [];
  const walker = doc.createTreeWalker(svg, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    const runs = splitRuns(node.data);
    const frag = doc.createDocumentFragment();
    for (const run of runs) {
      const tspan = doc.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('font-family', FONT_FAMILY[run.font]);
      tspan.textContent = run.text;
      frag.appendChild(tspan);
    }
    node.replaceWith(frag);
  }
  svg.querySelectorAll('text').forEach(t => t.setAttribute('font-family', FONT_FAMILY.times));
}

export function chartToSvg(element: React.ReactElement, cssVars: Record<string, string>): SVGSVGElement | null {
  let markup = renderToStaticMarkup(element);
  // Variáveis mais longas primeiro (--as-accent-rgb antes de --as-accent)
  const keys = Object.keys(cssVars).sort((a, b) => b.length - a.length);
  for (const k of keys) markup = markup.split(`var(${k})`).join(cssVars[k]);

  const parsed = new DOMParser().parseFromString(`<body>${markup}</body>`, 'text/html');
  const found = parsed.querySelector('svg');
  if (!found) return null;
  const svg = document.importNode(found, true) as SVGSVGElement;

  svg.querySelectorAll('title').forEach(t => t.remove());

  // O svg2pdf ignora dominant-baseline: centraliza na vertical deslocando o y (~0,35 em)
  svg.querySelectorAll('text[dominant-baseline="central"]').forEach(t => {
    const size = parseFloat(t.getAttribute('font-size') ?? '16');
    const y = parseFloat(t.getAttribute('y') ?? '0');
    t.setAttribute('y', String(y + size * 0.35));
    t.removeAttribute('dominant-baseline');
  });
  [svg, ...Array.from(svg.querySelectorAll('*'))].forEach(normalizePaint);
  splitTextFonts(svg);
  return svg;
}
