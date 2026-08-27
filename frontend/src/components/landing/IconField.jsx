import React from 'react';
import TicketMark from './TicketMark';

// Posiciones fijas (no aleatorias) para que la marca de agua se vea igual en
// cada carga, en vez de reordenarse cada vez.
const MARKS = [
  { top: '6%', left: '4%', size: 46, rot: -18, op: 0.05 },
  { top: '14%', left: '88%', size: 60, rot: 12, op: 0.045 },
  { top: '58%', left: '93%', size: 40, rot: -8, op: 0.05 },
  { top: '80%', left: '10%', size: 52, rot: 22, op: 0.045 },
  { top: '40%', left: '1%', size: 34, rot: -30, op: 0.05 },
  { top: '3%', left: '46%', size: 38, rot: 8, op: 0.04 },
  { top: '88%', left: '58%', size: 44, rot: -14, op: 0.045 },
];

/**
 * Marca de agua decorativa del ícono de Ticket100, dispersa detrás del hero.
 * Puramente atmosférico (aria-hidden) — no compite con el contenido.
 */
export default function IconField({ className = '' }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {MARKS.map((m, i) => (
        <TicketMark
          key={i}
          className="absolute text-raffle-ink dark:text-raffle-paper"
          style={{ top: m.top, left: m.left, width: m.size, opacity: m.op, transform: `rotate(${m.rot}deg)` }}
        />
      ))}
    </div>
  );
}
