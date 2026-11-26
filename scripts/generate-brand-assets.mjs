/**
 * Gera ícone e splash a partir de uma única geometria vetorial:
 * anel duplo da mandala ocidental (sem signos) com o mapa védico norte-indiano (vazio) dentro.
 *
 *   node scripts/generate-brand-assets.mjs
 *
 * Escreve: vetores Android (ícone adaptativo e splash do Android 12+), PNGs legados de
 * ícone e splash em todas as densidades, resources/*.png e public/favicon.png.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const GOLD = '#ffffff';
const BG = '#000000';
const RES = 'android/app/src/main/res';

/** Linhas do logo num quadro de lado `size`, raio externo `R`. */
function geometry(size, R) {
  const c = size / 2;
  const rIn = R * 0.84;
  const h = rIn / Math.SQRT2; // meio lado do quadrado inscrito no anel interno
  const [x0, x1, y0, y1] = [c - h, c + h, c - h, c + h];
  const f = n => +n.toFixed(3);
  const circle = r => `M${f(c - r)},${f(c)}A${f(r)},${f(r)} 0 1,1 ${f(c + r)},${f(c)}A${f(r)},${f(r)} 0 1,1 ${f(c - r)},${f(c)}Z`;
  return {
    rings: [circle(R), circle(rIn)],
    ringWidth: f(R * 0.055),
    chart: [
      `M${f(x0)},${f(y0)}L${f(x1)},${f(y0)}L${f(x1)},${f(y1)}L${f(x0)},${f(y1)}Z`, // quadrado
      `M${f(x0)},${f(y0)}L${f(x1)},${f(y1)}M${f(x1)},${f(y0)}L${f(x0)},${f(y1)}`, // diagonais
      `M${f(c)},${f(y0)}L${f(x1)},${f(c)}L${f(c)},${f(y1)}L${f(x0)},${f(c)}Z`, // losango
    ],
    chartWidth: f(R * 0.042),
  };
}

function svg(w, h, R, { bg = BG, round = false } = {}) {
  const s = Math.min(w, h);
  const g = geometry(s, R);
  const dx = (w - s) / 2, dy = (h - s) / 2;
  const back = bg === null ? '' : round
    ? `<circle cx="${w / 2}" cy="${h / 2}" r="${s / 2}" fill="${bg}"/>`
    : `<rect width="${w}" height="${h}" fill="${bg}"/>`;
  const p = (d, sw) => `<path d="${d}" fill="none" stroke="${GOLD}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (!R) return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${back}</svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${back}` +
    `<g transform="translate(${dx},${dy})">${g.rings.map(d => p(d, g.ringWidth)).join('')}${g.chart.map(d => p(d, g.chartWidth)).join('')}</g></svg>`;
}

function vector(R, color = GOLD) {
  const g = geometry(108, R);
  const p = (d, sw) => `    <path\n        android:pathData="${d}"\n        android:strokeColor="${color}"\n        android:strokeWidth="${sw}"\n        android:strokeLineJoin="round"\n        android:strokeLineCap="round" />`;
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Gerado por scripts/generate-brand-assets.mjs -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
${[...g.rings.map(d => p(d, g.ringWidth)), ...g.chart.map(d => p(d, g.chartWidth))].join('\n')}
</vector>
`;
}

/**
 * Ícone pequeno das notificações (barra de status, 24dp, branco sobre transparente).
 * Mesma geometria do logo, preenchendo o quadro, com traços engrossados para ler em 24dp.
 */
function statVector() {
  const g = geometry(24, 11.2);
  const p = (d, sw) => `    <path\n        android:pathData="${d}"\n        android:strokeColor="#FFFFFFFF"\n        android:strokeWidth="${sw}"\n        android:strokeLineJoin="round"\n        android:strokeLineCap="round" />`;
  return `<?xml version="1.0" encoding="utf-8"?>
<!-- Gerado por scripts/generate-brand-assets.mjs (ícone das notificações) -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
${[...g.rings.map(d => p(d, 1.15)), ...g.chart.map(d => p(d, 0.95))].join('\n')}
</vector>
`;
}

const write = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
const png = (file, w, h, R, opts) => sharp(Buffer.from(svg(w, h, R, opts))).png().toFile(file);

/* Vetores: ícone adaptativo (zona segura de 66dp → raio 31) e splash do Android 12+ (cabe no círculo de 192/288) */
write(`${RES}/drawable/ic_logo_mark.xml`, vector(31));
write(`${RES}/drawable/ic_logo_mono.xml`, vector(31, '#ffffff'));
write(`${RES}/drawable/splash_icon.xml`, vector(34));
write(`${RES}/drawable/ic_stat_sky.xml`, statVector());
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/logo_background" />
    <foreground android:drawable="@drawable/ic_logo_mark" />
    <monochrome android:drawable="@drawable/ic_logo_mono" />
</adaptive-icon>
`;
write(`${RES}/mipmap-anydpi-v26/ic_launcher.xml`, adaptive);
write(`${RES}/mipmap-anydpi-v26/ic_launcher_round.xml`, adaptive);
write(`${RES}/values/colors.xml`, `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="logo_background">${BG}</color>
</resources>
`);

/* PNGs legados (Android < 8) */
const DENS = { ldpi: 0.75, mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
for (const [d, k] of Object.entries(DENS)) {
  const s = Math.round(48 * k);
  const fg = Math.round(108 * k);
  await png(`${RES}/mipmap-${d}/ic_launcher.png`, s, s, s * 0.4);
  await png(`${RES}/mipmap-${d}/ic_launcher_round.png`, s, s, s * 0.38, { round: true, bg: BG });
  await png(`${RES}/mipmap-${d}/ic_launcher_foreground.png`, fg, fg, fg * 31 / 108, { bg: null });
  await png(`${RES}/mipmap-${d}/ic_launcher_background.png`, fg, fg, 0);
}

/* Splash do plugin do Capacitor: mesmas dimensões dos arquivos existentes */
for (const dir of fs.readdirSync(RES).filter(n => n.startsWith('drawable'))) {
  const file = `${RES}/${dir}/splash.png`;
  if (!fs.existsSync(file)) continue;
  const { width, height } = await sharp(file).metadata();
  const tmp = `${file}.tmp`;
  await png(tmp, width, height, Math.min(width, height) * 0.25);
  fs.renameSync(tmp, file);
}

/* Fontes para @capacitor/assets e web */
write('resources/logo.svg', svg(1024, 1024, 400));
await png('resources/icon-only.png', 1024, 1024, 400);
await png('resources/icon-foreground.png', 1024, 1024, 1024 * 31 / 108, { bg: null });
await png('resources/icon-background.png', 1024, 1024, 0);
await png('resources/splash.png', 2732, 2732, 2732 * 0.22);
await png('resources/splash-dark.png', 2732, 2732, 2732 * 0.22);
await png('public/favicon.png', 64, 64, 30, { round: true });
console.log('ok');
