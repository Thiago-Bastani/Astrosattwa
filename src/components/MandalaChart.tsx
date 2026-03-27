import React from 'react';
import type { ChartData } from '../types/astro';
import ZodiacRing from './ZodiacRing';
import HouseGrid from './HouseGrid';
import PlanetMarker from './PlanetMarker';
import './MandalaChart.css';

interface MandalaChartProps {
  data: ChartData;
  size?: number;
}

const MandalaChart: React.FC<MandalaChartProps> = ({ data, size = 350 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.32;
  const planetRadius = size * 0.26;

  // Resolve collisions: if planets are within 8 degrees, offset them radially
  const sortedPlanets = [...data.planets].sort((a, b) => a.longitude - b.longitude);
  const offsets: number[] = sortedPlanets.map(() => 0);
  for (let i = 1; i < sortedPlanets.length; i++) {
    const diff = Math.abs(sortedPlanets[i].longitude - sortedPlanets[i - 1].longitude);
    if (diff < 8 || diff > 352) {
      offsets[i] = offsets[i - 1] === 0 ? -size * 0.04 : size * 0.04;
    }
  }

  return (
    <div className="mandala-chart-container">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width="100%"
        height="100%"
        className="mandala-chart"
      >
        {/* Background circle */}
        <circle cx={cx} cy={cy} r={outerRadius + 2} fill="none" stroke="rgba(201,168,76,0.3)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth={0.5} />

        <ZodiacRing cx={cx} cy={cy} outerRadius={outerRadius} innerRadius={innerRadius} ascendant={data.ascendant} />
        <HouseGrid cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} houseCusps={data.houseCusps} ascendant={data.ascendant} />

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
        <circle cx={cx} cy={cy} r={2} fill="#c9a84c" />
      </svg>
    </div>
  );
};

export default MandalaChart;
