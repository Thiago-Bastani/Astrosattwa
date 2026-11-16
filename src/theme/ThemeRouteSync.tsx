import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDayTheme } from './DayTheme';

/** Rotas sem a paleta do dia planetário (usam o tema neutro). */
const NEUTRAL_ROUTES = ['/calculadora'];

/** Liga/desliga a paleta do dia conforme a aba ativa. */
export default function ThemeRouteSync(): null {
  const { pathname } = useLocation();
  const { setNeutral } = useDayTheme();
  useEffect(() => {
    setNeutral(NEUTRAL_ROUTES.some(r => pathname.startsWith(r)));
  }, [pathname, setNeutral]);
  return null;
}
