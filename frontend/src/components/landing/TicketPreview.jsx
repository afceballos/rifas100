import React, { useMemo, useState } from 'react';
import { CircleCheck, Clock3 } from 'lucide-react';
import SlotDigit from './SlotDigit';
import DrawCountdown from './DrawCountdown';

const NUMBERS = [
  { n: '047', status: 'available' },
  { n: '128', status: 'available' },
  { n: '233', status: 'available' },
  { n: '356', status: 'reserved' },
  { n: '419', status: 'sold' },
  { n: '582', status: 'available' },
];

const STATUS_STYLE = {
  available: 'bg-raffle-paper/90 text-raffle-ink ring-1 ring-raffle-ink/10 hover:ring-raffle-gold/60',
  reserved: 'bg-raffle-plumLight/70 text-raffle-paper ring-1 ring-raffle-gold/30',
  sold: 'bg-gold-foil text-raffle-ink ring-1 ring-raffle-goldDark/40',
};

function NumberCell({ n, status }) {
  const [shuffle, setShuffle] = useState(0);
  const digits = n.split('').map(Number);

  return (
    <button
      type="button"
      onMouseEnter={() => setShuffle((s) => s + 1)}
      onFocus={() => setShuffle((s) => s + 1)}
      className={`group flex items-center justify-center gap-0.5 rounded-lg px-2 py-2.5 font-mono text-base sm:text-lg font-bold transition-transform duration-200 hover:-translate-y-0.5 ${STATUS_STYLE[status]}`}
      aria-label={`Número ${n}, ${status === 'available' ? 'disponible' : status === 'reserved' ? 'reservado' : 'vendido'}`}
    >
      {digits.map((d, i) => (
        <SlotDigit key={i} value={d} spinOnMount shuffleTrigger={shuffle} />
      ))}
      {status === 'sold' && <CircleCheck size={14} className="ml-0.5" aria-hidden="true" />}
    </button>
  );
}

/**
 * Mockup interactivo del producto real (grilla de números + contador) usado
 * como pieza central del hero. Los datos son de ejemplo, marcados como tal.
 */
export default function TicketPreview({ className = '' }) {
  const target = useMemo(() => new Date(Date.now() + (4 * 86400 + 7 * 3600 + 22 * 60) * 1000), []);

  return (
    <div className={`relative rounded-[28px] bg-gold-foil p-[1.5px] shadow-gold ${className}`}>
      <div className="rounded-[26px] bg-raffle-ink px-5 pt-5 pb-6 sm:px-7 sm:pt-7 sm:pb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block rounded-full bg-raffle-gold/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-raffle-goldLight ring-1 ring-raffle-gold/30">
              Ejemplo de rifa
            </span>
            <p className="mt-2.5 font-display text-xl sm:text-2xl font-semibold text-raffle-paper">
              Moto 0km — 3 cifras
            </p>
            <p className="text-sm text-raffle-paper/60">1,000 números · $3 c/u</p>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-raffle-goldLight/80 text-xs font-semibold">
            <Clock3 size={14} /> Cierra pronto
          </div>
        </div>

        <div className="ticket-perforation my-5 h-px text-raffle-paper/15" />

        <DrawCountdown target={target} />

        <p className="mt-6 mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-raffle-paper/45">
          Vista previa de números
        </p>
        <div className="grid grid-cols-3 gap-2">
          {NUMBERS.map((item) => (
            <NumberCell key={item.n} n={item.n} status={item.status} />
          ))}
        </div>
      </div>
    </div>
  );
}
