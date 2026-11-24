import React, { useEffect, useMemo, useState, useRef } from 'react';
import { IonContent, IonPage, IonProgressBar } from '@ionic/react';
import type { GeoLocation, ZodiacSystem } from '../types/astro';
import type { ConditionSet, ConditionRule, SearchResult, SearchProgress } from '../types/conditions';
import { findNextMatchingDate } from '../services/dateSearcher';
import ConditionChips from '../components/ConditionChips';
import ConditionBuilder from '../components/ConditionBuilder';
import AppHeader from '../components/AppHeader';
import ChartPanel from '../components/ChartPanel';
import PlanetList from '../components/PlanetList';
import LocationPicker from '../components/LocationPicker';
import ZodiacToggle from '../components/ZodiacToggle';
import { getPlanetaryDay } from '../utils/planetary';
import { useDeviceLocation } from '../services/DeviceLocation';
import { usePersistentState } from '../utils/usePersistentState';
import { CALC_ZODIAC_SYSTEM_KEY, DEFAULT_ZODIAC_SYSTEM } from '../utils/zodiacPreference';
import './CalculatorPage.css';

const FALLBACK_LOCATION: GeoLocation = { lat: -19.9167, lon: -43.9345, name: 'Belo Horizonte, Brasil' };

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

function uuid() {
  return crypto.randomUUID();
}

