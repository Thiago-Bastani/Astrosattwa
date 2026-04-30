import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { ZODIAC_SIGNS, PLANET_GLYPHS, PLANET_COLORS, DIGNITY_TABLE } from '../utils/zodiac';
import { PLANET_NAMES_PT, SIGN_NAMES_PT } from '../utils/astroLabels';
import { ZODIAC_SVG_PATHS } from '../utils/zodiacSvgPaths';
import './ReferencePage.css';

const ELEMENT_NAMES: Record<string, { pt: string; color: string }> = {
  fire:  { pt: 'Fogo',  color: '#e74c3c' },
  earth: { pt: 'Terra', color: '#27ae60' },
  air:   { pt: 'Ar',    color: '#f1c40f' },
  water: { pt: 'Água',  color: '#3498db' },
};

const OPPOSITES: [string, string][] = [
  ['Sun', 'Saturn'],
  ['Moon', 'Saturn'],
  ['Mercury', 'Jupiter'],
  ['Venus', 'Mars'],
  ['Jupiter', 'Mercury'],
  ['Saturn', 'Sun'],
];

function SignSvgGlyph({ name, color, size = 14 }: { name: string; color: string; size?: number }) {
  const path = ZODIAC_SVG_PATHS[name];
  if (!path) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ verticalAlign: 'middle', marginRight: 2, flexShrink: 0 }}>
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SignLabel({ names, color }: { names: string[]; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {names.map((n, i) => (
        <React.Fragment key={n}>
          {i > 0 && <span style={{ marginRight: 2 }}>,</span>}
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
            <SignSvgGlyph name={n} color={color} size={14} />
            <span>{SIGN_NAMES_PT[n] || n}</span>
          </span>
        </React.Fragment>
      ))}
    </span>
  );
}

