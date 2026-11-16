import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { GeoLocation } from '../types/astro';
import { getPlanetaryWeekday } from '../utils/planetary';
import { DAY_PALETTES, NEUTRAL_CSS_VARS, paletteToCssVars, type DayPalette } from './palettes';

interface DayThemeValue {
  palette: DayPalette;
  /** Momento e local que definem o dia planetário (data/local do Mapa). */
  setReference: (date: Date, location: GeoLocation) => void;
  /** true = tema neutro (sem paleta do dia), usado na aba Calculadora. */
  setNeutral: (neutral: boolean) => void;
}

const DEFAULT_LOCATION: GeoLocation = { lat: -19.9167, lon: -43.9345, name: 'Belo Horizonte, Brasil' };

const DayThemeContext = createContext<DayThemeValue | null>(null);

/**
 * Aplica a paleta do dia planetário (vira no nascer do sol) da data e do local
 * escolhidos no Mapa, como variáveis CSS na raiz.
 */
export const DayThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ref, setRef] = useState<{ date: Date; location: GeoLocation }>(() => ({
    date: new Date(),
    location: DEFAULT_LOCATION,
  }));

  const [neutral, setNeutral] = useState(false);

  const setReference = useCallback((date: Date, location: GeoLocation) => {
    setRef({ date, location });
  }, []);

  const weekday = useMemo(() => getPlanetaryWeekday(ref.date, ref.location), [ref]);
  const palette = DAY_PALETTES[weekday];

  useEffect(() => {
    // Remove preferência antiga de "dia fixo" (recurso removido), para não ficar presa
    try { localStorage.removeItem('as.themeOverride'); } catch { /* sem storage */ }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const vars = neutral ? NEUTRAL_CSS_VARS : paletteToCssVars(palette);
    for (const [k, v] of Object.entries(vars)) {
      root.style.setProperty(k, v);
    }
  }, [palette, neutral]);

  const value = useMemo(() => ({ palette, setReference, setNeutral }), [palette, setReference]);

  return <DayThemeContext.Provider value={value}>{children}</DayThemeContext.Provider>;
};

export function useDayTheme(): DayThemeValue {
  const ctx = useContext(DayThemeContext);
  if (!ctx) throw new Error('useDayTheme fora do DayThemeProvider');
  return ctx;
}
