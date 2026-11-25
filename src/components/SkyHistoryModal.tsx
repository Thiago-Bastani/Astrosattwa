import React, { useMemo } from 'react';
import { IonContent, IonModal } from '@ionic/react';
import { dayEvents, type SkyEvent, type SkyEventKind } from '../services/skyEvents';
import './SkyHistoryModal.css';

interface SkyHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const KIND_LABELS: Record<SkyEventKind, string> = {
  sign: 'Signo',
  decan: 'Decanato',
  phase: 'Fase',
  nakshatra: 'Nakshatra',
  manzil: 'Manzil',
};

const hhmm = (t: number) => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

const EventRow: React.FC<{ ev: SkyEvent; upcoming?: boolean }> = ({ ev, upcoming }) => (
  <li className={`sky-ev${upcoming ? ' sky-ev-upcoming' : ''}`}>
    <span className="sky-ev-time">{hhmm(ev.at)}</span>
    <span className="sky-ev-glyph astro-glyph">{ev.glyph}</span>
    <span className="sky-ev-body">
      <span className="sky-ev-kind">{KIND_LABELS[ev.kind]}</span>
      <span className="sky-ev-text">{ev.text}</span>
    </span>
  </li>
);

/** Mudanças do céu de hoje (sempre védico: sideral Lahiri). */
const SkyHistoryModal: React.FC<SkyHistoryModalProps> = ({ isOpen, onClose }) => {
  // Recalcula a cada abertura (o dia e o "agora" mudam)
  const { past, upcoming, today } = useMemo(() => {
    const now = new Date();
    const events = isOpen ? dayEvents(now) : [];
    return {
      past: events.filter(e => e.at <= now.getTime()).reverse(),
      upcoming: events.filter(e => e.at > now.getTime()),
      today: now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
    };
  }, [isOpen]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="sky-history-modal"
      breakpoints={[0, 0.75, 1]} initialBreakpoint={0.75}>
      <IonContent className="sky-history-content">
        <div className="sky-history">
          <div className="sky-history-head">
            <div>
              <h2>Mudanças de hoje</h2>
              <div className="sky-history-date">{today}</div>
            </div>
            <button className="sky-history-close" onClick={onClose}>Fechar</button>
          </div>

          <div className="sky-history-vedic">
            <strong>Védico · sideral (Lahiri)</strong>
            <span>
              Este histórico e as notificações usam sempre o zodíaco sideral, mesmo com o app no tropical.
              Planetas: os nove grahas (Rahu e Ketu juntos).
            </span>
          </div>

          {past.length === 0 && upcoming.length === 0 && (
            <p className="sky-history-empty">Nenhuma mudança de signo, decanato, fase, nakshatra ou manzil hoje.</p>
          )}

          {past.length > 0 && (
            <>
              <h3>Já aconteceu</h3>
              <ul className="sky-ev-list">
                {past.map(ev => <EventRow key={ev.key} ev={ev} />)}
              </ul>
            </>
          )}
          {past.length === 0 && upcoming.length > 0 && (
            <p className="sky-history-empty">Nada mudou ainda hoje.</p>
          )}

          {upcoming.length > 0 && (
            <>
              <h3>Ainda hoje</h3>
              <ul className="sky-ev-list">
                {upcoming.map(ev => <EventRow key={ev.key} ev={ev} upcoming />)}
              </ul>
            </>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
};

export default SkyHistoryModal;
