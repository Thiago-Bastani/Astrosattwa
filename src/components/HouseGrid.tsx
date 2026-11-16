import React from 'react';
import type { ChartData } from '../types/astro';

interface HouseGridProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  chart: ChartData;
}

const DEG = Math.PI / 180;

function toSvgAngle(longitude: number, ascendant: number): number {
  return (180 + longitude - ascendant) * DEG;
}

interface CardinalPointDef {
  label: string;
  longitude: number;
  color: string;
}

const HouseGrid: React.FC<HouseGridProps> = ({ cx, cy, innerRadius, outerRadius, chart }) => {
  const { houseCusps, ascendant, mc, descendant, ic } = chart;

  const cardinalPoints: CardinalPointDef[] = [
    { label: 'ASC', longitude: ascendant,   color: 'var(--as-highlight)' },
    { label: 'DSC', longitude: descendant,  color: 'var(--as-highlight)' },
    { label: 'MC',  longitude: mc,          color: '#e74c3c' },
    { label: 'IC',  longitude: ic,          color: '#e74c3c' },
  ];

  const arrowLen = outerRadius * 0.07;
  const arrowWidth = 5;

  return (
    <g>
      {/* House cusp lines */}
      {houseCusps.map((cusp, i) => {
        const angle = toSvgAngle(cusp, ascendant);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        // Line from near center to inner edge of zodiac ring
        const x1 = cx + innerRadius * 0.08 * cosA;
        const y1 = cy - innerRadius * 0.08 * sinA;
        const x2 = cx + innerRadius * cosA;
        const y2 = cy - innerRadius * sinA;

        const isCardinal = i === 0 || i === 3 || i === 6 || i === 9;

        // House number at midpoint of house (halfway between this cusp and next)
        const midLon = ((cusp + 15) % 360 + 360) % 360;
        const midAngle = toSvgAngle(midLon, ascendant);

        return (
          <g key={`house-${i}`}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              style={{ stroke: isCardinal ? 'var(--as-highlight)' : 'rgba(255,255,255,0.15)' }}
              strokeWidth={isCardinal ? 1.5 : 0.5}
            />
            <text
              x={cx + innerRadius * 0.22 * Math.cos(midAngle)}
              y={cy - innerRadius * 0.22 * Math.sin(midAngle)}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.4)"
              fontSize={innerRadius * 0.09}
            >
              {i + 1}
            </text>
          </g>
        );
      })}

      {/* Cardinal point arrows: ASC, DSC, MC, IC */}
      {cardinalPoints.map(({ label, longitude, color }) => {
        const angle = toSvgAngle(longitude, ascendant);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        // Line from inner ring through outer ring
        const lineInner = cx + innerRadius * cosA;
        const lineInnerY = cy - innerRadius * sinA;
        const lineOuter = cx + outerRadius * cosA;
        const lineOuterY = cy - outerRadius * sinA;

        // Arrow tip just outside outer ring
        const tipX = cx + (outerRadius + 2) * cosA;
        const tipY = cy - (outerRadius + 2) * sinA;

        // Arrow base further out
        const baseX = cx + (outerRadius + arrowLen + 2) * cosA;
        const baseY = cy - (outerRadius + arrowLen + 2) * sinA;

        // Arrow wings perpendicular
        const perpCos = Math.cos(angle + Math.PI / 2);
        const perpSin = Math.sin(angle + Math.PI / 2);
        const wing1X = baseX + arrowWidth * perpCos;
        const wing1Y = baseY - arrowWidth * perpSin;
        const wing2X = baseX - arrowWidth * perpCos;
        const wing2Y = baseY + arrowWidth * perpSin;

        // Rótulo ao lado da seta (perpendicular), para não exigir margem extra:
        // acima das setas horizontais (ASC/DSC), ao lado das verticais (MC/IC).
        let perp = angle + Math.PI / 2;
        if (-Math.sin(perp) > 0.01) perp += Math.PI; // prefere o lado de cima
        const labelFont = innerRadius * 0.09;
        const sideOffset = arrowWidth + 4 + labelFont * (0.45 + 0.75 * Math.abs(Math.sin(angle)));
        const radial = outerRadius + 2 + arrowLen * 0.55;
        const labelX = cx + radial * cosA + sideOffset * Math.cos(perp);
        const labelY = cy - radial * sinA - sideOffset * Math.sin(perp);

        return (
          <g key={label}>
            {/* Emphasis line through the zodiac ring for cardinal points */}
            <line
              x1={lineInner} y1={lineInnerY} x2={lineOuter} y2={lineOuterY}
              style={{ stroke: color }} strokeWidth={1} strokeOpacity={0.5}
            />
            {/* Arrow triangle pointing inward */}
            <polygon
              points={`${tipX},${tipY} ${wing1X},${wing1Y} ${wing2X},${wing2Y}`}
              style={{ fill: color }}
            />
            {/* Label */}
            <text
              x={labelX}
              y={labelY}
              textAnchor="middle"
              dominantBaseline="central"
              style={{ fill: color }}
              fontSize={labelFont}
              fontWeight="bold"
            >
              {label}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export default HouseGrid;
