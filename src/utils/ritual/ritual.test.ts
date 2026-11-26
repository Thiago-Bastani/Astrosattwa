import { describe, it, expect } from 'vitest';
import { KAMEAS, isValidKamea, magicSum } from './kameas';
import { HIERARCHY } from './beings';
import { gematria, aiqBekarReduce } from './hebrew';
import { buildSigil } from './sigil';
import { assessPlanetHours } from './hourScore';
import { CHALDEAN_ORDER, getPlanetaryDay } from '../planetary';

describe('kameas', () => {
  for (const p of CHALDEAN_ORDER) {
    it(`${p} é quadrado mágico`, () => expect(isValidKamea(KAMEAS[p])).toBe(true));
  }
  it('somas clássicas', () => {
    expect(CHALDEAN_ORDER.map(p => magicSum(KAMEAS[p].order))).toEqual([15, 34, 65, 111, 175, 260, 369]);
  });
});

describe('gematria dos nomes x Agrippa', () => {
  for (const p of CHALDEAN_ORDER) {
    const h = HIERARCHY[p];
    for (const b of [...h.intelligences, ...h.spirits]) {
      if (b.note) continue; // grafia sabidamente divergente
      it(`${b.name} = ${b.agrippa}`, () => expect(gematria(b.hebrew, !!b.finalsGreat)).toBe(b.agrippa));
    }
  }
  it('arcanjos', () => {
    expect(CHALDEAN_ORDER.map(p => gematria(HIERARCHY[p].archangel.hebrew)))
      .toEqual([311, 235, 91, 101, 97, 311, 246]);
  });
});

describe('sigilo', () => {
  it('Aiq Bekar reduz para caber', () => {
    expect(aiqBekarReduce(200, 9)).toBe(2);
    expect(aiqBekarReduce(30, 64)).toBe(30);
    expect(aiqBekarReduce(400, 81)).toBe(40);
  });
  it('Agiel no quadrado de Saturno: 1,3,1,3 ⇒ alterna', () => {
    const s = buildSigil('אגיאל', KAMEAS.Saturn, 'hebrew', false);
    expect(s.path.map(p => p.value)).toEqual([1, 3, 1, 1, 3].filter((v, i, a) => i === 0 || v !== a[i - 1]));
  });
  it('corta repetidos', () => {
    const s = buildSigil('Ana', KAMEAS.Saturn, 'pythagorean', true);
    expect(s.steps.map(x => x.letter)).toEqual(['A', 'N']);
    expect(s.dropped).toEqual(['A']);
  });
});

describe('horas', () => {
  it('pontua as horas do planeta do dia', () => {
    const loc = { lat: -19.9167, lon: -43.9345, name: 'BH' };
    const day = getPlanetaryDay(new Date(2026, 10, 25, 12), loc)!;
    const res = assessPlanetHours(day.ruler, day, loc, 'sidereal');
    expect(res.length).toBeGreaterThanOrEqual(3);
    for (const r of res) expect(r.items.length).toBeGreaterThan(0);
    console.log(res.map(r => `${r.hour.start.toISOString()} ${r.grade} ${r.score} | ${r.items.map(i => i.label + ' ' + i.points).join('; ')} | ${r.notes.join(' ')}`).join('\n'));
  });
});
