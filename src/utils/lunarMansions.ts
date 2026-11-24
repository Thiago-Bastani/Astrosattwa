import type { LunarMansion } from '../types/astro';

export type MansionSystem = 'vedic' | 'arabic';

/* ── Nakshatras (27, védico; tradicionalmente no zodíaco sideral) ── */

export const NAKSHATRAS: string[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
];

/* ── Manazil al-Qamar (28, árabe; Picatrix/Agrippa a partir de 0° Áries) ── */

/**
 * `nakshatra`: índice (0–26) do nakshatra marcado pelas mesmas estrelas, ou null quando não há par
 * (são 28 manazil para 27 nakshatras). `approx`: as estrelas são vizinhas, não as mesmas.
 * `election`: uso eletivo segundo Agrippa, De Occulta Philosophia, livro II, cap. 33 (resumido).
 */
export interface Manzil {
  name: string;
  meaning: string;
  nakshatra: number | null;
  approx?: boolean;
  election: string;
}

export const MANAZIL: Manzil[] = [
  { name: 'Al-Sharatain', meaning: 'Os Dois Sinais',
    nakshatra: 0,
    election: 'Discórdias e viagens.' },
  { name: 'Al-Butain', meaning: 'A Pequena Barriga',
    nakshatra: 1,
    election: 'Encontrar tesouros; reter cativos.' },
  { name: 'Al-Thurayya', meaning: 'As Plêiades',
    nakshatra: 2,
    election: 'Favorável a navegantes, caçadores e alquimistas.' },
  { name: 'Al-Dabaran', meaning: 'O Seguidor',
    nakshatra: 3,
    election: 'Destruição e impedimento de construções, fontes, poços e minas; afasta répteis; gera discórdia.' },
  { name: "Al-Haq'a", meaning: 'O Cacho de Pelos',
    nakshatra: 4,
    election: 'Retorno seguro de viagem; instrução de estudantes; firma construções; dá saúde e boa vontade.' },
  { name: "Al-Han'a", meaning: 'A Marca',
    nakshatra: 5, approx: true,
    election: 'Amor entre duas pessoas; caça; cerco e destruição de cidades; vingança de príncipes contra inimigos.' },
  { name: 'Al-Dhira', meaning: 'O Braço',
    nakshatra: 6,
    election: 'Ganho e amizade; favorável aos amantes; afasta moscas; destrói magistraturas.' },
  { name: 'Al-Nathra', meaning: 'O Focinho do Leão',
    nakshatra: 7,
    election: 'Amor, amizade e companhia de viajantes; afasta ratos; prolonga o cativeiro.' },
  { name: 'Al-Tarf', meaning: 'O Olhar',
    nakshatra: 8, approx: true,
    election: 'Prejudica colheitas e viajantes; semeia discórdia.' },
  { name: 'Al-Jabha', meaning: 'A Fronte',
    nakshatra: 9,
    election: 'Fortalece construções; amor e benevolência; ajuda contra inimigos.' },
  { name: 'Al-Zubra', meaning: 'A Juba',
    nakshatra: 10,
    election: 'Viagens; ganho no comércio; libertação de cativos.' },
  { name: 'Al-Sarfa', meaning: 'A Mudança',
    nakshatra: 11,
    election: 'Prosperidade a colheitas e plantações; prejudica navegantes; melhora a condição de servos e companheiros.' },
  { name: "Al-'Awwa", meaning: 'O Ladrador',
    nakshatra: 12, approx: true,
    election: 'Benevolência, ganho, viagens e colheitas; libertação de cativos.' },
  { name: 'Al-Simak', meaning: 'O Desarmado',
    nakshatra: 13,
    election: 'Amor entre casados; cura de doentes; favorável a navegantes; atrapalha viagens por terra.' },
  { name: 'Al-Ghafr', meaning: 'A Cobertura',
    nakshatra: 14, approx: true,
    election: 'Escavar e encontrar tesouros; divórcio e discórdia; destruição de casas e de inimigos; atrapalha viajantes.' },
  { name: 'Al-Zubana', meaning: 'As Pinças',
    nakshatra: 15,
    election: 'Impede viagens, casamentos, colheitas, comércio e o resgate de cativos.' },
  { name: 'Al-Iklil', meaning: 'A Coroa',
    nakshatra: 16,
    election: 'Melhora a má sorte; torna o amor duradouro; fortalece construções; ajuda navegantes.' },
  { name: 'Al-Qalb', meaning: 'O Coração',
    nakshatra: 17,
    election: 'Discórdia, sedição e conspiração contra príncipes; vingança contra inimigos; liberta cativos; firma construções.' },
  { name: 'Al-Shawla', meaning: 'O Ferrão',
    nakshatra: 18,
    election: 'Cerco e tomada de cidades; expulsar pessoas de um lugar; ruína de navegantes e de cativos.' },
  { name: "Al-Na'a'im", meaning: 'Os Avestruzes',
    nakshatra: 19,
    election: 'Amansar animais; fortalecer prisões; destrói a riqueza de sociedades; atrai alguém a um lugar.' },
  { name: 'Al-Balda', meaning: 'A Cidade',
    nakshatra: 20, approx: true,
    election: 'Bom para colheitas, ganho, construções e viajantes; causa divórcio.' },
  { name: "Sa'd al-Dhabih", meaning: 'Sorte do Sacrificador',
    nakshatra: 21, approx: true,
    election: 'Fuga de servos e cativos; ajuda a curar doenças.' },
  { name: "Sa'd Bula", meaning: 'Sorte do Engolidor',
    nakshatra: 22, approx: true,
    election: 'Destruição e devastação; divórcio; libertação de cativos; saúde dos doentes.' },
  { name: "Sa'd al-Su'ud", meaning: 'Sorte das Sortes',
    nakshatra: null,
    election: 'Benevolência entre casados; vitória de soldados; atrapalha o exercício do governo.' },
  { name: "Sa'd al-Akhbiya", meaning: 'Sorte das Tendas',
    nakshatra: 23, approx: true,
    election: 'Cerco, destruição e vingança; causa divórcio; firma prisões e construções; apressa mensageiros.' },
  { name: 'Al-Fargh al-Muqaddam', meaning: 'O Primeiro Bico do Cântaro',
    nakshatra: 24,
    election: 'União e amor; saúde de cativos; destrói prisões e construções.' },
  { name: "Al-Fargh al-Mu'akhkhar", meaning: 'O Segundo Bico do Cântaro',
    nakshatra: 25,
    election: 'Aumenta colheitas, rendas e ganhos; cura enfermidades; atrapalha construções; perigo a navegantes.' },
  { name: 'Batn al-Hut', meaning: 'O Ventre do Peixe',
    nakshatra: 26, approx: true,
    election: 'Aumenta colheitas e comércio; protege viajantes em lugares perigosos; alegria dos casados; perda de tesouros.' },
];

function normalize(d: number): number {
  return ((d % 360) + 360) % 360;
}

/** Nakshatra pela longitude da Lua no zodíaco do mapa (tropical ou sideral). */
export function getNakshatra(moonLon: number): LunarMansion {
  const index = Math.floor(normalize(moonLon) / (360 / 27)) % 27;
  return { number: index + 1, name: NAKSHATRAS[index] };
}

/** Manzil pela longitude da Lua no zodíaco do mapa (tropical ou sideral). */
export function getManzil(moonLon: number): LunarMansion {
  const index = Math.floor(normalize(moonLon) / (360 / 28)) % 28;
  return { number: index + 1, name: MANAZIL[index].name, meaning: MANAZIL[index].meaning };
}
