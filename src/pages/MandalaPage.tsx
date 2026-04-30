import React, { useState, useMemo } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import BirthDataForm from '../components/BirthDataForm';
import MandalaChart from '../components/MandalaChart';
import PlanetList from '../components/PlanetList';
import AspectGrid from '../components/AspectGrid';
import { calculateChart } from '../services/astroCalculator';
import type { GeoLocation, ZodiacSystem } from '../types/astro';
import './MandalaPage.css';

const BELO_HORIZONTE: GeoLocation = {
  lat: -19.9167,
  lon: -43.9345,
  name: 'Belo Horizonte, Brasil',
};

const MandalaPage: React.FC = () => {
  const [date, setDate] = useState<Date>(new Date());
  const [location, setLocation] = useState<GeoLocation>(BELO_HORIZONTE);
  const [zodiacSystem, setZodiacSystem] = useState<ZodiacSystem>('sidereal');

  const chartData = useMemo(() => calculateChart(date, location, zodiacSystem), [date, location, zodiacSystem]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#000000', '--color': '#c9a84c' }}>
          <IonTitle className="mandala-title">Astrosattwa</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="mandala-content">
        <BirthDataForm
          date={date}
          location={location}
          onDateChange={setDate}
          onLocationChange={setLocation}
        />
        <MandalaChart data={chartData} zodiacSystem={zodiacSystem} onZodiacSystemChange={setZodiacSystem} />
        <PlanetList planets={chartData.planets} />
        <AspectGrid planets={chartData.planets} />
        <div style={{ height: 80 }} />
      </IonContent>
    </IonPage>
  );
};

export default MandalaPage;
