import React from 'react';
import type { ZodiacSystem } from '../types/astro';

interface ZodiacToggleProps {
  value: ZodiacSystem;
  onChange: (system: ZodiacSystem) => void;
  disabled?: boolean;
}

const OPTIONS: { value: ZodiacSystem; label: string }[] = [
  { value: 'sidereal', label: 'Sideral' },
  { value: 'tropical', label: 'Tropical' },
];

const ZodiacToggle: React.FC<ZodiacToggleProps> = ({ value, onChange, disabled }) => (
  <div className="seg-toggle" role="group" aria-label="Sistema zodiacal">
    {OPTIONS.map(opt => (
      <button
        key={opt.value}
        className={value === opt.value ? 'active' : ''}
        aria-pressed={value === opt.value}
        onClick={() => onChange(opt.value)}
        disabled={disabled}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default ZodiacToggle;
