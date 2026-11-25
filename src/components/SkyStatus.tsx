import React from 'react';
import type { MoonPhase } from '../types/astro';
import type { TattwaInfo } from '../utils/tattwa';
import type { PlanetaryDay } from '../utils/planetary';
import type { MansionSystem } from '../utils/lunarMansions';
import { PLANET_COLORS, PLANET_GLYPHS } from '../utils/zodiac';
import { PLANET_NAMES_PT } from '../utils/astroLabels';
import { usePersistentState } from '../utils/usePersistentState';
import { TattwaShape } from './TattwaShape';
import NakshatraSymbol from './NakshatraSymbol';
import './SkyStatus.css';

interface SkyStatusProps {
  tattwa: TattwaInfo | null;
  moonPhase: MoonPhase;
  planetaryDay: PlanetaryDay | null;
}

const hhmm = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

interface TileProps {
  label: React.ReactNode;
  meta?: React.ReactNode;
  icon?: React.ReactNode;
  value: React.ReactNode;
  extra?: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}

/** Cartão de duas linhas: [rótulo · meta] / [ícone valor extra] */
function Tile({ label, meta, icon, value, extra, onClick, ariaLabel }: TileProps) {
  const body = (
    <>
      <span className="sky-head">
        <span className="sky-label">{label}</span>
        {meta && <span className="sky-meta">{meta}</span>}
      </span>
      <span className="sky-value">
        {icon && <span className="sky-icon">{icon}</span>}
        <span className="sky-text">
          {value}
          {extra && <span className="sky-extra"> {extra}</span>}
        </span>
      </span>
    </>
  );
  return onClick ? (
    <button className="sky-tile sky-tile-toggle" onClick={onClick} aria-label={ariaLabel}>{body}</button>
  ) : (
    <div className="sky-tile">{body}</div>
  );
}

/** Grade 2×2: Tattwa · Lua / Mansão · Hora planetária */
const SkyStatus: React.FC<SkyStatusProps> = ({ tattwa, moonPhase, planetaryDay }) => {
  const [mansionSystem, setMansionSystem] = usePersistentState<MansionSystem>('as.mansionSystem', 'vedic');
  const isVedic = mansionSystem === 'vedic';
  const mansion = isVedic ? moonPhase.lunarMansion : moonPhase.arabicMansion;
  const hour = planetaryDay?.current ?? null;

  return (
    <div className="sky-status">
      {tattwa ? (
        <Tile
          label="Tattwa"
          meta={`${Math.ceil(tattwa.minutesRemaining)} min`}
          icon={
            <span className="sky-tattwa-shape" style={{ '--glow': tattwa.color } as React.CSSProperties}>
              <TattwaShape shape={tattwa.shape} color={tattwa.color} size={16} />
            </span>
          }
          value={tattwa.name}
          extra={`${tattwa.elementPt}${tattwa.subTattwa ? ` · sub ${tattwa.subTattwa.name}` : ''}`}
        />
      ) : (
        <Tile label="Tattwa" value="—" />
      )}

      <Tile
        label="Lua"
        meta={`${moonPhase.illumination}%`}
        icon={<span className="sky-emoji">{moonPhase.emoji}</span>}
        value={moonPhase.name}
      />

      <Tile
        label={<>{isVedic ? 'Nakshatra' : 'Manzil'} <span className="sky-swap">⇄</span></>}
        meta={`${mansion.number}ª`}
        icon={isVedic ? (
          <span className="sky-nakshatra">
            <NakshatraSymbol index={mansion.number - 1} color="currentColor" bg="transparent" ring="currentColor" size={22} />
          </span>
        ) : undefined}
        value={mansion.name}
        extra={mansion.meaning}
        onClick={() => setMansionSystem(isVedic ? 'arabic' : 'vedic')}
        ariaLabel={`Mansão lunar ${isVedic ? 'védica' : 'árabe'}: ${mansion.name}. Toque para alternar.`}
      />

      {hour && planetaryDay ? (
        <Tile
          label={<>Hora · dia <span className="astro-glyph">{PLANET_GLYPHS[planetaryDay.ruler]}</span></>}
          meta={`até ${hhmm(hour.end)}`}
          icon={
            <span className="sky-planet astro-glyph" style={{ color: PLANET_COLORS[hour.ruler] }}>
              {PLANET_GLYPHS[hour.ruler]}
            </span>
          }
          value={PLANET_NAMES_PT[hour.ruler]}
        />
      ) : (
        <Tile label="Hora" value="—" />
      )}
    </div>
  );
};

export default SkyStatus;
