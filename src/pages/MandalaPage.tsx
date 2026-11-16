import React, { useEffect, useMemo, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import AppHeader from '../components/AppHeader';
import BirthDataForm from '../components/BirthDataForm';
import ChartPanel from '../components/ChartPanel';
import PlanetList from '../components/PlanetList';
import SkyStatus from '../components/SkyStatus';
import ZodiacToggle from '../components/ZodiacToggle';
import { calculateChart } from '../services/astroCalculator';
import { getCurrentTattwa } from '../utils/tattwa';
import { getPlanetaryDay } from '../utils/planetary';
import { useDayTheme } from '../theme/DayTheme';
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
  const { setReference } = useDayTheme();

  // A paleta do app segue o dia planetário da data/local do mapa
  useEffect(() => setReference(date, location), [date, location, setReference]);

  const chartData = useMemo(() => calculateChart(date, location, zodiacSystem), [date, location, zodiacSystem]);
  const tattwa = useMemo(() => getCurrentTattwa(date, location), [date, location]);
  const planetaryDay = useMemo(() => getPlanetaryDay(date, location), [date, location]);

  return (
    <IonPage>
      <AppHeader title="Astrosattwa" end={<ZodiacToggle value={zodiacSystem} onChange={setZodiacSystem} />} />
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
          <SkyStatus tattwa={tattwa} moonPhase={chartData.moonPhase} planetaryDay={planetaryDay} />
        </div>

        <ChartPanel chart={chartData} date={date} planetaryDay={planetaryDay} storageKey="as.chartView.mapa" />

        <div className="app-section">
          <div className="section-title">Posições</div>
          <PlanetList chart={chartData} />
        </div>

        <div className="app-bottom-spacer" />
      </IonContent>
    </IonPage>
  );
};

export default MandalaPage;
