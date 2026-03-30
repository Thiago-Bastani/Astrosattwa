import React from 'react';
import { IonList, IonItem, IonLabel } from '@ionic/react';
import type { PlanetPosition, DignityType } from '../types/astro';
import { PLANET_COLORS } from '../utils/zodiac';

interface PlanetListProps {
  planets: PlanetPosition[];
}

const DIGNITY_LABELS: Record<string, { label: string; color: string }> = {
  domicilio: { label: 'Domicílio', color: '#2ecc71' },
  exaltacao: { label: 'Exaltação', color: '#f1c40f' },
  queda:     { label: 'Queda',     color: '#e74c3c' },
  exilio:    { label: 'Exílio',    color: '#95a5a6' },
};

const PLANET_NAMES_PT: Record<string, string> = {
  Sun:       'Sol',
  Moon:      'Lua',
  Mercury:   'Mercúrio',
  Venus:     'Vênus',
  Mars:      'Marte',
  Jupiter:   'Júpiter',
  Saturn:    'Saturno',
  Uranus:    'Urano',
  Neptune:   'Netuno',
  Pluto:     'Plutão',
  Lilith:    'Lilith',
  NorthNode: 'Nodo Norte',
  SouthNode: 'Nodo Sul',
  Vertex:    'Vertex',
};

function DignityBadge({ dignity }: { dignity: DignityType }) {
  if (!dignity) return null;
  const info = DIGNITY_LABELS[dignity];
  if (!info) return null;
  return (
    <span style={{
      display: 'inline-block',
      fontSize: '0.65rem',
      padding: '1px 6px',
      borderRadius: 4,
      background: `${info.color}22`,
      color: info.color,
      border: `1px solid ${info.color}44`,
      marginLeft: 4,
    }}>
      {info.label}
    </span>
  );
}

const PlanetList: React.FC<PlanetListProps> = ({ planets }) => {
  return (
    <IonList lines="none" style={{ background: 'transparent' }}>
      {planets.map((planet) => (
        <IonItem key={planet.name} style={{ '--background': 'transparent' }}>
          <span
            slot="start"
            style={{
              fontSize: '1.4rem',
              color: PLANET_COLORS[planet.name] || '#fff',
              width: '2rem',
              textAlign: 'center',
            }}
          >
            {planet.glyph}
          </span>
          <IonLabel>
            <h3 style={{ color: PLANET_COLORS[planet.name] || '#fff', display: 'flex', alignItems: 'center', gap: 6 }}>
              {PLANET_NAMES_PT[planet.name] || planet.name}
              {planet.isRetrograde && (
                <span style={{ color: '#e74c3c', fontSize: '0.85rem', fontWeight: 'bold' }} title="Retrógrado">℞</span>
              )}
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <span>{planet.signDegree}&deg;{planet.signMinute}&apos; {planet.zodiacSign}</span>
              {planet.decanate && (
                <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)' }}>
                  {planet.decanate}&deg; Dec
                </span>
              )}
              <DignityBadge dignity={planet.dignity ?? null} />
            </p>
          </IonLabel>
        </IonItem>
      ))}
    </IonList>
  );
};

export default PlanetList;
