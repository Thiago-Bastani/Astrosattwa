import React from 'react';

interface HouseGridProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  houseCusps: number[];
  ascendant: number;
}

const HouseGrid: React.FC<HouseGridProps> = ({ cx, cy, innerRadius, outerRadius, houseCusps, ascendant }) => {
  return (
    <g>
      {houseCusps.map((cusp, i) => {
        const angleDeg = 180 + ascendant - (cusp - houseCusps[0]);
        const angleRad = (angleDeg * Math.PI) / 180;
        const x1 = cx + innerRadius * 0.15 * Math.cos(angleRad);
        const y1 = cy - innerRadius * 0.15 * Math.sin(angleRad);
        const x2 = cx + innerRadius * Math.cos(angleRad);
        const y2 = cy - innerRadius * Math.sin(angleRad);

        const isCardinal = i === 0 || i === 3 || i === 6 || i === 9;

        return (
          <g key={i}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isCardinal ? '#c9a84c' : 'rgba(255,255,255,0.2)'}
              strokeWidth={isCardinal ? 1.5 : 0.5}
            />
            <text
              x={cx + innerRadius * 0.35 * Math.cos(((angleDeg - 15) * Math.PI) / 180)}
              y={cy - innerRadius * 0.35 * Math.sin(((angleDeg - 15) * Math.PI) / 180)}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.4)"
              fontSize={innerRadius * 0.08}
            >
              {i + 1}
            </text>
          </g>
        );
      })}
      {/* ASC label */}
      <text
        x={cx + outerRadius * 1.08 * Math.cos((180 * Math.PI) / 180)}
        y={cy - outerRadius * 1.08 * Math.sin((180 * Math.PI) / 180)}
        textAnchor="start"
        dominantBaseline="central"
        fill="#c9a84c"
        fontSize={innerRadius * 0.1}
        fontWeight="bold"
      >
        ASC
      </text>
    </g>
  );
};

export default HouseGrid;
