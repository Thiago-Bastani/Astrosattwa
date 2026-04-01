import React, { useState, useRef, useCallback, useMemo } from 'react';
import { IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol, IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { chevronBack, chevronForward, searchOutline } from 'ionicons/icons';
import type { GeoLocation } from '../types/astro';
import { searchLocation } from '../services/geocodingService';
import type { NominatimResult } from '../types/astro';
import { getCurrentTattwa } from '../utils/tattwa';
import TattwaIndicator from './TattwaIndicator';
import './BirthDataForm.css';

interface BirthDataFormProps {
  date: Date;
  location: GeoLocation;
  onDateChange: (date: Date) => void;
  onLocationChange: (location: GeoLocation) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

function toDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeString(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

const BirthDataForm: React.FC<BirthDataFormProps> = ({ date, location, onDateChange, onLocationChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tattwa = useMemo(() => getCurrentTattwa(date, location), [date, location]);

  const adjustDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    onDateChange(d);
  };

  const adjustHour = (hours: number) => {
    const d = new Date(date);
    d.setHours(d.getHours() + hours);
    onDateChange(d);
  };

  const adjustMinute = (minutes: number) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() + minutes);
    onDateChange(d);
  };

  const handleDateInput = (value: string | undefined) => {
    if (!value) return;
    const parsedDate = parseDateInput(value);
    if (parsedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(parsedDate.getFullYear());
      newDate.setMonth(parsedDate.getMonth());
      newDate.setDate(parsedDate.getDate());
      onDateChange(newDate);
    }
  };

  const handleTimeInput = (value: string | undefined) => {
    if (!value) return;
    const [h, min] = value.split(':').map(Number);
    const next = new Date(date);
    next.setHours(h, min);
    if (!isNaN(next.getTime())) onDateChange(next);
  };

  const doSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    const results = await searchLocation(query);
    setSearchResults(results);
    setShowResults(results.length > 0);
    setIsSearching(false);
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 500);
  };

  const selectLocation = (result: NominatimResult) => {
    onLocationChange({
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon),
      name: result.display_name,
    });
    setSearchQuery('');
    setShowResults(false);
    setSearchResults([]);
  };

  return (
    <div className="birth-data-form">
      <IonGrid>
        {/* Data com setas +/- dia */}
        <IonRow className="ion-align-items-center">
          <IonCol size="auto">
            <IonButton fill="clear" size="small" className="arrow-btn" onClick={() => adjustDate(-1)}>
              <IonIcon icon={chevronBack} />
            </IonButton>
          </IonCol>
          <IonCol>
            <IonItem lines="none" className="form-item">
              <IonLabel position="stacked" color="warning">Data</IonLabel>
              <IonInput
                type="date"
                value={toDateString(date)}
                onIonChange={(e) => handleDateInput(e.detail.value ?? undefined)}
              />
            </IonItem>
          </IonCol>
          <IonCol size="auto">
            <IonButton fill="clear" size="small" className="arrow-btn" onClick={() => adjustDate(1)}>
              <IonIcon icon={chevronForward} />
            </IonButton>
          </IonCol>
        </IonRow>

        {/* Hora com setas +/- hora + Tattwa */}
        <IonRow className="ion-align-items-center">
          <IonCol size="auto">
            <IonButton fill="clear" size="small" className="arrow-btn" onClick={() => adjustHour(-1)}>
              <IonIcon icon={chevronBack} />
            </IonButton>
          </IonCol>
          <IonCol>
            <IonItem lines="none" className="form-item">
              <IonLabel position="stacked" color="warning">Hora</IonLabel>
              <IonInput
                type="time"
                value={toTimeString(date)}
                onIonChange={(e) => handleTimeInput(e.detail.value ?? undefined)}
              />
            </IonItem>
          </IonCol>
          <IonCol size="auto">
            <IonButton fill="clear" size="small" className="arrow-btn" onClick={() => adjustHour(1)}>
              <IonIcon icon={chevronForward} />
            </IonButton>
          </IonCol>
        </IonRow>

        {/* Setas de minuto */}
        <IonRow className="ion-justify-content-center minute-row">
          <IonButton fill="clear" size="small" className="arrow-btn" onClick={() => adjustMinute(-1)}>
            <IonIcon icon={chevronBack} />
            <span className="minute-label">1 min</span>
          </IonButton>
          <IonButton fill="clear" size="small" className="arrow-btn" onClick={() => adjustMinute(1)}>
            <span className="minute-label">1 min</span>
            <IonIcon icon={chevronForward} />
          </IonButton>
        </IonRow>

        {/* Tattwa abaixo dos controles de horário */}
        <IonRow className="ion-justify-content-center">
          <IonCol size="auto" className="tattwa-col">
            <TattwaIndicator tattwa={tattwa} />
          </IonCol>
        </IonRow>

        {/* Busca de localização */}
        <IonRow>
          <IonCol size="12">
            <IonItem lines="none" className="form-item">
              <IonLabel position="stacked" color="warning">
                <IonIcon icon={searchOutline} style={{ marginRight: 4, fontSize: '0.85rem' }} />
                Buscar Local
              </IonLabel>
              <IonInput
                type="text"
                placeholder="Digite uma cidade..."
                value={searchQuery}
                onIonInput={(e) => handleSearchInput((e.target as HTMLIonInputElement).value as string || '')}
              />
              {isSearching && <IonSpinner name="dots" style={{ position: 'absolute', right: 8, top: '50%' }} />}
            </IonItem>

            {/* Dropdown de resultados */}
            {showResults && (
              <div className="location-results">
                {searchResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="location-result-item"
                    onClick={() => selectLocation(result)}
                  >
                    {result.display_name}
                  </div>
                ))}
              </div>
            )}
          </IonCol>
        </IonRow>

        {/* Local selecionado (read-only) */}
        <IonRow>
          <IonCol size="12">
            <div className="selected-location">
              <span className="selected-location-name">{location.name}</span>
              <span className="selected-location-coords">
                {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
              </span>
            </div>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default BirthDataForm;
