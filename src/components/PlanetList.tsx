import React from 'react';
import { IonList, IonItem, IonLabel } from '@ionic/react';
import type { PlanetPosition } from '../types/astro';

interface PlanetListProps {
  planets: PlanetPosition[];
}

const PLANET_COLORS: Record<string, string> = {
  Sun:     '#f1c40f',
  Moon:    '#ecf0f1',
  Mercury: '#bdc3c7',
  Venus:   '#e91e8c',
  Mars:    '#e74c3c',
  Jupiter: '#e67e22',
  Saturn:  '#95a5a6',
  Uranus:  '#1abc9c',
  Neptune: '#3498db',
  Pluto:   '#9b59b6',
};

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
            <h3 style={{ color: PLANET_COLORS[planet.name] || '#fff' }}>{planet.name}</h3>
            <p style={{ color: 'rgba(255,255,255,0.7)' }}>
              {planet.signDegree}&deg; {planet.signMinute}&apos; {planet.zodiacSign}
            </p>
          </IonLabel>
        </IonItem>
      ))}
    </IonList>
  );
};

export default PlanetList;
