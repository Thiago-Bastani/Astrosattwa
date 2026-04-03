import type { ChartData } from './astro';

/* ── Targets: o que a condição avalia ── */

export interface DirectTarget {
  type: 'direct';
  body: string; // 'Sun', 'Moon', ..., 'Chiron', 'Lilith', 'NorthNode', 'SouthNode', 'Ascendant', 'MC', 'Descendant', 'IC'
}

export interface SignRulerTarget {
  type: 'signRuler';
  sign: string; // ex: 'Aries' → resolve para Mars
}

export interface HouseRulerTarget {
  type: 'houseRuler';
  house: number; // 1-12 → regente do signo na cúspide
}

export interface PlanetSignRulerTarget {
  type: 'planetSignRuler';
  planet: string; // ex: 'Jupiter' → regente do signo onde Júpiter está
}

export type ConditionTarget = DirectTarget | SignRulerTarget | HouseRulerTarget | PlanetSignRulerTarget;

/* ── Conditions: o que testamos sobre o target ── */

export interface SignCondition {
  category: 'sign';
  sign: string; // 'Aries', 'Taurus', ...
}

export interface HouseCondition {
  category: 'house';
  house: number; // 1-12
}

export interface HemisphereCondition {
  category: 'hemisphere';
  hemisphere: 'above' | 'below' | 'east' | 'west';
}

export interface ElementCondition {
  category: 'element';
  element: 'fire' | 'earth' | 'air' | 'water';
}

export interface ModalityCondition {
  category: 'modality';
  modality: 'cardinal' | 'fixed' | 'mutable';
}

export interface DecanateCondition {
  category: 'decanate';
  decanate: 1 | 2 | 3;
}

export interface AspectCondition {
  category: 'aspect';
  aspect: string;      // 'Conjunção', 'Sextil', etc.
  aspectAngle: number;
  aspectOrb: number;
  withBody: string;    // planeta alvo do aspecto
}

export interface DignityCondition {
  category: 'dignity';
  dignity: 'domicilio' | 'exaltacao' | 'queda' | 'exilio';
}

export interface StateCondition {
  category: 'state';
  state: 'retrograde' | 'direct';
}

export type Condition =
  | SignCondition
  | HouseCondition
  | HemisphereCondition
  | ElementCondition
  | ModalityCondition
  | DecanateCondition
  | AspectCondition
  | DignityCondition
  | StateCondition;

/* ── Regra completa: target + condition ── */

export interface ConditionRule {
  id: string;
  target: ConditionTarget;
  condition: Condition;
  label: string; // texto legível pt-BR para chip
}

/* ── Agrupamento lógico ── */

export type LogicOperator = 'AND' | 'OR';

export interface ConditionGroup {
  id: string;
  operator: LogicOperator;
  rules: ConditionRule[];
}

export interface ConditionSet {
  groups: ConditionGroup[];
}

/* ── Resultado da busca ── */

export interface SearchResult {
  date: Date;
  chart: ChartData;
}

export interface SearchProgress {
  currentDate: Date;
  daysSearched: number;
  isRunning: boolean;
}
