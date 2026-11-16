import React, { useEffect, useRef, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { closeOutline, locationOutline } from 'ionicons/icons';
import type { GeoLocation, NominatimResult } from '../types/astro';
import { searchLocation } from '../services/geocodingService';
import './LocationPicker.css';

interface LocationPickerProps {
  location: GeoLocation | null;
  onChange: (location: GeoLocation) => void;
  placeholder?: string;
}

/** Nome curto: "Belo Horizonte, Minas Gerais, Brasil" → "Belo Horizonte, Brasil" */
function shortName(name: string): string {
  const parts = name.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length <= 2) return parts.join(', ');
  return `${parts[0]}, ${parts[parts.length - 1]}`;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ location, onChange, placeholder = 'Escolher local' }) => {
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  function handleInput(value: string) {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setResults(await searchLocation(value));
      setSearching(false);
    }, 450);
  }

  function close() {
    setEditing(false);
    setQuery('');
    setResults([]);
  }

  function select(r: NominatimResult) {
    onChange({ lat: parseFloat(r.lat), lon: parseFloat(r.lon), name: r.display_name });
    close();
  }

  if (!editing) {
    return (
      <button className="loc-pill" onClick={() => setEditing(true)} title={location?.name}>
        <IonIcon icon={locationOutline} className="loc-pill-icon" />
        {location ? (
          <>
            <span className="loc-pill-name">{shortName(location.name)}</span>
            <span className="loc-pill-coords">
              {location.lat.toFixed(2)}°, {location.lon.toFixed(2)}°
            </span>
          </>
        ) : (
          <span className="loc-pill-name loc-pill-empty">{placeholder}</span>
        )}
      </button>
    );
  }

  return (
    <div className="loc-edit">
      <div className="loc-edit-row">
        <input
          ref={inputRef}
          className="input"
          placeholder="Digite uma cidade..."
          value={query}
          onChange={e => handleInput(e.target.value)}
          onKeyDown={e => e.key === 'Escape' && close()}
        />
        {searching && <IonSpinner name="dots" className="loc-spinner" />}
        <button className="loc-cancel" onClick={close} aria-label="Cancelar">
          <IonIcon icon={closeOutline} />
        </button>
      </div>
      {results.length > 0 && (
        <div className="loc-results">
          {results.map((r, i) => (
            <button key={i} className="loc-result" onClick={() => select(r)}>
              {r.display_name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
