import React from 'react';
import type { TattwaInfo } from '../utils/tattwa';
import './TattwaIndicator.css';

interface TattwaIndicatorProps {
  tattwa: TattwaInfo | null;
}

function TattwaShape({ shape, color, size = 28 }: { shape: string; color: string; size?: number }) {
  const half = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="tattwa-shape-svg">
      {/* Akasha: meia-lua virada para a esquerda (arco direto) */}
      {shape === 'crescent-left' && (
        <path
          d={`M ${half} ${half - 10} A 10 10 0 0 1 ${half} ${half + 10} A 4 10 0 0 0 ${half} ${half - 10}`}
          fill={color}
        />
      )}
      {/* Vayu: pentágono */}
      {shape === 'pentagon' && (() => {
        const r = half * 0.8;
        const pts = Array.from({ length: 5 }, (_, i) => {
          const angle = (2 * Math.PI / 5) * i - Math.PI / 2;
          return `${half + r * Math.cos(angle)},${half + r * Math.sin(angle)}`;
        }).join(' ');
        return <polygon points={pts} fill={color} />;
      })()}
      {/* Tejas: triângulo */}
      {shape === 'triangle' && (
        <polygon
          points={`${half},${size * 0.1} ${size * 0.9},${size * 0.85} ${size * 0.1},${size * 0.85}`}
          fill={color}
        />
      )}
      {/* Prithvi: quadrado */}
      {shape === 'square' && (
        <rect x={size * 0.15} y={size * 0.15} width={size * 0.7} height={size * 0.7} fill={color} />
      )}
      {/* Apas: meia-lua virada para cima (arco direto) */}
      {shape === 'crescent-up' && (
        <path
          d={`M ${half - 10} ${half} A 10 10 0 0 0 ${half + 10} ${half} A 10 6 0 0 1 ${half - 10} ${half}`}
          fill={color}
        />
      )}
    </svg>
  );
}

const TattwaIndicator: React.FC<TattwaIndicatorProps> = ({ tattwa }) => {
  if (!tattwa) return null;

  return (
    <div className="tattwa-indicator">
      <div className="tattwa-glow" style={{ '--tattwa-color': tattwa.color } as React.CSSProperties}>
        <TattwaShape shape={tattwa.shape} color={tattwa.color} size={30} />
      </div>
      <div className="tattwa-info">
        <span className="tattwa-name" style={{ color: tattwa.color }}>
          {tattwa.namePt}
        </span>
        <span className="tattwa-remaining">
          {Math.ceil(tattwa.minutesRemaining)} min
        </span>
      </div>
    </div>
  );
};

export default TattwaIndicator;