/* ── Tabela de Regências ── */
function RulershipsCard() {
  const planetKeys = Object.keys(DIGNITY_TABLE);
  return (
    <IonCard className="ref-card">
      <IonCardHeader>
        <IonCardTitle className="ref-card-title">Tabela de Regências</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="ref-table-wrap">
          <table className="ref-table">
            <thead>
              <tr>
                <th>Planeta</th>
                <th>Domicílio</th>
                <th>Exaltação</th>
                <th>Queda</th>
                <th>Exílio</th>
              </tr>
            </thead>
            <tbody>
              {planetKeys.map(p => {
                const d = DIGNITY_TABLE[p];
                return (
                  <tr key={p}>
                    <td style={{ color: PLANET_COLORS[p] }}>
                      {PLANET_GLYPHS[p]} {PLANET_NAMES_PT[p]}
                    </td>
                    <td style={{ color: '#2ecc71' }}><SignLabel names={d.domicilio} color="#2ecc71" /></td>
                    <td style={{ color: '#f1c40f' }}><SignLabel names={d.exaltacao} color="#f1c40f" /></td>
                    <td style={{ color: '#e74c3c' }}><SignLabel names={d.queda} color="#e74c3c" /></td>
                    <td style={{ color: '#95a5a6' }}><SignLabel names={d.exilio} color="#95a5a6" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </IonCardContent>
    </IonCard>
  );
}

/* ── Elementos ── */
function ElementsCard() {
  const elements = ['fire', 'earth', 'air', 'water'] as const;
  return (
    <IonCard className="ref-card">
      <IonCardHeader>
        <IonCardTitle className="ref-card-title">Elementos</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {elements.map(el => {
          const info = ELEMENT_NAMES[el];
          const signs = ZODIAC_SIGNS.filter(s => s.element === el);
          return (
            <div key={el} className="element-row" style={{ borderLeftColor: info.color }}>
              <span className="element-name" style={{ color: info.color }}>{info.pt}</span>
              <span className="element-signs">
                {signs.map(s => (
                  <span key={s.name} className="element-sign-chip" style={{ color: info.color, borderColor: `${info.color}44`, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <SignSvgGlyph name={s.name} color={info.color} size={13} />
                    {SIGN_NAMES_PT[s.name]}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </IonCardContent>
    </IonCard>
  );
}

/* ── Planetas Opostos ── */
function OppositesCard() {
  return (
    <IonCard className="ref-card">
      <IonCardHeader>
        <IonCardTitle className="ref-card-title">Planetas Opostos</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <div className="ref-table-wrap">
          <table className="ref-table">
            <thead>
              <tr><th>Planeta</th><th></th><th>Oposto</th></tr>
            </thead>
            <tbody>
              {OPPOSITES.map(([a, b], i) => (
                <tr key={i}>
                  <td style={{ color: PLANET_COLORS[a] }}>
                    {PLANET_GLYPHS[a]} {PLANET_NAMES_PT[a]}
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>{'\u260D'}</td>
                  <td style={{ color: PLANET_COLORS[b] }}>
                    {PLANET_GLYPHS[b]} {PLANET_NAMES_PT[b]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </IonCardContent>
    </IonCard>
  );
}

/* ── Aspectos ── */
const ASPECT_INFO: { name: string; angle: number; glyph: string; color: string; element: string; rhythm: string; description: string }[] = [
  {
    name: 'Conjunção', angle: 0, glyph: '\u260C', color: '#f1c40f',
    element: 'Mesmo elemento', rhythm: 'Mesmo ritmo',
    description: 'Fusão de energias planetárias. Intensifica as qualidades dos planetas envolvidos, podendo ser harmônica ou tensa dependendo dos planetas.',
  },
  {
    name: 'Semi-sextil', angle: 30, glyph: '\u26BA', color: '#95a5a6',
    element: 'Elemento diferente', rhythm: 'Ritmo diferente',
    description: 'Conexão sutil entre signos vizinhos. Ligação suave que pede atenção e refinamento consciente para integrar energias de naturezas distintas.',
  },
  {
    name: 'Sextil', angle: 60, glyph: '\u26B9', color: '#3498db',
    element: 'Elemento diferente (compatível)', rhythm: 'Mesmo ritmo',
    description: 'Aspecto harmonioso que cria oportunidades. Conecta signos de elementos compatíveis (Fogo↔Ar, Terra↔Água). Indica talentos naturais e habilidades que fluem com facilidade.',
  },
  {
    name: 'Quadratura', angle: 90, glyph: '\u25A1', color: '#e74c3c',
    element: 'Elemento diferente (incompatível)', rhythm: 'Mesmo ritmo',
    description: 'Tensão e desafio entre planetas do mesmo ritmo mas de elementos conflitantes. Gera fricção que motiva a ação e a superação de obstáculos. É o aspecto do crescimento através do esforço.',
  },
  {
    name: 'Trígono', angle: 120, glyph: '\u25B3', color: '#2ecc71',
    element: 'Mesmo elemento', rhythm: 'Ritmo diferente',
    description: 'Grande harmonia e fluxo natural de energia. Conecta signos do mesmo elemento mas de ritmos diferentes. Os planetas cooperam facilmente, trazendo dons inatos e facilidade.',
  },
  {
    name: 'Quincúncio', angle: 150, glyph: '\u26BB', color: '#95a5a6',
    element: 'Elemento diferente', rhythm: 'Ritmo diferente',
    description: 'Aspecto de ajuste e adaptação constante. Conecta signos sem afinidade de elemento nem de ritmo, exigindo esforço consciente para integrar energias aparentemente incompatíveis.',
  },
  {
    name: 'Oposição', angle: 180, glyph: '\u260D', color: '#e74c3c',
    element: 'Elemento diferente (compatível)', rhythm: 'Mesmo ritmo',
    description: 'Polaridade e confronto entre forças opostas. Conecta signos de elementos compatíveis mas em polaridades opostas. Exige equilíbrio e integração dos opostos.',
  },
];

function AspectsCard() {
  return (
    <IonCard className="ref-card">
      <IonCardHeader>
        <IonCardTitle className="ref-card-title">Aspectos Planetários</IonCardTitle>
      </IonCardHeader>
      <IonCardContent className="general-info">
        {ASPECT_INFO.map(a => (
          <div key={a.name} className="info-section" style={{ borderLeft: `3px solid ${a.color}`, paddingLeft: 10 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: a.color, fontSize: '1.1rem' }}>{a.glyph}</span>
              <span>{a.name}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 'normal' }}>
                ({a.angle}°)
              </span>
            </h4>
            <div style={{ display: 'flex', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4,
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {a.element}
              </span>
              <span style={{
                fontSize: '0.68rem', padding: '1px 6px', borderRadius: 4,
                background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}>
                {a.rhythm}
              </span>
            </div>
            <p>{a.description}</p>
          </div>
        ))}
      </IonCardContent>
    </IonCard>
  );
}

/* ── Fases da Lua ── */
const MOON_PHASE_INFO: { emoji: string; name: string; angle: string; description: string }[] = [
  { emoji: '🌑', name: 'Lua Nova',          angle: '0°',       description: 'Sol e Lua estão alinhados. Início de ciclo, momento de intenções, semear projetos. A Lua não é visível.' },
  { emoji: '🌒', name: 'Crescente',         angle: '0°–90°',   description: 'A Lua começa a iluminar seu lado direito. Fase de impulso, primeiros passos, entusiasmo e ação inicial.' },
  { emoji: '🌓', name: 'Quarto Crescente',  angle: '90°',      description: 'Exatamente metade iluminada. Fase de decisão e esforço. Superar obstáculos para continuar o caminho iniciado na Lua Nova.' },
  { emoji: '🌔', name: 'Gibosa Crescente',  angle: '90°–180°', description: 'Fase de refinamento. O que foi plantado ganha forma. Aperfeiçoamento, análise e preparação para a culminação.' },
  { emoji: '🌕', name: 'Lua Cheia',         angle: '180°',     description: 'Sol e Lua em oposição. Máxima iluminação e visibilidade. Revelações, completude, intensidade emocional e colheita.' },
  { emoji: '🌖', name: 'Gibosa Minguante',  angle: '180°–270°', description: 'Fase de gratidão e compartilhamento. Distribuir o que foi conquistado. Generosidade e transmissão de conhecimento.' },
  { emoji: '🌗', name: 'Quarto Minguante',  angle: '270°',     description: 'Novamente metade iluminada, agora minguando. Fase de crise de consciência, reorientação e liberação do que não serve.' },
  { emoji: '🌘', name: 'Minguante',         angle: '270°–360°', description: 'Fase de recolhimento, descanso e integração. Soltar, perdoar e preparar o terreno para o novo ciclo que se aproxima.' },
];

function MoonPhasesCard() {
  return (
    <IonCard className="ref-card">
      <IonCardHeader>
        <IonCardTitle className="ref-card-title">Fases da Lua</IonCardTitle>
      </IonCardHeader>
      <IonCardContent className="general-info">
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', marginBottom: 12 }}>
          A fase lunar é determinada pelo ângulo entre o Sol e a Lua (elongação). O ciclo completo dura aproximadamente 29,5 dias.
        </p>
        {MOON_PHASE_INFO.map(p => (
          <div key={p.name} className="info-section" style={{ borderLeft: '3px solid rgba(201,168,76,0.4)', paddingLeft: 10 }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>{p.emoji}</span>
              <span>{p.name}</span>
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', fontWeight: 'normal' }}>{p.angle}</span>
            </h4>
            <p>{p.description}</p>
          </div>
        ))}
      </IonCardContent>
    </IonCard>
  );
}

/* ── Mansões Lunares (Nakshatras) ── */
const NAKSHATRA_DATA: { name: string; lord: string; devata: string; symbol: string; gana: 'Deva' | 'Manushya' | 'Rakshasa'; sign: string }[] = [
  { name: 'Ashwini',           lord: 'Ketu',     devata: 'Ashwins',       symbol: 'Cabeça de cavalo',      gana: 'Deva',      sign: 'Áries'        },
  { name: 'Bharani',           lord: 'Vênus',    devata: 'Yama',          symbol: 'Yoni',                  gana: 'Manushya',  sign: 'Áries'        },
  { name: 'Krittika',          lord: 'Sol',      devata: 'Agni',          symbol: 'Lâmina / chama',        gana: 'Rakshasa',  sign: 'Áries/Touro'  },
  { name: 'Rohini',            lord: 'Lua',      devata: 'Brahma',        symbol: 'Carroça',               gana: 'Manushya',  sign: 'Touro'        },
  { name: 'Mrigashira',        lord: 'Marte',    devata: 'Soma',          symbol: 'Cabeça de cervo',       gana: 'Deva',      sign: 'Touro/Gêm.'   },
  { name: 'Ardra',             lord: 'Rahu',     devata: 'Rudra',         symbol: 'Lágrima / diamante',    gana: 'Manushya',  sign: 'Gêmeos'       },
  { name: 'Punarvasu',         lord: 'Júpiter',  devata: 'Aditi',         symbol: 'Aljava de flechas',     gana: 'Deva',      sign: 'Gêm./Câncer'  },
  { name: 'Pushya',            lord: 'Saturno',  devata: 'Brihaspati',    symbol: 'Flor / círculo',        gana: 'Deva',      sign: 'Câncer'       },
  { name: 'Ashlesha',          lord: 'Mercúrio', devata: 'Nagas',         symbol: 'Serpente enrolada',     gana: 'Rakshasa',  sign: 'Câncer'       },
  { name: 'Magha',             lord: 'Ketu',     devata: 'Pitrs',         symbol: 'Trono / palanquim',     gana: 'Rakshasa',  sign: 'Leão'         },
  { name: 'Purva Phalguni',    lord: 'Vênus',    devata: 'Bhaga',         symbol: 'Pés da cama',           gana: 'Manushya',  sign: 'Leão'         },
  { name: 'Uttara Phalguni',   lord: 'Sol',      devata: 'Aryaman',       symbol: 'Cabeceira da cama',     gana: 'Manushya',  sign: 'Leão/Virgem'  },
  { name: 'Hasta',             lord: 'Lua',      devata: 'Savitar',       symbol: 'Mão aberta',            gana: 'Deva',      sign: 'Virgem'       },
  { name: 'Chitra',            lord: 'Marte',    devata: 'Vishvakarma',   symbol: 'Pérola brilhante',      gana: 'Rakshasa',  sign: 'Virgem/Libra' },
  { name: 'Swati',             lord: 'Rahu',     devata: 'Vayu',          symbol: 'Broto ao vento',        gana: 'Deva',      sign: 'Libra'        },
  { name: 'Vishakha',          lord: 'Júpiter',  devata: 'Indra & Agni',  symbol: 'Arco do triunfo',       gana: 'Rakshasa',  sign: 'Libra/Escor.' },
  { name: 'Anuradha',          lord: 'Saturno',  devata: 'Mitra',         symbol: 'Lótus',                 gana: 'Deva',      sign: 'Escorpião'    },
  { name: 'Jyeshtha',          lord: 'Mercúrio', devata: 'Indra',         symbol: 'Brinco / guarda-chuva', gana: 'Rakshasa',  sign: 'Escorpião'    },
  { name: 'Mula',              lord: 'Ketu',     devata: 'Nirrti',        symbol: 'Raízes atadas',         gana: 'Rakshasa',  sign: 'Sagitário'    },
  { name: 'Purva Ashadha',     lord: 'Vênus',    devata: 'Apah',          symbol: 'Leque / cesto',         gana: 'Manushya',  sign: 'Sagitário'    },
  { name: 'Uttara Ashadha',    lord: 'Sol',      devata: 'Vishvedevas',   symbol: 'Presa de elefante',     gana: 'Manushya',  sign: 'Sag./Capric.' },
  { name: 'Shravana',          lord: 'Lua',      devata: 'Vishnu',        symbol: 'Três pegadas',          gana: 'Deva',      sign: 'Capricórnio'  },
  { name: 'Dhanishtha',        lord: 'Marte',    devata: 'Vasus',         symbol: 'Tambor / flauta',       gana: 'Rakshasa',  sign: 'Capric./Aqu.' },
  { name: 'Shatabhisha',       lord: 'Rahu',     devata: 'Varuna',        symbol: 'Círculo vazio',         gana: 'Rakshasa',  sign: 'Aquário'      },
  { name: 'Purva Bhadrapada',  lord: 'Júpiter',  devata: 'Aja Ekapada',   symbol: 'Pés do caixão',         gana: 'Manushya',  sign: 'Aqu./Peixes'  },
  { name: 'Uttara Bhadrapada', lord: 'Saturno',  devata: 'Ahir Budhnya',  symbol: 'Cobra das profundezas', gana: 'Manushya',  sign: 'Peixes'       },
  { name: 'Revati',            lord: 'Mercúrio', devata: 'Pushan',        symbol: 'Peixe / tambor',        gana: 'Deva',      sign: 'Peixes'       },
];

const LORD_COLORS: Record<string, string> = {
  'Sol':      '#f1c40f',
  'Lua':      '#b0c4de',
  'Marte':    '#e74c3c',
  'Mercúrio': '#2ecc71',
  'Júpiter':  '#e67e22',
  'Vênus':    '#3498db',
  'Saturno':  '#95a5a6',
  'Rahu':     '#9b59b6',
  'Ketu':     '#c0392b',
};

const GANA_COLORS: Record<string, string> = {
  'Deva':      '#2ecc71',
  'Manushya':  '#f1c40f',
  'Rakshasa':  '#e74c3c',
};

const DASHA_YEARS: Record<string, number> = {
  'Ketu': 7, 'Vênus': 20, 'Sol': 6, 'Lua': 10, 'Marte': 7,
  'Rahu': 18, 'Júpiter': 16, 'Saturno': 19, 'Mercúrio': 17,
};

function LunarMansionsCard() {
  return (
    <IonCard className="ref-card">
      <IonCardHeader>
        <IonCardTitle className="ref-card-title">Mansões Lunares — Nakshatras</IonCardTitle>
      </IonCardHeader>
      <IonCardContent className="general-info">

        <div className="info-section" style={{ borderLeft: '3px solid rgba(201,168,76,0.4)', paddingLeft: 10 }}>
          <p>
            No Jyotish (astrologia védica), os <strong>Nakshatras</strong> são a espinha dorsal do sistema. Enquanto os 12 signos descrevem qualidades gerais, os 27 Nakshatras revelam a <em>natureza específica</em> da energia em cada grau do céu, com muito mais precisão e profundidade.
          </p>
          <p>
            Cada Nakshatra possui um <strong>Graha Swami</strong> (planeta regente), uma <strong>Devata</strong> (deidade presidindo sua energia), um <strong>símbolo</strong> que condensa seu significado arquetípico e um <strong>Gana</strong> (natureza):
          </p>
          <p>
            <span style={{ color: GANA_COLORS['Deva'] }}>● Deva</span> — natureza divina, elevada, altruísta.{'  '}
            <span style={{ color: GANA_COLORS['Manushya'] }}>● Manushya</span> — natureza humana, equilibrada.{'  '}
            <span style={{ color: GANA_COLORS['Rakshasa'] }}>● Rakshasa</span> — natureza intensa, transformadora.
          </p>
        </div>

        <div className="ref-table-wrap">
          <table className="ref-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Nakshatra</th>
                <th>Regente</th>
                <th>Devata</th>
                <th>Símbolo</th>
                <th>Gana</th>
                <th>Signo</th>
              </tr>
            </thead>
            <tbody>
              {NAKSHATRA_DATA.map((n, i) => (
                <tr key={n.name}>
                  <td style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem' }}>{i + 1}</td>
                  <td style={{ color: '#c9a84c' }}>{n.name}</td>
                  <td style={{ color: LORD_COLORS[n.lord] ?? '#fff' }}>{n.lord}</td>
                  <td style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.78rem' }}>{n.devata}</td>
                  <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontStyle: 'italic' }}>{n.symbol}</td>
                  <td style={{ color: GANA_COLORS[n.gana], fontSize: '0.75rem' }}>{n.gana}</td>
                  <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{n.sign}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="info-section" style={{ borderLeft: '3px solid #9b59b6', paddingLeft: 10, marginTop: 16 }}>
          <h4 style={{ color: '#9b59b6' }}>Vimshottari Dasha — O Tempo Regido pelos Nakshatras</h4>
          <p>
            O sistema <strong>Vimshottari Dasha</strong> é o método preditivo mais usado no Jyotish. Cada planeta rege um período de vida cujo início é determinado pelo <strong>Nakshatra da Lua natal</strong>. O ciclo completo dura 120 anos.
          </p>
          <div className="ref-table-wrap">
            <table className="ref-table">
              <thead>
                <tr><th>Planeta</th><th>Anos</th><th>Nakshatras que ativa</th></tr>
              </thead>
              <tbody>
                {Object.entries(DASHA_YEARS).map(([planet, years]) => {
                  const naks = NAKSHATRA_DATA.filter(n => n.lord === planet).map(n => n.name).join(', ');
                  return (
                    <tr key={planet}>
                      <td style={{ color: LORD_COLORS[planet] ?? '#fff' }}>{planet}</td>
                      <td style={{ color: 'rgba(255,255,255,0.6)' }}>{years}</td>
                      <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>{naks}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="info-section" style={{ borderLeft: '3px solid rgba(201,168,76,0.4)', paddingLeft: 10 }}>
          <h4>Outras aplicações védicas dos Nakshatras</h4>
          <p><strong>Muhurta</strong> — escolha de momentos auspiciosos para iniciar atividades importantes (casamento, viagem, negócios) com base no Nakshatra da Lua do dia.</p>
          <p><strong>Compatibilidade (Kuta)</strong> — no casamento védico, compara-se o Nakshatra natal dos dois cônjuges em 8 categorias (Ashta Kuta) que avaliam saúde, prosperidade, filhos e harmonia.</p>
          <p><strong>Pada</strong> — cada Nakshatra é subdividido em 4 padas de 3°20', associados aos signos Navamsha, dando ainda mais precisão à análise natal.</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontStyle: 'italic', marginTop: 8 }}>
            A mansão exibida no mapa é sempre calculada com o ayanamsa Lahiri (longitude sideral real da Lua), independente do sistema zodiacal selecionado.
          </p>
        </div>

      </IonCardContent>
    </IonCard>
  );
}

/* ── Sideral vs. Tropical ── */
function ZodiacSystemsCard() {
  return (
    <IonCard className="ref-card">
      <IonCardHeader>
        <IonCardTitle className="ref-card-title">Zodíaco Sideral vs. Tropical</IonCardTitle>
      </IonCardHeader>
      <IonCardContent className="general-info">
        <div className="info-section" style={{ borderLeft: '3px solid #3498db', paddingLeft: 10 }}>
          <h4 style={{ color: '#3498db' }}>Zodíaco Tropical</h4>
          <p>Baseia-se nas estações do ano. O ponto 0° de Áries é fixado no equinócio vernal (momento em que o Sol cruza o equador celeste em direção ao norte), independentemente da posição real das estrelas.</p>
          <p>É o sistema predominante na astrologia ocidental moderna. Reflete os ciclos sazonais da Terra e a relação do Sol com o planeta.</p>
        </div>
        <div className="info-section" style={{ borderLeft: '3px solid #e67e22', paddingLeft: 10 }}>
          <h4 style={{ color: '#e67e22' }}>Zodíaco Sideral</h4>
          <p>Baseia-se na posição <em>real</em> dos astros em relação às estrelas fixas. O ponto 0° de Áries é alinhado com a constelação de Áries no céu.</p>
          <p>É o sistema do Jyotish (astrologia védica indiana) e da astrologia helenística clássica. Reflete as posições astronômicas efetivas dos planetas.</p>
        </div>
        <div className="info-section" style={{ borderLeft: '3px solid #c9a84c', paddingLeft: 10 }}>
          <h4 style={{ color: '#c9a84c' }}>Ayanamsa — a diferença entre os dois</h4>
          <p>Devido à <strong>precessão dos equinócios</strong> — um lento giro do eixo terrestre com período de ~26.000 anos — o equinócio vernal se desloca gradualmente em relação às estrelas fixas. Esse deslocamento acumulado é chamado de <strong>ayanamsa</strong>.</p>
          <p>Há cerca de 2.000 anos os dois zodíacos coincidiam. Hoje o ayanamsa é de aproximadamente <span style={{ color: '#c9a84c' }}>24°</span> e cresce ~1,4° por século.</p>
          <p>Para converter tropical → sideral basta subtrair o ayanamsa da longitude tropical. Um planeta em 10° de Touro tropical estará em ~16° de Áries sideral.</p>
        </div>
        <div className="info-section" style={{ borderLeft: '3px solid #9b59b6', paddingLeft: 10 }}>
          <h4 style={{ color: '#9b59b6' }}>Ayanamsa Lahiri (Chitrapaksha)</h4>
          <p>Existem dezenas de sistemas de ayanamsa. Este app utiliza o <strong>Lahiri</strong>, adotado oficialmente pelo governo indiano desde 1955 como padrão nacional para o Panchanga (calendário védico).</p>
          <p>Ele é baseado na posição da estrela <strong>Spica (Chitra)</strong>, que define 0° de Libra sideral. É o ayanamsa mais amplamente utilizado no Jyotish contemporâneo.</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontStyle: 'italic' }}>
            Fórmula usada: ayanamsa = 23,85° + 1,3972° × T, onde T são séculos julianos a partir de J2000.0.
          </p>
        </div>
      </IonCardContent>
    </IonCard>
  );
}

/* ── Informações Gerais ── */
function GeneralInfoCard() {
  return (
    <IonCard className="ref-card">
      <IonCardHeader>
        <IonCardTitle className="ref-card-title">Informações Gerais</IonCardTitle>
      </IonCardHeader>
      <IonCardContent className="general-info">
        <div className="info-section">
          <h4>Dignidades Planetárias</h4>
          <p><span style={{ color: '#2ecc71' }}>Domicílio</span> — O planeta está no signo que rege. Expressa-se com naturalidade e força.</p>
          <p><span style={{ color: '#f1c40f' }}>Exaltação</span> — O planeta está em um signo que potencializa suas qualidades.</p>
          <p><span style={{ color: '#e74c3c' }}>Queda</span> — O planeta está no signo oposto à exaltação. Suas qualidades ficam enfraquecidas.</p>
          <p><span style={{ color: '#95a5a6' }}>Exílio</span> — O planeta está no signo oposto ao domicílio. Expressa-se com dificuldade.</p>
        </div>
        <div className="info-section">
          <h4>Decanatos</h4>
          <p>Cada signo de 30° é dividido em 3 decanatos de 10°:</p>
          <p><strong>1° Decanato</strong> (0°–9°) — Regido pelo próprio signo.</p>
          <p><strong>2° Decanato</strong> (10°–19°) — Regido pelo próximo signo do mesmo elemento.</p>
          <p><strong>3° Decanato</strong> (20°–29°) — Regido pelo último signo do mesmo elemento.</p>
        </div>
        <div className="info-section">
          <h4>Retrogradação</h4>
          <p>Quando um planeta parece se mover na direção contrária no céu (movimento aparente). Indica revisão, introspecção e reavaliação das áreas regidas pelo planeta. Indicado pelo símbolo <span style={{ color: '#e74c3c' }}>℞</span>.</p>
        </div>
        <div className="info-section">
          <h4>Pontos Especiais</h4>
          <p><strong>Quíron ⚷</strong> — O "curador ferido". Asteroide que representa nossas feridas mais profundas e o potencial de cura que nasce delas. Indica onde podemos ajudar os outros através da nossa própria experiência de dor.</p>
          <p><strong>Lilith (Lua Negra)</strong> — O apogeu lunar médio. Representa desejos inconscientes e aspectos ocultos da personalidade.</p>
          <p><strong>Nodo Norte ☊</strong> — O caminho kármico de evolução. Indica o que devemos desenvolver nesta vida.</p>
          <p><strong>Nodo Sul ☋</strong> — Habilidades trazidas de vidas passadas. Zona de conforto a ser transcendida.</p>
          <p><strong>Vertex</strong> — Ponto de encontros fatídicos. Associado a eventos e pessoas que entram em nossa vida de forma inesperada.</p>
        </div>
        <div className="info-section">
          <h4>Tattwas</h4>
          <p>Os Tattwas são os 5 elementos sutis do sistema tântrico. No App, o ciclo se inicia ao nascer do sol e cada Tattwa dura 24 minutos, totalizando um ciclo de 120 minutos que se repete continuamente:</p>
          <p><strong>Akasha</strong> (Éter) → <strong>Vayu</strong> (Ar) → <strong>Tejas</strong> (Fogo) → <strong>Prithvi</strong> (Terra) → <strong>Apas</strong> (Água)</p>
          <p>Cada Tattwa principal contém 5 sub-tattwas de 4,8 minutos cada, na mesma sequência.</p>
          <p style={{ color: '#c9a84c', fontSize: '0.75rem', marginTop: 8, fontStyle: 'italic' }}>
            OBS.: A sequência dos Tattwas utilizada neste App segue a tradição de Swami Satyananda Saraswati (Tattwa Shuddhi), baseada na ordem de emanação cosmológica do Samkhya. Outras linhagens podem usar ordenações diferentes.
          </p>
        </div>
      </IonCardContent>
    </IonCard>
  );
}

const ReferencePage: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#000000', '--color': '#c9a84c' } as any}>
          <IonTitle style={{ fontFamily: 'Georgia, serif', letterSpacing: 2 }}>Referência</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="reference-content">
        <RulershipsCard />
        <AspectsCard />
        <ElementsCard />
        <OppositesCard />
        <MoonPhasesCard />
        <LunarMansionsCard />
        <ZodiacSystemsCard />
        <GeneralInfoCard />
        <div style={{ height: 80 }} />
      </IonContent>
    </IonPage>
  );
};

export default ReferencePage;
