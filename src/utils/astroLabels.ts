import type { ConditionTarget, Condition } from '../types/conditions';
import { ZODIAC_SIGNS } from './zodiac';

/* ── Nomes em pt-BR ── */

export const PLANET_NAMES_PT: Record<string, string> = {
  Sun: 'Sol', Moon: 'Lua', Mercury: 'Mercúrio', Venus: 'Vênus', Mars: 'Marte',
  Jupiter: 'Júpiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Netuno', Pluto: 'Plutão',
  Chiron: 'Quíron', Lilith: 'Lilith', NorthNode: 'Nodo Norte', SouthNode: 'Nodo Sul', Vertex: 'Vertex',
};

export const SIGN_NAMES_PT: Record<string, string> = {
  Aries: 'Áries', Taurus: 'Touro', Gemini: 'Gêmeos', Cancer: 'Câncer',
  Leo: 'Leão', Virgo: 'Virgem', Libra: 'Libra', Scorpio: 'Escorpião',
  Sagittarius: 'Sagitário', Capricorn: 'Capricórnio', Aquarius: 'Aquário', Pisces: 'Peixes',
};

export const ANGLE_NAMES_PT: Record<string, string> = {
  Ascendant: 'Ascendente', MC: 'Meio do Céu', Descendant: 'Descendente', IC: 'Fundo do Céu',
};

export const HEMISPHERE_LABELS: Record<string, string> = {
  above: 'Acima do horizonte', below: 'Abaixo do horizonte',
  east: 'Hemisfério leste', west: 'Hemisfério oeste',
};

export const ELEMENT_LABELS: Record<string, string> = {
  fire: 'Fogo', earth: 'Terra', air: 'Ar', water: 'Água',
};

export const MODALITY_LABELS: Record<string, string> = {
  cardinal: 'Cardinal', fixed: 'Fixo', mutable: 'Mutável',
};

export const DIGNITY_LABELS: Record<string, string> = {
  domicilio: 'Domicílio', exaltacao: 'Exaltação', queda: 'Queda', exilio: 'Exílio',
};

export const ASPECT_LABELS: Record<string, string> = {
  'Conjunção': 'Conjunção', 'Sextil': 'Sextil', 'Quadratura': 'Quadratura',
  'Trígono': 'Trígono', 'Oposição': 'Oposição', 'Quincúncio': 'Quincúncio', 'Semi-sextil': 'Semi-sextil',
};

export const STATE_LABELS: Record<string, string> = {
  retrograde: 'Retrógrado', direct: 'Direto',
};

/* ── Modalidade por signo ── */

export const MODALITY_MAP: Record<string, 'cardinal' | 'fixed' | 'mutable'> = {
  Aries: 'cardinal', Cancer: 'cardinal', Libra: 'cardinal', Capricorn: 'cardinal',
  Taurus: 'fixed', Leo: 'fixed', Scorpio: 'fixed', Aquarius: 'fixed',
  Gemini: 'mutable', Virgo: 'mutable', Sagittarius: 'mutable', Pisces: 'mutable',
};

/* ── Helpers ── */

export function getBodyNamePT(body: string): string {
  return PLANET_NAMES_PT[body] || ANGLE_NAMES_PT[body] || body;
}

function getTargetLabel(target: ConditionTarget): string {
  switch (target.type) {
    case 'direct':
      return getBodyNamePT(target.body);
    case 'signRuler':
      return `Senhor de ${SIGN_NAMES_PT[target.sign] || target.sign}`;
    case 'houseRuler':
      return `Senhor da casa ${target.house}`;
    case 'planetSignRuler':
      return `Senhor do signo de ${getBodyNamePT(target.planet)}`;
  }
}

function getConditionLabel(condition: Condition): string {
  switch (condition.category) {
    case 'sign':
      return `em ${SIGN_NAMES_PT[condition.sign] || condition.sign}`;
    case 'house':
      return `na casa ${condition.house}`;
    case 'hemisphere':
      return (HEMISPHERE_LABELS[condition.hemisphere] || condition.hemisphere).toLowerCase();
    case 'element': {
      const signs = ZODIAC_SIGNS.filter(s => s.element === condition.element)
        .map(s => SIGN_NAMES_PT[s.name]).join(', ');
      return `em signo de ${ELEMENT_LABELS[condition.element]} (${signs})`;
    }
    case 'modality':
      return `em signo ${MODALITY_LABELS[condition.modality]}`;
    case 'decanate':
      return `no ${condition.decanate}° decanato`;
    case 'aspect':
      return `em ${condition.aspect} com ${getBodyNamePT(condition.withBody)}`;
    case 'dignity':
      return `em ${DIGNITY_LABELS[condition.dignity]}`;
    case 'state':
      return STATE_LABELS[condition.state];
  }
}

export function buildConditionLabel(target: ConditionTarget, condition: Condition): string {
  return `${getTargetLabel(target)} ${getConditionLabel(condition)}`;
}
