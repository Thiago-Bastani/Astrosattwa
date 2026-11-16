import React from 'react';
import type { MoonPhase } from '../types/astro';
import type { TattwaInfo } from '../utils/tattwa';
import { TattwaShape } from './TattwaShape';
import './SkyStatus.css';

interface SkyStatusProps {
  tattwa: TattwaInfo | null;
  moonPhase: MoonPhase;
}

/** Três cartões compactos lado a lado: Tattwa · Lua · Nakshatra */
const SkyStatus: React.FC<SkyStatusProps> = ({ tattwa, moonPhase }) => (
  <div className="sky-status">
    <div className="sky-tile">
      <span className="sky-label">Tattwa</span>
      {tattwa ? (
        <>
          <span className="sky-value">
            <span className="sky-tattwa-shape" style={{ '--glow': tattwa.color } as React.CSSProperties}>
              <TattwaShape shape={tattwa.shape} color={tattwa.color} size={18} />
            </span>
            <span>{tattwa.name}</span>
          </span>
          <span className="sky-sub">
            {tattwa.elementPt} · {Math.ceil(tattwa.minutesRemaining)} min
          </span>
          {tattwa.subTattwa && (
            <span className="sky-sub">sub: {tattwa.subTattwa.name}</span>
          )}
        </>
      ) : (
        <span className="sky-sub">—</span>
      )}
    </div>

    <div className="sky-tile">
      <span className="sky-label">Lua</span>
      <span className="sky-value">
        <span className="sky-emoji">{moonPhase.emoji}</span>
        <span>{moonPhase.name}</span>
      </span>
      <span className="sky-sub">{moonPhase.illumination}% iluminada</span>
    </div>

    <div className="sky-tile">
      <span className="sky-label">Nakshatra</span>
      <span className="sky-value">{moonPhase.lunarMansion.name}</span>
      <span className="sky-sub">{moonPhase.lunarMansion.number}ª mansão</span>
    </div>
  </div>
);

export default SkyStatus;
