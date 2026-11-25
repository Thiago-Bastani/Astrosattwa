import type { ChartData } from '../types/astro';
import type { PlanetaryDay } from './planetary';
import type { NakshatraNature } from './vedicReading';

/**
 * Leitura eletiva (do momento): muhurta védico e eleição ocidental.
 * Só dados e cálculos; o PDF compõe as frases. Tudo no zodíaco escolhido no app.
 */

const norm = (d: number) => ((d % 360) + 360) % 360;

const WEEKDAY_RULERS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

/* ── Védico: vara ── */

/** Dia védico: do nascer ao nascer do sol, regido pelo graha do dia. Muhurta Chintamani e tradição correlata. */
export const VARA_INFO: Record<string, { name: string; use: string }> = {
  Sun:     { name: 'Ravivara',    use: 'assuntos de governo e de autoridade, coroações, medicina, ofícios ligados ao fogo e ao ouro' },
  Moon:    { name: 'Somavara',    use: 'agricultura e plantio, ornamentos e roupas novas, viagens, assuntos ligados à água' },
  Mars:    { name: 'Mangalavara', use: 'fogo, metais e armas, cirurgia, disputas e ações que exigem força; evitado para casamentos e inícios brandos' },
  Mercury: { name: 'Budhavara',   use: 'estudo, escrita, comércio, ofícios manuais e o que depende de habilidade e cálculo' },
  Jupiter: { name: 'Guruvara',    use: 'ritos religiosos, iniciações, ensino, casamento e assuntos de dharma' },
  Venus:   { name: 'Shukravara',  use: 'artes e música, vestuário e adornos, veículos, casamento e prazeres' },
  Saturn:  { name: 'Shanivara',   use: 'fundações e obras que devem durar, trabalhos com ferro e terra; também ações de remoção' },
};

/** Fração do dia (1ª a 8ª) ocupada por Rahu kala, de domingo a sábado. */
const RAHU_KALA_PART = [8, 2, 7, 5, 6, 4, 3];

export function varaOf(day: PlanetaryDay | null, date: Date): { ruler: string; rahuKala: { start: Date; end: Date } | null } {
  const weekday = day?.weekday ?? date.getDay();
  const ruler = WEEKDAY_RULERS[weekday];
  if (!day) return { ruler, rahuKala: null };
  const part = (day.sunset.getTime() - day.sunrise.getTime()) / 8;
  const k = RAHU_KALA_PART[weekday] - 1;
  return {
    ruler,
    rahuKala: { start: new Date(day.sunrise.getTime() + k * part), end: new Date(day.sunrise.getTime() + (k + 1) * part) },
  };
}

/* ── Védico: tithi ── */

const TITHI_NAMES = [
  'Pratipada', 'Dvitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami',
  'Navami', 'Dashami', 'Ekadashi', 'Dvadashi', 'Trayodashi', 'Chaturdashi',
];

export type TithiGroup = 'nanda' | 'bhadra' | 'jaya' | 'rikta' | 'purna';

export const TITHI_GROUP_TEXT: Record<TithiGroup, { name: string; meaning: string; use: string }> = {
  nanda:  { name: 'Nanda',  meaning: 'a que alegra',   use: 'celebrações, artes e assuntos agradáveis' },
  bhadra: { name: 'Bhadra', meaning: 'a auspiciosa',   use: 'obras auspiciosas e duradouras, assuntos de prosperidade' },
  jaya:   { name: 'Jaya',   meaning: 'a vitoriosa',    use: 'disputas, competições e ações diante de oponentes' },
  rikta:  { name: 'Rikta',  meaning: 'a vazia',        use: 'evitada para começos auspiciosos; aceita para ações de remoção e destruição' },
  purna:  { name: 'Purna',  meaning: 'a plena',        use: 'tida por completa, própria a todas as obras' },
};

const TITHI_GROUPS: TithiGroup[] = ['nanda', 'bhadra', 'jaya', 'rikta', 'purna'];

/** Tithi pela elongação Lua–Sol (12° cada; independe do zodíaco). */
export function tithiOf(elongation: number) {
  const idx = Math.floor(norm(elongation) / 12); // 0–29
  const shukla = idx < 15;
  const n = (idx % 15) + 1; // 1–15
  const name = n === 15 ? (shukla ? 'Purnima' : 'Amavasya') : TITHI_NAMES[n - 1];
  return { number: idx + 1, n, name, shukla, group: TITHI_GROUPS[(n - 1) % 5], progress: (norm(elongation) % 12) / 12 };
}

/* ── Védico: lagna do muhurta ── */

const BENEFICS = ['Jupiter', 'Venus', 'Mercury'];
const MALEFICS = ['Sun', 'Mars', 'Saturn', 'NorthNode', 'SouthNode'];

export interface MuhurtaCheck { rule: string; holds: boolean; detail: string }

