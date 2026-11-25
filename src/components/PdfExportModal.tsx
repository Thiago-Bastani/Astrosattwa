import React, { useEffect, useState } from 'react';
import { IonModal } from '@ionic/react';
import {
  KINDS, TRADITIONS, combineSections,
  type ReadingKind, type ReportSection, type Tradition,
} from '../services/pdf/pdfSections';
import './PdfExportModal.css';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (name: string, sections: ReportSection[]) => void;
}

const NAME_KEY = 'astrosattwa.pdfName';
const CHOICE_KEY = 'astrosattwa.pdfChoice';

interface Choice { traditions: Tradition[]; kinds: ReadingKind[] }

const DEFAULT_CHOICE: Choice = { traditions: ['vedic', 'western'], kinds: ['natal'] };

function loadChoice(): Choice {
  try {
    const saved = JSON.parse(localStorage.getItem(CHOICE_KEY) ?? 'null');
    const traditions = (saved?.traditions ?? []).filter((x: string) => TRADITIONS.some(o => o.id === x));
    const kinds = (saved?.kinds ?? []).filter((x: string) => KINDS.some(o => o.id === x));
    if (traditions.length && kinds.length) return { traditions, kinds };
  } catch { /* valor inválido: usa o padrão */ }
  return DEFAULT_CHOICE;
}

function toggle<T>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter(x => x !== id) : [...list, id];
}

/** Nome para a capa (opcional) e seções do PDF: cada tradição marcada × cada tipo marcado. */
const PdfExportModal: React.FC<PdfExportModalProps> = ({ isOpen, onClose, onGenerate }) => {
  const [name, setName] = useState('');
  const [choice, setChoice] = useState<Choice>(DEFAULT_CHOICE);

  useEffect(() => {
    if (!isOpen) return;
    setName(localStorage.getItem(NAME_KEY) ?? '');
    setChoice(loadChoice());
  }, [isOpen]);

  const sections = combineSections(choice.traditions, choice.kinds);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sections.length) return;
    const n = name.trim();
    localStorage.setItem(NAME_KEY, n);
    localStorage.setItem(CHOICE_KEY, JSON.stringify(choice));
    onClose();
    onGenerate(n, sections);
  };

  const box = (checked: boolean, label: string, onChange: () => void) => (
    <label key={label} className="pdf-export-check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <strong>{label}</strong>
    </label>
  );

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="pdf-export-modal">
      <form className="pdf-export" onSubmit={submit}>
        <h2>Gerar PDF</h2>
        <p className="pdf-export-msg">Nome para a capa (opcional, para mapas natais).</p>
        <input
          className="pdf-export-name"
          type="text"
          placeholder="Nome"
          value={name}
          onChange={e => setName(e.target.value)}
        />

        <div className="pdf-export-label">Tradição</div>
        <div className="pdf-export-sections">
          {TRADITIONS.map(o => box(choice.traditions.includes(o.id), o.label,
            () => setChoice(c => ({ ...c, traditions: toggle(c.traditions, o.id) }))))}
        </div>

        <div className="pdf-export-label">Leitura</div>
        <div className="pdf-export-sections">
          {KINDS.map(o => box(choice.kinds.includes(o.id), o.label,
            () => setChoice(c => ({ ...c, kinds: toggle(c.kinds, o.id) }))))}
        </div>

        <p className="pdf-export-summary">
          {sections.length
            ? `${sections.length} ${sections.length === 1 ? 'seção' : 'seções'}`
            : 'Marque ao menos uma tradição e uma leitura.'}
        </p>

        <div className="pdf-export-actions">
          <button type="button" onClick={onClose}>Cancelar</button>
          <button type="submit" className="primary" disabled={!sections.length}>Gerar</button>
        </div>
      </form>
    </IonModal>
  );
};

export default PdfExportModal;
