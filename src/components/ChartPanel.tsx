import React, { useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { apertureOutline, diamondOutline, documentTextOutline, gridOutline, listOutline, timeOutline } from 'ionicons/icons';
import type { ChartData, GeoLocation } from '../types/astro';
import type { PlanetaryDay } from '../utils/planetary';
import { usePersistentState } from '../utils/usePersistentState';
import MandalaChart from './MandalaChart';
import VedicChart from './VedicChart';
import AspectGrid from './AspectGrid';
import PlanetaryHoursChart from './PlanetaryHoursChart';
import SkyHistoryModal from './SkyHistoryModal';
import PdfExportModal from './PdfExportModal';
import type { ReportSection } from '../services/pdf/pdfSections';
import './ChartPanel.css';

interface ChartPanelProps {
  chart: ChartData;
  date: Date;
  planetaryDay: PlanetaryDay | null;
  location: GeoLocation;
  /** Chave para lembrar o gráfico escolhido (cada tela pode ter o seu). */
  storageKey: string;
}

/**
 * Novos gráficos: acrescente uma entrada aqui. O seletor (ícones no canto
 * superior direito, área vazia em todos os gráficos) cresce sozinho.
 */
const VIEWS = [
  { id: 'mandala', label: 'Mandala', icon: apertureOutline },
  { id: 'vedic',   label: 'Mapa védico', icon: diamondOutline },
  { id: 'aspects', label: 'Aspectos', icon: gridOutline },
  { id: 'hours',   label: 'Horas planetárias', icon: timeOutline },
] as const;

type ViewId = typeof VIEWS[number]['id'];

const ChartPanel: React.FC<ChartPanelProps> = ({ chart, date, planetaryDay, location, storageKey }) => {
  const [view, setView] = usePersistentState<ViewId>(storageKey, 'mandala');
  const active = VIEWS.some(v => v.id === view) ? view : 'mandala';
  const [exporting, setExporting] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  // O PDF é montado a partir dos dados (não da tela); o módulo só carrega ao tocar
  const generate = async (name: string, sections: ReportSection[]) => {
    if (exporting) return;
    setExporting(true);
    try {
      const { exportReport } = await import('../services/pdf/pdfReport');
      await exportReport({ chart, date, location, planetaryDay, name: name || undefined, sections });
    } catch (err) {
      console.error('[PDF]', err);
    } finally {
      setExporting(false);
    }
  };

  // Nome opcional para a capa e seções do PDF (lembra a última escolha)
  const handleExport = () => {
    if (!exporting) setExportOpen(true);
  };

  return (
    <div className={`chart-panel chart-panel-${active}`}>
      <div className="chart-rail chart-rail-left">
        <button
          aria-label="Gerar PDF"
          title="Gerar PDF"
          onClick={handleExport}
          disabled={exporting}
          aria-busy={exporting}
        >
          {exporting ? <IonSpinner name="crescent" /> : <IonIcon icon={documentTextOutline} />}
        </button>
        <button
          aria-label="Mudanças de hoje"
          title="Mudanças de hoje"
          onClick={() => setHistoryOpen(true)}
        >
          <IonIcon icon={listOutline} />
        </button>
      </div>

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
        {active === 'vedic' && <VedicChart data={chart} />}
        {active === 'aspects' && <AspectGrid planets={chart.planets} />}
        {active === 'hours' && <PlanetaryHoursChart day={planetaryDay} date={date} />}
      </div>

      <SkyHistoryModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
      <PdfExportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        onGenerate={(name, sections) => void generate(name, sections)}
      />
    </div>
  );
};

export default ChartPanel;
