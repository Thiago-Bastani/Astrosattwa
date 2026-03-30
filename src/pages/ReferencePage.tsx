import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/react';
import { ZODIAC_SIGNS, PLANET_GLYPHS, PLANET_COLORS, DIGNITY_TABLE } from '../utils/zodiac';
import './ReferencePage.css';

const SIGN_GLYPHS: Record<string, string> = {};
ZODIAC_SIGNS.forEach(s => { SIGN_GLYPHS[s.name] = s.glyph; });

const PLANET_NAMES_PT: Record<string, string> = {
  Sun: 'Sol', Moon: 'Lua', Mercury: 'Mercúrio', Venus: 'Vênus', Mars: 'Marte',
  Jupiter: 'Júpiter', Saturn: 'Saturno', Uranus: 'Urano', Neptune: 'Netuno', Pluto: 'Plutão',
};

const SIGN_NAMES_PT: Record<string, string> = {
  Aries: 'Áries', Taurus: 'Touro', Gemini: 'Gêmeos', Cancer: 'Câncer',
  Leo: 'Leão', Virgo: 'Virgem', Libra: 'Libra', Scorpio: 'Escorpião',
  Sagittarius: 'Sagitário', Capricorn: 'Capricórnio', Aquarius: 'Aquário', Pisces: 'Peixes',
};

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

function signLabel(names: string[]): string {
  return names.map(n => `${SIGN_GLYPHS[n] || ''} ${SIGN_NAMES_PT[n] || n}`).join(', ');
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
                    <td style={{ color: '#2ecc71' }}>{signLabel(d.domicilio)}</td>
                    <td style={{ color: '#f1c40f' }}>{signLabel(d.exaltacao)}</td>
                    <td style={{ color: '#e74c3c' }}>{signLabel(d.queda)}</td>
                    <td style={{ color: '#95a5a6' }}>{signLabel(d.exilio)}</td>
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
                  <span key={s.name} className="element-sign-chip" style={{ color: info.color, borderColor: `${info.color}44` }}>
                    {s.glyph} {SIGN_NAMES_PT[s.name]}
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
          <p><strong>Lilith (Lua Negra)</strong> — O apogeu lunar médio. Representa desejos inconscientes e aspectos ocultos da personalidade.</p>
          <p><strong>Nodo Norte ☊</strong> — O caminho kármico de evolução. Indica o que devemos desenvolver nesta vida.</p>
          <p><strong>Nodo Sul ☋</strong> — Habilidades trazidas de vidas passadas. Zona de conforto a ser transcendida.</p>
          <p><strong>Vertex</strong> — Ponto de encontros fatídicos. Associado a eventos e pessoas que entram em nossa vida de forma inesperada.</p>
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
        <ElementsCard />
        <OppositesCard />
        <GeneralInfoCard />
        <div style={{ height: 80 }} />
      </IonContent>
    </IonPage>
  );
};

export default ReferencePage;
