import type { ClassicalPlanet } from '../planetary';
import type { AgrippaSealKind } from './seals';

/**
 * Hierarquia planetária do auxiliar de rituais.
 *
 * Arcanjos: atribuição da Golden Dawn (Sol = Miguel, Mercúrio = Rafael), com nota da
 * Escala do Sete de Agrippa (De Occulta Philosophia II.10), onde Sol = Rafael e Mercúrio = Miguel.
 * Inteligências e espíritos: Agrippa II.22 (números do quadrado).
 * Olímpicos: Arbatel de Magia Veterum (Basileia, 1575), aforismo 17.
 */

export interface HebrewName {
  name: string;
  hebrew: string;
  /** Rótulo quando o planeta tem mais de um (ex.: "Inteligência das inteligências"). */
  title?: string;
  /** Número que Agrippa atribui ao nome (quando atribui). */
  agrippa?: number;
  /** A soma de Agrippa usa as letras finais com valor grande (ם = 600 …). */
  finalsGreat?: boolean;
  /** Observação sobre a grafia ou a soma. */
  note?: string;
  /** Qual figura de Agrippa II.22 é o selo deste nome (arcanjos não têm). */
  seal?: AgrippaSealKind;
}

export interface Archangel extends HebrewName {
  meaning: string;
  sephira: string;
  text: string;
  agrippaVariant?: string;
}

export interface Olympic {
  name: string;
  provinces: number;
  text: string;
}

export interface PlanetHierarchy {
  archangel: Archangel;
  intelligences: HebrewName[];
  spirits: HebrewName[];
  olympic: Olympic;
}