/** Regras clássicas do lagna do muhurta, por signo inteiro. */
export function muhurtaChecks(chart: ChartData, pt: (name: string) => string): MuhurtaCheck[] {
  const lagnaSign = Math.floor(norm(chart.ascendant) / 30);
  const houseOf = (lon: number) => ((Math.floor(norm(lon) / 30) - lagnaSign + 12) % 12) + 1;
  const grahas = chart.planets.filter(p => ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'NorthNode', 'SouthNode'].includes(p.name));
  const at = (names: string[]) => grahas.filter(p => names.includes(p.name)).map(p => ({ name: p.name, house: houseOf(p.longitude) }));
  const list = (xs: { name: string; house: number }[]) => xs.map(x => `${pt(x.name)} na ${x.house}ª`).join(', ');

  const eighth = grahas.filter(p => houseOf(p.longitude) === 8);
  const benefics = at(BENEFICS);
  const goodBenefics = benefics.filter(b => [1, 4, 5, 7, 9, 10].includes(b.house));
  const malefics = at(MALEFICS);
  const badMalefics = malefics.filter(m => [1, 4, 5, 7, 8, 9, 10, 12].includes(m.house));
  const moon = at(['Moon'])[0];

  return [
    {
      rule: 'Oitava casa livre de grahas',
      holds: eighth.length === 0,
      detail: eighth.length ? `ocupada por ${eighth.map(p => pt(p.name)).join(', ')}` : 'nenhum graha na 8ª',
    },
    {
      rule: 'Benéficos em kendra ou trikona (1, 4, 5, 7, 9, 10)',
      holds: goodBenefics.length > 0,
      detail: list(benefics),
    },
    {
      rule: 'Maléficos fora de kendras, trikonas, 8ª e 12ª (melhor em 3, 6, 11)',
      holds: badMalefics.length === 0,
      detail: badMalefics.length ? list(badMalefics) : list(malefics),
    },
    {
      rule: 'Lua fora da 6ª, 8ª e 12ª',
      holds: !!moon && ![6, 8, 12].includes(moon.house),
      detail: moon ? `Lua na ${moon.house}ª` : '—',
    },
  ];
}

/**
 * Grupos de nakshatras no muhurta (Muhurta Chintamani, nakshatra prakarana): nome alternativo,
 * dia da semana do mesmo grupo e obras indicadas.
 */
export const MUHURTA_NATURE: Record<NakshatraNature, { name: string; weekday: string; use: string }> = {
  dhruva:  { name: 'dhruva ou sthira (fixo)', weekday: 'domingo',
    use: 'fundações e construção de casas e cidades, semeadura e plantio, coroação, ritos de paz e tudo o que se quer permanente' },
  chara:   { name: 'chara ou chala (móvel)', weekday: 'segunda-feira',
    use: 'viagens, montar veículos e animais de montaria, jardins e o que deve mover-se' },
  ugra:    { name: 'ugra ou krura (feroz, cruel)', weekday: 'terça-feira',
    use: 'destruição, incêndio, veneno, armas, aprisionamento e ações contra inimigos' },
  mishra:  { name: 'mishra ou sadharana (misto, comum)', weekday: 'quarta-feira',
    use: 'trabalhos com fogo e obras de natureza mista' },
  kshipra: { name: 'kshipra ou laghu (rápido, leve)', weekday: 'quinta-feira',
    use: 'comércio e venda, prazeres, estudo e ensino, ornamentos e artes, medicina e viagens' },
  mridu:   { name: 'mridu ou maitra (suave, amistoso)', weekday: 'sexta-feira',
    use: 'canto e música, vestir roupas e ornamentos novos, amizades, festividades e ritos auspiciosos' },
  tikshna: { name: 'tikshna ou daruna (agudo, terrível)', weekday: 'sábado',
    use: 'ritos de abhichara, encantamentos, separações, ações violentas e a doma de animais' },
};

export type NakshatraFace = 'urdhva' | 'adho' | 'tiryak';

/** Direção da "face" de cada nakshatra, na ordem de NAKSHATRAS. */
export const NAKSHATRA_FACE: NakshatraFace[] = [
  'tiryak', 'adho', 'adho', 'urdhva', 'tiryak', 'urdhva', 'tiryak', 'urdhva', 'adho',
  'adho', 'adho', 'urdhva', 'tiryak', 'tiryak', 'tiryak', 'adho', 'tiryak', 'tiryak',
  'adho', 'adho', 'urdhva', 'urdhva', 'urdhva', 'urdhva', 'adho', 'urdhva', 'tiryak',
];

export const FACE_TEXT: Record<NakshatraFace, { name: string; use: string }> = {
  urdhva: { name: 'urdhvamukha (de face voltada para cima)', use: 'erguer construções, coroações, hastear bandeiras e plantar árvores' },
  adho:   { name: 'adhomukha (de face voltada para baixo)', use: 'cavar poços, tanques e fundações, minerar e o que se faz sob o solo' },
  tiryak: { name: 'tiryakmukha (de face voltada para os lados)', use: 'viagens, arar a terra, conduzir veículos e abrir caminhos' },
};

