import React from 'react';
import type { ChartData, PlanetPosition } from '../types/astro';
import { PLANET_COLORS, ZODIAC_SIGNS, getZodiacSign } from '../utils/zodiac';
import { PLANET_NAMES_PT, SIGN_NAMES_PT } from '../utils/astroLabels';
import './VedicChart.css';

interface VedicChartProps {
  data: ChartData;
}

/**
 * Rashi chakra no estilo norte-indiano.
 *
 * As casas são fixas no desenho (casa 1 no losango de cima, seguindo no sentido
 * anti-horário) e os signos giram: cada casa mostra o número do signo que a ocupa.
 * Casas por signo inteiro (whole sign), a partir do signo do Ascendente (Lagna).
 * As longitudes vêm do mapa, então o desenho segue o zodíaco selecionado.
 */

const S = 400; // lado do quadrado
const PAD = 6;

/** Só os nove grahas (Rahu = Nodo Norte, Ketu = Nodo Sul). */
const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'NorthNode', 'SouthNode'];

const GRAHA_LABELS: Record<string, string> = {
  Sun: 'Su', Moon: 'Mo', Mars: 'Ma', Mercury: 'Me', Jupiter: 'Ju',
  Venus: 'Ve', Saturn: 'Sa', NorthNode: 'Ra', SouthNode: 'Ke',
};

const GRAHA_NAMES: Record<string, string> = {
  ...PLANET_NAMES_PT, NorthNode: 'Rahu', SouthNode: 'Ketu',
};

type Pt = [number, number];
const q = S / 4;
const TL: Pt = [0, 0], TR: Pt = [S, 0], BR: Pt = [S, S], BL: Pt = [0, S];
const T: Pt = [S / 2, 0], R: Pt = [S, S / 2], B: Pt = [S / 2, S], L: Pt = [0, S / 2];
const C: Pt = [S / 2, S / 2];
const P1: Pt = [q, q], P2: Pt = [3 * q, q], P3: Pt = [3 * q, 3 * q], P4: Pt = [q, 3 * q];

interface HouseShape {
  poly: Pt[];
  /** Vértice voltado para o centro (onde fica o número do signo). */
  inner: Pt;
  /** Centro da área útil para os planetas. */
  anchor: Pt;
  /** Planetas por linha. */
  cols: number;
}

/** Casas 1–12, sentido anti-horário a partir do losango de cima. */
const HOUSES: HouseShape[] = [
  { poly: [T, P2, C, P1],  inner: C,  anchor: [S / 2, q * 0.95],            cols: 3 },
  { poly: [TL, T, P1],     inner: P1, anchor: [q, S / 12 - 4],              cols: 3 },
  { poly: [TL, P1, L],     inner: P1, anchor: [S / 12 - 2, q],              cols: 1 },
  { poly: [L, P1, C, P4],  inner: C,  anchor: [q * 0.95, S / 2],            cols: 3 },
  { poly: [L, P4, BL],     inner: P4, anchor: [S / 12 - 2, 3 * q],          cols: 1 },
  { poly: [BL, P4, B],     inner: P4, anchor: [q, S - S / 12 + 4],          cols: 3 },
  { poly: [B, P4, C, P3],  inner: C,  anchor: [S / 2, 3 * q * 1.017],       cols: 3 },
  { poly: [B, P3, BR],     inner: P3, anchor: [3 * q, S - S / 12 + 4],      cols: 3 },
  { poly: [BR, P3, R],     inner: P3, anchor: [S - S / 12 + 2, 3 * q],      cols: 1 },
  { poly: [R, P3, C, P2],  inner: C,  anchor: [3 * q * 1.017, S / 2],       cols: 3 },
  { poly: [R, P2, TR],     inner: P2, anchor: [S - S / 12 + 2, q],          cols: 1 },
  { poly: [TR, P2, T],     inner: P2, anchor: [3 * q, S / 12 - 4],          cols: 3 },
];

const DX = 36; // passo horizontal entre planetas
const DY = 22; // passo vertical entre linhas

function polygonCentroid(poly: Pt[]): Pt {
  const x = poly.reduce((s, p) => s + p[0], 0) / poly.length;
  const y = poly.reduce((s, p) => s + p[1], 0) / poly.length;
  return [x, y];
}

/** Ponto a `dist` do vértice interno, em direção ao centro da casa. */
function towards(from: Pt, to: Pt, dist: number): Pt {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const len = Math.hypot(dx, dy) || 1;
  return [from[0] + (dx / len) * dist, from[1] + (dy / len) * dist];
}

function signIndex(lon: number): number {
  return Math.floor((((lon % 360) + 360) % 360) / 30);
}

function layout(anchor: Pt, cols: number, count: number): Pt[] {
  const rows = Math.ceil(count / cols);
  return Array.from({ length: count }, (_, i) => {
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, count - row * cols);
    const col = i % cols;
    return [
      anchor[0] + (col - (inRow - 1) / 2) * DX,
      anchor[1] + (row - (rows - 1) / 2) * DY,
    ];
  });
}

