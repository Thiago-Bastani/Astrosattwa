import type { ChartData, GeoLocation, ZodiacSystem } from '../../types/astro';
import { calculateChart } from '../../services/astroCalculator';
import { DIGNITY_TABLE, ZODIAC_SIGNS } from '../zodiac';
import { PLANET_NAMES_PT, SIGN_NAMES_PT } from '../astroLabels';
import { westernMoon } from '../electionalReading';
import { CHALDEAN_ORDER, type ClassicalPlanet, type PlanetaryDay, type PlanetaryHour } from '../planetary';

/**
 * Nota de cada hora planetária para invocar um planeta (pesos de Lilly, Christian
 * Astrology, livro II, tabela de fortalezas e debilidades, com acréscimos eletivos).
 * O mapa é levantado no meio da hora, no local e no zodíaco escolhidos no app.
 *
 * Todos os pesos ficam em HOUR_WEIGHTS para serem ajustados num lugar só.
 */
export const HOUR_WEIGHTS = {
  domicile: 5, exaltation: 4, triplicity: 3, term: 2, face: 1,
  detriment: -5, fall: -4,
  house: { 1: 5, 10: 5, 7: 4, 4: 4, 11: 4, 2: 3, 5: 3, 9: 2, 3: 1, 12: -5, 8: -2, 6: -2 } as Record<number, number>,
  direct: 4, retrograde: -5,
  cazimi: 5, combust: -5, underBeams: -4,
  planetDay: 3, sect: 2,
  ascDignity: 3,
  moonWaxing: 2, moonAspectsPlanet: 2, moonVoid: -4, moonIn8: -4,
  /** Limite para "Excelente" (sem debilidades). */
  excellentFrom: 14,
};

export type HourGrade = 'excelente' | 'boa' | 'remediada' | 'evitar';

export interface ScoreItem { label: string; points: number; /** Por que soma ou subtrai, em uma linha. */ why: string }

export interface HourAssessment {
  hour: PlanetaryHour;
  chart: ChartData;
  score: number;
  grade: HourGrade;
  items: ScoreItem[];
  /** Alertas e observações (casa 8, compensações). */
  notes: string[];
  /** Etiquetas informativas, sem peso na nota. */
  tags: string[];
}

/* ── Dignidades menores ── */

/** Triplicidade de Lilly (dia, noite) por elemento: fogo, terra, ar, água. */
const TRIPLICITY: [string, string][] = [['Sun', 'Jupiter'], ['Venus', 'Moon'], ['Saturn', 'Mercury'], ['Mars', 'Mars']];

/** Termos egípcios (Ptolomeu, Tetrabiblos I.20): [regente, grau final]. */
const TERMS: [string, number][][] = [
  [['Jupiter', 6], ['Venus', 12], ['Mercury', 20], ['Mars', 25], ['Saturn', 30]],
  [['Venus', 8], ['Mercury', 14], ['Jupiter', 22], ['Saturn', 27], ['Mars', 30]],
  [['Mercury', 6], ['Jupiter', 12], ['Venus', 17], ['Mars', 24], ['Saturn', 30]],
  [['Mars', 7], ['Venus', 13], ['Mercury', 19], ['Jupiter', 26], ['Saturn', 30]],
  [['Jupiter', 6], ['Venus', 11], ['Saturn', 18], ['Mercury', 24], ['Mars', 30]],
  [['Mercury', 7], ['Venus', 17], ['Jupiter', 21], ['Mars', 28], ['Saturn', 30]],
  [['Saturn', 6], ['Mercury', 14], ['Jupiter', 21], ['Venus', 28], ['Mars', 30]],
  [['Mars', 7], ['Venus', 11], ['Mercury', 19], ['Jupiter', 24], ['Saturn', 30]],
  [['Jupiter', 12], ['Venus', 17], ['Mercury', 21], ['Saturn', 26], ['Mars', 30]],
  [['Mercury', 7], ['Jupiter', 14], ['Venus', 22], ['Saturn', 26], ['Mars', 30]],
  [['Mercury', 7], ['Venus', 13], ['Jupiter', 20], ['Mars', 25], ['Saturn', 30]],
  [['Venus', 12], ['Jupiter', 16], ['Mercury', 19], ['Mars', 28], ['Saturn', 30]],
];

/** Faces (decanatos caldeus): a sequência começa em Marte a 0° de Áries. */
const FACE_ORDER = ['Mars', 'Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter'];

const DIURNAL = ['Sun', 'Jupiter', 'Saturn'];
const NOCTURNAL = ['Moon', 'Venus', 'Mars'];

const norm = (x: number) => ((x % 360) + 360) % 360;
const pt = (p: string) => PLANET_NAMES_PT[p] ?? p;

