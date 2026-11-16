import React, { useLayoutEffect, useRef } from 'react';
import { IonButtons, IonHeader, IonTitle, IonToolbar } from '@ionic/react';
import { useDayTheme } from '../theme/DayTheme';
import { WEEKDAY_NAMES_PT } from '../utils/planetary';
import { PLANET_GLYPHS } from '../utils/zodiac';
import { PLANET_NAMES_PT } from '../utils/astroLabels';

interface AppHeaderProps {
  title: string;
  end?: React.ReactNode;
  /** Mostra o glifo do dia planetário (false em telas sem paleta do dia). */
  showDay?: boolean;
}

/**
 * Centraliza verticalmente o DESENHO do glifo (não a caixa da fonte): fontes de
 * símbolos têm métricas irregulares (☿ e ♂ ficam baixos), e mudam por plataforma.
 */
function useInkCentered(text: string) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;

    const measure = (): boolean => {
      try {
        const cs = getComputedStyle(el);
        const size = parseFloat(cs.fontSize);
        const ctx = document.createElement('canvas').getContext('2d');
        if (!ctx || !size || !cs.fontFamily) return false; // ainda não montado
        ctx.font = `${cs.fontSize} ${cs.fontFamily}`;
        const m = ctx.measureText(text);
        const halfLeading = (size - (m.fontBoundingBoxAscent + m.fontBoundingBoxDescent)) / 2;
        const inkCenter = halfLeading + m.fontBoundingBoxAscent
          + (m.actualBoundingBoxDescent - m.actualBoundingBoxAscent) / 2;
        const dy = inkCenter - size / 2;
        if (!Number.isFinite(dy) || Math.abs(dy) >= size / 2) return false;
        el.style.transform = `translateY(${-dy}px)`;
        return true;
      } catch {
        return false; // sem canvas: fica centralizado pela caixa
      }
    };

    // Mede agora; se o Ionic ainda não montou a barra, tenta no próximo frame
    // e de novo quando as fontes terminarem de carregar.
    el.style.transform = '';
    if (!measure()) requestAnimationFrame(() => { if (!cancelled) measure(); });
    document.fonts?.ready.then(() => { if (!cancelled) measure(); });
    return () => { cancelled = true; };
  }, [text]);
  return ref;
}

/** Barra do topo: glifo do dia planetário (indicador) + título + ações. */
const AppHeader: React.FC<AppHeaderProps> = ({ title, end, showDay = true }) => {
  const { palette } = useDayTheme();
  const glyph = PLANET_GLYPHS[palette.planet];
  const glyphRef = useInkCentered(glyph);
  const label = `Dia de ${WEEKDAY_NAMES_PT[palette.weekday]} (${PLANET_NAMES_PT[palette.planet]})`;

  return (
    <IonHeader>
      <IonToolbar>
        {showDay && (
          <IonButtons slot="start">
            <span className="day-badge" role="img" aria-label={label} title={label}>
              <span className="day-badge-glyph" ref={glyphRef}>{glyph}</span>
            </span>
          </IonButtons>
        )}
        <IonTitle className={`app-title${showDay ? '' : ' app-title-solo'}`}>{title}</IonTitle>
        {end && <IonButtons slot="end">{end}</IonButtons>}
      </IonToolbar>
    </IonHeader>
  );
};

export default AppHeader;
