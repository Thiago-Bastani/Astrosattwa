/* Leitura védica do PDF.
 * Cada energia é descrita uma única vez, com atributos clássicos (BPHS, Brihat Jataka,
 * Phaladeepika, Taittiriya Brahmana); a leitura apenas compõe: graha + signo onde está
 * + casa onde reside. Casas por signo inteiro a partir do Lagna; regentes tradicionais;
 * nove grahas. Sem diacríticos (as fontes do PDF não os têm). */

import type { ChartData, PlanetPosition } from '../types/astro';

/* ── Grahas ── */

export const GRAHAS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'NorthNode', 'SouthNode'];

export const GRAHA_NAMES: Record<string, string> = {
  Sun: 'Surya', Moon: 'Chandra', Mars: 'Mangala', Mercury: 'Budha', Jupiter: 'Guru',
  Venus: 'Shukra', Saturn: 'Shani', NorthNode: 'Rahu', SouthNode: 'Ketu',
};

/**
 * Fragmentos que se encaixam numa frase única por posição:
 * "Na casa N (Bhava), campo {field}, {subject} ({skt}) representa {what},
 *  e atua pela energia de {Signo} ({skt}), {energy}."
 * Um texto por categoria; a leitura só os conecta.
 */

/** subject: como o graha entra na frase · what: o que ele representa (após "representa") */
export const GRAHA_INFO: Record<string, { subject: string; what: string }> = {
  Sun:       { subject: 'o Sol',    what: 'a identidade essencial, a vitalidade, o pai e a autoridade' },
  Moon:      { subject: 'a Lua',    what: 'a mente, as emoções, a memória e o vínculo materno' },
  Mars:      { subject: 'Marte',    what: 'a coragem, a energia de ação, a disputa e a competência técnica' },
  Mercury:   { subject: 'Mercúrio', what: 'o intelecto, a fala, a escrita e as trocas' },
  Jupiter:   { subject: 'Júpiter',  what: 'o conhecimento, a fé, os mestres e a expansão' },
  Venus:     { subject: 'Vênus',    what: 'o amor e as relações, os prazeres, as artes e o conforto' },
  Saturn:    { subject: 'Saturno',  what: 'o tempo, a disciplina, o trabalho e os limites' },
  NorthNode: { subject: 'Rahu',     what: 'a ambição, o estrangeiro, o não convencional e o desejo desmedido' },
  SouthNode: { subject: 'Ketu',     what: 'o desapego, a renúncia, a intuição e a busca de libertação' },
};

/** Regentes tradicionais (os usados no Jyotish). */
export const VEDIC_RULERS: Record<string, string> = {
  Aries: 'Mars', Taurus: 'Venus', Gemini: 'Mercury', Cancer: 'Moon', Leo: 'Sun', Virgo: 'Mercury',
  Libra: 'Venus', Scorpio: 'Mars', Sagittarius: 'Jupiter', Capricorn: 'Saturn', Aquarius: 'Saturn', Pisces: 'Jupiter',
};

/* ── Signos (rashis) ── */

/** skt: nome sânscrito · energy: concorda com "energia" (após "a energia de Signo (skt), ") */
export const SIGN_INFO: Record<string, { skt: string; energy: string }> = {
  Aries:       { skt: 'Mesha',      energy: 'ígnea e móvel: impulsiva e direta, voltada à iniciativa, à coragem e à competição' },
  Taurus:      { skt: 'Vrishabha',  energy: 'terrestre e fixa: estável e sensorial, voltada à persistência, ao acúmulo e à fruição' },
  Gemini:      { skt: 'Mithuna',    energy: 'aérea e dupla: versátil e curiosa, voltada ao intelecto, à fala e às trocas' },
  Cancer:      { skt: 'Karka',      energy: 'aquosa e móvel: sensível e protetora, ligada à memória, ao lar e à família' },
  Leo:         { skt: 'Simha',      energy: 'ígnea e fixa: régia e generosa, voltada à autoridade, à dignidade e à expressão' },
  Virgo:       { skt: 'Kanya',      energy: 'terrestre e dupla: analítica e metódica, voltada ao discernimento, ao serviço e aos detalhes' },
  Libra:       { skt: 'Tula',       energy: 'aérea e móvel: ponderada e diplomática, voltada ao equilíbrio, à negociação e à estética' },
  Scorpio:     { skt: 'Vrishchika', energy: 'aquosa e fixa: intensa e reservada, voltada à investigação, à persistência e à transformação' },
  Sagittarius: { skt: 'Dhanu',      energy: 'ígnea e dupla: expansiva e idealista, voltada aos princípios, ao ensino e à busca de sentido' },
  Capricorn:   { skt: 'Makara',     energy: 'terrestre e móvel: prática e disciplinada, voltada ao trabalho, à organização e à perseverança' },
  Aquarius:    { skt: 'Kumbha',     energy: 'aérea e fixa: impessoal e reformadora, voltada ao pensamento abstrato, à coletividade e à independência' },
  Pisces:      { skt: 'Mina',       energy: 'aquosa e dupla: receptiva e compassiva, voltada à imaginação, à devoção e à renúncia' },
};

/* ── Lagna por signo ── */

