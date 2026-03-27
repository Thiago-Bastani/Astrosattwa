import React from 'react';
import type { PlanetPosition } from '../types/astro';

interface PlanetMarkerProps {
  planet: PlanetPosition;
  cx: number;
  cy: number;
  radius: number;
  ascendant: number;
  offsetRadius?: number;
}

const PLANET_COLORS: Record<string, string> = {
  Sun:     '#f1c40f',
  Moon:    '#ecf0f1',
  Mercury: '#bdc3c7',
  Venus:   '#e91e8c',
  Mars:    '#e74c3c',
  Jupiter: '#e67e22',
  Saturn:  '#95a5a6',
  Uranus:  '#1abc9c',
  Neptune: '#3498db',
  Pluto:   '#9b59b6',
};

const PlanetMarker: React.FC<PlanetMarkerProps> = ({ planet, cx, cy, radius, ascendant, offsetRadius = 0 }) => {
  const svgAngle = ((180 + ascendant - planet.longitude) * Math.PI) / 180;
  const r = radius + offsetRadius;
  const x = cx + r * Math.cos(svgAngle);
  const y = cy - r * Math.sin(svgAngle);
  const color = PLANET_COLORS[planet.name] || '#ffffff';

  return (
    <g>
      <circle cx={x} cy={y} r={radius * 0.08} fill={color} fillOpacity={0.2} />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={radius * 0.14}
        fontWeight="bold"
      >
        {planet.glyph}
      </text>
    </g>
  );
};

export default PlanetMarker;
