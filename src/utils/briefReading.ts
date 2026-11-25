/* Leitura breve natal: palavras-chave e casa "real".
 * Descritivo, não preditivo: cada item tem três palavras que nomeiam um tema.
 * Edite as listas à vontade; o PDF só lê daqui. */

import type { ChartData } from '../types/astro';

export const SIGN_KEYWORDS: Record<string, [string, string, string]> = {
  Aries:       ['iniciativa', 'coragem', 'impulso'],
  Taurus:      ['estabilidade', 'sensorialidade', 'constância'],
  Gemini:      ['curiosidade', 'comunicação', 'versatilidade'],
  Cancer:      ['acolhimento', 'memória', 'sensibilidade'],
  Leo:         ['expressão', 'criatividade', 'generosidade'],
  Virgo:       ['discernimento', 'cuidado', 'aperfeiçoamento'],
  Libra:       ['equilíbrio', 'parceria', 'estética'],
  Scorpio:     ['intensidade', 'profundidade', 'transformação'],
  Sagittarius: ['expansão', 'sentido', 'entusiasmo'],
  Capricorn:   ['estrutura', 'disciplina', 'responsabilidade'],
  Aquarius:    ['originalidade', 'coletividade', 'liberdade'],
  Pisces:      ['empatia', 'imaginação', 'entrega'],
};

/** Índice 0 = Casa 1 */
export const HOUSE_KEYWORDS: [string, string, string][] = [
  ['identidade', 'presença', 'corpo'],
  ['recursos', 'valores', 'segurança'],
  ['comunicação', 'aprendizado', 'entorno'],
  ['raízes', 'família', 'lar'],
  ['criação', 'prazer', 'filhos'],
  ['rotina', 'trabalho', 'saúde'],
  ['parcerias', 'acordos', 'o outro'],
  ['intimidade', 'partilha', 'transformação'],
  ['visão de mundo', 'viagens', 'estudos'],
  ['vocação', 'carreira', 'imagem pública'],
  ['amizades', 'grupos', 'ideais'],
  ['interioridade', 'recolhimento', 'inconsciente'],
];

export const PLANET_KEYWORDS: Record<string, [string, string, string]> = {
  Sun:       ['identidade', 'vitalidade', 'propósito'],
  Moon:      ['emoção', 'nutrição', 'memória'],
  Mercury:   ['mente', 'comunicação', 'troca'],
  Venus:     ['afeto', 'valor', 'beleza'],
  Mars:      ['ação', 'desejo', 'assertividade'],
  Jupiter:   ['expansão', 'confiança', 'sabedoria'],
  Saturn:    ['estrutura', 'limite', 'maturidade'],
  Uranus:    ['inovação', 'ruptura', 'autonomia'],
  Neptune:   ['inspiração', 'idealismo', 'dissolução'],
  Pluto:     ['poder', 'regeneração', 'profundidade'],
  Chiron:    ['ferida', 'cura', 'mentoria'],
  Lilith:    ['instinto', 'autenticidade', 'sombra'],
  NorthNode: ['direção', 'crescimento', 'chamado'],
  SouthNode: ['bagagem', 'familiaridade', 'desapego'],
  Vertex:    ['encontros', 'vínculos', 'imprevisto'],
};

/** Palavra da dinâmica de cada aspecto (chave = nome em ASPECTS). */
export const ASPECT_WORDS: Record<string, string> = {
  'Conjunção':   'Fusão',
  'Sextil':      'Cooperação',
  'Trígono':     'Harmonia',
  'Quadratura':  'Tensão',
  'Oposição':    'Polaridade',
  'Quincúncio':  'Ajuste',
  'Semi-sextil': 'Contato',
};


/** Um aspecto é "aproximado" quando passa da metade da orbe permitida. */
export const isApproximate = (orb: number, maxOrb: number) => orb > maxOrb / 2;

/* ── Casa real ── */

export const REAL_HOUSE_COMMON_ORB = 5;
export const REAL_HOUSE_ANGULAR_ORB = 10;

const norm = (d: number) => ((d % 360) + 360) % 360;
/** Diferença com sinal em (-180, 180] */
const signed = (d: number) => { const n = norm(d); return n > 180 ? n - 360 : n; };

/** Início efetivo de cada casa (índice 0 = Casa 1). */
function realHouseStarts(chart: ChartData): number[] {
  const angles: Record<number, number> = { 0: chart.ascendant, 3: chart.ic, 6: chart.descendant, 9: chart.mc };
  return chart.houseCusps.map((cusp, i) => {
    const angle = angles[i];
    if (angle === undefined) return norm(cusp - REAL_HOUSE_COMMON_ORB);
    // Angular: a casa começa 10° antes do ângulo real (ASC/IC/DSC/MC),
    // sem nunca recuar além da cúspide da casa igual se ela vier antes.
    const fromAngle = norm(angle - REAL_HOUSE_ANGULAR_ORB);
    return signed(fromAngle - cusp) < 0 ? fromAngle : norm(cusp);
  });
}

/**
 * Casa "real": um corpo até 5° antes de uma cúspide comum, ou até 10° antes
 * de um ângulo (ASC, IC, DSC, MC), é lido na casa seguinte.
 */
export function getRealHouse(longitude: number, chart: ChartData): number {
  const starts = realHouseStarts(chart);
  let best = 0;
  let bestBack = Infinity;
  starts.forEach((s, i) => {
    const back = norm(longitude - s); // quanto o corpo já avançou desde o início dessa casa
    if (back < bestBack) { bestBack = back; best = i; }
  });
  return best + 1;
}

/* ── Velocidade: o corpo mais lento é o que atua sobre o mais rápido ── */

/** Do mais rápido ao mais lento, pelo movimento médio diário. */
export const SPEED_ORDER = [
  'Vertex',    // acompanha a rotação da Terra
  'Moon', 'Mercury', 'Venus', 'Sun', 'Mars',
  'Lilith',    // ~0,11°/dia
  'Jupiter',
  'NorthNode', 'SouthNode', // ~0,05°/dia
  'Saturn',
  'Chiron',    // ~0,02°/dia
  'Uranus', 'Neptune', 'Pluto',
];

export const speedRank = (name: string) => {
  const i = SPEED_ORDER.indexOf(name);
  return i < 0 ? SPEED_ORDER.length : i;
};

/** Devolve o aspecto com `a` = corpo mais rápido (recebe) e `b` = mais lento (atua). */
export function orientBySpeed<T extends { a: string; b: string }>(f: T): T {
  return speedRank(f.a) <= speedRank(f.b) ? f : { ...f, a: f.b, b: f.a };
}