/** Parágrafo do ascendente em cada signo: a forma de estar no mundo. */
export const LAGNA_TEXT: Record<string, string> = {
  Aries: 'Com Lagna em Mesha, o mapa parte de um signo de fogo móvel, regido por Marte. A forma de estar no mundo é direta e iniciadora: a pessoa responde pelo impulso, abre caminhos e prefere agir a esperar. A tradição liga este Lagna à energia física, à coragem, à competição e ao gosto pelo começo; no Kalapurusha, Mesha corresponde à cabeça.',
  Taurus: 'Com Lagna em Vrishabha, o mapa parte de um signo de terra fixo, regido por Vênus, no qual a Lua se exalta. A forma de estar no mundo é estável, paciente e sensorial: a pessoa se aproxima da vida pelo concreto, pelo que pode ser tocado, cultivado e conservado. A tradição liga este Lagna à constância, ao apreço pela beleza e pelo conforto, à perseverança e a uma relação próxima com os recursos materiais.',
  Gemini: 'Com Lagna em Mithuna, o mapa parte de um signo de ar duplo, regido por Mercúrio. A forma de estar no mundo passa pelo intelecto e pela troca: a pessoa conhece pela pergunta, pela conversa e pela comparação, e se move com facilidade entre ideias e ambientes. A tradição liga este Lagna à versatilidade, à fala, à escrita, às artes e a uma natureza dupla, que divide a atenção entre muitos interesses.',
  Cancer: 'Com Lagna em Karka, o mapa parte de um signo de água móvel, regido pela Lua, no qual Júpiter se exalta. A forma de estar no mundo é sensível e protetora: a pessoa percebe o ambiente pelo sentir, guarda memórias e busca pertencimento. A tradição liga este Lagna ao lar, à família, à nutrição e a um temperamento que acompanha as marés emocionais, como a própria Lua.',
  Leo: 'Com Lagna em Simha, o mapa parte de um signo de fogo fixo, regido pelo Sol. A forma de estar no mundo é central e digna: a pessoa se coloca com presença, assume posições de autoridade e busca reconhecimento. A tradição liga este Lagna à soberania, à generosidade, ao orgulho e a um senso de honra pessoal, como o leão que preside o seu território.',
  Virgo: 'Com Lagna em Kanya, o mapa parte de um signo de terra duplo, regido por Mercúrio, que aqui se exalta. A forma de estar no mundo é atenta e analítica: a pessoa observa, distingue, organiza e procura ser útil. A tradição liga este Lagna ao discernimento, ao método, ao serviço, ao cuidado com o corpo e com os detalhes, e a uma inteligência voltada ao que é prático.',
  Libra: 'Com Lagna em Tula, o mapa parte de um signo de ar móvel, regido por Vênus, no qual Saturno se exalta. A forma de estar no mundo é ponderada e relacional: a pessoa pesa as situações, busca equilíbrio e age em diálogo com o outro. A tradição liga este Lagna à justiça, à negociação, ao comércio, à estética e a uma sensibilidade às proporções e às formas sociais.',
  Scorpio: 'Com Lagna em Vrishchika, o mapa parte de um signo de água fixo, regido por Marte, no qual a Lua está em queda. A forma de estar no mundo é intensa e reservada: a pessoa observa antes de se expor, guarda o que sente e vai ao fundo do que lhe interessa. A tradição liga este Lagna à investigação, à persistência, ao segredo, à capacidade de atravessar crises e às transformações profundas.',
  Sagittarius: 'Com Lagna em Dhanu, o mapa parte de um signo de fogo duplo, regido por Júpiter. A forma de estar no mundo é expansiva e orientada por princípios: a pessoa busca sentido, mira objetivos distantes e se apoia em convicções. A tradição liga este Lagna à religião, ao ensino, à lei, às viagens e a uma franqueza que nasce da confiança nos próprios ideais.',
  Capricorn: 'Com Lagna em Makara, o mapa parte de um signo de terra móvel, regido por Saturno, no qual Marte se exalta. A forma de estar no mundo é prática e responsável: a pessoa encara a vida como construção a longo prazo, com disciplina e senso de dever. A tradição liga este Lagna ao trabalho, à organização, à ambição concreta, à perseverança e a um amadurecimento que se dá com o tempo.',
  Aquarius: 'Com Lagna em Kumbha, o mapa parte de um signo de ar fixo, regido por Saturno. A forma de estar no mundo é impessoal e reflexiva: a pessoa pensa em termos de princípios e de coletivo, e preserva a própria independência. A tradição liga este Lagna ao pensamento abstrato, à reforma, ao serviço ao grupo, à austeridade e a uma certa distância em relação às convenções.',
  Pisces: 'Com Lagna em Mina, o mapa parte de um signo de água duplo, regido por Júpiter, no qual Vênus se exalta. A forma de estar no mundo é receptiva e compassiva: a pessoa sente o ambiente como se fizesse parte dele e se orienta mais pela intuição do que pela regra. A tradição liga este Lagna à imaginação, à devoção, à renúncia e a uma sensibilidade que dissolve fronteiras; como último signo, fecha o ciclo zodiacal.',
};

/* ── Bhavas (casas) ── */

/**
 * Índice 0 = casa 1.
 * principle: após "A casa N (Bhava) é " — o que a casa representa no fundo.
 * classic: significações clássicas, classificação e karaka.
 * lagnesha: após "…leva os temas da primeira casa para a casa N (Bhava): " — o regente do Lagna nessa casa.
 */
