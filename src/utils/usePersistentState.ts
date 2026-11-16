import { useCallback, useState } from 'react';

/**
 * useState que lembra o valor entre aberturas do app (localStorage).
 * Falhas de armazenamento (modo privado, WebView restrita) caem no valor padrão.
 */
export function usePersistentState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });

  const set = useCallback((v: T) => {
    setValue(v);
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch {
      /* ignora: preferência só não persiste */
    }
  }, [key]);

  return [value, set];
}
