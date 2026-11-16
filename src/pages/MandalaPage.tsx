import React, { useState, useMemo } from 'react';
import { IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import BirthDataForm from '../components/BirthDataForm';
import MandalaChart from '../components/MandalaChart';
import PlanetList from '../components/PlanetList';
import AspectGrid from '../components/AspectGrid';
import SkyStatus from '../components/SkyStatus';
import ZodiacToggle from '../components/ZodiacToggle';
import { calculateChart } from '../services/astroCalculator';
import { getCurrentTattwa } from '../utils/tattwa';
import type { GeoLocation, ZodiacSystem } from '../types/astro';

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
  const tattwa = useMemo(() => getCurrentTattwa(date, location), [date, location]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle className="app-title">Astrosattwa</IonTitle>
          <IonButtons slot="end">
            <ZodiacToggle value={zodiacSystem} onChange={setZodiacSystem} />
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="app-content">
        <div className="app-section">
          <BirthDataForm
            date={date}
            location={location}
            onDateChange={setDate}
            onLocationChange={setLocation}
          />
        </div>

        <div className="app-section">
          <SkyStatus tattwa={tattwa} moonPhase={chartData.moonPhase} />
        </div>

        <MandalaChart data={chartData} />

        <div className="app-section">
          <div className="section-title">Posições</div>
          <PlanetList chart={chartData} />
        </div>

        <div className="app-section">
          <div className="section-title">Aspectos</div>
          <AspectGrid planets={chartData.planets} />
        </div>

        <div className="app-bottom-spacer" />
      </IonContent>
    </IonPage>
  );
};

export default MandalaPage;
