import React, { useState } from 'react';
import { IonModal, IonContent } from '@ionic/react';
import type { ConditionTarget, Condition, ConditionRule } from '../types/conditions';
import { ZODIAC_SIGNS, PLANET_GLYPHS, PLANET_COLORS, DIGNITY_TABLE } from '../utils/zodiac';
import {
  PLANET_NAMES_PT, SIGN_NAMES_PT, ANGLE_NAMES_PT,
  HEMISPHERE_LABELS, ELEMENT_LABELS, MODALITY_LABELS, DIGNITY_LABELS, STATE_LABELS,
  buildConditionLabel, getBodyNamePT,
} from '../utils/astroLabels';
import './ConditionBuilder.css';

/* ── Dados de aspectos ── */

const ASPECTS_DATA = [
  { name: 'Conjunção',   angle: 0,   orb: 8, glyph: '\u260C', color: '#f1c40f' },
  { name: 'Sextil',      angle: 60,  orb: 6, glyph: '\u26B9', color: '#3498db' },
  { name: 'Quadratura',  angle: 90,  orb: 8, glyph: '\u25A1', color: '#e74c3c' },
  { name: 'Trígono',     angle: 120, orb: 8, glyph: '\u25B3', color: '#2ecc71' },
  { name: 'Oposição',    angle: 180, orb: 8, glyph: '\u260D', color: '#e74c3c' },
  { name: 'Quincúncio',  angle: 150, orb: 2, glyph: '\u26BB', color: '#95a5a6' },
  { name: 'Semi-sextil', angle: 30,  orb: 2, glyph: '\u26BA', color: '#95a5a6' },
];

/* ── Listas de corpos ── */

const PLANETS = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
const VIRTUAL_POINTS = ['Chiron', 'Lilith', 'NorthNode', 'SouthNode'];
const ANGLES = ['Ascendant', 'MC', 'Descendant', 'IC'];
const ALL_BODIES = [...PLANETS, ...VIRTUAL_POINTS];

/* ── Que categorias de condição cada tipo de target suporta ── */

type ConditionCategory = 'sign' | 'house' | 'hemisphere' | 'element' | 'modality' | 'decanate' | 'aspect' | 'dignity' | 'state';

function getCategoriesForTarget(target: ConditionTarget): ConditionCategory[] {
  if (target.type !== 'direct') {
    // Derivados resolvem para planetas
    return ['sign', 'house', 'hemisphere', 'element', 'modality', 'decanate', 'aspect', 'dignity', 'state'];
  }
  if (ANGLES.includes(target.body)) {
    return ['sign', 'element', 'modality', 'decanate'];
  }
  if (VIRTUAL_POINTS.includes(target.body)) {
    return ['sign', 'house', 'hemisphere', 'element', 'modality', 'decanate', 'aspect'];
  }
  // Planetas: tudo, mas dignidade só se tem entrada na tabela
  const cats: ConditionCategory[] = ['sign', 'house', 'hemisphere', 'element', 'modality', 'decanate', 'aspect', 'state'];
  if (DIGNITY_TABLE[target.body]) {
    cats.push('dignity');
  }
  return cats;
}

/* ── Category metadata ── */

const CATEGORY_META: Record<ConditionCategory, { icon: string; name: string; desc: string }> = {
  sign:       { icon: '\u2648', name: 'Signo',       desc: 'Em qual signo está' },
  house:      { icon: '\u2302', name: 'Casa',        desc: 'Em qual casa está' },
  hemisphere: { icon: '\u25D1', name: 'Hemisfério',  desc: 'Posição no horizonte' },
  element:    { icon: '\u2632', name: 'Elemento',    desc: 'Elemento do signo' },
  modality:   { icon: '\u25CE', name: 'Modalidade',  desc: 'Cardinal, Fixo ou Mutável' },
  decanate:   { icon: '\u2162', name: 'Decanato',    desc: '1°, 2° ou 3° decanato' },
  aspect:     { icon: '\u25B3', name: 'Aspecto',     desc: 'Aspecto com outro corpo' },
  dignity:    { icon: '\u265B', name: 'Dignidade',   desc: 'Domicílio, Exaltação, etc.' },
  state:      { icon: '\u211E', name: 'Estado',      desc: 'Retrógrado ou Direto' },
};

