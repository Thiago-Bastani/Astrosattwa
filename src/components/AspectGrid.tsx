import React from 'react';
import type { PlanetPosition } from '../types/astro';
import { PLANET_COLORS } from '../utils/zodiac';
import { ASPECTS, findAspect } from '../utils/aspects';

interface AspectGridProps {
  planets: PlanetPosition[];
}

const CELL = 32;

const AspectGrid: React.FC<AspectGridProps> = ({ planets }) => {
  const n = planets.length;
  const width = (n) * CELL;
  const height = (n) * CELL;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', maxWidth: width, height: 'auto', display: 'block' }}
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
              fontSize="18"
              fontWeight="bold"
              className="astro-glyph"
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
                      fontSize="17"
                      className="astro-glyph"
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
          gap: '4px 12px',
          marginTop: 8,
          fontSize: '0.7rem',
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