export const BHAVA_TEXT: { name: string; meaning: string; principle: string; classic: string; lagnesha: string }[] = [
  {
    name: 'Tanu', meaning: 'corpo',
    principle: 'a casa do próprio nativo, ponto de partida do mapa: seu corpo, sua constituição e o modo como se coloca diante da vida. Tudo o que o mapa descreve é visto a partir dela, e por isso a força da casa 1 e de seu regente sustenta o horóscopo inteiro.',
    classic: 'A tradição a liga à saúde geral, à aparência, ao temperamento e à reputação pessoal.',
    lagnesha: 'a vida se volta à própria pessoa, e o corpo, a iniciativa e a afirmação pessoal ficam no centro; é uma posição de força para todo o mapa.',
  },
  {
    name: 'Dhana', meaning: 'riqueza',
    principle: 'a casa daquilo que se acumula e dá continuidade à pessoa: não só os bens materiais, mas os valores que orientam o que ela guarda e preserva, a família de origem que transmite hábitos, alimento e linguagem, e a palavra, entendida como expressão desses valores.',
    classic: 'A tradição a liga à riqueza, à fala, à alimentação, ao olho direito e à educação inicial.',
    lagnesha: 'a identidade se liga aos recursos, à família e à palavra, e aquilo que a pessoa acumula, preserva e diz torna-se parte de quem ela é.',
  },
  {
    name: 'Sahaja', meaning: 'o que nasce junto',
    principle: 'a casa do que a pessoa realiza por si mesma: a coragem (parakrama), a iniciativa, o esforço das próprias mãos e a capacidade de se comunicar e de se fazer ouvir. É também a casa dos irmãos mais novos, os que "nascem junto" e acompanham o caminho.',
    classic: 'A tradição a liga às habilidades manuais, à escrita, às viagens curtas e à força de vontade.',
    lagnesha: 'a vida se dirige ao esforço próprio, à coragem, à comunicação e às iniciativas que dependem das próprias mãos.',
  },
  {
    name: 'Sukha', meaning: 'felicidade',
    principle: 'a casa do que dá chão e contentamento: o lar, a mãe, as raízes e a sensação interior de estar em paz. Representa tanto o espaço físico onde se vive quanto o espaço emocional onde se descansa.',
    classic: 'A tradição a liga às terras, aos imóveis, aos veículos, à educação formal e ao conforto.',
    lagnesha: 'a vida se volta ao lar, à mãe, às raízes e à busca de contentamento interior; a pessoa se reconhece no lugar a que pertence.',
  },
  {
    name: 'Putra', meaning: 'filho',
    principle: 'a casa do que a pessoa gera: os filhos, as criações, as ideias e o discernimento (buddhi) que permite escolher bem. É também a casa do mérito acumulado em vidas anteriores (purva punya), que a tradição vê como uma reserva de graça.',
    classic: 'A tradição a liga ao estudo, aos mantras, à criatividade e à especulação.',
    lagnesha: 'a identidade se expressa pela inteligência, pela criação, pelo estudo e pelos filhos; é uma posição auspiciosa, ligada ao mérito.',
  },
  {
    name: 'Ripu', meaning: 'inimigo',
    principle: 'a casa do que se enfrenta no dia a dia: os obstáculos, os adversários, as doenças, as dívidas e as disputas, e também o serviço e a rotina de trabalho com que se lida com eles. É a casa da luta cotidiana e da capacidade de superar.',
    classic: 'A tradição a liga aos parentes maternos, aos litígios e ao trabalho subordinado.',
    lagnesha: 'a vida se orienta para o serviço, o trabalho diário e o enfrentamento de obstáculos, disputas e cuidados com a saúde.',
  },
  {
    name: 'Kalatra', meaning: 'cônjuge',
    principle: 'a casa do outro: aquele que se encontra de frente, seja o cônjuge, o sócio, o parceiro de um contrato ou o público. Representa tudo o que a pessoa vive em relação e por meio da relação.',
    classic: 'A tradição a liga ao casamento, às parcerias, ao comércio e às viagens.',
    lagnesha: 'a identidade se constrói na relação com o outro, e parcerias, casamento e vida pública ocupam o centro.',
  },
  {
    name: 'Ayu', meaning: 'duração da vida',
    principle: 'a casa do que é oculto, súbito e transformador: a duração da vida, as crises, as heranças, os recursos partilhados e tudo o que acontece abaixo da superfície. É a casa das passagens que não se controlam e da pesquisa do que não se mostra.',
    classic: 'A tradição a liga à longevidade, à morte, ao oculto e às mudanças repentinas.',
    lagnesha: 'a vida passa por transformações, crises e pela investigação do que está oculto, com interesse pelo que não se mostra na superfície.',
  },
  {
    name: 'Dharma', meaning: 'lei, dever',
    principle: 'a casa do que orienta a vida: o dharma, a fé, os mestres e o pai, as escrituras e a filosofia, e a fortuna (bhagya) que acompanha quem segue o próprio caminho. É a casa do sentido e da graça.',
    classic: 'A tradição a liga aos estudos superiores, às peregrinações e às longas viagens, e a considera a mais auspiciosa das casas.',
    lagnesha: 'a vida se orienta pelo dharma, pelo estudo, pelos mestres, pela fé e pela busca de sentido; é uma das posições mais auspiciosas para o regente do Lagna.',
  },
  {
    name: 'Karma', meaning: 'ação',
    principle: 'a casa da ação no mundo: a profissão, a posição social, a autoridade e a reputação, isto é, aquilo que a pessoa faz e que os outros veem. É o ponto mais alto do mapa e o lugar onde a identidade se torna obra.',
    classic: 'A tradição a liga ao status, à honra e ao governo.',
    lagnesha: 'a identidade se realiza na ação no mundo, na profissão e na responsabilidade pública.',
  },
  {
    name: 'Labha', meaning: 'ganho',
    principle: 'a casa do que se colhe: os ganhos, os rendimentos, a realização dos desejos e as redes de amizade e de apoio que tornam isso possível. É a casa dos frutos do esforço.',
    classic: 'A tradição a liga aos irmãos mais velhos, aos benefícios e às conquistas.',
    lagnesha: 'a vida se dirige aos ganhos, às redes, aos amigos e à realização de desejos.',
  },
  {
    name: 'Vyaya', meaning: 'gasto, perda',
    principle: 'a casa do que se dissolve e se solta: os gastos, as perdas, o isolamento e o recolhimento, as terras distantes, o sono e, no plano mais alto, a libertação (moksha). É a casa do que sai da vida visível.',
    classic: 'A tradição a liga aos retiros, aos hospitais, aos prazeres do leito e à espiritualidade.',
    lagnesha: 'a vida se volta ao recolhimento, às terras distantes, ao desapego e à espiritualidade.',
  },
];

