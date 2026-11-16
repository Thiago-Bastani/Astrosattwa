import React from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { ZODIAC_SIGNS, PLANET_GLYPHS, PLANET_COLORS, DIGNITY_TABLE, SIGN_RULERS } from '../utils/zodiac';
import { PLANET_NAMES_PT, SIGN_NAMES_PT, MODALITY_MAP } from '../utils/astroLabels';
import { MANAZIL, NAKSHATRAS } from '../utils/lunarMansions';
import { CHALDEAN_ORDER, DAY_RULERS, WEEKDAY_NAMES_PT } from '../utils/planetary';
import { DAY_PALETTES } from '../theme/palettes';
import { calculateLahiriAyanamsa } from '../services/astroCalculator';
import AppHeader from '../components/AppHeader';
import './ReferencePage.css';

/* ════════════════ Blocos de layout ════════════════ */

function Section({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <details className="ref-section">
      <summary>
        <span className="ref-section-title">{title}</span>
        {meta && <span className="ref-section-meta">{meta}</span>}
      </summary>
      <div className="ref-body">{children}</div>
    </details>
  );
}

function Sub({ children }: { children: React.ReactNode }) {
  return <h4 className="ref-sub">{children}</h4>;
}

function Lede({ children }: { children: React.ReactNode }) {
  return <p className="ref-lede">{children}</p>;
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="ref-note">{children}</p>;
}

function Defs({ items }: { items: [React.ReactNode, React.ReactNode][] }) {
  return (
    <dl className="ref-dl">
      {items.map(([term, desc], i) => (
        <div key={i} className="ref-dl-row">
          <dt>{term}</dt>
          <dd>{desc}</dd>
        </div>
      ))}
    </dl>
  );
}

