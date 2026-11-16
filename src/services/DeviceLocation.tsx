import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { App } from '@capacitor/app';
import { Geolocation } from '@capacitor/geolocation';
import type { GeoLocation } from '../types/astro';
import { reverseGeocode } from './geocodingService';
import { refreshSkyNotification } from './skyNotification';

/**
 * Localização do aparelho (GPS aproximado: rede/Wi-Fi, ~1–3 km).
 * Obtida ao abrir o app e ao voltar para ele (se a última leitura tiver mais de 30 min).
 * Também mantém a notificação "Céu agora" agendada com esse local.
 */

const CACHE_KEY = 'as.deviceLocation';
const STALE_MS = 30 * 60_000;
const DEFAULT_LOCATION: GeoLocation = { lat: -19.9167, lon: -43.9345, name: 'Belo Horizonte, Brasil' };

interface CachedLocation extends GeoLocation {
  at: number;
}

interface DeviceLocationValue {
  /** Última localização obtida (pode vir do cache de uma sessão anterior). */
  device: GeoLocation | null;
  /** Lê o GPS agora. Retorna null se sem permissão ou falha. */
  locate: () => Promise<GeoLocation | null>;
}

const DeviceLocationContext = createContext<DeviceLocationValue | null>(null);

function readCache(): CachedLocation | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedLocation) : null;
  } catch {
    return null;
  }
}

function writeCache(loc: CachedLocation) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(loc));
  } catch {
    /* sem storage */
  }
}

async function readGps(): Promise<GeoLocation | null> {
  try {
    let perm = await Geolocation.checkPermissions();
    if (perm.coarseLocation !== 'granted' && perm.location !== 'granted') {
      perm = await Geolocation.requestPermissions({ permissions: ['coarseLocation'] });
    }
    if (perm.coarseLocation !== 'granted' && perm.location !== 'granted') return null;

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 15_000,
      maximumAge: 10 * 60_000,
    });
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const name = (await reverseGeocode(lat, lon)) ?? `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`;
    return { lat, lon, name };
  } catch {
    return null;
  }
}

export const DeviceLocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cached = useRef(readCache());
  const [device, setDevice] = useState<GeoLocation | null>(cached.current);
  const lastFix = useRef<number>(cached.current?.at ?? 0);
  const inFlight = useRef<Promise<GeoLocation | null> | null>(null);

  const locate = useCallback(async () => {
    if (inFlight.current) return inFlight.current;
    inFlight.current = (async () => {
      const loc = await readGps();
      if (loc) {
        lastFix.current = Date.now();
        writeCache({ ...loc, at: lastFix.current });
        setDevice(loc);
      }
      return loc;
    })();
    try {
      return await inFlight.current;
    } finally {
      inFlight.current = null;
    }
  }, []);

  // Ao abrir o app: lê o GPS e agenda a notificação
  useEffect(() => {
    (async () => {
      const loc = await locate();
      await refreshSkyNotification(loc ?? cached.current ?? DEFAULT_LOCATION);
    })();
  }, [locate]);

  // Ao voltar para o app: renova o GPS se estiver velho e reagenda as próximas 48h
  useEffect(() => {
    const sub = App.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) return;
      const loc = Date.now() - lastFix.current > STALE_MS ? await locate() : null;
      await refreshSkyNotification(loc ?? readCache() ?? DEFAULT_LOCATION);
    });
    return () => { sub.then(s => s.remove()); };
  }, [locate]);

  const value = useMemo(() => ({ device, locate }), [device, locate]);
  return <DeviceLocationContext.Provider value={value}>{children}</DeviceLocationContext.Provider>;
};

export function useDeviceLocation(): DeviceLocationValue {
  const ctx = useContext(DeviceLocationContext);
  if (!ctx) throw new Error('useDeviceLocation fora do DeviceLocationProvider');
  return ctx;
}
