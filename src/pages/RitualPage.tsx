import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import AppHeader from '../components/AppHeader';
import LocationPicker from '../components/LocationPicker';
import ZodiacToggle from '../components/ZodiacToggle';
import NakshatraSymbol from '../components/NakshatraSymbol';
import KameaSigil from '../components/KameaSigil';
import { useDeviceLocation } from '../services/DeviceLocation';
import { usePersistentState } from '../utils/usePersistentState';
import { DEFAULT_ZODIAC_SYSTEM, ZODIAC_SYSTEM_KEY } from '../utils/zodiacPreference';
import { CHALDEAN_ORDER, getPlanetaryDay, type ClassicalPlanet } from '../utils/planetary';
import { PLANET_GLYPHS } from '../utils/zodiac';
import { PLANET_NAMES_PT } from '../utils/astroLabels';
import { NAKSHATRAS, MANAZIL } from '../utils/lunarMansions';
import { NAKSHATRA_INFO } from '../utils/vedicReading';
import { MUHURTA_NATURE } from '../utils/electionalReading';
import { DAY_PALETTES, paletteToCssVars } from '../theme/palettes';
import { assessPlanetHours, GRADE_LABEL, type HourAssessment } from '../utils/ritual/hourScore';
import { HIERARCHY, AGRIPPA_REF, ARBATEL_REF, type HebrewName } from '../utils/ritual/beings';
import { KAMEAS, magicSum, magicTotal } from '../utils/ritual/kameas';
import { gematria, hebrewLetters, LATIN_TO_HEBREW } from '../utils/ritual/hebrew';
import { buildSigil, SIGIL_METHODS, type SigilMethod } from '../utils/ritual/sigil';
import { AGRIPPA_SEALS, OLYMPIC_SEALS, type SealPath } from '../utils/ritual/seals';
import type { GeoLocation, ZodiacSystem } from '../types/astro';
import './RitualPage.css';

