import React from 'react';

/**
 * Símbolo tradicional de cada nakshatra, em traço simples (viewBox 100×100).
 * Cores explícitas (sem variáveis CSS) para funcionar igual na tela e no PDF.
 */

interface Props {
  /** 0 = Ashwini … 26 = Revati */
  index: number;
  color: string;
  /** Cor do medalhão de fundo */
  bg: string;
  ring: string;
  size?: number;
}

type Draw = (c: string) => React.ReactNode;

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

const bed = (c: string, head: boolean) => (
  <g>
    <rect x={18} y={46} width={64} height={10} rx={2} />
    <path d="M24 56 L24 76 M76 56 L76 76" />
    {head
      ? <path d="M18 56 L18 28 Q18 24 22 24 L30 24 Q34 24 34 28 L34 46" />
      : <path d="M24 76 L20 82 M76 76 L80 82" />}
    <ellipse cx={head ? 44 : 30} cy={41} rx={8} ry={4} fill={c} fillOpacity={0.25} />
  </g>
);

const SYMBOLS: Draw[] = [
  // 1 Ashwini · cabeça de cavalo
  c => (
    <g>
      <path d="M40 84 L42 62 C34 54 30 44 34 34 L30 22 L40 28 C46 22 56 22 62 26 L76 42 C80 47 77 53 71 52 L61 49 L58 62 L62 84" />
      <path d="M44 28 C40 36 40 46 46 56" opacity={0.6} />
      <circle cx={54} cy={35} r={2.2} fill={c} />
    </g>
  ),
  // 2 Bharani · yoni
  c => (
    <g>
      <path d="M50 18 C74 38 74 62 50 82 C26 62 26 38 50 18 Z" />
      <path d="M50 36 C58 44 58 56 50 64 C42 56 42 44 50 36 Z" fill={c} fillOpacity={0.3} />
    </g>
  ),
  // 3 Krittika · lâmina
  c => (
    <g>
      <path d="M36 66 L72 20 C80 28 76 40 66 50 L44 72 Z" fill={c} fillOpacity={0.15} />
      <path d="M36 66 L44 72" />
      <path d="M40 69 L24 85" strokeWidth={6} />
    </g>
  ),
  // 4 Rohini · carroça
  () => (
    <g>
      <rect x={20} y={36} width={54} height={22} rx={2} />
      <path d="M74 46 L92 42" />
      {[32, 62].map(x => (
        <g key={x}>
          <circle cx={x} cy={68} r={11} />
          <path d={`M${x - 11} 68 L${x + 11} 68 M${x} 57 L${x} 79 M${x - 8} 60 L${x + 8} 76 M${x + 8} 60 L${x - 8} 76`} strokeWidth={1.5} />
        </g>
      ))}
    </g>
  ),
  // 5 Mrigashira · cabeça de cervo
  c => (
    <g>
      <path d="M40 52 Q50 88 60 52 Q50 46 40 52 Z" />
      <path d="M42 50 C36 38 30 32 26 18 M33 34 L20 30 M37 42 L26 44" />
      <path d="M58 50 C64 38 70 32 74 18 M67 34 L80 30 M63 42 L74 44" />
      <path d="M40 54 L30 50 M60 54 L70 50" />
      <circle cx={45} cy={60} r={1.8} fill={c} /><circle cx={55} cy={60} r={1.8} fill={c} />
    </g>
  ),
  // 6 Ardra · lágrima
  c => (
    <g>
      <path d="M50 16 C50 16 74 48 74 62 A24 24 0 0 1 26 62 C26 48 50 16 50 16 Z" fill={c} fillOpacity={0.15} />
      <path d="M38 62 A12 12 0 0 0 46 74" opacity={0.7} />
    </g>
  ),
  // 7 Punarvasu · aljava
  c => (
    <g>
      <path d="M36 44 L64 44 L60 86 L40 86 Z" fill={c} fillOpacity={0.15} />
      {[42, 50, 58].map((x, i) => (
        <g key={x}>
          <path d={`M${x} 44 L${x + (i - 1) * 4} 14`} />
          <path d={`M${x + (i - 1) * 4 - 4} 20 L${x + (i - 1) * 4} 14 L${x + (i - 1) * 4 + 4} 20`} />
        </g>
      ))}
    </g>
  ),
  // 8 Pushya · flor
  c => (
    <g>
      {range(8).map(i => (
        <ellipse key={i} cx={50} cy={30} rx={7} ry={14} transform={`rotate(${i * 45} 50 50)`} fill={c} fillOpacity={0.12} />
      ))}
      <circle cx={50} cy={50} r={8} fill={c} fillOpacity={0.5} />
    </g>
  ),
  // 9 Ashlesha · serpente enrolada
  c => (
    <g>
      <path d="M50 52 A4 4 0 1 1 54 48 A9 9 0 1 1 42 56 A14 14 0 1 1 64 44 A20 20 0 1 1 32 64 L22 74" />
      <circle cx={20} cy={76} r={4} fill={c} />
      <path d="M17 79 L12 84 M17 79 L14 86" strokeWidth={1.5} />
    </g>
  ),
  // 10 Magha · trono
  c => (
    <g>
      <path d="M30 86 L30 50 L70 50 L70 86 M26 50 L74 50 M30 66 L70 66" />
      <path d="M34 50 L34 22 L66 22 L66 50" />
      <path d="M34 22 L40 12 L50 20 L60 12 L66 22" fill={c} fillOpacity={0.3} />
    </g>
  ),
  // 11 Purva Phalguni · pés da cama
  c => bed(c, false),
  // 12 Uttara Phalguni · cabeceira da cama
  c => bed(c, true),
  // 13 Hasta · mão
  c => (
    <g>
      <path d="M34 54 L34 80 Q34 88 44 88 L58 88 Q68 88 68 78 L68 50" />
      {[38, 47, 56, 65].map((x, i) => (
        <rect key={x} x={x - 4} y={[28, 20, 22, 30][i]} width={8} height={[30, 38, 36, 26][i]} rx={4} />
      ))}
      <path d="M34 60 C26 56 22 48 24 42 C30 44 34 50 36 56" />
      <circle cx={51} cy={70} r={4} fill={c} fillOpacity={0.4} />
    </g>
  ),
  // 14 Chitra · pérola, joia brilhante
  c => (
    <g>
      <circle cx={50} cy={50} r={15} fill={c} fillOpacity={0.2} />
      <circle cx={45} cy={45} r={4} fill={c} fillOpacity={0.6} stroke="none" />
      {range(8).map(i => (
        <path key={i} d="M50 26 L50 16" transform={`rotate(${i * 45} 50 50)`} />
      ))}
    </g>
  ),
  // 15 Swati · broto ao vento
  c => (
    <g>
      <path d="M50 84 C50 70 48 58 52 44" />
      <path d="M50 64 C36 62 28 52 30 40 C42 42 50 52 50 64 Z" fill={c} fillOpacity={0.2} />
      <path d="M52 52 C64 50 72 40 72 28 C60 30 52 40 52 52 Z" fill={c} fillOpacity={0.2} />
      <path d="M30 84 L70 84 M14 30 Q22 26 28 30 M12 40 Q20 36 26 40" opacity={0.6} />
    </g>
  ),
  // 16 Vishakha · arco triunfal
  c => (
    <g>
      <path d="M20 86 L20 48 A30 30 0 0 1 80 48 L80 86" />
      <path d="M34 86 L34 50 A16 16 0 0 1 66 50 L66 86" />
      <path d="M14 86 L86 86" />
      <circle cx={50} cy={12} r={4} fill={c} />
    </g>
  ),
  // 17 Anuradha · lótus
  c => (
    <g>
      <path d="M50 26 C60 42 60 60 50 72 C40 60 40 42 50 26 Z" fill={c} fillOpacity={0.2} />
      <path d="M48 72 C34 68 24 56 24 40 C36 44 46 56 48 72 Z" />
      <path d="M52 72 C66 68 76 56 76 40 C64 44 54 56 52 72 Z" />
      <path d="M18 80 Q34 74 50 80 T82 80" opacity={0.7} />
    </g>
  ),
  // 18 Jyeshtha · brinco
  c => (
    <g>
      <path d="M50 12 C58 12 58 24 50 26" />
      <circle cx={50} cy={46} r={18} />
      <circle cx={50} cy={46} r={9} fill={c} fillOpacity={0.3} />
      <path d="M50 64 L42 76 L50 88 L58 76 Z" fill={c} fillOpacity={0.4} />
    </g>
  ),
  // 19 Mula · raízes atadas
  c => (
    <g>
      <path d="M44 14 L44 46 M50 12 L50 46 M56 14 L56 46" />
      <rect x={38} y={40} width={24} height={8} rx={2} fill={c} fillOpacity={0.4} />
      <path d="M44 48 C40 62 30 66 22 82 M50 48 L50 86 M56 48 C60 62 70 66 78 82 M46 56 C38 70 36 78 36 88 M54 56 C62 70 64 78 64 88" />
    </g>
  ),
  // 20 Purva Ashadha · leque
  c => (
    <g>
      <path d="M50 76 L16 40 A44 44 0 0 1 84 40 Z" fill={c} fillOpacity={0.12} />
      {[-36, -18, 0, 18, 36].map(a => (
        <path key={a} d="M50 76 L50 26" transform={`rotate(${a} 50 76)`} strokeWidth={1.5} />
      ))}
      <path d="M50 76 L50 90" strokeWidth={5} />
    </g>
  ),
  // 21 Uttara Ashadha · presa de elefante
  c => (
    <g>
      <path d="M28 86 C28 52 48 24 80 16 C62 34 50 56 46 86 Z" fill={c} fillOpacity={0.2} />
      <path d="M24 86 L50 86" />
    </g>
  ),
  // 22 Shravana · três pegadas
  c => (
    <g>
      {[[30, 72], [50, 50], [70, 28]].map(([x, y]) => (
        <g key={x}>
          <ellipse cx={x} cy={y + 4} rx={6} ry={10} fill={c} fillOpacity={0.3} />
          {[-5, -1.5, 2, 5.5].map(dx => <circle key={dx} cx={x + dx} cy={y - 9} r={1.6} fill={c} stroke="none" />)}
        </g>
      ))}
    </g>
  ),
  // 23 Dhanishtha · tambor
  c => (
    <g>
      <path d="M24 32 C34 26 66 26 76 32 L76 68 C66 74 34 74 24 68 Z" fill={c} fillOpacity={0.12} />
      <ellipse cx={24} cy={50} rx={6} ry={18} />
      <ellipse cx={76} cy={50} rx={6} ry={18} />
      <path d="M30 34 L40 66 L50 34 L60 66 L70 34" strokeWidth={1.5} />
    </g>
  ),
  // 24 Shatabhisha · círculo vazio (cem curadores)
  c => (
    <g>
      <circle cx={50} cy={50} r={22} />
      {range(24).map(i => {
        const a = (i * 15 * Math.PI) / 180;
        return <circle key={i} cx={50 + 34 * Math.cos(a)} cy={50 + 34 * Math.sin(a)} r={1.8} fill={c} stroke="none" />;
      })}
    </g>
  ),
  // 25 Purva Bhadrapada · pés do esquife
  c => (
    <g>
      <rect x={18} y={40} width={64} height={14} rx={2} fill={c} fillOpacity={0.12} />
      <path d="M26 40 L34 54 M38 40 L46 54 M50 40 L58 54 M62 40 L70 54 M74 40 L80 50" strokeWidth={1.2} />
      <path d="M24 54 L22 84 M76 54 L78 84" strokeWidth={4} />
      <path d="M50 22 L50 32 M42 26 L58 26" opacity={0.6} />
    </g>
  ),
  // 26 Uttara Bhadrapada · serpente das profundezas
  c => (
    <g>
      <path d="M14 50 C22 34 32 34 40 50 S58 66 66 50 S78 38 84 42" strokeWidth={4} />
      <circle cx={86} cy={42} r={4} fill={c} />
      <path d="M14 72 Q22 66 30 72 T46 72 T62 72 T78 72 T94 72 M22 84 Q30 78 38 84 T54 84 T70 84" opacity={0.6} strokeWidth={1.5} />
    </g>
  ),
  // 27 Revati · peixe
  c => (
    <g>
      <path d="M16 50 C30 28 60 28 74 50 C60 72 30 72 16 50 Z" fill={c} fillOpacity={0.15} />
      <path d="M74 50 L90 36 L88 50 L90 64 Z" />
      <circle cx={30} cy={46} r={2.4} fill={c} />
      <path d="M44 38 C50 46 50 54 44 62" opacity={0.6} />
    </g>
  ),
];

const NakshatraSymbol: React.FC<Props> = ({ index, color, bg, ring, size = 120 }) => {
  const draw = SYMBOLS[((index % 27) + 27) % 27];
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <circle cx={60} cy={60} r={57} fill={bg} stroke={ring} strokeWidth={1.5} />
      <circle cx={60} cy={60} r={51} fill="none" stroke={ring} strokeWidth={0.6} strokeOpacity={0.6} />
      <g
        transform="translate(14 14) scale(0.92)"
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {draw(color)}
      </g>
    </svg>
  );
};

export default NakshatraSymbol;