/** Tipo da casa, para avaliar o graha que a ocupa (índice 0 = casa 1). */
export const HOUSE_TYPE_TEXT: string[] = [
  'A casa 1 é ao mesmo tempo kendra e trikona, a posição mais forte do mapa.',
  'A casa 2 é casa de recursos (artha) e também maraka.',
  'A casa 3 é upachaya, casa de crescimento, cujos resultados melhoram com o tempo e o esforço.',
  'A casa 4 é kendra (angular), onde os grahas ganham força e visibilidade.',
  'A casa 5 é trikona, casa auspiciosa ligada ao dharma e ao mérito.',
  'A casa 6 é dusthana e upachaya: casa de obstáculos que, com esforço, favorece a superação.',
  'A casa 7 é kendra (angular), onde os grahas ganham força e visibilidade.',
  'A casa 8 é dusthana, casa de obstáculos e transformações, onde os significados do graha encontram dificuldade.',
  'A casa 9 é trikona, a mais auspiciosa das casas, ligada ao dharma e à fortuna.',
  'A casa 10 é kendra e upachaya: dá força e visibilidade, e seus resultados crescem com o tempo e o esforço.',
  'A casa 11 é upachaya, casa de crescimento e de ganhos, cujos resultados melhoram com o tempo.',
  'A casa 12 é dusthana, casa de perdas e de recolhimento, onde os significados do graha se voltam para dentro ou para longe.',
];

/** Ordem de leitura das casas, como na Referência do app. */
export const HOUSE_GROUPS: { title: string; note: string; houses: number[] }[] = [
  { title: 'Kendras',   note: 'casas angulares',      houses: [1, 4, 7, 10] },
  { title: 'Trikonas',  note: 'casas de dharma',      houses: [5, 9] },
  { title: 'Dusthanas', note: 'casas de dificuldade', houses: [6, 8, 12] },
  { title: 'Upachayas', note: 'casas de crescimento', houses: [3, 11] },
  { title: 'Dhana',     note: 'casa dos recursos',    houses: [2] },
];

/* ── Nakshatras ── */

export type NakshatraNature = 'kshipra' | 'ugra' | 'mishra' | 'dhruva' | 'mridu' | 'tikshna' | 'chara';

/** Classificação do muhurta e seu uso tradicional. */
export const NATURE_TEXT: Record<NakshatraNature, string> = {
  kshipra: 'Classificado como kshipra ou laghu (rápido, leve): no muhurta, indicado para comércio, medicina, estudo, ornamentos e inícios ágeis.',
  ugra:    'Classificado como ugra (feroz): no muhurta, associado a ações drásticas, ao enfrentamento e ao que exige força.',
  mishra:  'Classificado como mishra (misto): no muhurta, associado ao fogo, aos metais e a tarefas de natureza mista.',
  dhruva:  'Classificado como dhruva (fixo): no muhurta, indicado para fundações, construções, plantio e o que deve durar.',
  mridu:   'Classificado como mridu (suave): no muhurta, indicado para amizades, artes, vestuário, celebrações e uniões.',
  tikshna: 'Classificado como tikshna (agudo): no muhurta, associado a ações incisivas, rupturas e investigação.',
  chara:   'Classificado como chara (móvel): no muhurta, indicado para viagens, veículos, mudanças e movimento.',
};

export const GANA_TEXT: Record<string, string> = {
  Deva: 'deva (temperamento divino)',
  Manushya: 'manushya (temperamento humano)',
  Rakshasa: 'rakshasa (temperamento intenso)',
};