/* ── Tipos de derivados ── */

type DerivedType = 'signRuler' | 'houseRuler' | 'planetSignRuler';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (rule: ConditionRule) => void;
  targetGroupId: string;
}

type Step = 'target' | 'derived-sub' | 'category' | 'value' | 'aspect-body';

const ConditionBuilder: React.FC<Props> = ({ isOpen, onClose, onAdd, targetGroupId }) => {
  const [step, setStep] = useState<Step>('target');
  const [target, setTarget] = useState<ConditionTarget | null>(null);
  const [derivedType, setDerivedType] = useState<DerivedType | null>(null);
  const [category, setCategory] = useState<ConditionCategory | null>(null);
  const [selectedAspect, setSelectedAspect] = useState<typeof ASPECTS_DATA[0] | null>(null);

  function reset() {
    setStep('target');
    setTarget(null);
    setDerivedType(null);
    setCategory(null);
    setSelectedAspect(null);
  }

  function handleDismiss() {
    reset();
    onClose();
  }

  function finish(condition: Condition) {
    if (!target) return;
    const rule: ConditionRule = {
      id: crypto.randomUUID(),
      target,
      condition,
      label: buildConditionLabel(target, condition),
    };
    onAdd(rule);
    onClose();
  }

  function goBack() {
    switch (step) {
      case 'derived-sub': setStep('target'); setDerivedType(null); break;
      case 'category': setStep('target'); setTarget(null); break;
      case 'value': setStep('category'); setCategory(null); break;
      case 'aspect-body': setStep('value'); setSelectedAspect(null); break;
      default: onClose();
    }
  }

  /* ── Step 1: Target ── */

  function selectDirectTarget(body: string) {
    const t: ConditionTarget = { type: 'direct', body };
    setTarget(t);
    setStep('category');
  }

  function selectDerivedType(dt: DerivedType) {
    setDerivedType(dt);
    setStep('derived-sub');
  }

  function selectDerivedValue(value: string | number) {
    let t: ConditionTarget;
    if (derivedType === 'signRuler') {
      t = { type: 'signRuler', sign: value as string };
    } else if (derivedType === 'houseRuler') {
      t = { type: 'houseRuler', house: value as number };
    } else {
      t = { type: 'planetSignRuler', planet: value as string };
    }
    setTarget(t);
    setStep('category');
  }

  /* ── Step 2: Category ── */

  function selectCategory(cat: ConditionCategory) {
    setCategory(cat);
    setStep('value');
  }

  /* ── Renders ── */

  function renderTargetStep() {
    return (
      <>
        <div className="builder-section-title">Planetas</div>
        <div className="builder-list">
          {PLANETS.map(p => (
            <div key={p} className="builder-list-item" onClick={() => selectDirectTarget(p)}>
              <span className="item-glyph" style={{ color: PLANET_COLORS[p] }}>{PLANET_GLYPHS[p]}</span>
              <span className="item-name">{PLANET_NAMES_PT[p]}</span>
            </div>
          ))}
        </div>

        <div className="builder-section-title">Pontos</div>
        <div className="builder-list">
          {VIRTUAL_POINTS.map(p => (
            <div key={p} className="builder-list-item" onClick={() => selectDirectTarget(p)}>
              <span className="item-glyph" style={{ color: PLANET_COLORS[p] }}>{PLANET_GLYPHS[p]}</span>
              <span className="item-name">{PLANET_NAMES_PT[p]}</span>
            </div>
          ))}
        </div>

        <div className="builder-section-title">Ângulos</div>
        <div className="builder-list">
          {ANGLES.map(a => (
            <div key={a} className="builder-list-item" onClick={() => selectDirectTarget(a)}>
              <span className="item-glyph" style={{ color: '#c9a84c' }}>{a === 'Ascendant' ? 'AC' : a === 'Descendant' ? 'DC' : a}</span>
              <span className="item-name">{ANGLE_NAMES_PT[a]}</span>
            </div>
          ))}
        </div>

        <div className="builder-section-title">Derivados</div>
        <div className="builder-list">
          <div className="builder-list-item" onClick={() => selectDerivedType('signRuler')}>
            <span className="item-glyph" style={{ color: '#c9a84c' }}>♔</span>
            <span className="item-name">Senhor de um signo</span>
            <span className="item-sub">escolher signo →</span>
          </div>
          <div className="builder-list-item" onClick={() => selectDerivedType('houseRuler')}>
            <span className="item-glyph" style={{ color: '#c9a84c' }}>♔</span>
            <span className="item-name">Senhor de uma casa</span>
            <span className="item-sub">escolher casa →</span>
          </div>
          <div className="builder-list-item" onClick={() => selectDerivedType('planetSignRuler')}>
            <span className="item-glyph" style={{ color: '#c9a84c' }}>♔</span>
            <span className="item-name">Senhor do signo de um planeta</span>
            <span className="item-sub">escolher planeta →</span>
          </div>
        </div>
      </>
    );
  }

  function renderDerivedSubStep() {
    if (derivedType === 'signRuler') {
      return (
        <>
          <div className="sub-picker-label">Escolha o signo cujo senhor será o alvo:</div>
          <div className="builder-grid">
            {ZODIAC_SIGNS.map(s => (
              <button key={s.name} className="builder-grid-btn" onClick={() => selectDerivedValue(s.name)}>
                <span className="btn-glyph" style={{ color: s.color }}>{s.glyph}</span>
                <span className="btn-label">{SIGN_NAMES_PT[s.name]}</span>
              </button>
            ))}
          </div>
        </>
      );
    }

    if (derivedType === 'houseRuler') {
      return (
        <>
          <div className="sub-picker-label">Escolha a casa cujo senhor será o alvo:</div>
          <div className="builder-grid">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
              <button key={h} className="builder-grid-btn" onClick={() => selectDerivedValue(h)}>
                <span className="btn-glyph" style={{ color: '#c9a84c' }}>{h}</span>
                <span className="btn-label">Casa {h}</span>
              </button>
            ))}
          </div>
        </>
      );
    }

    // planetSignRuler
    return (
      <>
        <div className="sub-picker-label">Escolha o planeta cujo senhor do signo será o alvo:</div>
        <div className="builder-list">
          {ALL_BODIES.map(p => (
            <div key={p} className="builder-list-item" onClick={() => selectDerivedValue(p)}>
              <span className="item-glyph" style={{ color: PLANET_COLORS[p] }}>{PLANET_GLYPHS[p]}</span>
              <span className="item-name">{PLANET_NAMES_PT[p]}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  function renderCategoryStep() {
    if (!target) return null;
    const categories = getCategoriesForTarget(target);

    return (
      <>
        <div className="selected-target">
          <span className="target-label">Alvo: {buildConditionLabel(target, { category: 'sign', sign: '' }).split(' ').slice(0, -2).join(' ').trim() || getBodyNamePT((target as any).body || '')}</span>
        </div>
        <div className="builder-step-label">Tipo de condição</div>
        <div className="category-cards">
          {categories.map(cat => {
            const meta = CATEGORY_META[cat];
            return (
              <div key={cat} className="category-card" onClick={() => selectCategory(cat)}>
                <span className="cat-icon">{meta.icon}</span>
                <div>
                  <div className="cat-name">{meta.name}</div>
                  <div className="cat-desc">{meta.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }

  function renderValueStep() {
    if (!category) return null;

    switch (category) {
      case 'sign':
        return (
          <>
            <div className="builder-step-label">Escolha o signo</div>
            <div className="builder-grid">
              {ZODIAC_SIGNS.map(s => (
                <button key={s.name} className="builder-grid-btn" onClick={() => finish({ category: 'sign', sign: s.name })}>
                  <span className="btn-glyph" style={{ color: s.color }}>{s.glyph}</span>
                  <span className="btn-label">{SIGN_NAMES_PT[s.name]}</span>
                </button>
              ))}
            </div>
          </>
        );

      case 'house':
        return (
          <>
            <div className="builder-step-label">Escolha a casa</div>
            <div className="builder-grid">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                <button key={h} className="builder-grid-btn" onClick={() => finish({ category: 'house', house: h })}>
                  <span className="btn-glyph" style={{ color: '#c9a84c', fontSize: '1.5rem' }}>{h}</span>
                  <span className="btn-label">Casa {h}</span>
                </button>
              ))}
            </div>
          </>
        );

      case 'hemisphere':
        return (
          <>
            <div className="builder-step-label">Escolha o hemisfério</div>
            <div className="builder-grid builder-grid-2">
              {(Object.entries(HEMISPHERE_LABELS) as [string, string][]).map(([key, label]) => (
                <button key={key} className="builder-grid-btn" onClick={() => finish({ category: 'hemisphere', hemisphere: key as any })}>
                  <span className="btn-label" style={{ fontSize: '0.82rem' }}>{label}</span>
                </button>
              ))}
            </div>
          </>
        );

      case 'element':
        return (
          <>
            <div className="builder-step-label">Escolha o elemento</div>
            <div className="builder-grid builder-grid-2">
              {(Object.entries(ELEMENT_LABELS) as [string, string][]).map(([key, label]) => {
                const sign = ZODIAC_SIGNS.find(s => s.element === key);
                return (
                  <button key={key} className="builder-grid-btn" onClick={() => finish({ category: 'element', element: key as any })}
                    style={{ borderColor: sign?.color || undefined }}>
                    <span className="btn-glyph" style={{ color: sign?.color }}>{key === 'fire' ? '🜂' : key === 'earth' ? '🜃' : key === 'air' ? '🜁' : '🜄'}</span>
                    <span className="btn-label">{label}</span>
                  </button>
                );
              })}
            </div>
          </>
        );

      case 'modality':
        return (
          <>
            <div className="builder-step-label">Escolha a modalidade</div>
            <div className="builder-grid builder-grid-3">
              {(Object.entries(MODALITY_LABELS) as [string, string][]).map(([key, label]) => (
                <button key={key} className="builder-grid-btn" onClick={() => finish({ category: 'modality', modality: key as any })}>
                  <span className="btn-label" style={{ fontSize: '0.85rem' }}>{label}</span>
                </button>
              ))}
            </div>
          </>
        );

      case 'decanate':
        return (
          <>
            <div className="builder-step-label">Escolha o decanato</div>
            <div className="builder-grid builder-grid-3">
              {[1, 2, 3].map(d => (
                <button key={d} className="builder-grid-btn" onClick={() => finish({ category: 'decanate', decanate: d as 1 | 2 | 3 })}>
                  <span className="btn-glyph" style={{ color: '#c9a84c', fontSize: '1.3rem' }}>{d}°</span>
                  <span className="btn-label">{d === 1 ? '0°–9°' : d === 2 ? '10°–19°' : '20°–29°'}</span>
                </button>
              ))}
            </div>
          </>
        );

      case 'aspect':
        if (!selectedAspect) {
          return (
            <>
              <div className="builder-step-label">Escolha o aspecto</div>
              <div className="builder-list">
                {ASPECTS_DATA.map(a => (
                  <div key={a.name} className="builder-list-item" onClick={() => { setSelectedAspect(a); setStep('aspect-body'); }}>
                    <span className="item-glyph" style={{ color: a.color }}>{a.glyph}</span>
                    <span className="item-name">{a.name}</span>
                    <span className="item-sub">{a.angle}° (±{a.orb}°)</span>
                  </div>
                ))}
              </div>
            </>
          );
        }
        return null;

      case 'dignity':
        return (
          <>
            <div className="builder-step-label">Escolha a dignidade</div>
            <div className="builder-grid builder-grid-2">
              {(Object.entries(DIGNITY_LABELS) as [string, string][]).map(([key, label]) => {
                const colors: Record<string, string> = { domicilio: '#2ecc71', exaltacao: '#f1c40f', queda: '#e74c3c', exilio: '#95a5a6' };
                return (
                  <button key={key} className="builder-grid-btn" onClick={() => finish({ category: 'dignity', dignity: key as any })}
                    style={{ borderColor: colors[key] }}>
                    <span className="btn-label" style={{ color: colors[key], fontSize: '0.85rem' }}>{label}</span>
                  </button>
                );
              })}
            </div>
          </>
        );

      case 'state':
        return (
          <>
            <div className="builder-step-label">Escolha o estado</div>
            <div className="builder-grid builder-grid-2">
              {(Object.entries(STATE_LABELS) as [string, string][]).map(([key, label]) => (
                <button key={key} className="builder-grid-btn" onClick={() => finish({ category: 'state', state: key as any })}>
                  <span className="btn-glyph" style={{ color: key === 'retrograde' ? '#e74c3c' : '#2ecc71' }}>{key === 'retrograde' ? '℞' : '→'}</span>
                  <span className="btn-label">{label}</span>
                </button>
              ))}
            </div>
          </>
        );
    }
  }

  function renderAspectBodyStep() {
    if (!selectedAspect) return null;
    return (
      <>
        <div className="builder-step-label">
          {selectedAspect.glyph} {selectedAspect.name} com...
        </div>
        <div className="builder-section-title">Planetas</div>
        <div className="builder-list">
          {PLANETS.map(p => (
            <div key={p} className="builder-list-item" onClick={() => finish({
              category: 'aspect', aspect: selectedAspect.name,
              aspectAngle: selectedAspect.angle, aspectOrb: selectedAspect.orb, withBody: p,
            })}>
              <span className="item-glyph" style={{ color: PLANET_COLORS[p] }}>{PLANET_GLYPHS[p]}</span>
              <span className="item-name">{PLANET_NAMES_PT[p]}</span>
            </div>
          ))}
        </div>
        <div className="builder-section-title">Pontos</div>
        <div className="builder-list">
          {VIRTUAL_POINTS.map(p => (
            <div key={p} className="builder-list-item" onClick={() => finish({
              category: 'aspect', aspect: selectedAspect.name,
              aspectAngle: selectedAspect.angle, aspectOrb: selectedAspect.orb, withBody: p,
            })}>
              <span className="item-glyph" style={{ color: PLANET_COLORS[p] }}>{PLANET_GLYPHS[p]}</span>
              <span className="item-name">{PLANET_NAMES_PT[p]}</span>
            </div>
          ))}
        </div>
        <div className="builder-section-title">Ângulos</div>
        <div className="builder-list">
          {ANGLES.map(a => (
            <div key={a} className="builder-list-item" onClick={() => finish({
              category: 'aspect', aspect: selectedAspect.name,
              aspectAngle: selectedAspect.angle, aspectOrb: selectedAspect.orb, withBody: a,
            })}>
              <span className="item-glyph" style={{ color: '#c9a84c' }}>{a === 'Ascendant' ? 'AC' : a === 'Descendant' ? 'DC' : a}</span>
              <span className="item-name">{ANGLE_NAMES_PT[a]}</span>
            </div>
          ))}
        </div>
      </>
    );
  }

  const stepTitles: Record<Step, string> = {
    target: 'Escolha o alvo',
    'derived-sub': derivedType === 'signRuler' ? 'Senhor de qual signo?' : derivedType === 'houseRuler' ? 'Senhor de qual casa?' : 'Senhor do signo de qual planeta?',
    category: 'Tipo de condição',
    value: CATEGORY_META[category || 'sign']?.name || 'Valor',
    'aspect-body': 'Aspecto com...',
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleDismiss} className="builder-modal"
      breakpoints={[0, 1]} initialBreakpoint={1}>
      <div className="builder-header">
        <button className="builder-back" onClick={goBack}>
          {step === 'target' ? 'Fechar' : '\u2190 Voltar'}
        </button>
        <span className="builder-title">{stepTitles[step]}</span>
        <div style={{ width: 48 }} />
      </div>
      <IonContent className="builder-content">
        {step === 'target' && renderTargetStep()}
        {step === 'derived-sub' && renderDerivedSubStep()}
        {step === 'category' && renderCategoryStep()}
        {step === 'value' && renderValueStep()}
        {step === 'aspect-body' && renderAspectBodyStep()}
        <div style={{ height: 40 }} />
      </IonContent>
    </IonModal>
  );
};

export default ConditionBuilder;
