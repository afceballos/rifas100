import React, { useEffect, useState } from 'react';
import SlotDigit from './SlotDigit';

function getRemaining(target) {
  const diff = Math.max(0, target.getTime() - Date.now());
  const totalSeconds = Math.floor(diff / 1000);
  return {
    d: Math.floor(totalSeconds / 86400),
    h: Math.floor((totalSeconds % 86400) / 3600),
    m: Math.floor((totalSeconds % 3600) / 60),
    s: totalSeconds % 60,
  };
}

function Unit({ value, label }) {
  const tens = Math.floor(value / 10) % 10;
  const ones = value % 10;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex gap-0.5 rounded-xl bg-raffle-ink/90 px-2.5 py-2 text-3xl sm:text-4xl font-mono font-bold text-raffle-goldLight shadow-plum ring-1 ring-raffle-gold/20">
        <SlotDigit value={tens} />
        <SlotDigit value={ones} />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-raffle-ink/60 dark:text-raffle-paper/50">
        {label}
      </span>
    </div>
  );
}

/**
 * Cuenta regresiva de ejemplo para el mockup del hero (no representa una
 * rifa real). Cada dígito usa SlotDigit para el efecto de rodillo; el valor
 * legible se expone aparte para lectores de pantalla.
 */
export default function DrawCountdown({ target }) {
  const [time, setTime] = useState(() => getRemaining(target));

  useEffect(() => {
    const id = setInterval(() => setTime(getRemaining(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div>
      <p className="sr-only" aria-live="polite">
        Cierra en {time.d} días, {time.h} horas, {time.m} minutos y {time.s} segundos.
      </p>
      <div className="flex items-start gap-3 sm:gap-4">
        <Unit value={time.d} label="Días" />
        <Unit value={time.h} label="Hrs" />
        <Unit value={time.m} label="Min" />
        <Unit value={time.s} label="Seg" />
      </div>
    </div>
  );
}
