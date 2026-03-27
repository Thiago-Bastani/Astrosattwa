import React from 'react';
import { ZODIAC_SIGNS } from '../utils/zodiac';
import { ZODIAC_SVG_PATHS } from '../utils/zodiacSvgPaths';

interface ZodiacRingProps {
  cx: number;
  cy: number;
  outerRadius: number;
  innerRadius: number;
  ascendant: number;
}

const DEG = Math.PI / 180;

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
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function toSvgAngle(longitude: number, ascendant: number): number {
  return (180 + longitude - ascendant) * DEG;
}

const ZodiacRing: React.FC<ZodiacRingProps> = ({ cx, cy, outerRadius, innerRadius, ascendant }) => {
  const glyphSize = (outerRadius - innerRadius) * 0.55;

  return (
    <g>
      {ZODIAC_SIGNS.map((sign, i) => {
        // Each sign spans 30 degrees on the ecliptic: from i*30 to (i+1)*30
        const signStartLon = i * 30;
        const signEndLon = (i + 1) * 30;

        const startRad = toSvgAngle(signStartLon, ascendant);
        const endRad = toSvgAngle(signEndLon, ascendant);

        const outerArc = describeArc(cx, cy, outerRadius, startRad, endRad);
        const innerArc = describeArc(cx, cy, innerRadius, endRad, startRad);

        const path = `${outerArc} L ${cx + innerRadius * Math.cos(endRad)} ${cy - innerRadius * Math.sin(endRad)} ${innerArc.replace('M', '')} Z`;

        // Glyph at midpoint of the sign (15 degrees into the sign)
        const midLon = signStartLon + 15;
        const midRad = toSvgAngle(midLon, ascendant);
        const glyphR = (outerRadius + innerRadius) / 2;
        const glyphX = cx + glyphR * Math.cos(midRad);
        const glyphY = cy - glyphR * Math.sin(midRad);

        const svgPath = ZODIAC_SVG_PATHS[sign.name];

        return (
          <g key={sign.name}>
            <path d={path} fill={sign.color} fillOpacity={0.15} stroke={sign.color} strokeWidth={0.5} />
            {/* SVG glyph rendered as path */}
            {svgPath && (
              <g transform={`translate(${glyphX - glyphSize / 2}, ${glyphY - glyphSize / 2}) scale(${glyphSize / 24})`}>
                <path
                  d={svgPath}
                  fill="none"
                  stroke={sign.color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
};

export default ZodiacRing;
