import React, { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronDown } from 'ionicons/icons';
import type { ChartData, PlanetPosition, DignityType } from '../types/astro';
import { PLANET_COLORS, PLANET_GLYPHS, SIGN_RULERS, ZODIAC_SIGNS, getZodiacSign } from '../utils/zodiac';
import { PLANET_NAMES_PT, SIGN_NAMES_PT } from '../utils/astroLabels';
import './PlanetList.css';

interface PlanetListProps {
  chart: ChartData;
}

const DIGNITY_INFO: Record<string, { label: string; short: string; color: string }> = {
  domicilio: { label: 'Domicílio', short: 'Dom', color: '#2ecc71' },
  exaltacao: { label: 'Exaltação', short: 'Exa', color: '#f1c40f' },
  queda:     { label: 'Queda',     short: 'Que', color: '#e74c3c' },
  exilio:    { label: 'Exílio',    short: 'Exí', color: '#95a5a6' },
};

const ORDINAL = ['', '1º', '2º', '3º'];

function signInfo(name: string) {
  return ZODIAC_SIGNS.find(s => s.name === name);
}

function Degree({ deg, min }: { deg: number; min: number }) {
  return <>{deg}°{String(min).padStart(2, '0')}'</>;
}

function BodyRef({ name }: { name: string }) {
  return (
    <span style={{ color: PLANET_COLORS[name] || '#aaa' }}>
      {PLANET_GLYPHS[name]} {PLANET_NAMES_PT[name] || name}
    </span>
  );
}

function DignityTag({ dignity }: { dignity: DignityType | undefined }) {
  if (!dignity) return <span className="pl-dignity" />;
  const info = DIGNITY_INFO[dignity];
  return (
    <span
      className="pl-dignity pl-dignity-on"
      title={info.label}
      style={{ color: info.color, background: `${info.color}1f`, borderColor: `${info.color}55` }}
    >
      {info.short}
    </span>
  );
}

function PlanetDetails({ planet }: { planet: PlanetPosition }) {
  const signRuler = SIGN_RULERS[planet.zodiacSign];
  const dignities = planet.rulerSignDignities ?? [];
  return (
    <div className="pl-details">
      {signRuler && (
        <div className="pl-detail">
          <span className="pl-detail-key">Regente do signo</span>
          <BodyRef name={signRuler} />
        </div>
      )}
      {planet.decanate && (
        <div className="pl-detail">
          <span className="pl-detail-key">Decanato</span>
          <span>{ORDINAL[planet.decanate]}</span>
        </div>
      )}
      {planet.dignity && (
        <div className="pl-detail">
          <span className="pl-detail-key">Dignidade</span>
          <span style={{ color: DIGNITY_INFO[planet.dignity].color }}>{DIGNITY_INFO[planet.dignity].label}</span>
        </div>
      )}
      {planet.house && planet.houseRuler && (
        <div className="pl-detail">
          <span className="pl-detail-key">Regente da casa {planet.house}</span>
          <BodyRef name={planet.houseRuler} />
        </div>
      )}
      {dignities.length > 0 && (
        <div className="pl-detail">
          <span className="pl-detail-key">Nos signos do regente</span>
          <span>
            {dignities.map(({ sign, dignity }, i) => (
              <React.Fragment key={sign}>
                {i > 0 && ', '}
                {SIGN_NAMES_PT[sign] || sign}
                {dignity && (
                  <span style={{ color: DIGNITY_INFO[dignity].color }}> ({DIGNITY_INFO[dignity].label})</span>
                )}
              </React.Fragment>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

function PlanetRow({ planet, open, onToggle }: { planet: PlanetPosition; open: boolean; onToggle: () => void }) {
  const sign = signInfo(planet.zodiacSign);
  const color = PLANET_COLORS[planet.name] || '#fff';
  return (
    <div className={`pl-item ${open ? 'open' : ''}`}>
      <button className="pl-row" onClick={onToggle} aria-expanded={open}>
        <span className="pl-glyph" style={{ color }}>{planet.glyph}</span>
        <span className="pl-name">
          <span style={{ color }}>{PLANET_NAMES_PT[planet.name] || planet.name}</span>
          {planet.isRetrograde && <span className="pl-retro" title="Retrógrado">℞</span>}
        </span>
        <span className="pl-pos">
          <span className="pl-sign-glyph" style={{ color: sign?.color }} title={SIGN_NAMES_PT[planet.zodiacSign]}>
            {sign?.glyph}
          </span>
          <span className="pl-sign-name">{SIGN_NAMES_PT[planet.zodiacSign]}</span>
          <span className="pl-deg"><Degree deg={planet.signDegree} min={planet.signMinute} /></span>
        </span>
        <span className="pl-house">{planet.house ? `C${planet.house}` : ''}</span>
        <DignityTag dignity={planet.dignity} />
        <IonIcon icon={chevronDown} className="pl-chevron" />
      </button>
      {open && <PlanetDetails planet={planet} />}
    </div>
  );
}

const ANGLES = [
  { key: 'ascendant', label: 'AC' },
  { key: 'mc',        label: 'MC' },
  { key: 'descendant', label: 'DC' },
  { key: 'ic',        label: 'IC' },
] as const;

const PlanetList: React.FC<PlanetListProps> = ({ chart }) => {
  const [openName, setOpenName] = useState<string | null>(null);
  const toggle = (name: string) => setOpenName(prev => (prev === name ? null : name));

  const planets = chart.planets.filter(p => !p.isVirtual);
  const points = chart.planets.filter(p => p.isVirtual);

  return (
    <div className="planet-list">
      <div className="pl-angles">
        {ANGLES.map(a => {
          const info = getZodiacSign(chart[a.key]);
          return (
            <div key={a.key} className="pl-angle">
              <span className="pl-angle-label">{a.label}</span>
              <span className="pl-angle-value">
                <span style={{ color: info.sign.color }}>{info.sign.glyph}</span>{' '}
                <Degree deg={info.degree} min={info.minute} />
              </span>
            </div>
          );
        })}
      </div>

      <div className="pl-group">
        {planets.map(p => (
          <PlanetRow key={p.name} planet={p} open={openName === p.name} onToggle={() => toggle(p.name)} />
        ))}
      </div>

      {points.length > 0 && (
        <>
          <div className="pl-subtitle">Pontos</div>
          <div className="pl-group">
            {points.map(p => (
              <PlanetRow key={p.name} planet={p} open={openName === p.name} onToggle={() => toggle(p.name)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PlanetList;