export const HIERARCHY: Record<ClassicalPlanet, PlanetHierarchy> = {
  Saturn: {
    archangel: {
      name: 'Tzaphqiel', hebrew: 'צפקיאל', meaning: 'contemplação de Deus', sephira: 'Binah',
      text: 'Arcanjo da esfera de Saturno e de Binah, o Entendimento. Preside à contemplação, ao tempo, ao limite e à forma que dá contorno ao que existe; a ele se dirigem as obras de contenção, estabilidade e conclusão.',
    },
    intelligences: [{ name: 'Agiel', hebrew: 'אגיאל', agrippa: 45, seal: 'intelligence' }],
    spirits: [{ name: 'Zazel', hebrew: 'זאזל', agrippa: 45, seal: 'spirit' }],
    olympic: {
      name: 'Aratron', provinces: 49,
      text: 'Governa as coisas atribuídas a Saturno. Converte qualquer coisa em pedra num instante, e tesouros em carvão e carvão em tesouro; dá espíritos familiares, ensina alquimia, magia e física, concilia os espíritos subterrâneos, torna o homem invisível, faz frutífero o estéril e concede vida longa.',
    },
  },
  Jupiter: {
    archangel: {
      name: 'Tzadqiel', hebrew: 'צדקיאל', meaning: 'justiça de Deus', sephira: 'Chesed',
      text: 'Arcanjo da esfera de Júpiter e de Chesed, a Misericórdia. Preside à benevolência, à abundância, à lei justa e à expansão ordenada; a ele se dirigem as obras de prosperidade, favor, honra e proteção.',
    },
    intelligences: [{ name: 'Iophiel', hebrew: 'יהפיאל', agrippa: 136, seal: 'intelligence' }],
    spirits: [{ name: 'Hismael', hebrew: 'הסמאל', agrippa: 136, seal: 'spirit' }],
    olympic: {
      name: 'Bethor', provinces: 42,
      text: 'Governa as coisas atribuídas a Júpiter. Responde com verdade a quem o chama, eleva a grandes dignidades, descobre tesouros, reconcilia os espíritos do ar, transporta pedras preciosas de um lugar a outro, compõe medicamentos de efeito maravilhoso e pode prolongar a vida até setecentos anos, se Deus o permitir.',
    },
  },
  Mars: {
    archangel: {
      name: 'Kamael', hebrew: 'כמאל', meaning: 'aquele que vê Deus', sephira: 'Geburah',
      text: 'Arcanjo da esfera de Marte e de Geburah, a Severidade. Preside à força, à justiça que corta e à coragem; a ele se dirigem as obras de defesa, vitória, purificação e remoção do que deve cair.',
    },
    intelligences: [{ name: 'Graphiel', hebrew: 'גראפיאל', agrippa: 325, seal: 'intelligence' }],
    spirits: [{ name: 'Barzabel', hebrew: 'ברצבאל', agrippa: 325, seal: 'spirit' }],
    olympic: {
      name: 'Phaleg', provinces: 35,
      text: 'Governa as coisas atribuídas a Marte; é o príncipe da paz. Quem possui o seu caráter é elevado por ele a grandes honras nas coisas da guerra.',
    },
  },
  Sun: {
    archangel: {
      name: 'Michael', hebrew: 'מיכאל', meaning: 'quem é como Deus?', sephira: 'Tiphareth',
      agrippaVariant: 'Na Escala do Sete de Agrippa (II.10), o arcanjo do Sol é Rafael (רפאל), e Miguel fica com Mercúrio.',
      text: 'Arcanjo da esfera do Sol e de Tiphareth, a Beleza, no centro da Árvore. Preside à harmonia, à soberania legítima e à iluminação; a ele se dirigem as obras de glória, saúde, autoridade e vitória da luz.',
    },
    intelligences: [{ name: 'Nakhiel', hebrew: 'נכיאל', agrippa: 111, seal: 'intelligence' }],
    spirits: [{ name: 'Sorath', hebrew: 'סורת', agrippa: 666, seal: 'spirit' }],
    olympic: {
      name: 'Och', provinces: 28,
      text: 'Governa as coisas solares. Concede seiscentos anos de vida com perfeita saúde e grande sabedoria, ensina a medicina perfeita, converte tudo em ouro puríssimo e em pedras preciosas, dá ouro e uma bolsa que jorra ouro; quem tem o seu caráter é venerado pelos reis do mundo inteiro.',
    },
  },
  Venus: {
    archangel: {
      name: 'Haniel', hebrew: 'האניאל', meaning: 'graça de Deus', sephira: 'Netzach',
      text: 'Arcanjo da esfera de Vênus e de Netzach, a Vitória. Preside ao amor, à beleza, às artes e à concórdia; a ele se dirigem as obras de união, atração, reconciliação e encanto.',
    },
    intelligences: [
      { name: 'Hagiel', hebrew: 'הגיאל', title: 'Inteligência', agrippa: 49, seal: 'intelligence' },
      { name: 'Bne Seraphim', hebrew: 'בני שרפים', title: 'Inteligências', agrippa: 1252, finalsGreat: true, seal: 'intelligences' },
    ],
    spirits: [{ name: 'Kedemel', hebrew: 'קדמאל', agrippa: 175, seal: 'spirit' }],
    olympic: {
      name: 'Hagith', provinces: 21,
      text: 'Governa as coisas venéreas. Quem possui o seu caráter torna-se formoso e adornado de toda beleza; converte o cobre em ouro num instante e o ouro em cobre, e dá espíritos que servem fielmente a quem lhes é dado.',
    },
  },
  Mercury: {
    archangel: {
      name: 'Raphael', hebrew: 'רפאל', meaning: 'Deus cura', sephira: 'Hod',
      agrippaVariant: 'Na Escala do Sete de Agrippa (II.10), o arcanjo de Mercúrio é Miguel (מיכאל), e Rafael fica com o Sol.',
      text: 'Arcanjo da esfera de Mercúrio e de Hod, a Glória. Preside à cura, ao conhecimento, à palavra e às viagens; a ele se dirigem as obras de estudo, comunicação, comércio, medicina e proteção do viajante.',
    },
    intelligences: [{ name: 'Tiriel', hebrew: 'טיריאל', agrippa: 260, seal: 'intelligence' }],
    spirits: [{ name: 'Taphthartharath', hebrew: 'תפתרתרת', agrippa: 2080, seal: 'spirit' }],
    olympic: {
      name: 'Ophiel', provinces: 14,
      text: 'Governa as coisas atribuídas a Mercúrio. Dá espíritos familiares, ensina todas as artes e faz com que quem possui o seu caráter converta o mercúrio na pedra filosofal num instante.',
    },
  },
  Moon: {
    archangel: {
      name: 'Gabriel', hebrew: 'גבריאל', meaning: 'força de Deus', sephira: 'Yesod',
      text: 'Arcanjo da esfera da Lua e de Yesod, o Fundamento. Preside aos sonhos, à visão, às marés, à geração e ao que flui e retorna; a ele se dirigem as obras de visão, viagem, fertilidade e proteção da casa.',
    },
    intelligences: [
      { name: 'Malkah be-Tarshishim ve-ad be-Ruah Shehalim', hebrew: 'מלכא בתרשישים ועד ברוח שחלים',
        title: 'Inteligência das inteligências', agrippa: 3321, finalsGreat: true, seal: 'intelligences',
        note: 'Agrippa atribui 3321, mas a grafia transmitida não chega a essa soma; a forma do nome varia entre edições.' },
    ],
    spirits: [
      { name: 'Hasmodai', hebrew: 'חשמודאי', title: 'Espírito', agrippa: 369, seal: 'spirit' },
      { name: 'Schad Barschemoth ha-Shartathan', hebrew: 'שד ברשהמעת שרתתן', title: 'Espírito dos espíritos', agrippa: 3321, finalsGreat: true, seal: 'spirits' },
    ],
    olympic: {
      name: 'Phul', provinces: 7,
      text: 'Governa as coisas lunares. Muda todos os metais em prata, em palavra e em obra; cura a hidropisia, dá espíritos da água que servem aos homens em forma corpórea e visível, e prolonga a vida até trezentos anos.',
    },
  },
};

export const ARBATEL_REF = 'Arbatel de Magia Veterum (Basileia, 1575), aforismo 17';
export const AGRIPPA_REF = 'Agrippa, De Occulta Philosophia (1533), livro II, cap. 22';