/** Leitura corrida de cada nakshatra (etimologia, devata, shakti, símbolo, temas); classificação; yoni. Na ordem de NAKSHATRAS. */
export const NAKSHATRA_INFO: { meaning: string; text: string; nature: NakshatraNature; yoni: string }[] = [
  { meaning: 'a dos cavalos', nature: 'kshipra', yoni: 'cavalo', text: 'Ashwini abre o zodíaco sideral nos primeiros graus de Áries, sob a guarda dos Ashvins, os gêmeos cavaleiros que no Rigveda chegam ao amanhecer para socorrer, curar e restituir a juventude. O nome deriva de ashva, "cavalo", e a cabeça de cavalo que o simboliza condensa os seus temas: velocidade, impulso inicial, força vital e a capacidade de pôr em marcha o que estava parado. A tradição lhe atribui o poder de alcançar rapidamente as coisas (shidhra vyapani shakti) e o associa à medicina, ao socorro, aos transportes e a todo começo. É um nakshatra em que a energia se dirige mais ao início do que à continuidade, e em que o gesto de ajudar e o de partir caminham juntos.' },
  { meaning: 'a que carrega', nature: 'ugra', yoni: 'elefante', text: 'Bharani ocupa a parte média de Áries e tem como devata Yama, o primeiro mortal e senhor do reino dos mortos, guardião do dharma e do julgamento dos atos. O nome vem da raiz bhr, "carregar", e o símbolo, a yoni, aponta para o útero que recebe, contém e dá à luz. Seus temas giram em torno da gestação e do limite: aquilo que é carregado até amadurecer e aquilo que precisa ser levado embora quando se esgota (apabharani shakti). Há aqui uma intensidade que não se dispersa, uma relação direta com o corpo, o desejo, a fertilidade e a morte entendida como passagem; o prazer e a responsabilidade aparecem lado a lado.' },
  { meaning: 'as que cortam', nature: 'mishra', yoni: 'carneiro', text: 'Krittika, as Plêiades, cruza a passagem de Áries para Touro. O nome vem de krit, "cortar", e o devata é Agni, o fogo do sacrifício que purifica, cozinha e leva as oferendas aos deuses. A lâmina que o simboliza expressa o discernimento que separa o essencial do supérfluo, a franqueza e a capacidade de cortar laços e ilusões. No mito, as Krittikas criaram Kartikeya, o general dos deuses, e o nakshatra guarda essa dupla face de fogo que nutre e de fogo que queima (dahana shakti). Associa-se à purificação, à crítica, à liderança protetora e às tarefas que exigem calor e precisão.' },
  { meaning: 'a vermelha', nature: 'dhruva', yoni: 'serpente', text: 'Rohini, "a vermelha", é a estrela Aldebarã, no coração de Touro. Na narrativa purânica, é a esposa predileta da Lua entre as vinte e sete filhas de Daksha, e por isso o nakshatra mais caro a Chandra. Seu devata é Prajapati, senhor das criaturas, e seu poder é o de fazer crescer (rohana shakti). A carroça que o simboliza fala de transporte, de comércio e de abundância em movimento. Seus temas são a fertilidade, a beleza, o cultivo, o apego aos sentidos e às formas, a arte e a prosperidade material; a criação, aqui, se dá por acumulação lenta e por atração.' },
  { meaning: 'cabeça de cervo', nature: 'mridu', yoni: 'serpente', text: 'Mrigashira, "cabeça de cervo", estende-se do fim de Touro ao início de Gêmeos, na cabeça de Órion. Seu devata é Soma, o néctar ritual identificado com a Lua, e seu poder é o de dar satisfação (prinana shakti). O cervo atento, sempre farejando, é a imagem do nakshatra: busca, curiosidade, sensibilidade, delicadeza e uma inquietação que leva de um lugar a outro. Nos Brahmanas, Prajapati em forma de cervo persegue Rohini e é atingido pela flecha de Rudra, o que liga Mrigashira ao desejo e à perseguição. Associa-se à pesquisa, às viagens, à música, ao estudo e a tudo o que nasce de procurar.' },
  { meaning: 'a úmida', nature: 'tikshna', yoni: 'cão', text: 'Ardra, "a úmida", corresponde a Betelgeuse, no ombro de Órion, e está inteiramente em Gêmeos. Seu devata é Rudra, o deus da tempestade que antecede Shiva, cujo nome se liga à raiz rud, "rugir, chorar". A lágrima que o simboliza resume seus temas: a dor, a crise, a chuva que vem depois do trovão e a limpeza que ela traz. Seu poder é o do esforço (yatna shakti). É um nakshatra de mente penetrante, de investigação e de emoções intensas, ligado à transformação por ruptura e ao que se renova depois de destruído.' },
  { meaning: 'o bem que retorna', nature: 'chara', yoni: 'gato', text: 'Punarvasu, "o bem que retorna", corresponde a Castor e Pólux e vai do fim de Gêmeos ao início de Câncer. Seu devata é Aditi, a "ilimitada", mãe dos deuses, princípio de espaço, abrigo e proteção; seu poder é o de reaver a substância (vasutva prapana shakti). Depois da tempestade de Ardra, Punarvasu representa o retorno da luz, a renovação e o recomeço. A aljava que o simboliza guarda as flechas para que sejam lançadas de novo. Associa-se à casa, à viagem e ao regresso, à simplicidade, à generosidade e à confiança na continuidade das coisas.' },
  { meaning: 'a que nutre', nature: 'kshipra', yoni: 'carneiro', text: 'Pushya, da raiz push, "nutrir, fazer prosperar", ocupa o centro de Câncer e é tido como o mais auspicioso dos nakshatras para iniciativas em geral. Seu devata é Brihaspati, preceptor dos deuses e senhor da prece, e seu poder é o de gerar energia espiritual (brahmavarchasa shakti). Os símbolos, a flor e o úbere da vaca, falam de alimento, proteção e cuidado. Seus temas são a nutrição, o ensino, a devoção, a disciplina religiosa, o serviço e a preservação das tradições; une a amplitude de Júpiter à constância de Saturno, seu regente, num nakshatra de sustentação e amadurecimento.' },
  { meaning: 'o enlace', nature: 'tikshna', yoni: 'gato', text: 'Ashlesha, "o enlace", fecha o signo de Câncer. Seus devatas são os Sarpas, as serpentes, guardiãs da sabedoria oculta e do veneno; seu poder é o de inocular veneno (visasleshana shakti), que na tradição tanto fere quanto cura. A serpente enrolada que o simboliza indica envolvimento, abraço, vínculo e controle. Seus temas são a percepção sutil, a estratégia, o magnetismo, a intimidade e os laços difíceis de desatar. É um nakshatra de inteligência penetrante e de intensidade emocional, ligado ao que se oculta sob a superfície.' },
  { meaning: 'a dádiva', nature: 'ugra', yoni: 'rato', text: 'Magha, "a dádiva", é Régulus, o coração do Leão, nos primeiros graus de Leão. Seus devatas são os Pitris, os ancestrais honrados nos ritos de shraddha, e seu poder é o de deixar o corpo (tyage kshepani shakti), isto é, o vínculo com os que já partiram. O trono que o simboliza expressa linhagem, autoridade, honra e tradição herdada. Seus temas são a realeza, o respeito às raízes, a posição social, o cerimonial e o dever para com os antepassados. É um nakshatra de dignidade e de memória, em que o indivíduo se percebe como continuidade de uma linhagem.' },
  { meaning: 'a primeira Phalguni', nature: 'ugra', yoni: 'rato', text: 'Purva Phalguni ocupa a parte média de Leão. Seu devata é Bhaga, o Aditya da partilha, da boa fortuna e da felicidade conjugal, e seu poder é o de procriar (prajanana shakti). Os pés dianteiros de uma cama, seu símbolo, falam de repouso, prazer, intimidade e celebração. Seus temas são o deleite, a arte, o romance, o lazer, a criatividade e a fruição dos bens. É um nakshatra de prazer e de expressão, em que a energia régia de Leão se volta ao gozo da vida e à união.' },
  { meaning: 'a segunda Phalguni', nature: 'dhruva', yoni: 'vaca', text: 'Uttara Phalguni vai do fim de Leão ao início de Virgem e forma par com Purva Phalguni. Seu devata é Aryaman, o Aditya dos contratos, da hospitalidade e dos ritos matrimoniais, e seu poder é o de prosperar pela união (chayani shakti). Os pés traseiros da cama, seu símbolo, indicam a parte que sustenta: o compromisso, a aliança estável, a palavra empenhada. Seus temas são a parceria, a generosidade, a ajuda mútua, o patrocínio e a responsabilidade social. É um nakshatra de constância e de lealdade.' },
  { meaning: 'a mão', nature: 'kshipra', yoni: 'búfalo', text: 'Hasta, "a mão", corresponde à constelação do Corvo e está inteiramente em Virgem. Seu devata é Savitar, o Sol que impulsiona e desperta, a quem se dirige a Gayatri; seu poder é o de pôr nas mãos aquilo que se busca (hasta sthapaniya agama shakti). A mão aberta, seu símbolo, resume os temas: habilidade, destreza, ofício, artesanato, cura pelas mãos, comércio e a capacidade de realizar. É um nakshatra prático, engenhoso e servidor, em que a inteligência se mostra no gesto.' },
  { meaning: 'a brilhante', nature: 'mridu', yoni: 'tigre', text: 'Chitra, "a brilhante", é Spica e se divide entre Virgem e Libra. Seu devata é Tvashtar, o artífice divino, depois identificado com Vishvakarma, que forja as formas e as armas dos deuses; seu poder é o de acumular mérito (punya chayani shakti). A joia brilhante que o simboliza indica forma, beleza, desenho e acabamento. Seus temas são a arquitetura, a construção, as artes visuais, o ornamento e o carisma. É um nakshatra em que técnica e estética se unem na criação de formas.' },
  { meaning: 'a independente', nature: 'chara', yoni: 'búfalo', text: 'Swati, entendido como "a independente", é Arcturus e está inteiramente em Libra. Seu devata é Vayu, o vento e o sopro vital (prana), e seu poder é o de dispersar como o vento (pradhvamsa shakti). O broto agitado pela brisa, seu símbolo, mostra a flexibilidade que se curva sem se partir. Seus temas são a independência, o movimento, o comércio, a diplomacia, a adaptação e a liberdade de ação. É um nakshatra de autonomia e de circulação, ligado às trocas e às viagens.' },
  { meaning: 'a de dois ramos', nature: 'mishra', yoni: 'tigre', text: 'Vishakha, "a de dois ramos", vai do fim de Libra ao início de Escorpião e era antigamente chamada Radha. Seus devatas são Indra e Agni, a união do poder e do fogo, e seu poder é o de alcançar muitos frutos (vyapana shakti). O arco triunfal, seu símbolo, marca a entrada vitoriosa ao fim de um percurso. Seus temas são a determinação, a concentração num objetivo, a ambição, o fervor e a conquista. É um nakshatra de foco e de persistência, em que a energia se divide entre dois caminhos até escolher um.' },
  { meaning: 'depois de Radha', nature: 'mridu', yoni: 'cervo', text: 'Anuradha, "depois de Radha", segue Vishakha, cujo nome antigo era Radha, e está inteiramente em Escorpião. Seu devata é Mitra, o Aditya da amizade, dos pactos e da ordem social, e seu poder é o da devoção e do culto (radhana shakti). O lótus que o simboliza floresce acima da água turva, imagem da capacidade de abrir-se em ambientes difíceis. Seus temas são a amizade, a lealdade, a cooperação, a organização de grupos, a devoção e as viagens para longe. É um nakshatra de disciplina afetiva e de alianças duradouras, em que a intensidade de Escorpião se volta à fidelidade.' },
  { meaning: 'a mais velha', nature: 'tikshna', yoni: 'cervo', text: 'Jyeshtha, "a mais velha", é Antares e fecha o signo de Escorpião. Seu devata é Indra, rei dos deuses e vencedor de Vritra, e seu poder é o de elevar-se e conquistar (arohana shakti). O brinco ou amuleto circular que o simboliza é insígnia de posição e de proteção. Seus temas são a senioridade, a responsabilidade pelos outros, a autoridade, a coragem diante das crises e a solidão de quem está à frente. É um nakshatra de poder e de engenho.' },
  { meaning: 'a raiz', nature: 'tikshna', yoni: 'cão', text: 'Mula, "a raiz", abre Sagitário e situa-se na cauda de Escorpião, próxima ao centro galáctico. Sua devata é Nirriti, deusa da dissolução e da desordem, e seu poder é o de arrancar pela raiz (barhana shakti). O feixe de raízes atadas que o simboliza indica o que está no fundamento e o gesto de ir até ele. Seus temas são a investigação, a busca da causa, a remoção do supérfluo, o desapego e a filosofia. É um nakshatra de radicalidade, no sentido literal de ir à raiz.' },
  { meaning: 'a primeira invicta', nature: 'ugra', yoni: 'macaco', text: 'Purva Ashadha, "a primeira invicta", ocupa a parte média de Sagitário. Seu devata é Apas, as águas cósmicas, e seu poder é o de revigorar (varchograhana shakti). O leque que o simboliza refresca e purifica. Seus temas são a convicção, o entusiasmo, a persuasão, a resistência à derrota e a renovação pela água. É um nakshatra de vigor e de confiança, em que a expansão de Sagitário ganha força de declaração.' },
  { meaning: 'a segunda invicta', nature: 'dhruva', yoni: 'mangusto', text: 'Uttara Ashadha, "a segunda invicta", vai do fim de Sagitário ao início de Capricórnio; em sua parte final situa-se Abhijit, o vigésimo oitavo nakshatra usado no muhurta. Seus devatas são os Vishvedevas, o conjunto dos deuses universais, e seu poder é o de conceder uma vitória incontestável (apradhrishya shakti). A presa de elefante, seu símbolo, indica força, firmeza e realeza. Seus temas são a integridade, a ética, a liderança, a responsabilidade e a conquista duradoura. É um nakshatra de retidão e de permanência.' },
  { meaning: 'a audição', nature: 'chara', yoni: 'macaco', text: 'Shravana, "a audição", é Altair e está inteiramente em Capricórnio. Seu devata é Vishnu, o preservador, cujos três passos medem a terra, a atmosfera e o céu; seu poder é o de conectar (samhanana shakti). As três pegadas, seu símbolo, falam de caminho e de alcance. Seus temas são a escuta, o aprendizado pela tradição oral, a transmissão do conhecimento, o aconselhamento e a ligação entre as pessoas. É um nakshatra de receptividade e de preservação.' },
  { meaning: 'a mais rica', nature: 'chara', yoni: 'leão', text: 'Dhanishtha, "a mais rica", vai do fim de Capricórnio ao início de Aquário e também é chamado Shravishtha, "o mais famoso". Seus devatas são os oito Vasus, deuses dos elementos e da luz, e seu poder é o de dar abundância e fama (khyapayitri shakti). O tambor que o simboliza indica ritmo, música e um interior oco que ressoa. Seus temas são a prosperidade, a música, a coletividade, a generosidade e o senso de oportunidade. É um nakshatra de realização e de sintonia com o grupo.' },
  { meaning: 'cem médicos', nature: 'chara', yoni: 'cavalo', text: 'Shatabhisha, "cem médicos", também chamado Shatataraka, "cem estrelas", está inteiramente em Aquário. Seu devata é Varuna, guardião das águas cósmicas e da ordem moral (rita), e seu poder é o de curar (bheshaja shakti). O círculo vazio que o simboliza indica contenção, isolamento e o espaço onde a cura acontece. Seus temas são a medicina, a ciência, a pesquisa, o mistério, a reserva e a independência. É um nakshatra de introspecção e de busca do que está velado.' },
  { meaning: 'os primeiros pés auspiciosos', nature: 'ugra', yoni: 'leão', text: 'Purva Bhadrapada, "os primeiros pés auspiciosos", vai do fim de Aquário ao início de Peixes, na região do Quadrado de Pégaso. Seu devata é Aja Ekapada, "o não nascido de um só pé", forma ígnea associada a Rudra, e seu poder é o de elevar o nível espiritual (yajamana udyamana shakti). Os pés dianteiros de um catre funerário, seu símbolo, apontam para a passagem e a transformação. Seus temas são o idealismo intenso, a austeridade, a renúncia, a visão espiritual e as mudanças radicais. É um nakshatra de fogo interior.' },
  { meaning: 'os segundos pés auspiciosos', nature: 'dhruva', yoni: 'vaca', text: 'Uttara Bhadrapada, "os segundos pés auspiciosos", está inteiramente em Peixes. Seu devata é Ahir Budhnya, a serpente das profundezas, e seu poder é o de trazer a chuva (varshodyamana shakti). Os pés traseiros do catre funerário, seu símbolo, completam o par com Purva Bhadrapada e ligam o nakshatra ao recolhimento e à passagem serena. Seus temas são a profundidade, a sabedoria, a contenção, a compaixão e a estabilidade emocional. É um nakshatra de quietude e de maturidade.' },
  { meaning: 'a abundante', nature: 'mridu', yoni: 'elefante', text: 'Revati, "a abundante", fecha o zodíaco sideral no fim de Peixes, tendo Zeta Piscium como referência tradicional. Seu devata é Pushan, protetor dos caminhos, dos viajantes e dos rebanhos, condutor das almas, e seu poder é o de nutrir (kshiradyapani shakti). O peixe que o simboliza fala de travessia e de águas. Seus temas são a proteção, a nutrição, a passagem, a compaixão, a criatividade e o cuidado com quem está em trânsito. É um nakshatra de encerramento e de transição para um novo ciclo.' },
];