/** Força de cada casa (Lilly): vale igual para qualquer planeta. */
const HOUSE_WHY: Record<number, string> = {
  1: 'Angular: é o próprio Ascendente; o planeta age com toda a força, em nome do operador.',
  10: 'Angular: o meio do céu, ponto mais alto; máxima força e visibilidade.',
  7: 'Angular: força plena, mas voltada ao outro, ao que está diante.',
  4: 'Angular: força plena, porém subterrânea e lenta.',
  11: 'Bom Daimon: sucedente benéfica.',
  5: 'Boa Fortuna: sucedente benéfica.',
  2: 'Sucedente: força média.',
  9: 'Cadente, mas casa do Deus: força moderada.',
  3: 'Cadente, casa da Deusa: força pequena.',
  12: 'Mau Daimon: cadente e sem aspecto ao Ascendente; prisão e inimigos ocultos.',
  8: 'Casa da morte, ociosa e sem aspecto ao Ascendente.',
  6: 'Má Fortuna: cadente e sem aspecto ao Ascendente; doença e servidão.',
};

/** Casa em que cada planeta se alegra (gaudium). */
const JOY: Record<string, number> = { Mercury: 1, Moon: 3, Venus: 5, Mars: 6, Sun: 9, Jupiter: 11, Saturn: 12 };

const EARTH_SIGNS = [1, 5, 9]; // Touro, Virgem, Capricórnio

function termRuler(lon: number): string {
  const sign = Math.floor(lon / 30);
  const deg = lon - sign * 30;
  return TERMS[sign].find(([, end]) => deg < end)![0];
}

const faceRuler = (lon: number) => FACE_ORDER[Math.floor(lon / 10) % 7];

