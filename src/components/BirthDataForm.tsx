import React from 'react';
import { IonItem, IonLabel, IonInput, IonGrid, IonRow, IonCol } from '@ionic/react';
import type { GeoLocation } from '../types/astro';
import './BirthDataForm.css';

interface BirthDataFormProps {
  date: Date;
  location: GeoLocation;
  onDateChange: (date: Date) => void;
  onLocationChange: (location: GeoLocation) => void;
}

function toLocalISOString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const BirthDataForm: React.FC<BirthDataFormProps> = ({ date, location, onDateChange, onLocationChange }) => {
  const handleDateTimeChange = (value: string | undefined) => {
    if (!value) return;
    const newDate = new Date(value);
    if (!isNaN(newDate.getTime())) {
      onDateChange(newDate);
    }
  };

  const handleLatChange = (value: string | undefined) => {
    if (!value) return;
    const lat = parseFloat(value);
    if (!isNaN(lat) && lat >= -90 && lat <= 90) {
      onLocationChange({ ...location, lat });
    }
  };

  const handleLonChange = (value: string | undefined) => {
    if (!value) return;
    const lon = parseFloat(value);
    if (!isNaN(lon) && lon >= -180 && lon <= 180) {
      onLocationChange({ ...location, lon });
    }
  };

  const handleNameChange = (value: string | undefined) => {
    if (value !== undefined) {
      onLocationChange({ ...location, name: value });
    }
  };

  return (
    <div className="birth-data-form">
      <IonGrid>
        <IonRow>
          <IonCol size="12">
            <IonItem lines="none" className="form-item">
              <IonLabel position="stacked" color="warning">Data e Hora</IonLabel>
              <IonInput
                type="datetime-local"
                value={toLocalISOString(date)}
                onIonChange={(e) => handleDateTimeChange(e.detail.value ?? undefined)}
              />
            </IonItem>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="12">
            <IonItem lines="none" className="form-item">
              <IonLabel position="stacked" color="warning">Local</IonLabel>
              <IonInput
                type="text"
                value={location.name}
                onIonChange={(e) => handleNameChange(e.detail.value ?? undefined)}
              />
            </IonItem>
          </IonCol>
        </IonRow>
        <IonRow>
          <IonCol size="6">
            <IonItem lines="none" className="form-item">
              <IonLabel position="stacked" color="warning">Latitude</IonLabel>
              <IonInput
                type="number"
                value={location.lat.toString()}
                step="0.0001"
                onIonChange={(e) => handleLatChange(e.detail.value ?? undefined)}
              />
            </IonItem>
          </IonCol>
          <IonCol size="6">
            <IonItem lines="none" className="form-item">
              <IonLabel position="stacked" color="warning">Longitude</IonLabel>
              <IonInput
                type="number"
                value={location.lon.toString()}
                step="0.0001"
                onIonChange={(e) => handleLonChange(e.detail.value ?? undefined)}
              />
            </IonItem>
          </IonCol>
        </IonRow>
      </IonGrid>
    </div>
  );
};

export default BirthDataForm;