/* ── Ocidental: Lua ── */

/** Dignidades essenciais da Lua (por signo). */
const MOON_DIGNITY: Record<number, string> = { 3: 'domicílio', 1: 'exaltação', 9: 'exílio', 7: 'queda' };
export const moonDignity = (signIndex: number): string | null => MOON_DIGNITY[signIndex] ?? null;

export const ASPECT_ANGLES: { angle: number; name: string }[] = [
  { angle: 0, name: 'conjunção' }, { angle: 60, name: 'sextil' }, { angle: 90, name: 'quadratura' },
  { angle: 120, name: 'trígono' }, { angle: 180, name: 'oposição' },
];

export interface NextAspect { planet: string; aspect: string; distance: number }

/**
 * Condição eletiva da Lua. O próximo aspecto é aproximado: considera os outros
 * planetas parados, o que basta para saber se a Lua ainda aplica antes de mudar de signo.
 */
export function westernMoon(chart: ChartData) {
  const moonP = chart.planets.find(p => p.name === 'Moon');
  const moon = norm(moonP?.longitude ?? 0);
  const elong = norm(chart.moonPhase.angle);
  const fromSun = Math.min(elong, 360 - elong);
  const toSignEnd = 30 - (moon % 30);

  let next: NextAspect | null = null;
  for (const p of chart.planets) {
    if (!['Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].includes(p.name)) continue;
    const pl = norm(p.longitude);
    for (const a of ASPECT_ANGLES) {
      for (const target of a.angle === 0 || a.angle === 180 ? [pl + a.angle] : [pl + a.angle, pl - a.angle]) {
        const d = norm(target - moon);
        if (d > 0.01 && d < toSignEnd && (!next || d < next.distance)) next = { planet: p.name, aspect: a.name, distance: d };
      }
    }
  }

  return {
    lon: moon,
    signIndex: Math.floor(moon / 30),
    waxing: elong < 180,
    fromSun,
    sunState: fromSun < 8.5 ? 'combusta' as const : fromSun < 17 ? 'sob os raios' as const : null,
    viaCombusta: moon >= 195 && moon < 225,
    dignity: MOON_DIGNITY[Math.floor(moon / 30)] ?? null,
    voidOfCourse: !next,
    next,
    toSignEnd,
    manzil: chart.moonPhase.arabicMansion.number - 1,
  };
}

/** Uso tradicional de cada hora planetária (Picatrix, Agrippa, Lilly, em resumo). */
export const HOUR_USE: Record<string, string> = {
  Saturn:  'agricultura, terras e heranças, construções que devem durar e assuntos de pessoas idosas; desfavorável a começos que pedem rapidez',
  Jupiter: 'honras e pedidos a superiores, justiça, religião, contratos e assuntos de saúde e prosperidade',
  Mars:    'ações militares e de enfrentamento, cirurgia, fogo e metais',
  Sun:     'audiências com autoridades, cargos e honrarias, pedidos a quem governa',
  Venus:   'amor e casamento, amizade, artes, vestuário e prazeres',
  Mercury: 'escrita e estudo, comércio, contratos, mensagens e viagens curtas',
  Moon:    'viagens e embarques, assuntos da casa e do povo, coisas que mudam e se movem',
};

export const BENEFIC_WESTERN = ['Jupiter', 'Venus'];
export const MALEFIC_WESTERN = ['Mars', 'Saturn'];

/* ── Retrogradação (ocidental) ── */

export const TRADITIONAL_RETRO = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'];

/** Regentes tradicionais dos signos (Áries → Peixes). */
export const SIGN_RULERS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

export function retrogrades(chart: ChartData): string[] {
  return TRADITIONAL_RETRO.filter(n => chart.planets.find(p => p.name === n)?.isRetrograde);
}

/* ── Asta: combustão (védico) ── */

/** Distância ao Sol abaixo da qual o graha fica asta (Surya Siddhanta); [direto, retrógrado]. */
export const COMBUST_ORB: Record<string, [number, number]> = {
  Moon: [12, 12], Mars: [17, 17], Mercury: [14, 12], Jupiter: [11, 11], Venus: [10, 8], Saturn: [15, 15],
};

export function combustGrahas(chart: ChartData): string[] {
  const sun = chart.planets.find(p => p.name === 'Sun');
  if (!sun) return [];
  return Object.keys(COMBUST_ORB).filter(n => {
    const p = chart.planets.find(q => q.name === n);
    if (!p) return false;
    const d = Math.abs(norm(p.longitude - sun.longitude + 180) - 180);
    return d < COMBUST_ORB[n][p.isRetrograde ? 1 : 0];
  });
}
