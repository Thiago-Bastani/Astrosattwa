import type { ChartData, PlanetPosition } from '../types/astro';
import type { ConditionTarget, Condition, ConditionSet } from '../types/conditions';
import { getZodiacSign, getDecanate, getDignity, getHouseFromLongitude, SIGN_RULERS, ZODIAC_SIGNS } from '../utils/zodiac';
import { MODALITY_MAP } from '../utils/astroLabels';

/* ── Resolve o target para um PlanetPosition concreto ── */

function makeSyntheticPosition(name: string, longitude: number, chart: ChartData): PlanetPosition {
  const { sign, degree, minute } = getZodiacSign(longitude);
  return {
    name,
    longitude,
    zodiacSign: sign.name,
    signDegree: degree,
    signMinute: minute,
    glyph: '',
    decanate: getDecanate(degree),
    dignity: getDignity(name, sign.name),
    house: getHouseFromLongitude(longitude, chart.houseCusps),
  };
}

function findPlanet(name: string, chart: ChartData): PlanetPosition | null {
  return chart.planets.find(p => p.name === name) || null;
}

export function resolveTarget(target: ConditionTarget, chart: ChartData): PlanetPosition | null {
  switch (target.type) {
    case 'direct': {
      const angleMap: Record<string, number> = {
        Ascendant: chart.ascendant,
        MC: chart.mc,
        Descendant: chart.descendant,
        IC: chart.ic,
      };
      if (target.body in angleMap) {
        return makeSyntheticPosition(target.body, angleMap[target.body], chart);
      }
      return findPlanet(target.body, chart);
    }

    case 'signRuler': {
      const ruler = SIGN_RULERS[target.sign];
      return ruler ? findPlanet(ruler, chart) : null;
    }

    case 'houseRuler': {
      const cuspIndex = target.house - 1;
      if (cuspIndex < 0 || cuspIndex >= chart.houseCusps.length) return null;
      const cuspSign = getZodiacSign(chart.houseCusps[cuspIndex]).sign.name;
      const ruler = SIGN_RULERS[cuspSign];
      return ruler ? findPlanet(ruler, chart) : null;
    }

    case 'planetSignRuler': {
      const planet = findPlanet(target.planet, chart);
      if (!planet) return null;
      const ruler = SIGN_RULERS[planet.zodiacSign];
      return ruler ? findPlanet(ruler, chart) : null;
    }
  }
}

/* ── Avalia uma condição sobre um PlanetPosition ── */

function evaluateCondition(planet: PlanetPosition, condition: Condition, chart: ChartData): boolean {
  switch (condition.category) {
    case 'sign':
      return planet.zodiacSign === condition.sign;

    case 'house':
      return planet.house === condition.house;

    case 'hemisphere': {
      const h = planet.house;
      if (!h) return false;
      switch (condition.hemisphere) {
        case 'above': return h >= 7 && h <= 12;
        case 'below': return h >= 1 && h <= 6;
        case 'east':  return h >= 10 || h <= 3;
        case 'west':  return h >= 4 && h <= 9;
      }
      return false;
    }

    case 'element': {
      const signInfo = ZODIAC_SIGNS.find(s => s.name === planet.zodiacSign);
      return signInfo ? signInfo.element === condition.element : false;
    }

    case 'modality':
      return MODALITY_MAP[planet.zodiacSign] === condition.modality;

    case 'decanate':
      return planet.decanate === condition.decanate;

    case 'aspect': {
      const other = condition.withBody in { Ascendant: 1, MC: 1, Descendant: 1, IC: 1 }
        ? makeSyntheticPosition(condition.withBody, { Ascendant: chart.ascendant, MC: chart.mc, Descendant: chart.descendant, IC: chart.ic }[condition.withBody as 'Ascendant' | 'MC' | 'Descendant' | 'IC'], chart)
        : findPlanet(condition.withBody, chart);
      if (!other) return false;
      const diff = Math.abs(planet.longitude - other.longitude);
      const angle = diff > 180 ? 360 - diff : diff;
      return Math.abs(angle - condition.aspectAngle) <= condition.aspectOrb;
    }

    case 'dignity':
      return planet.dignity === condition.dignity;

    case 'state':
      if (condition.state === 'retrograde') return planet.isRetrograde === true;
      return !planet.isRetrograde;
  }
}

/* ── Avalia o ConditionSet inteiro contra um chart ── */

export function evaluateConditionSet(conditionSet: ConditionSet, chart: ChartData): boolean {
  // Cada grupo é avaliado internamente com seu operador (AND/OR)
  // Entre grupos: AND
  for (const group of conditionSet.groups) {
    if (group.rules.length === 0) continue;

    const results = group.rules.map(rule => {
      const planet = resolveTarget(rule.target, chart);
      if (!planet) return false;
      return evaluateCondition(planet, rule.condition, chart);
    });

    const groupResult = group.operator === 'OR'
      ? results.some(r => r)
      : results.every(r => r);

    if (!groupResult) return false;
  }

  return true;
}
