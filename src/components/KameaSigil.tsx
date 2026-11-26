import React from 'react';
import type { Kamea } from '../utils/ritual/kameas';

interface Props {
  kamea: Kamea;
  /** Casas na ordem do traço. */
  path: { row: number; col: number }[];
  size?: number;
  showNumbers?: boolean;
}

/**
 * Quadrado mágico com o sigilo traçado por cima: círculo no início,
 * barra perpendicular no fim (convenção dos selos traçados no kamea).
 */
const KameaSigil: React.FC<Props> = ({ kamea, path, size = 300, showNumbers = true }) => {
  const n = kamea.order;
  const cell = size / n;
  const center = (i: number) => i * cell + cell / 2;
  const pts = path.map(p => [center(p.col), center(p.row)] as const);
  const stroke = Math.max(2, cell * 0.07);

  let endBar: React.ReactNode = null;
  if (pts.length >= 2) {
    const [x1, y1] = pts[pts.length - 2];
    const [x2, y2] = pts[pts.length - 1];
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    // Perpendicular ao último segmento
    const nx = -(y2 - y1) / len, ny = (x2 - x1) / len;
    const h = cell * 0.22;
    endBar = <line x1={x2 - nx * h} y1={y2 - ny * h} x2={x2 + nx * h} y2={y2 + ny * h} className="ks-line" strokeWidth={stroke} />;
  }

  return (
    <svg viewBox={`-2 -2 ${size + 4} ${size + 4}`} className="kamea-sigil" role="img" aria-label="Sigilo traçado no quadrado">
      {kamea.grid.map((row, r) => row.map((v, c) => (
        <g key={`${r}-${c}`}>
          <rect x={c * cell} y={r * cell} width={cell} height={cell} className="ks-cell" />
          {showNumbers && (
            <text x={center(c)} y={center(r)} className="ks-num" fontSize={cell * (n > 7 ? 0.36 : 0.32)}
              dominantBaseline="central" textAnchor="middle">{v}</text>
          )}
        </g>
      )))}
      {pts.length >= 2 && (
        <polyline points={pts.map(p => p.join(',')).join(' ')} className="ks-line" strokeWidth={stroke} />
      )}
      {pts.length >= 1 && (
        <circle cx={pts[0][0]} cy={pts[0][1]} r={cell * 0.16} className="ks-start" strokeWidth={stroke} />
      )}
      {endBar}
    </svg>
  );
};

export default KameaSigil;
