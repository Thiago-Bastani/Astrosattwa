import React from 'react';
import { ZODIAC_SIGNS } from '../utils/zodiac';

interface ZodiacRingProps {
  cx: number;
  cy: number;
  outerRadius: number;
  innerRadius: number;
  ascendant: number;
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = {
    x: cx + r * Math.cos(startAngle),
    y: cy - r * Math.sin(startAngle),
  };
  const end = {
    x: cx + r * Math.cos(endAngle),
    y: cy - r * Math.sin(endAngle),
  };
  const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

const ZodiacRing: React.FC<ZodiacRingProps> = ({ cx, cy, outerRadius, innerRadius, ascendant }) => {
  return (
    <g>
      {ZODIAC_SIGNS.map((sign, i) => {
        const startDeg = 180 + ascendant - i * 30;
        const endDeg = startDeg - 30;
        const startRad = (startDeg * Math.PI) / 180;
        const endRad = (endDeg * Math.PI) / 180;

        const outerArc = describeArc(cx, cy, outerRadius, startRad, endRad);
        const innerArc = describeArc(cx, cy, innerRadius, endRad, startRad);

        const path = `${outerArc} L ${cx + innerRadius * Math.cos(endRad)} ${cy - innerRadius * Math.sin(endRad)} ${innerArc.replace('M', '')} Z`;

        const midDeg = startDeg - 15;
        const midRad = (midDeg * Math.PI) / 180;
        const glyphR = (outerRadius + innerRadius) / 2;
        const glyphX = cx + glyphR * Math.cos(midRad);
        const glyphY = cy - glyphR * Math.sin(midRad);

        return (
          <g key={sign.name}>
            <path d={path} fill={sign.color} fillOpacity={0.2} stroke={sign.color} strokeWidth={0.5} />
            <text
              x={glyphX}
              y={glyphY}
              textAnchor="middle"
              dominantBaseline="central"
              fill={sign.color}
              fontSize={outerRadius * 0.1}
              fontWeight="bold"
            >
              {sign.glyph}
            </text>
          </g>
        );
      })}
    </g>
  );
};

export default ZodiacRing;