/** Anos de cada regente na Vimshottari (nomes como em NAKSHATRA_DATA). */
export const DASHA_YEARS: Record<string, number> = {
  Ketu: 7, 'Vênus': 20, Sol: 6, Lua: 10, Marte: 7, Rahu: 18, 'Júpiter': 16, Saturno: 19, 'Mercúrio': 17,
};

/** Signo (índice 0 = Áries) do navamsha de um pada: a sequência de navamshas começa em Áries. */
export function padaNavamsha(nakshatraIndex: number, pada: number): number {
  return (nakshatraIndex * 4 + pada - 1) % 12;
}

/* ── Cálculos ── */

const norm = (d: number) => ((d % 360) + 360) % 360;
const signIdx = (lon: number) => Math.floor(norm(lon) / 30);

/** Casa por signo inteiro a partir do signo do Lagna (1–12). */
export function wholeSignHouse(lon: number, chart: ChartData): number {
  return ((signIdx(lon) - signIdx(chart.ascendant) + 12) % 12) + 1;
}

/** Signo (nome em inglês, como em ZODIAC_SIGNS) que ocupa a casa por signo inteiro. */
export function houseSignIndex(chart: ChartData, house: number): number {
  return (signIdx(chart.ascendant) + house - 1) % 12;
}

/** Grahas (só os nove) que ocupam a casa, em ordem tradicional. */
export function grahasInHouse(chart: ChartData, house: number): PlanetPosition[] {
  return GRAHAS
    .map(name => chart.planets.find(p => p.name === name))
    .filter((p): p is PlanetPosition => !!p && wholeSignHouse(p.longitude, chart) === house);
}

