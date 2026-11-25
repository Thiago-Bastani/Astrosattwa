import React from 'react';
import type { ChartData } from '../types/astro';
import ZodiacRing from './ZodiacRing';
import HouseGrid from './HouseGrid';
import PlanetMarker from './PlanetMarker';
import { listAspects } from '../utils/aspects';
import './MandalaChart.css';

interface MandalaChartProps {
  data: ChartData;
  size?: number;
}

const MandalaChart: React.FC<MandalaChartProps> = ({ data, size = 500 }) => {
  const margin = size * 0.055; // só as setas curtas; rótulos ficam ao lado delas
  const viewSize = size + margin * 2;
  const cx = viewSize / 2;
  const cy = viewSize / 2;
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.33;
  const planetRadius = size * 0.27;
  const aspectRadius = size * 0.215;

  const point = (lon: number) => {
    const a = ((180 + lon - data.ascendant) * Math.PI) / 180;
    return { x: cx + aspectRadius * Math.cos(a), y: cy - aspectRadius * Math.sin(a) };
  };
  const lonOf = Object.fromEntries(data.planets.map(p => [p.name, p.longitude]));
  // Conjunções não têm linha (os glifos já estão juntos); menores ficam tracejadas
  const aspectLines = listAspects(data.planets)
    .filter(f => f.aspect.angle !== 0)
    .sort((p, q) => q.orb / q.aspect.orb - p.orb / p.aspect.orb); // os mais exatos por cima

  // Resolve collisions: if planets are within 8 degrees, offset radially
  const sortedPlanets = [...data.planets].sort((a, b) => a.longitude - b.longitude);
  const offsets: number[] = sortedPlanets.map(() => 0);
  for (let i = 1; i < sortedPlanets.length; i++) {
    const diff = Math.abs(sortedPlanets[i].longitude - sortedPlanets[i - 1].longitude);
    if (diff < 8 || diff > 352) {
      offsets[i] = offsets[i - 1] === 0 ? -size * 0.035 : size * 0.035;
    }
  }

  return (
    <div className="mandala-chart-container">
      <svg
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        className="mandala-chart"
      >
        {/* Background circles */}
        <circle cx={cx} cy={cy} r={outerRadius + 2} fill="none" style={{ stroke: 'rgba(var(--as-accent-rgb), 0.35)' }} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={innerRadius} fill="none" style={{ stroke: 'rgba(var(--as-accent-rgb), 0.25)' }} strokeWidth={0.5} />

        <ZodiacRing cx={cx} cy={cy} outerRadius={outerRadius} innerRadius={innerRadius} ascendant={data.ascendant} />

        {/* Aspect lines */}
        <circle cx={cx} cy={cy} r={aspectRadius} fill="none" style={{ stroke: 'rgba(var(--as-accent-rgb), 0.2)' }} strokeWidth={0.5} />
        {aspectLines.map(f => {
          const p1 = point(lonOf[f.a]);
          const p2 = point(lonOf[f.b]);
          const minor = f.aspect.orb <= 2;
          const exactness = 1 - f.orb / f.aspect.orb;
          return (
            <line
              key={`asp-${f.a}-${f.b}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke={f.aspect.color}
              strokeOpacity={0.3 + 0.55 * exactness}
              strokeWidth={minor ? 0.7 : 0.6 + 0.8 * exactness}
              strokeDasharray={minor ? '3 2' : undefined}
              strokeLinecap="round"
            />
          );
        })}

        {/* Miolo opaco: os números das casas ficam legíveis sobre as linhas */}
        <circle cx={cx} cy={cy} r={innerRadius * 0.3} style={{ fill: 'var(--as-bg)', stroke: 'rgba(var(--as-accent-rgb), 0.25)' }} strokeWidth={0.5} />
        <HouseGrid cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} chart={data} />

        {sortedPlanets.map((planet, i) => (
          <PlanetMarker
            key={planet.name}
            planet={planet}
            cx={cx}
            cy={cy}
            radius={planetRadius}
            ascendant={data.ascendant}
            offsetRadius={offsets[i]}
          />
        ))}

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={2.5} style={{ fill: 'var(--as-highlight)' }} />
      </svg>
    </div>
  );
};

export default MandalaChart;