const BELO_HORIZONTE: GeoLocation = { lat: -19.9167, lon: -43.9345, name: 'Belo Horizonte, Brasil' };

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const toDateString = (d: Date) => `${String(d.getFullYear()).padStart(4, '0')}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function parseDate(value: string): Date | null {
  const [y, m, d] = value.split('-').map(Number);
  if (!(y >= 1 && y <= 3000 && m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  const date = new Date(2000, 0, 1, 12, 0, 0);
  date.setFullYear(y, m - 1, d);
  return isNaN(date.getTime()) ? null : date;
}

/** Meio-dia da data: cai dentro do dia planetário aberto no nascer do sol daquela data. */
const noonOf = (d: Date) => { const x = new Date(d); x.setHours(12, 0, 0, 0); return x; };

/* ── Blocos ── */

function Fold({ title, meta, children, defaultOpen }: { title: string; meta?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="rt-fold" open={defaultOpen}>
      <summary>
        <span className="rt-fold-title">{title}</span>
        {meta && <span className="rt-fold-meta">{meta}</span>}
      </summary>
      <div className="rt-fold-body">{children}</div>
    </details>
  );
}

function SealSvg({ seal, label }: { seal: SealPath; label: string }) {
  return (
    <svg viewBox={`0 0 ${seal.w} ${seal.h}`} className="rt-seal-svg" role="img" aria-label={label}>
      <path d={seal.d} fill="currentColor" fillRule="evenodd" />
    </svg>
  );
}

function NameSeal({ planet, being }: { planet: ClassicalPlanet; being: HebrewName }) {
  const kamea = KAMEAS[planet];
  const sigil = useMemo(() => buildSigil(being.hebrew, kamea, 'hebrew', false), [being.hebrew, kamea]);
  const std = gematria(being.hebrew);
  const great = gematria(being.hebrew, true);
  const computed = being.finalsGreat ? great : std;
  return (
    <div className="rt-being">
      {being.title && <div className="rt-being-title">{being.title}</div>}
      <div className="rt-being-head">
        <span className="rt-being-name">{being.name}</span>
        <span className="rt-hebrew" dir="rtl" lang="he">{being.hebrew}</span>
      </div>
      <div className="rt-being-num">
        Gematria {computed}
        {being.finalsGreat && std !== great && <> (finais grandes; padrão {std})</>}
        {being.agrippa !== undefined && (
          being.agrippa === computed
            ? <> · Agrippa: {being.agrippa} ✓</>
            : <> · Agrippa: {being.agrippa}</>
        )}
      </div>
      {being.note && <p className="rt-note">{being.note}</p>}
      <div className="rt-seal-pair">
        <figure>
          <KameaSigil kamea={kamea} path={sigil.path} size={220} />
          <figcaption>Traçado no kamea (Aiq Bekar, reconstrução moderna)</figcaption>
        </figure>
        {being.seal && AGRIPPA_SEALS[planet][being.seal] && (
          <figure>
            <div className="rt-seal-box"><SealSvg seal={AGRIPPA_SEALS[planet][being.seal]!} label={`Selo de ${being.name}`} /></div>
            <figcaption>Selo impresso — {AGRIPPA_REF}</figcaption>
          </figure>
        )}
      </div>
    </div>
  );
}

function HourRow({ a }: { a: HourAssessment }) {
  const nak = a.chart.moonPhase.lunarMansion.number - 1;
  const man = a.chart.moonPhase.arabicMansion.number - 1;
  const nature = MUHURTA_NATURE[NAKSHATRA_INFO[nak].nature];
  return (
    <details className={`rt-hour grade-${a.grade}`}>
      <summary>
        <span className="rt-hour-time">{hhmm(a.hour.start)}–{hhmm(a.hour.end)}</span>
        <span className="rt-hour-kind">{a.hour.isDay ? 'diurna' : 'noturna'} · {a.hour.index}ª</span>
        <span className="rt-grade">{GRADE_LABEL[a.grade]}</span>
        <span className="rt-score">{a.score > 0 ? `+${a.score}` : a.score}</span>
      </summary>
      {a.tags.length > 0 && (
        <div className="rt-tags">{a.tags.map(t => <span key={t} className="rt-tag">{t}</span>)}</div>
      )}
      <ul className="rt-items">
        {a.items.map((it, i) => (
          <li key={i} className={it.points >= 0 ? 'pos' : 'neg'}>
            <div className="rt-item-row"><span>{it.label}</span><span>{it.points > 0 ? `+${it.points}` : it.points}</span></div>
            <div className="rt-item-why">{it.why}</div>
          </li>
        ))}
      </ul>
      {a.notes.map((n, i) => <p key={i} className="rt-note">{n}</p>)}
      <div className="rt-mansion">
        <NakshatraSymbol index={nak} color="currentColor" bg="transparent" ring="currentColor" size={26} />
        <div>
          <strong>{NAKSHATRAS[nak]}</strong> · {nature.name}
          <div className="rt-mansion-use">{nature.use}</div>
        </div>
      </div>
      <div className="rt-mansion">
        <span className="rt-mansion-num">{man + 1}</span>
        <div>
          <strong>{MANAZIL[man].name}</strong> · {MANAZIL[man].meaning}
          <div className="rt-mansion-use">{MANAZIL[man].election}</div>
        </div>
      </div>
    </details>
  );
}

/* ── Página ── */

const RitualPage: React.FC = () => {
  const { device } = useDeviceLocation();
  const [location, setLocationState] = useState<GeoLocation>(() => device ?? BELO_HORIZONTE);
  const pickedManually = useRef(false);
  useEffect(() => { if (device && !pickedManually.current) setLocationState(device); }, [device]);
  const setLocation = (l: GeoLocation) => { pickedManually.current = true; setLocationState(l); };

  const [zodiac, setZodiac] = usePersistentState<ZodiacSystem>(ZODIAC_SYSTEM_KEY, DEFAULT_ZODIAC_SYSTEM);
  const [date, setDate] = useState<Date>(() => noonOf(new Date()));
  const day = useMemo(() => getPlanetaryDay(date, location), [date, location]);

  // Planeta: segue o regente do dia até o usuário escolher outro
  const [picked, setPicked] = useState<ClassicalPlanet | null>(null);
  const planet: ClassicalPlanet = picked ?? day?.ruler ?? 'Sun';

  const hours = useMemo(
    () => (day ? assessPlanetHours(planet, day, location, zodiac) : []),
    [planet, day, location, zodiac],
  );

  const palette = DAY_PALETTES.find(p => p.planet === planet)!;
  const themeVars = useMemo(() => paletteToCssVars(palette) as React.CSSProperties, [palette]);
  const h = HIERARCHY[planet];

  // Sigilo
  const [sigilPlanet, setSigilPlanet] = useState<ClassicalPlanet | null>(null);
  const kamea = KAMEAS[sigilPlanet ?? planet];
  const [method, setMethod] = usePersistentState<SigilMethod>('as.ritual.sigilMethod', 'aiqbekar');
  const [text, setText] = useState('');
  const [cutRepeats, setCutRepeats] = useState(true);
  const sigil = useMemo(() => buildSigil(text, kamea, method, cutRepeats), [text, kamea, method, cutRepeats]);
  const methodInfo = SIGIL_METHODS.find(m => m.id === method)!;
  const noHebrew = method === 'hebrew' && text.trim() !== '' && hebrewLetters(text).length === 0;

  const shiftDays = (n: number) => { const d = new Date(date); d.setDate(d.getDate() + n); setDate(d); };

  return (
    <IonPage style={themeVars} className="ritual-page">
      <AppHeader title="Rituais" showDay={false} end={<ZodiacToggle value={zodiac} onChange={setZodiac} />} />
      <IonContent fullscreen className="app-content">
        <div className="app-section rt-controls">
          <div className="dt-row">
            <div className="stepper stepper-date">
              <button className="step-btn" onClick={() => shiftDays(-1)} aria-label="Dia anterior">‹</button>
              <input type="date" className="stepper-input" value={toDateString(date)} aria-label="Data"
                onChange={e => { const d = parseDate(e.target.value); if (d) setDate(d); }} />
              <button className="step-btn" onClick={() => shiftDays(1)} aria-label="Próximo dia">›</button>
            </div>
            <button className="now-btn" onClick={() => { setDate(noonOf(new Date())); setPicked(null); }}>Hoje</button>
          </div>
          <div className="dt-row">
            <LocationPicker location={location} onChange={setLocation} />
          </div>
          <div className="rt-planets" role="radiogroup" aria-label="Planeta">
            {CHALDEAN_ORDER.map(p => (
              <button key={p} role="radio" aria-checked={p === planet}
                className={`rt-planet${p === planet ? ' active' : ''}${p === day?.ruler ? ' day' : ''}`}
                onClick={() => setPicked(p === day?.ruler ? null : p)} title={PLANET_NAMES_PT[p]}>
                <span className="astro-glyph">{PLANET_GLYPHS[p]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Horas */}
        <div className="app-section">
          <div className="rt-card">
            <div className="rt-card-head">
              <span className="rt-card-glyph astro-glyph">{PLANET_GLYPHS[planet]}</span>
              <div>
                <div className="rt-card-title">Horas de {PLANET_NAMES_PT[planet]}</div>
                <div className="rt-card-sub">
                  {day ? <>Dia de {PLANET_NAMES_PT[day.ruler]} · nascer {hhmm(day.sunrise)} · ocaso {hhmm(day.sunset)}</> : 'Sem nascer do sol neste local e data.'}
                </div>
              </div>
            </div>
            {hours.map(a => <HourRow key={a.hour.index} a={a} />)}
            <p className="rt-foot">
              Mapa levantado no meio de cada hora · zodíaco {zodiac === 'sidereal' ? 'sideral' : 'tropical'} · pesos de Lilly. Toque numa hora para ver os motivos.
            </p>
          </div>
        </div>

        {/* Hierarquia */}
        <div className="app-section rt-folds">
          <Fold title={`Selo de ${PLANET_NAMES_PT[planet]}`} meta="selo ou caráter do planeta">
            <div className="rt-seal-box big"><SealSvg seal={AGRIPPA_SEALS[planet].planet!} label={`Selo de ${PLANET_NAMES_PT[planet]}`} /></div>
            <p className="rt-ref">{AGRIPPA_REF}.</p>
          </Fold>

          <Fold title={`Arcanjo · ${h.archangel.name}`} meta={`${h.archangel.meaning} · ${h.archangel.sephira}`}>
            <NameSeal planet={planet} being={h.archangel} />
            <p className="rt-text">{h.archangel.text}</p>
            {h.archangel.agrippaVariant && <p className="rt-note">{h.archangel.agrippaVariant}</p>}
            <p className="rt-note">Agrippa não imprime selo para os arcanjos; o traçado no kamea é a única figura aqui.</p>
            <p className="rt-ref">Atribuição da Golden Dawn; Agrippa, De Occulta Philosophia II.10 (Escala do Sete).</p>
          </Fold>

          <Fold title={`Inteligência · ${h.intelligences.map(i => i.name.split(' ')[0]).join(' / ')}`} meta="rege e dirige o espírito">
            {h.intelligences.map(b => <NameSeal key={b.name} planet={planet} being={b} />)}
            <p className="rt-text">
              A inteligência é a potência ordenadora e benéfica do planeta: governa o espírito e o conduz ao bem.
              Agrippa dá o seu nome e número junto ao quadrado, e a operação se faz pela inteligência antes do espírito.
            </p>
            <p className="rt-ref">{AGRIPPA_REF}.</p>
          </Fold>

          <Fold title={`Espírito · ${h.spirits.map(s => s.name.split(' ')[0]).join(' / ')}`} meta="força cega, sob a inteligência">
            {h.spirits.map(b => <NameSeal key={b.name} planet={planet} being={b} />)}
            <p className="rt-text">
              O espírito é a força planetária em estado bruto, eficaz mas sem discernimento; por isso é posto sob a
              inteligência do mesmo planeta. O número do espírito é o total ou o número característico do quadrado.
            </p>
            <p className="rt-ref">{AGRIPPA_REF}.</p>
          </Fold>

          <Fold title={`Olímpico · ${h.olympic.name}`} meta={`${h.olympic.provinces} províncias`}>
            <figure className="rt-olympic">
              <div className="rt-seal-box big"><SealSvg seal={OLYMPIC_SEALS[planet]} label={`Caráter de ${h.olympic.name}`} /></div>
              <figcaption>Caráter de {h.olympic.name} — {ARBATEL_REF}</figcaption>
            </figure>
            <p className="rt-text">{h.olympic.text}</p>
            <p className="rt-ref">
              {ARBATEL_REF}. Os sete governadores olímpicos repartem as 196 províncias do universo; o nome não é
              hebraico e não tem gematria nem traçado no kamea.
            </p>
          </Fold>
        </div>

        {/* Sigilo */}
        <div className="app-section">
          <div className="rt-card">
            <div className="rt-card-title">Criador de sigilo</div>

            <div className="field-label">Quadrado</div>
            <div className="rt-planets small">
              {CHALDEAN_ORDER.map(p => (
                <button key={p} className={`rt-planet${KAMEAS[p] === kamea ? ' active' : ''}`}
                  onClick={() => setSigilPlanet(p === planet ? null : p)} title={`Quadrado de ${PLANET_NAMES_PT[p]}`}>
                  <span className="astro-glyph">{PLANET_GLYPHS[p]}</span>
                  <span className="rt-order">{KAMEAS[p].order}²</span>
                </button>
              ))}
            </div>
            <p className="rt-note">
              Quadrado de {PLANET_NAMES_PT[kamea.planet]}: {kamea.order}×{kamea.order}, soma {magicSum(kamea.order)} por linha,
              total {magicTotal(kamea.order)}, lâmina de {kamea.metal}. {kamea.virtue}
            </p>

            <div className="field-label">Método</div>
            <div className="seg-toggle rt-methods">
              {SIGIL_METHODS.map(m => (
                <button key={m.id} className={m.id === method ? 'active' : ''} onClick={() => setMethod(m.id)}>{m.name}</button>
              ))}
            </div>
            <p className="rt-note">{methodInfo.hint}</p>

            <input className="input rt-input" value={text} onChange={e => setText(e.target.value)}
              placeholder={method === 'hebrew' ? 'מיכאל' : 'Escreva a intenção ou o nome'}
              dir={method === 'hebrew' ? 'auto' : undefined} />
            <label className="rt-check">
              <input type="checkbox" checked={cutRepeats} onChange={e => setCutRepeats(e.target.checked)} />
              Cortar letras repetidas
            </label>
            {noHebrew && <p className="rt-note warn">Nenhuma letra hebraica no texto.</p>}

            {sigil.steps.length > 0 && (
              <>
                <div className="rt-steps">
                  {sigil.steps.map((s, i) => (
                    <span key={i} className="rt-step">
                      <span className="rt-step-letter">{s.letter}{s.hebrew && <span dir="rtl" lang="he"> {s.hebrew}</span>}</span>
                      <span className="rt-step-val">{s.value}{s.reduced !== s.value && <> → {s.reduced}</>}</span>
                    </span>
                  ))}
                </div>
                {sigil.dropped.length > 0 && <p className="rt-note">Cortadas: {sigil.dropped.join(' ')}</p>}
                <p className="rt-note">Traço: {sigil.path.map(p => p.value).join(' → ')}</p>
              </>
            )}
            <div className="rt-sigil-wrap">
              <KameaSigil kamea={kamea} path={sigil.path} size={320} />
            </div>

            {method === 'aiqbekar' && (
              <details className="rt-table">
                <summary>Tabela latina → hebraica</summary>
                <div className="rt-translit">
                  {Object.entries(LATIN_TO_HEBREW).map(([l, he]) => (
                    <span key={l}>{l} <span lang="he">{he}</span></span>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>

        <div className="app-bottom-spacer" />
      </IonContent>
    </IonPage>
  );
};

export default RitualPage;
