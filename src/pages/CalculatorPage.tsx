import React, { useState, useRef } from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonProgressBar } from '@ionic/react';
import type { GeoLocation } from '../types/astro';
import type { ConditionSet, ConditionRule, SearchResult, SearchProgress } from '../types/conditions';
import { searchLocation } from '../services/geocodingService';
import { findNextMatchingDate } from '../services/dateSearcher';
import { PLANET_COLORS, PLANET_GLYPHS, ZODIAC_SIGNS } from '../utils/zodiac';
import { PLANET_NAMES_PT, SIGN_NAMES_PT } from '../utils/astroLabels';
import ConditionChips from '../components/ConditionChips';
import ConditionBuilder from '../components/ConditionBuilder';
import './CalculatorPage.css';

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function uuid() {
  return crypto.randomUUID();
}

const CalculatorPage: React.FC = () => {
  // Location
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locQuery, setLocQuery] = useState('');
  const [locResults, setLocResults] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [locSearching, setLocSearching] = useState(false);

  // Conditions
  const [conditionSet, setConditionSet] = useState<ConditionSet>({
    groups: [{ id: uuid(), operator: 'AND', rules: [] }],
  });
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string>('');

  // Search
  const [startDateStr, setStartDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [maxDays, setMaxDays] = useState(365);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState<SearchProgress | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [noResult, setNoResult] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  /* ── Location search ── */

  async function handleLocSearch() {
    if (locQuery.trim().length < 2) return;
    setLocSearching(true);
    const results = await searchLocation(locQuery);
    setLocResults(results);
    setLocSearching(false);
  }

  function handleLocSelect(r: { display_name: string; lat: string; lon: string }) {
    setLocation({ lat: parseFloat(r.lat), lon: parseFloat(r.lon), name: r.display_name });
    setLocResults([]);
    setLocQuery('');
  }

  /* ── Condition management ── */

  function handleAddRule(rule: ConditionRule) {
    setConditionSet(prev => ({
      groups: prev.groups.map(g =>
        g.id === (activeGroupId || prev.groups[0]?.id)
          ? { ...g, rules: [...g.rules, rule] }
          : g
      ),
    }));
  }

  function handleRemoveRule(groupId: string, ruleId: string) {
    setConditionSet(prev => ({
      groups: prev.groups
        .map(g => g.id === groupId ? { ...g, rules: g.rules.filter(r => r.id !== ruleId) } : g)
        .filter(g => g.rules.length > 0 || prev.groups.indexOf(g) === 0),
    }));
  }

  function handleAddOrGroup() {
    const newGroupId = uuid();
    setConditionSet(prev => ({
      groups: [...prev.groups, { id: newGroupId, operator: 'OR', rules: [] }],
    }));
    setActiveGroupId(newGroupId);
    setShowBuilder(true);
  }

  function handleToggleGroupOperator(groupId: string) {
    setConditionSet(prev => ({
      groups: prev.groups.map(g =>
        g.id === groupId ? { ...g, operator: g.operator === 'AND' ? 'OR' : 'AND' } : g
      ),
    }));
  }

  function openBuilder() {
    const firstGroup = conditionSet.groups[0];
    setActiveGroupId(firstGroup?.id || '');
    setShowBuilder(true);
  }

  /* ── Search ── */

  const totalRules = conditionSet.groups.reduce((sum, g) => sum + g.rules.length, 0);
  const canCalculate = totalRules > 0 && location !== null;

  async function handleCalculate() {
    if (!canCalculate || !location) return;
    setIsSearching(true);
    setResult(null);
    setNoResult(false);

    const controller = new AbortController();
    abortRef.current = controller;

    const found = await findNextMatchingDate(
      conditionSet,
      location,
      new Date(startDateStr + 'T00:00:00'),
      maxDays,
      (p) => setProgress(p),
      controller.signal,
    );

    setIsSearching(false);
    abortRef.current = null;

    if (found) {
      setResult(found);
    } else {
      setNoResult(true);
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setIsSearching(false);
  }

  /* ── Render ── */

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar style={{ '--background': '#000000', '--color': '#c9a84c' } as any}>
          <IonTitle style={{ fontFamily: 'Georgia, serif', letterSpacing: 2 }}>Calculadora</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="calculator-content">

        {/* ── Location ── */}
        <div className="calc-section">
          <div className="calc-section-title">Localização</div>
          {!location ? (
            <>
              <div className="location-search-row">
                <input
                  className="location-search-input"
                  placeholder="Buscar cidade..."
                  value={locQuery}
                  onChange={e => setLocQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLocSearch()}
                />
                <button className="location-search-btn" onClick={handleLocSearch} disabled={locSearching}>
                  {locSearching ? '...' : 'Buscar'}
                </button>
              </div>
              {locResults.length > 0 && (
                <div className="location-results">
                  {locResults.map((r, i) => (
                    <button key={i} className="location-result-item" onClick={() => handleLocSelect(r)}>
                      {r.display_name}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="location-selected">
              <span className="loc-name">{location.name}</span>
              <span className="loc-coords">{location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°</span>
              <button className="loc-clear" onClick={() => setLocation(null)}>×</button>
            </div>
          )}
        </div>

        {/* ── Conditions ── */}
        <div className="calc-section">
          <div className="calc-section-title">Condições</div>
          <ConditionChips
            conditionSet={conditionSet}
            onRemoveRule={handleRemoveRule}
            onAddOrGroup={handleAddOrGroup}
            onToggleGroupOperator={handleToggleGroupOperator}
          />
          <button className="add-condition-btn" onClick={openBuilder}>
            + Adicionar condição
          </button>
        </div>

        {/* ── Calculate ── */}
        <div className="calc-section">
          <div className="calc-section-title">Busca</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>A partir de</span>
            <input
              type="date"
              value={startDateStr}
              onChange={e => setStartDateStr(e.target.value)}
              className="location-search-input"
              style={{ flex: 1, textAlign: 'center' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap' }}>Limite</span>
            <input
              type="number"
              min={1}
              max={36500}
              value={maxDays}
              onChange={e => setMaxDays(Math.max(1, parseInt(e.target.value) || 365))}
              className="location-search-input"
              style={{ width: 90, flex: 'none', textAlign: 'center' }}
            />
            <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>dias</span>
          </div>
          {!location && totalRules > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'rgba(231, 76, 60, 0.7)', marginBottom: 8 }}>
              Selecione uma localização para condições de casa e ângulo
            </div>
          )}
          <button className="calc-btn" disabled={!canCalculate || isSearching} onClick={handleCalculate}>
            {isSearching ? 'Buscando...' : 'Calcular próxima data'}
          </button>

          {isSearching && progress && (
            <div className="calc-progress">
              <IonProgressBar
                value={progress.daysSearched / maxDays}
                style={{ '--progress-background': '#c9a84c', '--background': 'rgba(255,255,255,0.08)' } as any}
              />
              <div className="calc-progress-info">
                <span className="calc-progress-date">
                  {progress.currentDate.toLocaleDateString('pt-BR')} ({progress.daysSearched} dias)
                </span>
                <button className="calc-cancel-btn" onClick={handleCancel}>Cancelar</button>
              </div>
            </div>
          )}
        </div>

        {/* ── Result ── */}
        {result && (
          <div className="calc-section">
            <div className="calc-result">
              <div className="calc-result-label">Próxima data encontrada</div>
              <div className="calc-result-date">
                {result.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </div>
              <div className="calc-result-time">
                {result.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="calc-result-weekday">
                {WEEKDAYS[result.date.getDay()]}
              </div>

              <div className="calc-planet-list">
                {result.chart.planets.filter(p => !p.isVirtual).map(p => {
                  const signInfo = ZODIAC_SIGNS.find(s => s.name === p.zodiacSign);
                  return (
                    <div key={p.name} className="calc-planet-row">
                      <span className="calc-planet-glyph" style={{ color: PLANET_COLORS[p.name] }}>
                        {PLANET_GLYPHS[p.name]}
                      </span>
                      <span className="calc-planet-name">{PLANET_NAMES_PT[p.name]}</span>
                      <span className="calc-planet-sign" style={{ color: signInfo?.color }}>
                        {signInfo?.glyph} {SIGN_NAMES_PT[p.zodiacSign]}
                      </span>
                      <span className="calc-planet-deg">
                        {p.signDegree}°{String(p.signMinute).padStart(2, '0')}'
                      </span>
                      {p.isRetrograde && <span className="calc-planet-retro">℞</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {noResult && !isSearching && (
          <div className="calc-section">
            <div className="calc-no-result">
              Nenhuma data encontrada nos próximos {maxDays} dias que satisfaça todas as condições.
            </div>
          </div>
        )}

        <div style={{ height: 80 }} />
      </IonContent>

      <ConditionBuilder
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        onAdd={handleAddRule}
        targetGroupId={activeGroupId}
      />
    </IonPage>
  );
};

export default CalculatorPage;
