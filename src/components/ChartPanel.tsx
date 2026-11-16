import React from 'react';
import { IonIcon } from '@ionic/react';
import { apertureOutline, gridOutline, timeOutline } from 'ionicons/icons';
import type { ChartData } from '../types/astro';
import type { PlanetaryDay } from '../utils/planetary';
import { usePersistentState } from '../utils/usePersistentState';
import MandalaChart from './MandalaChart';
import AspectGrid from './AspectGrid';
import PlanetaryHoursChart from './PlanetaryHoursChart';
import './ChartPanel.css';

interface ChartPanelProps {
  chart: ChartData;
  date: Date;
  planetaryDay: PlanetaryDay | null;
  /** Chave para lembrar o gráfico escolhido (cada tela pode ter o seu). */
  storageKey: string;
}

/**
 * Novos gráficos: acrescente uma entrada aqui. O seletor (ícones no canto
 * superior direito, área vazia em todos os gráficos) cresce sozinho.
 */
const VIEWS = [
  { id: 'mandala', label: 'Mandala', icon: apertureOutline },
  { id: 'aspects', label: 'Aspectos', icon: gridOutline },
  { id: 'hours',   label: 'Horas planetárias', icon: timeOutline },
] as const;

type ViewId = typeof VIEWS[number]['id'];

const ChartPanel: React.FC<ChartPanelProps> = ({ chart, date, planetaryDay, storageKey }) => {
  const [view, setView] = usePersistentState<ViewId>(storageKey, 'mandala');
  const active = VIEWS.some(v => v.id === view) ? view : 'mandala';

  return (
    <div className="chart-panel">
      <div className="chart-rail" role="tablist" aria-label="Gráfico">
        {VIEWS.map(v => (
          <button
            key={v.id}
            role="tab"
            aria-selected={active === v.id}
            aria-label={v.label}
            title={v.label}
            className={active === v.id ? 'active' : ''}
            onClick={() => setView(v.id)}
          >
            <IonIcon icon={v.icon} />
          </button>
        ))}
      </div>

      <div className="chart-view">
        {active === 'mandala' && <MandalaChart data={chart} />}
        {active === 'aspects' && <AspectGrid planets={chart.planets} />}
        {active === 'hours' && <PlanetaryHoursChart day={planetaryDay} date={date} />}
      </div>
    </div>
  );
};

export default ChartPanel;
