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
        <GeneralInfoCard />
        <div style={{ height: 80 }} />
      </IonContent>
    </IonPage>
  );
};

export default ReferencePage;
