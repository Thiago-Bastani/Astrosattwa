/**
 * Vetoriza os selos canônicos a partir das fotos em scripts/seals-src/.
 *
 *   node scripts/generate-seals.mjs [--preview pasta]
 *
 * Agrippa (De Occulta Philosophia II.22): cada foto tem o selo do planeta e os da
 * inteligência e do espírito; as caixas abaixo recortam cada figura (sem as legendas).
 * Olímpicos (Arbatel, aforismo 17): uma imagem por selo.
 * Escreve src/utils/ritual/seals.ts (caminhos SVG, pintados com a cor do tema no app).
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import potrace from 'potrace';

const SRC = 'scripts/seals-src';
const OUT = 'src/utils/ritual/seals.ts';
const SCALE = 3; // amplia antes de traçar: curvas mais lisas

/** [x0, y0, x1, y1] em pixels da foto original. */
const AGRIPPA = {
  Saturn:  { file: 'saturno.png',  planet: [150, 40, 320, 200], intelligence: [40, 280, 200, 412], spirit: [300, 260, 440, 400] },
  Jupiter: { file: 'jupiter.png',  planet: [180, 50, 345, 212], intelligence: [30, 315, 235, 440], spirit: [280, 300, 490, 442] },
  Mars:    { file: 'marte.png',    planet: [150, 40, 330, 205], intelligence: [15, 305, 225, 428], spirit: [320, 262, 445, 440] },
  Sun:     { file: 'sol.png',      planet: [170, 38, 340, 198], intelligence: [60, 255, 222, 395], spirit: [295, 245, 445, 398] },
  Mercury: { file: 'mercurio.png', planet: [140, 35, 320, 208], intelligence: [20, 288, 192, 438], spirit: [280, 262, 435, 438] },
  Venus:   { file: 'venus.png',    planet: [160, 22, 322, 172], intelligence: [10, 248, 160, 372], spirit: [165, 243, 305, 388], intelligences: [325, 238, 452, 388] },
  Moon:    { file: 'lua.png',      planet: [170, 25, 330, 182], spirit: [30, 248, 165, 362], spirits: [175, 218, 315, 362], intelligences: [320, 228, 470, 362] },
};

/** Arquivo e, quando a foto tem borda de recorte, a caixa que a exclui. */
const OLYMPIC = {
  Saturn: ['aratron.png', [5, 5, 432, 447]], Jupiter: ['bethor.png'], Mars: ['phaleg.png'], Sun: ['och.png'],
  Venus: ['hagith.png'], Mercury: ['ophiel.png'], Moon: ['phul.png', [0, 0, 453, 362]],
};

const previewDir = process.argv.includes('--preview') ? process.argv[process.argv.indexOf('--preview') + 1] : null;
if (previewDir) fs.mkdirSync(previewDir, { recursive: true });

/** Máscara binária (true = traço) e caixa justa da tinta dentro do recorte. */
async function inkBox(file, box) {
  const img = sharp(file).flatten({ background: '#ffffff' }).greyscale();
  const [x0, y0, x1, y1] = box ?? [0, 0, (await img.metadata()).width, (await img.metadata()).height];
  const { data, info } = await img.extract({ left: x0, top: y0, width: x1 - x0, height: y1 - y0 }).raw().toBuffer({ resolveWithObject: true });
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (data[y * info.width + x] < 128) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const pad = 3;
  const meta = await sharp(file).metadata();
  const left = Math.max(0, x0 + minX - pad), top = Math.max(0, y0 + minY - pad);
  const right = Math.min(meta.width, x0 + maxX + 1 + pad), bottom = Math.min(meta.height, y0 + maxY + 1 + pad);
  return { left, top, width: right - left, height: bottom - top };
}

async function trace(file, box, name) {
  const r = await inkBox(file, box);
  const buf = await sharp(file).flatten({ background: '#ffffff' }).extract(r).greyscale()
    .resize(r.width * SCALE, r.height * SCALE, { kernel: 'cubic' }).png().toBuffer();
  if (previewDir) fs.writeFileSync(path.join(previewDir, `${name}.png`), buf);
  const tracer = new potrace.Potrace();
  tracer.setParameters({ threshold: 128, turdSize: 20, optTolerance: 0.4 });
  await new Promise((res, rej) => tracer.loadImage(buf, e => (e ? rej(e) : res())));
  const d = /d="([^"]+)"/.exec(tracer.getPathTag('#000'))[1];
  // Arredonda coordenadas para enxugar o arquivo
  const dr = d.replace(/-?\d+\.\d+/g, n => String(Math.round(+n)));
  if (previewDir) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${r.width * SCALE} ${r.height * SCALE}"><rect width="100%" height="100%" fill="#222"/><path d="${dr}" fill="#fc0" fill-rule="evenodd"/></svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(previewDir, `${name}.traced.png`));
  }
  return { w: r.width * SCALE, h: r.height * SCALE, d: dr };
}

const out = { agrippa: {}, olympic: {} };
for (const [planet, cfg] of Object.entries(AGRIPPA)) {
  const file = path.join(SRC, 'agrippa', cfg.file);
  out.agrippa[planet] = {};
  for (const [kind, box] of Object.entries(cfg)) {
    if (kind === 'file') continue;
    out.agrippa[planet][kind] = await trace(file, box, `${planet}-${kind}`);
  }
}
for (const [planet, [f, box]] of Object.entries(OLYMPIC)) {
  out.olympic[planet] = await trace(path.join(SRC, 'olimpicos', f), box ?? null, `${planet}-olympic`);
}

fs.writeFileSync(OUT, `/* Gerado por scripts/generate-seals.mjs — não editar à mão. */
import type { ClassicalPlanet } from '../planetary';

export interface SealPath { w: number; h: number; d: string }
export type AgrippaSealKind = 'planet' | 'intelligence' | 'intelligences' | 'spirit' | 'spirits';

/** Selos de Agrippa, De Occulta Philosophia II.22. */
export const AGRIPPA_SEALS: Record<ClassicalPlanet, Partial<Record<AgrippaSealKind, SealPath>>> = ${JSON.stringify(out.agrippa, null, 1)};

/** Caracteres dos olímpicos, Arbatel de Magia Veterum, aforismo 17. */
export const OLYMPIC_SEALS: Record<ClassicalPlanet, SealPath> = ${JSON.stringify(out.olympic, null, 1)};
`);
console.log('ok', OUT, (fs.statSync(OUT).size / 1024).toFixed(0) + ' KB');