/** Pada (1–4) do nakshatra em que a longitude está. */
export function nakshatraPada(lon: number): number {
  const span = 360 / 27;
  return Math.floor((norm(lon) % span) / (span / 4)) + 1;
}

/** Início e fim do nakshatra: índice do signo e grau dentro dele (o fim pode ser 30°). */
export function nakshatraSpan(index: number): { from: [number, number]; to: [number, number] } {
  const span = 360 / 27;
  const a = index * span;
  const b = (index + 1) * span;
  const fromSign = Math.floor(a / 30);
  const toSign = Math.ceil(b / 30 - 1e-9) - 1;
  return { from: [fromSign, a - fromSign * 30], to: [toSign % 12, b - toSign * 30] };
}

/* ── Dignidade (avaliação do graha no signo) ── */

const EXALTATION: Record<string, string> = {
  Sun: 'Aries', Moon: 'Taurus', Mars: 'Capricorn', Mercury: 'Virgo', Jupiter: 'Cancer', Venus: 'Pisces', Saturn: 'Libra',
};
const DEBILITATION: Record<string, string> = {
  Sun: 'Libra', Moon: 'Scorpio', Mars: 'Cancer', Mercury: 'Pisces', Jupiter: 'Capricorn', Venus: 'Virgo', Saturn: 'Aries',
};
/** Moolatrikona: signo e faixa de graus (BPHS). */
const MOOLATRIKONA: Record<string, [string, number, number]> = {
  Sun: ['Leo', 0, 20], Moon: ['Taurus', 3, 30], Mars: ['Aries', 0, 12], Mercury: ['Virgo', 15, 20],
  Jupiter: ['Sagittarius', 0, 10], Venus: ['Libra', 0, 15], Saturn: ['Aquarius', 0, 20],
};
/** Amizades naturais (naisargika). O que não é amigo nem inimigo é neutro. */
const FRIENDS: Record<string, string[]> = {
  Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'], Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'], Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'], Saturn: ['Mercury', 'Venus'],
};
const ENEMIES: Record<string, string[]> = {
  Sun: ['Venus', 'Saturn'], Moon: [], Mars: ['Mercury'], Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'], Venus: ['Sun', 'Moon'], Saturn: ['Sun', 'Moon', 'Mars'],
};