/** Avalia uma hora do planeta. */
export function assessHour(
  planet: ClassicalPlanet, hour: PlanetaryHour, day: PlanetaryDay, location: GeoLocation, zodiac: ZodiacSystem,
): HourAssessment {
  const W = HOUR_WEIGHTS;
  const mid = new Date((hour.start.getTime() + hour.end.getTime()) / 2);
  const chart = calculateChart(mid, location, zodiac);
  const p = chart.planets.find(q => q.name === planet)!;
  const sun = chart.planets.find(q => q.name === 'Sun')!;
  const lon = norm(p.longitude);
  const signIdx = Math.floor(lon / 30);
  const signName = ZODIAC_SIGNS[signIdx].name;
  const signPt = SIGN_NAMES_PT[signName];
  const items: ScoreItem[] = [];
  const notes: string[] = [];
  let debility = false;
  const add = (label: string, points: number, why: string) => items.push({ label, points, why });

  // Dignidades essenciais
  const d = DIGNITY_TABLE[planet];
  if (d.domicilio.includes(signName)) add(`Domicílio em ${signPt}`, W.domicile, 'Na própria casa: age com plena autoridade.');
  if (d.exaltacao.includes(signName)) add(`Exaltação em ${signPt}`, W.exaltation, 'Honrado como hóspede ilustre: dignidade elevada.');
  const trip = TRIPLICITY[signIdx % 4][hour.isDay ? 0 : 1];
  if (trip === planet) add(`Triplicidade (${hour.isDay ? 'dia' : 'noite'})`, W.triplicity, 'Rege o elemento do signo nesta metade do dia: apoio e sorte.');
  if (termRuler(lon) === planet) add('Termo próprio', W.term, 'Rege este trecho de graus do signo (termos egípcios): dignidade menor.');
  if (faceRuler(lon) === planet) add('Face própria', W.face, 'Rege este decanato (faces caldeias): dignidade mínima.');
  if (d.exilio.includes(signName)) { add(`Exílio em ${signPt}`, W.detriment, 'Signo oposto ao domicílio: age contra a própria natureza.'); debility = true; }
  if (d.queda.includes(signName)) { add(`Queda em ${signPt}`, W.fall, 'Signo oposto à exaltação: rebaixado, sem honra.'); debility = true; }

  // Casa
  const house = p.house ?? 0;
  const hp = W.house[house] ?? 0;
  if (hp !== 0) add(`Casa ${house}`, hp, HOUSE_WHY[house]);
  if ([6, 8, 12].includes(house)) debility = true;
  if (JOY[planet] === house) notes.push(`${pt(planet)} em sua alegria na casa ${house} (gaudium): sem pontos em Lilly, mas favorece o planeta.`);
  if (house === 8) notes.push(`${pt(planet)} na casa 8: a obra não deve ser feita com o planeta ali.`);

  // Movimento (Sol e Lua não retrogradam)
  if (planet !== 'Sun' && planet !== 'Moon') {
    if (p.isRetrograde) { add('Retrógrado', W.retrograde, 'Parece andar para trás: a obra demora, volta ou se desfaz.'); debility = true; }
    else add('Direto', W.direct, 'Move-se no sentido normal: a obra avança.');
  }

  // Sol
  let combust = false;
  if (planet !== 'Sun') {
    const dist = Math.min(norm(lon - sun.longitude), 360 - norm(lon - sun.longitude));
    if (dist < 17 / 60) add('Cazimi (no coração do Sol)', W.cazimi, "A menos de 17' do Sol: fortalecido pelo rei.");
    else if (dist < 8.5) { add('Combusto', W.combust, "A menos de 8°30' do Sol: queimado, sem força para agir."); combust = true; debility = true; }
    else if (dist < 17) { add('Sob os raios do Sol', W.underBeams, 'A menos de 17° do Sol: enfraquecido e oculto.'); debility = true; }
  }

  // Dia e seita
  if (day.ruler === planet) add(`Dia de ${pt(planet)}`, W.planetDay, 'O dia inteiro pertence ao planeta e reforça todas as horas dele.');
  const inSect = planet === 'Mercury' || (hour.isDay ? DIURNAL : NOCTURNAL).includes(planet);
  if (inSect) {
    add(planet === 'Mercury' ? 'Seita: Mercúrio serve às duas' : `Seita: planeta ${hour.isDay ? 'diurno, de dia' : 'noturno, de noite'}`, W.sect,
      'Seita (hairesis): Sol, Júpiter e Saturno agem melhor com o Sol acima do horizonte; Lua, Vênus e Marte, abaixo.');
  }

  // Ascendente em dignidade do planeta
  const ascSign = ZODIAC_SIGNS[Math.floor(norm(chart.ascendant) / 30)].name;
  if (d.domicilio.includes(ascSign) || d.exaltacao.includes(ascSign)) {
    add(`Ascendente em ${SIGN_NAMES_PT[ascSign]} (${d.domicilio.includes(ascSign) ? 'domicílio' : 'exaltação'})`, W.ascDignity,
      'O signo que nasce é do planeta: o momento inteiro fica sob o governo dele.');
  }

  // Lua
  const moon = westernMoon(chart);
  const moonP = chart.planets.find(q => q.name === 'Moon')!;
  if (moon.waxing) add('Lua crescente', W.moonWaxing, 'Lua crescendo em luz: as coisas aumentam.');
  if (planet !== 'Moon' && moon.next?.planet === planet) add(`Lua aplica ${moon.next.aspect} a ${pt(planet)}`, W.moonAspectsPlanet, 'A Lua leva a virtude do momento ao planeta: liga a hora à obra.');
  if (moon.voidOfCourse) add('Lua fora de curso', W.moonVoid, 'Sem aspectos até mudar de signo: a obra tende a não se completar.');
  if (moonP.house === 8 && planet !== 'Moon') add('Lua na casa 8', W.moonIn8, 'Lua em casa de morte, sem aspecto ao Ascendente.');

  // Casa 8: o ideal é vazia
  const in8 = chart.planets.filter(q => q.house === 8 && (CHALDEAN_ORDER as readonly string[]).includes(q.name) && q.name !== planet);
  if (in8.length) notes.push(`Casa 8 ${house === 8 ? 'também ' : ''}ocupada por ${in8.map(q => pt(q.name)).join(', ')}.`);
  else if (house !== 8) notes.push('Casa 8 vazia.');

  // Compensações acidentais
  const angular = [1, 10, 7, 4].includes(house);
  if (angular && p.isRetrograde) notes.push('Retrogradação compensada pela angularidade: remediada, não boa.');
  if (angular && (d.exilio.includes(signName) || d.queda.includes(signName))) notes.push('Debilidade essencial amparada pela casa angular.');

  const tags: string[] = [];
  if (EARTH_SIGNS.includes(Math.floor(norm(chart.ascendant) / 30))) tags.push(`ASC em signo de terra · ${SIGN_NAMES_PT[ascSign]}`);

  const score = items.reduce((s, i) => s + i.points, 0);
  let grade: HourGrade;
  if (score < 0 || house === 8 || combust) grade = 'evitar';
  else if (debility) grade = 'remediada';
  else grade = score >= W.excellentFrom ? 'excelente' : 'boa';

  return { hour, chart, score, grade, items, notes, tags };
}

export function assessPlanetHours(
  planet: ClassicalPlanet, day: PlanetaryDay, location: GeoLocation, zodiac: ZodiacSystem,
): HourAssessment[] {
  return day.hours.filter(h => h.ruler === planet).map(h => assessHour(planet, h, day, location, zodiac));
}

export const GRADE_LABEL: Record<HourGrade, string> = {
  excelente: 'Excelente', boa: 'Boa', remediada: 'Remediada', evitar: 'Evitar',
};