function Table({ head, rows, numeric = [] }: { head: string[]; rows: React.ReactNode[][]; numeric?: number[] }) {
  return (
    <div className="ref-table-wrap">
      <table className="ref-table">
        <thead>
          <tr>{head.map((h, i) => <th key={i} className={numeric.includes(i) ? 'num' : ''}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => <td key={j} className={numeric.includes(j) ? 'num' : ''}>{c}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ════════════════ Helpers de formatação ════════════════ */

function Planet({ name }: { name: string }) {
  return (
    <span className="ref-nowrap">
      <span className="astro-glyph ref-glyph" style={{ color: PLANET_COLORS[name] }}>{PLANET_GLYPHS[name]}</span>
      {PLANET_NAMES_PT[name] || name}
    </span>
  );
}

function Sign({ name }: { name: string }) {
  const s = ZODIAC_SIGNS.find(z => z.name === name);
  return (
    <span className="ref-nowrap">
      <span className="astro-glyph ref-glyph" style={{ color: s?.color }}>{s?.glyph}</span>
      {SIGN_NAMES_PT[name] || name}
    </span>
  );
}

function Signs({ names }: { names: string[] }) {
  return <>{names.map((n, i) => <React.Fragment key={n}>{i > 0 && ', '}<Sign name={n} /></React.Fragment>)}</>;
}

/** Longitude eclíptica → "♈ 13°20'" */
function Lon({ deg }: { deg: number }) {
  const sign = ZODIAC_SIGNS[Math.floor(deg / 30) % 12];
  const d = deg % 30;
  let whole = Math.floor(d);
  let min = Math.round((d - whole) * 60);
  if (min === 60) { whole += 1; min = 0; }
  return (
    <span className="ref-nowrap">
      <span className="astro-glyph ref-glyph" style={{ color: sign.color }}>{sign.glyph}</span>
      {whole}°{String(min).padStart(2, '0')}'
    </span>
  );
}

const ELEMENT_PT: Record<string, string> = { fire: 'Fogo', earth: 'Terra', air: 'Ar', water: 'Água' };
const MODALITY_PT: Record<string, string> = { cardinal: 'Cardinal', fixed: 'Fixo', mutable: 'Mutável' };
const TRADITIONAL_RULER: Record<string, string> = { Scorpio: 'Mars', Aquarius: 'Saturn', Pisces: 'Jupiter' };

/* ════════════════ Seções ════════════════ */

function SignsSection() {
  return (
    <Section title="Signos" meta="12 · 30° cada">
      <Lede>
        Divisões de 30° da eclíptica, contadas a partir de 0° Áries. Cada signo combina um elemento,
        uma modalidade e uma polaridade.
      </Lede>
      <Table
        head={['Signo', 'Início', 'Elemento', 'Modalidade', 'Polaridade', 'Regente']}
        rows={ZODIAC_SIGNS.map((s, i) => [
          <Sign name={s.name} />,
          `${i * 30}°`,
          ELEMENT_PT[s.element],
          MODALITY_PT[MODALITY_MAP[s.name]],
          s.element === 'fire' || s.element === 'air' ? 'Positiva' : 'Negativa',
          <>
            <Planet name={SIGN_RULERS[s.name]} />
            {TRADITIONAL_RULER[s.name] && (
              <span className="ref-muted"> (trad. {PLANET_NAMES_PT[TRADITIONAL_RULER[s.name]]})</span>
            )}
          </>,
        ])}
        numeric={[1]}
      />
      <Note>
        O app usa os regentes modernos de Escorpião, Aquário e Peixes (Plutão, Urano, Netuno);
        o regente tradicional aparece entre parênteses.
      </Note>
    </Section>
  );
}

function DignitiesSection() {
  const planets = Object.keys(DIGNITY_TABLE);
  return (
    <Section title="Regências e dignidades" meta="10 planetas">
      <Defs items={[
        ['Domicílio', 'Signo regido pelo planeta.'],
        ['Exílio', 'Signo oposto ao domicílio.'],
        ['Exaltação', 'Signo de exaltação atribuído pela tradição.'],
        ['Queda', 'Signo oposto à exaltação.'],
      ]} />
      <Table
        head={['Planeta', 'Domicílio', 'Exaltação', 'Queda', 'Exílio']}
        rows={planets.map(p => {
          const d = DIGNITY_TABLE[p];
          return [<Planet name={p} />, <Signs names={d.domicilio} />, <Signs names={d.exaltacao} />, <Signs names={d.queda} />, <Signs names={d.exilio} />];
        })}
      />
      <Sub>Oposições de domicílio</Sub>
      <Lede>Pares de planetas cujos domicílios ficam em signos opostos.</Lede>
      <Table
        head={['Planeta', 'Domicílio', 'Oposto', 'Domicílio']}
        rows={[
          ['Sun', 'Saturn'], ['Moon', 'Saturn'], ['Mercury', 'Jupiter'], ['Venus', 'Mars'],
        ].map(([a, b]) => [
          <Planet name={a} />, <Signs names={DIGNITY_TABLE[a].domicilio} />,
          <Planet name={b} />, <Signs names={DIGNITY_TABLE[b].domicilio} />,
        ])}
      />
    </Section>
  );
}

const ASPECTS: {
  name: string; glyph: string; color: string; angle: number; orb: number; division: string;
  element: string; modality: string; polarity: string; kind: string;
}[] = [
  { name: 'Conjunção',   glyph: '☌', color: '#f1c40f', angle: 0,   orb: 8, division: '360/1',  element: 'Igual',          modality: 'Igual',     polarity: 'Igual',     kind: 'Maior' },
  { name: 'Semi-sextil', glyph: '⚺', color: '#95a5a6', angle: 30,  orb: 2, division: '360/12', element: 'Diferente',      modality: 'Diferente', polarity: 'Oposta',    kind: 'Menor' },
  { name: 'Sextil',      glyph: '⚹', color: '#3498db', angle: 60,  orb: 6, division: '360/6',  element: 'Complementar',   modality: 'Diferente', polarity: 'Igual',     kind: 'Maior' },
  { name: 'Quadratura',  glyph: '□', color: '#e74c3c', angle: 90,  orb: 8, division: '360/4',  element: 'Diferente',      modality: 'Igual',     polarity: 'Oposta',    kind: 'Maior' },
  { name: 'Trígono',     glyph: '△', color: '#2ecc71', angle: 120, orb: 8, division: '360/3',  element: 'Igual',          modality: 'Diferente', polarity: 'Igual',     kind: 'Maior' },
  { name: 'Quincúncio',  glyph: '⚻', color: '#95a5a6', angle: 150, orb: 2, division: '5×360/12', element: 'Diferente',    modality: 'Diferente', polarity: 'Oposta',    kind: 'Menor' },
  { name: 'Oposição',    glyph: '☍', color: '#e74c3c', angle: 180, orb: 8, division: '360/2',  element: 'Complementar',   modality: 'Igual',     polarity: 'Igual',     kind: 'Maior' },
];

function AspectsSection() {
  return (
    <Section title="Aspectos" meta="7 · orbes do app">
      <Lede>
        Distância angular entre dois pontos da eclíptica. Um aspecto é considerado ativo quando a
        distância fica dentro do orbe (tolerância) em torno do ângulo exato.
      </Lede>
      <Table
        head={['Aspecto', 'Ângulo', 'Orbe', 'Divisão', 'Tipo']}
        rows={ASPECTS.map(a => [
          <span className="ref-nowrap"><span className="astro-glyph ref-glyph" style={{ color: a.color }}>{a.glyph}</span>{a.name}</span>,
          `${a.angle}°`, `±${a.orb}°`, a.division, a.kind,
        ])}
        numeric={[1, 2]}
      />
      <Sub>Relação entre os signos envolvidos</Sub>
      <Lede>Considerando os dois pontos no mesmo grau de seus signos.</Lede>
      <Table
        head={['Aspecto', 'Elemento', 'Modalidade', 'Polaridade']}
        rows={ASPECTS.map(a => [a.name, a.element, a.modality, a.polarity])}
      />
      <Note>Elementos complementares: Fogo–Ar e Terra–Água.</Note>
    </Section>
  );
}

const PHASES: { emoji: string; name: string; from: number; to: number }[] = [
  { emoji: '🌑', name: 'Lua Nova',         from: 337.5, to: 22.5 },
  { emoji: '🌒', name: 'Crescente',        from: 22.5,  to: 67.5 },
  { emoji: '🌓', name: 'Quarto Crescente', from: 67.5,  to: 112.5 },
  { emoji: '🌔', name: 'Gibosa Crescente', from: 112.5, to: 157.5 },
  { emoji: '🌕', name: 'Lua Cheia',        from: 157.5, to: 202.5 },
  { emoji: '🌖', name: 'Gibosa Minguante', from: 202.5, to: 247.5 },
  { emoji: '🌗', name: 'Quarto Minguante', from: 247.5, to: 292.5 },
  { emoji: '🌘', name: 'Minguante',        from: 292.5, to: 337.5 },
];

const SYNODIC_MONTH = 29.530589;
const illum = (a: number) => Math.round((1 - Math.cos(a * Math.PI / 180)) / 2 * 100);

function MoonPhasesSection() {
  return (
    <Section title="Fases da Lua" meta="ciclo de 29,53 dias">
      <Lede>
        A fase é definida pela elongação: o ângulo entre a Lua e o Sol na eclíptica (0° = conjunção,
        180° = oposição). O mês sinódico médio dura 29,53 dias.
      </Lede>
      <Table
        head={['Fase', 'Elongação', 'Iluminação', 'Dia do ciclo']}
        rows={PHASES.map(p => {
          const center = p.from > p.to ? 0 : (p.from + p.to) / 2;
          const lo = illum(p.from), hi = illum(p.to);
          const range = lo === hi ? `${lo}%` : `${Math.min(lo, hi)}–${Math.max(lo, hi)}%`;
          return [
            <span className="ref-nowrap"><span className="ref-glyph">{p.emoji}</span>{p.name}</span>,
            `${p.from}°–${p.to}°`,
            p.name === 'Lua Nova' ? '0–4%' : p.name === 'Lua Cheia' ? '96–100%' : range,
            `≈ ${(center / 360 * SYNODIC_MONTH).toFixed(1)}`,
          ];
        })}
        numeric={[3]}
      />
      <Note>Faixas de 45° usadas pelo app. Iluminação = (1 − cos elongação) / 2.</Note>
    </Section>
  );
}

const NAKSHATRA_DATA: { lord: string; devata: string; symbol: string; gana: string }[] = [
  { lord: 'Ketu',     devata: 'Ashwins',      symbol: 'Cabeça de cavalo',      gana: 'Deva' },
  { lord: 'Vênus',    devata: 'Yama',         symbol: 'Yoni',                  gana: 'Manushya' },
  { lord: 'Sol',      devata: 'Agni',         symbol: 'Lâmina',                gana: 'Rakshasa' },
  { lord: 'Lua',      devata: 'Brahma',       symbol: 'Carroça',               gana: 'Manushya' },
  { lord: 'Marte',    devata: 'Soma',         symbol: 'Cabeça de cervo',       gana: 'Deva' },
  { lord: 'Rahu',     devata: 'Rudra',        symbol: 'Lágrima',               gana: 'Manushya' },
  { lord: 'Júpiter',  devata: 'Aditi',        symbol: 'Aljava',                gana: 'Deva' },
  { lord: 'Saturno',  devata: 'Brihaspati',   symbol: 'Flor',                  gana: 'Deva' },
  { lord: 'Mercúrio', devata: 'Nagas',        symbol: 'Serpente enrolada',     gana: 'Rakshasa' },
  { lord: 'Ketu',     devata: 'Pitrs',        symbol: 'Trono',                 gana: 'Rakshasa' },
  { lord: 'Vênus',    devata: 'Bhaga',        symbol: 'Pés da cama',           gana: 'Manushya' },
  { lord: 'Sol',      devata: 'Aryaman',      symbol: 'Cabeceira da cama',     gana: 'Manushya' },
  { lord: 'Lua',      devata: 'Savitar',      symbol: 'Mão',                   gana: 'Deva' },
  { lord: 'Marte',    devata: 'Vishvakarma',  symbol: 'Pérola',                gana: 'Rakshasa' },
  { lord: 'Rahu',     devata: 'Vayu',         symbol: 'Broto',                 gana: 'Deva' },
  { lord: 'Júpiter',  devata: 'Indra-Agni',   symbol: 'Arco triunfal',         gana: 'Rakshasa' },
  { lord: 'Saturno',  devata: 'Mitra',        symbol: 'Lótus',                 gana: 'Deva' },
  { lord: 'Mercúrio', devata: 'Indra',        symbol: 'Brinco',                gana: 'Rakshasa' },
  { lord: 'Ketu',     devata: 'Nirrti',       symbol: 'Raízes atadas',         gana: 'Rakshasa' },
  { lord: 'Vênus',    devata: 'Apah',         symbol: 'Leque',                 gana: 'Manushya' },
  { lord: 'Sol',      devata: 'Vishvedevas',  symbol: 'Presa de elefante',     gana: 'Manushya' },
  { lord: 'Lua',      devata: 'Vishnu',       symbol: 'Três pegadas',          gana: 'Deva' },
  { lord: 'Marte',    devata: 'Vasus',        symbol: 'Tambor',                gana: 'Rakshasa' },
  { lord: 'Rahu',     devata: 'Varuna',       symbol: 'Círculo vazio',         gana: 'Rakshasa' },
  { lord: 'Júpiter',  devata: 'Aja Ekapada',  symbol: 'Pés do esquife',        gana: 'Manushya' },
  { lord: 'Saturno',  devata: 'Ahir Budhnya', symbol: 'Serpente',              gana: 'Manushya' },
  { lord: 'Mercúrio', devata: 'Pushan',       symbol: 'Peixe',                 gana: 'Deva' },
];

const DASHA: [string, number][] = [
  ['Ketu', 7], ['Vênus', 20], ['Sol', 6], ['Lua', 10], ['Marte', 7],
  ['Rahu', 18], ['Júpiter', 16], ['Saturno', 19], ['Mercúrio', 17],
];

function NakshatrasSection() {
  const span = 360 / 27;
  return (
    <Section title="Nakshatras" meta="27 · 13°20' cada">
      <Lede>
        Divisão védica da eclíptica sideral em 27 partes iguais de 13°20', a partir de 0° Áries sideral.
        Cada nakshatra se divide em 4 padas de 3°20'.
      </Lede>
      <Table
        head={['#', 'Nakshatra', 'Início', 'Regente', 'Devata', 'Símbolo', 'Gana']}
        rows={NAKSHATRAS.map((name, i) => {
          const n = NAKSHATRA_DATA[i];
          return [i + 1, <span className="ref-hl">{name}</span>, <Lon deg={i * span} />, n.lord, n.devata, n.symbol, n.gana];
        })}
        numeric={[0]}
      />
      <Defs items={[
        ['Regente', 'Planeta (graha) associado; Rahu e Ketu são os nodos lunares.'],
        ['Gana', 'Classificação tradicional em três grupos: Deva, Manushya, Rakshasa.'],
        ['Pada', "Quarto de nakshatra (3°20'), associado a um signo da divisão Navamsha."],
      ]} />
      <Sub>Vimshottari Dasha</Sub>
      <Lede>
        Sistema de períodos planetários com ciclo total de 120 anos. A sequência começa pelo regente
        do nakshatra ocupado pela Lua no momento de referência.
      </Lede>
      <Table
        head={['Regente', 'Anos', 'Nakshatras']}
        rows={DASHA.map(([lord, years]) => [
          lord, years,
          <span className="ref-muted">{NAKSHATRAS.filter((_, i) => NAKSHATRA_DATA[i].lord === lord).join(', ')}</span>,
        ])}
        numeric={[1]}
      />
      <Note>No app, o nakshatra é calculado com ayanamsa Lahiri, independente do sistema zodiacal selecionado.</Note>
    </Section>
  );
}

function ManazilSection() {
  const span = 360 / 28;
  return (
    <Section title="Manazil (mansões árabes)" meta="28 · 12°51' cada">
      <Lede>
        Divisão da eclíptica em 28 partes iguais de 12°51'26", próximo ao deslocamento diário médio da
        Lua. Origem na astronomia árabe; registrada no Picatrix e em Agrippa.
      </Lede>
      <Table
        head={['#', 'Manzil', 'Tradução', 'Início']}
        rows={MANAZIL.map((m, i) => [i + 1, <span className="ref-hl">{m.name}</span>, m.meaning, <Lon deg={i * span} />])}
        numeric={[0]}
      />
      <Note>No app, as manazil são medidas no zodíaco tropical a partir de 0° Áries, independente do sistema selecionado.</Note>
    </Section>
  );
}

function PlanetaryHoursSection() {
  return (
    <Section title="Dias e horas planetárias" meta="ordem caldaica">
      <Defs items={[
        ['Dia planetário', 'Do nascer do sol ao nascer do sol seguinte.'],
        ['Horas diurnas', '12 partes iguais entre o nascer e o pôr do sol.'],
        ['Horas noturnas', '12 partes iguais entre o pôr do sol e o nascer seguinte.'],
        ['Duração', 'Variável: depende da data e da latitude. Horas diurnas e noturnas só são iguais nos equinócios.'],
        ['1ª hora', 'Regida pelo regente do dia.'],
        ['Sequência', (
          <>
            Ordem caldaica:{' '}
            {CHALDEAN_ORDER.map((p, i) => (
              <React.Fragment key={p}>
                {i > 0 && ' → '}
                <span className="astro-glyph" style={{ color: PLANET_COLORS[p] }}>{PLANET_GLYPHS[p]}</span>
              </React.Fragment>
            ))}
          </>
        )],
      ]} />
      <Table
        head={['Dia', 'Regente', 'Paleta do app']}
        rows={DAY_RULERS.map((p, wd) => {
          const pal = DAY_PALETTES[wd];
          return [
            WEEKDAY_NAMES_PT[wd],
            <Planet name={p} />,
            <span className="ref-nowrap">
              <span className="ref-swatch" style={{ background: pal.accent, borderColor: pal.partner }} />
              <span className="ref-muted">{pal.name}</span>
            </span>,
          ];
        })}
      />
      <Note>A ordem dos dias da semana resulta de avançar 24 horas na sequência caldaica a partir de cada regente.</Note>
    </Section>
  );
}

function ZodiacSystemsSection() {
  const now = new Date();
  const ayan = calculateLahiriAyanamsa(now);
  const deg = Math.floor(ayan);
  const min = Math.round((ayan - deg) * 60);
  return (
    <Section title="Zodíaco tropical e sideral" meta={`ayanamsa hoje ${deg}°${String(min).padStart(2, '0')}'`}>
      <Defs items={[
        ['Tropical', '0° Áries = ponto vernal (equinócio de março). Referência: equador celeste e estações.'],
        ['Sideral', '0° Áries definido em relação às estrelas fixas. Referência: fundo estelar.'],
        ['Precessão', 'Movimento do eixo terrestre que desloca o ponto vernal ≈ 50,3" por ano (≈ 1°23\' por século; ciclo ≈ 25.770 anos).'],
        ['Ayanamsa', 'Diferença entre as longitudes tropical e sideral. Sideral = tropical − ayanamsa.'],
        ['Lahiri', 'Ayanamsa padrão oficial da Índia (1955), ancorado em Spica (Chitra) a 0° Libra sideral.'],
        ['Valor atual', `${ayan.toFixed(4)}° (${deg}°${String(min).padStart(2, '0')}') em ${now.toLocaleDateString('pt-BR')}.`],
      ]} />
      <Note>Fórmula usada no app: ayanamsa = 23,85° + 1,3972° × T, com T em séculos julianos desde J2000.0.</Note>
    </Section>
  );
}

const RETRO: [string, string, string][] = [
  ['Mercury', '≈ 3 semanas', '3–4 vezes por ano'],
  ['Venus',   '≈ 6 semanas', 'a cada ≈ 19 meses'],
  ['Mars',    '≈ 2–2,5 meses', 'a cada ≈ 26 meses'],
  ['Jupiter', '≈ 4 meses',   'anual'],
  ['Saturn',  '≈ 4,5 meses', 'anual'],
  ['Uranus',  '≈ 5 meses',   'anual'],
  ['Neptune', '≈ 5 meses',   'anual'],
  ['Pluto',   '≈ 5–6 meses', 'anual'],
];

function RetrogradeSection() {
  return (
    <Section title="Retrogradação" meta="℞">
      <Lede>
        Movimento aparente para oeste (longitude decrescente) visto da Terra, causado pela diferença de
        velocidade orbital entre a Terra e o planeta. Sol e Lua não retrogradam.
      </Lede>
      <Table
        head={['Planeta', 'Duração', 'Frequência']}
        rows={RETRO.map(([p, d, f]) => [<Planet name={p} />, d, f])}
      />
      <Note>No app: um planeta é marcado ℞ quando sua longitude diminui entre o instante do mapa e 24 h depois.</Note>
    </Section>
  );
}

function PointsSection() {
  return (
    <Section title="Pontos, casas e decanatos" meta="definições do app">
      <Sub>Pontos calculados</Sub>
      <Defs items={[
        [<Planet name="Chiron" />, 'Corpo menor (centauro) descoberto em 1977, órbita entre Saturno e Urano, período ≈ 50,4 anos. Posição aproximada por elementos orbitais (erro de alguns graus).'],
        [<Planet name="Lilith" />, 'Apogeu médio da órbita lunar (Lua Negra média). Ciclo ≈ 8,85 anos.'],
        [<Planet name="NorthNode" />, 'Nodo ascendente médio: interseção da órbita lunar com a eclíptica. Movimento retrógrado, ciclo ≈ 18,6 anos.'],
        [<Planet name="SouthNode" />, 'Nodo descendente: oposto ao Nodo Norte (+180°).'],
        [<Planet name="Vertex" />, 'Interseção da eclíptica com o primeiro vertical, no lado oeste.'],
      ]} />
      <Sub>Casas</Sub>
      <Defs items={[
        ['Sistema', 'Casas iguais: 12 casas de 30° a partir do grau do Ascendente.'],
        ['Hemisférios', 'Acima do horizonte: casas 7–12. Abaixo: 1–6. Leste: 10–3. Oeste: 4–9.'],
      ]} />
      <Sub>Decanatos</Sub>
      <Defs items={[
        ['1º', "0°00'–9°59' do signo. Regente: o próprio signo."],
        ['2º', "10°00'–19°59'. Regente: próximo signo do mesmo elemento."],
        ['3º', "20°00'–29°59'. Regente: terceiro signo do mesmo elemento."],
      ]} />
      <Note>Atribuição de regentes por triplicidade. Existe também o sistema caldeu (faces), não usado no app.</Note>
    </Section>
  );
}

function TattwasSection() {
  return (
    <Section title="Tattwas" meta="ciclo de 120 min">
      <Lede>Cinco elementos do sistema tântrico, em ciclo contínuo contado a partir do nascer do sol.</Lede>
      <Table
        head={['Ordem', 'Tattwa', 'Elemento', 'Duração']}
        rows={[
          ['1', 'Akasha', 'Éter', '24 min'],
          ['2', 'Vayu', 'Ar', '24 min'],
          ['3', 'Tejas', 'Fogo', '24 min'],
          ['4', 'Prithvi', 'Terra', '24 min'],
          ['5', 'Apas', 'Água', '24 min'],
        ]}
        numeric={[0]}
      />
      <Defs items={[
        ['Ciclo', '5 × 24 min = 120 min, repetido 12 vezes por dia.'],
        ['Sub-tattwa', 'Cada tattwa se divide em 5 sub-tattwas de 4,8 min, na mesma ordem.'],
      ]} />
      <Note>
        Sequência conforme Swami Satyananda Saraswati (Tattwa Shuddhi). Outras linhagens usam
        ordenações diferentes.
      </Note>
    </Section>
  );
}

/* ════════════════ Página ════════════════ */

const ReferencePage: React.FC = () => (
  <IonPage>
    <AppHeader title="Referência" />
    <IonContent fullscreen className="app-content">
      <div className="ref-list">
        <SignsSection />
        <DignitiesSection />
        <AspectsSection />
        <MoonPhasesSection />
        <NakshatrasSection />
        <ManazilSection />
        <PlanetaryHoursSection />
        <ZodiacSystemsSection />
        <RetrogradeSection />
        <PointsSection />
        <TattwasSection />
      </div>
      <div className="app-bottom-spacer" />
    </IonContent>
  </IonPage>
);

export default ReferencePage;
