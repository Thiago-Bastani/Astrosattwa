import type { ClassicalPlanet } from '../planetary';

/**
 * Quadrados mágicos (kameas) dos sete planetas, na disposição de Agrippa,
 * De Occulta Philosophia, livro II, cap. 22. Linha a linha, de cima para baixo.
 */
export interface Kamea {
  planet: ClassicalPlanet;
  order: number;
  grid: number[][];
  /** Metal da lâmina em que Agrippa manda gravar o quadrado. */
  metal: string;
  /** Virtude do quadrado gravado com o planeta afortunado (II.22, resumo). */
  virtue: string;
}

export const KAMEAS: Record<ClassicalPlanet, Kamea> = {
  Saturn: {
    planet: 'Saturn', order: 3, metal: 'chumbo',
    virtue: 'Gravado com Saturno afortunado, ajuda o parto, torna o homem seguro e poderoso e faz prosperar as petições a príncipes e potentados; com Saturno infortunado, estorva construções e plantios, derruba de honras e semeia discórdia.',
    grid: [
      [4, 9, 2],
      [3, 5, 7],
      [8, 1, 6],
    ],
  },
  Jupiter: {
    planet: 'Jupiter', order: 4, metal: 'prata',
    virtue: 'Gravado com Júpiter afortunado, traz ganho e riqueza, favor e amor, paz e concórdia, aplaca inimigos e confirma honras, dignidades e conselhos; gravado em coral, dissolve encantamentos.',
    grid: [
      [4, 14, 15, 1],
      [9, 7, 6, 12],
      [5, 11, 10, 8],
      [16, 2, 3, 13],
    ],
  },
  Mars: {
    planet: 'Mars', order: 5, metal: 'ferro',
    virtue: 'Gravado com Marte afortunado, dá força na guerra, nos juízos e nas petições, torna terrível aos inimigos e concede vitória; com Marte infortunado, impede construções, derruba os poderosos e gera discórdia e ódio.',
    grid: [
      [11, 24, 7, 20, 3],
      [4, 12, 25, 8, 16],
      [17, 5, 13, 21, 9],
      [10, 18, 1, 14, 22],
      [23, 6, 19, 2, 15],
    ],
  },
  Sun: {
    planet: 'Sun', order: 6, metal: 'ouro',
    virtue: 'Gravado com o Sol afortunado, torna renomado, amável e aceito, poderoso em todas as obras, iguala o homem a reis e príncipes e o eleva a altas fortunas; com o Sol infortunado, faz tirano, soberbo e ambicioso.',
    grid: [
      [6, 32, 3, 34, 35, 1],
      [7, 11, 27, 28, 8, 30],
      [19, 14, 16, 15, 23, 24],
      [18, 20, 22, 21, 17, 13],
      [25, 29, 10, 9, 26, 12],
      [36, 5, 33, 4, 2, 31],
    ],
  },
  Venus: {
    planet: 'Venus', order: 7, metal: 'prata (ou cobre)',
    virtue: 'Gravado com Vênus afortunada, traz concórdia, encerra contendas, concilia o amor, favorece a concepção e afasta a esterilidade; com Vênus infortunada, o contrário.',
    grid: [
      [22, 47, 16, 41, 10, 35, 4],
      [5, 23, 48, 17, 42, 11, 29],
      [30, 6, 24, 49, 18, 36, 12],
      [13, 31, 7, 25, 43, 19, 37],
      [38, 14, 32, 1, 26, 44, 20],
      [21, 39, 8, 33, 2, 27, 45],
      [46, 15, 40, 9, 34, 3, 28],
    ],
  },
  Mercury: {
    planet: 'Mercury', order: 8, metal: 'prata, estanho ou latão',
    virtue: 'Gravado com Mercúrio afortunado, torna próspero e afortunado no que se empreende, dá ganho, afasta a pobreza, fortalece a memória, o entendimento e a adivinhação, e revela o oculto pelos sonhos; com Mercúrio infortunado, o contrário.',
    grid: [
      [8, 58, 59, 5, 4, 62, 63, 1],
      [49, 15, 14, 52, 53, 11, 10, 56],
      [41, 23, 22, 44, 45, 19, 18, 48],
      [32, 34, 35, 29, 28, 38, 39, 25],
      [40, 26, 27, 37, 36, 30, 31, 33],
      [17, 47, 46, 20, 21, 43, 42, 24],
      [9, 55, 54, 12, 13, 51, 50, 16],
      [64, 2, 3, 61, 60, 6, 7, 57],
    ],
  },
  Moon: {
    planet: 'Moon', order: 9, metal: 'prata',
    virtue: 'Gravado com a Lua afortunada, torna amável, agradável e honrado, afasta a malícia, dá segurança nas viagens, aumento de riquezas e saúde do corpo, e afasta inimigos; com a Lua infortunada, o contrário.',
    grid: [
      [37, 78, 29, 70, 21, 62, 13, 54, 5],
      [6, 38, 79, 30, 71, 22, 63, 14, 46],
      [47, 7, 39, 80, 31, 72, 23, 55, 15],
      [16, 48, 8, 40, 81, 32, 64, 24, 56],
      [57, 17, 49, 9, 41, 73, 33, 65, 25],
      [26, 58, 18, 50, 1, 42, 74, 34, 66],
      [67, 27, 59, 10, 51, 2, 43, 75, 35],
      [36, 68, 19, 60, 11, 52, 3, 44, 76],
      [77, 28, 69, 20, 61, 12, 53, 4, 45],
    ],
  },
};

/** Soma de cada linha, coluna e diagonal. */
export const magicSum = (n: number) => (n * (n * n + 1)) / 2;
/** Soma de todas as casas. */
export const magicTotal = (n: number) => (n * n * (n * n + 1)) / 2;

/** Casa (linha, coluna) de cada número do quadrado. */
export function cellOf(k: Kamea, value: number): { row: number; col: number } | null {
  for (let r = 0; r < k.order; r++) {
    const c = k.grid[r].indexOf(value);
    if (c >= 0) return { row: r, col: c };
  }
  return null;
}

/** Confere se o quadrado é mágico e contém 1…n² (usado nos testes). */
export function isValidKamea(k: Kamea): boolean {
  const n = k.order;
  const s = magicSum(n);
  const flat = k.grid.flat();
  if (k.grid.length !== n || k.grid.some(r => r.length !== n)) return false;
  if (new Set(flat).size !== n * n || flat.some(v => v < 1 || v > n * n)) return false;
  for (let i = 0; i < n; i++) {
    if (k.grid[i].reduce((a, b) => a + b, 0) !== s) return false;
    if (k.grid.reduce((a, r) => a + r[i], 0) !== s) return false;
  }
  let d1 = 0, d2 = 0;
  for (let i = 0; i < n; i++) { d1 += k.grid[i][i]; d2 += k.grid[i][n - 1 - i]; }
  return d1 === s && d2 === s;
}