export type Dignity = 'exalted' | 'moolatrikona' | 'own' | 'friend' | 'neutral' | 'enemy' | 'debilitated' | 'shadow';

/** Dignidade de um graha pela posição sidereal/tropical do mapa (signo e grau). */
export function grahaDignity(name: string, lon: number): { kind: Dignity; sign: string; lord: string } {
  const i = signIdx(lon);
  const deg = norm(lon) - i * 30;
  const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const sign = SIGNS[i];
  const lord = VEDIC_RULERS[sign];
  if (name === 'NorthNode' || name === 'SouthNode') return { kind: 'shadow', sign, lord };
  const mt = MOOLATRIKONA[name];
  // Lua e Mercúrio têm exaltação e moolatrikona no mesmo signo: a exaltação vale só até o grau indicado
  if (EXALTATION[name] === sign && !(name === 'Moon' && deg >= 3) && !(name === 'Mercury' && deg >= 15)) return { kind: 'exalted', sign, lord };
  if (mt && mt[0] === sign && deg >= mt[1] && deg < mt[2]) return { kind: 'moolatrikona', sign, lord };
  if (lord === name) return { kind: 'own', sign, lord };
  if (DEBILITATION[name] === sign) return { kind: 'debilitated', sign, lord };
  if (FRIENDS[name]?.includes(lord)) return { kind: 'friend', sign, lord };
  if (ENEMIES[name]?.includes(lord)) return { kind: 'enemy', sign, lord };
  return { kind: 'neutral', sign, lord };
}

/**
 * Predicado de dignidade, após o sujeito ("Vênus ").
 * signName/lordName vêm já em português.
 */
export function dignityText(kind: Dignity, signName: string, lordName: string): string {
  switch (kind) {
    case 'exalted':      return `está em exaltação (uchcha) em ${signName}, condição em que seus significados se expressam com a maior força`;
    case 'moolatrikona': return `está em seu moolatrikona em ${signName}, condição de força e de atuação próxima à sua natureza essencial`;
    case 'own':          return `está em domicílio (svakshetra) em ${signName}, e atua com autonomia, em território próprio`;
    case 'friend':       return `está em ${signName}, signo de ${lordName}, com quem tem amizade natural, e atua com apoio`;
    case 'neutral':      return `está em ${signName}, signo de ${lordName}, com quem tem relação neutra`;
    case 'enemy':        return `está em ${signName}, signo de ${lordName}, com quem tem inimizade natural, e atua com algum atrito`;
    case 'debilitated':  return `está em queda (nicha) em ${signName}, condição em que seus significados encontram dificuldade de expressão`;
    case 'shadow':       return `como graha sombra, age conforme o regente do signo que ocupa, aqui ${lordName}`;
  }
}
