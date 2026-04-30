import React from 'react';
import type { ChartData, ZodiacSystem } from '../types/astro';
import ZodiacRing from './ZodiacRing';
import HouseGrid from './HouseGrid';
import PlanetMarker from './PlanetMarker';
import './MandalaChart.css';

interface MandalaChartProps {
  data: ChartData;
  size?: number;
  zodiacSystem: ZodiacSystem;
  onZodiacSystemChange: (system: ZodiacSystem) => void;
}

const MandalaChart: React.FC<MandalaChartProps> = ({ data, size = 500, zodiacSystem, onZodiacSystemChange }) => {
  const margin = size * 0.1;
  const viewSize = size + margin * 2;
  const cx = viewSize / 2;
  const cy = viewSize / 2;
  const outerRadius = size * 0.45;
  const innerRadius = size * 0.33;
  const planetRadius = size * 0.27;

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
      <div className="zodiac-system-toggle">
        <button
          className={`zodiac-btn ${zodiacSystem === 'sidereal' ? 'active' : ''}`}
          onClick={() => onZodiacSystemChange('sidereal')}
        >
          Sideral
        </button>
        <button
          className={`zodiac-btn ${zodiacSystem === 'tropical' ? 'active' : ''}`}
          onClick={() => onZodiacSystemChange('tropical')}
        >
          Tropical
        </button>
      </div>
      <svg
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        width="100%"
        height="100%"
        className="mandala-chart"
      >
        {/* Background circles */}
        <circle cx={cx} cy={cy} r={outerRadius + 2} fill="none" stroke="rgba(201,168,76,0.3)" strokeWidth={1} />
        <circle cx={cx} cy={cy} r={innerRadius} fill="none" stroke="rgba(201,168,76,0.2)" strokeWidth={0.5} />

        <ZodiacRing cx={cx} cy={cy} outerRadius={outerRadius} innerRadius={innerRadius} ascendant={data.ascendant} />
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
        <circle cx={cx} cy={cy} r={2.5} fill="#c9a84c" />
      </svg>

      <div className="moon-phase">
        <span className="moon-phase-emoji">{data.moonPhase.emoji}</span>
        <span className="moon-phase-name">{data.moonPhase.name}</span>
        <span className="moon-phase-illumination">{data.moonPhase.illumination}% iluminada</span>
      </div>
    </div>
  );
};

export default MandalaChart;
