import React from 'react';
import type { PlanetaryDay } from '../utils/planetary';
import { WEEKDAY_NAMES_PT } from '../utils/planetary';
import { PLANET_COLORS, PLANET_GLYPHS } from '../utils/zodiac';
import { PLANET_NAMES_PT } from '../utils/astroLabels';

interface PlanetaryHoursChartProps {
  day: PlanetaryDay | null;
  date: Date;
}

const SIZE = 400;
const C = SIZE / 2;
const R_OUT = 166;
const R_IN = 108;
const R_GLYPH = (R_OUT + R_IN) / 2;
const DEG = Math.PI / 180;

const hhmm = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/**
 * Ângulo (graus, matemático) de uma fração do período.
 * Dia: nascer à esquerda → topo → pôr à direita (como o Sol sobre o horizonte do mapa).
 * Noite: pôr à direita → base → nascer à esquerda.
 */
function angleFor(isDay: boolean, frac: number): number {
  return isDay ? 180 - 180 * frac : -180 * frac;
}

function point(r: number, aDeg: number): [number, number] {
  return [C + r * Math.cos(aDeg * DEG), C - r * Math.sin(aDeg * DEG)];
}

function sector(a1: number, a2: number): string {
  const [x1, y1] = point(R_OUT, a1);
  const [x2, y2] = point(R_OUT, a2);
  const [x3, y3] = point(R_IN, a2);
  const [x4, y4] = point(R_IN, a1);
  return `M ${x1} ${y1} A ${R_OUT} ${R_OUT} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${R_IN} ${R_IN} 0 0 0 ${x4} ${y4} Z`;
}

/** Relógio das 24 horas planetárias: metade de cima = horas do dia, de baixo = da noite. */
const PlanetaryHoursChart: React.FC<PlanetaryHoursChartProps> = ({ day, date }) => {
  if (!day) {
    return (
      <div className="hours-empty">
        Sem nascer/pôr do sol nesta data e local (dia ou noite polar) — horas planetárias indisponíveis.
      </div>
    );
  }

  const current = day.current;
  const t = date.getTime();

  // Ponteiro na posição exata de `date`
  let needle: number | null = null;
  if (current) {
    const frac = (t - current.start.getTime()) / (current.end.getTime() - current.start.getTime());
    const slot = (current.index - 1) % 12;
    needle = angleFor(current.isDay, (slot + frac) / 12);
  }

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="hours-chart" role="img" aria-label="Horas planetárias">
      {/* Horizonte (só nas bordas, para não cortar o texto central) */}
      <line x1={C - R_OUT - 6} y1={C} x2={C - R_IN + 4} y2={C} style={{ stroke: 'rgba(var(--as-accent-rgb), 0.6)' }} strokeWidth={1} />
      <line x1={C + R_IN - 4} y1={C} x2={C + R_OUT + 6} y2={C} style={{ stroke: 'rgba(var(--as-accent-rgb), 0.6)' }} strokeWidth={1} />

      {day.hours.map(h => {
        const slot = (h.index - 1) % 12;
        const a1 = angleFor(h.isDay, slot / 12);
        const a2 = angleFor(h.isDay, (slot + 1) / 12);
        const [gx, gy] = point(R_GLYPH, (a1 + a2) / 2);
        const isCurrent = current?.index === h.index;
        const color = PLANET_COLORS[h.ruler];
        return (
          <g key={h.index}>
            <path
              d={sector(a1, a2)}
              fill={color}
              fillOpacity={isCurrent ? 0.55 : h.isDay ? 0.16 : 0.08}
              style={{ stroke: isCurrent ? 'var(--as-highlight)' : 'rgba(255,255,255,0.12)' }}
              strokeWidth={isCurrent ? 2 : 0.6}
            />
            <text
              x={gx}
              y={gy}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isCurrent ? '#fff' : color}
              fontSize={isCurrent ? 22 : 18}
              className="astro-glyph"
            >
              {PLANET_GLYPHS[h.ruler]}
            </text>
          </g>
        );
      })}

      {/* Ponteiro do instante */}
      {needle !== null && (() => {
        const [x1, y1] = point(R_IN - 10, needle);
        const [x2, y2] = point(R_OUT + 6, needle);
        return <line x1={x1} y1={y1} x2={x2} y2={y2} style={{ stroke: 'var(--as-highlight)' }} strokeWidth={2} strokeLinecap="round" />;
      })()}

      {/* Nascer e pôr do sol nas pontas do horizonte */}
      <text x={C - R_IN + 8} y={C + 14} fontSize={11} fill="rgba(255,255,255,0.6)">↑{hhmm(day.sunrise)}</text>
      <text x={C + R_IN - 8} y={C + 14} fontSize={11} fill="rgba(255,255,255,0.6)" textAnchor="end">{hhmm(day.sunset)}↓</text>

      {/* Centro: hora atual */}
      {current ? (
        <g>
          <text x={C} y={C - 62} textAnchor="middle" fontSize={10.5} fill="rgba(255,255,255,0.55)" letterSpacing={1}>
            {`DIA DE ${WEEKDAY_NAMES_PT[day.weekday].toUpperCase()}`}
          </text>
          <text x={C} y={C - 32} textAnchor="middle" dominantBaseline="central" fontSize={32} fill={PLANET_COLORS[current.ruler]} className="astro-glyph">
            {PLANET_GLYPHS[current.ruler]}
          </text>
          <text x={C} y={C - 4} textAnchor="middle" fontSize={16} style={{ fill: 'var(--as-highlight)' }} fontFamily="Georgia, serif">
            {PLANET_NAMES_PT[current.ruler]}
          </text>
          <text x={C} y={C + 36} textAnchor="middle" fontSize={12} fill="rgba(255,255,255,0.7)">
            {hhmm(current.start)}–{hhmm(current.end)}
          </text>
          <text x={C} y={C + 53} textAnchor="middle" fontSize={10.5} fill="rgba(255,255,255,0.45)">
            {`${(current.index - 1) % 12 + 1}ª hora ${current.isDay ? 'diurna' : 'noturna'}`}
          </text>
        </g>
      ) : null}
    </svg>
  );
};

export default PlanetaryHoursChart;
