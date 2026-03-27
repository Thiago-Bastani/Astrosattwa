import React from 'react';
import { IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol, IonButton, IonIcon } from '@ionic/react';
import { chevronBack, chevronForward } from 'ionicons/icons';
import type { GeoLocation } from '../types/astro';
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
  
  // Formato ISO (yyyy-mm-dd)
  const [y, m, d] = value.split('-').map(Number);
  if (y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
    const date = new Date(y, m - 1, d);
    if (!isNaN(date.getTime())) return date;
  }
  
  return null;
}

const BirthDataForm: React.FC<BirthDataFormProps> = ({ date, location, onDateChange, onLocationChange }) => {
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
      // Preserva hora e minuto da data atual
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

  const handleLatChange = (value: string | undefined) => {
    if (!value) return;
    const lat = parseFloat(value);
    if (!isNaN(lat) && lat >= -90 && lat <= 90) onLocationChange({ ...location, lat });
  };

  const handleLonChange = (value: string | undefined) => {
    if (!value) return;
    const lon = parseFloat(value);
    if (!isNaN(lon) && lon >= -180 && lon <= 180) onLocationChange({ ...location, lon });
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

        {/* Hora com setas +/- hora e +/- minuto */}
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

        {/* Local */}
        <IonRow>
          <IonCol size="12">
            <IonItem lines="none" className="form-item">
              <IonLabel position="stacked" color="warning">Local</IonLabel>
              <IonInput
                type="text"
                value={location.name}
                onIonChange={(e) => {
                  if (e.detail.value !== undefined) onLocationChange({ ...location, name: e.detail.value || '' });
                }}
              />
            </IonItem>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="6">
            <IonItem lines="none" className="form-item">
              <IonLabel position="stacked" color="warning">Lat</IonLabel>
              <IonInput type="number" value={location.lat.toString()} step="0.0001"
                onIonChange={(e) => handleLatChange(e.detail.value ?? undefined)} />
            </IonItem>
          </IonCol>
          <IonCol size="6">
            <IonItem lines="none" className="form-item">
              <IonLabel position="stacked" color="warning">Lon</IonLabel>
              <IonInput type="number" value={location.lon.toString()} step="0.0001"
                onIonChange={(e) => handleLonChange(e.detail.value ?? undefined)} />
            </IonItem>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default BirthDataForm;
