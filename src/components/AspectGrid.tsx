import React from 'react';
import type { PlanetPosition } from '../types/astro';
import { PLANET_COLORS } from '../utils/zodiac';

interface AspectGridProps {
  planets: PlanetPosition[];
}

interface AspectType {
  name: string;
  angle: number;
  orb: number;
  glyph: string;
  color: string;
}

const ASPECTS: AspectType[] = [
  { name: 'Conjunção',    angle: 0,   orb: 8, glyph: '\u260C', color: '#f1c40f' },
  { name: 'Sextil',       angle: 60,  orb: 6, glyph: '\u26B9', color: '#3498db' },
  { name: 'Quadratura',   angle: 90,  orb: 8, glyph: '\u25A1', color: '#e74c3c' },
  { name: 'Trígono',      angle: 120, orb: 8, glyph: '\u25B3', color: '#2ecc71' },
  { name: 'Oposição',     angle: 180, orb: 8, glyph: '\u260D', color: '#e74c3c' },
  { name: 'Quincúncio',   angle: 150, orb: 2, glyph: '\u26BB', color: '#95a5a6' },
  { name: 'Semi-sextil',  angle: 30,  orb: 2, glyph: '\u26BA', color: '#95a5a6' },
];

function findAspect(lon1: number, lon2: number): AspectType | null {
  const diff = Math.abs(lon1 - lon2);
  const angle = diff > 180 ? 360 - diff : diff;

  for (const aspect of ASPECTS) {
    if (Math.abs(angle - aspect.angle) <= aspect.orb) {
      return aspect;
    }
  }
  return null;
}

const CELL = 32;

const AspectGrid: React.FC<AspectGridProps> = ({ planets }) => {
  const n = planets.length;
  const width = (n) * CELL;
  const height = (n) * CELL;

  return (
    <div style={{ padding: '16px 8px', overflowX: 'auto' }}>
      <h3 style={{ color: '#c9a84c', textAlign: 'center', marginBottom: 12, fontSize: '1rem' }}>
        Aspectos
      </h3>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ maxWidth: '100%' }}
        >
          {/* Planet glyphs along the diagonal */}
          {planets.map((p, i) => (
            <text
              key={`diag-${p.name}`}
              x={i * CELL + CELL / 2}
              y={i * CELL + CELL / 2}
              textAnchor="middle"
              dominantBaseline="central"
              fill={PLANET_COLORS[p.name] || '#fff'}
              fontSize="14"
              fontWeight="bold"
            >
              {p.glyph}
            </text>
          ))}

          {/* Aspect cells below the diagonal (staircase) */}
          {planets.map((p1, row) =>
            planets.map((p2, col) => {
              if (col >= row) return null;
              const aspect = findAspect(p1.longitude, p2.longitude);
              return (
                <g key={`${row}-${col}`}>
                  <rect
                    x={col * CELL}
                    y={row * CELL}
                    width={CELL}
                    height={CELL}
                    fill="transparent"
                    stroke="rgba(255,255,255,0.15)"
                    strokeWidth="0.5"
                  />
                  {aspect && (
                    <text
                      x={col * CELL + CELL / 2}
                      y={row * CELL + CELL / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={aspect.color}
                      fontSize="13"
                    >
                      {aspect.glyph}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Border around staircase area */}
          {planets.map((_, row) => {
            if (row === 0) return null;
            return (
              <rect
                key={`border-${row}`}
                x={0}
                y={row * CELL}
                width={row * CELL}
                height={CELL}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.5"
              />
            );
          })}
        </svg>
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: '8px 16px',
          marginTop: 12,
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.6)',
        }}
      >
        {ASPECTS.map((a) => (
          <span key={a.name} style={{ color: a.color }}>
            {a.glyph} {a.name}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AspectGrid;