const CalculatorPage: React.FC = () => {
  // Location
  const { device } = useDeviceLocation();
  const [location, setLocation] = useState<GeoLocation | null>(device);

  // Preenche com o GPS do aparelho se ainda não houver local escolhido
  useEffect(() => {
    if (device) setLocation(prev => prev ?? device);
  }, [device]);

  // Conditions
  const [conditionSet, setConditionSet] = useState<ConditionSet>({
    groups: [{ id: uuid(), operator: 'AND', rules: [] }],
  });
  const [showBuilder, setShowBuilder] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string>('');

  // Search
  const [startDateStr, setStartDateStr] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [maxDays, setMaxDays] = useState(365);
  const [zodiacSystem, setZodiacSystem] = usePersistentState<ZodiacSystem>(CALC_ZODIAC_SYSTEM_KEY, DEFAULT_ZODIAC_SYSTEM);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState<SearchProgress | null>(null);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [noResult, setNoResult] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const resultPlanetaryDay = useMemo(
    () => (result && location ? getPlanetaryDay(result.date, location) : null),
    [result, location],
  );

  /* ── Condition management ── */

  function handleAddRule(rule: ConditionRule) {
    setConditionSet(prev => {
      const targetId = activeGroupId || prev.groups[0]?.id;
      const hasTarget = prev.groups.some(g => g.id === targetId);
      if (hasTarget) {
        return {
          groups: prev.groups.map(g =>
            g.id === targetId ? { ...g, rules: [...g.rules, rule] } : g
          ),
        };
      }
      // Fallback: adiciona ao primeiro grupo, ou cria um novo se não existir
      if (prev.groups.length > 0) {
        return {
          groups: prev.groups.map((g, i) =>
            i === 0 ? { ...g, rules: [...g.rules, rule] } : g
          ),
        };
      }
      return {
        groups: [{ id: uuid(), operator: 'AND' as const, rules: [rule] }],
      };
    });
  }

  function handleRemoveRule(groupId: string, ruleId: string) {
    setConditionSet(prev => {
      const updated = prev.groups
        .map(g => g.id === groupId ? { ...g, rules: g.rules.filter(r => r.id !== ruleId) } : g)
        .filter((g, i) => g.rules.length > 0 || i === 0);
      // Garante que sempre existe pelo menos um grupo
      return { groups: updated.length > 0 ? updated : [{ id: uuid(), operator: 'AND' as const, rules: [] }] };
    });
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
    setProgress(null);
    setResult(null);
    setNoResult(false);
    setError(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const found = await findNextMatchingDate(
        conditionSet,
        location,
        new Date(startDateStr + 'T00:00:00'),
        maxDays,
        (p) => setProgress(p),
        controller.signal,
        zodiacSystem,
      );

      if (found) {
        setResult(found);
      } else {
        setNoResult(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao calcular');
    } finally {
      setIsSearching(false);
      abortRef.current = null;
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
    setIsSearching(false);
  }

  /* ── Render ── */

  return (
    <IonPage>
      <AppHeader
        title="Calculadora"
        showDay={false}
        end={<ZodiacToggle value={zodiacSystem} onChange={setZodiacSystem} disabled={isSearching} />}
      />
      <IonContent fullscreen className="app-content">

        {/* ── Local + período ── */}
        <div className="app-section">
          <div className="section-title">Onde e quando</div>
          <div className="calc-params">
            <LocationPicker location={location} onChange={setLocation} placeholder="Escolher local (obrigatório)" />
            <div className="calc-params-row">
              <label className="field">
                <span className="field-label">A partir de</span>
                <input
                  type="date"
                  className="input"
                  value={startDateStr}
                  onChange={e => setStartDateStr(e.target.value)}
                />
              </label>
              <label className="field calc-days-field">
                <span className="field-label">Limite (dias)</span>
                <input
                  type="number"
                  inputMode="numeric"
                  className="input"
                  min={1}
                  max={36500}
                  value={maxDays}
                  onChange={e => setMaxDays(Math.max(1, parseInt(e.target.value) || 365))}
                />
              </label>
            </div>
          </div>
        </div>

        {/* ── Condições ── */}
        <div className="app-section">
          <div className="section-title">Condições</div>
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

        {/* ── Ação ── */}
        <div className="app-section">
          {isSearching ? (
            <div className="calc-progress">
              <IonProgressBar value={progress ? progress.daysSearched / maxDays : 0} className="calc-progress-bar" />
              <div className="calc-progress-info">
                <span className="calc-progress-date">
                  {progress
                    ? `${progress.currentDate.toLocaleDateString('pt-BR')} · ${progress.daysSearched} de ${maxDays} dias`
                    : 'Iniciando...'}
                </span>
                <button className="calc-cancel-btn" onClick={handleCancel}>Cancelar</button>
              </div>
            </div>
          ) : (
            <>
              <button className="calc-btn" disabled={!canCalculate} onClick={handleCalculate}>
                Calcular próxima data
              </button>
              {!canCalculate && (
                <div className="calc-hint">
                  {!location && totalRules === 0
                    ? 'Escolha um local e adicione ao menos uma condição'
                    : !location
                      ? 'Escolha um local para buscar'
                      : 'Adicione ao menos uma condição'}
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Resultado ── */}
        {result && (
          <>
            <div className="app-section">
              <div className="calc-result">
                <div className="calc-result-label">
                  Próxima data · {result.chart.zodiacSystem === 'sidereal' ? 'sideral' : 'tropical'}
                </div>
                <div className="calc-result-date">
                  {result.date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
                <div className="calc-result-meta">
                  <span className="calc-result-time">
                    {result.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="calc-result-weekday">{WEEKDAYS[result.date.getDay()]}</span>
                </div>
              </div>
            </div>
            <ChartPanel
              chart={result.chart}
              date={result.date}
              planetaryDay={resultPlanetaryDay}
              location={location ?? device ?? FALLBACK_LOCATION}
              storageKey="as.chartView.calc"
            />
            <div className="app-section">
              <div className="section-title">Posições</div>
              <PlanetList chart={result.chart} />
            </div>
          </>
        )}

        {noResult && !isSearching && (
          <div className="app-section">
            <div className="calc-no-result">
              Nenhuma data encontrada nos próximos {maxDays} dias que satisfaça todas as condições.
            </div>
          </div>
        )}

        {error && !isSearching && (
          <div className="app-section">
            <div className="calc-no-result calc-error">Erro: {error}</div>
          </div>
        )}

        <div className="app-bottom-spacer" />
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
