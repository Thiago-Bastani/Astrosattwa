import React from 'react';
import type { GeoLocation } from '../types/astro';
import LocationPicker from './LocationPicker';
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

function StepBtn({ label, title, onClick }: { label: string; title: string; onClick: () => void }) {
  return (
    <button className="step-btn" onClick={onClick} title={title} aria-label={title}>
      {label}
    </button>
  );
}

const BirthDataForm: React.FC<BirthDataFormProps> = ({ date, location, onDateChange, onLocationChange }) => {
  const shift = (ms: number) => onDateChange(new Date(date.getTime() + ms));

  const shiftDays = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    onDateChange(d);
  };

  const handleDateInput = (value: string) => {
    const parsed = parseDateInput(value);
    if (!parsed) return;
    const next = new Date(date);
    next.setFullYear(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    onDateChange(next);
  };

  const handleTimeInput = (value: string) => {
    if (!value) return;
    const [h, min] = value.split(':').map(Number);
    const next = new Date(date);
    next.setHours(h, min);
    if (!isNaN(next.getTime())) onDateChange(next);
  };

  return (
    <div className="dt-form">
      <div className="dt-row">
        <div className="stepper stepper-date">
          <StepBtn label="‹" title="Dia anterior" onClick={() => shiftDays(-1)} />
          <input
            type="date"
            className="stepper-input"
            value={toDateString(date)}
            onChange={e => handleDateInput(e.target.value)}
            aria-label="Data"
          />
          <StepBtn label="›" title="Próximo dia" onClick={() => shiftDays(1)} />
        </div>

        <div className="stepper stepper-time">
          <StepBtn label="«" title="−1 hora" onClick={() => shift(-3600000)} />
          <StepBtn label="‹" title="−1 minuto" onClick={() => shift(-60000)} />
          <input
            type="time"
            className="stepper-input"
            value={toTimeString(date)}
            onChange={e => handleTimeInput(e.target.value)}
            aria-label="Hora"
          />
          <StepBtn label="›" title="+1 minuto" onClick={() => shift(60000)} />
          <StepBtn label="»" title="+1 hora" onClick={() => shift(3600000)} />
        </div>
      </div>

      <div className="dt-row">
        <LocationPicker location={location} onChange={onLocationChange} />
        <button className="now-btn" onClick={() => onDateChange(new Date())}>
          Agora
        </button>
      </div>
    </div>
  );
};

export default BirthDataForm;