const VedicChart: React.FC<VedicChartProps> = ({ data }) => {
  const lagnaSign = signIndex(data.ascendant);
  const lagna = getZodiacSign(data.ascendant);

  // Agrupa os grahas por casa (signo inteiro a partir do Lagna), em ordem de longitude
  const byHouse: PlanetPosition[][] = HOUSES.map(() => []);
  for (const p of data.planets) {
    if (!GRAHAS.includes(p.name)) continue;
    const house = (signIndex(p.longitude) - lagnaSign + 12) % 12;
    byHouse[house].push(p);
  }
  byHouse.forEach(list => list.sort((a, b) => a.signDegree - b.signDegree));

  const line = 'rgba(var(--as-accent-rgb), 0.45)';
  const system = data.zodiacSystem === 'sidereal' ? 'sideral · Lahiri' : 'tropical';

  return (
    <div className="vedic-chart-container">
      <svg
        viewBox={`${-PAD} ${-PAD} ${S + PAD * 2} ${S + PAD * 2}`}
        className="vedic-chart"
        role="img"
        aria-label={`Mapa védico norte-indiano, Lagna em ${SIGN_NAMES_PT[lagna.sign.name]}, zodíaco ${system}`}
      >
        {/* Casa 1 em destaque */}
        <polygon
          points={HOUSES[0].poly.map(p => p.join(',')).join(' ')}
          style={{ fill: 'rgba(var(--as-accent-rgb), 0.12)' }}
        />

        {/* Estrutura: quadrado, diagonais e losango */}
        <g style={{ stroke: line }} strokeWidth={1} fill="none">
          <rect x={0} y={0} width={S} height={S} />
          <line x1={0} y1={0} x2={S} y2={S} />
          <line x1={S} y1={0} x2={0} y2={S} />
          <polygon points={[T, R, B, L].map(p => p.join(',')).join(' ')} />
        </g>

        {HOUSES.map((h, i) => {
          const sign = (lagnaSign + i) % 12;
          const info = ZODIAC_SIGNS[sign];
          const [nx, ny] = towards(h.inner, polygonCentroid(h.poly), 15);
          const planets = byHouse[i];
          const spots = layout(h.anchor, h.cols, planets.length);

          return (
            <g key={i}>
              {/* Número do signo, junto ao vértice interno da casa */}
              <text
                x={nx} y={ny}
                textAnchor="middle" dominantBaseline="central"
                fontSize={12} fontWeight="bold"
                fill={info.color} fillOpacity={0.85}
              >
                {sign + 1}
              </text>

              {planets.map((p, j) => {
                const [x, y] = spots[j];
                const color = PLANET_COLORS[p.name] || '#ffffff';
                return (
                  <text
                    key={p.name}
                    x={x} y={y}
                    textAnchor="middle" dominantBaseline="central"
                    fill={color}
                  >
                    <title>
                      {`${GRAHA_NAMES[p.name]} ${p.signDegree}°${String(p.signMinute).padStart(2, '0')}' ${SIGN_NAMES_PT[p.zodiacSign]}${p.isRetrograde ? ' (retrógrado)' : ''}`}
                    </title>
                    <tspan fontSize={14} fontWeight="bold">{GRAHA_LABELS[p.name]}</tspan>
                    <tspan fontSize={9} dx={1} fillOpacity={0.75}>
                      {p.signDegree}{p.isRetrograde ? 'R' : ''}
                    </tspan>
                  </text>
                );
              })}
            </g>
          );
        })}

        {/* Marca do Lagna no topo da casa 1 */}
        <text
          x={S / 2} y={22}
          textAnchor="middle" dominantBaseline="central"
          fontSize={11} fontWeight="bold" letterSpacing={1}
          style={{ fill: 'var(--as-highlight)' }}
        >
          ASC {lagna.degree}°
        </text>
      </svg>

      <div className="vedic-caption">
        Rashi · Lagna{' '}
        <span className="astro-glyph" style={{ color: lagna.sign.color }}>{lagna.sign.glyph}</span>{' '}
        {SIGN_NAMES_PT[lagna.sign.name]} {lagna.degree}°{String(lagna.minute).padStart(2, '0')}' · {system}
      </div>
    </div>
  );
};

/** Diagrama-chave: só a grade com o número de cada casa (tela de Referência). */
export const VedicHouseKey: React.FC = () => (
  <svg
    viewBox={`${-PAD} ${-PAD} ${S + PAD * 2} ${S + PAD * 2}`}
    className="vedic-key"
    role="img"
    aria-label="Posição das 12 casas no mapa norte-indiano"
  >
    <polygon
      points={HOUSES[0].poly.map(p => p.join(',')).join(' ')}
      style={{ fill: 'rgba(var(--as-accent-rgb), 0.12)' }}
    />
    <g style={{ stroke: 'rgba(var(--as-accent-rgb), 0.45)' }} strokeWidth={1.5} fill="none">
      <rect x={0} y={0} width={S} height={S} />
      <line x1={0} y1={0} x2={S} y2={S} />
      <line x1={S} y1={0} x2={0} y2={S} />
      <polygon points={[T, R, B, L].map(p => p.join(',')).join(' ')} />
    </g>
    {HOUSES.map((h, i) => {
      const [x, y] = h.anchor;
      return (
        <text
          key={i} x={x} y={y}
          textAnchor="middle" dominantBaseline="central"
          fontSize={30} fontWeight="bold"
          style={{ fill: i === 0 ? 'var(--as-highlight)' : 'rgba(var(--as-highlight-rgb), 0.6)' }}
        >
          {i + 1}
        </text>
      );
    })}
  </svg>
);

export default VedicChart;
